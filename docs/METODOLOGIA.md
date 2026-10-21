# Metodología del D360° (cómo se calcula el resultado)

La explicación vive en la app, con los **números reales de cada sesión**: pestaña **Método** de los resultados (la ven el consultor y el cliente) y botón **Cómo se calcula** en la pantalla de preguntas (solo el consultor; el cliente en la reunión en vivo no ve niveles ni puntajes). Se genera con `metHtml()` y `metDatos()` de `public/app.js` a partir de los mismos datos y funciones del motor; la sección 16 de `npm run verificar` comprueba que el texto coincide con el cálculo.

## Modelo: 8 dimensiones y 49 preguntas

El modelo tiene **8 dimensiones** (las del sitio de AlignData) y **49 preguntas** (41 base y 8 de profundización). El 2026-10-12 se agregó **Cultura y formación** para alinearse con el Assessment D360° y con el plan del piloto: reúne la capacitación (`GOB-03`, que pasó de Gobernanza pero **conserva su código** para no perder respuestas guardadas) y cuatro preguntas nuevas: inducción al ingresar (`CUL-01`), conocimiento de las reglas de uso y del aviso de incidentes (`CUL-02`), reglas internas en contratos o reglamento interno con sanciones y denuncia (`CUL-03`) y recordatorios periódicos con canal de reporte (`CUL-04`). Base legal: arts. 14 bis, 14 sexies y 49 (el modelo de prevención es voluntario; las preguntas lo dicen y ninguna genera alerta crítica). Peso de la dimensión: 1,0. En la ponderación sectorial pesa más donde hay más datos y más sensibles (`SEC_DIM.cultura`). **Las preguntas nuevas necesitan revisión legal** (Ale Yevilaf). Una sesión guardada antes del cambio conserva sus respuestas y queda con las preguntas nuevas pendientes; el puntaje solo considera lo respondido dentro de cada dimensión.

**Ocho dimensiones, como en el sitio de AlignData (2026-10-21).** Los nombres, los subtítulos y el orden son los del sitio: 1 Gobierno y liderazgo (DPO, roles y comité de privacidad) · 2 Ciclo de vida del dato (mapeo y registro de tratamientos) · 3 Seguridad tecnológica (cifrado, accesos y respaldos) · 4 Cumplimiento normativo (Ley 21.719 artículo por artículo) · 5 Gestión de riesgos (DPIA y mapa de riesgos) · 6 Derechos del titular (flujos, plazos y evidencia) · 7 Gestión de terceros (contratos y subprocesadores) · 8 Cultura y formación (capacitación y mejora continua). Antes eran nueve: **«Base de Legitimación» y «Datos Sensibles» se fusionaron en «Cumplimiento normativo»** (10 preguntas base más 2 de profundización; primero las de legitimación `LEG-…` y después las de datos sensibles `SEN-…`). Los códigos de las preguntas no cambiaron, así que no se pierden respuestas ni revisiones guardadas. La fusión no cambia el cálculo en lo esencial: el nuevo bloque **pesa 2,2, la suma de los dos pesos anteriores (1,1 + 1,1)**, sus factores de exposición por rubro son la unión de los de ambas (titulares vulnerables, datos financieros, decisiones automatizadas y datos sensibles), y su plan de acción reúne los de las dos. En 400 combinaciones de respuestas, rubros y tamaños, el puntaje global cambió en promedio 0,08 puntos y como máximo 1 (por redondeo). Las demás dimensiones conservan su peso (1,0 a 1,2).

## Qué dice

1. **Cada respuesta vale de 0 a 3**; cada pregunta tiene un **peso** (0,8 a 1,3).
2. **Puntaje de la dimensión** = Σ(valor × peso) ÷ Σ(3 × peso) × 100, sobre las preguntas respondidas que aplican. **No depende del rubro.**
3. **Puntaje global** = Σ(puntaje de la dimensión × **peso aplicado**) ÷ Σ(100 × **peso aplicado**) × 100, con *peso aplicado = peso base de la dimensión × ajuste sectorial × ajuste por tamaño*. Una dimensión sin respuestas cuenta como 0%.
4. **Niveles (escala única del Assessment y del Informe Ejecutivo, de 0 a 4):** 0–20 Inexistente (riesgo crítico), 21–40 Reactivo (alto), 41–60 Parcial (medio), 61–80 Gestionado (bajo), 81–100 Optimizado (mínimo). Meta de referencia: nivel 3. **Índice 0–4** = puntaje global ÷ 25 (se muestra en los resultados).
5. **Lo que no cambia el puntaje:** banderas rojas, semáforo por obligación, plan de acción (bajo 80%: Crítico ≤ 30, Alto ≤ 55, Medio) y preguntas de profundización (aparecen si la respuesta a otra es menor a 2).
6. **Tabla con el cálculo de la sesión:** por dimensión, peso base, ajuste sectorial, ajuste por tamaño, peso aplicado, preguntas, puntos, puntaje y aporte al global.

## Ponderación por exposición sectorial (versión 1.0)

**Idea.** La ley no exige lo mismo a todos. El art. 14 septies dice que los estándares mínimos de los deberes de información (art. 14 ter) y de seguridad (art. 14 quinquies) se determinan considerando el tipo de dato, si el responsable es persona natural o jurídica, el tamaño (categorías de la Ley 20.416), **la actividad que desarrolla** y el volumen, naturaleza y finalidades de los datos; los fija la Agencia mediante instrucción general. El D360° traduce el factor «actividad» en un **ajuste de pesos, no de respuestas**.

**Método en cuatro pasos**

1. **Factores de exposición** (cada uno con su base legal): datos sensibles o especiales (arts. 16 a 16 sexies), titulares vulnerables (art. 16 quáter), volumen y masividad (art. 14 septies), terceros y transferencias (arts. 15 bis, 27 y 28), decisiones automatizadas y perfiles (art. 8 bis) y datos financieros o comerciales (arts. 17 a 19).
2. **Nivel del rubro en cada factor:** 0 bajo, 1 medio, 2 alto, con una justificación escrita para cada nivel distinto de 0 (`SEC` y `SEC_J` en `app.js`; los 11 rubros del formulario, sin «Otro»). **Banda de exposición** (`SEC_B`), según la clasificación de AlignData del *Perfil del cliente ideal* (abril 2026): **alta** = salud, finanzas/seguros/fintech y RR.HH.; **media-alta** = educación, retail/e-commerce, tecnología/SaaS y sector público/ONG; **por clasificar** = legal, construcción, alimentos y logística (rubros que agregó el modelo). `npm run verificar` exige que los niveles respeten la banda (todo rubro de exposición alta suma más que uno de media-alta, y este más que uno por clasificar). Para el sector público la ley tiene un régimen propio: el D360° mide el marco general y no lo reemplaza.
3. **Dimensiones relacionadas** (`SEC_DIM`): cada dimensión se vincula con los factores que la hacen más exigente. Ej.: Gestión de terceros ← terceros y transferencias; Cumplimiento normativo ← titulares vulnerables, datos financieros, decisiones automatizadas y datos sensibles; Seguridad tecnológica ← sensibles y volumen.
4. **Ajuste de la dimensión** = 1 + 0,25 × (promedio de los niveles de sus factores ÷ 2), entre **1,00 y 1,25**. Ej.: fintech·Gestión de terceros = 1,25; salud·Cumplimiento normativo = 1,125.

**Qué cambia y qué no.** No cambia ninguna respuesta ni el puntaje de cada dimensión (ni las banderas, el semáforo, el plan o las preguntas): cambia cuánto pesa cada dimensión en el global. Una brecha donde el rubro está más expuesto resta más; una fortaleza suma más. «Otro» o sin rubro: sin ajuste (× 1,00). El puntaje y el nivel **oficiales incluyen el ajuste**; los resultados muestran además el **puntaje sin ajuste** («Incluye la ponderación sectorial de… Sin ajuste: X%»).

**Alcance y límites**

- Los niveles por rubro y el ajuste máximo (+25%) son **criterio de AlignData, propuesta inicial v1.0 sujeta a revisión**: no son mediciones ni están calibrados con datos. La app lo dice.
- No reemplaza las instrucciones generales que dicte la Agencia sobre estándares diferenciados; cuando existan, hay que revisar esta tabla.
- Cambia el puntaje de las sesiones ya guardadas con rubro distinto de «Otro» al reabrirlas (se recalcula; las respuestas no cambian).

**Cómo cambiar los parámetros.** Editar `SEC`, `SEC_J`, `SEC_DIM`, `SEC_F` o `SEC_K` en `public/app.js` y subir `SEC_V`. La explicación en pantalla se regenera sola. `npm run verificar` exige: un rubro por cada opción del formulario, niveles 0 a 2, justificación para cada nivel medio o alto, ajustes entre 1,00 y 1,25, artículos existentes en el texto oficial, puntajes iguales a una recomputación independiente de la fórmula y que lo que dice el texto coincida con el motor.

## Ajuste por tamaño (versión 1.0)

**Idea.** El art. 14 septies manda considerar también el tamaño de la entidad (categorías de la ley 20.416) al fijar los estándares de información (art. 14 ter) y de seguridad (art. 14 quinquies), y el art. 50 pide dar al delegado de protección de datos recursos acordes al tamaño y a la capacidad económica. A mayor tamaño, mayor exigencia esperada.

**Método.**

1. **Categoría y nivel** (`TAM`): micro (1–10 empleados) 0, pequeña (11–50) 1, mediana (51–200) 2, grande (más de 200) 3.
2. **Dimensiones que lo llevan** (`TAM_DIM`): gobernanza (arts. 14 ter y 50), registro (art. 14 ter) y seguridad (art. 14 quinquies). Las demás no cambian.
3. **Ajuste** = 1 + 0,15 × (nivel ÷ 3), de **1,00 a 1,15**. Ej.: grande·seguridad 1,15; mediana·gobernanza 1,10; pequeña·registro 1,05.
4. **Se multiplica con el ajuste sectorial** (máximo × 1,25 × 1,15 = × 1,44 en una dimensión). Tampoco cambia respuestas ni el puntaje de cada dimensión; sin tamaño, o en una empresa micro, no hay ajuste. Los resultados muestran los tres puntajes: sin ajustes, solo con el rubro y con ambos (oficial).

**Límites.** La ley mide el tamaño por **ventas anuales**; el D360° lo aproxima con el **número de empleados** declarado (no hace falta cambiar el formulario ni las reglas de Firestore). Una refinación posible es agregar un campo opcional de ventas en UF. Los niveles y el +15 % son criterio de AlignData, propuesta v1.0 sujeta a revisión. Para cambiarlos: editar `TAM`, `TAM_DIM`, `TAM_K` y subir `TAM_V`.

## Lo que el repositorio no documenta

El origen de los pesos base (0,8 a 1,3 por pregunta; 1,0 a 1,2 por dimensión) y de los umbrales de nivel no está escrito en el repositorio. El texto de la app los presenta como «parámetros del modelo D360° de AlignData», sin atribuirlos a un estándar externo.

## Archivos

| Archivo | Para qué |
|---|---|
| `public/app.js` | Datos `SEC*` y `TAM*`; `secMult()`, `tamMult()`; `E2.sc()` (peso aplicado, devuelve `g`, `gs`, `gb`, `m`, `ms`, `mt`); `secNota()`; `metDatos()`, `metHtml()`, `metDlg()`; pestaña `t7`. |
| `public/index.html`, `public/styles.css` | Botón `#bmet`, diálogo `#dlg-met`, estilos `.met-*`, `.sec-n`; la pestaña no sale en el PDF. |
| `scripts/verificar.mjs` | Secciones 16 y 19. |
