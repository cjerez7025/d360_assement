# Rediseño visual del D360°

Rediseño de color, tipografía, movimiento, contraste y accesibilidad. **No cambia las preguntas, los puntajes ni el contenido legal**: solo la presentación y la forma de operar la interfaz.

## Qué se encontró

Una auditoría de contraste (WCAG 2.x) de la versión anterior encontró **16 de 32 combinaciones de color bajo el mínimo** (4,5:1 para texto, 3:1 para íconos y gráficos). Los casos más claros: texto atenuado en gris (`#8A8577`, 3,4:1), textos de estado en teal, ámbar y verde sobre blanco (2,2 a 2,5:1) y en rojo (3,8:1), botones con texto blanco sobre teal (2,5:1) y placeholders casi invisibles (2,0:1).

Otros problemas: las opciones de respuesta no se podían usar con teclado (eran `div` con `onclick`), el error del formulario era un `alert()`, el radar usaba ocho colores sin significado (y dos dimensiones tenían el mismo teal), el estado se comunicaba solo con color, había animaciones infinitas decorativas y se cargaba Bootstrap sin usarlo.

## Sistema de diseño

**Color.** Tokens semánticos en `:root` de `public/styles.css`. Cada color de estado tiene tres variantes con un rol distinto:

| Token | Para qué | Regla |
|---|---|---|
| `--lvN-ink` | texto de ese estado | ≥ 4,5:1 sobre su fondo y sobre la tarjeta |
| `--lvN-soft` | fondo de la etiqueta | — |
| `--lvN-mark` | barras, puntos, íconos | ≥ 3:1 sobre la tarjeta y sobre el riel del medidor |

Hay una única escala de estado: `lv0` rojo (inexistente / crítico) → `lv1` naranja → `lv2` ámbar → `lv3` teal → `lv4` verde (optimizado), más `lvn` neutro para «Sin datos». Se usa igual en el puntaje, las dimensiones, las brechas, el plan y el semáforo. **Nunca va solo con color:** siempre hay texto («Riesgo alto», «Cumple», «En desarrollo») y, en etiquetas y semáforo, un ícono.

La marca se mantiene: navy `#0A0F1E` y teal `#00B894`. El teal vibrante se usa para relleno (botones con texto navy, 7,5:1); el teal para texto es una variante más oscura (`--brand-ink`).

**Tema claro y oscuro.** Sigue el sistema (`prefers-color-scheme`) y hay un botón en la barra superior para elegir; la elección se guarda en `localStorage` (`d360theme`). El hero y el llamado a la acción son navy en ambos temas. Al imprimir se fuerzan siempre los colores del tema claro.

**Tipografía.** Se mantienen Outfit (títulos y cifras) y Plus Jakarta Sans (texto). Escala con tokens (`--fs-xs` 12 px a `--fs-lg` 18 px), cuerpo de 15 px, nada por debajo de 12 px en pantalla, y sin etiquetas en mayúsculas pequeñas para los campos del formulario. La cifra grande del puntaje usa números proporcionales; los tabulares solo donde hay columnas.

**Gráficos.**
- *Puntaje*: arco SVG nítido (antes un canvas borroso al imprimir) que se dibuja y cuenta hacia arriba, con una escala de 5 niveles que marca dónde está la organización.
- *Radar*: una sola serie en un solo color, más la línea del objetivo de 80 % (con leyenda). Etiquetas partidas en dos líneas para que no se corten en el celular, tooltip con el valor, resumen para lectores de pantalla y re-dibujado al cambiar el tema.
- *Dimensiones*: tarjetas con medidor y marca de objetivo; hacen de vista en tabla del radar (no depende del tooltip).
- *Brechas*: medidor por dimensión con la marca del 80 %.

**Movimiento.** Breve y con propósito: entrada de pantallas y opciones escalonadas, barras de progreso, dibujo del arco y conteo del puntaje, fundido entre pestañas. Se quitaron el pulso y el giro de 3,5 s decorativos (queda un giro lento de 9 s en el ícono de portada). Todo se anula con `prefers-reduced-motion` y al imprimir.

## Accesibilidad

- Opciones de respuesta como radios nativos (flechas, espacio) con foco visible; atajos `1`–`4` para elegir y `Enter` para continuar.
- Botones de ayuda como `<button>` con `aria-expanded`; al pasar de pregunta el foco va al título.
- Pestañas con roles ARIA y navegación con ← → Inicio Fin; contadores en Brechas, Plan y Alertas.
- Formulario con `<label for>`, campos obligatorios marcados, error en la página (`role="alert"`, `aria-invalid`) en lugar de `alert()`.
- Barras de progreso con `role="progressbar"`, enlace «Saltar al contenido», `<main>`, objetivos táctiles de al menos 44 px y modo de contraste forzado.
- Indicador «Pregunta 8 de 37» junto al porcentaje.

## Otros cambios técnicos

- Se quitó Bootstrap (no se usaba) y se fijó la versión de `lucide` (antes `@latest`).
- Los colores por dimensión (`c` en `D`) ya no se usan y se eliminaron.
- Informe PDF: sigue en 8 páginas con el mismo contenido; se agregó `fin()` para que, al imprimir, el puntaje y el radar estén en su estado final aunque aún se esté animando, y los encabezados de Brechas y Alertas empiezan hoja nueva.

## Verificación

```bash
npm run verificar
```

La sección 9 es nueva: calcula el contraste WCAG directamente desde los tokens de `styles.css` (tema claro, oscuro y superficie navy) y falla si alguien baja un color por debajo del mínimo. También revisa que existan el tema oscuro, `prefers-reduced-motion`, el foco visible, los radios, los roles de pestañas, las etiquetas del formulario, que no se use `alert()` y que el PDF fuerce el tema claro.

Revisado además a mano en el navegador (escritorio y 375 px de ancho, tema claro y oscuro) y generando el PDF con Chrome.

## Rediseño de vidrio (12-oct-2026)

Toda la aplicación adopta el lenguaje del menú lateral: **fondo** de malla de degradados (verde azulado, azul y cian) con una franja de luz; **paneles de vidrio** (translúcidos, con desenfoque, borde claro y reflejo superior) para tarjetas, preguntas, secciones de resultados, pestañas, diálogos, panel de nivel y sesiones; **botón principal** y pestaña activa con degradado verde azulado; botones secundarios de vidrio; esquinas más redondeadas (`--r:26px`); barra superior de vidrio con el color del nivel como línea de luz y, con el menú abierto, el contexto de la pantalla.

Todo sale de tokens al final de `styles.css` (`--glass-bg`, `--glass-bg-2`, `--glass-bd`, `--glass-sh`, `--glass-blur`, `--fondo-*`, `--btn-grad`), definidos para el tema claro, el oscuro por preferencia del sistema y el oscuro elegido a mano. Para cambiar la intensidad del vidrio basta ajustar esos tokens. Al imprimir se anulan (el PDF sigue en blanco) y el texto de los botones con degradado cumple el contraste (prueba en la sección 26 de `npm run verificar`).
