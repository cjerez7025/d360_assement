# Guía previa a la sesión

Una página pública con enlace propio, `https://d360-assessment.web.app/?guia=1`, para que el cliente vea **antes de la reunión** de qué se va a hablar y qué se le va a preguntar, y así la sesión sea más fluida. Código: `public/guia.js`.

## Qué ve el cliente

- **Qué vamos a hacer** (3 pasos), la fecha de vigencia de la ley (1-dic-2026) y que es una autoevaluación orientativa, no una auditoría ni asesoría legal.
- **Cómo participan las personas:** con el enlace de la reunión, sin cuenta, escribiendo su nombre; pueden participar varias personas con el mismo enlace.
- **Quiénes conviene que participen**, en una tabla por tema.
- **Los 8 temas, uno por uno** (las 8 dimensiones del sitio): de qué trata, quién conviene que esté, las preguntas que se conversarán (51), qué conviene **ir preparando** (el «cómo comprobarlo» de cada pregunta) y la base legal, que abre el texto de la ley.

## Qué no muestra (a propósito)

- **Las opciones de respuesta:** si se ve antes cuál es la «respuesta ideal», se tiende a responder lo que conviene y no lo que ocurre.
- **Las preguntas de profundización** (aparecen solo si una respuesta sale baja): solo avisa que «es posible que hagamos preguntas adicionales».
- **Ningún dato de empresas o sesiones.** No usa Firebase ni pide ingreso; todos ven lo mismo.

## Cómo la envía el consultor

En el menú lateral: **«Guía previa para el cliente»**. Muestra el enlace, con **Copiar**, **Enviar por WhatsApp** (abre WhatsApp con un mensaje corto y el enlace) y **Ver la guía**. Sirve para mandarla por WhatsApp, correo u otro medio.

## Mantenimiento

- Se arma sola desde el cuestionario (`D`, `Q`): si cambia una pregunta, la guía cambia con ella.
- `GUIA_DIM` (en `guia.js`) tiene, por tema, la descripción en palabras llanas y a quién conviene convocar. **Es una propuesta de AlignData, por revisar.**
- Pruebas: sección 31 de `scripts/verificar.mjs`.
