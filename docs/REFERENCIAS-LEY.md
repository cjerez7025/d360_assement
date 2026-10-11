# Referencias a la ley con popup

Cada vez que el D360° cita un artículo («Arts. 14 ter y 49», «art. 3 a)»…), la cita es un botón. Al pulsarlo se abre un popup con **lo que dice la ley**, tomado del texto oficial.

## Qué ve quien lo usa

- El **artículo completo**, con su título y su texto literal (sin resumir).
- La **letra citada resaltada** («Citado») y el texto desplazado hasta ella: en «art. 14 ter i)» el popup baja solo hasta la letra i).
- **Atajos**: chips con los demás artículos de la misma pregunta («Artículos relacionados») y, en artículos largos, chips por cada letra («Ir a la letra: a) b) c)…»).
- **Enlaces**: «Ver este artículo en la BCN» (abre la ley en ese artículo), «Ley 21.719 completa» y «Copiar cita» (deja en el portapapeles «Art. 14 ter, letra a), Ley 19.628 (texto sustituido por la Ley 21.719) — enlace»).

Funciona en los tres lugares donde se muestra una referencia: la pregunta («Por qué se pregunta esto», tanto la etiqueta como las citas dentro de la explicación), los resultados (brechas, plan de acción) y la vista del cliente en la reunión en vivo. En el PDF las referencias se ven como texto normal.

## Por qué los artículos son de la Ley 19.628

La Ley 21.719 no numera sus artículos del 1 al 55: su «Artículo primero» **sustituye el texto completo de la Ley 19.628**, y esa ley (ya modificada) es la que tiene los artículos «14 ter», «49», etc. Por eso:

- el texto del popup viene de la **Ley 19.628 consolidada vigente desde el 1-dic-2026** (idNorma 141599), que la BCN publica con cada artículo por separado;
- el enlace «Ver este artículo en la BCN» usa `https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01&idParte=<id>`, donde `idParte` es el identificador de ese artículo. El orden de los parámetros importa: con `idParte` antes que `idVersion` la BCN a veces deja la página al final del texto;
- hasta el 1-dic-2026 la BCN muestra un aviso de «versión no vigente» al abrir el artículo; el popup lo avisa (solo hasta esa fecha).

## Archivos

| Archivo | Para qué |
|---|---|
| `public/ley-texto.js` | Texto oficial (≈117 KB) y `idParte` de cada artículo. **Generado: no editar a mano.** Se descarga solo la primera vez que se abre un popup. |
| `public/ley.js` | El popup (diálogo, atajos, resaltado de letras, enlaces). |
| `public/app.js` | `citasLey`, `leyTokens`, `refLey`, `leyRel`: detectan «art. 14 ter a)», «Arts. 4 a 11», «34-39», «b) a d)»… y las convierten en botones. |
| `public/index.html`, `public/styles.css` | `<dialog id="dlg-ley">` y estilos `.ref`, `.ley-*`. |
| `scripts/extraer-ley.py` | Genera `ley-texto.js` desde el XML de la BCN y lo contrasta con el texto de la Ley 21.719. |

## Actualizar el texto de la ley

Si la ley cambia (otra versión en la BCN) o una pregunta cita un artículo que no está:

```bash
curl -o ley19628.xml "https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=141599&idVersion=2026-12-01"
python scripts/extraer-ley.py ley19628.xml ley21719.txt   # el .txt (opcional) es el PDF de la Ley 21.719 convertido a texto
```

El script contrasta cada artículo con la Ley 21.719 y avisa de cualquier diferencia. Los arts. 2, 17, 18 y 19 no se pueden contrastar porque esa ley solo los modifica por partes (para ellos la versión consolidada de la BCN es la única íntegra).

Para mantener el archivo liviano se omiten los artículos que no aplican a empresas privadas (órganos públicos 20 a 24, organización de la Agencia 29 a 32 bis, responsabilidad de funcionarios 44 a 46); la lista está en `OMITIR` dentro del script.

## Pruebas (`npm run verificar`, sección 12)

- Cada artículo y cada letra que cita cualquier pregunta, obligación o dimensión **existe** en el texto oficial (una cita a «art. 14 ter z)» o a un artículo omitido hace fallar la verificación).
- `refLey` no altera el texto original (quitadas las etiquetas, queda igual) y no genera botones anidados.
- Datos clave del texto oficial: art. 4 (6 derechos), art. 11 (30 días corridos), art. 35 (5.000 / 10.000 / 20.000 UTM), art. 50 (delegado voluntario), art. 14 ter (letras a a l).
- El enlace a la BCN lleva `idNorma`, `idVersion` e `idParte`; los enlaces externos llevan `rel="noopener noreferrer"`; el texto de la ley no se carga con la página.

## Al agregar una pregunta

Escriba la referencia con el formato habitual: «Art. 14 ter a)», «Arts. 3 a), 12 y 13», «Arts. 4 a 11». Ponga **siempre el paréntesis** después de la letra («3 a)», no «3 a»). Si cita un artículo que no está en `ley-texto.js`, la verificación lo dirá.

## Trampa de la vista previa local

El servidor de vista previa del navegador integrado se cuelga con archivos de más de ~130 KB (el servidor en sí responde bien, p. ej. con `curl`). Por eso `ley-texto.js` se mantiene bajo ~120 KB. En Firebase Hosting no ocurre.
