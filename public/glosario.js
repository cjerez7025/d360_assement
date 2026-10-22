/* glosario.js — Glosario de protección de datos (Ley 21.719) y del D360° Privacy Assessment.
   Es una página pública (?glosario=1): no pide ingreso ni usa Firebase, así que su enlace se puede compartir con cualquier persona.
   Cada término tiene un enlace propio (?glosario=1#dpo). Lo que dice la ley se redacta con «Art. N», y refLey() (app.js) lo convierte en
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
    id: 'dpo', c: 'roles', t: 'Delegado de protección de datos personales', n: 'DPO', s: 'DPO',
    k: 'delegado encargado de prevencion responsable de privacidad data protection officer',
    d: `Persona que lidera la protección de datos dentro de la organización: asesora, supervisa el cumplimiento de la ley y es el punto de contacto con las personas titulares y con la Agencia. La ley lo llama «delegado de protección de datos personales»; «DPO» es su sigla en inglés (Data Protection Officer).`,
    l: `Designarlo es voluntario: el responsable «podrá» hacerlo (art. 50). Lo designa la máxima autoridad de la organización (el directorio, un socio administrador o equivalente), debe tener autonomía respecto de la administración, idoneidad y conocimientos específicos, y contar con los medios y recursos suficientes para su trabajo. En las micro, pequeñas y medianas empresas, el dueño o sus máximas autoridades pueden asumir personalmente esas tareas (art. 50). Sus funciones están en el art. 50 a) a h): informar y asesorar, promover la política de datos, supervisar el cumplimiento, cuidar la formación del personal, asistir en la identificación de riesgos, desarrollar un plan anual de trabajo y rendir cuenta de sus resultados, absolver las consultas de los titulares y ser punto de contacto de la Agencia. Debe guardar estricto secreto de los datos que conozca. Designar un delegado es además uno de los elementos del programa de cumplimiento (art. 49 a)).`,
    ej: `Una pyme de 40 personas puede asignar el cargo a su gerente general o a una persona de confianza con conocimientos del tema. En una empresa mayor, a alguien del área de cumplimiento o legal con autonomía para opinar sin la presión de las áreas que usan los datos.`,
    q: ['GOB-01', 'GOB-01b'], rel: ['programa-cumplimiento', 'responsable', 'agencia']
  },
  {
    id: 'responsable', c: 'roles', t: 'Responsable de datos', n: 'Responsable',
    k: 'controlador empresa organizacion',
    d: `La persona o empresa que decide para qué y cómo se tratan los datos personales. Es quien responde ante la ley, aunque los datos los maneje un proveedor.`,
    l: `Art. 2 n): toda persona natural o jurídica, pública o privada, que decide acerca de los fines y medios del tratamiento, con independencia de si los datos son tratados directamente por ella o a través de un tercero mandatario o encargado. Debe ser capaz de acreditar la licitud del tratamiento (arts. 3 a) y 13).`,
    ej: `Una tienda que recoge nombre y correo de sus clientes para enviarles ofertas es responsable de esos datos, aunque use una plataforma externa para despachar los correos.`,
    rel: ['encargado', 'titular', 'licitud']
  },
  {
    id: 'encargado', c: 'roles', t: 'Encargado de tratamiento (tercero mandatario)', n: 'Encargado',
    k: 'proveedor procesador mandatario subcontratista',
    d: `Proveedor que trata datos personales por cuenta del responsable y siguiendo sus instrucciones: por ejemplo, quien aloja la información, envía los correos o procesa las remuneraciones.`,
    l: `Art. 2 x) y art. 15 bis. Solo puede usar los datos para el objeto del encargo y no puede cederlos ni subcontratar sin autorización específica y por escrito del responsable. Si los usa para otro objeto o los cede sin autorización, se le considera responsable para todos los efectos legales y responde solidariamente por los daños. Debe cumplir los deberes de secreto y de seguridad (arts. 14 bis y 14 quinquies), reportar al responsable las vulneraciones de seguridad y, al terminar el servicio, suprimir o devolver los datos (art. 15 bis).`,
    ej: `La empresa de contabilidad externa que procesa las remuneraciones del equipo.`,
    q: ['TER-01', 'TER-01b', 'TER-03', 'TER-05'], rel: ['atd', 'responsable', 'cesion']
  },
  {
    id: 'titular', c: 'roles', t: 'Titular de datos', n: 'Titular',
    k: 'persona afectada interesado cliente trabajador',
    d: `La persona natural a quien se refieren los datos personales: clientes, trabajadores, postulantes, personas que visitan el sitio web.`,
    l: `Art. 2 ñ): persona natural, identificada o identificable, a quien conciernen o se refieren los datos personales. La ley regula los datos de personas naturales (art. 1): no protege los datos de una empresa en cuanto tal.`,
    ej: `Una trabajadora cuyo contrato, sueldo y datos de contacto guarda la empresa.`,
    rel: ['dato-personal', 'arcop']
  },
  {
    id: 'agencia', c: 'roles', t: 'Agencia de Protección de Datos Personales', n: 'Agencia', s: 'la Agencia',
    k: 'autoridad fiscalizador regulador',
    d: `Autoridad creada por la ley para velar por su cumplimiento: atiende los reclamos de las personas, dicta instrucciones, certifica los modelos de prevención y sanciona las infracciones.`,
    l: `Art. 2 y). Vela por el efectivo ejercicio de los derechos de las personas (art. 10); a ella puede reclamar el titular cuando el responsable rechaza o no responde su solicitud (art. 11) y a ella se reportan las vulneraciones de seguridad (art. 14 sexies). Certifica y supervisa los modelos de prevención de infracciones (art. 51) y aplica las sanciones (art. 35).`,
    ej: `Si una empresa rechaza la solicitud de una clienta para que borre sus datos, ella puede reclamar ante la Agencia dentro de 30 días hábiles.`,
    q: ['SEG-02b', 'RIE-02'], rel: ['infracciones', 'vulneracion', 'programa-cumplimiento']
  },

  // ───────── Tipos de datos ─────────
  {
    id: 'dato-personal', c: 'datos', t: 'Dato personal', n: 'Dato personal',
    k: 'informacion persona identificable rut correo nombre',
    d: `Cualquier información que se refiere a una persona natural identificada o que se puede identificar: nombre, RUT, correo, teléfono, dirección, una fotografía, los datos de su contrato.`,
    l: `Art. 2 f): cualquier información vinculada o referida a una persona natural identificada o identificable. Es identificable la persona cuya identidad puede determinarse, directa o indirectamente, en particular mediante identificadores como el nombre o el número de cédula de identidad. Para decidirlo se consideran todos los medios y factores objetivos que razonablemente se podrían usar para identificarla en el momento del tratamiento.`,
    ej: `El correo «ana.perez@empresa.cl» es un dato personal. Una lista de compras sin nombres pero con RUT también lo es, porque el RUT identifica a la persona.`,
    q: ['REG-01', 'REG-06'], rel: ['dato-sensible', 'anonimizacion', 'tratamiento']
  },
  {
    id: 'dato-sensible', c: 'datos', t: 'Dato personal sensible', n: 'Dato sensible',
    k: 'salud religion sindical biometrico especial',
    d: `Datos personales especialmente delicados porque revelan aspectos íntimos de la vida de una persona. Exigen más cuidado y, por regla general, el consentimiento expreso del titular.`,
    l: `Art. 2 g): origen étnico o racial, afiliación política, sindical o gremial, situación socioeconómica, convicciones ideológicas o filosóficas, creencias religiosas, datos de salud, perfil biológico humano, datos biométricos y la información sobre la vida sexual, la orientación sexual y la identidad de género. Por regla general solo se tratan con consentimiento expreso (art. 16); los datos de salud y del perfil biológico tienen reglas propias (art. 16 bis) y los biométricos también (art. 16 ter). Tratarlos o cederlos a sabiendas contra la ley es una infracción gravísima (art. 34 quáter e)).`,
    ej: `Una licencia médica de un trabajador, su afiliación sindical o la huella digital que usa para marcar su asistencia.`,
    q: ['SEN-01', 'SEN-01b', 'SEN-02', 'SEN-03', 'SEN-05'], rel: ['biometrico', 'ninos', 'consentimiento', 'eipd']
  },
  {
    id: 'biometrico', c: 'datos', t: 'Datos biométricos', n: 'Biométricos',
    k: 'huella digital rostro voz iris reconocimiento facial',
    d: `Datos obtenidos a partir de las características físicas, fisiológicas o de conducta de una persona que permiten identificarla de forma única: la huella digital, el iris, los rasgos de la mano o del rostro y la voz.`,
    l: `Art. 16 ter. Son datos sensibles (art. 2 g)). Solo pueden tratarse con consentimiento expreso (art. 16) y entregando al titular información específica: el sistema biométrico que se usa, su finalidad, el período durante el cual se usarán los datos y cómo ejercer sus derechos.`,
    ej: `Un reloj control con huella digital o una puerta con reconocimiento facial.`,
    q: ['SEN-05'], rel: ['dato-sensible', 'consentimiento']
  },
  {
    id: 'ninos', c: 'datos', t: 'Datos de niños, niñas y adolescentes', n: 'Niños y adolescentes',
    k: 'menores de edad colegio alumnos padres representantes',
    d: `Datos de personas menores de 18 años. Su tratamiento debe respetar el interés superior del niño y su autonomía progresiva, y en muchos casos requiere la autorización de sus padres o representantes.`,
    l: `Art. 16 quáter. Son niños o niñas los menores de 14 años y adolescentes los mayores de 14 y menores de 18. Para tratar datos de niños y niñas se requiere el consentimiento de sus padres, representantes legales o de quien tiene su cuidado personal, salvo que la ley lo autorice expresamente; los datos sensibles de adolescentes menores de 16 años también lo requieren. Tratarlos infringiendo la ley es una infracción grave (art. 34 ter g)).`,
    ej: `Un colegio, un club deportivo infantil o una app que registra la edad de sus usuarios.`,
    q: ['SEN-04'], rel: ['dato-sensible', 'consentimiento']
  },
  {
    id: 'anonimizacion', c: 'datos', t: 'Anonimización', n: 'Anonimización',
    k: 'anonimizar irreversible deja de ser dato personal',
    d: `Procedimiento irreversible que impide vincular un dato con una persona, porque se destruye el nexo que permitía identificarla. Un dato bien anonimizado deja de ser un dato personal.`,
    l: `Art. 2 k). Cuando ya no se necesitan para cumplir los fines del tratamiento, los datos deben suprimirse o anonimizarse (art. 3 c)).`,
    ej: `Una estadística de ventas por comuna, sin nombres ni RUT, en la que ya no es posible saber de qué cliente viene cada venta.`,
    q: ['REG-02'], rel: ['seudonimizacion', 'proporcionalidad']
  },
  {
    id: 'seudonimizacion', c: 'datos', t: 'Seudonimización', n: 'Seudonimización',
    k: 'pseudonimizacion codigo reversible',
    d: `Tratar los datos de modo que ya no puedan atribuirse a una persona sin usar información adicional que se guarda por separado y protegida; por ejemplo, reemplazar el nombre por un código. A diferencia de la anonimización, se puede revertir con esa información adicional.`,
    l: `Art. 2 l). La ley la menciona, junto con el cifrado, como una de las medidas de seguridad que se deben considerar (art. 14 quinquies a)).`,
    ej: `Una planilla de encuestas donde cada persona aparece con un código (P-0417) y la tabla que une el código con el nombre está en otro lugar, con acceso restringido.`,
    rel: ['anonimizacion', 'medidas-seguridad', 'cifrado']
  },
  {
    id: 'perfiles', c: 'datos', t: 'Elaboración de perfiles y decisiones automatizadas', n: 'Perfiles',
    k: 'perfilamiento algoritmo scoring decision automatizada inteligencia artificial',
    d: `Usar datos de una persona, de forma automatizada, para evaluar o predecir cómo es o cómo se comportará: su rendimiento, situación económica, preferencias, ubicación, etc. Si una decisión que la afecta de manera importante se basa en ese tratamiento automatizado, la persona tiene derecho a oponerse.`,
    l: `Art. 2 w) define la elaboración de perfiles. El titular tiene derecho a oponerse y a no ser objeto de decisiones basadas en el tratamiento automatizado de sus datos, incluida la elaboración de perfiles, que produzcan efectos jurídicos en él o lo afecten significativamente; hay excepciones (contrato, consentimiento previo y expreso, o la ley), pero aun así el responsable debe asegurar los derechos del titular (art. 8 bis). Debe informar de su existencia y de la lógica aplicada (art. 14 ter l)) y puede requerir una evaluación de impacto (art. 15 ter).`,
    ej: `Un sistema que descarta automáticamente postulantes según un puntaje, o que decide si se otorga un crédito sin que una persona lo revise.`,
    q: ['ARC-07', 'RIE-01b'], rel: ['eipd', 'oposicion']
  },

  // ───────── Tratar datos con licitud ─────────
  {
    id: 'tratamiento', c: 'tratamiento', t: 'Tratamiento de datos', n: 'Tratamiento',
    k: 'operacion recolectar almacenar usar tratar',
    d: `Cualquier cosa que se haga con datos personales: recolectarlos, guardarlos, consultarlos, usarlos, enviarlos o borrarlos, con o sin computador.`,
    l: `Art. 2 o): cualquier operación o conjunto de operaciones o procedimientos técnicos, automatizados o no, que permitan de cualquier forma recolectar, procesar, almacenar, comunicar, transmitir o utilizar datos personales.`,
    ej: `Guardar currículums en una carpeta compartida, enviar un correo a clientes o archivar fichas en papel son tratamientos de datos.`,
    rel: ['dato-personal', 'licitud']
  },
  {
    id: 'principios', c: 'tratamiento', t: 'Principios del tratamiento de datos', n: 'Principios',
    k: 'licitud lealtad finalidad proporcionalidad calidad responsabilidad seguridad transparencia confidencialidad',
    d: `Las reglas de fondo que guían todo tratamiento de datos. Si una práctica de la organización choca con alguno, probablemente hay un problema aunque ninguna otra regla la mencione.`,
    l: `Art. 3: licitud y lealtad, finalidad, proporcionalidad, calidad (datos exactos, completos, actuales y pertinentes), responsabilidad (quienes tratan datos responden por su cumplimiento), seguridad, transparencia e información, y confidencialidad.`,
    ej: `Una empresa que pide el RUT para participar en un concurso y lo usa después para cobranzas choca con los principios de finalidad y de proporcionalidad.`,
    rel: ['finalidad', 'proporcionalidad', 'licitud', 'transparencia']
  },
  {
    id: 'consentimiento', c: 'tratamiento', t: 'Consentimiento', n: 'Consentimiento',
    k: 'autorizacion aceptar casilla revocar',
    d: `Autorización del titular para tratar sus datos. Debe ser libre, específica, informada e inequívoca, y la persona puede retirarla en cualquier momento.`,
    l: `Art. 2 p) y art. 12. Debe darse antes del tratamiento y de forma inequívoca, mediante una declaración verbal, escrita o electrónica, o un acto afirmativo, y para finalidades determinadas. Se puede revocar en cualquier momento y sin expresar causa, por medios similares a los usados para otorgarlo, sin efectos retroactivos. Le corresponde al responsable probar que lo obtuvo. Se presume que no fue libre si se pide en el marco de un contrato o servicio en que no era necesario recolectar esos datos (con una excepción prevista en el mismo artículo). Para los datos sensibles se exige consentimiento expreso (art. 16).`,
    ej: `Una casilla sin marcar de antemano que dice «Acepto recibir ofertas por correo», con registro de la fecha en que la persona la marcó, y un enlace para darse de baja tan fácil como fue suscribirse.`,
    q: ['LEG-01b', 'LEG-03', 'SEN-02'], rel: ['licitud', 'dato-sensible', 'finalidad']
  },
  {
    id: 'licitud', c: 'tratamiento', t: 'Base de licitud (base legal)', n: 'Base de licitud',
    k: 'base legal fundamento legal licito sin consentimiento contrato obligacion legal',
    d: `El motivo que la ley acepta para poder tratar datos personales. Sin una base válida, tratar los datos es una infracción. El consentimiento es una de ellas, pero hay otras que no lo requieren.`,
    l: `Art. 12 (consentimiento) y art. 13: una obligación legal o lo que disponga la ley; la ejecución de un contrato o de medidas precontractuales pedidas por el titular; el interés legítimo del responsable o de un tercero, si no afecta los derechos del titular; la defensa de un derecho ante tribunales u órganos públicos; y los datos de obligaciones económicas, financieras, bancarias o comerciales, con las reglas especiales de los arts. 17 a 19. El responsable debe poder acreditar la licitud del tratamiento (art. 13). Tratar sin consentimiento ni otra base legal es una infracción grave (art. 34 ter a)).`,
    ej: `Guardar el RUT y la dirección de un cliente para emitir una factura se apoya en el contrato y en una obligación legal, no en el consentimiento.`,
    q: ['LEG-01', 'LEG-05'], rel: ['consentimiento', 'interes-legitimo', 'finalidad']
  },
  {
    id: 'interes-legitimo', c: 'tratamiento', t: 'Interés legítimo', n: 'Interés legítimo',
    k: 'base de licitud sin consentimiento ponderacion',
    d: `Base de licitud que permite tratar datos sin consentimiento cuando es necesario para un interés real del responsable o de un tercero, siempre que no se afecten los derechos y libertades de la persona.`,
    l: `Art. 13 d). El titular puede exigir ser informado del tratamiento y del interés legítimo en que se basa, y puede oponerse en cualquier momento; el responsable debe dejar de tratar los datos salvo que acredite motivos legítimos imperiosos (art. 8 a)).`,
    ej: `Una empresa que revisa los registros de acceso a su sistema para detectar intentos de fraude: protege un interés propio y lo hace de manera proporcionada.`,
    rel: ['licitud', 'oposicion']
  },
  {
    id: 'finalidad', c: 'tratamiento', t: 'Finalidad', n: 'Finalidad',
    k: 'proposito para que se usan los datos nuevo uso',
    d: `El propósito para el cual se recogen los datos. Debe ser específico, explícito y lícito, y los datos no pueden usarse para fines distintos a los informados.`,
    l: `Art. 3 b). No se pueden tratar datos con fines distintos a los informados al recolectarlos, salvo que el tratamiento sea para fines compatibles con los autorizados originalmente u ocurran las otras situaciones que la ley indica. Si el consentimiento no consideró la cesión de los datos, debe recabarse antes de ceder (art. 15). Usarlos con una finalidad distinta, sin una base que lo permita, es una infracción grave (art. 34 ter a)).`,
    ej: `Si el correo de una persona se pidió para enviarle una factura, no puede usarse para enviarle publicidad sin una base que lo permita.`,
    q: ['REG-01b', 'LEG-04'], rel: ['cesion', 'licitud', 'proporcionalidad']
  },
  {
    id: 'proporcionalidad', c: 'tratamiento', t: 'Proporcionalidad (minimización)', n: 'Proporcionalidad',
    k: 'minimizacion datos necesarios retencion conservacion eliminar plazo',
    d: `Pedir y guardar solo los datos necesarios, adecuados y pertinentes para el fin, y solo durante el tiempo que haga falta. Cuando ya no se necesitan, se eliminan o se anonimizan.`,
    l: `Art. 3 c). «Minimización» es el nombre habitual de este principio; la ley lo llama proporcionalidad. Tratar datos innecesarios para los fines del tratamiento es una infracción grave (art. 34 ter c)).`,
    ej: `Un formulario de contacto no necesita la fecha de nacimiento ni el estado civil de quien escribe.`,
    q: ['REG-02', 'SEG-04'], rel: ['anonimizacion', 'finalidad', 'diseno']
  },
  {
    id: 'cesion', c: 'tratamiento', t: 'Cesión y comunicación de datos', n: 'Cesión',
    k: 'ceder entregar compartir datos a terceros comunicar',
    d: `Cesión: entregar datos personales a otro responsable, que pasa a decidir sobre ellos. Comunicación: darlos a conocer a alguien distinto del titular sin llegar a cederlos.`,
    l: `Art. 2 v) y c), y art. 15. La cesión requiere el consentimiento del titular u otra causal que la ley permita, debe constar por escrito o por un medio electrónico idóneo, y el cesionario pasa a ser responsable de los datos. Una cesión hecha sin el consentimiento cuando era necesario es nula, y el cesionario debe suprimir los datos recibidos (art. 15). No es lo mismo que encargar el tratamiento a un proveedor, que actúa por cuenta del responsable (art. 15 bis).`,
    ej: `Entregar la lista de clientes a una empresa asociada para que les ofrezca sus propios productos es una cesión. Contratar a una empresa solo para despachar sus correos no lo es: ella actúa como encargada.`,
    q: ['LEG-04', 'REG-03'], rel: ['encargado', 'finalidad', 'consentimiento']
  },

  // ───────── Derechos de las personas ─────────
  {
    id: 'arcop', c: 'derechos', t: 'Derechos de las personas (ARCOP)', n: 'ARCOP', s: 'ARCOP',
    k: 'derechos del titular acceso rectificacion cancelacion supresion oposicion portabilidad bloqueo',
    d: `Los derechos que tienen las personas sobre sus datos: acceso, rectificación, supresión (antes llamada cancelación), oposición y portabilidad, más el bloqueo temporal. «ARCOP» es una sigla de uso común: no aparece en la ley.`,
    l: `Art. 4: acceso, rectificación, supresión, oposición, portabilidad y bloqueo (seis derechos). Son personales, intransferibles e irrenunciables, y en caso de fallecimiento pueden ejercerlos los herederos, salvo que la persona lo hubiese prohibido o la ley lo establezca. Rectificación, supresión y oposición se ejercen siempre gratis; el acceso, gratis al menos una vez por trimestre (art. 10).`,
    ej: `Una clienta pide por correo que le informen qué datos suyos tiene la empresa (acceso) y que corrijan su dirección (rectificación).`,
    q: ['ARC-01', 'ARC-01b', 'ARC-06', 'ARC-08'], rel: ['plazo-respuesta', 'acceso', 'rectificacion', 'supresion', 'oposicion', 'portabilidad', 'bloqueo']
  },
  {
    id: 'acceso', c: 'derechos', t: 'Derecho de acceso', n: 'Acceso',
    k: 'copia de mis datos saber que datos tienen',
    d: `Derecho a saber si la organización trata sus datos y a obtenerlos, junto con información sobre su origen, para qué se usan, a quiénes se comunicaron y por cuánto tiempo se conservarán.`,
    l: `Art. 5 y art. 2 q). Incluye la información significativa sobre la lógica aplicada cuando hay decisiones automatizadas (art. 8 bis). Se ejerce gratis al menos una vez por trimestre (art. 10).`,
    ej: `Un extrabajador pide una copia de los datos que la empresa conserva sobre él.`,
    q: ['ARC-02'], rel: ['arcop', 'plazo-respuesta']
  },
  {
    id: 'rectificacion', c: 'derechos', t: 'Derecho de rectificación', n: 'Rectificación',
    k: 'corregir actualizar datos inexactos',
    d: `Derecho a que se corrijan o completen los datos que son inexactos, están desactualizados o incompletos.`,
    l: `Art. 6. Los datos rectificados deben comunicarse a las personas u organismos a quienes el responsable los haya comunicado o cedido, salvo que sea imposible o exija un esfuerzo desproporcionado.`,
    ej: `Corregir en todos los sistemas el correo mal escrito de un cliente.`,
    q: ['ARC-05'], rel: ['arcop', 'bloqueo']
  },
  {
    id: 'supresion', c: 'derechos', t: 'Derecho de supresión', n: 'Supresión',
    k: 'eliminar borrar cancelacion olvido',
    d: `Derecho a que se eliminen los datos en los casos que fija la ley: ya no son necesarios, se retiró el consentimiento, se obtuvieron ilícitamente, son caducos, una sentencia o una obligación legal lo exige, o tras una oposición sin otro fundamento.`,
    l: `Art. 7 (y art. 2 s)). No procede cuando el tratamiento sea necesario, entre otros casos, para cumplir una obligación legal o ejecutar un contrato entre el titular y el responsable, o para formular, ejercer o defender una reclamación administrativa o judicial (art. 7).`,
    ej: `Una persona retira su consentimiento a recibir promociones y pide que borren su ficha de marketing. La empresa debe hacerlo, pero puede conservar lo que la ley le obliga a guardar, como una factura.`,
    q: ['ARC-05'], rel: ['arcop', 'bloqueo', 'consentimiento']
  },
  {
    id: 'oposicion', c: 'derechos', t: 'Derecho de oposición', n: 'Oposición',
    k: 'no quiero marketing publicidad dejar de recibir',
    d: `Derecho a oponerse a un tratamiento determinado en ciertos casos: cuando se basa en el interés legítimo del responsable, cuando es para marketing directo o cuando los datos vienen de una fuente de acceso público y no hay otro fundamento.`,
    l: `Art. 8 a) a c) (y art. 2 t)). Cuando la base es el interés legítimo, el responsable debe dejar de tratar los datos salvo que acredite motivos legítimos imperiosos. La ley también da derecho a oponerse a decisiones basadas en el tratamiento automatizado (art. 8 bis).`,
    ej: `Un cliente pide no recibir más correos de ofertas: la empresa debe dejar de enviárselos.`,
    rel: ['arcop', 'perfiles', 'interes-legitimo']
  },
  {
    id: 'portabilidad', c: 'derechos', t: 'Derecho a la portabilidad', n: 'Portabilidad',
    k: 'llevar mis datos exportar formato estructurado',
    d: `Derecho a recibir una copia de los datos que la persona entregó, en un formato electrónico estructurado y de uso común, y a llevarlos a otro responsable.`,
    l: `Art. 9 (y art. 2 u)). Procede cuando el tratamiento se hace en forma automatizada y se basa en el consentimiento del titular. La persona puede pedir que sus datos pasen directamente de un responsable a otro cuando sea técnicamente posible. Pedirla no supone que se supriman los datos, salvo que el titular lo pida junto con la solicitud.`,
    ej: `Exportar el historial de un cliente en un archivo CSV para que lo lleve a otro proveedor.`,
    q: ['ARC-03'], rel: ['arcop', 'acceso']
  },
  {
    id: 'bloqueo', c: 'derechos', t: 'Derecho de bloqueo temporal', n: 'Bloqueo',
    k: 'suspender tratamiento mientras se resuelve',
    d: `Derecho a pedir que se suspenda temporalmente el tratamiento de los datos mientras se resuelve una solicitud de rectificación, supresión u oposición. Los datos se siguen almacenando.`,
    l: `Art. 8 ter y art. 11. La solicitud de bloqueo debe ser fundada y el responsable debe responder dentro de los dos días hábiles siguientes a su recepción; mientras no resuelva, no puede tratar los datos que forman parte del requerimiento. También puede ejercerse como alternativa a la supresión en los casos del art. 7. No afecta el almacenamiento de los datos.`,
    ej: `Una persona discute la exactitud de un dato y pide el bloqueo hasta que la empresa resuelva su solicitud de rectificación.`,
    q: ['ARC-04'], rel: ['arcop', 'rectificacion', 'supresion']
  },
  {
    id: 'plazo-respuesta', c: 'derechos', t: 'Plazo para responder una solicitud', n: 'Plazo de respuesta',
    k: 'treinta dias corridos reclamo agencia acusar recibo prorroga respuesta escrita',
    d: `Cuando una persona ejerce un derecho, la organización debe acusar recibo y responder por escrito dentro de un plazo máximo. Si rechaza la solicitud, debe fundarlo e informar cómo reclamar ante la Agencia.`,
    l: `Art. 11. El responsable debe acusar recibo y pronunciarse a más tardar dentro de los 30 días corridos siguientes a la fecha de ingreso de la solicitud, plazo que puede prorrogarse por una sola vez hasta por otros 30 días corridos. La respuesta es por escrito, y debe guardar los respaldos que demuestren su envío, su fecha y su contenido íntegro. Si rechaza total o parcialmente, debe fundar su decisión y señalar que la persona dispone de 30 días hábiles para reclamar ante la Agencia. También puede reclamar si no hay respuesta en el plazo. Para ejercer sus derechos la persona debe acreditar su identidad según lo que establezca la Agencia (art. 11 a)).`,
    ej: `Una solicitud ingresada el 1 de marzo debe responderse a más tardar el 31 de marzo; si se prorroga, hasta el 30 de abril.`,
    q: ['ARC-01b', 'ARC-06', 'ARC-08'], rel: ['arcop', 'agencia']
  },

  // ───────── Deberes de la organización ─────────
  {
    id: 'transparencia', c: 'deberes', t: 'Deber de información y transparencia (política de privacidad)', n: 'Transparencia',
    k: 'politica de privacidad aviso de privacidad sitio web informar',
    d: `Obligación de mantener siempre a disposición del público, por ejemplo en el sitio web, la información sobre cómo se tratan los datos: quién es el responsable, para qué se usan, a quiénes se entregan, cuánto tiempo se conservan y cómo ejercer los derechos.`,
    l: `Art. 14 ter y art. 3 g). Incluye la política de tratamiento con su fecha y versión, la identificación del responsable, el medio de contacto para las solicitudes, las categorías de datos, las finalidades y la base de licitud, las medidas de seguridad, los derechos de los titulares y el de reclamar ante la Agencia, las transferencias a otros países, el período de conservación y la existencia de decisiones automatizadas. Incumplirlo, total o parcialmente, es una infracción leve (art. 34 bis a)).`,
    ej: `Una página «Política de privacidad» en el pie del sitio, con fecha y versión, y un correo para recibir solicitudes.`,
    q: ['GOB-02', 'LEG-02', 'REG-04'], rel: ['principios', 'arcop']
  },
  {
    id: 'secreto', c: 'deberes', t: 'Deber de secreto o confidencialidad', n: 'Confidencialidad',
    k: 'secreto confidencialidad reserva divulgar clausula',
    d: `Obligación de no divulgar los datos personales que se conocen en la actividad de la organización, incluso después de terminada la relación con la persona. El responsable debe lograr que su personal y sus proveedores también lo cumplan.`,
    l: `Art. 14 bis y art. 3 h). Se exceptúan los datos que el titular hizo manifiestamente públicos y las comunicaciones que la ley obliga a hacer. El responsable debe adoptar las medidas para que sus dependientes y quienes traten datos bajo su responsabilidad cumplan el deber. Vulnerarlo es una infracción grave (art. 34 ter i)), y gravísima si afecta datos sensibles (art. 34 quáter d)).`,
    ej: `Un trabajador de remuneraciones no comenta con otras personas el sueldo ni la licencia médica de un compañero, y su contrato incluye una cláusula de confidencialidad.`,
    q: ['CUL-02', 'CUL-03'], rel: ['medidas-seguridad', 'programa-cumplimiento']
  },
  {
    id: 'diseno', c: 'deberes', t: 'Protección desde el diseño y por defecto', n: 'Desde el diseño',
    k: 'privacy by design by default nuevo sistema producto',
    d: `Pensar en la protección de datos desde antes de lanzar un sistema, proceso o producto, y configurarlo para que, por defecto, solo se traten los datos estrictamente necesarios.`,
    l: `Art. 14 quáter. El responsable debe aplicar medidas técnicas y organizativas adecuadas desde el diseño, antes y durante el tratamiento, y garantizar que, por defecto, solo se traten los datos específicos y estrictamente necesarios para la actividad.`,
    ej: `Un formulario de inscripción nuevo que parte pidiendo solo nombre y correo, con las casillas opcionales desmarcadas.`,
    q: ['SEG-04'], rel: ['eipd', 'proporcionalidad']
  },
  {
    id: 'eipd', c: 'deberes', t: 'Evaluación de impacto en protección de datos (EIPD)', n: 'EIPD', s: 'EIPD · DPIA',
    k: 'dpia evaluacion de impacto alto riesgo privacy impact assessment pia',
    d: `Análisis previo de los riesgos que un tratamiento puede tener para las personas y de las medidas para reducirlos. Se hace antes de comenzar cuando el tratamiento es de alto riesgo. DPIA es su sigla en inglés (Data Protection Impact Assessment).`,
    l: `Art. 15 ter. Se requiere cuando es probable que un tratamiento produzca un alto riesgo para los derechos de las personas, y siempre en estos casos: la evaluación sistemática y exhaustiva de aspectos personales basada en tratamiento o decisiones automatizadas, como los perfiles, con efectos jurídicos significativos; el tratamiento masivo o a gran escala; la observación o el monitoreo sistemático de una zona de acceso público; y el tratamiento de datos sensibles y especialmente protegidos en las hipótesis de excepción del consentimiento. La Agencia publicará una lista orientativa. No hacerla cuando corresponde es una infracción gravísima (art. 34 quáter k)).`,
    ej: `Antes de instalar cámaras con reconocimiento facial en la entrada, o de lanzar un sistema que califica automáticamente a los clientes, la empresa evalúa los riesgos y define cómo reducirlos.`,
    q: ['RIE-01', 'RIE-01b', 'RIE-05'], rel: ['perfiles', 'dato-sensible', 'diseno']
  },
  {
    id: 'programa-cumplimiento', c: 'deberes', t: 'Modelo de prevención de infracciones (programa de cumplimiento)', n: 'Programa de cumplimiento',
    k: 'modelo de prevencion certificacion compliance',
    d: `Conjunto de políticas, procedimientos y controles que una organización adopta voluntariamente para prevenir infracciones a la ley. Puede ser certificado por la Agencia.`,
    l: `Arts. 49 a 51. Adoptarlo es voluntario. Debe contener, al menos: la designación de un delegado y la definición de sus medios y facultades; la identificación del tipo de información que se trata y de los titulares; la identificación de los procesos donde hay riesgo de infracción; protocolos y procedimientos para prevenirlas; mecanismos de reporte interno y a la Agencia; y sanciones internas y procedimientos de denuncia (art. 49). Sus reglas deben incorporarse a los contratos de trabajo o de prestación de servicios, o al reglamento interno. La certificación vigente se consigna en el Registro Nacional de Sanciones y Cumplimiento (arts. 51 y 39) y haber cumplido diligentemente los deberes de dirección y supervisión, verificado con ese certificado, es una atenuante (art. 36).`,
    ej: `Una empresa documenta su política de privacidad, nombra una delegada, capacita a todo el personal, incorpora las reglas en su reglamento interno y se somete a certificación.`,
    q: ['RIE-03', 'CUL-03'], rel: ['dpo', 'registro-sanciones', 'infracciones']
  },
  {
    id: 'mapa-datos', c: 'deberes', bp: true, t: 'Inventario de tratamientos (mapa de datos)', n: 'Mapa de datos',
    k: 'inventario registro de actividades de tratamiento rat flujo de datos',
    d: `Listado de qué datos personales trata la organización, para qué, con qué base, dónde se guardan, quién accede, a quién se ceden y por cuánto tiempo. Es la base para cumplir casi todo lo demás.`,
    l: `La ley no usa este término ni lo exige expresamente. Se relaciona con el modelo de prevención, que pide identificar el tipo de información que se trata, las bases de datos y los titulares (art. 49 c)), y con la información que debe publicarse sobre categorías de datos, finalidades y destinatarios (art. 14 ter d)).`,
    ej: `Una planilla con una fila por actividad: «Reclutamiento — currículums — correo y carpeta compartida de RR.HH. — 6 meses».`,
    q: ['REG-01', 'REG-06', 'REG-03'], rel: ['tratamiento', 'transparencia', 'programa-cumplimiento']
  },

  // ───────── Seguridad e incidentes ─────────
  {
    id: 'medidas-seguridad', c: 'seguridad', t: 'Medidas de seguridad', n: 'Seguridad',
    k: 'controles tecnicos organizativos proteger datos respaldo restaurar',
    d: `Controles técnicos y de organización para proteger los datos de accesos no autorizados, pérdida, filtración o destrucción. Deben ser proporcionales al riesgo, al tipo de dato y a la tecnología disponible.`,
    l: `Art. 14 quinquies y art. 3 f). Entre ellas, la ley menciona: la seudonimización y el cifrado, la capacidad de garantizar la confidencialidad, integridad, disponibilidad y resiliencia de los sistemas, la capacidad de restaurar rápidamente el acceso a los datos tras un incidente y un proceso regular de verificación de la eficacia de las medidas. Si hay un incidente, le corresponde al responsable acreditar que esas medidas existían y funcionaban. Los estándares mínimos se determinan según el tipo de dato, el tamaño de la entidad, su actividad y el volumen y naturaleza de los datos (art. 14 septies). Vulnerarlas es una infracción grave (art. 34 ter j)).`,
    ej: `Contraseñas robustas con segundo factor de autenticación, cifrado de los computadores portátiles, copias de respaldo que se prueban y accesos solo para quienes los necesitan.`,
    q: ['SEG-01', 'SEG-03', 'SEG-05', 'SEG-06'], rel: ['cifrado', 'control-acceso', 'vulneracion']
  },
  {
    id: 'cifrado', c: 'seguridad', bp: true, t: 'Cifrado (TLS / HTTPS)', n: 'Cifrado', s: 'TLS · HTTPS',
    k: 'encriptacion candado certificado',
    d: `Transformar los datos para que solo puedan leerse con una clave. En reposo protege lo almacenado (discos, copias de respaldo); en tránsito, lo que viaja por la red. HTTPS usa el protocolo TLS para proteger la conexión con un sitio web.`,
    l: `La ley no define el cifrado, pero lo menciona como una de las medidas de seguridad (art. 14 quinquies a)).`,
    ej: `El candado de un sitio con HTTPS protege lo que las personas escriben en un formulario mientras viaja; un disco cifrado protege la información si roban el computador.`,
    q: ['SEG-01'], rel: ['medidas-seguridad', 'seudonimizacion']
  },
  {
    id: 'control-acceso', c: 'seguridad', bp: true, t: 'Control de acceso (RBAC y mínimo privilegio)', n: 'Control de acceso', s: 'RBAC',
    k: 'permisos roles accesos registro de accesos privilegios',
    d: `Dar a cada persona solo el acceso a los datos que necesita para su trabajo (mínimo privilegio) y registrar quién accede. RBAC (control de acceso basado en roles) asigna esos permisos según el cargo, no persona por persona.`,
    l: `La ley no usa estos términos. Se relacionan con las medidas de seguridad (art. 14 quinquies) y con el deber de confidencialidad (art. 14 bis).`,
    ej: `Quien atiende el mostrador ve nombre y teléfono del cliente, pero no sus datos de pago; solo Recursos Humanos ve las fichas del personal.`,
    q: ['SEG-03'], rel: ['medidas-seguridad', 'secreto']
  },
  {
    id: 'vulneracion', c: 'seguridad', t: 'Vulneración de seguridad (brecha de datos)', n: 'Vulneración',
    k: 'brecha incidente filtracion fuga hackeo ciberataque perdida notificar',
    d: `Incidente que causa la destrucción, filtración, pérdida o alteración accidental o ilícita de datos personales, o el acceso o la comunicación no autorizados a ellos. En el uso diario se la llama «brecha de seguridad».`,
    l: `Art. 14 sexies. El responsable debe reportarla a la Agencia por los medios más expeditos posibles y sin dilaciones indebidas (la ley no fija un plazo en horas), cuando exista un riesgo razonable para los derechos y libertades de los titulares, y registrar cada caso: su naturaleza, efectos, categorías de datos, número aproximado de titulares afectados y medidas adoptadas. Si afecta datos sensibles, datos de menores de 14 años o datos de obligaciones económicas, financieras, bancarias o comerciales, también debe comunicarlo a los titulares, en lenguaje claro y sencillo. Los encargados deben reportar la vulneración al responsable (art. 15 bis). Omitir deliberadamente la comunicación es una infracción gravísima (art. 34 quáter f)).`,
    ej: `Un computador con fichas de clientes se pierde sin estar cifrado, o un correo con una planilla de datos se envía por error a una persona ajena.`,
    q: ['SEG-02', 'SEG-02b'], rel: ['medidas-seguridad', 'agencia', 'encargado']
  },

  // ───────── Proveedores y transferencias ─────────
  {
    id: 'atd', c: 'terceros', t: 'Contrato con el encargado (ATD / DPA)', n: 'ATD / DPA', s: 'ATD · DPA',
    k: 'acuerdo de tratamiento de datos data processing agreement clausulas proveedor contrato',
    d: `Contrato que fija las condiciones con las que un proveedor trata datos por cuenta de la organización. ATD es «acuerdo de tratamiento de datos»; DPA es su sigla en inglés (Data Processing Agreement).`,
    l: `Art. 15 bis. El contrato debe establecer el objeto del encargo, su duración, la finalidad del tratamiento, el tipo de datos personales, las categorías de titulares y los derechos y obligaciones de las partes. El encargado no puede delegar el encargo sin autorización específica y por escrito, y al terminar debe suprimir o devolver los datos. La Agencia pondrá a disposición modelos tipo de contratos en su sitio web.`,
    ej: `Un anexo al contrato con el proveedor de nube o de remuneraciones que indica qué datos trata, para qué, por cuánto tiempo y qué debe hacer con ellos al terminar el servicio.`,
    q: ['TER-01', 'TER-01b', 'TER-05'], rel: ['encargado', 'transferencia']
  },
  {
    id: 'transferencia', c: 'terceros', t: 'Transferencia internacional de datos', n: 'Transferencia internacional',
    k: 'datos fuera de chile nube extranjero pais adecuado clausulas contractuales',
    d: `Enviar o poner datos personales a disposición de una persona u organización sujeta a la legislación de otro país. Conviene revisar si sus proveedores (nube, correo, CRM, soporte) tratan o guardan datos fuera de Chile.`,
    l: `Arts. 27 y 28. Es lícita, entre otros casos, si el destino está en un país con nivel adecuado de protección (la Agencia determina cuáles y publica el listado), si hay cláusulas contractuales u otros instrumentos con garantías adecuadas, o si ambas partes adoptan un modelo de cumplimiento o un mecanismo de certificación. Sin esas garantías, solo procede en casos específicos y no habituales, como el consentimiento expreso del titular para esa transferencia. El responsable debe poder acreditar ante la Agencia que cumplió las reglas (art. 28). Hacerlo contra la ley es una infracción grave y, si es a sabiendas, gravísima (arts. 34 ter m) y 34 quáter h)).`,
    ej: `Una empresa que mantiene su CRM en un servicio cuyos servidores están en el extranjero debe revisar con qué garantías se transfieren esos datos.`,
    q: ['TER-04'], rel: ['atd', 'encargado']
  },

  // ───────── Autoridad y sanciones ─────────
  {
    id: 'infracciones', c: 'sanciones', t: 'Infracciones y multas', n: 'Infracciones y multas',
    k: 'sanciones multa leve grave gravisima amonestacion reincidencia atenuantes agravantes',
    d: `Los incumplimientos se clasifican en leves, graves y gravísimos. Las multas van desde una amonestación escrita hasta un máximo de 20.000 UTM, y pueden aumentar si la organización reincide.`,
    l: `Arts. 34 a 37. Las infracciones leves se sancionan con amonestación escrita o multa de hasta 5.000 UTM; las graves, con multa de hasta 10.000 UTM; las gravísimas, con multa de hasta 20.000 UTM (art. 35). En caso de reincidencia, la Agencia puede aplicar una multa de hasta tres veces el monto asignado a la infracción (art. 35). Ejemplos: no entregar la información que exige la ley es leve (art. 34 bis); tratar datos sin una base que lo permita o impedir el ejercicio de los derechos es grave (art. 34 ter); tratar a sabiendas datos sensibles contra la ley u omitir deliberadamente la comunicación de una vulneración es gravísimo (art. 34 quáter). Las atenuantes (como la autodenuncia, la colaboración o contar con un modelo certificado) y las agravantes (como la reincidencia) están en el art. 36, y los criterios para fijar el monto en el art. 37.`,
    ej: `No tener publicada la política de privacidad es una infracción leve. Usar los datos de los clientes para un fin distinto del informado, sin una base que lo permita, es una infracción grave.`,
    q: ['RIE-02'], rel: ['utm', 'agencia', 'registro-sanciones', 'programa-cumplimiento']
  },
  {
    id: 'utm', c: 'sanciones', bp: true, t: 'UTM (Unidad Tributaria Mensual)', n: 'UTM', s: 'UTM',
    k: 'unidad tributaria mensual multa pesos',
    d: `Unidad de cuenta en pesos que se reajusta cada mes. Las multas de la ley se expresan en UTM; su valor vigente lo publica el Servicio de Impuestos Internos (SII).`,
    l: `La ley expresa las multas en UTM (art. 35), pero no define esta unidad.`,
    ej: `Una multa de «hasta 5.000 UTM» se convierte a pesos multiplicando 5.000 por el valor de la UTM.`,
    rel: ['infracciones']
  },
  {
    id: 'registro-sanciones', c: 'sanciones', t: 'Registro Nacional de Sanciones y Cumplimiento', n: 'Registro de sanciones',
    k: 'registro publico sanciones certificados modelo de prevencion',
    d: `Registro público y gratuito que administra la Agencia, donde constan las sanciones impuestas y las organizaciones que tienen un modelo de prevención certificado y vigente.`,
    l: `Art. 2 z) y art. 39. Las anotaciones de sanciones son de acceso público por cinco años desde que se practican.`,
    ej: `Un cliente grande puede revisar si su proveedor figura sancionado o con un modelo certificado.`,
    rel: ['programa-cumplimiento', 'infracciones', 'agencia']
  },
  {
    id: 'vigencia', c: 'sanciones', bp: true, t: 'Entrada en vigor de la ley', n: 'Vigencia',
    k: 'cuando empieza 1 de diciembre 2026 plazo',
    d: `La Ley 21.719 entra en vigor el 1 de diciembre de 2026. Desde esa fecha rigen las obligaciones y sanciones que describe este glosario.`,
    l: `En relación con la fecha: el texto de la ley que usa este glosario es la versión vigente desde el 1 de diciembre de 2026 (Biblioteca del Congreso Nacional).`,
    ej: `Una empresa que hoy no tiene un procedimiento para atender las solicitudes de las personas debería tenerlo listo antes de esa fecha.`,
    rel: ['infracciones', 'agencia']
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
  }
];

// ───────── Búsqueda y enlaces ─────────
function gloNorm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
const gloPorId = (id) => GLOSARIO.find((x) => x.id === id) || null;
const gloEsc = (x) => (typeof esc === 'function' ? esc(x) : String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
const gloRef = (txt) => (typeof refLey === 'function' ? refLey(txt) : gloEsc(txt));
// Los textos largos de «qué dice la ley» se muestran en un párrafo por oración, para leerlos con menos esfuerzo.
// («art. 50» no se corta: después del punto de «art.» viene un número, no una mayúscula.)
const gloParrafos = (txt) => (txt.length > 380 ? txt.split(/(?<=[a-záéíóúñ0-9)»])\.\s+(?=[A-ZÁÉÍÓÚÑ«])/).map((x, i, a) => (i < a.length - 1 ? x + '.' : x)) : [txt]);

// Enlace del glosario (o de un término) para compartir
function glosarioEnlace(id) { return location.origin + location.pathname + '?glosario=1' + (id ? '#' + id : ''); }

// Mensaje corto para acompañar el enlace (WhatsApp u otro medio)
function glosarioMensaje(id) {
  const t = id && gloPorId(id);
  return (t ? 'Hola, le comparto qué significa «' + t.n + '» en el glosario de protección de datos del D360° Privacy Assessment (Ley 21.719), explicado en palabras simples: '
    : 'Hola, le comparto el glosario de protección de datos del D360° Privacy Assessment (Ley 21.719), con los términos más importantes explicados en palabras simples: ') + glosarioEnlace(id);
}

// Términos que se relacionan con una pregunta del diagnóstico (hasta tres)
function glosarioDe(qid) { return GLOSARIO.filter((t) => (t.q || []).includes(qid)).slice(0, 3); }

// En la pantalla de la pregunta: enlaces a los términos de esa pregunta (se abren en otra pestaña, para no perder la sesión)
function glosarioBtn(qid) {
  const ts = glosarioDe(qid);
  const lk = ts.length
    ? ts.map((t) => `<a href="?glosario=1#${t.id}" target="_blank" rel="noopener">${gloEsc(t.n)}</a>`).join(', ')
    : `<a href="?glosario=1" target="_blank" rel="noopener">ver todos</a>`;
  return `<span class="gl-qt"><i data-lucide="book-text"></i> Glosario: ${lk}</span>`;
}

// ───────── Página pública ─────────
let gloCat = '';

function gloTermino(t) {
  const rel = (t.rel || []).map(gloPorId).filter(Boolean);
  return `<article class="gl-t" id="t-${t.id}" data-id="${t.id}" data-c="${t.c}" data-b="${gloEsc(gloNorm([t.t, t.n, t.s, t.k, t.d].join(' ')))}">
<header class="gl-th"><h3>${gloEsc(t.t)}${t.s ? ` <span class="gl-s">${gloEsc(t.s)}</span>` : ''}</h3>${t.bp ? '<span class="gl-bp" title="La ley no define este término: se explica por su relación con lo que sí dice la ley.">No definido en la ley</span>' : ''}<button type="button" class="gl-cp" data-id="${t.id}" aria-label="Copiar el enlace de «${gloEsc(t.n)}»"><i data-lucide="link"></i><span>Copiar enlace</span></button></header>
<p class="gl-d">${gloEsc(t.d)}</p>
${t.l ? `<div class="gl-l"><strong>${t.bp ? 'En relación con la ley' : 'Qué dice la ley'}</strong>${gloParrafos(t.l).map((x) => `<p>${gloRef(x)}</p>`).join('')}</div>` : ''}
${t.ej ? `<p class="gl-ej"><strong>Ejemplo</strong> ${gloEsc(t.ej)}</p>` : ''}
${rel.length ? `<p class="gl-rel"><strong>Ver también</strong> ${rel.map((r) => `<a href="#${r.id}" data-ir="${r.id}">${gloEsc(r.n)}</a>`).join('')}</p>` : ''}
</article>`;
}

function glosarioHtml() {
  const secs = GLO_CATS.map((c) => {
    const ts = GLOSARIO.filter((t) => t.c === c.id);
    return `<section class="gl-c" data-c="${c.id}" aria-labelledby="gl-h-${c.id}"><h2 id="gl-h-${c.id}"><i data-lucide="${c.ic}"></i> ${gloEsc(c.n)} <span class="gl-nc">${ts.length}</span></h2>${ts.map(gloTermino).join('')}</section>`;
  }).join('');
  const chips = `<button type="button" class="gl-chip on" data-cat="" aria-pressed="true">Todos</button>` + GLO_CATS.map((c) => `<button type="button" class="gl-chip" data-cat="${c.id}" aria-pressed="false"><i data-lucide="${c.ic}"></i> ${gloEsc(c.n)}</button>`).join('');
  return `<div class="gp gl">
<header class="gp-cab"><p class="gp-sup">AlignData · D360° Privacy Assessment</p><h1>Glosario de protección de datos</h1><p class="gp-lead">Los términos más importantes de la Ley 21.719 y del diagnóstico D360°, explicados en palabras simples. Pulse un artículo (por ejemplo, «art. 50») para leer el texto oficial de la ley.</p>
<div class="gp-acc gl-acc"><label class="sr-only" for="gl-q">Buscar un término</label><input class="dlg-inp gl-q" id="gl-q" type="search" placeholder="Buscar un término: DPO, consentimiento, brecha…" autocomplete="off" aria-controls="gl-lista"><button type="button" class="be be-p" id="gl-cp-todo"><i data-lucide="link"></i> Copiar enlace del glosario</button></div></header>
<nav class="gl-cats" aria-label="Filtrar por tema">${chips}</nav>
<p class="gl-n" id="gl-n" role="status" aria-live="polite"></p>
<div id="gl-lista">${secs}</div>
<p class="gl-vacio" id="gl-vacio" hidden>Ningún término coincide con su búsqueda. Pruebe con otra palabra o quite el filtro de tema.</p>
<footer class="gp-pie"><p>Este glosario explica la ley en palabras simples y no reemplaza su texto ni una asesoría jurídica. Fuente de los artículos: Ley 21.719, texto vigente desde el 1 de diciembre de 2026 (Biblioteca del Congreso Nacional). Los términos marcados como «No definido en la ley» son conceptos de uso habitual en la gestión de datos que la ley no define.</p><p>AlignData · D360° Privacy Assessment · versión ${GLO_V}</p></footer>
</div>`;
}

function gloFiltrar() {
  const qEl = document.getElementById('gl-q'); if (!qEl) return;
  const q = gloNorm(qEl.value).trim();
  const palabras = q ? q.split(/\s+/) : [];
  let vis = 0;
  document.querySelectorAll('.gl-t').forEach((a) => {
    const ok = (!gloCat || a.dataset.c === gloCat) && palabras.every((p) => a.dataset.b.includes(p));
    a.hidden = !ok; if (ok) vis++;
  });
  document.querySelectorAll('.gl-c').forEach((s) => { s.hidden = !s.querySelector('.gl-t:not([hidden])'); });
  document.querySelectorAll('.gl-chip').forEach((b) => { const on = b.dataset.cat === gloCat; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  const n = document.getElementById('gl-n'), v = document.getElementById('gl-vacio');
  if (n) n.textContent = vis === GLOSARIO.length ? GLOSARIO.length + ' términos' : vis + (vis === 1 ? ' término' : ' términos') + ' de ' + GLOSARIO.length;
  if (v) v.hidden = vis > 0;
}

// Copia un texto; si el navegador no deja, lo muestra seleccionado
function gloCopiar(txt, aviso) {
  const fin = (m) => { const n = document.getElementById('gl-n'); if (n) { n.textContent = m; setTimeout(gloFiltrar, 2200); } };
  const respaldo = () => fin('No se pudo copiar. El enlace es: ' + txt);
  try { navigator.clipboard.writeText(txt).then(() => fin(aviso), respaldo); } catch (e) { respaldo(); }
}

// Va a un término: quita los filtros si lo ocultan, lo deja a la vista y lo resalta un momento
function gloIr(id, rapido) {
  const a = id && document.getElementById('t-' + id); if (!a) return;
  if (a.hidden) { const qEl = document.getElementById('gl-q'); if (qEl) qEl.value = ''; gloCat = ''; gloFiltrar(); }
  a.scrollIntoView({ block: 'start', behavior: rapido ? 'instant' : 'smooth' });
  document.querySelectorAll('.gl-t.gl-sel').forEach((x) => x.classList.remove('gl-sel'));
  a.classList.add('gl-sel'); a.setAttribute('tabindex', '-1'); a.focus({ preventScroll: true });
  setTimeout(() => a.classList.remove('gl-sel'), 2600);
}
const gloHash = () => decodeURIComponent((location.hash || '').replace(/^#/, ''));

function glosarioPagina() {
  document.body.classList.add('cliente', 'guia', 'glosario');
  document.title = 'Glosario de protección de datos — D360° Privacy Assessment';
  const c = document.getElementById('gl-c'); if (!c) return;
  c.innerHTML = glosarioHtml();
  if (typeof ss === 'function') ss('sgl');
  if (window.lucide) lucide.createIcons();
  gloFiltrar();
  document.getElementById('gl-q').addEventListener('input', gloFiltrar);
  c.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.gl-cp, .gl-chip, #gl-cp-todo, a[data-ir]'); if (!b) return;
    if (b.matches('.gl-cp')) return gloCopiar(glosarioEnlace(b.dataset.id), 'Enlace copiado');
    if (b.id === 'gl-cp-todo') return gloCopiar(glosarioEnlace(), 'Enlace del glosario copiado');
    if (b.matches('.gl-chip')) { gloCat = b.dataset.cat; return gloFiltrar(); }
    if (b.matches('a[data-ir]')) { e.preventDefault(); history.replaceState(null, '', '#' + b.dataset.ir); gloIr(b.dataset.ir); }
  });
  window.addEventListener('hashchange', () => gloIr(gloHash()));
  // al llegar por un enlace a un término, se repite cuando cargan las tipografías para que no quede cortado por el cambio de altura
  if (gloHash()) { const ir = () => gloIr(gloHash(), true); setTimeout(ir, 60); if (document.fonts && document.fonts.ready) document.fonts.ready.then(ir); }
}

// ───────── Diálogo del consultor: el enlace del glosario o de un término, para copiar o enviar por WhatsApp ─────────
function glosarioActualizar() {
  const sel = document.getElementById('glo-t'); if (!sel) return;
  const id = sel.value;
  document.getElementById('glo-url').value = glosarioEnlace(id);
  document.getElementById('glo-wa').href = 'https://wa.me/?text=' + encodeURIComponent(glosarioMensaje(id));
  document.getElementById('glo-abrir').href = glosarioEnlace(id);
  document.getElementById('glo-ok').textContent = '';
}
function glosarioDlg() {
  const d = document.getElementById('dlg-glo'); if (!d) return;
  const sel = document.getElementById('glo-t');
  if (sel && !sel.options.length) {
    sel.innerHTML = '<option value="">Todo el glosario</option>' + GLO_CATS.map((c) => `<optgroup label="${gloEsc(c.n)}">${GLOSARIO.filter((t) => t.c === c.id).map((t) => `<option value="${t.id}">${gloEsc(t.n)}</option>`).join('')}</optgroup>`).join('');
  }
  glosarioActualizar();
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
