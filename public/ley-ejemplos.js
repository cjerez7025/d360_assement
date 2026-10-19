/* Explicaciones y ejemplos para el recuadro «Lo que dice la ley» (ley.js).
   Una entrada por artículo que el recuadro puede mostrar: s = en palabras simples, e = ejemplo, n = ojo (opcional).
   Son ejemplos ilustrativos redactados por AlignData a partir del texto oficial de ley-texto.js; no son asesoría legal
   ni reemplazan la lectura del artículo. Pendiente de revisión legal (ver docs/REFERENCIAS-LEY.md).
   Se descarga junto con ley-texto.js la primera vez que se abre el recuadro. */
window.LEY_EJ = {
  "2": {
    s: "Define las palabras que usa toda la ley: qué es un dato personal, quién es el responsable, el encargado y el titular, y qué significa «tratar» datos.",
    e: "Una clínica guarda el nombre, el RUT y el diagnóstico de sus pacientes. Todo eso son datos personales (el diagnóstico, además, es un dato sensible). La clínica es la responsable, porque decide para qué y cómo se usan. La empresa que aloja la ficha electrónica por encargo de la clínica es el tercero mandatario o encargado, y cada paciente es un titular.",
    n: "Un dato seudonimizado (por ejemplo, el nombre cambiado por un código, pero con la tabla de equivalencias guardada aparte) sigue siendo dato personal. Solo el dato anonimizado, que ya no se puede volver a vincular con la persona, deja de serlo."
  },
  "3": {
    s: "Son las ocho reglas base que atraviesan toda la ley: licitud y lealtad, finalidad, proporcionalidad, calidad, responsabilidad, seguridad, transparencia y confidencialidad.",
    e: "Una tienda pide el correo de sus clientes para enviarles la boleta electrónica. Usarlo después para mandar publicidad es un fin distinto del informado (principio de finalidad), salvo que el cliente lo autorice de nuevo o se dé alguna de las otras excepciones del artículo. Y pedir además la fecha de nacimiento y la dirección, si no hacen falta para la boleta, va contra la proporcionalidad: solo se piden los datos necesarios."
  },
  "4": {
    s: "Reconoce seis derechos: acceso, rectificación, supresión, oposición, portabilidad y bloqueo. Son personales, no se pueden renunciar y ningún contrato puede limitarlos.",
    e: "Un gimnasio incluye en su contrato la cláusula «el socio renuncia a pedir la eliminación de sus datos». Esa cláusula no vale: estos derechos son irrenunciables y no pueden limitarse por ningún acto o convención.",
    n: "Si la persona fallece, sus herederos pueden ejercer los derechos, salvo que ella lo haya prohibido expresamente o lo establezca una ley."
  },
  "5": {
    s: "La persona puede preguntar si usted trata sus datos y, si es así, pedir verlos, junto con su origen, para qué se usan, a quiénes se comunicaron y por cuánto tiempo se guardan.",
    e: "Una clienta escribe al correo de contacto de una aseguradora: «¿Qué datos míos tienen y para qué los usan?». La aseguradora debe confirmarle si trata sus datos y entregárselos, con el origen, las finalidades, los destinatarios y el período de tratamiento."
  },
  "6": {
    s: "La persona puede pedir que se corrijan o completen sus datos cuando son inexactos, están desactualizados o incompletos.",
    e: "Un trabajador cambió de domicilio y su empleador sigue enviándole documentos a la dirección antigua. Puede pedir que se corrija. Si el empleador ya había comunicado esa dirección a otras entidades, debe avisarles el cambio, salvo que sea imposible o exija un esfuerzo desproporcionado."
  },
  "7": {
    s: "La persona puede pedir que se eliminen sus datos en seis casos (por ejemplo, si ya no son necesarios, si retiró su consentimiento y no hay otro fundamento, o si se trataron ilícitamente). No procede, entre otros casos, si el tratamiento es necesario para cumplir una obligación legal o un contrato, o para defenderse en un reclamo.",
    e: "Una persona se da de baja del boletín de una inmobiliaria y pide borrar sus datos. Como los tenía solo por su consentimiento y lo retiró, procede eliminarlos. Pero si esa persona además firmó una promesa de compraventa, los datos del contrato se conservan: su tratamiento es necesario para cumplir el contrato o una obligación legal."
  },
  "8": {
    s: "La persona puede oponerse a un tratamiento específico en tres casos: cuando se basa en el interés legítimo del responsable, cuando es solo marketing directo, o cuando los datos vienen de una fuente de acceso público y no hay otro fundamento legal.",
    e: "Un cliente recibe promociones de una tienda y pide que dejen de enviárselas. Si el tratamiento es solo marketing directo, la tienda debe dejar de hacerlo. Si la tienda lo hacía por interés legítimo, también debe detenerse, salvo que acredite motivos legítimos imperiosos que prevalezcan sobre los derechos del cliente."
  },
  "8 bis": {
    s: "Nadie debe quedar sujeto a una decisión tomada solo por un sistema automatizado (incluidos los perfiles) que le produzca efectos jurídicos o le afecte significativamente. Hay excepciones (contrato, consentimiento expreso, ley), pero incluso entonces la persona debe poder obtener una explicación, intervención humana, dar su punto de vista y pedir la revisión.",
    e: "Una financiera rechaza una solicitud de crédito solo porque un algoritmo calificó el perfil de la persona. Aunque la decisión fuera necesaria para el contrato, la financiera debe poder explicar cómo se decidió, permitir que una persona revise el caso y dejar que el cliente exponga su punto de vista."
  },
  "8 ter": {
    s: "Mientras se resuelve una solicitud de rectificación, supresión u oposición, la persona puede pedir que se suspenda temporalmente el uso de sus datos. Los datos siguen almacenados.",
    e: "Una persona pide corregir un dato de deuda que considera erróneo y, mientras se resuelve, solicita el bloqueo. Según el artículo 11, la empresa debe responder esa petición dentro de dos días hábiles y, mientras no la resuelva, no puede tratar esos datos, aunque puede seguir guardándolos."
  },
  "9": {
    s: "La persona puede pedir una copia de los datos que entregó, en un formato electrónico de uso común, y llevarlos a otro proveedor. Aplica cuando el tratamiento es automatizado y se basa en su consentimiento.",
    e: "Una persona usa la aplicación de un gimnasio con su consentimiento y decide cambiarse a otro. Puede pedir una copia de los datos que entregó en un formato como CSV y, si es técnicamente posible, que se envíen directamente al nuevo proveedor. Esto no obliga al gimnasio a borrar sus datos, salvo que ella también lo pida."
  },
  "10": {
    s: "Los derechos se ejercen ante la empresa, con medios sencillos y ágiles. Rectificar, suprimir y oponerse son siempre gratuitos. El acceso es gratuito al menos una vez por trimestre.",
    e: "No basta con un correo que nadie revisa: la empresa debe ofrecer un canal simple, como un correo dedicado o un formulario web. Si una persona pide acceso a sus datos más de una vez en el trimestre, la empresa solo puede cobrar los costos directos en que incurra."
  },
  "11": {
    s: "La persona presenta una solicitud escrita. La empresa debe acusar recibo y responder en 30 días corridos (prorrogables una sola vez por otros 30). Si la rechaza, debe fundarlo e informar que la persona tiene 30 días hábiles para reclamar ante la Agencia.",
    e: "Un cliente pide por el formulario web que le entreguen sus datos. La empresa responde por escrito, guarda el respaldo de que lo envió, con su fecha y su contenido, y le contesta dentro de plazo. Si se negara a entregarlos, la respuesta debe explicar la causa y avisarle que puede reclamar ante la Agencia. Si la empresa no respondiera dentro del plazo, el cliente puede reclamar directamente ante la Agencia."
  },
  "12": {
    s: "El consentimiento debe ser libre, informado y específico, dado antes y de forma inequívoca, con una declaración o un acto afirmativo. La persona puede retirarlo cuando quiera, sin dar razones. A la empresa le corresponde probar que lo tiene.",
    e: "Un gimnasio incluye, en el formulario de inscripción, una casilla ya marcada que dice «acepto recibir publicidad de terceros». Una casilla premarcada difícilmente calza con un acto afirmativo: debería marcarla el propio cliente. Además, el cliente debe poder retirar ese consentimiento con tanta facilidad como lo dio, y la empresa debe poder demostrar que lo obtuvo.",
    n: "Se presume que el consentimiento no fue libre cuando se pide en un contrato o servicio en que no era necesario recoger esos datos."
  },
  "13": {
    s: "Hay casos en que se pueden tratar datos sin pedir consentimiento: obligaciones económicas y comerciales (Título III), obligación legal, ejecución de un contrato, interés legítimo y defensa de un derecho ante tribunales. La empresa debe poder acreditar la licitud.",
    e: "Una inmobiliaria guarda el RUT y los datos de contacto de un cliente que compró un departamento, para emitir la factura y cumplir el contrato. No necesita pedirle un consentimiento aparte: el tratamiento es necesario para ejecutar el contrato y cumplir obligaciones legales. Si quisiera usar esos datos para ofrecerle seguros de terceros, en cambio, necesita otra base.",
    n: "El interés legítimo no es un comodín: no puede afectar los derechos y libertades de la persona, y ella puede exigir que le informen en qué consiste ese interés."
  },
  "14": {
    s: "Resume lo que debe hacer quien decide sobre los datos: poder acreditar que el tratamiento es lícito, recogerlos de fuentes lícitas para fines específicos, comunicar información exacta y cumplir los demás deberes de la ley.",
    e: "Un cliente pregunta por qué una empresa tiene sus datos. La empresa debe informarle y poder mostrar los antecedentes que acreditan que el tratamiento es lícito, como el consentimiento registrado o el contrato. Si nunca lo dejó documentado, le será difícil demostrarlo.",
    n: "Los datos obtenidos para medidas precontractuales (por ejemplo, para una cotización) deben suprimirse o anonimizarse (letra d). Una empresa sin domicilio en Chile que trate datos de personas residentes aquí debe indicar un medio de contacto válido."
  },
  "14 bis": {
    s: "Quien trata datos debe guardar secreto sobre ellos, incluso cuando termina la relación con la persona. Debe lograr que sus dependientes y proveedores también lo cumplan.",
    e: "Una contadora tiene acceso a las remuneraciones de los trabajadores de su cliente. No puede comentarlas con terceros y el deber sigue vigente aunque termine el contrato. La empresa debe tomar medidas para que su equipo y sus proveedores también guarden el secreto, por ejemplo con cláusulas de confidencialidad.",
    n: "Los datos que resultan de organizar, clasificar o combinar datos de fuentes públicas con otros también quedan protegidos por este deber."
  },
  "14 ter": {
    s: "La empresa debe mantener publicada, en su sitio web o un medio equivalente, información mínima: su política de tratamiento (con fecha y versión), quién es el responsable, cómo contactarlo, qué datos trata y para qué, las medidas de seguridad, los derechos de las personas, cuánto tiempo guarda los datos y de dónde los obtiene.",
    e: "Una empresa de transporte con sitio web publica su política de datos con fecha y versión, el correo o formulario para ejercer derechos, las categorías de datos que usa (por ejemplo, la ubicación de sus conductores), los destinatarios, el plazo de conservación y el derecho a reclamar ante la Agencia. Un texto genérico que no incluya esos puntos no cumple."
  },
  "14 quáter": {
    s: "La protección debe pensarse desde el diseño y venir activada por defecto: antes y durante el tratamiento se aplican medidas adecuadas, y por defecto solo se tratan los datos estrictamente necesarios.",
    e: "Al diseñar un formulario de inscripción, el equipo se pregunta qué datos son realmente necesarios. Si el trámite se resuelve con nombre y correo, el formulario no pide RUT, dirección ni fecha de nacimiento. Y el acceso a esos datos queda limitado a quienes los necesitan."
  },
  "14 quinquies": {
    s: "Hay que adoptar medidas de seguridad adecuadas al riesgo para proteger la confidencialidad, la integridad, la disponibilidad y la resiliencia de los datos. Ante un incidente, la empresa debe poder demostrar que esas medidas existían y funcionaban.",
    e: "Una clínica que guarda fichas con datos de salud, según el nivel de riesgo, cifra los datos, controla quién accede, mantiene respaldos para recuperar la información rápidamente tras un incidente y revisa cada cierto tiempo que esas medidas funcionen. Si hay un incidente, esos registros le sirven para acreditar lo que hizo."
  },
  "14 sexies": {
    s: "Si hay una vulneración de seguridad con riesgo razonable para las personas, hay que reportarla a la Agencia sin dilaciones indebidas y dejarla registrada. Si afecta datos sensibles, de menores de 14 años o de obligaciones económicas, también hay que avisar a las personas afectadas.",
    e: "Una clínica sufre un ciberataque y se filtran fichas médicas. Debe reportarlo a la Agencia por el medio más expedito y registrar qué pasó: la naturaleza de la vulneración, sus efectos, las categorías de datos, el número aproximado de afectados y las medidas adoptadas. Como son datos de salud, además debe avisar a cada paciente, en lenguaje claro, qué datos se afectaron, qué consecuencias pueden tener y qué se hizo."
  },
  "14 septies": {
    s: "Las exigencias mínimas de información y seguridad no son iguales para todos: dependen del tipo de dato, del tamaño de la empresa (categorías de la Ley 20.416), de su actividad y del volumen y las finalidades de los datos. La Agencia las fijará por instrucción general.",
    e: "Un pequeño taller que guarda los contactos de sus clientes y un banco que trata millones de datos financieros no tienen por qué enfrentar la misma exigencia: la ley permite que los estándares sean distintos según el tipo de dato, el tamaño y la actividad. Conviene estar atento a las instrucciones generales que dicte la Agencia."
  },
  "15": {
    s: "Ceder datos es traspasarlos de un responsable a otro. Necesita el consentimiento de la persona (u otra base de licitud), debe constar por escrito o por un medio electrónico idóneo y, desde que se perfecciona, quien los recibe pasa a ser también responsable.",
    e: "Una tienda quiere entregar su base de clientes a un socio comercial para que les ofrezca sus propios productos. Es una cesión: requiere el consentimiento del cliente (u otra base legal) y debe constar por escrito, indicando las partes, los datos y las finalidades. Si el cliente consintió el uso de sus datos pero no su cesión, hay que pedirle un nuevo consentimiento antes de hacerla.",
    n: "Si se cede sin el consentimiento necesario, la cesión es nula y quien recibió los datos debe suprimirlos todos."
  },
  "15 bis": {
    s: "Cuando un proveedor trata datos por encargo, lo hace solo según las instrucciones del responsable y bajo un contrato que fije el objeto, la duración, la finalidad, el tipo de datos y las obligaciones de las partes. No puede subcontratar sin autorización específica y por escrito.",
    e: "Una empresa contrata a un proveedor de nube o de remuneraciones. Debe haber un contrato con el objeto del encargo, su duración, la finalidad, los tipos de datos y las categorías de titulares. El proveedor no puede usar los datos para otro fin ni subcontratar sin autorización, debe avisar al responsable de cualquier vulneración de seguridad y, al terminar, suprimir o devolver los datos.",
    n: "Si el proveedor usa los datos para un fin distinto o los cede sin autorización, se le considera responsable de datos y responde personalmente y, junto con el responsable, solidariamente por los daños."
  },
  "15 ter": {
    s: "Cuando un tratamiento puede producir un alto riesgo para las personas, hay que hacer una evaluación de impacto antes de comenzar: describir la operación y su finalidad, evaluar si es necesaria y proporcional, y analizar los riesgos y las medidas para mitigarlos.",
    e: "Una empresa que instala cámaras para monitorear sistemáticamente una zona de acceso público, o que perfila a miles de personas con decisiones automatizadas, debe hacer la evaluación de impacto antes de partir. La ley la exige siempre en casos como el tratamiento masivo o a gran escala, el monitoreo sistemático de una zona pública y el tratamiento de datos sensibles bajo las excepciones del consentimiento.",
    n: "Omitirla cuando corresponde es una infracción gravísima (art. 34 quáter, letra k)."
  },
  "16": {
    s: "Los datos sensibles (salud, origen étnico, afiliación sindical, creencias, vida sexual, datos biométricos, entre otros) solo se tratan con consentimiento expreso, salvo excepciones puntuales como las del ámbito laboral y de seguridad social dentro de la ley, la protección de la vida o salud, la defensa de un derecho o cuando la ley lo autorice.",
    e: "Una empresa de reclutamiento incluye en su formulario de postulación preguntas sobre afiliación sindical y creencias religiosas. Son datos sensibles: en general solo pueden tratarse con consentimiento expreso de cada postulante, y si no son necesarios para el cargo, lo más prudente es no pedirlos."
  },
  "16 bis": {
    s: "Los datos de salud y del perfil biológico (por ejemplo, genéticos) se tratan solo para los fines de las leyes sanitarias. Se pueden tratar sin consentimiento solo en casos puntuales, como proteger la vida, una alerta sanitaria, medicina preventiva o laboral o la defensa de un derecho.",
    e: "Una aseguradora quiere pedir exámenes genéticos a sus clientes para fijar el precio de una póliza. La ley prohíbe tratar y ceder datos de salud y del perfil biológico, y las muestras biológicas, recolectados en el ámbito de los seguros (también en el laboral, educativo, deportivo, social, de seguridad o de identificación), salvo que una ley lo autorice expresamente en casos calificados."
  },
  "16 ter": {
    s: "Los datos biométricos (huella, iris, rasgos faciales, voz) solo se tratan con el consentimiento expreso del artículo 16 y entregando información específica sobre el sistema, la finalidad, el período de uso y cómo ejercer los derechos.",
    e: "Una oficina instala un lector de huella digital para registrar la asistencia. Debe contar con el consentimiento expreso de cada persona y, además, informarle cuál es el sistema biométrico, para qué se usará específicamente la huella, durante cuánto tiempo y cómo puede ejercer sus derechos."
  },
  "16 quáter": {
    s: "Los datos de niños, niñas y adolescentes se tratan según su interés superior y su autonomía progresiva. Niños y niñas son los menores de 14 años: requieren el consentimiento de sus padres o representantes. Los adolescentes (14 a 17) se rigen por las reglas de los adultos, salvo sus datos sensibles si tienen menos de 16 años.",
    e: "Un colegio quiere publicar en redes sociales fotos de sus estudiantes. Debe velar por el uso lícito de esa información y, si son menores de 14 años, contar con el consentimiento de sus padres o representantes legales. Para un estudiante de 15 años, sus datos sensibles también requieren el consentimiento de sus padres."
  },
  "16 sexies": {
    s: "Los datos de geolocalización se tratan con las mismas bases de licitud de los artículos 12 y 13, pero hay que informar de forma clara y oportuna qué tipo de datos de ubicación se tratan, para qué, por cuánto tiempo y si se comunicarán a un tercero.",
    e: "Una empresa de reparto quiere seguir el GPS de sus repartidores. Puede hacerlo si tiene una base de licitud, pero debe informarles de manera clara qué datos de ubicación trata, para qué finalidad, durante cuánto tiempo y si los comunicará a un tercero que preste un servicio con valor añadido."
  },
  "17": {
    s: "Fija qué deudas pueden comunicar los registros comerciales: por ejemplo, letras y pagarés protestados, cheques protestados y créditos bancarios o de casas comerciales. Hay deudas que no se pueden comunicar (servicios básicos, educación, salud, autopistas) y las obligaciones prescritas se deben eliminar de oficio.",
    e: "Un buró de información comercial no puede publicar una deuda con la empresa de agua o de electricidad, ni una deuda de salud o de educación. Tampoco puede publicar ni comunicar deudas originadas durante la cesantía del deudor. Y debe eliminar de sus registros las obligaciones prescritas aunque nadie se lo pida."
  },
  "18": {
    s: "Los datos de obligaciones económicas, bancarias o comerciales no se pueden comunicar una vez pasados cinco años desde que la obligación se hizo exigible, ni después de que se pagó o se extinguió.",
    e: "Una deuda que se hizo exigible hace seis años ya no puede seguir comunicándose en un registro comercial. Y si el deudor la paga, tampoco puede seguir comunicándose como pendiente. Solo se informa a los tribunales cuando lo requieren por juicios pendientes."
  },
  "19": {
    s: "Pagar una deuda no borra los datos de inmediato, pero obliga a actualizarlos: el acreedor debe avisar el pago dentro de siete días hábiles al registro que había comunicado la morosidad, y quienes usan esos datos deben actualizarlos tan pronto reciban el aviso o dentro de tres días.",
    e: "Una casa comercial recibe el último pago de un cliente moroso. Tiene hasta siete días hábiles para avisar al responsable del registro que informó la mora, para que consigne el nuevo dato. Si una empresa usa esa información y no puede actualizarla a tiempo, debe bloquear los datos hasta que esté al día."
  },
  "27": {
    s: "Mandar datos a otro país es lícito si el país ofrece un nivel adecuado de protección, o si hay cláusulas contractuales u otras garantías adecuadas, o un modelo de cumplimiento o certificación. Si no, solo se permite una transferencia específica y no habitual, por ejemplo con consentimiento expreso para esa transferencia.",
    e: "Una empresa chilena contrata un servicio de correo o de nube con servidores en otro país. Es una transferencia internacional. Puede hacerla si el país figura entre los de nivel adecuado de protección, o si el contrato con el proveedor incluye cláusulas con garantías adecuadas (por ejemplo, cláusulas modelo). Si no se cumple ninguna de esas vías, solo cabe una transferencia específica y que no sea habitual, como una con el consentimiento expreso del titular para ese envío determinado."
  },
  "28": {
    s: "La Agencia determina qué países tienen un nivel adecuado de protección y publica en su sitio web el listado y modelos de cláusulas contractuales. Las cláusulas modelo aprobadas por la Agencia no requieren garantías adicionales ni autorización.",
    e: "Antes de enviar datos de clientes a un proveedor en otro país, la empresa revisa el listado de países adecuados y los modelos de cláusulas que la Agencia pone a disposición. Si usa cláusulas modelo aprobadas, no necesita otra garantía ni autorización. Si pertenece a un grupo de empresas con las mismas políticas, puede usar normas corporativas vinculantes aprobadas por la Agencia. Ante cualquier consulta, quien transfirió debe poder acreditar a la Agencia que lo hizo conforme a la ley."
  },
  "34": {
    s: "Las infracciones a los principios, derechos y obligaciones de la ley se clasifican, según su gravedad, en leves, graves y gravísimas. Esas responsabilidades se suman a las civiles o penales que correspondan.",
    e: "Una filtración de datos puede terminar en una multa de la Agencia y, aparte, en una demanda de indemnización de las personas afectadas. Una cosa no excluye la otra."
  },
  "34 bis": {
    s: "Son infracciones leves, entre otras: incumplir en parte o del todo el deber de información, no tener un medio de contacto actualizado, omitir la respuesta o responder incompleta o fuera de plazo una solicitud, y omitir comunicaciones obligatorias a la Agencia.",
    e: "Una empresa que no responde, o responde fuera de plazo, la solicitud de un cliente que pide ver sus datos, o que no tiene publicado un correo de contacto operativo, comete una infracción leve.",
    n: "Si además impide u obstaculiza el ejercicio del derecho, pasa a infracción grave (art. 34 ter, letra e)."
  },
  "34 ter": {
    s: "Son infracciones graves, entre otras: tratar datos sin consentimiento ni otro fundamento legal, usarlos para otro fin, ceder datos sin el consentimiento necesario, tratar datos innecesarios o inexactos, obstaculizar el ejercicio de derechos, vulnerar el secreto o la seguridad, y hacer transferencias internacionales contra la ley.",
    e: "Una clínica usa la lista de sus pacientes para enviarles publicidad de un tercero sin su consentimiento: trata los datos con un fin distinto al informado y cede datos sin el consentimiento necesario. Son infracciones graves."
  },
  "34 quáter": {
    s: "Son infracciones gravísimas, entre otras: tratar datos en forma fraudulenta, destinarlos maliciosamente a otro fin, vulnerar el secreto de datos sensibles, tratar a sabiendas datos de niños o sensibles contra la ley, omitir deliberadamente reportar una vulneración de seguridad, transferir datos a sabiendas contra la ley y no hacer la evaluación de impacto cuando corresponde.",
    e: "Una empresa sufre una filtración de datos sensibles y decide ocultarla en vez de reportarla a la Agencia. Omitir en forma deliberada la comunicación de una vulneración de seguridad es una infracción gravísima."
  },
  "35": {
    s: "Las infracciones leves se sancionan con amonestación escrita o multa de hasta 5.000 UTM, las graves con multa de hasta 10.000 UTM y las gravísimas con multa de hasta 20.000 UTM. La Agencia señala medidas para corregir en un plazo no mayor a 60 días; si no se cumplen, la multa tiene un recargo de 50 %.",
    e: "Una empresa mediana recibe una multa por una infracción grave y la Agencia le ordena subsanar la causa. Si no lo hace en el plazo de hasta 60 días, la multa se recarga en 50 %.",
    n: "En caso de reincidencia la multa puede llegar a tres veces el monto. Si la infractora no es una empresa de menor tamaño y reincide en una infracción grave o gravísima, la multa puede alcanzar hasta el 2 % o el 4 % de sus ingresos anuales, según corresponda, si eso resulta más gravoso."
  },
  "36": {
    s: "La Agencia considera atenuantes (reparar a los afectados, colaborar, no tener sanciones previas, autodenunciarse, y haber cumplido diligentemente los deberes de dirección y supervisión, que se verifica con el certificado del artículo 51) y agravantes (reincidencia en 30 meses, infracción continuada y poner en riesgo los derechos de las personas).",
    e: "Una empresa sufre una filtración, la autodenuncia ante la Agencia, colabora con la investigación, repara a los afectados y no tiene sanciones previas: puede invocar atenuantes. En cambio, haber sido sancionada dos o más veces en los últimos treinta meses es reincidencia, un agravante."
  },
  "37": {
    s: "No hay una multa fija: la Agencia la gradúa según la gravedad de la conducta, el perjuicio y el número de afectados, el beneficio económico obtenido, si hay datos sensibles o de niños, la capacidad económica del infractor y las sanciones anteriores.",
    e: "Dos empresas cometen la misma infracción. Si una afectó a miles de personas y obtuvo un beneficio económico, y la otra a unas pocas sin beneficio, la Agencia puede fijar multas distintas. Si una misma conducta constituye dos infracciones, se impone una sola multa, la de la infracción más grave.",
    n: "La multa debe pagarse dentro de diez días hábiles desde que la resolución esté firme."
  },
  "38": {
    s: "Si hay multas por infracciones gravísimas reiteradas en 24 meses, la Agencia puede suspender las operaciones de tratamiento de datos hasta por 30 días. El almacenamiento no se afecta, y la suspensión no puede decretarse si perjudica los derechos de las personas.",
    e: "Una empresa acumula multas por infracciones gravísimas en un período de dos años. La Agencia puede suspenderle total o parcialmente el tratamiento de datos hasta por 30 días y, si no cumple lo ordenado, prorrogar la suspensión por períodos sucesivos de hasta 30 días."
  },
  "39": {
    s: "El Registro Nacional de Sanciones y Cumplimiento es público y gratuito. Consigna a quienes fueron sancionados, con la infracción, las atenuantes y agravantes y la sanción, y también a quienes tienen un modelo de prevención certificado vigente.",
    e: "Un posible cliente o socio de negocios puede consultar el registro para ver si una empresa fue sancionada por la ley de datos o si tiene un modelo de prevención certificado vigente. Las anotaciones de sanciones son de acceso público durante cinco años."
  },
  "41": {
    s: "Si la empresa deniega una solicitud o no responde a tiempo, la persona puede reclamar ante la Agencia por escrito dentro de 30 días hábiles. La Agencia tiene que resolver en un máximo de seis meses.",
    e: "Una persona pidió eliminar sus datos y la empresa se negó sin justificarlo. Tiene 30 días hábiles desde la respuesta negativa (o desde que venció el plazo sin respuesta) para reclamar ante la Agencia. La Agencia decide en 10 días hábiles si admite el reclamo, notifica a la empresa, que dispone de 30 días corridos para responder, y debe resolver en no más de seis meses. La resolución puede impugnarse judicialmente dentro de 15 días hábiles.",
    n: "Si el reclamo es por el rechazo de un bloqueo temporal, la Agencia debe resolver en un máximo de tres días hábiles."
  },
  "49": {
    s: "Adoptar un modelo de prevención de infracciones es voluntario. Es un programa de cumplimiento con, al menos: un delegado de protección de datos con medios y facultades, el mapa de datos y de procesos de riesgo, protocolos, mecanismos de reporte interno y a la Agencia, y sanciones internas.",
    e: "Una empresa de retail decide adoptar el modelo: designa un delegado, identifica los procesos donde pueden ocurrir infracciones, crea protocolos para esas tareas, define cómo se reporta internamente y a la Agencia una vulneración de seguridad y establece sanciones internas. Las reglas del programa deben incorporarse como obligación en los contratos de trabajo o de prestación de servicios, o en el reglamento interno."
  },
  "50": {
    s: "Designar un delegado de protección de datos es voluntario. Lo designa la máxima autoridad de la empresa, debe tener autonomía, medios suficientes y no tener conflictos de interés. En las micro, pequeñas y medianas empresas, el dueño o sus máximas autoridades pueden asumir las tareas del delegado.",
    e: "En una pyme, el dueño puede asumir personalmente las tareas de delegado. En una empresa grande, el delegado debe ser una persona idónea, designada por el directorio o la máxima autoridad, que asesora a la empresa, supervisa el cumplimiento, promueve la formación del personal, prepara un plan anual de trabajo, atiende las consultas de los titulares y es el punto de contacto con la Agencia."
  },
  "51": {
    s: "La Agencia certifica y supervisa que el modelo de prevención cumpla los requisitos y registra a las entidades con certificación vigente. Un reglamento definirá los requisitos y procedimientos.",
    e: "Una empresa obtiene la certificación de su modelo de prevención y la Agencia la incorpora en el Registro Nacional de Sanciones y Cumplimiento mientras esté vigente. Ese certificado también sirve para acreditar, como atenuante, que cumplió diligentemente sus deberes de dirección y supervisión (art. 36)."
  }
};
