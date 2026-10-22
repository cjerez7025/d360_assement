# Glosario de protección de datos

Glosario público con los términos más importantes de la Ley 21.719 y del D360°, explicados en palabras simples. Se comparte **un solo enlace**
con todo el contenido, y además las palabras del glosario que aparecen en el cuestionario se subrayan con puntos y muestran su significado.
Código: `public/glosario.js` (datos, página y subrayado) y las reglas `.gl-*` de `public/styles.css`.

## El enlace

`https://d360-assessment.web.app/?glosario=1`

- **Es público**: no pide ingreso, no usa Firebase y no guarda nada. `sesiones.js` no arranca la sesión cuando la dirección trae `?glosario=1`.
- El consultor lo comparte desde el menú lateral, **Glosario para compartir**: copia el enlace o lo envía por WhatsApp con un mensaje ya redactado.
- No hay enlaces por término. (`?glosario=1#dpo` sigue funcionando: lo usa el globito «Ver en el glosario», pero no se ofrece para compartir.)
- La guía previa para el cliente (`?guia=1`) y cada pregunta (junto a «¿Por qué se pregunta esto?») enlazan al glosario completo, en otra pestaña.

## La página: pestañas, lista y ficha

- **Pestañas por tema** (Todos + 9 temas, con el número de términos) que se recorren también con las flechas del teclado.
- **Lista a la izquierda y una sola ficha a la derecha**: se cambia de término sin bajar ni subir. En «Todos» la lista va por orden alfabético, con
  una tira A–Z; en cada tema, en el orden en que conviene leerlo (en «Quién es quién», el DPO primero).
- **Buscador** (ignora tildes y mayúsculas): busca en todos los temas y muestra una lista corta de coincidencias; al elegir una se abre su ficha.
- **En el celular** se ve la lista y, al elegir un término, la ficha con un botón «Volver a la lista».
- La ficha trae: **en palabras simples**, **qué dice la ley** (los artículos son botones que abren el texto oficial, igual que en la aplicación),
  un **ejemplo** y **ver también**.

## Palabras subrayadas en el cuestionario

`glosarioMarcar()` recorre el texto de la pantalla y subraya con **puntos** las palabras del glosario. Al pasar el cursor (o enfocar con el
teclado, o tocar en el celular) aparece un globito con el significado simple y el enlace «Ver en el glosario →».

- Dónde: la pregunta del consultor (`rq` en `app.js`), la pregunta en la reunión en vivo (`vivo.js`) y la guía previa (`guia.js`).
- **Una sola vez por pantalla** (la primera, en el orden en que se lee: título, respuestas y recuadros «por qué»), para no llenar el texto de subrayados.
  En la guía, una vez por pregunta.
- No se tocan botones, enlaces, citas de la ley ni campos. En el celular, tocar la palabra abre el globito sin elegir la respuesta.
- Cada término trae sus patrones en `m` (`~` = cualquier terminación). Se probó contra todas las preguntas del diagnóstico y se quitaron los que se
  parecían pero significaban otra cosa (por ejemplo, «perfiles de acceso», «respaldo de una respuesta», «certificados de asistencia»).

## Qué contiene (81 términos, 9 temas)

Quién es quién (DPO, responsable, encargado, titular, Agencia, a quién se aplica la ley) · Tipos de datos (dato personal, sensible, biométricos, niños y
adolescentes, salud, geolocalización, deudas, infracciones, fuentes públicas, base de datos, dato estadístico y caduco, anonimización, seudonimización, perfiles) ·
Tratar datos con licitud (tratamiento, principios, consentimiento, base de licitud, interés legítimo, finalidad, proporcionalidad, calidad, cesión,
almacenamiento, eliminación, fines estadísticos y científicos) · Derechos de las personas (ARCOP, acceso, rectificación, supresión, oposición, portabilidad,
bloqueo, plazo de respuesta, reclamo ante la Agencia) · Deberes de la organización (transparencia, secreto, diseño y defecto, EIPD, programa de cumplimiento,
mapa de datos, estándares diferenciados, certificación) · Seguridad e incidentes (medidas, cifrado, control de acceso, doble factor, respaldo, parches,
registro de accesos, vulneración) · Proveedores y transferencias (ATD/DPA, subcontratación, transferencia internacional) · Autoridad y sanciones (la ley,
infracciones y multas, UTM, procedimiento sancionatorio, sanciones accesorias, prescripción, indemnización, registro nacional, vigencia) ·
Términos del D360° (modelo, dimensión, madurez, riesgo, brecha, alerta crítica, evidencia, semáforo, hoja de ruta, beneficio y esfuerzo, tablero).

## Reglas para agregar o cambiar un término

1. Se edita el arreglo `GLOSARIO` de `public/glosario.js`: `id` (minúsculas con guiones, único), `t`, `n`, `c` (tema), `d`, `l`, `ej`, y opcionalmente
   `s` (siglas), `m` (patrones para subrayarlo en el cuestionario), `k` (palabras que también lo encuentran en el buscador), `rel` (ver también), `bp`.
2. **Lo que dice la ley se verifica contra el texto oficial** (`public/ley-texto.js`). Las pruebas (`npm run verificar`, sección 33) comprueban que
   cada artículo y cada letra citados existen, y que las cifras repetidas (multas, plazos, edades, prescripción…) coinciden con el texto.
3. Si la ley **no define** el término (RBAC, «mapa de datos», UTM, cifrado, doble factor…), se marca con `bp: true` («No definido en la ley») y el texto
   de ley solo dice con qué artículos se relaciona. No se atribuye a la ley lo que no dice.
4. Los términos del D360° (modelo, madurez, riesgo, etapas, alerta crítica) deben coincidir con la aplicación: la prueba lo comprueba.
5. No se usan `<`, `>`, `&` ni comillas rectas en los textos (la ley se dibuja sin escapar): se usan «comillas angulares».
6. Para un patrón nuevo en `m`: sin grupos de captura, y cuidado con los plurales (`digital(?:es)?`, no `digitales?`). Conviene probarlo con el texto de
   todas las preguntas antes de publicarlo, para que no marque palabras que solo se parecen.

## Pendiente

- **Revisión legal de Ale Yevilaf** (única revisora legal) antes de difundirlo a clientes. El contenido se verificó contra el texto oficial,
  pero la redacción «en palabras simples» y los ejemplos no han tenido revisión jurídica.
- Los ejemplos son ilustrativos y no usan datos de clientes reales.
