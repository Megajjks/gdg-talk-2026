export type Scenario = 'success' | 'failure' | 'clarification'
export type Config = {
  instructions: boolean
  context: boolean
  tools: boolean
  skill: boolean
  hook: boolean
  tests: boolean
  review: boolean
  maxIterations: number
}
export type Stage = 'prepare' | 'inspect' | 'decide' | 'edit' | 'format' | 'test' | 'correct' | 'review' | 'finish'
export type Status = 'idle' | 'running' | 'paused' | 'blocked' | 'finished'
export type Outcome = 'validated' | 'unverified' | 'needs-input' | 'unavailable' | 'limit' | null
export type Trace = {
  stage: Stage
  component: string
  input: string
  action: string
  result: string
  reason: string
  iteration: number
}
export type Run = {
  scenario: Scenario
  config: Config
  status: Status
  stage: Stage
  iteration: number
  trace: Trace[]
  outcome: Outcome
}

export const defaultConfig: Config = {
  instructions: true, context: true, tools: true, skill: true,
  hook: true, tests: true, review: true, maxIterations: 2,
}

export function initialRun(scenario: Scenario, config: Config): Run {
  return { scenario, config: { ...config, maxIterations: Math.max(1, Math.min(4, config.maxIterations)) }, status: 'idle', stage: 'prepare', iteration: 0, trace: [], outcome: null }
}

export const reset = initialRun

export function pause(run: Run): Run {
  return run.status === 'running' ? { ...run, status: 'paused' } : run
}

export function resume(run: Run): Run {
  return run.status === 'paused' ? { ...run, status: 'running' } : run
}

function record(run: Run, stage: Stage, component: string, input: string, action: string, result: string, reason: string, next: Stage, status: Status = 'running', outcome: Outcome = null): Run {
  return {
    ...run, status, stage: next, outcome,
    trace: [...run.trace, { stage, component, input, action, result, reason, iteration: run.iteration }],
  }
}

export function advance(run: Run): Run {
  if (run.status === 'paused' || run.status === 'blocked' || run.status === 'finished') return run
  const { config, scenario } = run
  switch (run.stage) {
    case 'prepare':
      return record(run, 'prepare', 'Workflow + instrucciones', 'Petición: formulario de registro',
        'organizar_etapas()', config.instructions ? 'Objetivo y criterios visibles.' : 'Solo objetivo general; criterios no especificados.',
        'Se prepara la ejecución sin afirmar que el resultado será correcto.', 'inspect')
    case 'inspect':
      return record(run, 'inspect', 'Contexto + herramientas', 'Componente y contrato de API',
        config.context && config.tools ? 'leer_archivo(RegisterForm.tsx), leer_documento(api.md)' : 'consultar_contexto_disponible()',
        config.context && config.tools ? 'Convenciones y contrato disponibles (simulado).' : 'Información del proyecto incompleta.',
        'El agente necesita decidir con la información disponible.', 'decide')
    case 'decide':
      if (scenario === 'clarification') return record(run, 'decide', 'Agente + revisión humana',
        '¿El registro requiere confirmación por email?', 'solicitar_aclaracion()',
        'Pausa: falta una decisión de producto; no se envió ningún email.',
        'Se requiere una decisión del usuario antes de continuar.', 'decide', 'blocked', 'needs-input')
      if (!config.tools) return record(run, 'decide', 'Harness + permisos', 'Edición del componente',
        'comprobar_herramientas()', 'No hay herramienta de edición disponible.',
        'Se detiene; una respuesta de texto no modifica archivos.', 'finish', 'finished', 'unavailable')
      return record({ ...run, iteration: run.iteration + 1 }, 'decide', 'Agente + modelo',
        'Objetivo + contexto disponible', 'elegir_siguiente_accion()',
        config.skill ? 'Guía de formularios accesibles incorporada.' : 'Sin guía reutilizable; se mantienen las instrucciones disponibles.',
        'Hay una acción permitida y queda un intento.', 'edit')
    case 'edit':
      return record(run, 'edit', 'Herramienta de edición', 'RegisterForm.tsx',
        'editar_archivo(RegisterForm.tsx)', scenario === 'failure' && run.iteration === 1
          ? 'Formulario simulado creado; una validación de email quedó defectuosa.'
          : 'Formulario simulado con campos, validaciones e integración de API.',
        config.hook ? 'Evento de edición: se ejecutará el hook.' : 'No hay hook de formato; sigue la verificación.', config.hook ? 'format' : 'test')
    case 'format':
      return record(run, 'format', 'Hook', 'Evento: después de editar',
        'formatear_archivo(RegisterForm.tsx)', 'Formato aplicado (simulado); no corrige la lógica.',
        'El hook no reemplaza las pruebas.', 'test')
    case 'test':
      if (!config.tests) return record(run, 'test', 'Validaciones', 'Pruebas desactivadas',
        'omitir_pruebas()', 'No se ejecutó ninguna prueba; un fallo de email no se detecta automáticamente.',
        'El resultado no puede llamarse validado.', 'review', 'running', 'unverified')
      if (scenario === 'failure' && run.iteration === 1) return record(run, 'test', 'Pruebas',
        'Email inválido + respuesta API', 'ejecutar_pruebas(registro)',
        'FALLA: se aceptó un email inválido; la prueba de integración API pasó.',
        run.iteration < config.maxIterations ? 'Quedan intentos: se necesita corrección.' : 'Se alcanzó el límite de iteraciones.',
        run.iteration < config.maxIterations ? 'correct' : 'finish',
        run.iteration < config.maxIterations ? 'running' : 'finished',
        run.iteration < config.maxIterations ? null : 'limit')
      return record(run, 'test', 'Pruebas', 'Email inválido + respuesta API',
        'ejecutar_pruebas(registro)', 'PASA: validación de email e integración API (simulado).',
        'Los criterios probados pasan; esto no demuestra ausencia total de errores.', 'review')
    case 'correct':
      return record(run, 'correct', 'Loop del agente', 'Fallo observable de email',
        'corregir_validacion_email()', 'Se cambia la validación simulada.',
        'Se vuelve a decidir y ejecutar las pruebas; no se acepta solo la corrección propuesta.', 'decide')
    case 'review':
      return record(run, 'review', 'Revisión humana', 'Cambios y evidencia disponible',
        config.review ? 'revisar_cambios()' : 'omitir_revision()',
        config.review ? 'Revisión simulada del cambio completada.' : 'No se solicitó revisión humana.',
        'Se informa qué se comprobó y qué quedó sin comprobar.', 'finish')
    case 'finish': {
      const outcome: Outcome = run.outcome ?? (config.tests ? 'validated' : 'unverified')
      return record(run, 'finish', 'Workflow', 'Trazas y criterios',
        'entregar_resultado()', outcome === 'validated' ? 'Resultado validado en las pruebas simuladas y predefinidas.' : 'Resultado entregado sin validación automática.',
        'Condición de salida alcanzada.', 'finish', 'finished', outcome)
    }
  }
}
