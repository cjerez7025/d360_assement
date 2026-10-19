# Backlog y tablero del plan

El plan de adecuación (hoja de ruta) se puede convertir en un **backlog** y, si el cliente tiene seguimiento contratado, en un **tablero kanban** donde el consultor va moviendo las tareas a medida que avanza el trabajo.

Archivo: `public/tablero.js` (carga después de `servicio.js`). Pestaña **Tablero** en Resultados y entrada «Tablero» en el menú lateral.

## Quién hace qué

| Rol | Puede |
|---|---|
| Consultor | Crear el backlog desde la hoja de ruta, agregar, editar, mover y eliminar tareas |
| Cliente (enlace de resultados) | Ver el backlog o el tablero; no mueve nada |

## Cuándo se activa cada vista

El tablero depende del servicio contratado (ver `SERVICIO.md`):

- **Con D360° Inicia (o sin servicio registrado):** el plan se ve como **backlog**, ordenado por etapas. Es lo que entrega el diagnóstico.
- **Con D360° Acompaña o Implementa activo (nivel ≥ 3):** el backlog pasa a **tablero de 5 columnas**: Backlog · Por hacer · En curso · En revisión · Hecho. Se habilitan responsable, fecha compromiso, evidencia y mover tareas.

Si el servicio deja de estar activo, el cliente vuelve a ver solo el backlog.

## El tablero (estilo Jira)

Con Acompaña o Implementa activo, el plan se ve como un tablero de Jira con carriles:

- **Columnas por estado**, todas a la vez: Backlog · Por hacer · En curso · En revisión · Hecho. Con pantalla ancha la página se ensancha para que quepan sin desplazar; en celular se apilan.
- **Un carril por etapa** (Etapa 1 · Hacer primero, etc.), con su plazo y cuántas tareas de la etapa están hechas. Cada carril se pliega con su flecha. «Sin agrupar» muestra una sola fila.
- **Tarjetas compactas:** la pregunta como título (y la meta debajo), la clave de la pregunta (por ejemplo `GOB-02`), la fecha compromiso (en rojo si venció), la fecha de término, el clip de evidencia y el avatar del responsable (iniciales y color según el nombre).
- **Avanzar una tarea:** arrastrar la tarjeta a otra columna **de su misma etapa**, usar las flechas ‹ › que aparecen al pasar el ratón (siempre visibles en pantallas táctiles) o el selector de estado (accesible con teclado). Pulsar la tarjeta abre el detalle para asignar responsable, fecha, evidencia y nota.
- **Crear una tarea** directamente en el Backlog de una etapa («+ Crear tarea»).
- **Filtros:** búsqueda (por título, pregunta, clave, responsable o dimensión), etapa, responsable (o «Sin asignar») y «Solo vencidas». Dicen «Mostrando X de Y tareas» y se quitan con un clic. No se guardan.
- **Resumen de avance:** una barra segmentada por estado, con la leyenda y las tareas vencidas.
- El cliente ve el mismo tablero en solo lectura (sin flechas, selector ni edición).

## Generar el backlog

Botón «Crear el backlog desde la hoja de ruta»: crea una tarea por cada acción de la hoja de ruta, en orden de etapa. El título es `ID de pregunta · meta`. Si la hoja de ruta cambia, «Agregar al backlog las brechas nuevas» suma solo las que aún no tienen tarea (no duplica ni toca las existentes).

## Datos de una tarea

`id`, título (≤120), estado, etapa, pregunta de origen (`qid`), responsable (≤60), fecha compromiso, fecha en que se hizo, nota interna (≤300) y evidencia (nombre ≤80 + enlace https opcional). Máximo 120 tareas por sesión.

- Pasar una tarea a «Hecho» guarda la fecha; sacarla de «Hecho» la borra.
- Una tarea con fecha compromiso pasada y sin terminar se marca **vencida**.
- Se mueve con el selector de estado de la tarjeta o arrastrando la tarjeta a otra columna.

## Qué ve el cliente (privacidad)

Al publicar, al cliente solo llegan `id, título, estado, etapa, pregunta, responsable, fecha compromiso y fecha de término`. **La nota interna y la evidencia no se publican.**

## Relación con el diagnóstico

Completar una tarea **solo registra el avance**. No cambia respuestas ni puntaje. El resumen muestra cuántos puntos globales podrían sumar las tareas hechas («confirmables»), pero el puntaje cambia únicamente cuando el consultor actualiza las respuestas y guarda una **revisión** (ver `RUTA-EVOLUCION-DOCUMENTOS.md`).

## Datos y reglas

- Sesión: campo `tareas` en el documento de la sesión.
- Publicado: `compartidos/{token}.tareas`, validado por `tareasPub()` en `firestore.d360.rules` (lista ≤ 120). Solo se permiten los campos públicos arriba descritos.
- Reglas: al cambiar `firestore.d360.rules` se despliega primero `firestore:d360` y después hosting.

## Impresión

El tablero no se imprime en el PDF (`@media print{#t11{display:none}}`); el PDF sigue llevando la hoja de ruta.

## Pruebas

- `scripts/verificar.mjs`, sección 29: normalización, publicación sin campos internos, generación desde la ruta, estados, vencidas, resumen y vistas.
- `scripts/probar-reglas.mjs`: 7 casos nuevos de `tareas` (172 en total).
- Recorrido en navegador con la versión de prueba (`?mock=1`): crear backlog, activar Acompaña, mover por selector y arrastrando, editar, publicar, vista del cliente solo lectura y sin Acompaña.
