/* glosario.js — Glosario de protección de datos (Ley 21.719) y del D360° Privacy Assessment.
   Es una página pública (?glosario=1): no pide ingreso ni usa Firebase, así que su enlace se puede compartir con cualquier persona.
   Se comparte un solo enlace con todo el glosario. Las palabras del cuestionario que son del glosario se subrayan con puntos y muestran su
   significado al pasar el cursor (glosarioMarcar). Lo que dice la ley se redacta con «Art. N», y refLey() (app.js) lo convierte en
   un botón que abre el texto oficial en el recuadro de ley.js. Los términos que la ley no define (por ejemplo, RBAC o «mapa de datos»)
   llevan la marca «No definido en la ley» (bp: true) y su texto de ley solo indica con qué artículos se relacionan.
   Cada texto de «l» se verificó contra el texto oficial (ley-texto.js). Pendiente: revisión legal de Ale Yevilaf antes de difundirlo. */

const GLO_V = '1.0';

const GLO_CATS = [
  { id: 'roles', n: 'Quién es quién', ic: 'users' },
  { id: 'datos', n: 'Tipos de datos', ic: 'database' },
  { id: 'tratamiento', n: 'Tratar datos con licitud', ic: 'scale' },
  { id: 'derechos', n: 'Derechos de las personas', ic: 'user-check' },
  { id: 'deberes', n: 'Deberes de la organización', ic: 'clipboard-check' },
  { id: 'seguridad', n: 'Seguridad e incidentes', ic: 'lock' },
  { id: 'terceros', n: 'Proveedores y transferencias', ic: 'handshake' },
  { id: 'sanciones', n: 'Autoridad y sanciones', ic: 'gavel' },
  { id: 'd360', n: 'Términos del D360°', ic: 'gauge' }
];

// id: enlace del término · t: nombre · n: nombre corto · s: siglas · k: palabras que también lo encuentran · d: en palabras simples
// l: qué dice la ley · ej: ejemplo · bp: no es un término definido en la ley · q: preguntas del diagnóstico donde aparece · rel: ver también
const GLOSARIO = [
  // ───────── Quién es quién ─────────
  {
    id: 'dpo', m: ['DPO', 'delegad[oa]s? de protección de datos(?: personales)?', 'encargad[oa]s? de prevención', 'responsable de privacidad'], c: 'roles', t: 'Delegado de protección de datos personales', n: 'DPO', s: 'DPO',
    k: 'delegado encargado de prevencion responsable de privacidad data protection officer',
    d: `Persona que lidera la protección de datos dentro de la organización: asesora, supervisa el cumplimiento de la ley y es el punto de contacto con las personas titulares y con la Agencia. La ley lo llama «delegado de protección de datos personales»; «DPO» es su sigla en inglés (Data Protection Officer).`,
    l: `Designarlo es voluntario: el responsable «podrá» hacerlo (art. 50). Lo designa la máxima autoridad de la organización (el directorio, un socio administrador o equivalente), debe tener autonomía respecto de la administración, idoneidad y conocimientos específicos, y contar con los medios y recursos suficientes para su trabajo. En las micro, pequeñas y medianas empresas, el dueño o sus máximas autoridades pueden asumir personalmente esas tareas (art. 50). Sus funciones están en el art. 50 a) a h): informar y asesorar, promover la política de datos, supervisar el cumplimiento, cuidar la formación del personal, asistir en la identificación de riesgos, desarrollar un plan anual de trabajo y rendir cuenta de sus resultados, absolver las consultas de los titulares y ser punto de contacto de la Agencia. Debe guardar estricto secreto de los datos que conozca. Designar un delegado es además uno de los elementos del programa de cumplimiento (art. 49 a)).`,
    ej: `Una pyme de 40 personas puede asignar el cargo a su gerente general o a una persona de confianza con conocimientos del tema. En una empresa mayor, a alguien del área de cumplimiento o legal con autonomía para opinar sin la presión de las áreas que usan los datos.`,
    rel: ['programa-cumplimiento', 'responsable', 'agencia']
  },
  {
    id: 'responsable', m: ['responsables? de(?: los)? datos'], c: 'roles', t: 'Responsable de datos', n: 'Responsable',
    k: 'controlador empresa organizacion',
    d: `La persona o empresa que decide para qué y cómo se tratan los datos personales. Es quien responde ante la ley, aunque los datos los maneje un proveedor.`,
    l: `Art. 2 n): toda persona natural o jurídica, pública o privada, que decide acerca de los fines y medios del tratamiento, con independencia de si los datos son tratados directamente por ella o a través de un tercero mandatario o encargado. Debe ser capaz de acreditar la licitud del tratamiento (arts. 3 a) y 13).`,
    ej: `Una tienda que recoge nombre y correo de sus clientes para enviarles ofertas es responsable de esos datos, aunque use una plataforma externa para despachar los correos.`,
    rel: ['encargado', 'titular', 'licitud']
  },
  {
    id: 'encargado', m: ['terceros? mandatarios?', 'encargad[oa]s? de(?:l)? tratamiento', 'encargad[oa]s?'], c: 'roles', t: 'Encargado de tratamiento (tercero mandatario)', n: 'Encargado',
    k: 'proveedor procesador mandatario subcontratista',
    d: `Proveedor que trata datos personales por cuenta del responsable y siguiendo sus instrucciones: por ejemplo, quien aloja la información, envía los correos o procesa las remuneraciones.`,
    l: `Art. 2 x) y art. 15 bis. Solo puede usar los datos para el objeto del encargo y no puede cederlos ni subcontratar sin autorización específica y por escrito del responsable. Si los usa para otro objeto o los cede sin autorización, se le considera responsable para todos los efectos legales y responde solidariamente por los daños. Debe cumplir los deberes de secreto y de seguridad (arts. 14 bis y 14 quinquies), reportar al responsable las vulneraciones de seguridad y, al terminar el servicio, suprimir o devolver los datos (art. 15 bis).`,
    ej: `La empresa de contabilidad externa que procesa las remuneraciones del equipo.`,
    rel: ['atd', 'responsable', 'cesion']
  },
  {
    id: 'titular', m: ['titulares?'], c: 'roles', t: 'Titular de datos', n: 'Titular',
    k: 'persona afectada interesado cliente trabajador',
    d: `La persona natural a quien se refieren los datos personales: clientes, trabajadores, postulantes, personas que visitan el sitio web.`,
    l: `Art. 2 ñ): persona natural, identificada o identificable, a quien conciernen o se refieren los datos personales. La ley regula los datos de personas naturales (art. 1): no protege los datos de una empresa en cuanto tal.`,
    ej: `Una trabajadora cuyo contrato, sueldo y datos de contacto guarda la empresa.`,
    rel: ['dato-personal', 'arcop']
  },
  {
    id: 'agencia', m: ['Agencia(?: de Protección de Datos(?: Personales)?)?'], c: 'roles', t: 'Agencia de Protección de Datos Personales', n: 'Agencia', s: 'la Agencia',
    k: 'autoridad fiscalizador regulador',
    d: `Autoridad creada por la ley para velar por su cumplimiento: atiende los reclamos de las personas, dicta instrucciones, certifica los modelos de prevención y sanciona las infracciones.`,
    l: `Art. 2 y). Vela por el efectivo ejercicio de los derechos de las personas (art. 10); a ella puede reclamar el titular cuando el responsable rechaza o no responde su solicitud (art. 11) y a ella se reportan las vulneraciones de seguridad (art. 14 sexies). Certifica y supervisa los modelos de prevención de infracciones (art. 51) y aplica las sanciones (art. 35).`,
    ej: `Si una empresa rechaza la solicitud de una clienta para que borre sus datos, ella puede reclamar ante la Agencia dentro de 30 días hábiles.`,
    rel: ['infracciones', 'vulneracion', 'programa-cumplimiento']
  },
  {
    id: 'ambito-territorial', c: 'roles', t: 'Ámbito de aplicación territorial: a quién se aplica la ley', n: 'A quién se aplica',
    k: 'extranjero empresa fuera de chile alcance aplica',
    d: `Quiénes deben cumplir la ley: no solo las empresas con sede en Chile. También las que, estando fuera, ofrecen bienes o servicios a personas que están en Chile o monitorean su comportamiento.`,
    l: `Art. 1 bis. Se aplica cuando el responsable o el encargado están establecidos en Chile; cuando un encargado, esté donde esté, trata datos por cuenta de un responsable establecido en Chile; y cuando el responsable o el encargado no están establecidos en Chile pero sus operaciones están destinadas a ofrecer bienes o servicios a titulares que se encuentran en Chile (se les cobre o no) o a monitorear su comportamiento. También se aplica a quien, sin estar establecido en Chile, queda sujeto a la ley chilena por un contrato o por el derecho internacional.`,
    ej: `Una tienda en línea con sede en el extranjero que vende a clientes en Chile debe cumplir la ley chilena.`,
    rel: ['responsable', 'encargado', 'transferencia']
  },

  // ───────── Tipos de datos ─────────
  {
    id: 'dato-personal', m: ['datos? personal(?:es)?'], c: 'datos', t: 'Dato personal', n: 'Dato personal',
    k: 'informacion persona identificable rut correo nombre',
    d: `Cualquier información que se refiere a una persona natural identificada o que se puede identificar: nombre, RUT, correo, teléfono, dirección, una fotografía, los datos de su contrato.`,
    l: `Art. 2 f): cualquier información vinculada o referida a una persona natural identificada o identificable. Es identificable la persona cuya identidad puede determinarse, directa o indirectamente, en particular mediante identificadores como el nombre o el número de cédula de identidad. Para decidirlo se consideran todos los medios y factores objetivos que razonablemente se podrían usar para identificarla en el momento del tratamiento.`,
    ej: `El correo «ana.perez@empresa.cl» es un dato personal. Una lista de compras sin nombres pero con RUT también lo es, porque el RUT identifica a la persona.`,
    rel: ['dato-sensible', 'anonimizacion', 'tratamiento']
  },
  {
    id: 'dato-sensible', m: ['datos? (?:personal(?:es)? )?sensibles?'], c: 'datos', t: 'Dato personal sensible', n: 'Dato sensible',
    k: 'salud religion sindical biometrico especial',
    d: `Datos personales especialmente delicados porque revelan aspectos íntimos de la vida de una persona. Exigen más cuidado y, por regla general, el consentimiento expreso del titular.`,
    l: `Art. 2 g): origen étnico o racial, afiliación política, sindical o gremial, situación socioeconómica, convicciones ideológicas o filosóficas, creencias religiosas, datos de salud, perfil biológico humano, datos biométricos y la información sobre la vida sexual, la orientación sexual y la identidad de género. Por regla general solo se tratan con consentimiento expreso (art. 16); los datos de salud y del perfil biológico tienen reglas propias (art. 16 bis) y los biométricos también (art. 16 ter). Tratarlos o cederlos a sabiendas contra la ley es una infracción gravísima (art. 34 quáter e)).`,
    ej: `Una licencia médica de un trabajador, su afiliación sindical o la huella digital que usa para marcar su asistencia.`,
    rel: ['biometrico', 'ninos', 'consentimiento', 'eipd']
  },
  {
    id: 'biometrico', m: ['biometr~', 'huellas? digital(?:es)?', 'reconocimiento facial'], c: 'datos', t: 'Datos biométricos', n: 'Biométricos',
    k: 'huella digital rostro voz iris reconocimiento facial',
    d: `Datos obtenidos a partir de las características físicas, fisiológicas o de conducta de una persona que permiten identificarla de forma única: la huella digital, el iris, los rasgos de la mano o del rostro y la voz.`,
    l: `Art. 16 ter. Son datos sensibles (art. 2 g)). Solo pueden tratarse con consentimiento expreso (art. 16) y entregando al titular información específica: el sistema biométrico que se usa, su finalidad, el período durante el cual se usarán los datos y cómo ejercer sus derechos.`,
    ej: `Un reloj control con huella digital o una puerta con reconocimiento facial.`,
    rel: ['dato-sensible', 'consentimiento']
  },
  {
    id: 'ninos', m: ['niños, niñas y adolescentes', 'niñ[oa]s?', 'adolescentes', 'menores de (?:edad|catorce años|14 años)'], c: 'datos', t: 'Datos de niños, niñas y adolescentes', n: 'Niños y adolescentes',
    k: 'menores de edad colegio alumnos padres representantes',
    d: `Datos de personas menores de 18 años. Su tratamiento debe respetar el interés superior del niño y su autonomía progresiva, y en muchos casos requiere la autorización de sus padres o representantes.`,
    l: `Art. 16 quáter. Son niños o niñas los menores de 14 años y adolescentes los mayores de 14 y menores de 18. Para tratar datos de niños y niñas se requiere el consentimiento de sus padres, representantes legales o de quien tiene su cuidado personal, salvo que la ley lo autorice expresamente; los datos sensibles de adolescentes menores de 16 años también lo requieren. Tratarlos infringiendo la ley es una infracción grave (art. 34 ter g)).`,
    ej: `Un colegio, un club deportivo infantil o una app que registra la edad de sus usuarios.`,
    rel: ['dato-sensible', 'consentimiento']
  },
  {
    id: 'anonimizacion', m: ['anonimiz~'], c: 'datos', t: 'Anonimización', n: 'Anonimización',
    k: 'anonimizar irreversible deja de ser dato personal',
    d: `Procedimiento irreversible que impide vincular un dato con una persona, porque se destruye el nexo que permitía identificarla. Un dato bien anonimizado deja de ser un dato personal.`,
    l: `Art. 2 k). Cuando ya no se necesitan para cumplir los fines del tratamiento, los datos deben suprimirse o anonimizarse (art. 3 c)).`,
    ej: `Una estadística de ventas por comuna, sin nombres ni RUT, en la que ya no es posible saber de qué cliente viene cada venta.`,
    rel: ['seudonimizacion', 'proporcionalidad']
  },
  {
    id: 'seudonimizacion', m: ['seudonimiz~', 'pseudonimiz~'], c: 'datos', t: 'Seudonimización', n: 'Seudonimización',
    k: 'pseudonimizacion codigo reversible',
    d: `Tratar los datos de modo que ya no puedan atribuirse a una persona sin usar información adicional que se guarda por separado y protegida; por ejemplo, reemplazar el nombre por un código. A diferencia de la anonimización, se puede revertir con esa información adicional.`,
    l: `Art. 2 l). La ley la menciona, junto con el cifrado, como una de las medidas de seguridad que se deben considerar (art. 14 quinquies a)).`,
    ej: `Una planilla de encuestas donde cada persona aparece con un código (P-0417) y la tabla que une el código con el nombre está en otro lugar, con acceso restringido.`,
    rel: ['anonimizacion', 'medidas-seguridad', 'cifrado']
  },
  {
    id: 'perfiles', m: ['elaboración de perfiles', 'perfilamiento', 'perfilado', 'decisiones automatizadas', 'tratamiento automatizado'], c: 'datos', t: 'Elaboración de perfiles y decisiones automatizadas', n: 'Perfiles',
    k: 'perfilamiento algoritmo scoring decision automatizada inteligencia artificial',
    d: `Usar datos de una persona, de forma automatizada, para evaluar o predecir cómo es o cómo se comportará: su rendimiento, situación económica, preferencias, ubicación, etc. Si una decisión que la afecta de manera importante se basa en ese tratamiento automatizado, la persona tiene derecho a oponerse.`,
    l: `Art. 2 w) define la elaboración de perfiles. El titular tiene derecho a oponerse y a no ser objeto de decisiones basadas en el tratamiento automatizado de sus datos, incluida la elaboración de perfiles, que produzcan efectos jurídicos en él o lo afecten significativamente; hay excepciones (contrato, consentimiento previo y expreso, o la ley), pero aun así el responsable debe asegurar los derechos del titular (art. 8 bis). Debe informar de su existencia y de la lógica aplicada (art. 14 ter l)) y puede requerir una evaluación de impacto (art. 15 ter).`,
    ej: `Un sistema que descarta automáticamente postulantes según un puntaje, o que decide si se otorga un crédito sin que una persona lo revise.`,
    rel: ['eipd', 'oposicion']
  },
  {
    id: 'fuente-publica', c: 'datos', t: 'Fuente de acceso público', n: 'Fuente de acceso público', m: ['fuentes? de acceso público'],
    k: 'registros publicos diario oficial medios de comunicacion',
    d: `Base de datos o conjunto de datos personales que cualquier persona puede consultar legalmente, como el Diario Oficial, los medios de comunicación o los registros públicos que disponga la ley.`,
    l: `Art. 2 i). Que los datos sean de acceso público no los deja fuera de la ley: su tratamiento se somete a sus disposiciones. El titular puede oponerse si los datos se obtuvieron de una fuente de acceso público y no existe otro fundamento legal para tratarlos (art. 8 c)).`,
    ej: `Tomar los datos de contacto de personas desde un registro público para ofrecerles servicios sigue siendo tratar datos personales: necesita una base de licitud, y la persona puede oponerse.`,
    rel: ['licitud', 'oposicion']
  },
  {
    id: 'base-datos', c: 'datos', t: 'Base de datos personales', n: 'Base de datos', m: ['bases? de datos personales'],
    k: 'registro planilla archivo sistema',
    d: `Conjunto organizado de datos personales que permite relacionarlos entre sí y tratarlos, sea cual sea su finalidad y la forma de crearlo, almacenarlo, organizarlo o acceder a él.`,
    l: `Art. 2 m). Lo que la define es que los datos estén organizados y se puedan relacionar, no el soporte: puede ser digital o en papel.`,
    ej: `La planilla de clientes, el sistema de remuneraciones o un archivador con fichas ordenadas por RUT.`,
    rel: ['dato-personal', 'tratamiento', 'mapa-datos']
  },
  {
    id: 'dato-estadistico', c: 'datos', t: 'Dato estadístico', n: 'Dato estadístico', m: ['datos? estadísticos?'],
    k: 'estadistica agregado sin nombres',
    d: `Dato que, desde su origen o como resultado de su tratamiento, ya no puede asociarse a una persona identificada o identificable.`,
    l: `Art. 2 e). Los datos personales que se usan con fines estadísticos tienen reglas propias (art. 16 quinquies).`,
    ej: `El total de clientes por región, sin nombres ni RUT.`,
    rel: ['anonimizacion', 'investigacion']
  },
  {
    id: 'dato-caduco', c: 'datos', t: 'Dato caduco', n: 'Dato caduco', m: ['datos? caducos?', 'caducidad'],
    k: 'vencido desactualizado ya no vigente',
    d: `Dato que perdió vigencia: por disposición de la ley, porque se cumplió la condición o venció el plazo de su vigencia o, si no hay norma expresa, porque cambiaron los hechos o circunstancias que consigna.`,
    l: `Art. 2 d). Es una de las causales para pedir la supresión (art. 7 d)).`,
    ej: `El domicilio de un cliente que se mudó hace años, cuando el dato ya no refleja su situación.`,
    rel: ['supresion', 'calidad']
  },
  {
    id: 'geolocalizacion', c: 'datos', t: 'Datos de geolocalización', n: 'Geolocalización', m: ['geolocalizaci[oó]n'],
    k: 'gps ubicacion posicion rastreo',
    d: `Datos que indican dónde se encuentra una persona o su dispositivo, por ejemplo el GPS de un teléfono o de un vehículo.`,
    l: `Art. 16 sexies. Se tratan bajo las mismas fuentes de licitud de los arts. 12 y 13. El titular debe ser informado de manera clara, suficiente y oportuna del tipo de datos que se tratarán, de la finalidad y la duración del tratamiento, y de si se comunicarán o cederán a un tercero para prestar un servicio con valor añadido.`,
    ej: `Una empresa de reparto que sigue con GPS a sus conductores debe informarles qué se registra, para qué y por cuánto tiempo.`,
    rel: ['licitud', 'transparencia']
  },
  {
    id: 'salud', c: 'datos', t: 'Datos de salud y perfil biológico', n: 'Salud', m: ['datos? de salud', 'perfil biológico'],
    k: 'medicos licencia genetico ficha clinica',
    d: `Información sobre la salud de una persona y sobre su perfil biológico (por ejemplo, datos genéticos, proteómicos o metabólicos). Son datos sensibles.`,
    l: `Art. 16 bis y art. 2 g). Por regla general se tratan solo con consentimiento expreso (art. 16). Sin consentimiento solo se pueden tratar, respetando los principios de la ley, en casos como salvaguardar la vida o la integridad de la persona, una alerta sanitaria legalmente decretada, fines estadísticos o científicos de interés público, la defensa de un derecho ante tribunales, la medicina preventiva o laboral y el diagnóstico médico, o cuando la ley lo permita y señale su finalidad (art. 16 bis).`,
    ej: `Una licencia médica, el resultado de un examen preocupacional o la ficha clínica de un paciente.`,
    rel: ['dato-sensible', 'consentimiento']
  },
  {
    id: 'datos-financieros', c: 'datos', t: 'Datos de obligaciones económicas, financieras, bancarias o comerciales', n: 'Datos de deudas',
    m: ['deudas', 'historial financiero(?:, bancario o comercial)?', 'obligaciones? de carácter económico(?:, financiero, bancario o comercial)?'],
    k: 'morosidad protestos deudas historial crediticio boletin comercial',
    d: `Información sobre las deudas y el comportamiento de pago de una persona (morosidades, protestos). Tiene reglas propias sobre qué se puede comunicar, por cuánto tiempo y cuándo se debe eliminar.`,
    l: `Arts. 17 a 19 (y art. 13 a)). Solo pueden comunicarse las obligaciones que la ley enumera, como las letras de cambio y pagarés protestados y los cheques protestados (art. 17). No pueden comunicarse después de cinco años desde que la obligación se hizo exigible, ni después de pagada o extinguida (art. 18). Las obligaciones prescritas deben suprimirse sin necesidad de solicitud (art. 17). Si se vulneran las medidas de seguridad sobre estos datos, también hay que avisar a las personas afectadas (art. 14 sexies).`,
    ej: `Un registro comercial no puede seguir informando una deuda después de que fue pagada.`,
    rel: ['licitud', 'vulneracion']
  },
  {
    id: 'datos-infracciones', c: 'datos', t: 'Datos de infracciones penales, civiles, administrativas y disciplinarias', n: 'Datos de infracciones',
    m: ['infracciones (?:penales|civiles|administrativas|disciplinarias)', 'antecedentes penales'],
    k: 'antecedentes penales condenas sanciones registros publicos',
    d: `Datos sobre la comisión y sanción de infracciones penales, civiles, administrativas y disciplinarias. Su tratamiento está muy restringido.`,
    l: `Art. 25. Solo pueden tratarlos los organismos públicos para cumplir sus funciones legales y en los casos que la ley prevea. Se prohíbe el tratamiento masivo de los registros electrónicos de infracciones que llevan los organismos públicos, y hacerlo es una infracción gravísima (art. 25). Vulnerar el secreto de estos datos también es gravísimo (art. 34 quáter d)).`,
    ej: `Copiar masivamente los registros electrónicos de sanciones que llevan los organismos públicos para armar una base propia está prohibido.`,
    rel: ['dato-sensible', 'infracciones']
  },

  // ───────── Tratar datos con licitud ─────────
  {
    id: 'tratamiento', m: ['tratamientos?'], c: 'tratamiento', t: 'Tratamiento de datos', n: 'Tratamiento',
    k: 'operacion recolectar almacenar usar tratar',
    d: `Cualquier cosa que se haga con datos personales: recolectarlos, guardarlos, consultarlos, usarlos, enviarlos o borrarlos, con o sin computador.`,
    l: `Art. 2 o): cualquier operación o conjunto de operaciones o procedimientos técnicos, automatizados o no, que permitan de cualquier forma recolectar, procesar, almacenar, comunicar, transmitir o utilizar datos personales.`,
    ej: `Guardar currículums en una carpeta compartida, enviar un correo a clientes o archivar fichas en papel son tratamientos de datos.`,
    rel: ['dato-personal', 'licitud']
  },
  {
    id: 'principios', m: ['principios? del tratamiento', 'principios? de la ley'], c: 'tratamiento', t: 'Principios del tratamiento de datos', n: 'Principios',
    k: 'licitud lealtad finalidad proporcionalidad calidad responsabilidad seguridad transparencia confidencialidad',
    d: `Las reglas de fondo que guían todo tratamiento de datos. Si una práctica de la organización choca con alguno, probablemente hay un problema aunque ninguna otra regla la mencione.`,
    l: `Art. 3: licitud y lealtad, finalidad, proporcionalidad, calidad (datos exactos, completos, actuales y pertinentes), responsabilidad (quienes tratan datos responden por su cumplimiento), seguridad, transparencia e información, y confidencialidad.`,
    ej: `Una empresa que pide el RUT para participar en un concurso y lo usa después para cobranzas choca con los principios de finalidad y de proporcionalidad.`,
    rel: ['finalidad', 'proporcionalidad', 'licitud', 'transparencia']
  },
  {
    id: 'consentimiento', m: ['consentimientos?'], c: 'tratamiento', t: 'Consentimiento', n: 'Consentimiento',
    k: 'autorizacion aceptar casilla revocar',
    d: `Autorización del titular para tratar sus datos. Debe ser libre, específica, informada e inequívoca, y la persona puede retirarla en cualquier momento.`,
    l: `Art. 2 p) y art. 12. Debe darse antes del tratamiento y de forma inequívoca, mediante una declaración verbal, escrita o electrónica, o un acto afirmativo, y para finalidades determinadas. Se puede revocar en cualquier momento y sin expresar causa, por medios similares a los usados para otorgarlo, sin efectos retroactivos. Le corresponde al responsable probar que lo obtuvo. Se presume que no fue libre si se pide en el marco de un contrato o servicio en que no era necesario recolectar esos datos (con una excepción prevista en el mismo artículo). Para los datos sensibles se exige consentimiento expreso (art. 16).`,
    ej: `Una casilla sin marcar de antemano que dice «Acepto recibir ofertas por correo», con registro de la fecha en que la persona la marcó, y un enlace para darse de baja tan fácil como fue suscribirse.`,
    rel: ['licitud', 'dato-sensible', 'finalidad']
  },
  {
    id: 'licitud', m: ['bases? legal(?:es)?', 'bases? de licitud', 'fuentes? de licitud', 'licitud'], c: 'tratamiento', t: 'Base de licitud (base legal)', n: 'Base de licitud',
    k: 'base legal fundamento legal licito sin consentimiento contrato obligacion legal',
    d: `El motivo que la ley acepta para poder tratar datos personales. Sin una base válida, tratar los datos es una infracción. El consentimiento es una de ellas, pero hay otras que no lo requieren.`,
    l: `Art. 12 (consentimiento) y art. 13: una obligación legal o lo que disponga la ley; la ejecución de un contrato o de medidas precontractuales pedidas por el titular; el interés legítimo del responsable o de un tercero, si no afecta los derechos del titular; la defensa de un derecho ante tribunales u órganos públicos; y los datos de obligaciones económicas, financieras, bancarias o comerciales, con las reglas especiales de los arts. 17 a 19. El responsable debe poder acreditar la licitud del tratamiento (art. 13). Tratar sin consentimiento ni otra base legal es una infracción grave (art. 34 ter a)).`,
    ej: `Guardar el RUT y la dirección de un cliente para emitir una factura se apoya en el contrato y en una obligación legal, no en el consentimiento.`,
    rel: ['consentimiento', 'interes-legitimo', 'finalidad']
  },
  {
    id: 'interes-legitimo', m: ['intereses? legítimos?'], c: 'tratamiento', t: 'Interés legítimo', n: 'Interés legítimo',
    k: 'base de licitud sin consentimiento ponderacion',
    d: `Base de licitud que permite tratar datos sin consentimiento cuando es necesario para un interés real del responsable o de un tercero, siempre que no se afecten los derechos y libertades de la persona.`,
    l: `Art. 13 d). El titular puede exigir ser informado del tratamiento y del interés legítimo en que se basa, y puede oponerse en cualquier momento; el responsable debe dejar de tratar los datos salvo que acredite motivos legítimos imperiosos (art. 8 a)).`,
    ej: `Una empresa que revisa los registros de acceso a su sistema para detectar intentos de fraude: protege un interés propio y lo hace de manera proporcionada.`,
    rel: ['licitud', 'oposicion']
  },
  {
    id: 'finalidad', m: ['finalidad(?:es)?'], c: 'tratamiento', t: 'Finalidad', n: 'Finalidad',
    k: 'proposito para que se usan los datos nuevo uso',
    d: `El propósito para el cual se recogen los datos. Debe ser específico, explícito y lícito, y los datos no pueden usarse para fines distintos a los informados.`,
    l: `Art. 3 b). No se pueden tratar datos con fines distintos a los informados al recolectarlos, salvo que el tratamiento sea para fines compatibles con los autorizados originalmente u ocurran las otras situaciones que la ley indica. Si el consentimiento no consideró la cesión de los datos, debe recabarse antes de ceder (art. 15). Usarlos con una finalidad distinta, sin una base que lo permita, es una infracción grave (art. 34 ter a)).`,
    ej: `Si el correo de una persona se pidió para enviarle una factura, no puede usarse para enviarle publicidad sin una base que lo permita.`,
    rel: ['cesion', 'licitud', 'proporcionalidad']
  },
  {
    id: 'proporcionalidad', m: ['proporcionalidad', 'minimización', 'períodos? de retención', 'plazos? de conservación'], c: 'tratamiento', t: 'Proporcionalidad (minimización)', n: 'Proporcionalidad',
    k: 'minimizacion datos necesarios retencion conservacion eliminar plazo',
    d: `Pedir y guardar solo los datos necesarios, adecuados y pertinentes para el fin, y solo durante el tiempo que haga falta. Cuando ya no se necesitan, se eliminan o se anonimizan.`,
    l: `Art. 3 c). «Minimización» es el nombre habitual de este principio; la ley lo llama proporcionalidad. Tratar datos innecesarios para los fines del tratamiento es una infracción grave (art. 34 ter c)).`,
    ej: `Un formulario de contacto no necesita la fecha de nacimiento ni el estado civil de quien escribe.`,
    rel: ['anonimizacion', 'finalidad', 'diseno']
  },
  {
    id: 'cesion', m: ['cesi[oó]n(?:es)?', 'ceder', 'cedid[oa]s?', 'comunicación de datos'], c: 'tratamiento', t: 'Cesión y comunicación de datos', n: 'Cesión',
    k: 'ceder entregar compartir datos a terceros comunicar',
    d: `Cesión: entregar datos personales a otro responsable, que pasa a decidir sobre ellos. Comunicación: darlos a conocer a alguien distinto del titular sin llegar a cederlos.`,
    l: `Art. 2 v) y c), y art. 15. La cesión requiere el consentimiento del titular u otra causal que la ley permita, debe constar por escrito o por un medio electrónico idóneo, y el cesionario pasa a ser responsable de los datos. Una cesión hecha sin el consentimiento cuando era necesario es nula, y el cesionario debe suprimir los datos recibidos (art. 15). No es lo mismo que encargar el tratamiento a un proveedor, que actúa por cuenta del responsable (art. 15 bis).`,
    ej: `Entregar la lista de clientes a una empresa asociada para que les ofrezca sus propios productos es una cesión. Contratar a una empresa solo para despachar sus correos no lo es: ella actúa como encargada.`,
    rel: ['encargado', 'finalidad', 'consentimiento']
  },
  {
    id: 'calidad', c: 'tratamiento', t: 'Calidad de los datos (exactitud)', n: 'Calidad', m: ['calidad de los datos', 'exactitud', 'exactos? y actuales?', 'datos? (?:inexactos?|desactualizados?)'],
    k: 'exactos actuales completos pertinentes actualizar',
    d: `Los datos deben ser exactos, completos, actuales y pertinentes para los fines del tratamiento. Tratar datos que ya no son correctos puede perjudicar a la persona.`,
    l: `Art. 3 d). Si no lo son, la persona puede pedir su rectificación (art. 6). Tratar datos inexactos, incompletos o desactualizados es una infracción grave (art. 34 ter d)), salvo que su actualización le corresponda al titular según la ley o el contrato.`,
    ej: `Seguir enviando facturas a la dirección antigua de un cliente porque nadie actualizó su ficha.`,
    rel: ['rectificacion', 'proporcionalidad', 'dato-caduco']
  },
  {
    id: 'almacenamiento', c: 'tratamiento', t: 'Almacenamiento de datos', n: 'Almacenamiento', m: ['almacenamiento de datos'],
    k: 'guardar conservar custodiar',
    d: `Conservar o custodiar datos en un registro o base de datos.`,
    l: `Art. 2 a). El bloqueo temporal de los datos no afecta su almacenamiento (arts. 8 ter y 11), y la suspensión de operaciones como sanción tampoco (art. 38).`,
    ej: `Guardar las fichas de clientes en un servidor propio o en un servicio en la nube.`,
    rel: ['bloqueo', 'base-datos', 'tratamiento']
  },
  {
    id: 'eliminacion', c: 'tratamiento', t: 'Eliminación o cancelación de datos', n: 'Eliminación', m: ['eliminaci[oó]n(?: de datos)?', 'cancelaci[oó]n'],
    k: 'borrar destruir cancelar',
    d: `Destruir los datos almacenados en registros o bases de datos, sea cual sea el procedimiento que se use.`,
    l: `Art. 2 h). Eliminar los datos que ya no se necesitan es parte del principio de proporcionalidad (art. 3 c)), y la persona puede pedirlo ejerciendo su derecho de supresión (art. 7).`,
    ej: `Borrar de todos los sistemas los currículums de un proceso de selección que ya terminó.`,
    rel: ['supresion', 'anonimizacion', 'proporcionalidad']
  },
  {
    id: 'investigacion', c: 'tratamiento', t: 'Fines históricos, estadísticos y científicos', n: 'Fines estadísticos y científicos', m: ['fines (?:históricos|estadísticos|científicos)', 'investigación científica'],
    k: 'investigacion estudios encuestas academico',
    d: `Tratar datos solo para historia, estadística, ciencia o estudios de interés público tiene reglas más flexibles, pero con condiciones: medidas de seguridad acreditadas y anonimizar lo que se publique.`,
    l: `Art. 16 quinquies. Se entiende que hay interés legítimo cuando el tratamiento se hace exclusivamente con esos fines y atiende fines de interés público. El responsable debe adoptar y acreditar las medidas de calidad y seguridad necesarias para que los datos se usen solo para esos fines; si son datos sensibles, debe además identificar los riesgos y reducirlos. Para publicar resultados debe antes anonimizar los datos.`,
    ej: `Un estudio universitario que publica los resultados de una encuesta, sin nombres ni datos que permitan identificar a las personas.`,
    rel: ['dato-estadistico', 'anonimizacion', 'interes-legitimo']
  },

  // ───────── Derechos de las personas ─────────
  {
    id: 'arcop', m: ['ARCOP', 'derechos? del titular', 'derechos? de los titulares'], c: 'derechos', t: 'Derechos de las personas (ARCOP)', n: 'ARCOP', s: 'ARCOP',
    k: 'derechos del titular acceso rectificacion cancelacion supresion oposicion portabilidad bloqueo',
    d: `Los derechos que tienen las personas sobre sus datos: acceso, rectificación, supresión (antes llamada cancelación), oposición y portabilidad, más el bloqueo temporal. «ARCOP» es una sigla de uso común: no aparece en la ley.`,
    l: `Art. 4: acceso, rectificación, supresión, oposición, portabilidad y bloqueo (seis derechos). Son personales, intransferibles e irrenunciables, y en caso de fallecimiento pueden ejercerlos los herederos, salvo que la persona lo hubiese prohibido o la ley lo establezca. Rectificación, supresión y oposición se ejercen siempre gratis; el acceso, gratis al menos una vez por trimestre (art. 10).`,
    ej: `Una clienta pide por correo que le informen qué datos suyos tiene la empresa (acceso) y que corrijan su dirección (rectificación).`,
    rel: ['plazo-respuesta', 'acceso', 'rectificacion', 'supresion', 'oposicion', 'portabilidad', 'bloqueo']
  },
  {
    id: 'acceso', c: 'derechos', t: 'Derecho de acceso', n: 'Acceso',
    k: 'copia de mis datos saber que datos tienen',
    d: `Derecho a saber si la organización trata sus datos y a obtenerlos, junto con información sobre su origen, para qué se usan, a quiénes se comunicaron y por cuánto tiempo se conservarán.`,
    l: `Art. 5 y art. 2 q). Incluye la información significativa sobre la lógica aplicada cuando hay decisiones automatizadas (art. 8 bis). Se ejerce gratis al menos una vez por trimestre (art. 10).`,
    ej: `Un extrabajador pide una copia de los datos que la empresa conserva sobre él.`,
    rel: ['arcop', 'plazo-respuesta']
  },
  {
    id: 'rectificacion', m: ['rectific~'], c: 'derechos', t: 'Derecho de rectificación', n: 'Rectificación',
    k: 'corregir actualizar datos inexactos',
    d: `Derecho a que se corrijan o completen los datos que son inexactos, están desactualizados o incompletos.`,
    l: `Art. 6. Los datos rectificados deben comunicarse a las personas u organismos a quienes el responsable los haya comunicado o cedido, salvo que sea imposible o exija un esfuerzo desproporcionado.`,
    ej: `Corregir en todos los sistemas el correo mal escrito de un cliente.`,
    rel: ['arcop', 'bloqueo']
  },
  {
    id: 'supresion', m: ['supresi[oó]n', 'suprim~', 'suprimir'], c: 'derechos', t: 'Derecho de supresión', n: 'Supresión',
    k: 'eliminar borrar cancelacion olvido',
    d: `Derecho a que se eliminen los datos en los casos que fija la ley: ya no son necesarios, se retiró el consentimiento, se obtuvieron ilícitamente, son caducos, una sentencia o una obligación legal lo exige, o tras una oposición sin otro fundamento.`,
    l: `Art. 7 (y art. 2 s)). No procede cuando el tratamiento sea necesario, entre otros casos, para cumplir una obligación legal o ejecutar un contrato entre el titular y el responsable, o para formular, ejercer o defender una reclamación administrativa o judicial (art. 7).`,
    ej: `Una persona retira su consentimiento a recibir promociones y pide que borren su ficha de marketing. La empresa debe hacerlo, pero puede conservar lo que la ley le obliga a guardar, como una factura.`,
    rel: ['arcop', 'bloqueo', 'consentimiento']
  },
  {
    id: 'oposicion', m: ['oposici[oó]n', 'oponerse'], c: 'derechos', t: 'Derecho de oposición', n: 'Oposición',
    k: 'no quiero marketing publicidad dejar de recibir',
    d: `Derecho a oponerse a un tratamiento determinado en ciertos casos: cuando se basa en el interés legítimo del responsable, cuando es para marketing directo o cuando los datos vienen de una fuente de acceso público y no hay otro fundamento.`,
    l: `Art. 8 a) a c) (y art. 2 t)). Cuando la base es el interés legítimo, el responsable debe dejar de tratar los datos salvo que acredite motivos legítimos imperiosos. La ley también da derecho a oponerse a decisiones basadas en el tratamiento automatizado (art. 8 bis).`,
    ej: `Un cliente pide no recibir más correos de ofertas: la empresa debe dejar de enviárselos.`,
    rel: ['arcop', 'perfiles', 'interes-legitimo']
  },
  {
    id: 'portabilidad', m: ['portabilidad', 'portable', 'formato estructurado'], c: 'derechos', t: 'Derecho a la portabilidad', n: 'Portabilidad',
    k: 'llevar mis datos exportar formato estructurado',
    d: `Derecho a recibir una copia de los datos que la persona entregó, en un formato electrónico estructurado y de uso común, y a llevarlos a otro responsable.`,
    l: `Art. 9 (y art. 2 u)). Procede cuando el tratamiento se hace en forma automatizada y se basa en el consentimiento del titular. La persona puede pedir que sus datos pasen directamente de un responsable a otro cuando sea técnicamente posible. Pedirla no supone que se supriman los datos, salvo que el titular lo pida junto con la solicitud.`,
    ej: `Exportar el historial de un cliente en un archivo CSV para que lo lleve a otro proveedor.`,
    rel: ['arcop', 'acceso']
  },
  {
    id: 'bloqueo', m: ['bloqueo(?: temporal)?', 'suspender el tratamiento'], c: 'derechos', t: 'Derecho de bloqueo temporal', n: 'Bloqueo',
    k: 'suspender tratamiento mientras se resuelve',
    d: `Derecho a pedir que se suspenda temporalmente el tratamiento de los datos mientras se resuelve una solicitud de rectificación, supresión u oposición. Los datos se siguen almacenando.`,
    l: `Art. 8 ter y art. 11. La solicitud de bloqueo debe ser fundada y el responsable debe responder dentro de los dos días hábiles siguientes a su recepción; mientras no resuelva, no puede tratar los datos que forman parte del requerimiento. También puede ejercerse como alternativa a la supresión en los casos del art. 7. No afecta el almacenamiento de los datos.`,
    ej: `Una persona discute la exactitud de un dato y pide el bloqueo hasta que la empresa resuelva su solicitud de rectificación.`,
    rel: ['arcop', 'rectificacion', 'supresion']
  },
  {
    id: 'plazo-respuesta', m: ['30 días corridos', 'treinta días corridos', 'acusar recibo'], c: 'derechos', t: 'Plazo para responder una solicitud', n: 'Plazo de respuesta',
    k: 'treinta dias corridos reclamo agencia acusar recibo prorroga respuesta escrita',
    d: `Cuando una persona ejerce un derecho, la organización debe acusar recibo y responder por escrito dentro de un plazo máximo. Si rechaza la solicitud, debe fundarlo e informar cómo reclamar ante la Agencia.`,
    l: `Art. 11. El responsable debe acusar recibo y pronunciarse a más tardar dentro de los 30 días corridos siguientes a la fecha de ingreso de la solicitud, plazo que puede prorrogarse por una sola vez hasta por otros 30 días corridos. La respuesta es por escrito, y debe guardar los respaldos que demuestren su envío, su fecha y su contenido íntegro. Si rechaza total o parcialmente, debe fundar su decisión y señalar que la persona dispone de 30 días hábiles para reclamar ante la Agencia. También puede reclamar si no hay respuesta en el plazo. Para ejercer sus derechos la persona debe acreditar su identidad según lo que establezca la Agencia (art. 11 a)).`,
    ej: `Una solicitud ingresada el 1 de marzo debe responderse a más tardar el 31 de marzo; si se prorroga, hasta el 30 de abril.`,
    rel: ['arcop', 'agencia']
  },
  {
    id: 'reclamo-agencia', c: 'derechos', t: 'Reclamo ante la Agencia (tutela de derechos)', n: 'Reclamo ante la Agencia', m: ['reclam(?:o|os|ar) ante la Agencia', 'tutela de derechos'],
    k: 'reclamar denuncia rechazo no respondio',
    d: `Cuando una organización rechaza la solicitud de una persona o no la responde a tiempo, la persona puede reclamar ante la Agencia para que se resuelva.`,
    l: `Art. 41. El reclamo se presenta por escrito dentro de 30 días hábiles desde que la persona recibe la respuesta negativa o venció el plazo para responder. Si se admite a tramitación, el responsable tiene 30 días corridos, prorrogables hasta por el mismo plazo, para responder el reclamo. El procedimiento no puede superar los seis meses y la resolución puede impugnarse judicialmente dentro de 15 días hábiles. Si el rechazo fue a una solicitud de bloqueo temporal, la Agencia resuelve en un máximo de tres días hábiles. Incumplir la resolución de la Agencia sobre el reclamo es una infracción gravísima (art. 34 quáter i)).`,
    ej: `Una clienta pidió borrar sus datos, la empresa no respondió en 30 días corridos y ella presenta un reclamo ante la Agencia.`,
    rel: ['plazo-respuesta', 'agencia', 'infracciones']
  },

  // ───────── Deberes de la organización ─────────
  {
    id: 'transparencia', m: ['deber de información', 'política de (?:tratamiento|privacidad)(?: de datos(?: personales)?)?', 'avisos? de privacidad', 'transparencia'], c: 'deberes', t: 'Deber de información y transparencia (política de privacidad)', n: 'Transparencia',
    k: 'politica de privacidad aviso de privacidad sitio web informar',
    d: `Obligación de mantener siempre a disposición del público, por ejemplo en el sitio web, la información sobre cómo se tratan los datos: quién es el responsable, para qué se usan, a quiénes se entregan, cuánto tiempo se conservan y cómo ejercer los derechos.`,
    l: `Art. 14 ter y art. 3 g). Incluye la política de tratamiento con su fecha y versión, la identificación del responsable, el medio de contacto para las solicitudes, las categorías de datos, las finalidades y la base de licitud, las medidas de seguridad, los derechos de los titulares y el de reclamar ante la Agencia, las transferencias a otros países, el período de conservación y la existencia de decisiones automatizadas. Incumplirlo, total o parcialmente, es una infracción leve (art. 34 bis a)).`,
    ej: `Una página «Política de privacidad» en el pie del sitio, con fecha y versión, y un correo para recibir solicitudes.`,
    rel: ['principios', 'arcop']
  },
  {
    id: 'secreto', m: ['confidencialidad', 'secreto'], c: 'deberes', t: 'Deber de secreto o confidencialidad', n: 'Confidencialidad',
    k: 'secreto confidencialidad reserva divulgar clausula',
    d: `Obligación de no divulgar los datos personales que se conocen en la actividad de la organización, incluso después de terminada la relación con la persona. El responsable debe lograr que su personal y sus proveedores también lo cumplan.`,
    l: `Art. 14 bis y art. 3 h). Se exceptúan los datos que el titular hizo manifiestamente públicos y las comunicaciones que la ley obliga a hacer. El responsable debe adoptar las medidas para que sus dependientes y quienes traten datos bajo su responsabilidad cumplan el deber. Vulnerarlo es una infracción grave (art. 34 ter i)), y gravísima si afecta datos sensibles (art. 34 quáter d)).`,
    ej: `Un trabajador de remuneraciones no comenta con otras personas el sueldo ni la licencia médica de un compañero, y su contrato incluye una cláusula de confidencialidad.`,
    rel: ['medidas-seguridad', 'programa-cumplimiento']
  },
  {
    id: 'diseno', m: ['desde el diseño', 'por defecto', 'privacy by design'], c: 'deberes', t: 'Protección desde el diseño y por defecto', n: 'Desde el diseño',
    k: 'privacy by design by default nuevo sistema producto',
    d: `Pensar en la protección de datos desde antes de lanzar un sistema, proceso o producto, y configurarlo para que, por defecto, solo se traten los datos estrictamente necesarios.`,
    l: `Art. 14 quáter. El responsable debe aplicar medidas técnicas y organizativas adecuadas desde el diseño, antes y durante el tratamiento, y garantizar que, por defecto, solo se traten los datos específicos y estrictamente necesarios para la actividad.`,
    ej: `Un formulario de inscripción nuevo que parte pidiendo solo nombre y correo, con las casillas opcionales desmarcadas.`,
    rel: ['eipd', 'proporcionalidad']
  },
  {
    id: 'eipd', m: ['EIPD', 'DPIA', 'evaluaci[oó]n(?:es)? de impacto'], c: 'deberes', t: 'Evaluación de impacto en protección de datos (EIPD)', n: 'EIPD', s: 'EIPD · DPIA',
    k: 'dpia evaluacion de impacto alto riesgo privacy impact assessment pia',
    d: `Análisis previo de los riesgos que un tratamiento puede tener para las personas y de las medidas para reducirlos. Se hace antes de comenzar cuando el tratamiento es de alto riesgo. DPIA es su sigla en inglés (Data Protection Impact Assessment).`,
    l: `Art. 15 ter. Se requiere cuando es probable que un tratamiento produzca un alto riesgo para los derechos de las personas, y siempre en estos casos: la evaluación sistemática y exhaustiva de aspectos personales basada en tratamiento o decisiones automatizadas, como los perfiles, con efectos jurídicos significativos; el tratamiento masivo o a gran escala; la observación o el monitoreo sistemático de una zona de acceso público; y el tratamiento de datos sensibles y especialmente protegidos en las hipótesis de excepción del consentimiento. La Agencia publicará una lista orientativa. No hacerla cuando corresponde es una infracción gravísima (art. 34 quáter k)).`,
    ej: `Antes de instalar cámaras con reconocimiento facial en la entrada, o de lanzar un sistema que califica automáticamente a los clientes, la empresa evalúa los riesgos y define cómo reducirlos.`,
    rel: ['perfiles', 'dato-sensible', 'diseno']
  },
  {
    id: 'programa-cumplimiento', m: ['modelos? de prevención', 'programas? de cumplimiento'], c: 'deberes', t: 'Modelo de prevención de infracciones (programa de cumplimiento)', n: 'Programa de cumplimiento',
    k: 'modelo de prevencion certificacion compliance',
    d: `Conjunto de políticas, procedimientos y controles que una organización adopta voluntariamente para prevenir infracciones a la ley. Puede ser certificado por la Agencia.`,
    l: `Arts. 49 a 51. Adoptarlo es voluntario. Debe contener, al menos: la designación de un delegado y la definición de sus medios y facultades; la identificación del tipo de información que se trata y de los titulares; la identificación de los procesos donde hay riesgo de infracción; protocolos y procedimientos para prevenirlas; mecanismos de reporte interno y a la Agencia; y sanciones internas y procedimientos de denuncia (art. 49). Sus reglas deben incorporarse a los contratos de trabajo o de prestación de servicios, o al reglamento interno. La certificación vigente se consigna en el Registro Nacional de Sanciones y Cumplimiento (arts. 51 y 39) y haber cumplido diligentemente los deberes de dirección y supervisión, verificado con ese certificado, es una atenuante (art. 36).`,
    ej: `Una empresa documenta su política de privacidad, nombra una delegada, capacita a todo el personal, incorpora las reglas en su reglamento interno y se somete a certificación.`,
    rel: ['dpo', 'registro-sanciones', 'infracciones']
  },
  {
    id: 'mapa-datos', m: ['inventario(?: interno)? de(?: los)? tratamientos', 'mapa de datos', 'mapead[oa]s?', 'registro de actividades de tratamiento', 'flujos? de(?:l)? datos'], c: 'deberes', bp: true, t: 'Inventario de tratamientos (mapa de datos)', n: 'Mapa de datos',
    k: 'inventario registro de actividades de tratamiento rat flujo de datos',
    d: `Listado de qué datos personales trata la organización, para qué, con qué base, dónde se guardan, quién accede, a quién se ceden y por cuánto tiempo. Es la base para cumplir casi todo lo demás.`,
    l: `La ley no usa este término ni lo exige expresamente. Se relaciona con el modelo de prevención, que pide identificar el tipo de información que se trata, las bases de datos y los titulares (art. 49 c)), y con la información que debe publicarse sobre categorías de datos, finalidades y destinatarios (art. 14 ter d)).`,
    ej: `Una planilla con una fila por actividad: «Reclutamiento — currículums — correo y carpeta compartida de RR.HH. — 6 meses».`,
    rel: ['tratamiento', 'transparencia', 'programa-cumplimiento']
  },
  {
    id: 'estandares', c: 'deberes', t: 'Estándares diferenciados según el tamaño y el tipo de datos', n: 'Estándares diferenciados', m: ['empresas? de menor tamaño', 'estándares? (?:diferenciados?|mínimos?)'],
    k: 'pyme micro pequena empresa tamano proporcional',
    d: `La ley no exige exactamente lo mismo a todas las organizaciones: lo mínimo en información y seguridad depende del tipo de datos, del tamaño de la entidad y de lo que hace con los datos.`,
    l: `Art. 14 septies. Los estándares mínimos para los deberes de información (art. 14 ter) y de seguridad (art. 14 quinquies) se determinan considerando el tipo de dato, si el responsable es persona natural o jurídica, el tamaño de la empresa según las categorías de la Ley 20.416 sobre empresas de menor tamaño, su actividad y el volumen, la naturaleza y las finalidades de los datos que trata. La Agencia los fija mediante instrucción general. También se aplican a los encargados (art. 15 bis).`,
    ej: `No se espera lo mismo en seguridad de un taller de cinco personas que de una clínica con miles de fichas de pacientes.`,
    rel: ['medidas-seguridad', 'transparencia']
  },
  {
    id: 'certificacion', c: 'deberes', t: 'Certificación del modelo de prevención', n: 'Certificación', m: ['certificaci[oó]n'],
    k: 'sello agencia certificado vigencia tres anos',
    d: `Constancia que otorga la Agencia de que el programa de cumplimiento de una organización reúne los requisitos de la ley. Dura tres años y puede revocarse.`,
    l: `Arts. 51 a 53. La Agencia certifica y supervisa los modelos de prevención y registra en el Registro Nacional de Sanciones y Cumplimiento a las entidades con certificación vigente (art. 51). Los certificados duran tres años y quedan sin efecto por revocación, disolución o cese de la actividad, entre otras causales (art. 52). La Agencia puede revocarla si el responsable no cumple, y para pedirla de nuevo hay que acreditar que la causa fue corregida (art. 53). Cumplir diligentemente los deberes de dirección y supervisión, verificado con el certificado, es una atenuante de responsabilidad (art. 36).`,
    ej: `Una empresa con su modelo certificado figura en el registro público de la Agencia y puede mostrarlo a sus clientes.`,
    rel: ['programa-cumplimiento', 'registro-sanciones']
  },

  // ───────── Seguridad e incidentes ─────────
  {
    id: 'medidas-seguridad', m: ['medidas? técnicas y organizativas(?: de seguridad)?', 'medidas? de seguridad', 'seguridad reforzada'], c: 'seguridad', t: 'Medidas de seguridad', n: 'Seguridad',
    k: 'controles tecnicos organizativos proteger datos respaldo restaurar',
    d: `Controles técnicos y de organización para proteger los datos de accesos no autorizados, pérdida, filtración o destrucción. Deben ser proporcionales al riesgo, al tipo de dato y a la tecnología disponible.`,
    l: `Art. 14 quinquies y art. 3 f). Entre ellas, la ley menciona: la seudonimización y el cifrado, la capacidad de garantizar la confidencialidad, integridad, disponibilidad y resiliencia de los sistemas, la capacidad de restaurar rápidamente el acceso a los datos tras un incidente y un proceso regular de verificación de la eficacia de las medidas. Si hay un incidente, le corresponde al responsable acreditar que esas medidas existían y funcionaban. Los estándares mínimos se determinan según el tipo de dato, el tamaño de la entidad, su actividad y el volumen y naturaleza de los datos (art. 14 septies). Vulnerarlas es una infracción grave (art. 34 ter j)).`,
    ej: `Contraseñas robustas con segundo factor de autenticación, cifrado de los computadores portátiles, copias de respaldo que se prueban y accesos solo para quienes los necesitan.`,
    rel: ['cifrado', 'control-acceso', 'vulneracion']
  },
  {
    id: 'cifrado', m: ['cifra(?:do|dos|da|das|r)', 'encripta~', 'HTTPS', 'TLS'], c: 'seguridad', bp: true, t: 'Cifrado (TLS / HTTPS)', n: 'Cifrado', s: 'TLS · HTTPS',
    k: 'encriptacion candado certificado',
    d: `Transformar los datos para que solo puedan leerse con una clave. En reposo protege lo almacenado (discos, copias de respaldo); en tránsito, lo que viaja por la red. HTTPS usa el protocolo TLS para proteger la conexión con un sitio web.`,
    l: `La ley no define el cifrado, pero lo menciona como una de las medidas de seguridad (art. 14 quinquies a)).`,
    ej: `El candado de un sitio con HTTPS protege lo que las personas escriben en un formulario mientras viaja; un disco cifrado protege la información si roban el computador.`,
    rel: ['medidas-seguridad', 'seudonimizacion']
  },
  {
    id: 'control-acceso', m: ['RBAC', 'controles? de acceso', 'mínimo privilegio'], c: 'seguridad', bp: true, t: 'Control de acceso (RBAC y mínimo privilegio)', n: 'Control de acceso', s: 'RBAC',
    k: 'permisos roles accesos registro de accesos privilegios',
    d: `Dar a cada persona solo el acceso a los datos que necesita para su trabajo (mínimo privilegio) y registrar quién accede. RBAC (control de acceso basado en roles) asigna esos permisos según el cargo, no persona por persona.`,
    l: `La ley no usa estos términos. Se relacionan con las medidas de seguridad (art. 14 quinquies) y con el deber de confidencialidad (art. 14 bis).`,
    ej: `Quien atiende el mostrador ve nombre y teléfono del cliente, pero no sus datos de pago; solo Recursos Humanos ve las fichas del personal.`,
    rel: ['medidas-seguridad', 'secreto']
  },
  {
    id: 'vulneracion', m: ['vulneraci[oó]n(?:es)?(?: de (?:las )?medidas de seguridad)?', 'brechas? de seguridad', 'brechas? de datos', 'incidentes?'], c: 'seguridad', t: 'Vulneración de seguridad (brecha de datos)', n: 'Vulneración',
    k: 'brecha incidente filtracion fuga hackeo ciberataque perdida notificar',
    d: `Incidente que causa la destrucción, filtración, pérdida o alteración accidental o ilícita de datos personales, o el acceso o la comunicación no autorizados a ellos. En el uso diario se la llama «brecha de seguridad».`,
    l: `Art. 14 sexies. El responsable debe reportarla a la Agencia por los medios más expeditos posibles y sin dilaciones indebidas (la ley no fija un plazo en horas), cuando exista un riesgo razonable para los derechos y libertades de los titulares, y registrar cada caso: su naturaleza, efectos, categorías de datos, número aproximado de titulares afectados y medidas adoptadas. Si afecta datos sensibles, datos de menores de 14 años o datos de obligaciones económicas, financieras, bancarias o comerciales, también debe comunicarlo a los titulares, en lenguaje claro y sencillo. Los encargados deben reportar la vulneración al responsable (art. 15 bis). Omitir deliberadamente la comunicación es una infracción gravísima (art. 34 quáter f)).`,
    ej: `Un computador con fichas de clientes se pierde sin estar cifrado, o un correo con una planilla de datos se envía por error a una persona ajena.`,
    rel: ['medidas-seguridad', 'agencia', 'encargado']
  },
  {
    id: 'mfa', c: 'seguridad', bp: true, t: 'Autenticación multifactor (MFA)', n: 'Doble factor', s: 'MFA · 2FA', m: ['autenticación multifactor', 'doble factor(?: de autenticación)?', 'segundo factor', 'MFA', '2FA'],
    k: 'doble factor verificacion en dos pasos contrasena codigo',
    d: `Pedir al menos dos pruebas distintas para ingresar a un sistema (por ejemplo, la contraseña y un código enviado al celular), de modo que robar la contraseña no baste para entrar.`,
    l: `La ley no usa este término. Es una medida de seguridad habitual para cumplir el deber de adoptar medidas que eviten el acceso no autorizado a los datos (art. 14 quinquies).`,
    ej: `Al ingresar al correo de la empresa, además de la contraseña se pide un código que llega a la aplicación del celular.`,
    rel: ['medidas-seguridad', 'control-acceso']
  },
  {
    id: 'respaldo', c: 'seguridad', bp: true, t: 'Respaldo (backup) y restauración', n: 'Respaldo', s: 'Backup', m: ['backups?', 'copias? de (?:seguridad|respaldo)', 'respaldos? de(?: los)? datos', 'restaur~'],
    k: 'copia de seguridad recuperar disponibilidad',
    d: `Copias de los datos guardadas aparte, para poder recuperarlos si hay un fallo, un robo o un ataque. Un respaldo sirve solo si se prueba que se puede restaurar.`,
    l: `La ley no usa este término, pero pide la capacidad de restaurar rápidamente la disponibilidad y el acceso a los datos personales tras un incidente físico o técnico (art. 14 quinquies c)).`,
    ej: `Una copia diaria de la base de clientes en otro lugar, y una prueba periódica de que realmente se puede recuperar.`,
    rel: ['medidas-seguridad', 'vulneracion']
  },
  {
    id: 'parches', c: 'seguridad', bp: true, t: 'Parches y vulnerabilidades técnicas', n: 'Parches', m: ['parches?', 'vulnerabilidades?'],
    k: 'actualizaciones software fallas seguridad ciberataque',
    d: `Un parche es una actualización que corrige una falla (vulnerabilidad) de un programa o sistema que un atacante podría aprovechar. Gestionarlos es mantener todo actualizado.`,
    l: `La ley no usa estos términos. Se relacionan con las medidas de seguridad y con la verificación regular de su eficacia (art. 14 quinquies). No confundir con una «vulneración de seguridad», que es un incidente que ya ocurrió.`,
    ej: `Instalar a tiempo las actualizaciones de seguridad de los servidores y de los computadores del personal.`,
    rel: ['medidas-seguridad', 'vulneracion']
  },
  {
    id: 'registro-accesos', c: 'seguridad', bp: true, t: 'Registro de accesos (logs)', n: 'Registro de accesos', s: 'Logs', m: ['registros? de accesos?', 'logs?', 'bitácoras?'],
    k: 'bitacora auditoria quien accedio',
    d: `Bitácora automática de quién entró a un sistema o a un dato, cuándo y qué hizo. Sirve para detectar usos indebidos y para investigar qué pasó tras un incidente.`,
    l: `La ley no usa este término. Ayuda a cumplir el deber de seguridad y a registrar los incidentes (arts. 14 quinquies y 14 sexies); ante un incidente, le corresponde al responsable acreditar que sus medidas existían y funcionaban (art. 14 quinquies).`,
    ej: `El sistema deja registrado que el usuario «mperez» abrió la ficha del cliente 1042 a las 10:35.`,
    rel: ['control-acceso', 'vulneracion']
  },

  // ───────── Proveedores y transferencias ─────────
  {
    id: 'atd', m: ['ATD', 'DPA', 'cláusulas? de protección de datos', 'acuerdos? de tratamiento de datos'], c: 'terceros', t: 'Contrato con el encargado (ATD / DPA)', n: 'ATD / DPA', s: 'ATD · DPA',
    k: 'acuerdo de tratamiento de datos data processing agreement clausulas proveedor contrato',
    d: `Contrato que fija las condiciones con las que un proveedor trata datos por cuenta de la organización. ATD es «acuerdo de tratamiento de datos»; DPA es su sigla en inglés (Data Processing Agreement).`,
    l: `Art. 15 bis. El contrato debe establecer el objeto del encargo, su duración, la finalidad del tratamiento, el tipo de datos personales, las categorías de titulares y los derechos y obligaciones de las partes. El encargado no puede delegar el encargo sin autorización específica y por escrito, y al terminar debe suprimir o devolver los datos. La Agencia pondrá a disposición modelos tipo de contratos en su sitio web.`,
    ej: `Un anexo al contrato con el proveedor de nube o de remuneraciones que indica qué datos trata, para qué, por cuánto tiempo y qué debe hacer con ellos al terminar el servicio.`,
    rel: ['encargado', 'transferencia']
  },
  {
    id: 'transferencia', m: ['transferencias? internacional(?:es)?', 'fuera de Chile', 'otros? (?:países|país)'], c: 'terceros', t: 'Transferencia internacional de datos', n: 'Transferencia internacional',
    k: 'datos fuera de chile nube extranjero pais adecuado clausulas contractuales',
    d: `Enviar o poner datos personales a disposición de una persona u organización sujeta a la legislación de otro país. Conviene revisar si sus proveedores (nube, correo, CRM, soporte) tratan o guardan datos fuera de Chile.`,
    l: `Arts. 27 y 28. Es lícita, entre otros casos, si el destino está en un país con nivel adecuado de protección (la Agencia determina cuáles y publica el listado), si hay cláusulas contractuales u otros instrumentos con garantías adecuadas, o si ambas partes adoptan un modelo de cumplimiento o un mecanismo de certificación. Sin esas garantías, solo procede en casos específicos y no habituales, como el consentimiento expreso del titular para esa transferencia. El responsable debe poder acreditar ante la Agencia que cumplió las reglas (art. 28). Hacerlo contra la ley es una infracción grave y, si es a sabiendas, gravísima (arts. 34 ter m) y 34 quáter h)).`,
    ej: `Una empresa que mantiene su CRM en un servicio cuyos servidores están en el extranjero debe revisar con qué garantías se transfieren esos datos.`,
    rel: ['atd', 'encargado']
  },
  {
    id: 'subencargado', c: 'terceros', t: 'Subcontratación (subencargado)', n: 'Subcontratación', m: ['subcontrat~', 'subencargad~', 'subprocesad~'],
    k: 'subcontratar delegar proveedor del proveedor',
    d: `Cuando el proveedor que trata los datos contrata a su vez a otro para hacer parte del trabajo. Solo se puede hacer con autorización específica y por escrito del responsable.`,
    l: `Art. 15 bis. El encargado no puede delegar parte o la totalidad del encargo sin una autorización específica y por escrito del responsable. Si delega, sigue siendo solidariamente responsable de ese encargo y no puede eximirse argumentando que delegó.`,
    ej: `Su proveedor de correo masivo usa, a su vez, un servicio de envío de otra empresa: eso debió autorizarlo usted por escrito.`,
    rel: ['encargado', 'atd']
  },

  // ───────── Autoridad y sanciones ─────────
  {
    id: 'ley-21719', c: 'sanciones', t: 'Ley 21.719', n: 'Ley 21.719',
    k: 'ley proteccion datos personales 19628 nueva ley',
    d: `La ley que moderniza la protección de los datos personales en Chile. Reemplaza el texto de la Ley 19.628 y entra en vigor el 1 de diciembre de 2026.`,
    l: `Art. 1: regula la forma y las condiciones del tratamiento y la protección de los datos personales de las personas naturales, de acuerdo con la Constitución. Todo tratamiento que haga una persona natural o jurídica, incluidos los órganos públicos, queda sujeto a la ley y debe respetar los derechos y libertades de las personas.`,
    ej: `Se aplica tanto a una pyme que guarda los datos de sus clientes como a un servicio público que atiende a la ciudadanía.`,
    rel: ['vigencia', 'agencia', 'ambito-territorial']
  },
  {
    id: 'infracciones', m: ['sanci[oó]n(?:es)?', 'multas?', 'infracci[oó]n(?:es)?'], c: 'sanciones', t: 'Infracciones y multas', n: 'Infracciones y multas',
    k: 'sanciones multa leve grave gravisima amonestacion reincidencia atenuantes agravantes',
    d: `Los incumplimientos se clasifican en leves, graves y gravísimos. Las multas van desde una amonestación escrita hasta un máximo de 20.000 UTM, y pueden aumentar si la organización reincide.`,
    l: `Arts. 34 a 37. Las infracciones leves se sancionan con amonestación escrita o multa de hasta 5.000 UTM; las graves, con multa de hasta 10.000 UTM; las gravísimas, con multa de hasta 20.000 UTM (art. 35). En caso de reincidencia, la Agencia puede aplicar una multa de hasta tres veces el monto asignado a la infracción (art. 35). Ejemplos: no entregar la información que exige la ley es leve (art. 34 bis); tratar datos sin una base que lo permita o impedir el ejercicio de los derechos es grave (art. 34 ter); tratar a sabiendas datos sensibles contra la ley u omitir deliberadamente la comunicación de una vulneración es gravísimo (art. 34 quáter). Las atenuantes (como la autodenuncia, la colaboración o contar con un modelo certificado) y las agravantes (como la reincidencia) están en el art. 36, y los criterios para fijar el monto en el art. 37.`,
    ej: `No tener publicada la política de privacidad es una infracción leve. Usar los datos de los clientes para un fin distinto del informado, sin una base que lo permita, es una infracción grave.`,
    rel: ['utm', 'agencia', 'registro-sanciones', 'programa-cumplimiento']
  },
  {
    id: 'utm', m: ['UTM', 'unidad(?:es)? tributarias? mensual(?:es)?'], c: 'sanciones', bp: true, t: 'UTM (Unidad Tributaria Mensual)', n: 'UTM', s: 'UTM',
    k: 'unidad tributaria mensual multa pesos',
    d: `Unidad de cuenta en pesos que se reajusta cada mes. Las multas de la ley se expresan en UTM; su valor vigente lo publica el Servicio de Impuestos Internos (SII).`,
    l: `La ley expresa las multas en UTM (art. 35), pero no define esta unidad.`,
    ej: `Una multa de «hasta 5.000 UTM» se convierte a pesos multiplicando 5.000 por el valor de la UTM.`,
    rel: ['infracciones']
  },
  {
    id: 'registro-sanciones', m: ['Registro Nacional de Sanciones(?: y Cumplimiento)?'], c: 'sanciones', t: 'Registro Nacional de Sanciones y Cumplimiento', n: 'Registro de sanciones',
    k: 'registro publico sanciones certificados modelo de prevencion',
    d: `Registro público y gratuito que administra la Agencia, donde constan las sanciones impuestas y las organizaciones que tienen un modelo de prevención certificado y vigente.`,
    l: `Art. 2 z) y art. 39. Las anotaciones de sanciones son de acceso público por cinco años desde que se practican.`,
    ej: `Un cliente grande puede revisar si su proveedor figura sancionado o con un modelo certificado.`,
    rel: ['programa-cumplimiento', 'infracciones', 'agencia']
  },
  {
    id: 'vigencia', m: ['entrada en vigor', 'entra en vigencia'], c: 'sanciones', bp: true, t: 'Entrada en vigor de la ley', n: 'Vigencia',
    k: 'cuando empieza 1 de diciembre 2026 plazo',
    d: `La Ley 21.719 entra en vigor el 1 de diciembre de 2026. Desde esa fecha rigen las obligaciones y sanciones que describe este glosario.`,
    l: `En relación con la fecha: el texto de la ley que usa este glosario es la versión vigente desde el 1 de diciembre de 2026 (Biblioteca del Congreso Nacional).`,
    ej: `Una empresa que hoy no tiene un procedimiento para atender las solicitudes de las personas debería tenerlo listo antes de esa fecha.`,
    rel: ['infracciones', 'agencia']
  },
  {
    id: 'sancionatorio', c: 'sanciones', t: 'Procedimiento sancionatorio y reclamo de ilegalidad', n: 'Procedimiento sancionatorio', m: ['formulación de cargos', 'procedimiento sancionatorio', 'reclamo de ilegalidad'],
    k: 'fiscalizacion cargos descargos corte de apelaciones',
    d: `Cómo se sanciona un incumplimiento: la Agencia investiga, formula cargos, el responsable presenta sus descargos y la Agencia resuelve de forma fundada. La decisión puede reclamarse ante la Corte de Apelaciones.`,
    l: `Arts. 42 y 43. El procedimiento lo instruye la Agencia, de oficio o a petición de parte, por una fiscalización o por el reclamo de una persona. La formulación de cargos se notifica al responsable (art. 42 c) y d)), que tiene 15 días hábiles para presentar sus descargos (art. 42 e)). La resolución debe ser fundada y el procedimiento no puede superar los seis meses (art. 42 l)). Quien estime ilegal la resolución puede presentar un reclamo de ilegalidad ante la Corte de Apelaciones de Santiago o la de su domicilio (art. 43).`,
    ej: `Tras el reclamo de una clienta, la Agencia formula cargos a una empresa por no responder una solicitud; la empresa tiene 15 días hábiles para presentar sus descargos.`,
    rel: ['infracciones', 'agencia', 'reclamo-agencia']
  },
  {
    id: 'sanciones-accesorias', c: 'sanciones', t: 'Sanciones accesorias (suspensión de operaciones)', n: 'Sanciones accesorias', m: ['sanciones accesorias', 'suspensión de (?:las )?operaciones'],
    k: 'suspension de tratamiento clausura reiteradas',
    d: `Además de la multa, si hay infracciones gravísimas reiteradas, la Agencia puede suspender por un tiempo las operaciones de tratamiento de datos de la organización.`,
    l: `Art. 38. Si se imponen multas por infracciones gravísimas reiteradas en un período de 24 meses, la Agencia puede disponer la suspensión de las operaciones y actividades de tratamiento por hasta 30 días, total o parcial. No afecta el almacenamiento de los datos y no puede decretarse si con ello se afectan los derechos de los titulares. Si el responsable no cumple lo ordenado, la suspensión puede prorrogarse por períodos sucesivos de máximo 30 días hasta que cumpla.`,
    ej: `Una empresa con infracciones gravísimas repetidas podría tener que detener por un tiempo un tratamiento, como el envío de campañas, hasta corregirlo.`,
    rel: ['infracciones', 'agencia']
  },
  {
    id: 'prescripcion', c: 'sanciones', t: 'Prescripción', n: 'Prescripción', m: ['prescripci[oó]n', 'prescrit[oa]s?'],
    k: 'plazo para sancionar caducidad de acciones',
    d: `El plazo después del cual ya no se puede perseguir una infracción ni cobrar una sanción.`,
    l: `Art. 40. Las acciones para perseguir las infracciones prescriben en cuatro años desde que ocurrió el hecho (si la infracción es continuada, desde que cesó); las sanciones prescriben en tres años desde que la resolución queda ejecutoriada. Las acciones civiles de indemnización prescriben en cinco años desde que queda ejecutoriada la resolución o sentencia que impone la multa (art. 47).`,
    ej: `Un incumplimiento ocurrido en enero de 2027 podría perseguirse hasta enero de 2031, salvo que sea una infracción continuada o se interrumpa la prescripción.`,
    rel: ['infracciones', 'indemnizacion']
  },
  {
    id: 'indemnizacion', c: 'sanciones', t: 'Indemnización de daños a las personas', n: 'Indemnización', m: ['indemniza~', 'daños? patrimonial(?:es)?', 'daños? extrapatrimonial(?:es)?'],
    k: 'danos perjuicios demanda civil compensacion',
    d: `Además de las sanciones, el responsable debe indemnizar el daño económico y el daño moral que su incumplimiento cause a las personas.`,
    l: `Art. 47. Debe indemnizar el daño patrimonial y extrapatrimonial que cause al titular cuando infrinja los principios, derechos y obligaciones de la ley y le cause perjuicio. La acción puede presentarse una vez ejecutoriada la resolución que resolvió favorablemente el reclamo ante la Agencia o, si hubo reclamo de ilegalidad, cuando la sentencia esté firme.`,
    ej: `Si la filtración de los datos de una persona le causa un perjuicio, ella puede demandar una indemnización además de la multa que aplique la Agencia.`,
    rel: ['infracciones', 'prescripcion']
  },

  // ───────── Términos del D360° ─────────
  {
    id: 'd360', c: 'd360', t: 'D360° Privacy Assessment', n: 'D360°',
    k: 'diagnostico assessment aligndata evaluacion madurez',
    d: `Diagnóstico de AlignData que mide qué tan preparada está una organización frente a la Ley 21.719. Revisa ocho dimensiones —Gobierno y liderazgo, Ciclo de vida del dato, Seguridad tecnológica, Cumplimiento normativo, Gestión de riesgos, Derechos del titular, Gestión de terceros y Cultura y formación—, entrega un puntaje, los riesgos y una hoja de ruta de acciones.`,
    rel: ['madurez', 'brecha', 'hoja-de-ruta']
  },
  {
    id: 'madurez', c: 'd360', t: 'Nivel de madurez', n: 'Madurez',
    k: 'puntaje inexistente reactivo parcial gestionado optimizado',
    d: `Qué tan avanzada está la gestión de la privacidad, según el puntaje de 0 a 100: Inexistente (0 a 20), Reactivo (21 a 40), Parcial (41 a 60), Gestionado (61 a 80) y Optimizado (81 a 100). La meta del diagnóstico es llegar a 80 puntos.`,
    rel: ['nivel-riesgo', 'd360']
  },
  {
    id: 'nivel-riesgo', c: 'd360', t: 'Nivel de riesgo de una dimensión', n: 'Nivel de riesgo',
    k: 'critico alto medio semaforo dimension',
    d: `Qué tan urgente es atender una dimensión, según su puntaje: crítico (hasta 30), alto (31 a 55) y medio (56 a 79). Desde 80 se considera alcanzada la meta.`,
    rel: ['madurez', 'brecha']
  },
  {
    id: 'brecha', c: 'd360', t: 'Brecha', n: 'Brecha',
    k: 'diferencia faltante incumplimiento',
    d: `La distancia entre lo que la organización hace hoy y lo que la ley espera o lo que fija la meta del diagnóstico. No es lo mismo que una «brecha de seguridad» (ver «Vulneración de seguridad»).`,
    ej: `La ley espera que haya un procedimiento para responder las solicitudes de las personas y la organización aún no lo tiene: eso es una brecha.`,
    rel: ['hoja-de-ruta', 'vulneracion']
  },
  {
    id: 'semaforo', c: 'd360', t: 'Semáforo de cumplimiento', n: 'Semáforo',
    k: 'cumple parcial no cumple obligaciones',
    d: `Revisión, obligación por obligación de la ley, de si la organización Cumple, cumple en parte («Parcial») o No cumple, según las respuestas del diagnóstico.`,
    rel: ['brecha', 'hoja-de-ruta']
  },
  {
    id: 'hoja-de-ruta', c: 'd360', t: 'Hoja de ruta y etapas', n: 'Hoja de ruta',
    k: 'plan de accion etapas hacer primero planificar aprovechar despues priorizacion tablero',
    d: `El plan de acciones que propone el diagnóstico para cerrar las brechas, ordenado por beneficio y esfuerzo en cuatro etapas: «Hacer primero» (antes de la entrada en vigor), «Planificar» (primeros 3 meses de vigencia), «Aprovechar» (primeros 6 meses) y «Después» (primeros 12 meses). Los plazos son una propuesta de orden, no una exigencia legal.`,
    rel: ['brecha', 'madurez']
  },
  {
    id: 'dimension', c: 'd360', t: 'Dimensión', n: 'Dimensión',
    k: 'tema area ocho dimensiones',
    d: `Cada uno de los ocho grandes temas en que el D360° ordena las preguntas y mide el avance: tiene su propio puntaje y su propio nivel de riesgo.`,
    rel: ['d360', 'nivel-riesgo']
  },
  {
    id: 'alerta-critica', c: 'd360', t: 'Alerta crítica', n: 'Alerta crítica',
    k: 'riesgo significativo prioridad',
    d: `Una respuesta que representa un riesgo significativo ante la ley. No cambia el puntaje: es una señal para atender esa brecha primero. Deja de ser alerta cuando la respuesta mejora.`,
    rel: ['brecha', 'hoja-de-ruta']
  },
  {
    id: 'evidencia', c: 'd360', t: 'Evidencia', n: 'Evidencia', m: ['evidencias?'],
    k: 'respaldo documentos prueba',
    d: `Lo que respalda una respuesta, por ejemplo un documento, un registro o una captura que muestra que lo que se dice ocurre de verdad. En el taller, el consultor confirma cada respuesta con la evidencia; la guía previa indica qué conviene ir preparando.`,
    rel: ['d360', 'madurez']
  },
  {
    id: 'esfuerzo-beneficio', c: 'd360', t: 'Beneficio y esfuerzo', n: 'Beneficio y esfuerzo',
    k: 'prioridad priorizacion puntos esfuerzo',
    d: `Los dos criterios con que la hoja de ruta ordena cada brecha: el beneficio (cuántos puntos del puntaje global se ganan al resolverla) y el esfuerzo (qué tan costoso o largo es hacerlo).`,
    rel: ['hoja-de-ruta', 'brecha']
  },
  {
    id: 'tablero', c: 'd360', t: 'Tablero del plan de acción', n: 'Tablero',
    k: 'kanban tareas estados columnas',
    d: `Vista del plan de acción en columnas, como un tablero de tareas: cada iniciativa se mueve según su estado y se agrupa por la etapa de la hoja de ruta.`,
    rel: ['hoja-de-ruta']
  },

];

// ───────── Búsqueda y textos ─────────
function gloNorm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
const gloPorId = (id) => GLOSARIO.find((x) => x.id === id) || null;
const gloEsc = (x) => (typeof esc === 'function' ? esc(x) : String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
const gloRef = (txt) => (typeof refLey === 'function' ? refLey(txt) : gloEsc(txt));
const gloIndice = (t) => t._b || (t._b = gloNorm([t.t, t.n, t.s, t.k, t.d].join(' ')));
// Las oraciones de un texto (un punto seguido de espacio y mayúscula; «art. 50» no se corta porque después del punto viene un número)
const gloOraciones = (txt) => String(txt).split(/(?<=[a-záéíóúñ0-9)»])\.\s+(?=[A-ZÁÉÍÓÚÑ«])/).map((x, i, a) => (i < a.length - 1 ? x + '.' : x));
// Los textos largos de «qué dice la ley» se muestran en un párrafo por oración, para leerlos con menos esfuerzo.
const gloParrafos = (txt) => (txt.length > 380 ? gloOraciones(txt) : [txt]);
// Resumen para el globito: la primera oración y, si es corta, la segunda
function gloResumen(d) {
  const o = gloOraciones(d);
  return o.length > 1 && o[0].length < 110 ? o[0] + ' ' + o[1] : o[0];
}

// Enlace del glosario para compartir: uno solo, con todo
function glosarioEnlace() { return location.origin + location.pathname + '?glosario=1'; }

// Mensaje corto para acompañar el enlace (WhatsApp u otro medio)
function glosarioMensaje() { return 'Hola, le comparto el glosario de protección de datos del D360° Privacy Assessment (Ley 21.719), con los términos más importantes explicados en palabras simples: ' + glosarioEnlace(); }

// En la pantalla de la pregunta: enlace al glosario completo (se abre en otra pestaña, para no perder la sesión)
function glosarioBtn() {
  return `<span class="gl-qt"><i data-lucide="book-text"></i> <a href="?glosario=1" target="_blank" rel="noopener">Glosario</a></span>`;
}

// ───────── Palabras del cuestionario con su significado (subrayado punteado) ─────────
// Cada término trae sus patrones en «m» («~» = cualquier terminación). Se subraya solo la primera vez que aparece en la pantalla, en el
// orden en que se lee (título, respuestas y recuadros), para no llenar el texto de subrayados. No se tocan botones, enlaces, citas de la ley ni campos.
let gloRe = null, gloIdx = [];
function gloArmar() {
  if (gloRe) return true;
  const pares = [];
  GLOSARIO.forEach((t) => (t.m || []).forEach((p) => pares.push([t.id, p.replace(/~/g, '\\p{L}*')])));
  pares.sort((a, b) => b[1].length - a[1].length); // los patrones más largos primero: «datos personales sensibles» antes que «datos personales»
  gloIdx = pares.map((p) => p[0]);
  try { gloRe = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + pares.map((p) => '(' + p[1] + ')').join('|') + ')(?![\\p{L}\\p{N}_])', 'giu'); } catch (e) { gloRe = null; return false; }
  return true;
}
const GLO_SALTAR = '.gl-w, button, a, input, textarea, select, script, style, svg, .ref, [data-nogl]';
function gloMarcarEl(raiz, visto) {
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (!n.nodeValue.trim() || (n.parentElement && n.parentElement.closest(GLO_SALTAR)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodos = []; while (w.nextNode()) nodos.push(w.currentNode);
  nodos.forEach((n) => {
    const txt = n.nodeValue; gloRe.lastIndex = 0;
    let p = 0, frag = null, m;
    while ((m = gloRe.exec(txt))) {
      const g = m.findIndex((x, k) => k > 0 && x !== undefined) - 1, id = gloIdx[g], t = gloPorId(id);
      if (visto.has(id)) continue;
      visto.add(id);
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(txt.slice(p, m.index)));
      const s = document.createElement('span'); s.className = 'gl-w'; s.tabIndex = 0; s.dataset.g = id; s.textContent = m[0];
      frag.appendChild(s); p = m.index + m[0].length;
    }
    if (frag) { frag.appendChild(document.createTextNode(txt.slice(p))); n.parentNode.replaceChild(frag, n); }
  });
}
// zonas: elementos (o listas de elementos) en el orden en que se leen; cada término se subraya una sola vez en el conjunto
function glosarioMarcar(zonas) {
  if (typeof document === 'undefined' || !gloArmar()) return;
  const visto = new Set();
  [].concat(...(zonas || []).map((z) => (Array.isArray(z) ? z : [z]))).filter(Boolean).forEach((el) => gloMarcarEl(el, visto));
}
// Pantalla de una pregunta (consultor y reunión en vivo): título y subtítulo, las respuestas y cada recuadro «por qué»
function glosarioMarcarPregunta(raiz) {
  if (!raiz) return;
  const todos = (s) => Array.from(raiz.querySelectorAll(s));
  glosarioMarcar([todos('.qt, .qs'), todos('.opts'), ...todos('.lp').map((x) => [x])]);
}
// Guía previa: cada pregunta por separado (su título, cada desplegable y lo que conviene preparar)
function glosarioMarcarGuia(raiz) {
  if (!raiz) return;
  raiz.querySelectorAll('.gp-pq').forEach((a) => glosarioMarcar([[a.querySelector('.gp-pq-t'), a.querySelector('.gp-pq-s')], ...Array.from(a.querySelectorAll('details')).map((d) => [d]), [a.querySelector('.gp-ev')]]));
  raiz.querySelectorAll('.gp-tema').forEach((x) => glosarioMarcar([[x]]));
}

// Globito con el significado: al pasar el cursor, al enfocar con el teclado o al tocar en el celular
let gloTipEl = null, gloTipT = null, gloTipDe = null, gloToque = false;
function gloTip() {
  if (!gloTipEl) {
    gloTipEl = document.createElement('div'); gloTipEl.id = 'gl-tip'; gloTipEl.className = 'gl-tip'; gloTipEl.setAttribute('role', 'tooltip'); gloTipEl.hidden = true;
    gloTipEl.addEventListener('mouseenter', () => clearTimeout(gloTipT));
    gloTipEl.addEventListener('mouseleave', () => gloOcultarTip());
    document.body.appendChild(gloTipEl);
  }
  return gloTipEl;
}
function gloMostrarTip(sp) {
  clearTimeout(gloTipT);
  const t = gloPorId(sp.dataset.g); if (!t) return;
  if (gloTipDe && gloTipDe !== sp) gloTipDe.removeAttribute('aria-describedby');
  const el = gloTip(); gloTipDe = sp;
  el.innerHTML = `<strong>${gloEsc(t.t)}</strong><p>${gloEsc(gloResumen(t.d))}</p><a href="?glosario=1#${t.id}" target="_blank" rel="noopener">Ver en el glosario →</a>`;
  el.hidden = false; sp.setAttribute('aria-describedby', 'gl-tip');
  const r = sp.getBoundingClientRect(), ancho = el.offsetWidth, alto = el.offsetHeight;
  const x = Math.min(Math.max(8, r.left + r.width / 2 - ancho / 2), window.innerWidth - ancho - 8);
  let y = r.bottom + 8; if (y + alto > window.innerHeight - 8 && r.top - alto - 8 > 8) y = r.top - alto - 8;
  el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
}
function gloOcultarTip(ya) {
  clearTimeout(gloTipT);
  const f = () => { if (gloTipEl) gloTipEl.hidden = true; if (gloTipDe) gloTipDe.removeAttribute('aria-describedby'); };
  if (ya === true) f(); else gloTipT = setTimeout(f, 180);
}
if (typeof document !== 'undefined' && document.addEventListener) {
  const palabra = (e) => (e.target && e.target.closest ? e.target.closest('.gl-w') : null);
  document.addEventListener('pointerdown', (e) => { gloToque = e.pointerType === 'touch'; }, true);
  document.addEventListener('mouseover', (e) => { const s = palabra(e); if (s && !gloToque) gloMostrarTip(s); });
  document.addEventListener('mouseout', (e) => { if (palabra(e) && !gloToque) gloOcultarTip(); });
  document.addEventListener('focusin', (e) => { const s = palabra(e); if (s && !gloToque) gloMostrarTip(s); });
  document.addEventListener('focusout', (e) => { if (palabra(e) && !gloToque) gloOcultarTip(); });
  document.addEventListener('click', (e) => {
    const s = palabra(e);
    if (s) { if (gloToque) { e.preventDefault(); if (gloTipEl && !gloTipEl.hidden && gloTipDe === s) gloOcultarTip(true); else gloMostrarTip(s); } return; } // en el celular, tocar la palabra abre o cierra el globito sin elegir la respuesta
    if (gloTipEl && !gloTipEl.hidden && !(e.target.closest && e.target.closest('#gl-tip'))) gloOcultarTip(true);
  }, true);
  document.addEventListener('keydown', (e) => { gloToque = false; if (e.key === 'Escape' && gloTipEl && !gloTipEl.hidden) gloOcultarTip(true); });
  window.addEventListener('scroll', () => { if (gloTipEl && !gloTipEl.hidden) gloOcultarTip(true); }, true);
}

// ───────── Página pública: pestañas por tema, lista a la izquierda y una ficha a la derecha ─────────
let gloCat = '', gloSel = '', gloBusca = '';
const gloEsMovil = () => !!(window.matchMedia && window.matchMedia('(max-width: 760px)').matches);

// Términos que se ven ahora: los del tema elegido, o todos (por orden alfabético) si se busca o se elige «Todos»
function gloLista() {
  const pal = gloNorm(gloBusca).trim().split(/\s+/).filter(Boolean);
  let ts = GLOSARIO.filter((t) => (pal.length || !gloCat || t.c === gloCat) && pal.every((p) => gloIndice(t).includes(p)));
  if (pal.length || !gloCat) ts = ts.slice().sort((a, b) => a.t.localeCompare(b.t, 'es'));
  return ts;
}
const gloLetra = (t) => gloNorm(t.t).charAt(0).toUpperCase();

function gloPintarTabs() {
  const cuenta = (c) => GLOSARIO.filter((t) => !c || t.c === c).length;
  const tab = (id, n, ic, num) => `<button type="button" role="tab" class="gl-tab" id="gl-tab-${id || 'todos'}" data-cat="${id}" aria-selected="${gloCat === id}" tabindex="${gloCat === id ? 0 : -1}" aria-controls="gl-cuerpo">${ic ? `<i data-lucide="${ic}"></i>` : ''}${gloEsc(n)} <span class="gl-nc">${num}</span></button>`;
  return tab('', 'Todos', 'library', cuenta('')) + GLO_CATS.map((c) => tab(c.id, c.n, c.ic, cuenta(c.id))).join('');
}
function gloPintarLista(ts) {
  if (!ts.length) return '';
  const alfa = !gloCat || gloBusca.trim();
  let letra = '', h = '';
  ts.forEach((t) => {
    if (alfa && gloLetra(t) !== letra) { letra = gloLetra(t); h += `<li class="gl-letra" role="presentation" data-l="${letra}">${letra}</li>`; }
    const cat = alfa ? GLO_CATS.find((c) => c.id === t.c) : null;
    h += `<li><button type="button" class="gl-it" data-id="${t.id}" aria-current="${t.id === gloSel}"><span class="gl-itn">${gloEsc(t.t)}</span>${t.s ? `<span class="gl-s">${gloEsc(t.s)}</span>` : ''}${cat && gloBusca.trim() ? `<small>${gloEsc(cat.n)}</small>` : ''}</button></li>`;
  });
  return h;
}
function gloPintarFicha(t) {
  if (!t) return '<p class="gl-vacio">Elija un término de la lista.</p>';
  const cat = GLO_CATS.find((c) => c.id === t.c), rel = (t.rel || []).map(gloPorId).filter(Boolean);
  return `<button type="button" class="gl-volver" id="gl-volver"><i data-lucide="arrow-left"></i> Volver a la lista</button>
<p class="gl-cat"><i data-lucide="${cat ? cat.ic : 'book-text'}"></i> ${gloEsc(cat ? cat.n : '')}${t.bp ? ' <span class="gl-bp" title="La ley no define este término: se explica por su relación con lo que sí dice la ley.">No definido en la ley</span>' : ''}</p>
<h2 id="gl-ft" tabindex="-1">${gloEsc(t.t)}${t.s ? ` <span class="gl-s">${gloEsc(t.s)}</span>` : ''}</h2>
<p class="gl-d">${gloEsc(t.d)}</p>
${t.l ? `<div class="gl-l"><strong>${t.bp ? 'En relación con la ley' : 'Qué dice la ley'}</strong>${gloParrafos(t.l).map((x) => `<p>${gloRef(x)}</p>`).join('')}</div>` : ''}
${t.ej ? `<p class="gl-ej"><strong>Ejemplo</strong> ${gloEsc(t.ej)}</p>` : ''}
${rel.length ? `<p class="gl-rel"><strong>Ver también</strong> ${rel.map((r) => `<button type="button" data-ir="${r.id}">${gloEsc(r.n)}</button>`).join('')}</p>` : ''}`;
}
function gloPintarAZ(ts) {
  if (gloCat || gloBusca.trim()) return '';
  const ls = [...new Set(ts.map(gloLetra))];
  return `<div class="gl-az" aria-label="Ir a la letra">${ls.map((l) => `<button type="button" data-l="${l}">${l}</button>`).join('')}</div>`;
}

// Redibuja las pestañas, la lista y la ficha según el tema, la búsqueda y el término elegido
function gloRefrescar() {
  const c = document.getElementById('gl-c'); if (!c) return;
  const ts = gloLista();
  if (!ts.some((t) => t.id === gloSel)) gloSel = ts.length ? ts[0].id : '';
  document.getElementById('gl-tabs').innerHTML = gloPintarTabs();
  document.getElementById('gl-az').innerHTML = gloPintarAZ(ts);
  document.getElementById('gl-lista').innerHTML = gloPintarLista(ts);
  document.getElementById('gl-ficha').innerHTML = gloPintarFicha(gloPorId(gloSel));
  document.getElementById('gl-vacio').hidden = ts.length > 0;
  document.getElementById('gl-cuerpo').hidden = ts.length === 0;
  gloRefrescarTexto();
  if (window.lucide) lucide.createIcons();
}

// Elige un término: si no está en la lista actual, cambia al tema que le corresponde
function gloElegir(id, o) {
  const t = gloPorId(id); if (!t) return;
  o = o || {};
  if (!gloLista().some((x) => x.id === id)) { gloBusca = ''; const q = document.getElementById('gl-q'); if (q) q.value = ''; gloCat = t.c; }
  gloSel = id;
  gloRefrescar();
  const cuerpo = document.getElementById('gl-cuerpo');
  if (gloEsMovil() && !o.sinFicha) { cuerpo.classList.add('gl-ver-ficha'); if (!o.inicial) window.scrollTo(0, 0); }
  else {
    const it = document.querySelector('.gl-it[data-id="' + id + '"]'); if (it && it.scrollIntoView) it.scrollIntoView({ block: 'nearest' });
    const f = document.getElementById('gl-ficha'); if (f && !o.inicial && f.getBoundingClientRect().top < 0) f.scrollIntoView({ block: 'start' });
  }
  if (!o.inicial) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* sin historial */ } }
}
const gloHash = () => decodeURIComponent((location.hash || '').replace(/^#/, ''));

// Copia un texto; si el navegador no deja, lo muestra
function gloCopiar(txt, aviso) {
  const fin = (m) => { const n = document.getElementById('gl-n'); if (n) { n.textContent = m; setTimeout(gloRefrescarTexto, 2400); } };
  const respaldo = () => fin('No se pudo copiar. El enlace es: ' + txt);
  try { navigator.clipboard.writeText(txt).then(() => fin(aviso), respaldo); } catch (e) { respaldo(); }
}
function gloRefrescarTexto() {
  const n = document.getElementById('gl-n'); if (!n) return;
  const ts = gloLista(), q = gloBusca.trim();
  n.textContent = q ? (ts.length === 1 ? '1 término coincide' : ts.length + ' términos coinciden') + ' con «' + q + '»' : (gloCat ? ts.length + ' términos en este tema' : GLOSARIO.length + ' términos, por orden alfabético');
}

function glosarioHtml() {
  return `<div class="gp gl">
<header class="gp-cab"><p class="gp-sup">AlignData · D360° Privacy Assessment</p><h1>Glosario de protección de datos</h1><p class="gp-lead">Los términos más importantes de la Ley 21.719 y del diagnóstico D360°, explicados en palabras simples. Pulse un artículo (por ejemplo, «art. 50») para leer el texto oficial de la ley.</p>
<div class="gp-acc gl-acc"><label class="sr-only" for="gl-q">Buscar un término</label><input class="dlg-inp gl-q" id="gl-q" type="search" placeholder="Buscar un término: DPO, consentimiento, brecha…" autocomplete="off" aria-controls="gl-lista"><button type="button" class="be be-p" id="gl-cp-todo"><i data-lucide="link"></i> Copiar enlace del glosario</button></div></header>
<div class="gl-tabs" id="gl-tabs" role="tablist" aria-label="Temas del glosario"></div>
<p class="gl-n" id="gl-n" role="status" aria-live="polite"></p>
<div id="gl-az"></div>
<div class="gl-cuerpo" id="gl-cuerpo" role="tabpanel">
<nav class="gl-lista-w" aria-label="Términos"><ul class="gl-lista" id="gl-lista"></ul></nav>
<article class="gl-ficha" id="gl-ficha" aria-live="polite"></article>
</div>
<p class="gl-vacio" id="gl-vacio" hidden>Ningún término coincide con su búsqueda. Pruebe con otra palabra.</p>
<footer class="gp-pie"><p>Este glosario explica la ley en palabras simples y no reemplaza su texto ni una asesoría jurídica. Fuente de los artículos: Ley 21.719, texto vigente desde el 1 de diciembre de 2026 (Biblioteca del Congreso Nacional). Los términos marcados como «No definido en la ley» son conceptos de uso habitual en la gestión de datos que la ley no define.</p><p>AlignData · D360° Privacy Assessment · versión ${GLO_V}</p></footer>
</div>`;
}

function glosarioPagina() {
  document.body.classList.add('cliente', 'guia', 'glosario');
  document.title = 'Glosario de protección de datos — D360° Privacy Assessment';
  const c = document.getElementById('gl-c'); if (!c) return;
  c.innerHTML = glosarioHtml();
  if (typeof ss === 'function') ss('sgl');
  const h = gloHash(), t0 = gloPorId(h);
  if (t0) gloCat = t0.c;
  gloRefrescar();
  if (t0) gloElegir(h, { inicial: true });
  document.getElementById('gl-q').addEventListener('input', (e) => {
    gloBusca = e.target.value; if (gloBusca.trim()) gloCat = '';
    gloRefrescar();
    const cuerpo = document.getElementById('gl-cuerpo'); if (cuerpo) cuerpo.classList.remove('gl-ver-ficha');
  });
  c.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.gl-tab, .gl-it, #gl-cp-todo, #gl-volver, [data-ir], .gl-az button'); if (!b) return;
    if (b.id === 'gl-cp-todo') return gloCopiar(glosarioEnlace(), 'Enlace del glosario copiado');
    if (b.id === 'gl-volver') { document.getElementById('gl-cuerpo').classList.remove('gl-ver-ficha'); const it = document.querySelector('.gl-it[aria-current="true"]'); if (it) it.scrollIntoView({ block: 'center' }); return; }
    if (b.matches('.gl-tab')) { gloCat = b.dataset.cat; gloBusca = ''; gloSel = ''; document.getElementById('gl-q').value = ''; document.getElementById('gl-cuerpo').classList.remove('gl-ver-ficha'); gloRefrescar(); return; }
    if (b.matches('.gl-az button')) { const li = document.querySelector('.gl-letra[data-l="' + b.dataset.l + '"]'); if (li) li.scrollIntoView({ block: 'start' }); return; }
    if (b.dataset.ir) return gloElegir(b.dataset.ir);
    if (b.matches('.gl-it')) return gloElegir(b.dataset.id);
  });
  // flechas entre pestañas
  document.getElementById('gl-tabs').addEventListener('keydown', (e) => {
    const tabs = Array.from(document.querySelectorAll('.gl-tab')), i = tabs.indexOf(document.activeElement);
    if (i < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[j].click(); const nuevo = document.querySelectorAll('.gl-tab')[j]; if (nuevo) nuevo.focus();
  });
  window.addEventListener('hashchange', () => { const x = gloHash(); if (gloPorId(x)) gloElegir(x); });
}

// ───────── Diálogo del consultor: el enlace del glosario, para copiar o enviar por WhatsApp ─────────
function glosarioDlg() {
  const d = document.getElementById('dlg-glo'); if (!d) return;
  document.getElementById('glo-url').value = glosarioEnlace();
  document.getElementById('glo-wa').href = 'https://wa.me/?text=' + encodeURIComponent(glosarioMensaje());
  document.getElementById('glo-abrir').href = glosarioEnlace();
  document.getElementById('glo-ok').textContent = '';
  if (!d.open) d.showModal();
  if (window.lucide) lucide.createIcons();
}
function glosarioCopiar() {
  const e = document.getElementById('glo-url'), ok = document.getElementById('glo-ok'); if (!e) return;
  const fin = (t) => { if (ok) { ok.textContent = t; setTimeout(() => { ok.textContent = ''; }, 2200); } };
  try { navigator.clipboard.writeText(e.value).then(() => fin('Enlace copiado'), () => { e.select(); fin('Seleccionado: use Ctrl+C'); }); } catch (x) { e.select(); fin('Seleccionado: use Ctrl+C'); }
}

if (typeof location !== 'undefined' && typeof document !== 'undefined' && /(^|[?&])glosario=/.test(location.search)) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', glosarioPagina); else glosarioPagina();
}
