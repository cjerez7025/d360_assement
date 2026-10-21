# Guía previa a la sesión

Una página **privada** (`https://d360-assessment.web.app/?guia=1`) para que el cliente vea **antes de la reunión** de qué se va a hablar y qué se le va a preguntar, y así la sesión sea más fluida. Código: `public/guia.js`.

## Acceso: ingreso con Google y lista de personas autorizadas

- Al abrir el enlace se pide ingresar de una de dos formas: **con Google** o, para quien **no tiene cuenta Google**, **recibiendo un enlace en su correo** (se escribe el correo, llega un enlace y al abrirlo se ingresa; no hace falta ninguna cuenta ni contraseña). Solo ve la guía quien tenga su correo en la lista de personas autorizadas; los **consultores entran siempre**.
- El consultor administra la lista en el menú lateral, **«Guía previa para el cliente»**: nombre, correo (de la cuenta Google) y empresa opcional; se pueden quitar en cualquier momento (la persona pierde el acceso).
- **A quien no está registrado no se le envía nada.** Antes de enviar el enlace por correo se comprueba que el correo esté registrado; si no lo está, no sale ningún correo y la pantalla dice que pida acceso a `patricio.oliva@aligndata.cl`, `carlos.jerez@aligndata.cl` o `ricardo.carmona@aligndata.cl`. Lo mismo ve quien ingresa con Google con una cuenta que no está en la lista. La comprobación usa `guia_registro/{SHA-256 del correo}`: se puede preguntar por **un** correo que ya se conoce, pero no listar ni leer quiénes están registrados. Las crea y borra el consultor junto con la lista; las personas ya autorizadas antes de existir esta marca se marcan solas la primera vez que un consultor abre «Guía previa para el cliente» (**hay que abrirla una vez después de publicar**).
- Quien ingresa con una cuenta que no está en la lista ve «Su cuenta no tiene acceso a esta guía», con la opción de usar otra cuenta o salir.
- La lista vive en Firestore, `guia_acceso/{correo en minúsculas}` con `{n: nombre, e?: empresa, por: consultor que autorizó, t: hora}`. Las reglas dejan a cada persona leer **solo su propio** documento (con el correo verificado por Google); solo los consultores crean, listan y borran. Hay 27 casos de prueba en `probar-reglas.mjs`.
- **Limitación conocida:** el banco de preguntas (textos, ejemplos, «por qué») está dentro del código público de la app (`app.js`). Este control decide quién ve la guía en pantalla; no oculta el código. Ocultarlo de verdad exigiría mover el banco de preguntas al servidor (toca toda la app).
- **Ingreso por enlace al correo:** requiere habilitarlo una vez en Firebase: consola → proyecto `aligndata-arcop` → Authentication → Método de acceso → **Correo electrónico/contraseña** → activar **«Vínculo del correo electrónico (acceso sin contraseña)»**. Si no está habilitado, la pantalla dice «El ingreso por correo aún no está habilitado». El enlace lo envía Firebase desde `noreply@aligndata-arcop.firebaseapp.com`; puede caer en la carpeta de correo no deseado de una empresa (la pantalla lo avisa). Si el enlace se abre en otro equipo que el que lo pidió, se pide escribir el correo para confirmar.
- El correo que se autoriza debe ser **el mismo** con el que la persona ingresa (Google o enlace).

## Freno a copiar e imprimir (solo para las personas del cliente)

Para las personas invitadas (no para los consultores) la guía **no deja seleccionar el texto, copiar, cortar, arrastrar, abrir el menú del clic derecho ni usar los atajos de copiar, seleccionar todo, imprimir, guardar y ver código**; y al imprimir o guardar como PDF solo sale el aviso «Esta guía es confidencial: no se puede imprimir ni guardar como PDF». Está en `guiaProteger()` de `guia.js`.

**Es un freno, no una garantía.** No impide capturas de pantalla, fotos con el celular ni grabar la pantalla, y quien sepa usar las herramientas del navegador lo salta. La protección que realmente vale es contractual (que el NDA y el Acuerdo traten expresamente la guía y el cuestionario como confidenciales y propiedad de AlignData). Otras medidas posibles, aún sin hacer: marca de agua con el correo de quien mira, vencimiento del acceso por persona y registro de quién abrió la guía.

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
