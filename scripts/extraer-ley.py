"""Genera public/ley-texto.js con el texto OFICIAL de los artículos de la Ley 19.628 tal como queda sustituida por la
Ley 21.719 (versión vigente desde el 1-dic-2026), tomado del XML de la Biblioteca del Congreso Nacional (BCN).

Uso:   python scripts/extraer-ley.py <ley19628.xml> [<ley21719.txt>]

  XML : https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=141599&idVersion=2026-12-01
  TXT : export PDF de la Ley 21.719 convertido a texto (ver docs/REVISION-LEY-21719.md); si se entrega, el script
        contrasta cada artículo contra él y avisa de cualquier diferencia.

No se reescribe ni se resume nada: solo se normalizan los saltos de línea del XML (párrafos) y se quita el «°».
"""
import html
import io
import json
import re
import sys

ORIGEN = 'https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=141599&idVersion=2026-12-01'
NORMA, NORMA_21719, VERSION = 141599, 1209272, '2026-12-01'

xml = io.open(sys.argv[1], encoding='utf-8').read()
txt = io.open(sys.argv[2], encoding='utf-8').read() if len(sys.argv) > 2 else None

# Artículos que no se incluyen: tratamiento por órganos públicos (20-24), organización interna de la Agencia (29 a 32 bis)
# y responsabilidad de funcionarios públicos (44-46). No aplican a empresas privadas, el archivo baja de 150 a ~115 KB
# (el servidor de vista previa y las redes móviles lentas lo agradecen) y verificar.mjs exige que todo artículo que la
# aplicación cite exista, así que si alguna pregunta futura cita uno de estos basta con quitarlo de esta lista.
OMITIR = {'20', '21', '22', '23', '24', '29', '30', '30 bis', '30 ter', '30 quáter', '30 quinquies', '30 sexies',
          '30 septies', '30 octies', '30 nonies', '31', '32', '32 bis', '44', '45', '46'}

SUF = r'(?:bis|ter|qu[aá]ter|quinquies|sexies|septies|octies|nonies|decies)'
cab = re.compile(r'^Art[ií]culo\s+(\d+)\s*[°º]?(?:\s+(' + SUF + r'))?\s*\.-\s*', re.I)

arts, orden = {}, []
for m in re.finditer(r'<EstructuraFuncional ([^>]*)>\s*<Texto>([\s\S]*?)</Texto>', xml):
    attrs, cuerpo = m.group(1), html.unescape(m.group(2))
    if 'tipoParte="Art&#237;culo"' not in attrs or 'transitorio="no transitorio"' not in attrs:
        continue
    id_parte = int(re.search(r'idParte="(\d+)"', attrs).group(1))
    lineas = cuerpo.split('\n')
    # un párrafo nuevo empieza con sangría (≥3 espacios); las líneas sin sangría continúan el párrafo anterior
    pars = []
    for ln in lineas:
        if not ln.strip():
            continue
        if re.match(r'^\s{3,}\S', ln) or not pars:
            pars.append(ln.strip())
        else:
            pars[-1] += ' ' + ln.strip()
    pars = [re.sub(r'\s+', ' ', p) for p in pars]
    c = cab.match(pars[0])
    if not c:
        print('SIN CABECERA:', pars[0][:80])
        continue
    clave = c.group(1) + (' ' + c.group(2).lower().replace('quater', 'quáter') if c.group(2) else '')
    if clave in OMITIR:
        continue
    resto = pars[0][c.end():]
    # el título es la primera oración ("Deber de información y transparencia."); lo demás es el inicio del texto
    t = re.match(r'^(.*?[^\s.])\.(?:\s+|$)', resto)
    titulo = t.group(1) if t else resto
    primero = resto[t.end():] if t else ''
    cuerpo_pars = ([primero] if primero else []) + pars[1:]
    arts[clave] = {'id': id_parte, 't': titulo, 'p': cuerpo_pars}
    orden.append(clave)

# ───── contraste contra el texto de la Ley 21.719 (otra fuente, otro formato) ─────
if txt:
    limpio = re.sub(r'Ley 21719\s*\nBiblioteca del Congreso Nacional[^\n]*\n(?:Biblioteca del Congreso Nacional[^\n]*\n)?', '\n', txt)
    limpio = re.sub(r'Biblioteca del Congreso Nacional[^\n]*\n(?:página \d+ de \d+)?', '\n', limpio)
    limpio = re.sub(r'página \d+ de \d+', ' ', limpio)
    plano = lambda s: re.sub(r'[\s"“”«»\'°º]+', '', s).lower()
    base = plano(limpio)
    malos = []
    for k in orden:
        a = arts[k]
        # el cuerpo íntegro del artículo debe aparecer tal cual en la Ley 21.719
        cuerpo = plano(' '.join(a['p']))
        if cuerpo not in base:
            malos.append(k)
    print('Contraste con la Ley 21.719: %d/%d artículos idénticos' % (len(orden) - len(malos), len(orden)))
    # La Ley 21.719 solo modifica por partes los arts. 2, 17, 18 y 19 (no los reproduce completos): para ellos la
    # versión consolidada de la BCN es la única fuente íntegra. Cualquier otra diferencia hay que revisarla a mano.
    esperadas = {'2', '17', '18', '19'}
    if set(malos) - esperadas:
        print('  DIFIEREN SIN EXPLICACIÓN (revisar a mano):', ', '.join(sorted(set(malos) - esperadas)))
        sys.exit(1)
    print('  no reproducidos completos en la Ley 21.719 (solo en la consolidada):', ', '.join(sorted(set(malos))))

# ───── salida ─────
#   o = orden del articulado (las claves numéricas de un objeto JS se reordenan solas, por eso va aparte)
salida = {'v': VERSION, 'n': NORMA, 'n21': NORMA_21719, 'o': orden, 'a': arts}
js = ('/* Texto oficial de los artículos de la Ley 19.628 sustituida por la Ley 21.719 (versión vigente desde el '
      '1-dic-2026).\n   Fuente: Biblioteca del Congreso Nacional, ' + ORIGEN + '\n'
      '   Generado por scripts/extraer-ley.py: no editar a mano. */\n'
      'window.LEY=' + json.dumps(salida, ensure_ascii=False, separators=(',', ':')) + ';\n')
io.open('public/ley-texto.js', 'w', encoding='utf-8', newline='\n').write(js)
print('artículos:', len(arts), '· bytes:', len(js.encode('utf-8')))
print('claves:', ', '.join(orden))
