## Objetivo

Convertir el cronograma oficial del MEC en la columna vertebral del corpus: cada grado deja de tener "unidades" escritas a mano y pasa a tener sus **capacidades oficiales** con código, eje curricular y contenidos. El vocabulario explícito del PDF se carga ya, asignado a su capacidad.

## Qué contiene el cronograma

22 capacidades oficiales repartidas en los 12 niveles que ya existen en la app:

```text
1° grado  MEC-1G-01 · 1G-02 · 1G-03    3° curso EM  MEC-EM-03
2° grado  MEC-2G-01 · 2G-02
3° grado  MEC-3G-01 · 3G-02            + 3 reglas ortográficas
4° grado  MEC-4G-01 · 4G-02              obligatorias (ALG Ley 4251/10):
5° grado  MEC-5G-01 · 5G-02              aglutinación de afijos,
6° grado  MEC-6G-01 · 6G-02              armonía nasal (-pe / -me),
7° grado  MEC-7G-01 · 7G-02              grafemario oficial (K, J, Y, pusó)
8° grado  MEC-8G-01 · 8G-02
9° grado  MEC-9G-01 · 9G-02
1° y 2° curso EM  MEC-EM-01 · EM-02
```

## 1. Base de datos

Nueva tabla `mec_capacities` con: código (`MEC-1G-01`), nivel, eje curricular (Ohendu/Ñe'ẽ, Moñe'ẽrã, Haipyre, Gramática…), capacidad oficial en guaraní, contenidos clave en español y orden. Lectura pública, escritura solo admin.

Las 22 filas se cargan con los textos exactos del PDF.

Cambio en el corpus: `corpus_word_levels.unit` y `corpus_sentences.unit` pasan a guardar el **código de capacidad** en vez de texto libre. Las filas actuales (109 palabras ya mapeadas a 6° grado) se reasignan a la capacidad que corresponda o quedan sin capacidad hasta que se revise.

## 2. Léxico del cronograma

Se cargan las palabras nombradas explícitamente en el documento, cada una a su capacidad. Las que ya existen en el corpus se reutilizan (no se duplican, no se vuelve a grabar audio); las nuevas entran como pendientes de grabación.

- **1G-01** Mba'éichapa, Mba'evéichante, Aguyje, Eguerahapyre
- **1G-02** las 33 letras del Achegety, pu'ae orales y nasales, pusó
- **1G-03** Sy, Túva, Joyke'y, Mbo'ehára, Haiha, Kuatia
- **2G-01** Jagua, Mbarakaja, Yvyra, Yvoty, -kuéra / -nguéra
- **2G-02** Pytã, Hovy, Sa'yju, y los números Peteĩ a Pa (1–10)
- **3G-01** ógape, ñemuháme (ejemplos de armonía)
- **4G-01** prefijos A-, Re-, O-, Ja-/Ña-, Ro-, Pe-
- **4G-02** ári, iguýpe, ndive, ypýpe
- **5G-01** -kuri, -va'ekue · **5G-02** Pychãichĩ, Pláta Yvyguy
- **6G-01** -se, -pota, -ve, -pa
- **7G-01** Tete/Sete/Rete, Tova/Sova/Rova · **7G-02** Jasy Jatere, Kurupi, Luisõ, Moñái, Ao Ao
- **8G-01** Ha, Téra, Bepémo, Hag̃ua, Gui · **8G-02** -ha, -hára, -py
- **9G-01** -ta, -ne, -va'erã

Todo entra como **borrador**, nada se publica hasta que tu profesora lo revise desde el panel.

## 3. Panel /admin/corpus

- Nueva pestaña **Cronograma MEC**: la malla completa por ciclo, con código, eje, capacidad en guaraní y contenidos, más cuántas palabras y oraciones tiene cargada cada capacidad y cuántas tienen audio.
- En **Importar**: la columna `unidad` del Excel ahora acepta el código de capacidad (`MEC-2G-01`) y el previsualizador avisa si un código no existe.
- En **Palabras**: filtro por capacidad además de por grado.
- Bloque fijo con las 3 reglas ortográficas obligatorias visible al cargar contenido, para que quien escriba el Excel las tenga a la vista.

## 4. Sin generación automática

No se genera vocabulario ni oraciones con IA. La app solo carga lo que está escrito en el documento oficial y lo que subas por Excel.

## Notas técnicas

- Migración: `CREATE TABLE public.mec_capacities` + GRANT anon/authenticated SELECT, service_role ALL, RLS con política admin para escritura; FK a `mec_levels(id)`.
- Seed de las 22 capacidades y del léxico vía inserts; las palabras existentes se detectan por `audio_slug` para no duplicar.
- `src/lib/corpus.functions.ts`: nueva `listMecCapacities`, validación de código en `previewCorpusImport`, y `getCorpusOverview` agregado por capacidad.
- Nuevo componente de pestaña en `src/routes/_authenticated/admin.corpus.tsx`.
