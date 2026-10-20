-- Circuito de validación en tres niveles: propone → revisa → valida.
-- Ni la IA ni el equipo técnico escriben guaraní: cada propuesta la escribe una persona,
-- la revisa otra (revisor avanzado) y la valida una tercera (docente validador).
-- Cada paso guarda quién y cuándo, más un historial completo.

-- 1) Revisores avanzados (estudiantes avanzados o pasantes).
--    Tabla aparte para no tocar el enum app_role (los docentes validadores siguen siendo "editor").
create table if not exists public.content_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.content_reviewers enable row level security;
create policy "reviewers_select_self_or_admin" on public.content_reviewers
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Propuestas.
create table if not exists public.content_proposals (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('nueva', 'correccion')),
  target_word_id uuid references public.corpus_words(id) on delete set null,
  gn text not null check (char_length(gn) between 1 and 200),
  es text not null check (char_length(es) between 1 and 300),
  notes text not null default '' check (char_length(notes) <= 1000),
  source text not null default '' check (char_length(source) <= 300),
  status text not null default 'propuesta'
    check (status in ('propuesta', 'revisada', 'validada', 'devuelta', 'rechazada')),
  proposed_by uuid not null references auth.users(id),
  proposed_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  validation_note text,
  published_word_id uuid references public.corpus_words(id) on delete set null,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  -- Tres personas distintas.
  constraint reviewer_not_proposer check (reviewed_by is null or reviewed_by <> proposed_by),
  constraint validator_not_proposer check (validated_by is null or validated_by <> proposed_by),
  constraint validator_not_reviewer check (validated_by is null or reviewed_by is null or validated_by <> reviewed_by),
  constraint correction_has_target check (kind <> 'correccion' or target_word_id is not null)
);
create index if not exists content_proposals_status_idx on public.content_proposals (status, proposed_at);
create index if not exists content_proposals_proposer_idx on public.content_proposals (proposed_by, proposed_at desc);

alter table public.content_proposals enable row level security;
-- Lectura: cada uno ve lo suyo; admin y docentes validadores ven todo.
-- Escritura: solo desde el servidor (service role), después de verificar el rol en cada paso.
create policy "proposals_select_own_or_staff" on public.content_proposals
  for select to authenticated
  using (
    proposed_by = auth.uid()
    or public.has_role(auth.uid(), 'admin'::app_role)
    or public.has_role(auth.uid(), 'editor'::app_role)
  );
