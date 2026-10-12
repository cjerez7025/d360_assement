# Pizarra compartida

El consultor y los integrantes del cliente escriben **comentarios** (con texto e imágenes) que ven todos, con el **nombre de quien los escribió**. Es una pizarra para la reunión: acuerdos, dudas, evidencia pedida, capturas.

## Cómo se usa

- **Por pregunta:** debajo de las opciones de cada pregunta hay un hilo («Pizarra de esta pregunta»). Lo ven el consultor y los clientes que siguen la reunión en vivo.
- **General:** el botón **Pizarra** (con contador) abre la pizarra de toda la reunión: todos los comentarios agrupados por pregunta y un cuadro para escribir comentarios generales.
- **Escribir:** texto de hasta 2.000 caracteres. **Ctrl + Enter** publica. Se pueden **adjuntar, pegar o arrastrar imágenes** (hasta 3 por comentario).
- **Imágenes:** se reducen en el navegador a JPEG (≈ 200 KB como máximo) y se guardan dentro del comentario. Un clic en la miniatura la amplía.
- **Documentos (PDF, Word, Excel, PowerPoint, OpenOffice, CSV, texto, RTF y ZIP):** hasta 3 por comentario y **5 MB** cada uno. Se adjuntan con el botón **Adjuntar**, arrastrándolos o **pegando con Ctrl + V** (un archivo copiado del explorador o una captura de pantalla): el pegado funciona en cualquier parte de la pantalla, va a la pizarra que se esté viendo. Cada documento aparece como una tarjeta con su nombre, tipo y tamaño; un clic lo descarga. Mientras sube se ve una barra de avance, y el comentario aparece cuando el archivo está completo.
- **Qué no se acepta:** ejecutables, scripts, HTML, SVG, accesos directos y archivos con macros (`.xlsm`, `.docm`…). Además de la extensión, se revisa el contenido: un `.exe` renombrado como `.pdf` se rechaza. Los archivos que sube un cliente llevan el aviso «ábralo con precaución». Firebase no revisa virus: ante la duda, no abra el archivo.
- **Quién escribe:**
  - **Consultor:** su cuenta de Google (verificada por las reglas).
  - **Cliente:** al abrir el enlace de la reunión escribe su **nombre** (y cargo, opcional). Queda guardado en su navegador y se puede cambiar («cambiar», junto al cuadro de texto). Es un nombre declarado, no verificado.
- **Borrar:** solo el consultor (botón «Eliminar», con confirmación). Los comentarios no se editan.
- **Después de la reunión:** todo queda en la sesión. Al **publicar** los resultados, la pizarra viaja con ellos y el cliente la ve en la pestaña **Pizarra**, solo lectura, con el autor de cada comentario. «Actualizar resultados publicados» sube los comentarios nuevos; «Revocar enlace» los retira.

La pizarra **reemplaza** al antiguo cuadro «Notas de la reunión» de cada pregunta: ya no hay dos lugares para anotar. Las notas que existían en sesiones anteriores se pasan solas a la pizarra de su pregunta la primera vez que el consultor abre la sesión (mismo autor, fecha de la sesión, sin duplicarse) y se borran del campo antiguo; si un enlace ya publicado todavía las trae, salen en la pestaña **Pizarra** bajo «Notas anteriores».

## Dónde vive cada dato

```
sesiones/{sid}/pizarra/{id}       Registro permanente (solo consultores)
en_vivo/{token}/pizarra/{id}      Durante la reunión: todos los del enlace leen y agregan
compartidos/{token}/pizarra/{id}  Copia publicada: se lee con el enlace de resultados
```

Cada comentario: `{autor, rol: 'consultor'|'cliente', email? (solo consultor), cargo?, foto? (solo consultor), qid: 'general' | id de pregunta, texto, imgs: [JPEG data URL], adjuntos: [{n: nombre, t: tipo, z: bytes, p: partes}], creadoEn}`.

El **contenido de un documento** no va en el comentario: se parte en trozos de 700.000 caracteres (base64) guardados en `…/pizarra/{id}/partes/{adjunto}_{parte}` (un archivo de 5 MB son 10 partes). Se suben **antes** de crear el comentario, para que nunca se vea un comentario sin su archivo. Las mismas partes se copian a la sesión (lo que sube un cliente) y a los resultados publicados. Si una subida se interrumpe, quedan partes sueltas sin comentario: no se ven y no se pueden leer (no hay forma de listarlas), y ocupan poco. El id (20 letras/números) lo genera quien escribe, así que copiar un comentario de un lugar a otro es idempotente.

Flujo: el consultor escribe en la sesión y, si hay reunión en vivo, también en `en_vivo` (una sola operación, misma hora). Lo que escribe un cliente va a `en_vivo`; la app del consultor lo **copia a la sesión** mientras la reunión está abierta (conservando autor y hora) y una vez más al pulsar «Terminar la reunión en vivo», antes de borrar la pizarra en vivo. Si el consultor cierra la pestaña sin terminar la reunión, los comentarios del cliente se copian la próxima vez que abra esa sesión con la reunión aún vigente (12 horas).

## Seguridad (`firestore.d360.rules`)

- **Cliente (sin cuenta):** solo puede **crear** comentarios con el enlace vigente; con `rol: 'cliente'`, sin campo `email` ni `foto`, nombre de 1 a 60 caracteres, texto ≤ 2.000, ≤ 3 imágenes de ≤ 240.000 caracteres, ≤ 3 documentos de las extensiones permitidas (≤ 5 MB, ≤ 10 partes), id de 20 caracteres y hora del servidor. También puede subir las partes de sus documentos (≤ 700.000 caracteres, índice 0_0 a 2_9). No edita ni borra.
- **Consultor:** crea con `rol: 'consultor'` y el `email` de su propia cuenta (no puede firmar con otro correo); borra cualquier comentario.
- **Enlace vencido o cerrado:** el cliente deja de leer y de escribir.
- **Resultados publicados:** lectura pública por token (el token va en la ruta, no se puede leer la pizarra de otro enlace); escribe solo el consultor.
- **Límite conocido:** cualquiera que tenga el enlace en vivo (vigente, 12 horas) puede enviar comentarios con el nombre que quiera. Es la misma confianza que ya tiene el enlace de propuestas. Si un enlace se filtra, el consultor lo cierra («Terminar la reunión en vivo») y borra lo que sobre.
- Los comentarios se dibujan siempre escapados y solo se muestran imágenes JPEG válidas.

## Probar

- `npm run verificar` (sección 14): validación, escape de HTML, agrupación, reglas (forma) y que `nube.js` y `nube-prueba.js` tengan las mismas funciones.
- `node scripts/probar-reglas.mjs`: **comportamiento** de las reglas con la API de pruebas de Firebase (113 casos: cliente, consultor, cuenta no autorizada, enlace vencido, tamaños, ids, extensiones y partes de documentos, fotos, edición, borrado, lectura pública). Necesita `firebase login`. No publica nada. La API no permite fechas dentro de los datos, así que en la copia que prueba se reemplazan las dos comparaciones de hora por `true`.
- Local, sin Google: `http://127.0.0.1:<puerto>/?mock=1` (modo simulado; el enlace del cliente se abre en otra pestaña del mismo navegador).

## Archivos

| Archivo | Para qué |
|---|---|
| `public/pizarra.js` | Pantalla: hilo por pregunta, diálogo general, imágenes, nombre del cliente, copia a la sesión. |
| `public/app.js` | Funciones puras: `pzValidar`, `pzTarjeta`, `pzHtml`, `pzAgrupar`, `pzCuando`… y la pestaña Notas de los resultados. |
| `public/nube.js`, `public/nube-prueba.js` | Datos (`pz*`): Firestore y simulación local, con la misma interfaz. |
| `public/sesiones.js`, `public/vivo.js` | Integración: abrir la sesión, copiar al terminar, publicar y revocar; vista del cliente en vivo. |
| `firestore.d360.rules` | Reglas de las tres subcolecciones `pizarra`. |
