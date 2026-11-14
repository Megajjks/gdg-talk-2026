import { useEffect, useState } from 'react'
import type { DiagramFlow, DiagramLink, DiagramNode } from './narrative-data'

type Props = {
  label: string
  className?: string
  nodes: DiagramNode[]
  links: DiagramLink[]
  flows: DiagramFlow[]
}

function wire(from: DiagramNode, to: DiagramNode) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const bend = Math.abs(dx) < 30 ? 65 : Math.abs(dy) < 30 ? 0 : Math.sign(dy) * Math.min(55, Math.abs(dx) * .16)
  return `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 + bend} ${to.x} ${to.y}`
}

export function Diagram({ label, className = '', nodes, links, flows }: Props) {
  const [flowId, setFlowId] = useState(flows[0].id)
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const flow = flows.find(item => item.id === flowId) ?? flows[0]
  const step = flow.steps[stepIndex]
  const selected = nodes.find(node => node.id === selectedNode) ?? nodes.find(node => node.id === step.to)!
  const from = nodes.find(node => node.id === step.from)!
  const to = nodes.find(node => node.id === step.to)!

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (stepIndex >= flow.steps.length - 1) { setPlaying(false); return }
      setStepIndex(i => i + 1)
      setSelectedNode(null)
    }, 1700)
    return () => window.clearTimeout(timer)
  }, [playing, stepIndex, flow])

  function chooseFlow(id: string) {
    setFlowId(id)
    setStepIndex(0)
    setPlaying(false)
    setSelectedNode(null)
  }
  function next() {
    setPlaying(false)
    setStepIndex(i => Math.min(i + 1, flow.steps.length - 1))
    setSelectedNode(null)
  }
  function previous() {
    setPlaying(false)
    setStepIndex(i => Math.max(0, i - 1))
    setSelectedNode(null)
  }

  return <div className={`interactive-diagram ${className}`} aria-label={label}>
    <div className="diagram-heading"><div><strong>{label}</strong><span>Simulación didáctica predefinida · seleccioná un nodo o avanzá un paso</span></div><div className="diagram-tabs" role="group" aria-label={`Escenarios de ${label}`}>{flows.map(item => <button key={item.id} onClick={() => chooseFlow(item.id)} className={flowId === item.id ? 'selected' : ''} aria-pressed={flowId === item.id}>{item.title}</button>)}</div></div>
    <div className="diagram-controls"><button onClick={previous} disabled={stepIndex === 0}>Anterior</button><button onClick={() => { setStepIndex(stepIndex >= flow.steps.length - 1 ? 0 : stepIndex); setSelectedNode(null); setPlaying(v => !v) }}>{playing ? 'Pausar animación' : 'Animar recorrido'}</button><button onClick={next} disabled={stepIndex >= flow.steps.length - 1}>Siguiente paso</button><button onClick={() => { setPlaying(false); setStepIndex(0); setSelectedNode(null) }}>Reiniciar</button><span aria-live="polite">{stepIndex + 1} / {flow.steps.length}</span></div>
    <div className="diagram-body"><div className="diagram-scroller" tabIndex={0} aria-label={`Diagrama desplazable de ${label}. La lista de relaciones está disponible debajo.`}><svg viewBox="0 0 1000 580" role="img" aria-label={`${label}: ${nodes.map(n => n.title).join(', ')}`}>
      <defs><marker id={`${className || 'diagram'}-arrow`} markerWidth="8" markerHeight="8" refX="10" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#88a499" strokeWidth="1.5" /></marker></defs>
      {links.map(link => {
        const a = nodes.find(node => node.id === link.from)!
        const b = nodes.find(node => node.id === link.to)!
        const active = step.from === link.from && step.to === link.to
        return <path key={`${link.from}-${link.to}`} d={wire(a, b)} className={`diagram-wire ${active ? 'active' : ''}`} markerEnd={`url(#${className || 'diagram'}-arrow)`} />
      })}
      <circle className="diagram-packet" r="7" fill="#b8e26a"><animateMotion key={`${flowId}-${stepIndex}`} dur="1.7s" repeatCount="indefinite" path={wire(from, to)} /></circle>
      {nodes.map(node => <g key={node.id} className={`diagram-node role-${node.role} ${step.to === node.id ? 'target' : ''} ${selected.id === node.id ? 'inspected' : ''}`} transform={`translate(${node.x},${node.y})`} tabIndex={0} role="button" aria-label={`${node.title}: ${node.detail}`} onClick={() => { setSelectedNode(node.id); setPlaying(false) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedNode(node.id); setPlaying(false) } }}><rect x="-78" y="-36" width="156" height="72" rx="10" /><circle cx="-60" cy="-18" r="4" /><text textAnchor="middle" dominantBaseline="middle">{node.title}</text></g>)}
    </svg></div>
    <aside className="diagram-inspector" aria-live="polite"><span>ETAPA {String(stepIndex + 1).padStart(2, '0')} / {String(flow.steps.length).padStart(2, '0')}</span><h3>{selectedNode ? selected.title : step.title}</h3>{selectedNode ? <p>{selected.detail}</p> : <><p><b>Conexión:</b> {from.title} <span aria-hidden="true">→</span> {to.title}</p><dl><div><dt>Entrada</dt><dd>{step.input}</dd></div><div><dt>Resultado observable</dt><dd>{step.output}</dd></div><div><dt>Por qué continúa o termina</dt><dd>{step.why}</dd></div></dl></>}<small>La animación ilustra mensajes y resultados visibles, nunca razonamientos privados del modelo.</small></aside></div>
    <details className="diagram-list"><summary>Leer conexiones y etapas como lista</summary><ul>{links.map(link => <li key={`${link.from}-${link.to}`}>{nodes.find(n => n.id === link.from)?.title} <b>— {link.label} →</b> {nodes.find(n => n.id === link.to)?.title}.</li>)}</ul><ol>{flow.steps.map(item => <li key={`${item.from}-${item.to}-${item.title}`}><b>{item.title}</b>: {item.input} → {item.output}</li>)}</ol></details>
  </div>
}
