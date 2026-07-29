CREATE TABLE public.mec_capacities (
  code TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES public.mec_levels(id) ON DELETE CASCADE,
  axis TEXT NOT NULL,
  capacity_gn TEXT NOT NULL,
  contents_es TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mec_capacities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mec_capacities TO authenticated;
GRANT ALL ON public.mec_capacities TO service_role;

ALTER TABLE public.mec_capacities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view capacities" ON public.mec_capacities
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage capacities" ON public.mec_capacities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER mec_capacities_set_updated_at
  BEFORE UPDATE ON public.mec_capacities
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_mec_capacities_level ON public.mec_capacities(level_id, sort_order);

INSERT INTO public.mec_capacities (code, level_id, axis, capacity_gn, contents_es, sort_order) VALUES
('MEC-1G-01','eeb-1','Ohendu / Ñe’ẽ','Oipuru maitei ha teko porã ñe’ẽ oñomongeta jave okápe ha mbo’ehaópe.','Maiteikuéra: Mba''éichapa, Mba''evéichante, Aguyje, Eguerahapyre. Saludos y cortesía cotidiana.',1),
('MEC-1G-02','eeb-1','Moñe’ẽrã','Oikumby pu’ae (orales ha nasales) ha pundie Achegety pegua.','Achegety (33 letras): Pu''ae (A, E, I, O, U, Y) ha Pu''ae tĩgua (Ã, Ẽ, Ĩ, Õ, Ũ, Ỹ). Uso del Pusó ('').',2),
('MEC-1G-03','eeb-1','Haipyre','Ohai téra ha ñe’ẽ mbyky ogapy ha mbo’ehao pegua.','Óga ha Mbo''ehao: Sy, Túva, Joyke''y, Mbo''ehára, Haiha, Kuatia. Sustantivos concretos directos.',3),
('MEC-2G-01','eeb-2','Ohendu / Ñe’ẽ','Ombojoaju ñe’ẽ oñe’ẽ haguã tekoha ha mymbakuéra rehe.','Tekoha: Jagua, Mbarakaja, Yvyra, Yvoty. Uso del pluralizador -kuéra / -nguéra.',1),
('MEC-2G-02','eeb-2','Moñe’ẽrã / Haipyre','Oikuaa ha oipuru sa’ykuéra ha papapy 1 guive 10 peve.','Sa''y ha Papapy: Pytã, Hovy, Sa''yju, Peteĩ (1) guive Pa (10) peve. Adjetivos calificativos postpuestos.',2),
('MEC-3G-01','eeb-3','Haipyre','Oipuru hendápe posposición monosilábica pe / me.','Posposiciones: Regla de armonía. -pe tras vocales orales (ógape), -me tras nasales (ñemuháme).',1),
('MEC-3G-02','eeb-3','Moñe’ẽrã','Ohesa’ỹijo moñe’ẽrã mbyky mymbakuéra ha mombyrygua rehegua.','Lectura comprensiva de relatos breves de animales y secuencia narrativa básica.',2),
('MEC-4G-01','eeb-4','Gramática / Haipyre','Oñembo''e ñe’ẽtéva mosã head (Conjugación Aireal Presente).','Prefijos Aireal: A-, Re-, O-, Ja- (oral) / Ña- (nasal), Ro-, Pe-, O-. Conjugación en presente.',1),
('MEC-4G-02','eeb-4','Haipyre','Oipuru posposición polisilábica (ári, iguýpe, ndive, ypýpe).','Posposiciones Separadas: Se escriben independientemente del sustantivo (Ej: apyka ári, che irũ ndive).',2),
('MEC-5G-01','eeb-5','Gramática / Haipyre','Oikuaa ha oipuru ñe''ẽpehẽtai ára mboyvegua (-kuri, -va''ekue).','Tiempo Pasado: Sufijos -kuri (pasado reciente) y -va''ekue (pasado distante) aglutinados al verbo.',1),
('MEC-5G-02','eeb-5','Ohendu / Ñe’ẽ','Omoñe’ẽ ha ohesa’ỹijo morangu ha káso ñemombe’u.','Tradición Oral: Káso ñemombe''u (Pychãichĩ, Pláta Yvyguy). Estructura del relato tradicional.',2),
('MEC-6G-01','eeb-6','Gramática / Haipyre','Oipuru hekopete afijos de modo (-se, -potá, -ve, -pa).','Modos Verbales: Desiderativo (-se), Incoativo (-pota), Incremental (-ve), Totalitativo (-pa).',1),
('MEC-6G-02','eeb-6','Haipyre','Ohai marandu ha kuatiañe’ẽ mbyky ogapy ha mbo’ehaópe guarã.','Redacción Epistolar: Cartas, recados y mensajes formales breves con encabezado y despedida.',2),
('MEC-7G-01','eeb-7','Gramática Avanzada','Ohesa''ỹijo terarã triforme ha biforme (T- / S- / R-).','Sustantivos Oscilantes: Tete / Sete / Rete - Tova / Sova / Rova. Cambio de consonante según el poseedor.',1),
('MEC-7G-02','eeb-7','Moñe’ẽrã / Literatura','Omoñe''ẽ ha ohesa''ỹijo Mitos ha Leyendas del Paraguay.','Mitología Guaraní: Jasy Jatere, Kurupi, Luisõ, Moñái, Ao Ao. Comprensión del contexto socio-cultural.',2),
('MEC-8G-01','eeb-8','Sintaxis / Haipyre','Oipuru hendápe ñe’ẽjoajuha (Conectores y Conjunciones).','Cohesión Textual: Ha (y), Téra / Oiméne (o), Bepémo (sin embargo), Hag̃ua (para), Gui (porque).',1),
('MEC-8G-02','eeb-8','Gramática','Oikuaa ha oipuru nominalizadores (-ha, -hára, -py).','Nominalización: Transformación de verbos a sustantivos. Agente (-hára), Lugar/Acción (-ha), Paciente (-py).',2),
('MEC-9G-01','eeb-9','Gramática / Modos','Oipuru hekopete ára upeigua (-ta, -ne, -va''erã).','Futuros y Modales: Futuro seguro (-ta), Futuro probable/duda (-ne), Obligación (-va''erã).',1),
('MEC-9G-02','eeb-9','Haipyre','Ohai marandu guasu ha mombyrygua (Ensayos ha Artículos).','Redacción Argumentativa: Artículos de opinión, tesis, desarrollo y conclusión en guaraní normativo.',2),
('MEC-EM-01','em-1','Iñe’ẽporãhaipyre','Ohesa''ỹijo ñe''ẽyvoty ha ñe''ẽñemi lírica guaraníme.','Análisis Literario: Poesía, metáfora (mbojoja), símil (mbohapara), imágenes sensoriales en autores clásicos.',1),
('MEC-EM-02','em-2','Traducción / Discurso','Omoñe’ẽ ha omoimbai mbohasa bilingüe técnico.','Traducción Técnico-Científica: Conversión directa e inversa (Guaraní-Español) respetando la fidelidad semántica.',1),
('MEC-EM-03','em-3','Oratoria / Ensayo','Ohai ensayo ha oñe''ẽ arandu rekópe tekoha teépe.','Oratoria y Monografías: Discurso público académico, defensa de proyectos comunitarios y redacción formal avanzada.',1);