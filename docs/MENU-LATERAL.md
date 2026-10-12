# Menú lateral del consultor

Panel de vidrio flotante a la izquierda (inspirado en el diseño «Cool Sidebar Design» de Jeni Khant, Behance): marca, cuenta con foto y nombre, grupos separados por líneas que se desvanecen, insignias y una versión contraída solo con íconos.

## Qué tiene

| Grupo | Opciones |
|---|---|
| **Menú** | Sesiones · Nueva sesión |
| **Sesión · <empresa>** (solo con una sesión abierta) | Preguntas (insignia con el avance) · Índice de preguntas · Resultados · Hoja de ruta (insignia con las iniciativas) · Evolución (revisiones) · Pizarra (comentarios) · Reunión en vivo / Invitar al cliente (punto verde si hay alguien conectado, ámbar si se espera) |
| **Entregables** | Compartir con el cliente · Informe ejecutivo · Acta de la reunión · Informe técnico (PDF) · Cómo se calcula |
| **Pie** | Cambiar tema · Cerrar sesión |

La cuenta (foto, nombre, correo) está arriba; al pulsarla se despliega el correo. La opción donde está el consultor se marca (`aria-current`). Resultados, Hoja de ruta, Evolución y los documentos se desactivan mientras no haya respuestas.

## Cómo se comporta

- **Escritorio (≥ 1100 px):** el menú queda fijo y el contenido se corre para dejarle lugar. El botón de la esquina superior lo contrae a una columna de íconos (cada ícono conserva su nombre accesible y su indicación al pasar el cursor); la elección se recuerda en el equipo (`d360sb`).
- **Pantallas angostas:** el menú es un cajón que se abre con el botón de la barra superior; se cierra con Escape, tocando fuera o al elegir una opción. Siempre muestra los nombres.
- **Quién lo ve:** solo una cuenta de consultor, y no en el ingreso, en los avisos ni en la vista del cliente. No sale en los PDF.

## Cómo está hecho

`public/lateral.js` no tiene lógica propia: cada opción llama a funciones que ya existían (`dash`, `nueva`, `rq`, `sr`, `tix`, `pzDlg`, `vivoDlg`, `metDlg`, `cmp`, `imprimirDoc`, `pdf`, `salir`). Se actualiza en cada cambio de pantalla (`ss()` lo avisa) y cada 1,5 s para las insignias. Estilos al final de `styles.css` (`.sb-*`); marcas en `index.html` (`#sb`, `#sb-vel`, `#sb-burger`). Pruebas: sección 23 de `npm run verificar`.

Para agregar una opción: una línea en `MENU` dentro de `lateral.js` (id, ícono de Lucide, texto, función, cuándo está activa, y opcionalmente insignia o punto).
