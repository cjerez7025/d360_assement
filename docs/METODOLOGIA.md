# Metodología del D360° (cómo se calcula el resultado)

La explicación vive en la app, con los **números reales de cada sesión**: pestaña **Método** de los resultados (la ven el consultor y el cliente) y botón **Cómo se calcula** en la pantalla de preguntas (solo el consultor; el cliente en la reunión en vivo no ve niveles ni puntajes). Se genera con `metHtml()` y `metDatos()` de `public/app.js`, a partir de los mismos datos y funciones del motor, así que no puede desactualizarse sin que falle `npm run verificar` (sección 16).

## Qué dice

1. **Cada respuesta vale de 0 a 3**; cada pregunta tiene un **peso** (0,8 a 1,3).
2. **Puntaje de la dimensión** = Σ(valor × peso) ÷ Σ(3 × peso) × 100, sobre las preguntas respondidas que aplican.
3. **Puntaje global** = Σ(puntaje de la dimensión × peso de la dimensión) ÷ Σ(100 × peso de la dimensión) × 100. Una dimensión sin respuestas cuenta como 0%.
4. **Niveles:** 0–20 Sin protección, 21–40 Reactivo, 41–60 En desarrollo, 61–80 Gestionado, 81–100 Optimizado.
5. **Lo que no cambia el puntaje:** banderas rojas, semáforo por obligación, plan de acción (dimensiones bajo 80%: Crítico ≤ 30, Alto ≤ 55, Medio) y preguntas de profundización (aparecen si la respuesta a otra es menor a 2; si no aparecen, no cuentan).
6. **Tabla con el cálculo de la sesión:** por dimensión, peso, preguntas que aplican y respondidas, puntos obtenidos y máximos, puntaje y **aporte al puntaje global** (los aportes suman el global sin redondear).

## El rubro y el tamaño de la empresa

**Hoy no modifican el puntaje ni el nivel.** Se usan solo para identificar a la organización (perfil, encabezado del informe, correo). La prueba 16 lo verifica: con las mismas respuestas, el puntaje, el nivel, las banderas, el semáforo, el plan y las preguntas son idénticos para cualquier rubro y tamaño. **Si el motor empieza a usarlos, esa prueba falla** y hay que actualizar la sección 6 de `metHtml()`.

Para la ley sí importan (texto oficial verificado):

- **Art. 14 septies:** los estándares mínimos de los deberes de información (art. 14 ter) y de seguridad (art. 14 quinquies) se determinan considerando el tipo de dato, si el responsable es persona natural o jurídica, el tamaño (categorías de la Ley 20.416), **la actividad que desarrolla** y el volumen, naturaleza y finalidades de los datos. Los fija la Agencia mediante instrucción general.
- **Artículo sexto transitorio:** durante los primeros doce meses desde la vigencia, a las empresas de menor tamaño la Agencia podrá aplicarles una amonestación por escrito como sanción.

Hoy el modelo no traduce eso en pesos ni en preguntas; lo lee el consultor al revisar el plan de acción. Diseñar un efecto del rubro (por ejemplo, más peso a datos sensibles en salud) es una decisión de metodología que cambiaría los puntajes y debe definirse con criterio de AlignData.

## Lo que el repositorio no documenta

El origen de los pesos (0,8 a 1,3 por pregunta; 1,0 a 1,2 por dimensión) y de los umbrales de nivel no está escrito en el repositorio. El texto de la app los presenta como «parámetros del modelo D360° de AlignData», sin atribuirlos a un estándar externo. Si existe una base (marco, criterio experto, calibración), conviene agregarla a la sección «Cómo interpretar el resultado».

## Archivos

| Archivo | Para qué |
|---|---|
| `public/app.js` | `metDatos(e)`, `metHtml(e)`, `metDlg()`; la pestaña `t7` en `sr()`. |
| `public/index.html`, `public/styles.css` | Botón `#bmet`, diálogo `#dlg-met`, estilos `.met-*`; la pestaña no sale en el PDF. |
| `scripts/verificar.mjs` | Sección 16. |
