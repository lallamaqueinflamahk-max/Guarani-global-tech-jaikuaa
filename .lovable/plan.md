
## Resumen de la verificación

- **Total de ítems de vocabulario** en `guarani-lessons.ts` + `guarani-tema.ts`: 126 ocurrencias.
- **Palabras únicas** (lo que realmente necesita audio): **109**.
- **Colisiones de slug detectadas**: **0**.
- La palabra `Po` aparece dos veces (Lección 2 = "5", Lección 4 = "mano"), pero es la misma palabra hablada → un solo `po.mp3` sirve para ambos usos. Correcto.

(Nota: la cifra de 371 que mencionaste no coincide con el contenido actual del código. Si ya grabaste 371 archivos, probablemente cubren variantes/frases/conjugaciones que aún no están en los datos. Cuando agreguemos más contenido, los archivos extra se usarán automáticamente.)

## Reglas de slugify (confirmadas)

Aplicadas en este orden a cada palabra guaraní:

1. Normalización Unicode NFD + quitar marcas combinantes → **las vocales nasales `ã ẽ ĩ õ ũ ỹ` se convierten en `a e i o u y`**, y `á é í ó ú ý` también pierden el acento.
2. Pasar a minúsculas.
3. `ñ` → `n`.
4. Quitar el puso `'` (y sus variantes Unicode `'`, `ʼ`, `ʹ`).
5. Quitar el signo `?` y cualquier carácter no `[a-z0-9]` → reemplazar por `-`.
6. Recortar guiones al inicio/final.
7. Agregar extensión `.mp3`.

Ejemplos clave: `Mba'éichapa` → `mbaeichapa.mp3` · `Ñañe'ẽ` → `nanee.mp3` · `Tereg̃uahẽ porãite` → `tereguahe-poraite.mp3` · `Hũ` → `hu.mp3` · `Ñe'ã` → `nea.mp3`.

## Qué voy a implementar (en modo build)

1. Crear el bucket público de Storage **`guarani-audio`** (sin RLS personalizado: solo lectura pública).
2. Agregar `src/lib/audio.ts` con:
   - `slugify(gn)` exactamente con las reglas de arriba.
   - `audioUrlFor(gn)` que devuelve la URL pública del bucket.
   - `playGuarani(gn)` que intenta reproducir el `.mp3` y, si el archivo no existe (404) o falla, cae al `speechSynthesis` actual (TTS). Así nada se rompe mientras subís archivos de a poco.
3. Crear `<SpeakerButton gn={...} />` en `src/components/audio/speaker-button.tsx` reusando el estilo redondo 🔊 que ya existe.
4. Reemplazar los tres botones 🔊 inline existentes por el nuevo componente en:
   - `src/routes/_authenticated/curso.$lang.leccion.$n.tsx`
   - `src/routes/_authenticated/guarani-escolar.tema.$topic.tsx`
   - `src/routes/_authenticated/guarani-escolar.rescate.tsx`
5. Generar un archivo `docs/audio-filenames.md` con la **lista completa de los 109 nombres de archivo esperados** ordenados alfabéticamente, junto a la palabra guaraní original — para que renombres tus grabaciones exactamente igual antes de subirlas.

## Lista completa de los 109 archivos esperados

```
aguata.mp3            ← Aguata
aguyje.mp3            ← Aguyje
aha.mp3               ← Aha
ahayhu.mp3            ← Ahayhu
ahecha.mp3            ← Ahecha
ahendu.mp3            ← Ahendu
aiko.mp3              ← Aiko
aipota-y.mp3          ← Aipota y
aju.mp3               ← Aju
aka.mp3               ← Akã
akaru.mp3             ← Akaru
ake.mp3               ← Ake
ama.mp3               ← Ama
anee.mp3              ← Añe'ẽ
avati.mp3             ← Avati
che-vya.mp3           ← Che vy'a
cherechaana.mp3       ← Cherecha'ãna
chipa.mp3             ← Chipa
ehasamina.mp3         ← Ehasamína
eju-ke.mp3            ← Eju ke
eju-koape.mp3         ← Eju ko'ape
guyra.mp3             ← Guyra
haku.mp3              ← Haku
hee.mp3               ← Heẽ
hovy.mp3              ← Hovy
hu.mp3                ← Hũ
ipora.mp3             ← Iporã
irundy.mp3            ← Irundy
jagua.mp3             ← Jagua
jaguarete.mp3         ← Jaguarete
jaha.mp3              ← Jaha
jajotopa-peve.mp3     ← Jajotopa peve
jajotopata.mp3        ← Jajotopáta
jaryi.mp3             ← Jarýi
jasy.mp3              ← Jasy
juru.mp3              ← Juru
kaaguy.mp3            ← Ka'aguy
kaaru-pora.mp3        ← Ka'aru porã
kamby.mp3             ← Kamby
kavaju.mp3            ← Kavaju
koe-pora.mp3          ← Ko'ẽ porã
kuarahy.mp3           ← Kuarahy
kypyy.mp3             ← Kypy'y
kyvy.mp3              ← Kyvy
mainumby.mp3          ← Mainumby
mandio.mp3            ← Mandi'o
mbaeichapa.mp3        ← Mba'éichapa
mbaeichapa-nde-rera.mp3 ← Mba'éichapa nde réra
mbaepa-la-novedad.mp3 ← Mba'épa la novedad?
mbaeve-mbae.mp3       ← Mba'eve mba'e
mbarakaja.mp3         ← Mbarakaja
mbeju.mp3             ← Mbeju
mbohapy.mp3           ← Mbohapy
mbyja.mp3             ← Mbyja
memby.mp3             ← Memby
memby-kuimbae.mp3     ← Memby kuimba'e
membykuna.mp3         ← Membykuña
michi.mp3             ← Michĩ
mokoi.mp3             ← Mokõi
mokoipa.mp3           ← Mokõipa
moopa-reho.mp3        ← Moõpa reho
moroti.mp3            ← Morotĩ
nahaniri.mp3          ← Nahániri
nambi.mp3             ← Nambi
nanee.mp3             ← Ñañe'ẽ
nanee-guaranime.mp3   ← Ñañe'ẽ guaraníme
nanemoneemi.mp3       ← Ñañemoñe'ẽmi
ndaikuaai.mp3         ← Ndaikuaái
nea.mp3               ← Ñe'ã
nemonare.mp3          ← Ñemoñare
oho.mp3               ← Oho
pa.mp3                ← Pa
para.mp3              ← Para
peho.mp3              ← Peho
petei.mp3             ← Peteĩ
pira.mp3              ← Pira
po.mp3                ← Po  (sirve para "5" y "mano")
poapy.mp3             ← Poapy
pokoi.mp3             ← Pokõi
pora.mp3              ← Porã
porundy.mp3           ← Porundy
potei.mp3             ← Poteĩ
py.mp3                ← Py
pyahu.mp3             ← Pyahu
pyhare-pora.mp3       ← Pyhare porã
pyta.mp3              ← Pytã
reho.mp3              ← Reho
reindy.mp3            ← Reindy
roho.mp3              ← Roho
roy.mp3               ← Ro'y
sayju.mp3             ← Sa'yju
soo.mp3               ← So'o
sy.mp3                ← Sy
taita.mp3             ← Taita
taita-guasu.mp3       ← Taita guasu
tembiu.mp3            ← Tembi'u
tereguahe-poraite.mp3 ← Tereg̃uahẽ porãite
tesa.mp3              ← Tesa
ti.mp3                ← Tĩ
tuicha.mp3            ← Tuicha
tuja.mp3              ← Tuja
tuva.mp3              ← Túva
tykeyra.mp3           ← Tyke'ýra
vai.mp3               ← Vai
vaka.mp3              ← Vaka
y.mp3                 ← Y
yvoty.mp3             ← Yvoty
yvy.mp3               ← Yvy
yvyra.mp3             ← Yvyra
```

## Lo que necesito de vos

- ¿Confirmás avanzar con este plan tal cual?
- ¿Querés que el bucket se llame `guarani-audio` o preferís otro nombre?
- Si tus 371 archivos cubren más palabras de las que están hoy en el código, pasame la lista y los agrego al contenido para que cada uno tenga su botón 🔊.
