## 1. Dónde está hoy el corpus

Verificado en el código actual:

| Fuente | Entradas |
|---|---|
| `guarani-lessons.ts` (Curso, 10 lecciones) | 80 |
| `guarani-tema.ts` (Guaraní Escolar, 6 temas) | 46 |
| `comenzar.tsx` (onboarding) | 3 |
| `index.tsx` (landing) | 6 |
| **Total de entradas** | **135** |
| **Palabras únicas** | **109** |
| Audios humanos en `docs/audio-filenames.md` | **109** (cobertura 100%) |

Hay 26 repeticiones porque la misma palabra (ej. *Aguyje*, *Iporã*, *Mba'éichapa*) está escrita en varios archivos. No existe una fuente única: por eso hoy no se puede responder "cuántas palabras tiene tal grado" sin contarlas a mano.

## 2. Respuesta a tu pregunta de fondo

**El corpus no se multiplica por grado: se comparte.** La palabra es el activo (con su audio humano); el grado es solo una etiqueta de uso.

- Una palabra puede pertenecer a varios grados a la vez (*Sy* aparece en 1° y se reusa en 4°).
- Al subir un grado nuevo, el sistema compara contra el corpus existente y separa **palabras ya existentes** (0 audio nuevo) de **palabras nuevas** (requieren grabación).
- Las oraciones **no son entradas del corpus**: son combinaciones de palabras ya existentes. Cada oración se guarda con la lista de palabras que la componen, y el audio se reproduce palabra por palabra reusando los 109 (y los que vengan).

Estimación realista con 9 niveles (1° básica → 3er curso), asumiendo ~120–180 palabras clave nuevas por nivel en los primeros grados y menos en los superiores (por solapamiento creciente): el corpus final ronda **900–1.300 palabras únicas**, no ~1.600 entradas sueltas. El solapamiento entre grados es el que te ahorra grabaciones.

## 3. Arquitectura a construir

### Tablas nuevas (base de datos)

```text
corpus_words          — la palabra: gn, es, slug de audio, tiene_audio, notas, estado
corpus_word_levels    — qué grado(s) usan cada palabra (palabra ↔ nivel ↔ unidad MEC)
corpus_sentences      — oración en guaraní + traducción + nivel + unidad
corpus_sentence_words — orden de las palabras dentro de la oración (enlaza al corpus)
mec_levels            — 1° básica … 3er curso, con las unidades del cronograma
```

Regla clave: `corpus_words.gn` es **único**. Si la profesora sube "Aguyje" en 3° y ya existía en 1°, no se duplica: solo se agrega una fila en `corpus_word_levels`.

El slug de audio se calcula con **las mismas 7 reglas** que ya usa la app (`docs/audio-filenames.md`), así el audio existente se enlaza automáticamente.

### Panel de carga (`/admin/corpus`)

- **Importar Excel**: subís el .xlsx validado por la profesora, con columnas `guarani | español | grado | unidad | tipo (palabra/oración)`.
- **Vista previa antes de guardar**, con tres listas:
  - ✅ Ya en el corpus → se reusan, sin costo de audio
  - 🆕 Nuevas → se crean, marcadas "sin audio"
  - ⚠️ Conflictos → misma palabra con traducción distinta, para que decidas
- **Tablero de cobertura**: palabras totales, con audio, sin audio, y el listado exacto de slugs a grabar por grado.
- Editar / corregir / dar de baja una palabra sin tocar código.
- Acceso restringido a administradores (tabla de roles separada, sin roles en el perfil).

### Migración del contenido actual

Las 109 palabras existentes se cargan a `corpus_words` con su audio ya enlazado y su grado tentativo. Las lecciones y temas actuales **siguen funcionando igual** (pasan a leer del corpus en vez de los archivos), sin tocar XP, timer, audio ni trivia.

## 4. Tu flujo de trabajo después

1. Generás el Excel de un grado con la IA que prefieras.
2. La profesora lo valida.
3. Lo subís al panel → ves cuántas palabras son nuevas y cuántas se reusan.
4. El panel te da la lista exacta de audios a grabar (solo las nuevas).
5. Publicás el grado cuando la cobertura de audio llega al 100%.

## 5. Detalles técnicos

- Tablas con RLS: lectura pública (`anon`, `authenticated`) para el contenido publicado; escritura solo para rol `admin` vía función `has_role`, con los `GRANT` correspondientes.
- Importación de Excel parseada en el cliente y persistida por una server function validada con Zod.
- Estado `draft | published` por palabra/oración, para que nada aparezca en la app hasta que lo apruebes.
- El `audio_slug` se genera con la función de slug existente en `src/lib/audio.ts` para garantizar compatibilidad con el bucket actual.

## 6. Pendiente de tu lado

Necesito el **cronograma del MEC** (no llegó el archivo). Con él defino la tabla `mec_levels` con las unidades reales de cada grado; sin él, arranco con niveles genéricos 1°–9° y las unidades se cargan después desde el panel.
