import { useState } from 'react'
import { Diagram } from './Diagram'
import { capabilities, harnessFlows, harnessLinks, harnessNodes, memoryFiles, speakerPath } from './narrative-data'

type Props = { onVisit: (id: string) => void }

function ChapterEnd({ next, onVisit }: { next: string; onVisit: Props['onVisit'] }) {
  const chapter = speakerPath.find(item => item.id === next)
  return <div className="chapter-end"><span>CONTINÚA LA CHARLA</span><button onClick={() => onVisit(next)}>{chapter?.title ?? 'Continuar'} <span aria-hidden="true">→</span></button></div>
}

export function Story({ onVisit }: Props) {
  const [promptParts, setPromptParts] = useState([true, false, false, false])
  const [selectedFile, setSelectedFile] = useState(0)
  const [memoryStep, setMemoryStep] = useState(0)
  const [memoryTechnique, setMemoryTechnique] = useState<'adrs' | 'trazas' | 'procedencia'>('adrs')
  const [mcpStep, setMcpStep] = useState(0)
  const [capacity, setCapacity] = useState(0)
  const promptLabels = ['Objetivo', 'Contexto', 'Restricciones', 'Criterios de aceptación']
  const promptTexts = [
    'Crear un formulario de registro.',
    'La aplicación ya tiene componentes de formulario y un contrato para la API de usuarios.',
    'Validar email y contraseña; mostrar errores junto a cada campo.',
    'Una prueba con email inválido falla antes del arreglo; la integración con la API se comprueba.',
  ]
  const memoryStages = [
    { title: 'Empieza una conversación', length: 22, context: 'Petición inicial y algunas instrucciones disponibles.', takeaway: 'El modelo solo ve los mensajes y datos que el entorno le presenta en esta operación.' },
    { title: 'Se acumula trabajo', length: 56, context: 'Historial, archivos y resultados de herramientas.', takeaway: 'Una ventana finita obliga a seleccionar información; más texto no siempre aporta más señal.' },
    { title: 'Se acerca el límite', length: 87, context: 'Muchos pasos y trazas compiten por espacio.', takeaway: 'Una parte del historial puede recortarse o resumirse, según la plataforma.' },
    { title: 'Se compacta y se recupera', length: 37, context: 'Resumen + decisión guardada fuera del chat.', takeaway: 'La compactación puede perder matices; registrar decisiones y recuperar fuentes ayuda, pero no garantiza exactitud.' },
  ]
  const mcpStages = [
    { title: 'Aplicación anfitriona', result: 'Gestiona el agente, la política de uso y un cliente para cada servidor configurado.' },
    { title: 'Cliente MCP', result: 'Establece la conexión y habla el protocolo con un servidor.' },
    { title: 'Servidor MCP', result: 'Anuncia herramientas, recursos o prompts disponibles.' },
    { title: 'Herramienta o recurso', result: 'Ejemplo: consultar una incidencia o leer documentación. El permiso sigue siendo decisión del entorno.' },
  ]

  return <>
    <section id="origen" className="section chapter chapter-origin">
      <div className="chapter-header"><span>{speakerPath[0].minutes} · {speakerPath[0].question}</span><h2>Volvamos a cuando <em>todo era una pregunta.</em></h2><p>Al empezar a usar sistemas como GPT, pedíamos respuestas y copiábamos el resultado. Si el formulario fallaba, pegábamos el error y volvíamos a preguntar. El prompt era la interfaz; todavía no habíamos organizado un proceso de trabajo.</p></div>
      <div className="chapter-columns">
        <div className="chapter-reading"><h3>Tres términos, tres funciones</h3><dl className="term-list"><div><dt>Prompt</dt><dd>La petición o instrucciones que recibe el modelo para una operación. «Crea un formulario de registro» es un ejemplo.</dd></div><div><dt>Prompt del sistema</dt><dd>Instrucciones de mayor prioridad cuando la interfaz ofrece ese rol. Su disponibilidad y jerarquía dependen del producto; no es un “prompt mágico”.</dd></div><div><dt>Ingeniería de prompts</dt><dd>Diseñar instrucciones, ejemplos y criterios que aclaren la tarea. Un buen prompt sigue importando incluso cuando existe un sistema alrededor.</dd></div></dl><p className="chapter-caveat">Un ejemplo útil no sustituye las pruebas: escribir más instrucciones no demuestra que el formulario funcione.</p></div>
        <div className="chapter-experiment"><span className="small-caps">PROBÁ UN PROMPT · SIMULACIÓN PREDEFINIDA</span><h3>De pedido vago a pedido comprobable</h3><div className="part-options">{promptLabels.map((label, i) => <label key={label}><input type="checkbox" checked={promptParts[i]} disabled={i === 0} onChange={e => setPromptParts(parts => parts.map((p, index) => index === i ? e.target.checked : p))} /><span>{label}</span></label>)}</div><div className="prompt-preview"><span>PETICIÓN RESULTANTE</span><p>{promptTexts.filter((_, i) => promptParts[i]).join(' ')}</p></div><p className="feedback-text" aria-live="polite">{promptParts.every(Boolean) ? 'Ahora hay criterios para comprobar el trabajo, pero todavía falta ejecutar esa comprobación.' : 'Agregá contexto, restricciones y una condición verificable para reducir la ambigüedad.'}</p></div>
      </div>
      <ChapterEnd next="contexto" onVisit={onVisit} />
    </section>

    <section id="contexto" className="section chapter chapter-context">
      <div className="chapter-header"><span>{speakerPath[1].minutes} · {speakerPath[1].question}</span><h2>De repetir instrucciones <em>a diseñar contexto.</em></h2><p>Notamos que las mismas convenciones volvían en cada conversación. Empezamos a guardarlas en archivos del proyecto y a entregar solo la información pertinente para cada paso.</p></div>
      <div className="chapter-columns">
        <div className="chapter-reading"><h3>Instrucciones persistentes</h3><p><code>AGENTS.md</code> o <code>CLAUDE.md</code> pueden describir convenciones del repositorio. Una carpeta de Markdown puede separar objetivo, arquitectura, trabajo activo y progreso. <b>Los nombres y las reglas de carga son específicos de cada herramienta.</b></p><p><b>Ingeniería de contexto</b> es seleccionar y mantener la información útil para una operación: instrucciones, archivos, historial, resultados de herramientas y límites de la ventana; no equivale solo a escribir prompts largos.</p><details className="template-details"><summary>Ver plantilla breve para Claude Code</summary><pre>{`# CLAUDE.md
Objetivo: implementar un formulario de registro.
Convenciones: reutilizar el componente de formulario existente.
Antes de editar: leer el contrato de API y las pruebas.
Al terminar: ejecutar pruebas y explicar lo no verificado.`}</pre><p>Ejemplo ilustrativo: comprobá los formatos admitidos por la versión de tu herramienta.</p></details><details className="template-details"><summary>Ver plantilla portable para GPT/chat</summary><pre>{`Rol: asistente de desarrollo.
Objetivo: formulario de registro con validaciones y API.
Contexto relevante: [componente] [contrato de API].
Restricciones: conservar las convenciones existentes.
Criterios: email inválido muestra error; pruebas ejecutadas.
Si falta una decisión de producto, preguntá antes de editar.`}</pre><p>En una interfaz de chat, aportá explícitamente el contexto que sea seguro compartir. No supongas lectura automática de archivos.</p></details></div>
        <div className="chapter-experiment"><span className="small-caps">ARCHIVOS DE EJEMPLO · SELECCIONÁ UNO</span><h3>Un “banco de memoria” en Markdown</h3><div className="file-list">{memoryFiles.map((file, i) => <button key={file.name} className={selectedFile === i ? 'active' : ''} aria-pressed={selectedFile === i} onClick={() => setSelectedFile(i)}><code>{file.name}</code><span aria-hidden="true">↗</span></button>)}</div><div className="file-result" aria-live="polite"><b>{memoryFiles[selectedFile].name}</b><p>{memoryFiles[selectedFile].role}</p><small>Ejemplo aplicado: documentar el formulario sin poner todo el repositorio en cada petición.</small></div></div>
      </div>
      <ChapterEnd next="memoria" onVisit={onVisit} />
    </section>

    <section id="memoria" className="section chapter chapter-memory">
      <div className="chapter-header"><span>{speakerPath[2].minutes} · {speakerPath[2].question}</span><h2>La ventana se llena. <em>¿Qué conservamos?</em></h2><p>El contexto disponible durante una llamada al modelo es finito. Un resumen puede liberar espacio, pero omitir un detalle importante. No es correcto afirmar que más tokens o la compactación siempre causen alucinaciones.</p></div>
      <div className="memory-visual"><div className="memory-controls"><h3>La vida de una sesión</h3><div className="memory-step-buttons" role="group" aria-label="Etapas del contexto">{memoryStages.map((stage, i) => <button key={stage.title} className={memoryStep === i ? 'active' : ''} aria-pressed={memoryStep === i} onClick={() => setMemoryStep(i)}>{i + 1}. {stage.title}</button>)}</div></div><div className="memory-display"><span>VENTANA DE CONTEXTO · TAMAÑO ILUSTRATIVO</span><div className="memory-track"><div style={{ width: `${memoryStages[memoryStep].length}%` }} /></div><p className="memory-current">{memoryStages[memoryStep].context}</p><p aria-live="polite">{memoryStages[memoryStep].takeaway}</p><small>La barra no mide tokens reales; muestra el cambio de estado de forma didáctica.</small></div></div>
      <div className="memory-solutions"><article><h3>Primera salida: dejar trazabilidad</h3><p>Markdown es legible y versionable. Un registro útil conserva decisiones y evidencia, pero también necesita mantenimiento: si crece sin selección, vuelve a consumir contexto.</p><div className="segmented" role="group" aria-label="Tipos de trazabilidad">{(['adrs', 'trazas', 'procedencia'] as const).map(key => <button key={key} className={memoryTechnique === key ? 'selected' : ''} aria-pressed={memoryTechnique === key} onClick={() => setMemoryTechnique(key)}>{key === 'adrs' ? 'Decisiones' : key === 'trazas' ? 'Trazas' : 'Procedencia'}</button>)}</div><div className="memory-result" aria-live="polite">{memoryTechnique === 'adrs' ? <><b>DECISIONS.md / ADR-001.md</b><p>Contexto: la API exige email único. Opciones: validar solo en cliente o también en servidor. Decisión: comprobar ambos lados y documentar la razón.</p></> : memoryTechnique === 'trazas' ? <><b>CHANGELOG.md / TRACE.md / PROGRESS.md</b><p>Sesión: se modificó el formulario; pasó la prueba de email; queda pendiente revisar el despliegue. El registro facilita retomar el trabajo.</p></> : <><b>Procedencia</b><p>Un dato guardado indica fuente, fecha y, cuando corresponde, archivo y línea. Permite comprobar de dónde salió una afirmación.</p></>}</div></article><article><h3>Otra salida: recuperar bajo demanda</h3><p>Un servidor de memoria conectado por MCP puede buscar registros persistentes y devolver solo lo relevante, en vez de cargar todos los archivos. <b>MCP es el protocolo de conexión, no la memoria misma.</b></p><div className="retrieval-flow"><span>Archivos / registros</span><span>→</span><span>Índice local</span><span>→</span><span>Búsqueda</span><span>→</span><span>Contexto útil</span></div><p><b>Engram, como ejemplo:</b> su documentación describe SQLite con búsqueda de texto completo FTS5. No atribuimos búsqueda vectorial con <code>sqlite-vec</code> sin evidencia de una versión concreta.</p><p className="chapter-caveat">Contexto actual ≠ estado de ejecución ≠ memoria persistente. Ninguno de estos mecanismos garantiza recordar todo.</p></article></div>
      <ChapterEnd next="capacidades" onVisit={onVisit} />
    </section>

    <section id="capacidades" className="section chapter chapter-capabilities">
      <div className="chapter-header"><span>{speakerPath[3].minutes} · {speakerPath[3].question}</span><h2>El agente necesita <em>salir del chat.</em></h2><p>Leer una incidencia, consultar documentación o una base de datos, generar una colección para Postman, ejecutar pruebas de extremo a extremo o actualizar Jira requiere herramientas reales. MCP puede conectar algunas de ellas; no es el único mecanismo posible.</p></div>
      <div className="mcp-interaction"><div><h3>MCP: un conector, no un permiso</h3><p>Seleccioná cada parte de la relación entre aplicación anfitriona, cliente, servidor y capacidad expuesta.</p><div className="mcp-rail" role="group" aria-label="Partes de MCP">{mcpStages.map((part, i) => <button key={part.title} className={mcpStep === i ? 'active' : ''} aria-pressed={mcpStep === i} onClick={() => setMcpStep(i)}>{part.title}</button>)}</div></div><div className="mcp-output" aria-live="polite"><span>PARTE {mcpStep + 1} / 4</span><h4>{mcpStages[mcpStep].title}</h4><p>{mcpStages[mcpStep].result}</p><small>Ejemplos de integraciones de desarrollo: GitHub MCP Server, Playwright MCP y servidores de archivos. Disponibilidad y permisos varían.</small></div></div>
      <div className="evolution"><h3>Cinco piezas que resuelven problemas diferentes</h3><p>Este orden explica necesidades sucesivas; <b>no pretende ser una cronología histórica universal ni un conjunto obligatorio.</b></p><div className="evolution-grid"><div className="evolution-list">{capabilities.map((part, i) => <button key={part.name} className={capacity === i ? 'active' : ''} aria-pressed={capacity === i} onClick={() => setCapacity(i)}><span>{String(i + 1).padStart(2, '0')}</span>{part.name}</button>)}</div><article className="evolution-detail" aria-live="polite"><span>PROBLEMA</span><p>{capabilities[capacity].problem}</p><span>QUÉ APORTA</span><p>{capabilities[capacity].action}</p><span>EN EL FORMULARIO</span><p>{capabilities[capacity].example}</p></article></div></div>
      <ChapterEnd next="harness" onVisit={onVisit} />
    </section>

    <section id="harness" className="section chapter chapter-harness">
      <div className="chapter-header"><span>{speakerPath[4].minutes} · {speakerPath[4].question}</span><h2>El modelo es una pieza. <em>El harness es el entorno.</em></h2><p>El harness rodea al modelo y coordina la ejecución: contexto, ciclo, herramientas, límites y controles. Puede integrar skills, subagentes, hooks o MCP cuando la implementación lo requiera. No existe una lista universal de componentes obligatorios.</p></div>
      <Diagram label="Harness: del pedido a la evidencia" className="harness-diagram" nodes={harnessNodes} links={harnessLinks} flows={harnessFlows} />
      <p className="chapter-caveat">«Modelo + harness = agente» puede servir como analogía inicial, pero no es una definición formal. Un agente combina decisiones, estado y acciones dentro de un entorno; un workflow también puede incluir pasos predefinidos.</p>
      <ChapterEnd next="aplicacion" onVisit={onVisit} />
    </section>
  </>
}
