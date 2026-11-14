import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { concepts, familyNames, guided, sources, type Family } from './content'
import { advance, defaultConfig, initialRun, pause, reset, resume, type Config, type Run, type Scenario } from './simulation'
import { Story } from './Story'
import { Diagram } from './Diagram'
import { oddFlows, oddLinks, oddNodes, sddFlows, sddLinks, sddNodes } from './narrative-data'
import { Presentation } from './Presentation'
import './style.css'

const sectionNames: Record<(typeof guided)[number], string> = {
  inicio: 'Punto de partida', origen: 'El prompt', contexto: 'Contexto',
  memoria: 'Memoria', capacidades: 'Herramientas y agentes',
  harness: 'Harness', aplicacion: 'Metodologías',
}
const freeNames = { atlas: 'Atlas de conceptos', laboratorio: 'Laboratorio', mapa: 'Mapa del sistema', aplicacion: 'SDD y ODD' } as const
const scenarioNames: Record<Scenario, string> = {
  success: 'El formulario cumple los criterios',
  failure: 'Una prueba falla y se corrige',
  clarification: 'Falta una decisión del usuario',
}
const configNames: Record<Exclude<keyof Config, 'maxIterations'>, string> = {
  instructions: 'Instrucciones claras', context: 'Contexto del proyecto',
  tools: 'Herramientas de lectura y edición', skill: 'Skill de frontend',
  hook: 'Hook de formato', tests: 'Pruebas automáticas', review: 'Revisión humana',
}
type MapNode = { id: string; title: string; description: string; family: Family; detailsOnly?: boolean }
const mapNodes: MapNode[] = [
  { id: 'objetivo', title: 'Objetivo del usuario', family: 'fundamentos', description: 'Pide el formulario de registro y especifica lo que debe hacer.' },
  { id: 'workflow', title: 'Workflow', family: 'organizacion', description: 'Organiza las etapas y sus condiciones de salida.' },
  { id: 'harness', title: 'Harness', family: 'organizacion', description: 'Gestiona la ejecución, las herramientas disponibles, el estado y los límites.' },
  { id: 'agente', title: 'Agente', family: 'accion', description: 'Decide la próxima acción dentro de los límites del entorno.' },
  { id: 'modelo', title: 'Modelo', family: 'fundamentos', description: 'Procesa la entrada disponible y propone respuestas; no ejecuta herramientas por sí solo.' },
  { id: 'contexto', title: 'Contexto', family: 'fundamentos', description: 'Archivos y documentación disponibles para el paso actual.', detailsOnly: true },
  { id: 'skills', title: 'Instrucciones + skills', family: 'organizacion', description: 'Guías reutilizables que orientan la tarea sin reentrenar el modelo.', detailsOnly: true },
  { id: 'tools', title: 'Herramientas', family: 'accion', description: 'Leen archivos, editan código o ejecutan pruebas con permisos del entorno.' },
  { id: 'mcp', title: 'Conexión MCP', family: 'organizacion', description: 'Opcional: anfitrión → cliente → servidor → capacidad expuesta. No otorga permiso.', detailsOnly: true },
  { id: 'hooks', title: 'Hooks', family: 'organizacion', description: 'Reaccionan a eventos del entorno, como una edición de archivo.', detailsOnly: true },
  { id: 'validaciones', title: 'Validaciones', family: 'control', description: 'Las pruebas y evaluaciones aportan evidencia observable.' },
  { id: 'permisos', title: 'Permisos + revisión', family: 'control', description: 'Pueden pausar o impedir una acción hasta obtener una decisión humana.', detailsOnly: true },
  { id: 'resultado', title: 'Resultado', family: 'control', description: 'Se entrega con evidencia, límites conocidos y condición de finalización.' },
]
const links = [
  ['objetivo', 'workflow', 'define'],
  ['workflow', 'harness', 'ordena'],
  ['harness', 'agente', 'coordina'],
  ['agente', 'modelo', 'consulta'],
  ['contexto', 'modelo', 'aporta información'],
  ['skills', 'agente', 'guían'],
  ['agente', 'tools', 'solicita acción'],
  ['mcp', 'tools', 'conecta opcionalmente'],
  ['tools', 'hooks', 'pueden disparar'],
  ['tools', 'validaciones', 'ejecutan'],
  ['permisos', 'tools', 'autorizan o bloquean'],
  ['validaciones', 'agente', 'retroalimentan'],
  ['validaciones', 'resultado', 'sustentan'],
  ['harness', 'resultado', 'cierra'],
] as const
const mapPath = ['objetivo', 'workflow', 'harness', 'agente', 'modelo', 'contexto', 'tools', 'hooks', 'validaciones', 'permisos', 'resultado']

function initialProgress(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('lab-progress-v1') ?? '[]')
    return Array.isArray(saved) ? saved.filter((s): s is string => typeof s === 'string' && guided.some(id => id === s)) : []
  } catch { return [] }
}

function App() {
  const [mode, setMode] = useState<'guided' | 'free'>('guided')
  const [progress, setProgress] = useState<string[]>(initialProgress)
  const [glossary, setGlossary] = useState(false)
  const [comparison, setComparison] = useState<'isolated' | 'system'>('isolated')
  const [selectedId, setSelectedId] = useState('prompt')
  const [demonstration, setDemonstration] = useState(0)
  const [scenario, setScenario] = useState<Scenario>('success')
  const [config, setConfig] = useState<Config>(defaultConfig)
  const [run, setRun] = useState<Run>(() => initialRun('success', defaultConfig))
  const [auto, setAuto] = useState(false)
  const [detailed, setDetailed] = useState(false)
  const [mapIndex, setMapIndex] = useState(-1)
  const [mapPlaying, setMapPlaying] = useState(false)
  const [selectedMap, setSelectedMap] = useState('objetivo')
  const activeConcept = concepts.find(c => c.id === selectedId) ?? concepts[0]
  const activeMap = mapNodes.find(n => n.id === selectedMap) ?? mapNodes[0]
  const visiblePath = mapPath.filter(id => detailed || !mapNodes.find(node => node.id === id)?.detailsOnly)

  useEffect(() => {
    try { localStorage.setItem('lab-progress-v1', JSON.stringify(progress)) } catch { /* Storage may be unavailable. */ }
  }, [progress])
  useEffect(() => {
    if (!auto || run.status === 'finished' || run.status === 'blocked') return
    const timer = window.setTimeout(() => setRun(current => advance(current.status === 'paused' ? resume(current) : current)), 900)
    return () => window.clearTimeout(timer)
  }, [auto, run])
  useEffect(() => {
    if (!mapPlaying) return
    const timer = window.setTimeout(() => setMapIndex(current => {
      if (current >= visiblePath.length - 1) { setMapPlaying(false); return current }
      const next = current + 1
      setSelectedMap(visiblePath[next])
      return next
    }), 1050)
    return () => window.clearTimeout(timer)
  }, [mapPlaying, mapIndex, detailed])
  useEffect(() => {
    const syncHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      const concept = concepts.find(item => `concepto-${item.id}` === id)
      if (concept) { setSelectedId(concept.id); setDemonstration(0); document.getElementById('atlas')?.scrollIntoView() }
    }
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function visit(id: string) {
    setProgress(prev => prev.includes(id) ? prev : [...prev, id])
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  function chooseConcept(id: string) {
    setSelectedId(id)
    setDemonstration(0)
    history.replaceState(null, '', `#concepto-${id}`)
    setProgress(prev => prev.includes('atlas') ? prev : [...prev, 'atlas'])
  }
  function updateConfig<K extends keyof Config>(key: K, value: Config[K]) {
    const next = { ...config, [key]: value }
    setConfig(next)
    setRun(reset(scenario, next))
    setAuto(false)
  }
  function chooseScenario(next: Scenario) {
    setScenario(next)
    setRun(reset(next, config))
    setAuto(false)
  }
  function startSimulation() {
    setRun(current => current.status === 'finished' || current.status === 'blocked'
      ? advance(reset(scenario, config))
      : advance(current.status === 'paused' ? resume(current) : current))
    setAuto(true)
    setProgress(prev => prev.includes('laboratorio') ? prev : [...prev, 'laboratorio'])
  }
  function nextSimulation() {
    setAuto(false)
    setRun(current => advance(current.status === 'paused' ? resume(current) : current))
  }

  return (
    <div className="app">
      <a href="#main" className="skip">Saltar al contenido</a>
      <header className="header">
        <a href="#inicio" className="brand" onClick={() => visit('inicio')} aria-label="Ir al inicio">P<span className="brand-mark">/</span>S <span className="brand-caption">LABORATORIO</span></a>
        <nav aria-label="Navegación principal" className="nav">
            <a href="#origen" onClick={() => visit('origen')}>Recorrido</a>
            <a href="#atlas" onClick={() => visit('atlas')}>Atlas</a>
          <a href="#laboratorio" onClick={() => visit('laboratorio')}>Simular</a>
          <a href="#mapa" onClick={() => visit('mapa')}>Mapa</a>
          <a href="#aplicacion" onClick={() => visit('aplicacion')}>Aplicar</a>
        </nav>
        <div className="header-actions">
          <button className="text-button" onClick={() => setGlossary(v => !v)} aria-expanded={glossary} aria-controls="glossary-panel">Glosario</button>
          <a className="mode-button" href="?presentacion=1#inicio" target="_blank" rel="noopener noreferrer" aria-label="Abrir Diapositiva highlights en una pestaña nueva">Diapositiva highlights ↗</a>
        </div>
      </header>
      {glossary && <aside id="glossary-panel" className="glossary" aria-label="Glosario de conceptos">
        <div className="glossary-top"><h2>Glosario</h2><button onClick={() => setGlossary(false)} aria-label="Cerrar glosario">Cerrar</button></div>
        <p>Seleccioná un término para abrir su demostración.</p>
        <div className="glossary-list">{concepts.map(c => <a key={c.id} href={`#concepto-${c.id}`} onClick={() => { chooseConcept(c.id); setGlossary(false); document.getElementById('atlas')?.scrollIntoView() }}>{c.name}</a>)}</div>
      </aside>}
      <main id="main">
        <section id="inicio" className="hero section">
          <div className="hero-copy">
            <p className="section-intro">Una charla de 30 minutos · Un caso, muchas piezas</p>
            <h1>Del prompt <span>al sistema.</span></h1>
            <p className="hero-lede">Cómo construir workflows con IA. Un laboratorio para ver qué pasa entre pedir un formulario y recibir un resultado comprobado.</p>
            <button className="primary" onClick={() => visit('origen')}>Comenzar la charla <span aria-hidden="true">↗</span></button>
            <p className="small-note">Sin cuentas, sin claves y sin IA conectada. Las demostraciones son simuladas y predefinidas.</p>
          </div>
          <div className="hero-demo" aria-label="Comparación interactiva de una petición y un proceso">
            <div className="demo-head"><span className="live-dot" aria-hidden="true" /> <span>CAMBIO DE PERSPECTIVA</span> <span className="demo-index">01 / 02</span></div>
            <div className="segmented" role="group" aria-label="Comparar petición y proceso">
              <button className={comparison === 'isolated' ? 'selected' : ''} onClick={() => setComparison('isolated')} aria-pressed={comparison === 'isolated'}>Petición aislada</button>
              <button className={comparison === 'system' ? 'selected' : ''} onClick={() => setComparison('system')} aria-pressed={comparison === 'system'}>Proceso con controles</button>
            </div>
            <div className="comparison-body" key={comparison}>
              <div className="prompt-window"><span>ENTRADA DEL USUARIO</span><p>“Crea un formulario de registro”.</p></div>
              {comparison === 'isolated' ? <div className="comparison-result isolated"><span>LO QUE SABEMOS</span><strong>Hay una intención.<br />Falta un proceso.</strong><p>No se definieron archivos, criterios de aceptación ni forma de verificar el resultado.</p></div> :
                <div className="comparison-result system"><span>LO QUE AÑADIMOS</span><ul><li><b>Contexto</b> · contrato de API y componentes existentes</li><li><b>Instrucciones</b> · validar campos y errores visibles</li><li><b>Herramientas</b> · leer, editar y probar</li><li><b>Controles</b> · permisos, límite y revisión</li></ul><p>Más información y evidencia; no una garantía de ausencia de errores.</p></div>}
            </div>
            <div className="demo-foot">MISMO OBJETIVO <span aria-hidden="true">→</span> DISTINTA CAPACIDAD DE TRABAJO</div>
          </div>
        </section>

        <section className="route-strip" aria-label="Formas de explorar">
          <div><strong>Tu recorrido, a tu ritmo.</strong><p>Seguí la secuencia de la charla o saltá directamente a lo que querés entender.</p></div>
          <div className="segmented route-choice" role="group" aria-label="Modo de navegación">
            <button className={mode === 'guided' ? 'selected' : ''} onClick={() => setMode('guided')} aria-pressed={mode === 'guided'}>Recorrido guiado</button>
            <button className={mode === 'free' ? 'selected' : ''} onClick={() => setMode('free')} aria-pressed={mode === 'free'}>Exploración libre</button>
          </div>
          {mode === 'guided' ? <div className="route-steps">{guided.map((id, i) => <a key={id} href={`#${id}`} onClick={() => visit(id)} aria-label={`${sectionNames[id]}${progress.includes(id) ? ', visitado' : ''}`}><span>{String(i + 1).padStart(2, '0')}</span>{sectionNames[id]} {progress.includes(id) && <span aria-hidden="true">✓</span>}</a>)}</div> :
            <div className="route-steps">{(['atlas', 'laboratorio', 'mapa', 'aplicacion'] as const).map(id => <a key={id} href={`#${id}`} onClick={() => visit(id)}>{freeNames[id]} <span aria-hidden="true">↗</span></a>)}</div>}
          <small>Progreso guardado solo en este navegador. {progress.length} de {guided.length} etapas visitadas.</small>
        </section>

        <Story onVisit={visit} />
        <section id="aplicacion" className="section application-section">
          <div className="section-heading"><div><span className="small-caps">ÚLTIMO CAPÍTULO · 5 MIN</span><h2>Sin metodología, <em>el sistema pierde rumbo.</em></h2><p>El harness ofrece capacidades y límites; un método decide cómo plantear, ejecutar y verificar el trabajo. Ninguno reemplaza el criterio humano.</p></div></div>
          <Diagram label="SDD: de requisito a verificación" className="sdd-diagram" nodes={sddNodes} links={sddLinks} flows={sddFlows} />
          <p className="chapter-caveat">Este flujo SDD es una ilustración para una feature; no exige a todas las plataformas ni a todo cambio pasar por los mismos archivos.</p>
          <div className="story-process"><h3>SDD: artefactos antes del cambio</h3><ol><li><b>spec.md</b><span>Describe comportamiento y criterios observables del formulario.</span></li><li><b>plan.md</b><span>Decide componentes, integración con API y riesgos.</span></li><li><b>tasks.md</b><span>Divide la implementación y conserva qué se verificó.</span></li><li><b>Código + pruebas</b><span>Se ejecuta y se compara con la especificación; si falla, se revisa el plan o el cambio.</span></li></ol><p>Este pipeline de documentación es un ejemplo concreto de SDD, no un requisito universal para toda tarea.</p></div>
          <Diagram label="ODD: elegir una ruta y verificar" className="odd-diagram" nodes={oddNodes} links={oddLinks} flows={oddFlows} />
          <p className="chapter-caveat">ODD aquí sigue el flujo descrito para gentle-ai: explorar, clasificar y ejecutar con pruebas; una tarea grande conserva seguimiento, pero no se delega automáticamente por ser grande.</p>
          <div className="approaches">
            <article className="approach"><span className="approach-type">SDD · EJEMPLO ILUSTRATIVO</span><h3>La especificación como eje</h3><p>Una forma de Spec-Driven Development: convertir el pedido en un contrato verificable antes de implementar.</p><ol className="artifact-list"><li><b>Requerimiento</b><span>Pedido del formulario con API y validaciones.</span><small>Artefacto: necesidad expresada.</small></li><li><b>Especificación</b><span>Campos, errores visibles, respuestas esperadas.</span><small>Artefacto: criterios comprobables.</small></li><li><b>Planificación</b><span>Componentes, integración y pruebas por realizar.</span><small>Artefacto: plan de trabajo.</small></li><li><b>Implementación</b><span>El agente usa contexto y herramientas permitidas.</span><small>Artefacto: cambios de código.</small></li><li><b>Verificación</b><span>Pruebas y revisión frente a criterios.</span><small>Artefacto: evidencia y pendientes.</small></li></ol></article>
            <article className="approach"><span className="approach-type">ODD · SEGÚN JOAQUÍN RUIZ</span><h3>El proceso se ajusta al trabajo</h3><p>Según <a href="https://jokiruiz.com/inteligencia-artificial/que-es-odd-organic-driven-development/" target="_blank" rel="noreferrer">el artículo de Joaquín Ruiz</a>, ODD es el flujo de <i>gentle-ai</i>: entender el código, clasificar si la tarea es pequeña o grande e implementar con pruebas.</p><div className="odd-steps"><div><b>Entender</b><span>Leer el proyecto y consultar solo decisiones de producto abiertas.</span></div><div><b>Clasificar</b><span>Pequeña: resolver directamente. Grande: documentar requisitos en <code>odd/tasks</code> y conservarlos en Engram, según esa implementación.</span></div><div><b>Implementar y probar</b><span>Comprobar el resultado; una capa de revisión separada puede añadir control.</span></div></div><p className="source-note"><b>Adaptación didáctica de esta web:</b> usamos el formulario de registro para mostrar esas decisiones. No afirmamos que todas las variantes de ODD usen el mismo software ni que esta simulación ejecute gentle-ai.</p></article>
          </div>
          <div className="comparison-table"><h3>¿Qué cambia en la práctica?</h3><div className="table-scroll"><table><thead><tr><th>Aspecto</th><th>SDD ilustrado aquí</th><th>ODD descrito por la fuente</th></tr></thead><tbody><tr><th>Especificación</th><td>Se explicita antes del código como artefacto central.</td><td>Una tarea pequeña puede resolverse sin documento; una grande conserva requisitos en una tarea.</td></tr><tr><th>Iteración</th><td>La implementación sigue un plan, que puede revisarse.</td><td>La cantidad de proceso cambia al clasificar el trabajo.</td></tr><tr><th>Validación</th><td>Pruebas y revisión frente a la especificación.</td><td>Implementación con pruebas; el artículo distingue una revisión de riesgos aparte.</td></tr></tbody></table></div><p>No hay un enfoque universalmente superior. La complejidad, el riesgo y la necesidad de dejar decisiones por escrito importan.</p></div>
          <div className="story-process"><h3>Tres decisiones para configurar tu harness</h3><ol><li><b>Entrada de solo lectura</b><span>Distinguir investigar de modificar: leer el mapa del proyecto antes de editar y exigir autorización para escribir. Un bloqueo técnico de herramientas requiere una implementación explícita; una instrucción por sí sola no es una barrera.</span></li><li><b>Clasificación</b><span>Elegir comprobaciones proporcionales. En ODD una tarea pequeña puede ejecutarse sin documento; una grande necesita seguimiento. SDD puede reservarse para cambios que requieren un pipeline documentado.</span></li><li><b>Estado persistente</b><span>Guardar decisiones, pruebas y pendientes en Markdown o memoria externa como Engram; recuperar fuentes tras compactar y verificar que sigan vigentes.</span></li></ol><p>Harness engineering describe el trabajo sobre este entorno; «AI-native SDLC» sitúa esas prácticas en el ciclo de desarrollo. Son etiquetas de contexto, no un estándar único que imponga ODD o SDD.</p></div>
        </section>
        <div className="free-intro"><span>PARA EXPLORAR A TU RITMO</span><h2>Ahora, <em>probá las piezas.</em></h2><p>El atlas, el laboratorio y el mapa complementan la charla: no sustituyen su hilo narrativo.</p></div>
        <section id="atlas" className="section atlas-section">
          <div className="section-heading"><div><h2>Las piezas, <em>en acción.</em></h2><p>Elegí un concepto. Probá una variante. Observá qué cambia en el mismo formulario de registro.</p></div><span className="count-label">14 CONCEPTOS · 4 FAMILIAS</span></div>
          <div className="atlas-layout">
            <div className="concept-navigation" aria-label="Conceptos">
              {(Object.keys(familyNames) as Family[]).map(family => <div className={`family family-${family}`} key={family}>
                <h3>{familyNames[family]}</h3>
                <div className="concept-buttons">{concepts.filter(c => c.family === family).map(c => <a key={c.id} href={`#concepto-${c.id}`} className={selectedId === c.id ? 'active' : ''} aria-current={selectedId === c.id ? 'true' : undefined} onClick={e => { e.preventDefault(); chooseConcept(c.id) }}>{c.name}<span aria-hidden="true">↗</span></a>)}</div>
              </div>)}
            </div>
            <article className={`concept-detail family-${activeConcept.family}`} id={`concepto-${activeConcept.id}`} key={activeConcept.id}>
              <div className="concept-detail-head"><span>{familyNames[activeConcept.family]}</span><span>{String(concepts.indexOf(activeConcept) + 1).padStart(2, '0')} / 14</span></div>
              <h3>{activeConcept.name}</h3>
              <p className="concept-what">{activeConcept.what}</p>
              <div className="concept-facts"><p><b>Para qué sirve</b>{activeConcept.purpose}</p><p><b>Qué interviene</b>{activeConcept.pieces}</p><p><b>En nuestro ejemplo</b>{activeConcept.example}</p></div>
              <div className="mini-lab"><div className="mini-title"><span className="live-dot" aria-hidden="true" /> PROBALO · SIMULACIÓN PREDEFINIDA</div><h4>{activeConcept.prompt}</h4><div className="mini-options" role="group" aria-label={`Opciones para ${activeConcept.name}`}>{activeConcept.choices.map((choice, i) => <button key={choice} className={demonstration === i ? 'active' : ''} onClick={() => setDemonstration(i)} aria-pressed={demonstration === i}>{choice}</button>)}</div><div className="observed" aria-live="polite"><span>RESULTADO OBSERVABLE</span><p>{activeConcept.outcomes[demonstration]}</p></div></div>
              <div className="concept-bottom"><p><b>Se relaciona con</b> {activeConcept.related.map((id, i) => <React.Fragment key={id}>{i > 0 && ' · '}<a href={`#concepto-${id}`} onClick={e => { e.preventDefault(); chooseConcept(id) }}>{concepts.find(c => c.id === id)?.name}</a></React.Fragment>)}</p><p><b>Confusión frecuente</b> {activeConcept.confusion}</p></div>
            </article>
          </div>
          <div className="section-next"><button onClick={() => visit('laboratorio')}>Ahora, construí tu sistema <span aria-hidden="true">→</span></button></div>
        </section>

        <section id="laboratorio" className="section lab-section">
          <div className="section-heading"><div><h2>Construí tu <em>sistema.</em></h2><p>Configurá un recorrido posible y mirá sus consecuencias. Ninguna herramienta real ni API de IA se ejecuta.</p></div><span className="tag-sim">SIMULACIÓN PREDEFINIDA</span></div>
          <div className="lab-layout">
            <div className="config-panel">
              <h3>Configuración</h3>
              <label className="select-label" htmlFor="scenario">Escenario</label>
              <select id="scenario" value={scenario} onChange={e => chooseScenario(e.target.value as Scenario)}>{(Object.keys(scenarioNames) as Scenario[]).map(key => <option key={key} value={key}>{scenarioNames[key]}</option>)}</select>
              <div className="config-list">{(Object.keys(configNames) as (keyof typeof configNames)[]).map(key => <label key={key} className="switch-row"><span>{configNames[key]}</span><input type="checkbox" checked={config[key]} onChange={e => updateConfig(key, e.target.checked)} /><span className="toggle" aria-hidden="true" /></label>)}</div>
              <label htmlFor="iterations" className="select-label">Límite de iteraciones: <strong>{config.maxIterations}</strong></label>
              <input id="iterations" type="range" min="1" max="4" step="1" value={config.maxIterations} onChange={e => updateConfig('maxIterations', Number(e.target.value))} />
              <p className="small-note">Cambiar cualquier opción reinicia la traza: no se mezclan resultados de configuraciones distintas.</p>
            </div>
            <div className="trace-panel">
              <div className="trace-header"><div><span className="small-caps">EJECUCIÓN / {scenarioNames[scenario].toUpperCase()}</span><h3>{run.status === 'idle' ? 'Listo para comenzar' : run.status === 'blocked' ? 'Se necesita una decisión' : run.status === 'finished' ? 'Ejecución terminada' : run.status === 'paused' ? 'Ejecución en pausa' : 'En ejecución'}</h3></div><span className={`status-pill status-${run.status}`}>{run.status === 'blocked' ? 'ESPERANDO RESPUESTA' : run.status === 'finished' ? 'FINALIZADO' : run.status === 'paused' ? 'EN PAUSA' : run.status === 'running' ? 'EN CURSO' : 'PREPARADO'}</span></div>
              <div className="lab-controls"><button className="primary" onClick={startSimulation} disabled={auto || run.status === 'blocked'}>Ejecutar simulación</button><button onClick={nextSimulation} disabled={run.status === 'blocked' || run.status === 'finished'}>Siguiente paso</button><button onClick={() => { setAuto(false); setRun(current => pause(current)) }} disabled={run.status !== 'running'}>Pausar</button><button onClick={() => { setAuto(false); setRun(reset(scenario, config)) }}>Reiniciar</button></div>
              <div className="trace-meta"><span>Paso: {run.stage}</span><span>Intento: {run.iteration}/{config.maxIterations}</span><span>Eventos: {run.trace.length}</span></div>
              {run.trace.length === 0 ? <div className="trace-empty"><span aria-hidden="true">↳</span><p>La línea de tiempo aparecerá acá. Probá un escenario y avanzá paso a paso.</p></div> :
                <ol className="timeline" aria-label="Línea de tiempo de la simulación">{run.trace.map((event, i) => <li key={i} className={i === run.trace.length - 1 ? 'current' : ''}><div className="timeline-top"><span>PASO {String(i + 1).padStart(2, '0')} · {event.component}</span><span>INTENTO {event.iteration}</span></div><h4>{event.action}</h4><dl><div><dt>Entrada</dt><dd>{event.input}</dd></div><div><dt>Resultado</dt><dd>{event.result}</dd></div><div><dt>Por qué sigue o se detiene</dt><dd>{event.reason}</dd></div></dl></li>)}</ol>}
              {run.outcome && <div className="run-outcome" role="status"><strong>{run.outcome === 'validated' ? 'Validado en esta simulación' : run.outcome === 'needs-input' ? 'Necesita una decisión humana' : run.outcome === 'limit' ? 'Límite alcanzado' : run.outcome === 'unavailable' ? 'Sin herramientas para editar' : 'Sin validación automática'}</strong><p>{run.outcome === 'needs-input' ? 'Este escenario se detiene aquí. Para explorar otra decisión, cambiá el escenario o reiniciá.' : run.outcome === 'validated' ? 'Pasaron las comprobaciones simuladas y predefinidas; no es una garantía general.' : 'Revisá la traza: el resultado no cumple las condiciones para llamarse validado.'}</p></div>}
            </div>
          </div>
        </section>

        <section id="mapa" className="section map-section">
          <div className="section-heading"><div><h2>El sistema <em>completo.</em></h2><p>La petición no viaja en línea recta: información, acciones y controles se encuentran y se retroalimentan.</p></div><button className="outline-button" onClick={() => { setDetailed(d => !d); setMapPlaying(false); setMapIndex(-1); setSelectedMap('objetivo') }} aria-pressed={detailed}>{detailed ? 'Vista simplificada' : 'Vista detallada'}</button></div>
          <div className="map-controls"><button onClick={() => { setMapIndex(-1); setMapPlaying(true) }} disabled={mapPlaying}>Animar ejecución</button><button onClick={() => { setMapPlaying(false); setMapIndex(i => { const next = Math.min(i + 1, visiblePath.length - 1); setSelectedMap(visiblePath[next]); return next }) }}>Siguiente conexión</button><button onClick={() => { setMapPlaying(false); setMapIndex(-1); setSelectedMap('objetivo') }}>Reiniciar mapa</button><span aria-live="polite">{mapIndex < 0 ? 'Seleccioná un nodo o animá el recorrido.' : `Paso ${mapIndex + 1}/${visiblePath.length}: ${activeMap.title}`}</span></div>
          <div className="map-layout">
            <div className="map-visual"><div className="map-grid" aria-label="Nodos del mapa interactivo">{mapNodes.filter(node => detailed || !node.detailsOnly).map(node => <button key={node.id} className={`map-node family-${node.family} ${selectedMap === node.id ? 'active' : ''} ${visiblePath[mapIndex] === node.id ? 'playing' : ''}`} onClick={() => { setSelectedMap(node.id); setMapPlaying(false) }} aria-pressed={selectedMap === node.id}><span className="node-dot" /><strong>{node.title}</strong><small>{node.description}</small></button>)}</div><div className="map-connections" aria-label="Conexiones del mapa">{links.filter(([from, to]) => detailed || (!mapNodes.find(n => n.id === from)?.detailsOnly && !mapNodes.find(n => n.id === to)?.detailsOnly)).map(([from, to, label]) => <button key={`${from}-${to}`} onClick={() => setSelectedMap(to)} className={selectedMap === from || selectedMap === to ? 'related' : ''}><strong>{mapNodes.find(n => n.id === from)?.title}</strong><span>— {label} →</span><strong>{mapNodes.find(n => n.id === to)?.title}</strong></button>)}</div></div>
            <aside className="map-inspector"><span className="small-caps">NODO SELECCIONADO</span><h3>{activeMap.title}</h3><p>{activeMap.description}</p><h4>Conexiones etiquetadas</h4><ul>{links.filter(([from, to]) => from === activeMap.id || to === activeMap.id).map(([from, to, label]) => <li key={`${from}-${to}`}><strong>{mapNodes.find(n => n.id === from)?.title}</strong> <span>— {label} →</span> <strong>{mapNodes.find(n => n.id === to)?.title}</strong></li>)}</ul></aside>
          </div>
          <div className="map-legend" aria-label="Leyenda de familias">{(Object.keys(familyNames) as Family[]).map(family => <span key={family} className={`family-${family}`}><i className="node-dot" />{familyNames[family]}</span>)}<span>Una conexión describe una relación, no una obligación.</span></div>
          <details className="readable-map"><summary>Leer el mapa como lista de relaciones</summary><ol>{links.map(([from, to, label]) => <li key={`${from}-${to}`}>{mapNodes.find(n => n.id === from)?.title} <strong>{label}</strong> {mapNodes.find(n => n.id === to)?.title}.</li>)}</ol></details>
          <div className="map-answer"><h3>De la petición al resultado validado</h3><p>El usuario define un objetivo. El workflow ordena etapas; el harness gestiona un agente que consulta al modelo y usa información y herramientas permitidas. Las pruebas devuelven evidencia; el agente corrige o se detiene, y una persona decide donde corresponde. El resultado comunica qué se verificó y qué no.</p></div>
        </section>

      </main>
      <footer><div><strong>Del prompt al sistema.</strong><p>Un laboratorio para mirar el proceso, no solo la respuesta.</p><small>Todas las interacciones del atlas, mapa y laboratorio son simuladas y predefinidas. Los detalles de skills, hooks, permisos y harness dependen de la plataforma.</small></div><div><h2>Fuentes y lectura</h2><ul>{sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></li>)}</ul></div><a href="#inicio" onClick={() => visit('inicio')}>Volver arriba ↑</a></footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  new URLSearchParams(window.location.search).get('presentacion') === '1' ? <Presentation /> : <App />,
)
