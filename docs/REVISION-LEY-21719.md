# Revisión del D360° contra la Ley 21.719

Cruce de las preguntas, explicaciones, semáforo y plan de acción contra el **texto oficial** de la Ley 21.719 (Biblioteca del Congreso Nacional, versión vigente al 1-dic-2026, `idNorma=1209272`). Cada afirmación legal de la app cita su artículo.

## 1. Errores corregidos

| Dónde | Decía | Ahora |
|---|---|---|
| ARC-01, ARC-01b, plan de acción | "5 derechos", "15 días hábiles" | **6 derechos** (art. 4); **30 días corridos**, prorrogables una vez por 30 (art. 11) |
| GOB-05 | El art. 14 impone deberes de información, seguridad y confidencialidad; designar responsable | Esos deberes son los arts. 14 ter, 14 quinquies y 14 bis. El delegado es **voluntario** (arts. 49 y 50) |
| GOB-01b | "Plan para designar antes del 1/12/2026" | No hay plazo legal; ahora pregunta por funciones, medios y autonomía (art. 49 b y art. 50) |
| REG-01 y semáforo | "Registro de actividades de tratamiento" como obligación del art. 14 ter | La ley **no lo exige**; se mantiene como buena práctica que sustenta los arts. 14 ter, 15 ter y 49 |
| REG-02 | "Art. 14 ter lit. e)" para retención | Es la lit. i) y el principio de proporcionalidad (art. 3 c) |
| RIE-02 | Multas "de 5.000 a 10.000 UTM para gravísimas"; la Agencia "ordena el cese" | Leves 5.000, graves 10.000, gravísimas **20.000 UTM** (art. 35); suspensión hasta 30 días solo por gravísimas reiteradas (art. 38) |
| SEN-01 | Lista de datos sensibles | Agrega **situación socioeconómica**, creencias religiosas y afiliación gremial (art. 2) |
| SEG-02b | Brechas de sensibles se avisan a la Agencia y a los titulares | A la Agencia toda vulneración con riesgo razonable; a los titulares solo si son sensibles, de menores de 14 años o económicos/comerciales (art. 14 sexies) |
| SEN-01b / SEN-02 | Consentimiento "escrito" | Escrito, verbal o medio tecnológico equivalente (art. 16); se incluyen las excepciones |
| RIE-03 | "Supervisión independiente" en el art. 49 | Sanciones internas, reporte, contratos o reglamento interno; la certificación es del art. 51 y atenúa (art. 36) |
| CUL-06 | Capacitación atribuida al art. 14 bis | La ley no exige capacitar; el art. 14 bis exige medidas para el deber de secreto. Se rotula como buena práctica |

Las preguntas condicionales "¿Sabe que…?" medían conocimiento y no cumplimiento; se reescribieron como preguntas de práctica (GOB-01b, LEG-01b, ARC-01b, REG-01b, SEG-02b, TER-01b).

## 2. Preguntas nuevas (13)

| ID | Tema | Artículos |
|---|---|---|
| ARC-04 | Bloqueo temporal (2 días hábiles) | 8 ter, 11 |
| ARC-05 | Rectificar y suprimir en todos los sistemas, y avisar a terceros | 6, 7, 11 |
| ARC-06 | Respuesta escrita con respaldo, rechazos fundados, gratuidad | 10, 11, 41 |
| ARC-07 | Decisiones automatizadas y perfiles | 8 bis, 14 ter l) |
| LEG-04 | Nuevos usos y cesiones: nuevo consentimiento o base legal | 3 b), 15 |
| LEG-05 | Datos económicos, financieros y comerciales | 13 a), 17 a 19 |
| REG-04 | Información pública exigida (transparencia) | 14 ter |
| REG-05 | Calidad de los datos | 3 d), 14 c) |
| SEG-04 | Privacidad desde el diseño y por defecto | 14 quáter |
| SEG-05 | Restauración de datos y pruebas periódicas de seguridad | 14 quinquies b) a d) |
| TER-04 | Transferencias internacionales | 27, 28, 14 ter h) |
| SEN-04 | Niños, niñas y adolescentes | 16 quáter |
| SEN-05 | Biometría y geolocalización | 16 ter, 16 sexies |

La app pasa de 32 a **45 preguntas** (37 base + 8 de profundización). Las dimensiones siguen siendo 8; se renombraron tres para reflejar su contenido: *Derechos del Titular*, *Registro y Transparencia* y *Terceros y Transferencias*. (Registro histórico: desde el 2026-10-21 las dimensiones y sus nombres son los del sitio, ver `METODOLOGIA.md`.)

## 3. Cambios de comportamiento

- **Semáforo por obligación.** Antes cada obligación tomaba el promedio de toda su dimensión; ahora se calcula con las preguntas que la evalúan (`qs` en `CL`). Son 27 obligaciones, cada una con su artículo. Una obligación sin respuestas muestra "Sin datos".
- **Plan de acción** actualizado con las acciones de los temas nuevos.
- **Clave de almacenamiento** `d360v2` → `d360v3`: los avances guardados en el navegador con la versión anterior no se mezclan con las preguntas reescritas.
- **Portada:** tiempo estimado "~20 minutos".
- **Ejemplo asociado a cada respuesta.** Cada una de las 4 respuestas de cada pregunta tiene un botón «Ejemplo» que abre un globo anclado a esa respuesta, con el ejemplo de esa situación solamente (un caso real y concreto de cómo se ve esa respuesta, con el color de su nivel). El globo de la respuesta correcta agrega «Cómo comprobarlo». Se cierra con la X, la tecla Esc o un clic fuera. Los textos están en los campos `ex` (uno por respuesta, 180 en total) y `ev` de cada pregunta en `public/app.js`.
- **Color del nivel en toda la pantalla.** Mientras se responde y en los resultados, el fondo de toda la pantalla y la línea del encabezado fijo toman el color del nivel (rojo, naranja, ámbar, teal, verde) y cambian con una transición cuando se sube o baja de nivel. Si el panel de nivel sale de la pantalla al hacer scroll, aparece una barra flotante bajo el encabezado con el nivel, el porcentaje, la dimensión en la que se va, la pregunta actual y la escala. Al imprimir el fondo siempre es blanco.
- **Referencias a artículos explicadas.** La etiqueta de cada pregunta muestra su tema (la obligación del semáforo) junto a los artículos, y cuando la referencia usa un sufijo latino (bis, ter, quáter, quinquies, sexies…) aparece el botón «¿Qué significa «ter»?» con la explicación: son los artículos que la ley agregó entre los existentes, sin renumerar los demás (16 ter = tercer artículo con el número 16). Las pestañas Brechas y Semáforo repiten la nota.
- **Informe en PDF corregido.** "Descargar PDF" usa la impresión del navegador. Antes, el informe salía con 11 páginas de las cuales 9 en blanco: las pestañas Brechas, Plan, Semáforo y Alertas tenían una animación que parte con opacidad 0 y, al mostrarse todas juntas para imprimir, quedaban invisibles. Ahora se anulan las animaciones al imprimir y el informe tiene 8 páginas con todo el contenido. Además: encabezado con empresa, sector, tamaño y fecha; pie con el alcance (autoevaluación referencial, no es asesoría legal); radar y tarjetas más compactos; semáforo en dos columnas y en hoja propia; el archivo se sugiere como "Informe D360 - <empresa> - <fecha>"; y un aviso junto al botón para elegir «Guardar como PDF».
- Los temas "no aplica" se resuelven como en el original (la opción "no trato esos datos" vale 3), para no penalizar a quien no los trata.

## 4. Pendiente de validar con asesoría legal

- Pesos (`w`) y banderas rojas de las preguntas nuevas: son una propuesta.
- Qué temas se rotulan como "buena práctica" y no como obligación (inventario, capacitación, control de accesos).
- Los plazos del plan de acción son estimaciones internas, no plazos legales.

## 5. Verificación

```bash
npm run verificar
```

Revisa la integridad de los datos (IDs, opciones, referencias del semáforo, ejemplos y "cómo comprobarlo" de cada pregunta), que no reaparezcan los errores listados arriba, el cálculo de puntajes (todo 3 → 100, todo 0 → 0), las preguntas condicionales y el semáforo.

Estos cambios **no están publicados**: para verlos en línea hay que desplegar `public/` en Firebase Hosting (sitio `d360-assessment`).
