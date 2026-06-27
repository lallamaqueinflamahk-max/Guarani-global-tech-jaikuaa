# Auditoría de Aranduka — listo para demo al gobierno

Resumen ejecutivo: la app está en muy buen estado para mostrar. No encontré bugs bloqueantes en los flujos principales. El audio guaraní está 100% cubierto. Hay 5–6 ajustes menores recomendables antes de la demo (UX y polish), pero ninguno impide mostrarla hoy.

---

## 1. CRITICAL (revisar antes de mostrar)

**Ninguno bloqueante.** Los flujos principales funcionan:
- Landing → Empezar gratis → /auth (signup) ✅
- Login email/password con error messages en rojo ✅
- Login con Google (redirect a `/auth` con listener) ✅
- Dashboard saluda con "¡Mba'éichapa, [nombre]!" ✅
- Curso Guaraní → Lección 1 desbloqueada, 2–10 con 🔒 ✅
- Guaraní Escolar → Modo Rescate, Plan Semanal, Práctica por Tema (6 temas, todos con quiz) ✅
- Tutor IA, Traductor, Ñe'ẽ Rape ✅
- Gamificación (XP/Racha/Logros) con persistencia local ✅

Un único riesgo real para mencionar: **Signup con email** llama `navigate("/dashboard")` aunque Supabase responda sin sesión (caso "confirma tu email"). Si en la config de auth está activado *confirm email*, el usuario verá un parpadeo y será rebotado a `/auth`. Antes del demo: registrarse con un email nuevo en preview para verificar que entra directo. Si no entra, hay que desactivar "confirm email" en Cloud → Users → Auth Settings, o agregar un mensaje "revisá tu email". Fix sugerido: en `src/routes/auth.tsx` línea ~118, no navegar si `data.session` es null.

---

## 2. AUDIO (109 palabras guaraní)

**Estado: 100% cubierto.** Verifiqué directamente contra el bucket `guarani-audio`:

- Slugs esperados según `docs/audio-filenames.md`: 109
- Archivos presentes en el bucket: los 109 esperados (más algunos duplicados `-2.mp3`/`-3.mp3` que la app ignora — no molestan).
- Cero palabras de lecciones, temas o examen Rescate caen al fallback TTS.

**Latencia**: cada click de 🔊 genera una URL firmada vía server function (~150–400ms en buenas redes) antes de reproducir. En vivo, la primera reproducción puede tener un mínimo delay perceptible. Nice-to-have: pre-cachear la URL al hacer hover/focus del botón. No es crítico.

---

## 3. MOBILE

Revisé el markup de todas las páginas principales. Todo usa Tailwind responsive (`sm:`, `lg:`, `max-w-*`, `px-4`). No detecté overflow ni texto cortado en breakpoints típicos. Puntos a confirmar en vivo en un teléfono real antes del demo:

- **Tutor IA** usa `h-screen` (línea 46) en lugar de `min-h-screen`/`h-dvh`. En iOS Safari con la barra dinámica, el textarea inferior puede quedar tapado por la barra de navegación. Recomendado: cambiar `h-screen` → `min-h-dvh` o `h-[100dvh]`.
- **Hero** título h1 escala hasta `lg:text-7xl`; en mobile va bien (`text-4xl`).
- **Dashboard cards** apilan a 1 columna en mobile correctamente.

---

## 4. POLISH / PROFESIONALISMO

- **Favicon**: existe en `public/favicon.png` y está referenciado en `__root.tsx`. ✅
- **OG image** (`__root.tsx` línea 90) apunta a `https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/…`. Funciona pero la URL parece interna de la plataforma. Si se comparte el link en WhatsApp/Telegram durante la reunión, conviene confirmar que renderiza con el logo del jaguar. Si falla, subir el logo a `public/og-image.png` y actualizar la meta.
- **Landing → "Idiomas destacados"** muestra solo 3 idiomas (Guaraní, Inglés, Portugués). El dashboard sí muestra los 5 (con "Próximamente" en 4). Es consistente con la narrativa "Guaraní en el corazón", pero si en el pitch se habla de 5 idiomas conviene agregar Francés y Español acá también.
- **Sin placeholder ni lorem ipsum** en ninguna ruta. Todo el copy está en español paraguayo.
- **Header del Dashboard**: el botón "Cerrar sesión" está siempre visible — está bien para la demo, pero ocupa espacio en mobile. Nice-to-have: meterlo en un dropdown con el nombre del usuario.

---

## 5. PERFORMANCE

- Fuentes Google (Inter + Space Grotesk) cargan con `preconnect` ✅
- Sin imágenes pesadas en landing (todo emoji/SVG inline).
- `defaultPreloadStaleTime: 0` en el router — los hovers sobre `<Link>` no pre-cachean. Para una demo en vivo con WiFi de hotel, **subir a `defaultPreloadStaleTime: 30_000`** en `src/router.tsx` acelera la navegación percibida notablemente.
- Cada palabra 🔊 hace un roundtrip de server function. Si demuestran una lección reproduciendo varias palabras seguidas, hay un pequeño delay por click. No es bloqueante.

---

## Prioridades sugeridas antes del demo

**Importante (15 min):**
1. Probar signup con email nuevo en preview para verificar comportamiento de confirmación de email; si rebota, desactivar "confirm email" en Cloud → Users → Auth Settings.
2. Probar la app desde un iPhone real, especialmente la pantalla del Tutor IA (problema potencial de `h-screen`).
3. Compartir el link `https://arandukapy.com` por WhatsApp para verificar que el preview con el logo del jaguar se ve bien.

**Nice-to-have (si hay tiempo):**
4. Cambiar `h-screen` → `min-h-dvh` en `src/routes/_authenticated/tutor.tsx` línea 46.
5. Subir `defaultPreloadStaleTime` a 30000 en `src/router.tsx` para navegación más fluida.
6. Agregar Francés y Español a "Idiomas destacados" en la landing si en el pitch se menciona "5 idiomas".

¿Querés que aplique alguno o todos estos ajustes? Decime cuáles y los implemento sin tocar nada más.
