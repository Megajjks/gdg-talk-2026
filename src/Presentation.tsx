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

const smallPath = [0, 1, 2, 5]
const largePath = [0, 1, 3, 4, 5]
const linearPaths: Record<Exclude<NonNullable<Slide['diagram']>, 'odd' | 'comparison'>, number[]> = {
  context: [0, 1, 2, 3], memory: [0, 1, 2, 3, 4],
  harness: [0, 1, 2, 3, 4, 5], sdd: [0, 1, 2, 3, 4, 5],
}

function DiagramScene({ selected, stages, step, path, onNext }: { selected: string; stages: readonly Step[]; step: number; path: readonly number[]; onNext: () => void }) {
  const points = stages.map((_, i) => ({
    x: selected === 'odd' ? [128, 380, 632, 128, 380, 632][i] : [128, 380, 632][i < 3 ? i : 5 - i],
    y: i < 3 ? 44 : 125,
  }))
  const links = selected === 'odd'
    ? [[0, 1], [1, 2], [1, 3], [2, 5], [3, 4], [4, 5]]
    : stages.slice(0, -1).map((_, i) => [i, i + 1])
  const position = path.indexOf(step)
  const labels = (name: string) => {
    if (name.length <= 17) return [name]
    const words = name.split(' ')
    const pivot = Math.ceil(words.length / 2)
    return [words.slice(0, pivot).join(' '), words.slice(pivot).join(' ')]
  }

  return <div className="diagram-scene" role="group" aria-label={`Diagrama de ${selected}: ${stages.length} etapas conectadas`}>
    <svg className="diagram-visual" viewBox="0 0 760 170" aria-hidden="true" focusable="false">
      <defs>
        <marker id="diagram-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M 1 1 L 7 4 L 1 7 Z" fill="#78967c" />
        </marker>
      </defs>
      {selected === 'harness' && <g className="diagram-boundary">
        <rect x="2" y="3" width="756" height="164" rx="18" />
      </g>}
      {links.map(([source, target]) => {
        const from = points[source]
        const to = points[target]
        const forward = to.x > from.x
        const connector = selected === 'odd' && source === 1 && target === 3
          ? `M ${from.x} ${from.y + 31} V 85 H ${to.x} V ${to.y - 37}`
          : from.y === to.y
          ? `M ${from.x + (forward ? 96 : -96)} ${from.y} L ${to.x + (forward ? -103 : 103)} ${to.y}`
          : `M ${from.x} ${from.y + 31} L ${to.x} ${to.y - 37}`
        const active = path.slice(0, position).some((fromStep, i) => fromStep === source && path[i + 1] === target)
        return <path key={`${selected}-link-${source}-${target}`} className={`diagram-link${active ? ' is-active' : ''}`} d={connector} markerEnd="url(#diagram-arrow)" />
      })}
      {selected === 'harness' && <path className="diagram-feedback" d="M 129 156 C 52 164, 52 88, 128 80" />}
      {points.map((point, i) => <g key={stages[i].name} className={`diagram-node${i === step ? ' is-current' : i < step ? ' is-complete' : ''}`} transform={`translate(${point.x}, ${point.y})`}>
        <rect x="-94" y="-30" width="188" height="60" rx="10" />
        <circle cx="-69" cy="-1" r="13" />
        <text className="diagram-number" x="-69" y="3" textAnchor="middle">{i + 1}</text>
        <text className="diagram-name" x="-47" y={labels(stages[i].name).length === 1 ? 5 : -4}>
          {labels(stages[i].name).map((line, lineIndex) => <tspan x="-47" dy={lineIndex === 0 ? 0 : 16} key={line}>{line}</tspan>)}
        </text>
      </g>)}
    </svg>
    <div className="diagram-mobile">
      {position > 0 && <div className="diagram-neighbor">Anterior · {stages[path[position - 1]].name}</div>}
      <div className="diagram-mobile-current"><span>{String(position + 1).padStart(2, '0')} / {String(path.length).padStart(2, '0')}</span><strong>{stages[step].name}</strong></div>
      {position < path.length - 1 && <div className="diagram-neighbor">Sigue · {stages[path[position + 1]].name}</div>}
      <button className="diagram-advance-mobile" onClick={onNext} disabled={position === path.length - 1}>Siguiente paso del diagrama</button>
    </div>
    <ol className="diagram-steps-accessible">
      {stages.map((stage, i) => <li key={stage.name} aria-current={i === step ? 'step' : undefined}>{stage.name}</li>)}
    </ol>
  </div>
}

function Diagram({ kind }: { kind: NonNullable<Slide['diagram']> }) {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'odd' | 'sdd'>('odd')
  const [route, setRoute] = useState<'small' | 'large'>('small')
  const [playing, setPlaying] = useState(false)
  const selected = kind === 'comparison' ? mode : kind
  const stages = flows[selected]
  const path = selected === 'odd' ? route === 'small' ? smallPath : largePath : linearPaths[selected]
  const position = path.indexOf(step)
  const nextStep = () => { setPlaying(false); setStep(path[Math.min(position + 1, path.length - 1)]) }
  const previousStep = () => { setPlaying(false); setStep(path[Math.max(position - 1, 0)]) }

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setStep(current => {
      const next = path[Math.min(path.indexOf(current) + 1, path.length - 1)]
      if (next === path[path.length - 1]) setPlaying(false)
      return next
    }), 1700)
    return () => window.clearInterval(timer)
  }, [playing, path])

  return <div className="slide-diagram" aria-label={`Diagrama de ${selected}`}>
    {(kind === 'comparison' || selected === 'odd') && <div className="diagram-top-controls">
      {kind === 'comparison' && <button className="diagram-mode" onClick={() => { setMode(current => current === 'odd' ? 'sdd' : 'odd'); setStep(0); setPlaying(false) }}>
        Mostrar {mode === 'odd' ? 'SDD' : 'ODD'} (ahora: {mode.toUpperCase()})
      </button>}
      {selected === 'odd' && <button className="diagram-route" data-route={route === 'small' ? 'large' : 'small'} onClick={() => { setRoute(current => current === 'small' ? 'large' : 'small'); setStep(1); setPlaying(false) }}>
        Mostrar ruta {route === 'small' ? 'grande' : 'pequeña'} (ahora: {route === 'small' ? 'pequeña' : 'grande'})
      </button>}
    </div>}
    <DiagramScene selected={selected} stages={stages} step={step} path={path} onNext={nextStep} />
    <div className="diagram-readout" aria-live="polite">
      <strong>{stages[step].name}</strong>
      <p>{stages[step].detail}</p>
      <span>{selected === 'odd' ? `Ruta ${route === 'small' ? 'pequeña' : 'grande'} · ` : ''}Etapa {position + 1} de {path.length} · Recorrido ilustrativo</span>
    </div>
    <div className="diagram-actions">
      <button onClick={previousStep} disabled={position === 0}>Paso anterior</button>
      <button className="diagram-next" onClick={nextStep} disabled={position === path.length - 1}>Siguiente paso</button>
      <button onClick={() => { if (playing) setPlaying(false); else { setStep(0); setPlaying(true) } }} aria-label={playing ? 'Pausar recorrido' : 'Reproducir recorrido desde el principio'}>{playing ? 'Pausar' : 'Reproducir'}</button>
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
