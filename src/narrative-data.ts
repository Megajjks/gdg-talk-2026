export const speakerPath = [
  { id: 'origen', title: 'Primero, el prompt', minutes: '4 min', question: '¿Qué le pedimos y cómo expresamos el resultado?' },
  { id: 'contexto', title: 'Instrucciones y contexto', minutes: '5 min', question: '¿Cómo conoce el proyecto sin repetirlo todo?' },
  { id: 'memoria', title: 'La memoria tiene límites', minutes: '5 min', question: '¿Qué se pierde y qué conviene guardar fuera del chat?' },
  { id: 'capacidades', title: 'Del texto a la acción', minutes: '5 min', question: '¿Cómo usa herramientas y revisa lo que hizo?' },
  { id: 'harness', title: 'El sistema alrededor', minutes: '6 min', question: '¿Quién conecta y gobierna las piezas?' },
  { id: 'aplicacion', title: 'Metodologías', minutes: '5 min', question: '¿Cómo organizamos el trabajo en el repositorio?' },
] as const

export const memoryFiles = [
  { name: 'projectbrief.md', role: 'Objetivos y alcance del proyecto.' },
  { name: 'productContext.md', role: 'Problema del producto y experiencia de usuario.' },
  { name: 'systemPatterns.md', role: 'Arquitectura, decisiones y patrones.' },
  { name: 'techContext.md', role: 'Tecnología, dependencias y herramientas.' },
  { name: 'activeContext.md', role: 'Trabajo actual y notas recientes.' },
  { name: 'progress.md', role: 'Hecho, pendiente y próximo paso.' },
] as const

export const capabilities = [
  { name: 'MCP', problem: 'Hay información y acciones fuera del chat.', action: 'Un anfitrión conecta clientes con servidores que exponen herramientas o recursos; el entorno controla permisos.', example: 'Consultar el contrato de la API o una incidencia de GitHub.' },
  { name: 'Loop agéntico', problem: 'Una sola respuesta no ve el fallo de una prueba.', action: 'Observar → decidir → actuar → revisar; terminar, corregir o pedir intervención con un límite.', example: 'Una prueba rechaza un email inválido y se corrige el formulario.' },
  { name: 'Skills', problem: 'No todas las guías deben cargarse en cada tarea.', action: 'Cargar instrucciones y recursos pertinentes cuando la tarea los necesita, si la plataforma lo permite.', example: 'La guía de formularios accesibles aporta etiquetas y errores asociados.' },
  { name: 'Subagentes', problem: 'Una tarea grande puede mezclar evidencia de muchas subtareas.', action: 'Delegar una unidad acotada con su propio contexto y devolver un resultado verificable.', example: 'Un explorador identifica el contrato de la API; el agente principal integra el resultado.' },
  { name: 'Hooks', problem: 'Una regla repetitiva no debería depender de que el modelo la recuerde.', action: 'El entorno dispara código ante eventos definidos; los nombres de eventos dependen de la plataforma.', example: 'Después de editar, ejecutar un formateador; antes de una acción sensible, comprobar permisos.' },
] as const

export type DiagramNode = { id: string; title: string; x: number; y: number; role: 'user' | 'system' | 'agent' | 'data' | 'control'; detail: string }
export type DiagramLink = { from: string; to: string; label: string }
export type DiagramStep = { from: string; to: string; title: string; input: string; output: string; why: string }
export type DiagramFlow = { id: string; title: string; steps: DiagramStep[] }

export const harnessNodes: DiagramNode[] = [
  { id: 'usuario', title: 'Usuario', x: 108, y: 257, role: 'user', detail: 'Pide un formulario de registro con reglas y criterios.' },
  { id: 'harness', title: 'Harness', x: 338, y: 257, role: 'system', detail: 'Entorno de ejecución: organiza herramientas, contexto, límites y controles; sus funciones varían según la plataforma.' },
  { id: 'agente', title: 'Agente', x: 562, y: 257, role: 'agent', detail: 'Selecciona la próxima acción usando un modelo, las instrucciones disponibles y el estado.' },
  { id: 'loop', title: 'Loop', x: 562, y: 372, role: 'system', detail: 'Ciclo acotado de observar, decidir, actuar y comprobar; se detiene por resultado, límite o decisión humana.' },
  { id: 'modelo', title: 'Modelo', x: 845, y: 122, role: 'agent', detail: 'Produce una respuesta o propuesta; no ejecuta acciones por sí solo.' },
  { id: 'tools', title: 'Herramientas', x: 845, y: 330, role: 'data', detail: 'Leen archivos, editan y ejecutan pruebas; una conexión no concede permisos.' },
  { id: 'mcp', title: 'MCP opcional', x: 845, y: 495, role: 'data', detail: 'Anfitrión → cliente MCP → servidor MCP → herramienta o recurso; algunos conectores son directos y no usan MCP.' },
  { id: 'skills', title: 'Skills', x: 562, y: 82, role: 'data', detail: 'Instrucciones reutilizables cargadas cuando corresponden; no reentrenan el modelo.' },
  { id: 'subagentes', title: 'Subagentes', x: 562, y: 490, role: 'agent', detail: 'Trabajan en una unidad aislada y devuelven evidencia acotada; no son obligatorios.' },
  { id: 'hooks', title: 'Hooks', x: 338, y: 490, role: 'control', detail: 'Automatizaciones ante eventos específicos del entorno; por ejemplo, formato tras editar.' },
  { id: 'permisos', title: 'Permisos', x: 108, y: 490, role: 'control', detail: 'Guardas y revisión humana controlan acciones sensibles; MCP no concede acceso por sí mismo.' },
  { id: 'pruebas', title: 'Pruebas', x: 338, y: 82, role: 'control', detail: 'Comparan resultados observables con criterios; un verde no garantiza ausencia de errores.' },
]

export const harnessLinks: DiagramLink[] = [
  { from: 'usuario', to: 'harness', label: 'plantea objetivo' },
  { from: 'harness', to: 'agente', label: 'gestiona el ciclo' },
  { from: 'agente', to: 'modelo', label: 'consulta' },
  { from: 'agente', to: 'loop', label: 'decide el siguiente paso' },
  { from: 'loop', to: 'tools', label: 'itera con acciones' },
  { from: 'skills', to: 'agente', label: 'guían cuando aplican' },
  { from: 'agente', to: 'tools', label: 'solicita acción' },
  { from: 'mcp', to: 'tools', label: 'conecta algunas capacidades' },
  { from: 'tools', to: 'hooks', label: 'dispara evento' },
  { from: 'permisos', to: 'harness', label: 'impone límites' },
  { from: 'tools', to: 'pruebas', label: 'ejecuta comprobación' },
  { from: 'pruebas', to: 'agente', label: 'devuelve evidencia' },
  { from: 'agente', to: 'subagentes', label: 'delega si conviene' },
  { from: 'agente', to: 'harness', label: 'pide terminar' },
  { from: 'harness', to: 'usuario', label: 'informa resultado' },
]

export const harnessFlows: DiagramFlow[] = [
  { id: 'registro', title: 'Registro y prueba', steps: [
    { from: 'usuario', to: 'harness', title: 'Llega el objetivo', input: 'Formulario con validación, API y pruebas.', output: 'Petición y criterios disponibles.', why: 'El trabajo necesita contexto antes de editar.' },
    { from: 'harness', to: 'agente', title: 'Se prepara el trabajo', input: 'Instrucciones, archivos y límites.', output: 'El agente recibe lo necesario para decidir.', why: 'El harness no reemplaza al modelo; gobierna su ejecución.' },
    { from: 'skills', to: 'agente', title: 'Se carga una guía pertinente', input: 'Formulario accesible.', output: 'Etiquetas y errores accesibles como criterios.', why: 'La skill es opcional y no reentrena al modelo.' },
    { from: 'agente', to: 'modelo', title: 'Se propone una acción', input: 'Objetivo + contexto.', output: 'Propuesta de implementar validaciones.', why: 'Una propuesta todavía no es una edición.' },
    { from: 'agente', to: 'loop', title: 'El loop decide cómo seguir', input: 'Propuesta y límites.', output: 'Siguiente acción sujeta a controles.', why: 'El ciclo tiene condiciones explícitas de salida.' },
    { from: 'loop', to: 'tools', title: 'Se pide actuar', input: 'Acción propuesta.', output: 'Solicitud de herramienta.', why: 'La solicitud no equivale a autorización.' },
    { from: 'agente', to: 'tools', title: 'Se ejecuta una herramienta', input: 'Archivo del formulario y contrato de API.', output: 'Edición simulada y traza observable.', why: 'El entorno habilita y controla la acción.' },
    { from: 'tools', to: 'hooks', title: 'Se dispara un evento', input: 'Archivo editado.', output: 'Formateador ejecutado (simulado).', why: 'El evento no depende de que el modelo recuerde hacerlo.' },
    { from: 'tools', to: 'pruebas', title: 'Se comprueba el cambio', input: 'Email inválido y respuesta API.', output: 'Una prueba falla (simulado).', why: 'El resultado requiere corrección, no una promesa.' },
    { from: 'pruebas', to: 'agente', title: 'El fallo retroalimenta el loop', input: 'Resultado de pruebas.', output: 'El agente decide corregir o detenerse.', why: 'Hay límite de intentos y condiciones de salida.' },
    { from: 'harness', to: 'usuario', title: 'Se informa el estado', input: 'Evidencia y límites.', output: 'Resultado con pruebas realizadas y pendientes.', why: 'La revisión humana sigue disponible cuando se necesite.' },
  ] },
  { id: 'conexiones', title: 'Conector y delegación', steps: [
    { from: 'agente', to: 'subagentes', title: 'Se delega una búsqueda', input: 'Localizar contrato de API.', output: 'Un resumen acotado vuelve al agente.', why: 'La delegación aísla contexto; no siempre hace falta.' },
    { from: 'mcp', to: 'tools', title: 'Se expone una capacidad', input: 'Cliente y servidor MCP configurados.', output: 'Herramienta de consulta disponible.', why: 'MCP conecta capacidades; no concede permisos por sí mismo.' },
    { from: 'agente', to: 'tools', title: 'Se solicita la consulta', input: 'Leer la documentación de API.', output: 'El entorno decide si autoriza la invocación.', why: 'La conexión y el permiso son controles distintos.' },
    { from: 'tools', to: 'agente', title: 'Vuelve una observación', input: 'Respuesta de herramienta.', output: 'Contrato API incorporado al contexto actual.', why: 'El agente puede continuar o solicitar intervención.' },
  ] },
  { id: 'odd', title: 'Harness + ODD', steps: [
    { from: 'usuario', to: 'harness', title: 'Autorizar y explorar en solo lectura', input: 'Pedido del formulario y permisos de la sesión.', output: 'Archivos y criterios leídos antes de modificar.', why: 'En este ejemplo de ODD se distingue investigar de editar: una petición de análisis no autoriza cambios.' },
    { from: 'harness', to: 'agente', title: 'Clasificar tamaño y riesgo', input: 'Mapa del repositorio y requisitos.', output: 'Ruta pequeña o grande, con comprobaciones proporcionales.', why: 'La clasificación organiza el trabajo; no equivale a que el modelo tenga acceso ilimitado.' },
    { from: 'agente', to: 'subagentes', title: 'Delegar solo si hace falta', input: 'Unidad acotada con criterios y permisos.', output: 'Resumen y evidencia devueltos al agente principal.', why: 'En ODD de gentle-ai, la delegación responde a desencadenantes concretos; no toda tarea grande la necesita.' },
    { from: 'agente', to: 'tools', title: 'Implementar con controles', input: 'Instrucciones, contrato de API y alcance autorizado.', output: 'Código y pruebas del formulario (simulados).', why: 'Permisos y hooks del entorno pueden controlar acciones sensibles.' },
    { from: 'tools', to: 'pruebas', title: 'Comprobar antes de cerrar', input: 'Cambio y criterios observables.', output: 'Resultado de pruebas y pendientes.', why: 'Un fallo vuelve al ciclo; no se llama validado a un cambio sin evidencia.' },
    { from: 'pruebas', to: 'harness', title: 'Persistir estado y cerrar', input: 'Resultados y decisiones relevantes.', output: 'Tarea en Markdown o memoria externa cuando aplica; resumen para retomar.', why: 'El estado duradero reduce pérdidas tras la compactación, pero no sustituye comprobar la fuente.' },
  ] },
  { id: 'sdd', title: 'Harness + SDD', steps: [
    { from: 'usuario', to: 'harness', title: 'Recibir el requisito', input: 'Pedido del formulario y criterios iniciales.', output: 'Objetivo disponible para documentar.', why: 'El entorno conserva la solicitud y limita qué herramientas se pueden usar.' },
    { from: 'harness', to: 'agente', title: 'Documentar spec.md', input: 'Alcance, errores esperados y restricciones.', output: 'Especificación comprobable (simulada).', why: 'Este pipeline SDD ilustrativo explicita qué se debe construir antes de editar.' },
    { from: 'agente', to: 'tools', title: 'Crear plan.md y tasks.md', input: 'Especificación y arquitectura existente.', output: 'Plan y tareas trazables (simulados).', why: 'La documentación ordena la implementación, aunque consume trabajo y contexto.' },
    { from: 'tools', to: 'hooks', title: 'Ejecutar una tarea bajo controles', input: 'Tarea concreta y permisos.', output: 'Edición simulada; hook de formato opcional.', why: 'Un hook es un mecanismo de plataforma, no una garantía universal.' },
    { from: 'tools', to: 'pruebas', title: 'Verificar contra la especificación', input: 'Formulario, contrato y criterios.', output: 'Pruebas y diferencias con la spec (simuladas).', why: 'Si falla, se corrige el código o se revisan los artefactos con trazabilidad.' },
    { from: 'pruebas', to: 'harness', title: 'Guardar avance y entregar evidencia', input: 'Resultado y tareas pendientes.', output: 'Estado recuperable y respuesta para la persona.', why: 'La persistencia del estado es una decisión de implementación, no una capacidad intrínseca del modelo.' },
  ] },
]

export const sddNodes: DiagramNode[] = [
  { id: 'requerimiento', title: 'Requerimiento', x: 120, y: 270, role: 'user', detail: 'Pedido de un formulario con validaciones, API y pruebas.' },
  { id: 'especificacion', title: 'Especificación', x: 295, y: 145, role: 'data', detail: 'Artefacto: criterios observables, campos y respuestas esperadas.' },
  { id: 'plan', title: 'Plan', x: 495, y: 145, role: 'system', detail: 'Artefacto: decisiones de implementación y dependencias.' },
  { id: 'tareas', title: 'Tareas', x: 695, y: 145, role: 'system', detail: 'Artefacto: unidades de trabajo verificables.' },
  { id: 'codigo', title: 'Implementación', x: 830, y: 325, role: 'agent', detail: 'Artefacto: código del formulario y sus pruebas.' },
  { id: 'verificacion', title: 'Verificación', x: 495, y: 455, role: 'control', detail: 'Artefacto: resultados de pruebas y revisión frente a los criterios.' },
]

export const sddLinks: DiagramLink[] = [
  { from: 'requerimiento', to: 'especificacion', label: 'se concreta en' },
  { from: 'especificacion', to: 'plan', label: 'orienta' },
  { from: 'plan', to: 'tareas', label: 'se descompone en' },
  { from: 'tareas', to: 'codigo', label: 'guía' },
  { from: 'codigo', to: 'verificacion', label: 'se comprueba con' },
  { from: 'verificacion', to: 'plan', label: 'puede devolver cambios' },
]

export const sddFlows: DiagramFlow[] = [
  { id: 'feature', title: 'Feature de registro', steps: [
    { from: 'requerimiento', to: 'especificacion', title: 'Del pedido al criterio', input: 'Formulario con email, contraseña y API.', output: 'Spec: errores visibles y respuesta esperada.', why: 'El requisito se vuelve comprobable.' },
    { from: 'especificacion', to: 'plan', title: 'Se decide cómo construir', input: 'Criterios de aceptación.', output: 'Plan: componente, contrato API y pruebas.', why: 'La propuesta de implementación se hace explícita.' },
    { from: 'plan', to: 'tareas', title: 'Se organiza el trabajo', input: 'Plan técnico.', output: 'Tareas de interfaz, integración y verificación.', why: 'Cada unidad tiene un resultado observable.' },
    { from: 'tareas', to: 'codigo', title: 'Se implementa', input: 'Tarea con criterios.', output: 'Cambios y pruebas del formulario (simulados).', why: 'La herramienta edita; el modelo no escribe fuera del entorno.' },
    { from: 'codigo', to: 'verificacion', title: 'Se verifica', input: 'Código y especificación.', output: 'Pruebas e informe frente a criterios (simulados).', why: 'Un resultado en verde no garantiza que no haya otros fallos.' },
  ] },
  { id: 'ajuste', title: 'Cuando algo falla', steps: [
    { from: 'codigo', to: 'verificacion', title: 'Una prueba falla', input: 'Email inválido.', output: 'Se aceptó un valor que debía rechazarse.', why: 'La evidencia contradice la especificación.' },
    { from: 'verificacion', to: 'plan', title: 'Se revisa el plan', input: 'Fallo y criterio esperado.', output: 'Corrección acotada, o cambio de spec si el requisito cambia.', why: 'Iterar no implica ocultar el fallo.' },
    { from: 'plan', to: 'tareas', title: 'Se ajusta la tarea', input: 'Plan corregido.', output: 'Validación de email reabierta.', why: 'Se conserva la trazabilidad de la decisión.' },
    { from: 'tareas', to: 'codigo', title: 'Se corrige', input: 'Regla explícita.', output: 'Código corregido (simulado).', why: 'La corrección todavía requiere pruebas.' },
    { from: 'codigo', to: 'verificacion', title: 'Se comprueba de nuevo', input: 'Prueba de email y API.', output: 'Resultados observables actualizados.', why: 'Se cierra solo cuando los criterios comprobados pasan.' },
  ] },
]

export const oddNodes: DiagramNode[] = [
  { id: 'pedido', title: 'Pedido', x: 105, y: 255, role: 'user', detail: 'Primero se determina si se pidió investigar o implementar; no se edita con un pedido de análisis.' },
  { id: 'explorar', title: 'Explorar', x: 300, y: 255, role: 'data', detail: 'Leer los requisitos y el código existente antes de elegir una ruta.' },
  { id: 'clasificar', title: 'Clasificar', x: 500, y: 255, role: 'system', detail: 'Evaluar lo entendido, el riesgo y si hace falta conservar un seguimiento durable.' },
  { id: 'pequena', title: 'Ruta pequeña', x: 735, y: 125, role: 'agent', detail: 'Implementar directamente, comprobar el resultado y no crear tareas duraderas innecesarias.' },
  { id: 'grande', title: 'Ruta grande', x: 735, y: 385, role: 'data', detail: 'Crear odd/tasks/tarea.md; guardar criterios y avance antes de implementar por unidades.' },
  { id: 'verificar', title: 'Verificar', x: 930, y: 255, role: 'control', detail: 'Probar criterios observables y comunicar lo pendiente; los riesgos pueden requerir revisión adicional.' },
]

export const oddLinks: DiagramLink[] = [
  { from: 'pedido', to: 'explorar', label: 'autoriza lectura' },
  { from: 'explorar', to: 'clasificar', label: 'aporta evidencia' },
  { from: 'clasificar', to: 'pequena', label: 'si es pequeña' },
  { from: 'clasificar', to: 'grande', label: 'si necesita seguimiento' },
  { from: 'pequena', to: 'verificar', label: 'comprueba' },
  { from: 'grande', to: 'verificar', label: 'implementa y comprueba' },
  { from: 'verificar', to: 'grande', label: 'registra pendientes' },
]

export const oddFlows: DiagramFlow[] = [
  { id: 'pequena', title: 'Ruta pequeña', steps: [
    { from: 'pedido', to: 'explorar', title: 'Leer en solo lectura', input: 'Formulario y criterios del usuario.', output: 'Componentes y contrato conocidos.', why: 'Conocer el código precede a modificarlo.' },
    { from: 'explorar', to: 'clasificar', title: 'Clasificar la tarea pequeña', input: 'Alcance entendido y riesgo acotado.', output: 'Ruta directa sin documento adicional.', why: 'La tarea se puede retomar desde el pedido y el diff.' },
    { from: 'clasificar', to: 'pequena', title: 'Implementar directamente', input: 'Criterio y prueba esperada.', output: 'Cambio pequeño con prueba (simulado).', why: 'No hace falta crear tareas ni delegar por defecto.' },
    { from: 'pequena', to: 'verificar', title: 'Comprobar y entregar', input: 'Código y criterio.', output: 'Prueba observada y límite comunicado.', why: 'Cerrar exige evidencia, no solo una respuesta convincente.' },
  ] },
  { id: 'grande', title: 'Ruta grande', steps: [
    { from: 'pedido', to: 'explorar', title: 'Leer en solo lectura', input: 'Formulario y restricciones.', output: 'Mapa del código y dudas pendientes.', why: 'Una decisión de producto abierta se consulta antes de escribir.' },
    { from: 'explorar', to: 'clasificar', title: 'Clasificar la tarea grande', input: 'Trabajo que necesita continuidad.', output: 'Ruta con seguimiento durable.', why: 'El tamaño real determina la ceremonia, no el número de archivos.' },
    { from: 'clasificar', to: 'grande', title: 'Guardar odd/tasks/tarea.md', input: 'Requisitos y resultados esperados.', output: 'Tareas, decisiones y avance persistidos.', why: 'El documento permite retomar después de una compactación.' },
    { from: 'grande', to: 'verificar', title: 'Implementar por unidades y verificar', input: 'Unidad concreta con prueba y alcance.', output: 'Cambio, prueba y pendientes registrados.', why: 'Un subagente o revisión adicional se activa cuando existe una razón concreta.' },
  ] },
]
