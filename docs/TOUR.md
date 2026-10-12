# Tour guiado

Recorridos que explican la aplicación a cada perfil. Un foco resalta el elemento y una tarjeta lo describe, con «Atrás», «Siguiente» y «Saltar tour». Cada recorrido se muestra **solo la primera vez** que se entra a esa pantalla y se puede repetir cuando se quiera.

| Perfil | Recorrido | Pantalla | Pasos | Cómo se repite |
|---|---|---|---|---|
| Consultor | Panel del consultor | Sesiones | 7 | «Tour de esta pantalla» en el menú lateral |
| Consultor | Conducir la reunión | Preguntas | 7 | ídem |
| Consultor | Resultados | Resultados | 7 | ídem |
| Invitado (reunión en vivo) | Reunión en vivo | Pregunta en vivo | 7 | Botón «Tour» (brújula) de la barra superior |
| Cliente (enlace de resultados) | Sus resultados | Resultados | 6 | ídem |

## Cómo funciona

- `public/tour.js` (sin librerías ni cargas externas). Los recorridos son una lista de pasos `{sel, t, x}` en el objeto `R`: `sel` devuelve el elemento a resaltar (si no está en pantalla, el paso se salta), `t` es el título y `x` la explicación. Un paso sin `sel` es una tarjeta centrada (bienvenida y cierre).
- Arranque automático: cuando la pantalla lleva ~2 s estable, no hay un diálogo abierto (por ejemplo, el del nombre del invitado) y ese recorrido no se ha visto. Terminar o saltar lo marca como visto en el equipo (`d360tour.<recorrido>` en localStorage; si no hay almacenamiento, se muestra en cada visita).
- Para cambiar un texto: editar el paso en `R`. Si el cambio es importante, subir `V` en `tour.js` para que vuelva a mostrarse a quien ya lo vio.
- En pantallas angostas la tarjeta es una hoja en la parte baja y la página se desplaza para dejar a la vista el elemento resaltado; los pasos que apuntan al menú lateral apuntan a su botón de apertura.

## Accesibilidad

La tarjeta es un diálogo con título y descripción; anuncia «Paso N de M»; se maneja con ← →, Escape y Tab (que se queda dentro de la tarjeta); el foco vuelve al elemento anterior al cerrar; respeta «reducir movimiento»; no sale en los PDF.

## Pruebas

Sección 24 de `npm run verificar`: los cinco recorridos, que cada elemento que resaltan exista en la aplicación, que los textos coincidan con la aplicación (teclas, 5 MB, Ctrl+V, 3/6/12 meses) y la accesibilidad.
