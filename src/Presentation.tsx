import { useEffect, useRef, useState, type ReactNode } from 'react'
import './presentation.css'

type Step = { name: string; detail: string }
type Slide = {
  id: string
  title: string
  highlight: string
  note: string
  points?: readonly string[]
  diagram?: 'context' | 'memory' | 'harness' | 'sdd' | 'odd' | 'comparison'
}

const slides: readonly Slide[] = [
  {
    id: 'inicio', title: '¿Cuándo dejamos de escribir prompts?',
    highlight: 'Empezamos pidiéndole algo a una IA. Terminamos diseñando el sistema que la ayuda a trabajar.',
    note: 'Instrucciones, contexto, herramientas y comprobación: este es el recorrido de la charla.',
  },
  {
    id: 'origen', title: 'Volvamos a los primeros chats',
    highlight: 'Una pregunta. Una respuesta. Y una persona haciendo el resto.',
    note: 'Pedíamos soluciones y pegábamos el resultado en nuestro proyecto. Si fallaba, volvíamos al chat con el error.',
  },
  {
    id: 'prompt', title: 'Tres piezas de la conversación',
    highlight: 'Prompt: el pedido. Instrucción de sistema: el marco. Prompt engineering: diseñar mejor esa interacción.',
    note: 'Las instrucciones de sistema pueden definir comportamiento general, pero su aplicación depende de la herramienta que aloja el modelo.',
    points: ['Prompt del usuario → «Crea un formulario de registro».', 'Instrucciones de sistema → rol, límites y prioridades del entorno.', 'Prompt engineering → redactar, estructurar y evaluar pedidos.'],
  },
  {
    id: 'instrucciones', title: 'Un buen prompt da dirección',
    highlight: 'Objetivo + contexto relevante + restricciones + criterio de éxito.',
    note: 'Ejemplo: «Agrega el formulario al componente existente, valida email y contraseña, usa el contrato de API y comprueba los errores con pruebas».',
    points: ['Qué resultado esperamos.', 'Qué información necesita conocer.', 'Qué no debe cambiar.', 'Cómo sabremos si funcionó.'],
  },
  {
    id: 'archivos', title: 'Cuando las reglas se repiten',
    highlight: 'Dejamos de copiar convenciones en cada chat y empezamos a guardarlas en el proyecto.',
    note: 'Un AGENTS.md u otros archivos Markdown pueden documentar pautas y contexto; su nombre y carga dependen del cliente.',
    points: ['projectbrief.md · alcance', 'productContext.md · necesidades', 'systemPatterns.md · arquitectura', 'techContext.md · herramientas', 'activeContext.md · trabajo actual', 'progress.md · avances'],
  },
  {
    id: 'context-engineering', title: 'Diseñar el contexto',
    highlight: 'Context engineering es decidir qué información entra, cuándo entra y de dónde viene.',
    note: 'No basta con un prompt largo: hay que seleccionar evidencia vigente, separar reglas de ejemplos y mantener accesible la fuente.',
    diagram: 'context',
  },
  {
    id: 'boilerplate', title: 'Una base de instrucciones',
    highlight: 'Un archivo corto y verificable sirve mejor que copiar un manual entero en cada pedido.',
    note: 'Ejemplo adaptable: AGENTS.md en entornos compatibles; CLAUDE.md en Claude Code; en otros clientes, configurar sus instrucciones de proyecto. Ningún archivo se carga igual en todos.',
    points: ['Objetivo: mantener el formulario de registro.', 'Convención: reutilizar el validador existente.', 'Límite: no modificar credenciales ni desplegar.', 'Prueba: ejecutar los tests y comunicar lo que falló.'],
  },
  {
    id: 'ventana', title: 'La ventana no es infinita',
    highlight: 'Historial, instrucciones, archivos y resultados de herramientas compiten por el mismo presupuesto.',
    note: 'Más texto no implica automáticamente más alucinaciones. La información irrelevante o perdida sí puede dificultar la respuesta.',
    diagram: 'memory',
  },
  {
    id: 'compactacion', title: 'Compactar es elegir',
    highlight: 'Un resumen libera espacio, pero puede perder detalles que después importan.',
    note: 'Antes de resumir, conviene preservar decisiones, supuestos y el siguiente paso fuera del historial volátil.',
    points: ['Conversación extensa → resumen.', 'Resumen → nuevo contexto de trabajo.', 'Detalle omitido → recuperarlo desde su fuente.'],
  },
  {
    id: 'trazabilidad', title: 'Escribir lo que no debe olvidarse',
    highlight: 'Markdown-first: decisiones, cambios y procedencia legibles por personas.',
    note: 'Estos registros ayudan a reconstruir por qué pasó algo; también necesitan mantenimiento porque pueden crecer demasiado.',
    points: ['DECISIONS.md / ADR-001.md → contexto, alternativas y motivo.', 'CHANGELOG.md / TRACE.md / PROGRESS.md → qué cambió, qué se probó, qué sigue.', 'Procedencia → archivo, fecha o sesión que respalda una afirmación.'],
  },
  {
    id: 'memoria-externa', title: 'Recuperar sin leerlo todo',
    highlight: 'Cuando los archivos crecen, buscamos solo la información pertinente.',
    note: 'Engram ofrece memoria persistente y búsqueda local con SQLite/FTS5; otros sistemas pueden sumar búsqueda semántica. No son la misma capacidad.',
    points: ['Archivo o registro → fuente recuperable.', 'Índice local → búsqueda por términos.', 'Resultado → volver a verificar la fuente y su vigencia.'],
  },
  {
    id: 'integraciones', title: 'Necesitábamos más que texto',
    highlight: 'Consultar una base de datos, probar en navegador o actualizar Jira exige herramientas reales.',
    note: 'Postman, pruebas e2e, bases de datos y Jira son ejemplos de tareas posibles; cada integración requiere una herramienta y permisos concretos.',
  },
  {
    id: 'mcp', title: 'MCP conecta el entorno',
    highlight: 'Host → cliente MCP → servidor MCP → herramientas o recursos.',
    note: 'MCP estandariza la conexión, no concede permiso por sí mismo. Servidores de GitHub, navegador, datos o memoria son ejemplos de integraciones para desarrollo.',
    points: ['Host: aplicación que gobierna la sesión.', 'Cliente: conexión al servidor configurado.', 'Servidor: publica capacidades disponibles.', 'Herramienta: acción permitida por la política del entorno.'],
  },
  {
    id: 'loop', title: 'El primer salto: un ciclo',
    highlight: 'Decidir → actuar → observar → corregir o detenerse.',
    note: 'Un loop agéntico permite al agente leer el resultado de una prueba y ajustar la siguiente acción, siempre dentro de límites.',
    points: ['Antes: el humano copiaba el error al chat.', 'Ahora: el entorno puede devolver la salida de la prueba al agente.'],
  },
  {
    id: 'skills', title: 'Conocimiento bajo demanda',
    highlight: 'Una skill enseña un procedimiento sin cargar todas las instrucciones desde el inicio.',
    note: 'Un índice permite descubrirla; se carga el SKILL.md y sus recursos cuando la tarea lo necesita. No reemplaza las pruebas.',
  },
  {
    id: 'subagentes', title: 'Separar el trabajo',
    highlight: 'Un subagente explora o verifica una tarea acotada y devuelve un resultado breve.',
    note: 'El orquestador conserva el objetivo; los trabajadores usan contextos separados. Delegar no garantiza calidad ni resuelve un requisito ambiguo.',
  },
  {
    id: 'hooks', title: 'Reglas que ejecuta código',
    highlight: 'Un hook puede interceptar acciones del agente en puntos definidos por su entorno.',
    note: 'Ejemplos según el cliente: antes de usar una herramienta, después de editar o al intentar terminar. No todos los clientes ofrecen los mismos eventos.',
    points: ['Antes → bloquear un acceso no permitido.', 'Después → comprobar formato o registrar evidencia.', 'Al cerrar → advertir que faltan pruebas.'],
  },
  {
    id: 'harness', title: 'Las piezas forman un harness',
    highlight: 'El modelo propone. El entorno organiza acciones, contexto, herramientas y límites.',
    note: 'Esta es una arquitectura ilustrativa; Claude Code, Codex, OpenCode y otros entornos pueden implementar sus piezas de formas diferentes.',
    diagram: 'harness',
  },
  {
    id: 'metodologia', title: 'El harness necesita dirección',
    highlight: 'Tener herramientas no decide qué construir, qué verificar ni cuándo parar.',
    note: 'Una metodología convierte el objetivo en pasos comprobables y conserva el estado fuera del chat cuando hace falta.',
  },
  {
    id: 'sdd', title: 'SDD: especificar primero',
    highlight: 'Requisito → especificación → plan → tareas → código → verificación.',
    note: 'Es un flujo ilustrativo de desarrollo guiado por especificación, no una obligación universal de crear tres archivos para cada cambio.',
    diagram: 'sdd',
  },
  {
    id: 'odd', title: 'ODD: ajustar el proceso',
    highlight: 'Entender → clasificar → implementar → verificar; documentar cuando el trabajo lo requiere.',
    note: 'En el ODD de Gentle AI, una tarea pequeña puede resolverse directamente; una grande mantiene tareas y estado. El riesgo tiene sus propias comprobaciones.',
    diagram: 'odd',
  },
  {
    id: 'comparacion', title: 'Mismo harness, distinto recorrido',
    highlight: 'Cambia la ruta de trabajo; el objetivo sigue siendo evidencia verificable.',
    note: 'Alterná SDD y ODD para ver qué información recibe el mismo agente en cada paso. Es una simulación explicativa, no ejecución real.',
    diagram: 'comparison',
  },
  {
    id: 'cierre', title: 'De un pedido a un sistema',
    highlight: 'No termina cuando hay código: termina cuando sabemos qué se comprobó y qué queda pendiente.',
    note: 'La página de lectura conserva el atlas, la simulación detallada, los diagramas ampliados y las fuentes.',
  },
]

const flows: Record<'context' | 'memory' | 'harness' | 'sdd' | 'odd', readonly Step[]> = {
  context: [
    { name: 'Objetivo', detail: 'Definir qué necesita la persona.' },
    { name: 'Fuentes', detail: 'Elegir archivos y evidencia pertinentes.' },
    { name: 'Límites', detail: 'Incluir permisos, restricciones y criterios.' },
    { name: 'Recuperación', detail: 'Conservar decisiones con su procedencia.' },
  ],
  memory: [
    { name: 'Entrada', detail: 'El modelo recibe instrucciones, pedido y contexto seleccionado.' },
    { name: 'Trabajo', detail: 'Respuestas y resultados de herramientas consumen espacio.' },
    { name: 'Límite', detail: 'Hay que seleccionar o resumir antes de seguir.' },
    { name: 'Compactación', detail: 'Un resumen conserva lo importante, pero puede omitir matices.' },
    { name: 'Recuperación', detail: 'Se consultan fuentes externas si falta un detalle.' },
  ],
  harness: [
    { name: 'Contexto', detail: 'El harness reúne el pedido, las instrucciones y la memoria pertinente.' },
    { name: 'Modelo y agente', detail: 'El modelo propone; el agente decide la siguiente acción.' },
    { name: 'Skills y subagentes', detail: 'Se carga conocimiento o se delega solo si hace falta.' },
    { name: 'Hooks y permisos', detail: 'El entorno limita o intercepta la acción según su política.' },
    { name: 'MCP y herramientas', detail: 'Un cliente MCP puede conectar herramientas externas autorizadas.' },
    { name: 'Observación', detail: 'Una prueba devuelve evidencia al loop: corregir, preguntar o terminar.' },
  ],
  sdd: [
    { name: 'Requisito', detail: 'La persona define un comportamiento esperado.' },
    { name: 'Spec', detail: 'Se registra qué debe cumplirse y cómo comprobarlo.' },
    { name: 'Plan', detail: 'Se organiza una ruta de implementación.' },
    { name: 'Tareas', detail: 'Se dividen entregas verificables.' },
    { name: 'Código', detail: 'El agente implementa con las herramientas permitidas.' },
    { name: 'Pruebas', detail: 'La evidencia contrasta el resultado con la especificación; si falla, se corrige.' },
  ],
  odd: [
    { name: 'Solo lectura', detail: 'Primero se entiende el código y el objetivo; aún no se escribe.' },
    { name: 'Clasificar', detail: 'El alcance y el riesgo determinan cuánta coordinación hace falta.' },
    { name: 'Ruta pequeña', detail: 'Si es acotado, se implementa y verifica sin generar documentos de tareas.' },
    { name: 'Ruta grande', detail: 'Si no se puede retomar desde el diff, se registra estado en odd/tasks/*.md.' },
    { name: 'Persistir', detail: 'Decisiones y progreso se guardan en archivos o memoria cuando corresponde.' },
    { name: 'Verificar', detail: 'Pruebas y revisión proporcional dejan evidencia o un bloqueo explícito.' },
  ],
}

function Diagram({ kind }: { kind: NonNullable<Slide['diagram']> }) {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'odd' | 'sdd'>('odd')
  const [playing, setPlaying] = useState(false)
  const track = useRef<HTMLOListElement>(null)
  const selected = kind === 'comparison' ? mode : kind
  const stages = flows[selected]

  useEffect(() => {
    const current = track.current?.children[step] as HTMLElement | undefined
    const container = track.current
    if (current && container) container.scrollTo({
      left: current.offsetLeft - container.offsetLeft - (container.clientWidth - current.clientWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }, [step, selected])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setStep(current => {
      if (current === stages.length - 1) { setPlaying(false); return current }
      return current + 1
    }), 1700)
    return () => window.clearInterval(timer)
  }, [playing, stages])

  return <div className="slide-diagram" aria-label={`Diagrama de ${selected}`}>
    {kind === 'comparison' && <button className="diagram-mode" onClick={() => { setMode(current => current === 'odd' ? 'sdd' : 'odd'); setStep(0); setPlaying(false) }}>
      Mostrar {mode === 'odd' ? 'SDD' : 'ODD'} (ahora: {mode.toUpperCase()})
    </button>}
    <ol className="diagram-track" ref={track} aria-label={`Etapas de ${selected.toUpperCase()}`}>
      {stages.map((stage, i) => <li key={stage.name} className={i === step ? 'is-current' : i < step ? 'is-complete' : ''} aria-current={i === step ? 'step' : undefined}>
        <span className="diagram-index">{String(i + 1).padStart(2, '0')}</span>{stage.name}
      </li>)}
    </ol>
    <div className="diagram-readout" aria-live="polite">
      <strong>{stages[step].name}</strong>
      <p>{stages[step].detail}</p>
      <span>Etapa {step + 1} de {stages.length} · Recorrido ilustrativo</span>
    </div>
    <div className="diagram-actions">
      <button onClick={() => { setPlaying(false); setStep(i => Math.max(0, i - 1)) }} disabled={step === 0}>Paso anterior</button>
      <button className="diagram-next" onClick={() => { setPlaying(false); setStep(i => Math.min(stages.length - 1, i + 1)) }} disabled={step === stages.length - 1}>Siguiente paso</button>
      <button onClick={() => { setStep(0); setPlaying(true) }} aria-label="Reproducir recorrido desde el principio">Reproducir</button>
    </div>
  </div>
}

function Highlight({ children }: { children: ReactNode }) {
  return <p className="slide-idea">{children}</p>
}

function initialSlide() {
  const hash = decodeURIComponent(window.location.hash.slice(1))
  return Math.max(0, slides.findIndex(slide => slide.id === hash))
}

export function Presentation() {
  const [index, setIndex] = useState(initialSlide)
  const slide = slides[index]
  const screen = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  function goTo(next: number) {
    if (next < 0 || next >= slides.length) return
    setIndex(next)
    history.replaceState(null, '', `#${slides[next].id}`)
  }

  useEffect(() => {
    document.title = `${slide.title} — Diapositiva highlights`
    screen.current?.scrollTo({ top: 0 })
    heading.current?.focus({ preventScroll: true })
  }, [slide])

  useEffect(() => {
    const syncHash = () => setIndex(initialSlide())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    const navigate = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof Element && event.target.closest('input, select, textarea, [contenteditable="true"]')) return
      if (event.key === 'Escape') { window.location.assign('./'); return }
      const next = event.key === 'ArrowRight' || event.key === 'PageDown' ? index + 1
        : event.key === 'ArrowLeft' || event.key === 'PageUp' ? index - 1
          : event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : -1
      if (next < 0 || next >= slides.length) return
      event.preventDefault()
      goTo(next)
    }
    window.addEventListener('keydown', navigate)
    return () => window.removeEventListener('keydown', navigate)
  }, [index])

  return <div className="presentation-deck">
    <a href={`#${slide.id}`} className="skip">Saltar a la diapositiva</a>
    <header className="presentation-bar"><strong>Diapositiva highlights</strong><a href="./">Salir de diapositivas</a></header>
    <main id={slide.id} className="presentation-screen" ref={screen}>
      <div className="slide-grid">
        <p className="slide-position" aria-live="polite">Diapositiva {index + 1} de {slides.length}</p>
        <h1 ref={heading} tabIndex={-1}>{slide.title}</h1>
        <Highlight>{slide.highlight}</Highlight>
        <p className="slide-detail">{slide.note}</p>
        {slide.points && <ul className="slide-points">{slide.points.map(point => <li key={point}>{point}</li>)}</ul>}
        {slide.diagram && <Diagram key={slide.id} kind={slide.diagram} />}
        {slide.id === 'cierre' && <a className="slide-exit" href="./">Volver a la página completa y consultar las fuentes</a>}
      </div>
    </main>
    <nav className="presentation-controls" aria-label="Navegación de diapositivas">
      <button className="slide-next" onClick={() => goTo(index + 1)} disabled={index === slides.length - 1}>Siguiente</button>
      <button className="slide-previous" onClick={() => goTo(index - 1)} disabled={index === 0}>Anterior</button>
    </nav>
  </div>
}
