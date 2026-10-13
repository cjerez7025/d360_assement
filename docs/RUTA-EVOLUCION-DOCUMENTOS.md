# Hoja de ruta, evolución en el tiempo, informe ejecutivo y acta

Código en `public/ruta.js` (se carga después de `app.js`); pruebas en la sección 20 de `npm run verificar`.

## Hoja de ruta por etapas (pestaña «Hoja de ruta»)

Convierte cada brecha (pregunta respondida con menos de 3) en una **iniciativa**, con tres datos:

- **Beneficio** = puntos de puntaje global que se ganan al llevar esa pregunta a 3, con los pesos de la sesión (incluidos rubro y tamaño). La suma de todos los beneficios más el puntaje actual sin redondear da exactamente 100 cuando todo está respondido (lo comprueba una prueba). Es «alto» desde 1 punto (`RT_ALTO`).
- **Esfuerzo** (`EF` en `ruta.js`): 1 bajo (días), 2 medio (semanas), 3 alto (meses) por pregunta. **Criterio inicial de AlignData, sujeto a revisión.**
- **Hoy / primer paso / meta**: salen de las respuestas de la propia pregunta (la respuesta actual, la siguiente y la de nivel 3). No hay contenido nuevo que revisar legalmente.

Etapas (estilo «debe / debería / podría / después»): **1 Hacer primero** (alerta crítica, o beneficio alto con esfuerzo bajo o medio), **2 Planificar** (beneficio alto, esfuerzo alto), **3 Aprovechar** (beneficio menor, esfuerzo bajo), **4 Después** (el resto). Los plazos (antes del 1-dic-2026; primeros 3, 6 y 12 meses de vigencia) son una propuesta de orden, no una exigencia legal. Para cada etapa se muestra el puntaje estimado al terminarla. Las preguntas sin responder no entran.

Para cambiar los parámetros: editar `EF`, `OLAS` o `RT_ALTO` y subir `RT_V`. El nombre que se muestra es «etapa»; internamente el campo se sigue llamando `ola` (`OLAS`, `item.ola`, `tareas[].ola`) para no tocar datos ya guardados ni las reglas de Firestore.

## Evolución en el tiempo (pestaña «Evolución»)

El consultor guarda una **revisión** (diagnóstico inicial, 3, 6 o 12 meses, u otra) desde la pestaña: queda una foto de las respuestas y del perfil de ese día, con su fecha. Después edita las respuestas para reflejar los avances y guarda la siguiente. Los resultados y la hoja de ruta siempre usan las respuestas actuales.

- Las revisiones se **recalculan con el modelo vigente** (no se usa el puntaje guardado), así que siguen siendo comparables si el modelo cambia.
- La tabla replica la hoja «Seguimiento» del Assessment: índice 0–4 por dimensión en cada revisión, objetivo 3,0, variación y estado (Pendiente, En avance, Meta alcanzada desde 75 %, Retroceso, Sin cambio), más un gráfico del puntaje global. Se agrega el punto «Actual» si las respuestas cambiaron desde la última revisión.
- Se guardan hasta 24 por sesión. Se publican con los resultados, así que el cliente ve la evolución.

Dónde viven: `sesiones/{id}.revisiones` (lista) y `compartidos/{token}.revisiones` (misma forma: `{id, e, f, a, p, g, n}`). Las reglas de `compartidos` permiten el campo `revisiones` (lista de hasta 24). **Hay que desplegar las reglas antes de publicar sesiones con revisiones:** `npx firebase-tools deploy --only firestore:d360`.

## Informe ejecutivo y acta (botones en los resultados)

Documentos para imprimir o guardar como PDF (`imprimirDoc`): se arman en un contenedor oculto (`#doc`) y, al imprimir, solo se ve ese documento (clase `imp-doc` en `<body>`). No cambian el PDF técnico existente, que sigue en 8 páginas.

- **Informe ejecutivo** (3–4 páginas): portada, resumen con nivel, puntaje, índice y obligaciones que cumplen, resultado por dimensión, alertas críticas, hoja de ruta (hasta 5 iniciativas por etapa), evolución si hay revisiones, alcance y límites, próximos pasos.
- **Acta de la reunión**: participantes (desde la pizarra), resultado, comentarios y acuerdos generales, cada respuesta elegida con sus comentarios (autor y fecha) y adjuntos, compromisos de la Etapa 1 y líneas de firma.

Los puede generar el consultor y el cliente (con lo publicado). Todo lo que escriben las personas se escapa antes de mostrarse.

## Qué falta validar (AlignData)

Los niveles de esfuerzo por pregunta, el umbral de beneficio alto, los plazos de las etapas y el texto de «Próximos pasos» del informe son propuestas. No se agregó contenido legal nuevo.
