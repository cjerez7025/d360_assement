# Guía previa a la sesión

Una página **privada** (`https://d360-assessment.web.app/?guia=1`) para que el cliente vea **antes de la reunión** de qué se va a hablar y qué se le va a preguntar, y así la sesión sea más fluida. Código: `public/guia.js`.

## Acceso: ingreso con Google y lista de personas autorizadas

- Al abrir el enlace se pide **ingresar con Google**. Solo ve la guía quien tenga su correo en la lista de personas autorizadas; los **consultores entran siempre**.
- El consultor administra la lista en el menú lateral, **«Guía previa para el cliente»**: nombre, correo (de la cuenta Google) y empresa opcional; se pueden quitar en cualquier momento (la persona pierde el acceso).
- Quien ingresa con una cuenta que no está en la lista ve «Su cuenta no tiene acceso a esta guía», con la opción de usar otra cuenta o salir.
- La lista vive en Firestore, `guia_acceso/{correo en minúsculas}` con `{n: nombre, e?: empresa, por: consultor que autorizó, t: hora}`. Las reglas dejan a cada persona leer **solo su propio** documento (con el correo verificado por Google); solo los consultores crean, listan y borran. Hay 27 casos de prueba en `probar-reglas.mjs`.
- **Limitación conocida:** el banco de preguntas (textos, ejemplos, «por qué») está dentro del código público de la app (`app.js`). Este control decide quién ve la guía en pantalla; no oculta el código. Ocultarlo de verdad exigiría mover el banco de preguntas al servidor (toca toda la app).
- Las personas necesitan una cuenta de Google con ese correo (Gmail o un correo de empresa con cuenta Google).

## Qué ve la persona autorizada

- **Qué vamos a hacer** (3 pasos), la fecha de vigencia de la ley (1-dic-2026) y que es una autoevaluación orientativa, no una auditoría ni asesoría legal.
- **Cómo participan las personas** en la reunión en vivo y **quiénes conviene que participen**, en una tabla por tema.
- **Los 8 temas, uno por uno** (las 8 dimensiones del sitio): de qué trata, quién conviene que esté y, para cada pregunta base (51):
  - la pregunta y para qué sirve;
  - **«¿Por qué se pregunta esto?»**, con su base legal que abre el texto de la ley;
  - **ejemplos de cada nivel de respuesta**, como en el cuestionario;
  - **qué conviene ir preparando** (el «cómo comprobarlo»).
- Avisa que los ejemplos muestran cómo se ve cada nivel, que no son una respuesta que haya que elegir y que el consultor confirma cada respuesta con la evidencia en el taller. (Si ven los ejemplos antes, pueden tender a responder lo que conviene y no lo que ocurre: ese es el riesgo de mostrarlos.)
- No lista las preguntas de profundización (aparecen en la reunión solo si una respuesta sale baja).

## Cómo la envía el consultor

Menú lateral, **«Guía previa para el cliente»**: copiar el enlace, **enviarlo por WhatsApp** (abre WhatsApp con un mensaje corto que avisa que se ingresa con Google) o verla. Antes de enviarla, hay que **autorizar los correos** de las personas.

## Mantenimiento

- Se arma sola desde el cuestionario (`D`, `Q`): si cambia una pregunta, la guía cambia con ella.
- `GUIA_DIM` (en `guia.js`) tiene, por tema, la descripción y a quién convocar. **Es una propuesta de AlignData, por revisar.**
- Pruebas: sección 31 de `scripts/verificar.mjs`; en modo de prueba local (`?mock=1`), `?yo=correo@x.cl` simula a una persona del cliente (sin `yo` se actúa como consultor).
- Al publicar este cambio hay que desplegar **primero `firestore:d360`** (colección nueva) y luego el hosting.
