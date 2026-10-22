# Glosario de protección de datos

Página pública con los términos más importantes de la Ley 21.719 y del D360°, explicados en palabras simples, para compartir su enlace
con cualquier persona (por ejemplo, un cliente que no sabe qué es un «DPO»). Código: `public/glosario.js` (datos y página) y las
reglas de estilo `.gl-*` de `public/styles.css`.

## Cómo se comparte

| Qué | Enlace |
|---|---|
| Todo el glosario | `https://d360-assessment.web.app/?glosario=1` |
| Un término | `https://d360-assessment.web.app/?glosario=1#dpo` (la parte final es el `id` del término) |

- **Es público**: no pide ingreso, no usa Firebase y no guarda nada. `sesiones.js` no arranca la sesión cuando la dirección trae `?glosario=1`.
- El consultor lo comparte desde el menú lateral, **Glosario para compartir**: elige todo el glosario o un término, copia el enlace
  o lo envía por WhatsApp con un mensaje ya redactado.
- Cada término tiene su botón **Copiar enlace**, y la cabecera tiene **Copiar enlace del glosario**.
- La guía previa para el cliente (`?guia=1`) enlaza al glosario.
- En cada pregunta del diagnóstico (consultor y reunión en vivo), junto a «¿Por qué se pregunta esto?», aparece «Glosario: DPO…» con
  los términos de esa pregunta (hasta tres, según el campo `q` de cada término) o «ver todos». Se abren en otra pestaña para no perder la sesión.

## Qué contiene (50 términos, 9 temas)

Quién es quién (DPO, responsable, encargado, titular, Agencia) · Tipos de datos (dato personal, sensible, biométricos, niños y adolescentes,
anonimización, seudonimización, perfiles) · Tratar datos con licitud (tratamiento, principios, consentimiento, base de licitud, interés legítimo,
finalidad, proporcionalidad, cesión) · Derechos de las personas (ARCOP, acceso, rectificación, supresión, oposición, portabilidad, bloqueo,
plazo de respuesta) · Deberes de la organización (transparencia, secreto, diseño y defecto, EIPD, programa de cumplimiento, mapa de datos) ·
Seguridad e incidentes (medidas, cifrado, control de acceso, vulneración) · Proveedores y transferencias (ATD/DPA, transferencia internacional) ·
Autoridad y sanciones (infracciones y multas, UTM, Registro Nacional, vigencia) · Términos del D360° (modelo, madurez, riesgo, brecha, semáforo, hoja de ruta).

Cada término trae: **en palabras simples**, **qué dice la ley** (con los artículos como botones que abren el texto oficial, igual que en la
aplicación), un **ejemplo** y **ver también**. La página tiene buscador (ignora tildes y mayúsculas) y filtro por tema.

## Reglas para agregar o cambiar un término

1. Se edita el arreglo `GLOSARIO` de `public/glosario.js`: `id` (minúsculas con guiones, único), `t`, `n`, `c` (tema), `d`, `l`, `ej`, y opcionalmente
   `s` (siglas), `k` (palabras que también lo encuentran), `q` (preguntas donde aparece), `rel` (ver también), `bp`.
2. **Lo que dice la ley se verifica contra el texto oficial** (`public/ley-texto.js`). Las pruebas (`npm run verificar`, sección 33) comprueban que
   cada artículo y cada letra citados existen, y que las cifras repetidas (multas, plazos, edades) coinciden con el texto.
3. Si la ley **no define** el término (RBAC, «mapa de datos», UTM, cifrado…), se marca con `bp: true` («No definido en la ley») y el texto de ley
   solo dice con qué artículos se relaciona. No se atribuye a la ley lo que no dice.
4. Los términos del D360° (modelo, madurez, riesgo, etapas) deben coincidir con la aplicación: la prueba lo comprueba.
5. No se usan `<`, `>`, `&` ni comillas rectas en los textos (la ley se dibuja sin escapar): se usan «comillas angulares».

## Pendiente

- **Revisión legal de Ale Yevilaf** (única revisora legal) antes de difundirlo a clientes. El contenido se verificó contra el texto oficial,
  pero la redacción «en palabras simples» y los ejemplos no han tenido revisión jurídica.
- Los ejemplos son ilustrativos y están sin cifras de clientes reales.
