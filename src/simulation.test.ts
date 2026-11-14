import assert from 'node:assert/strict'
import test from 'node:test'
import { advance, initialRun, pause, reset, type Config, type Scenario } from './simulation.ts'

const config: Config = {
  instructions: true, context: true, tools: true, skill: true,
  hook: true, tests: true, review: true, maxIterations: 3,
}

function finish(scenario: Scenario, options: Config = config) {
  let run = initialRun(scenario, options)
  for (let i = 0; i < 30 && run.status !== 'finished' && run.status !== 'blocked'; i++) run = advance(run)
  return run
}

test('success has a tested terminal result and never exceeds iteration limit', () => {
  const run = finish('success')
  assert.equal(run.status, 'finished')
  assert.equal(run.outcome, 'validated')
  assert.ok(run.trace.some(step => step.action.includes('ejecutar_pruebas')))
  assert.ok(run.iteration <= config.maxIterations)
})

test('failure first exposes a failed test, then records one correction', () => {
  const run = finish('failure')
  assert.equal(run.outcome, 'validated')
  assert.equal(run.iteration, 2)
  assert.ok(run.trace.some(step => step.result.includes('FALLA')))
  assert.ok(run.trace.some(step => step.action.includes('corregir')))
})

test('missing decision pauses without inventing an answer', () => {
  const run = finish('clarification')
  assert.equal(run.status, 'blocked')
  assert.equal(run.outcome, 'needs-input')
  assert.ok(run.trace.at(-1)?.reason.includes('decisión'))
})

test('without tests failure is not automatically discovered or called validated', () => {
  const run = finish('failure', { ...config, tests: false })
  assert.equal(run.status, 'finished')
  assert.equal(run.outcome, 'unverified')
  assert.equal(run.iteration, 1)
  assert.equal(run.trace.some(step => step.result.includes('FALLA')), false)
})

test('disabled tools stop before simulated edits', () => {
  const run = finish('success', { ...config, tools: false })
  assert.equal(run.outcome, 'unavailable')
  assert.equal(run.trace.some(step => step.action.includes('editar_archivo')), false)
})

test('limit stops after the first failed test without a second attempt', () => {
  const run = finish('failure', { ...config, maxIterations: 1 })
  assert.equal(run.outcome, 'limit')
  assert.equal(run.iteration, 1)
})

test('pause freezes state; restart clears trace; advancing finished does nothing', () => {
  let run = advance(initialRun('success', config))
  run = pause(run)
  assert.equal(advance(run), run)
  assert.deepEqual(reset('failure', config).trace, [])
  const finished = finish('success')
  assert.equal(advance(finished), finished)
})
