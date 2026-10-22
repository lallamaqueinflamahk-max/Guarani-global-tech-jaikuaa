-- Atomic validation publication with a 15-minute, actor-bound undo window.
-- The word snapshot prevents undo from overwriting edits made after publication.

alter table public.corpus_words
  add column if not exists validated_by uuid null references public.profiles(id) on delete set null,
  add column if not exists validated_at timestamptz null,
  add column if not exists category text null;

alter table public.content_proposals
  add column if not exists validation_undo_until timestamptz null;

create table if not exists public.validation_undo_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  proposal_id uuid null references public.content_proposals(id) on delete cascade,
  word_id uuid not null references public.corpus_words(id) on delete cascade,
  word_snapshot_before jsonb not null,
  word_snapshot_after jsonb not null,
  created_at timestamptz not null default now(),
  undo_until timestamptz not null,
  undone_at timestamptz null
);

create index if not exists validation_undo_actor_window_idx
  on public.validation_undo_actions(actor_id, undo_until desc)
  where undone_at is null;

alter table public.validation_undo_actions enable row level security;
revoke all on public.validation_undo_actions from anon, authenticated;
grant all on public.validation_undo_actions to service_role;

create or replace function public.publish_content_proposal_with_undo(
  p_proposal_id uuid,
  p_actor_id uuid,
  p_audio_slug text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  proposal public.content_proposals%rowtype;
  word public.corpus_words%rowtype;
  word_before jsonb;
  undo_id uuid;
  expires_at timestamptz := now() + interval '15 minutes';
  audio_warning boolean := false;
begin
  if not (public.has_role(p_actor_id, 'admin'::public.app_role)
       or public.has_role(p_actor_id, 'editor'::public.app_role)) then
    raise exception 'Forbidden';
  end if;

  select * into proposal
    from public.content_proposals
    where id = p_proposal_id
    for update;
  if not found then raise exception 'Proposal not found'; end if;
  if proposal.status <> 'revisada' then raise exception 'Proposal is not awaiting validation'; end if;
  if proposal.proposed_by = p_actor_id or proposal.reviewed_by = p_actor_id then
    raise exception 'A third person must validate this proposal';
  end if;

  if proposal.kind = 'nueva' then
    if proposal.published_word_id is not null then
      select * into word from public.corpus_words where id = proposal.published_word_id for update;
      if not found or word.status <> 'draft' or word.gn <> proposal.gn then
        raise exception 'The previous draft is no longer available for this proposal';
      end if;
      word_before := to_jsonb(word);
      update public.corpus_words
        set es = proposal.es,
            notes = proposal.notes,
            status = 'published',
            validated_by = p_actor_id,
            validated_at = now()
        where id = word.id
        returning * into word;
    else
      if exists (select 1 from public.corpus_words where gn = proposal.gn) then
        raise exception 'This word already exists in the corpus';
      end if;
      word_before := jsonb_build_object('__created_by_validation', true);
      insert into public.corpus_words (gn, es, notes, audio_slug, has_audio, status, validated_by, validated_at)
        values (proposal.gn, proposal.es, proposal.notes, p_audio_slug, false, 'published', p_actor_id, now())
        returning * into word;
    end if;
  else
    select * into word from public.corpus_words where id = proposal.target_word_id for update;
    if not found then raise exception 'The word to correct no longer exists'; end if;
    word_before := to_jsonb(word);
    audio_warning := word.gn is distinct from proposal.gn;
    update public.corpus_words
      set gn = proposal.gn,
          es = proposal.es,
          notes = proposal.notes,
          audio_slug = case when audio_warning then p_audio_slug else word.audio_slug end,
          has_audio = case when audio_warning then false else word.has_audio end,
          status = 'published',
          validated_by = p_actor_id,
          validated_at = now()
      where id = word.id
      returning * into word;
  end if;

  insert into public.validation_undo_actions (
    actor_id, proposal_id, word_id, word_snapshot_before, word_snapshot_after, undo_until
  ) values (
    p_actor_id, proposal.id, word.id, word_before, to_jsonb(word), expires_at
  ) returning id into undo_id;

  update public.content_proposals
    set status = 'validada',
        validated_by = p_actor_id,
        validated_at = now(),
        validation_note = nullif(trim(coalesce(p_note, '')), ''),
        published_word_id = word.id,
        validation_undo_until = expires_at,
        history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'paso', 'validada', 'por', p_actor_id, 'en', now(),
          'nota', nullif(trim(coalesce(p_note, '')), '')
        )),
        updated_at = now()
    where id = proposal.id;

  return jsonb_build_object(
    'ok', true,
    'audioWarning', audio_warning,
    'undoId', undo_id,
    'undoUntil', expires_at
  );
end;
$$;

create or replace function public.publish_corpus_word_with_undo(
  p_word_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  word public.corpus_words%rowtype;
  word_before jsonb;
  undo_id uuid;
  expires_at timestamptz := now() + interval '15 minutes';
begin
  if not (public.has_role(p_actor_id, 'admin'::public.app_role)
       or public.has_role(p_actor_id, 'editor'::public.app_role)) then
    raise exception 'Forbidden';
  end if;

  select * into word from public.corpus_words where id = p_word_id for update;
  if not found or word.status <> 'draft' then raise exception 'Word is not awaiting publication'; end if;
  word_before := to_jsonb(word);
  update public.corpus_words
    set status = 'published', validated_by = p_actor_id, validated_at = now()
    where id = word.id
    returning * into word;
  insert into public.validation_undo_actions (
    actor_id, word_id, word_snapshot_before, word_snapshot_after, undo_until
  ) values (p_actor_id, word.id, word_before, to_jsonb(word), expires_at)
  returning id into undo_id;

  return jsonb_build_object('ok', true, 'undoId', undo_id, 'undoUntil', expires_at);
end;
$$;

create or replace function public.undo_validation_action(
  p_action_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  action public.validation_undo_actions%rowtype;
  proposal public.content_proposals%rowtype;
  word public.corpus_words%rowtype;
  previous_word public.corpus_words%rowtype;
  undo_time timestamptz := now();
begin
  if not (public.has_role(p_actor_id, 'admin'::public.app_role)
       or public.has_role(p_actor_id, 'editor'::public.app_role)) then
    raise exception 'Forbidden';
  end if;

  select * into action
    from public.validation_undo_actions
    where id = p_action_id
    for update;
  if not found or action.actor_id <> p_actor_id then raise exception 'Undo action not found'; end if;
  if action.undone_at is not null then raise exception 'Undo action already used'; end if;
  if undo_time > action.undo_until then raise exception 'Undo window expired'; end if;

  select * into word from public.corpus_words where id = action.word_id for update;
  if not found or to_jsonb(word) is distinct from action.word_snapshot_after then
    raise exception 'The word changed after publication; refusing to overwrite newer data';
  end if;

  if action.word_snapshot_before ->> '__created_by_validation' = 'true' then
    update public.corpus_words
      set status = 'draft', validated_by = null, validated_at = null
      where id = word.id;
  else
    select * into previous_word
      from jsonb_populate_record(null::public.corpus_words, action.word_snapshot_before);
    update public.corpus_words
      set gn = previous_word.gn,
          es = previous_word.es,
          audio_slug = previous_word.audio_slug,
          has_audio = previous_word.has_audio,
          notes = previous_word.notes,
          status = previous_word.status,
          category = previous_word.category,
          validated_by = previous_word.validated_by,
          validated_at = previous_word.validated_at
      where id = word.id;
  end if;

  if action.proposal_id is not null then
    select * into proposal from public.content_proposals where id = action.proposal_id for update;
     if not found
       or proposal.status <> 'validada'
       or proposal.validated_by <> p_actor_id
       or proposal.published_word_id <> action.word_id then
      raise exception 'Proposal state changed; refusing to undo';
    end if;
    update public.content_proposals
      set status = 'revisada',
          validated_by = null,
          validated_at = null,
          validation_note = null,
          validation_undo_until = null,
          published_word_id = word.id,
          history = coalesce(history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'paso', 'validacion_deshacida', 'por', p_actor_id, 'en', undo_time,
            'nota', 'Publicación revertida durante la ventana de deshacer'
          )),
          updated_at = undo_time
      where id = proposal.id;
  end if;

  update public.validation_undo_actions set undone_at = undo_time where id = action.id;
  return jsonb_build_object('ok', true, 'status', case when action.proposal_id is null then 'draft' else 'revisada' end);
end;
$$;

revoke all on function public.publish_content_proposal_with_undo(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.publish_corpus_word_with_undo(uuid, uuid) from public, anon, authenticated;
revoke all on function public.undo_validation_action(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_content_proposal_with_undo(uuid, uuid, text, text) to service_role;
grant execute on function public.publish_corpus_word_with_undo(uuid, uuid) to service_role;
grant execute on function public.undo_validation_action(uuid, uuid) to service_role;