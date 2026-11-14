export type Family = 'fundamentos' | 'accion' | 'organizacion' | 'control'
export type Concept = {
  id: string
  name: string
  family: Family
  what: string
  purpose: string
  pieces: string
  example: string
  prompt: string
  choices: readonly [string, string, string]
  outcomes: readonly [string, string, string]
  related: string[]
  confusion: string
}

export const familyNames: Record<Family, string> = {
  fundamentos: 'Fundamentos',
  accion: 'Capacidad de acción',
  organizacion: 'Organización y reutilización',
  control: 'Control y calidad',
}

export const concepts: Concept[] = [
  {
    id: 'prompt', name: 'Prompt', family: 'fundamentos',
    what: 'Es la petición o instrucción que recibe el modelo. Puede precisar objetivo, restricciones y resultado esperado.',
    purpose: 'Comunicar qué se busca, sin sustituir el contexto ni la verificación.',
    pieces: 'Objetivo, restricciones y criterios de aceptación.',
    example: 'Pedir un formulario de registro con campos, validación y conexión a una API.',
    prompt: '¿Qué añadís a la petición inicial?',
    choices: ['Solo el objetivo', 'Objetivo + restricciones', 'Objetivo + restricciones + criterios'],
    outcomes: ['«Crea un formulario de registro». Todavía no se indica cómo comprobarlo.', '«Crea un formulario de registro; validá email y contraseña». Hay límites, pero falta una condición de aceptación.', '«Crea el formulario; validá email y contraseña; comprobá errores visibles y respuesta de la API». La petición es más comprobable, pero aún necesita pruebas.'],
    related: ['contexto', 'modelo', 'validaciones'],
    confusion: 'Un prompt detallado reduce ambigüedad, pero no garantiza corrección.',
  },
  {
    id: 'contexto', name: 'Contexto', family: 'fundamentos',
    what: 'Es la información disponible para una operación concreta: archivos, instrucciones y conversación accesible.',
    purpose: 'Permitir que el trabajo responda al proyecto real.',
    pieces: 'Archivos relevantes, documentación, restricciones y ventana disponible.',
    example: 'Consultar el componente de formularios y el contrato de la API antes de editar.',
    prompt: 'Elegí qué información poner a disposición.',
    choices: ['Sin archivos', 'Componente de formularios', 'Componente + contrato de API'],
    outcomes: ['El sistema no conoce las convenciones del proyecto: debe pedir o buscar información.', 'Ahora conoce el estilo de los campos, pero no el formato de la respuesta del servidor.', 'Ahora dispone de estructura visual y contrato de la API. Esto no equivale a guardar memoria persistente.'],
    related: ['prompt', 'estado-memoria', 'tools'],
    confusion: 'Contexto disponible no es lo mismo que estado de ejecución ni memoria duradera.',
  },
  {
    id: 'modelo', name: 'Modelo de lenguaje', family: 'fundamentos',
    what: 'Es el componente que procesa entradas y genera una respuesta o propuesta. Por sí solo no ejecuta un workflow.',
    purpose: 'Interpretar instrucciones y proponer decisiones o texto.',
    pieces: 'Entrada disponible, procesamiento y salida generada.',
    example: 'Propone cómo validar el email del formulario; otra pieza debe ejecutar las pruebas.',
    prompt: '¿Qué salida esperás del modelo?',
    choices: ['Propuesta', 'Llamada solicitada a una herramienta', 'Resultado comprobado'],
    outcomes: ['Se genera una propuesta de validación; no se modificó ningún archivo.', 'Se propone leer o editar; el entorno debe autorizar y ejecutar esa llamada.', 'No alcanza con generar texto: hace falta evidencia de una validación ejecutada.'],
    related: ['agente', 'prompt', 'harness'],
    confusion: 'Modelo y agente no son equivalentes: el agente usa al modelo dentro de una ejecución.',
  },
  {
    id: 'tools', name: 'Herramientas · tools', family: 'accion',
    what: 'Son funciones que el entorno pone a disposición para leer, modificar o comprobar algo.',
    purpose: 'Conectar una decisión con una acción observable.',
    pieces: 'Nombre de la herramienta, entrada, permiso y resultado.',
    example: 'Leer RegisterForm.tsx, editarlo y ejecutar las pruebas de registro.',
    prompt: 'Elegí una herramienta y observá el resultado.',
    choices: ['Leer archivos', 'Editar código', 'Ejecutar pruebas'],
    outcomes: ['leer_archivo(RegisterForm.tsx) → se ve el componente actual; no cambia.', 'editar_archivo(RegisterForm.tsx) → aparece un cambio simulado; todavía no hay pruebas.', 'ejecutar_pruebas(registro) → resultado simulado: 1 prueba pasa, 1 falla; hay que revisar.'],
    related: ['agente', 'mcp', 'permisos'],
    confusion: 'Disponer de una herramienta no implica tener permiso para ejecutarla.',
  },
  {
    id: 'agente', name: 'Agente', family: 'accion',
    what: 'Es un sistema que usa un modelo para elegir y ejecutar acciones dentro de reglas y límites del entorno.',
    purpose: 'Coordinar decisiones, herramientas y observaciones hasta terminar o detenerse.',
    pieces: 'Modelo, objetivo, herramientas, estado, límites y controles.',
    example: 'Inspecciona el formulario, propone cambios y consulta el resultado de las pruebas.',
    prompt: '¿Qué puede hacer el agente ahora?',
    choices: ['Solo responder', 'Usar herramientas permitidas', 'Pedir aprobación'],
    outcomes: ['Devuelve una propuesta; el código sigue igual.', 'Puede leer y editar si el entorno habilitó esas acciones.', 'Pausa ante una decisión o permiso que corresponde a una persona.'],
    related: ['modelo', 'loop', 'harness'],
    confusion: 'No todo uso de un modelo es un agente ni todo agente tiene autonomía total.',
  },
  {
    id: 'loop', name: 'Loop del agente', family: 'accion',
    what: 'Es un ciclo de observar, decidir, actuar y revisar; continúa o termina según la evidencia y los límites.',
    purpose: 'Ajustar el trabajo después de cada resultado.',
    pieces: 'Observación, decisión, acción, revisión y condición de salida.',
    example: 'Una prueba de email falla; el agente observa el fallo, corrige y vuelve a comprobar.',
    prompt: 'Avanzá por el ciclo.',
    choices: ['Observar → decidir', 'Actuar → revisar', 'Continuar o terminar'],
    outcomes: ['Se lee el estado del formulario y se decide añadir validación.', 'Se aplica una edición simulada y la prueba devuelve un fallo concreto.', 'Si hay un fallo y quedan intentos, se corrige; si pasa o vence el límite, termina.'],
    related: ['agente', 'validaciones', 'workflow'],
    confusion: 'Un loop sin condición de salida puede seguir intentando sin control.',
  },
  {
    id: 'workflow', name: 'Workflow', family: 'organizacion',
    what: 'Es una organización de etapas, reglas y decisiones para alcanzar un resultado.',
    purpose: 'Hacer explícito el orden del trabajo y los puntos de control.',
    pieces: 'Etapas, transiciones, responsables y condiciones de salida.',
    example: 'Revisar requisitos → implementar formulario → probar → revisión humana.',
    prompt: 'Elegí cómo organizar las etapas.',
    choices: ['Solo implementar', 'Implementar → probar', 'Contexto → implementar → probar → revisar'],
    outcomes: ['Se omite la verificación del resultado.', 'Las pruebas pueden detectar una validación rota.', 'Se consulta el proyecto, se prueba y se reserva una decisión humana cuando corresponde.'],
    related: ['loop', 'harness', 'validaciones'],
    confusion: 'Puede combinar pasos fijos y decisiones de un agente; no equivale a una cadena rígida.',
  },
  {
    id: 'skills', name: 'Skills', family: 'organizacion',
    what: 'Son instrucciones o recursos reutilizables que guían una tarea en un entorno que los soporte.',
    purpose: 'Reaplicar criterios sin repetirlos en cada petición.',
    pieces: 'Instrucciones, ejemplos, recursos y mecanismo de activación.',
    example: 'Una skill de formularios accesibles recuerda etiquetas, errores asociados y foco visible.',
    prompt: 'Activá una guía reutilizable.',
    choices: ['Sin skill', 'Skill de formularios accesibles', 'Skill + comprobación'],
    outcomes: ['No se añadió una guía específica; aún se puede trabajar.', 'La guía indica etiquetas visibles, errores asociados a campos y foco reconocible.', 'La guía orienta; una prueba o revisión comprueba el resultado. No reentrena el modelo.'],
    related: ['prompt', 'workflow', 'validaciones'],
    confusion: 'Cargar una skill no modifica los pesos ni reentrena al modelo.',
  },
  {
    id: 'hooks', name: 'Hooks', family: 'organizacion',
    what: 'Son automatizaciones que el entorno dispara ante eventos definidos.',
    purpose: 'Ejecutar tareas repetitivas en un momento conocido.',
    pieces: 'Evento, condición, acción y resultado.',
    example: 'Después de editar RegisterForm.tsx se ejecuta un formateador.',
    prompt: 'Seleccioná un evento.',
    choices: ['Antes de editar', 'Después de editar', 'Al finalizar'],
    outcomes: ['No se disparó el hook configurado para después de editar.', 'Evento editado → hook de formato → código formateado (simulado).', 'El hook de formato posterior a edición ya no se dispara en este evento.'],
    related: ['tools', 'workflow', 'harness'],
    confusion: 'Los eventos y capacidades de hooks dependen de la plataforma.',
  },
  {
    id: 'mcp', name: 'MCP', family: 'organizacion',
    what: 'Model Context Protocol es un protocolo para conectar aplicaciones anfitrionas con servidores que exponen herramientas, recursos o prompts.',
    purpose: 'Establecer una forma interoperable de descubrir e invocar capacidades.',
    pieces: 'Anfitrión → cliente MCP → servidor MCP → herramienta o recurso.',
    example: 'Una herramienta para consultar documentación de la API podría exponerse mediante un servidor MCP.',
    prompt: 'Seguí la conexión.',
    choices: ['Anfitrión → cliente', 'Cliente → servidor', 'Servidor → herramienta'],
    outcomes: ['La aplicación anfitriona gestiona un cliente para esa conexión.', 'El cliente intercambia mensajes con el servidor según el protocolo.', 'El servidor expone una herramienta o recurso; el entorno aún decide si se puede usar.'],
    related: ['tools', 'contexto', 'permisos'],
    confusion: 'MCP no es una base de datos ni concede permisos automáticamente.',
  },
  {
    id: 'harness', name: 'Harness', family: 'organizacion',
    what: 'Es la infraestructura que rodea al modelo y gestiona su ejecución. Su alcance cambia según la implementación.',
    purpose: 'Coordinar herramientas, límites, contexto y controles del entorno.',
    pieces: 'Orquestación, estado, políticas, herramientas y observabilidad.',
    example: 'Pone un límite de intentos al trabajo de registro y registra resultados de pruebas.',
    prompt: 'Cambiá el control de ejecución.',
    choices: ['Sin límite', 'Límite de 2 intentos', 'Límite + permisos'],
    outcomes: ['Sin límite explícito no hay una salida por cantidad de intentos.', 'La ejecución se detiene después de dos intentos, aunque quede trabajo.', 'Además del límite, una acción sensible se pausa para pedir autorización.'],
    related: ['agente', 'workflow', 'permisos'],
    confusion: 'No hay un conjunto universal de funciones que todos los harnesses incluyan.',
  },
  {
    id: 'estado-memoria', name: 'Estado y memoria', family: 'control',
    what: 'El estado indica dónde va la ejecución; la memoria persistente conserva información entre sesiones cuando existe.',
    purpose: 'Reanudar o seguir el trabajo sin confundir datos temporales y duraderos.',
    pieces: 'Contexto disponible, paso actual, historial o almacenamiento persistente.',
    example: 'Paso actual: “pruebas”; decisión guardada: “el registro requiere email único”.',
    prompt: 'Elegí qué información conservar.',
    choices: ['Contexto actual', 'Estado de ejecución', 'Memoria persistente'],
    outcomes: ['El contrato de la API está disponible en esta operación, pero puede salir del contexto.', 'La ejecución sabe que está esperando el resultado de pruebas.', 'Una decisión se guarda entre sesiones si el sistema tiene almacenamiento; esta demo solo guarda el progreso local de navegación.'],
    related: ['contexto', 'harness', 'loop'],
    confusion: 'Recordar el paso actual no equivale a persistir conocimiento entre sesiones.',
  },
  {
    id: 'validaciones', name: 'Validaciones y evaluaciones', family: 'control',
    what: 'Son comprobaciones de propiedades observables; una evaluación puede comparar el resultado con criterios más amplios.',
    purpose: 'Buscar evidencia del cumplimiento y detectar fallos.',
    pieces: 'Criterios, prueba o evaluación, resultado y acción ante un fallo.',
    example: 'Probar email inválido, respuesta de la API y mensaje de error visible.',
    prompt: 'Elegí una comprobación.',
    choices: ['Sin pruebas', 'Prueba de email', 'Prueba + revisión del flujo'],
    outcomes: ['No se detecta automáticamente el error de validación.', 'Prueba simulada: email inválido aceptado → fallo visible.', 'Prueba y revisión cubren comportamientos diferentes; pasar ambas no garantiza ausencia de errores.'],
    related: ['loop', 'permisos', 'workflow'],
    confusion: 'Un resultado en verde no prueba que no existan otros riesgos.',
  },
  {
    id: 'permisos', name: 'Permisos y revisión humana', family: 'control',
    what: 'Los permisos delimitan acciones posibles; una revisión humana reserva decisiones o cambios sensibles a una persona.',
    purpose: 'Mantener control sobre acciones que no deben inferirse del objetivo.',
    pieces: 'Solicitud, pausa, autorización o rechazo, reanudación.',
    example: 'Antes de usar un servicio real de email o desplegar el formulario se requiere autorización.',
    prompt: 'Simulá una decisión humana.',
    choices: ['Solicitar autorización', 'Autorizar acción', 'Rechazar acción'],
    outcomes: ['Estado: en pausa. No se ejecuta el despliegue mientras falta una respuesta.', 'Estado: reanudado. La acción se permitiría en un sistema real; aquí no se despliega nada.', 'Estado: detenido. No se ejecuta la acción solicitada.'],
    related: ['tools', 'harness', 'validaciones'],
    confusion: 'Conexión técnica y autorización humana son controles distintos.',
  },
]

export const guided = ['inicio', 'atlas', 'laboratorio', 'mapa', 'aplicacion'] as const

export const sources = [
  { label: 'Model Context Protocol · arquitectura oficial', url: 'https://modelcontextprotocol.io/docs/learn/architecture' },
  { label: 'GitHub Spec Kit · repositorio y flujo', url: 'https://github.com/github/spec-kit' },
  { label: 'Joaquín Ruiz · Qué es el ODD y en qué se diferencia del SDD (06/11/2026)', url: 'https://jokiruiz.com/inteligencia-artificial/que-es-odd-organic-driven-development/' },
  { label: 'React · documentación oficial', url: 'https://react.dev/learn' },
  { label: 'Vite · despliegue estático', url: 'https://vite.dev/guide/static-deploy.html' },
]
