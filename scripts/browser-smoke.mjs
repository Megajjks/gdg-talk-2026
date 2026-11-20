import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const chrome = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const url = process.env.SITE_URL ?? 'http://127.0.0.1:4173/'
const profile = await mkdtemp(join(tmpdir(), 'prompt-system-browser-'))
const port = 19331
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, url,
], { stdio: 'ignore' })
let socket
let nextId = 1
const waiting = new Map()
const errors = []
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function endpoint(path) {
  for (let i = 0; i < 35; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`)
      if (response.ok) return await response.json()
    } catch { /* Browser is starting. */ }
    await wait(150)
  }
  throw new Error('Chrome DevTools did not become available.')
}

function send(method, params = {}) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result.value
}

async function click(expression) {
  await evaluate(`${expression}.click()`)
  await wait(60)
}

async function setScenario(scenario) {
  await evaluate(`(() => { const select = document.querySelector('#scenario'); select.value = '${scenario}'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  await wait(80)
}

async function stepUntilStopped() {
  for (let i = 0; i < 18; i++) {
    const state = await evaluate('document.querySelector(".status-pill").innerText')
    if (state === 'FINALIZADO' || state === 'ESPERANDO RESPUESTA') return
    await click('document.querySelectorAll(".lab-controls button")[1]')
  }
  throw new Error('Simulation did not terminate within 18 UI steps.')
}

async function screenshot(name, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await wait(250)
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const path = join(tmpdir(), `prompt-system-${name}.png`)
  await writeFile(path, Buffer.from(data, 'base64'))
  const overflow = await evaluate('document.documentElement.scrollWidth > window.innerWidth')
  assert.equal(overflow, false, `Horizontal overflow at ${width}px`)
  console.log(`${name}: ${width}×${height}, no horizontal overflow; screenshot ${path}`)
}

async function jumpTo(id) {
  await evaluate(`window.scrollTo({ top: document.querySelector('#${id}').getBoundingClientRect().top + window.scrollY - 110, behavior: 'instant' })`)
  await wait(350)
}

try {
  const pages = await endpoint('/json')
  const page = pages.find(entry => entry.type === 'page' && entry.url.startsWith('http'))
  assert.ok(page, 'Preview page was not opened')
  socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id && waiting.has(message.id)) {
      const pending = waiting.get(message.id)
      waiting.delete(message.id)
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push('console.error')
  })
  await send('Runtime.enable')
  await send('Page.enable')
  for (let i = 0; i < 25 && !(await evaluate('Boolean(document.querySelector(".hero-demo"))')); i++) await wait(100)
  assert.match(await evaluate('document.title'), /Del prompt al sistema/)
  assert.notEqual(await evaluate('getComputedStyle(document.querySelector(".hero-copy>.primary")).display'), 'none')
  assert.equal(await evaluate('document.querySelectorAll(".concept-buttons a").length'), 14)
  assert.equal(await evaluate('["origen","contexto","memoria","capacidades","harness"].every(id => Boolean(document.getElementById(id)))'), true, 'The talk must follow the speaker narrative')
  assert.match(await evaluate('document.querySelector("#origen").innerText'), /prompt del sistema/i)
  assert.match(await evaluate('document.querySelector("#contexto").innerText'), /projectbrief.md/)
  assert.match(await evaluate('document.querySelector("#memoria").innerText'), /compactación/i)
  assert.match(await evaluate('document.querySelector("#capacidades").innerText'), /subagentes/i)
  assert.ok((await evaluate('document.querySelectorAll("#harness .diagram-node").length')) >= 6)
  assert.ok((await evaluate('document.querySelectorAll("#aplicacion .sdd-diagram .diagram-node").length')) >= 5)
  assert.ok((await evaluate('document.querySelectorAll("#aplicacion .odd-diagram .diagram-node").length')) >= 6)
  assert.equal(await evaluate('["projectbrief.md","productContext.md","systemPatterns.md","techContext.md","activeContext.md","progress.md"].every(name => document.querySelector("#contexto").innerText.includes(name))'), true)
  assert.match(await evaluate('document.querySelector("#memoria").innerText'), /FTS5/)
  assert.match(await evaluate('document.querySelector("#capacidades").innerText'), /PreToolUse.*PostToolUse.*Stop/s)
  assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".route-steps a")).map(a => a.getAttribute("href"))'), ['#inicio','#origen','#contexto','#memoria','#capacidades','#harness','#aplicacion'])
  assert.equal(await evaluate('document.querySelector("#aplicacion").compareDocumentPosition(document.querySelector("#atlas")) & Node.DOCUMENT_POSITION_FOLLOWING'), 4, 'The methodology chapter precedes free exploration')
  await click('document.querySelectorAll("#origen .part-options input")[1]')
  assert.match(await evaluate('document.querySelector("#origen .prompt-preview").innerText'), /contrato para la API/)
  await click('document.querySelectorAll("#contexto .file-list button")[4]')
  assert.match(await evaluate('document.querySelector("#contexto .file-result").innerText'), /Trabajo actual/)
  await click('document.querySelectorAll("#memoria .memory-step-buttons button")[3]')
  assert.match(await evaluate('document.querySelector("#memoria .memory-display").innerText'), /compactación/i)
  await click('document.querySelectorAll("#capacidades .mcp-rail button")[2]')
  assert.match(await evaluate('document.querySelector("#capacidades .mcp-output").innerText'), /servidor MCP/i)
  await click('document.querySelectorAll("#harness .diagram-controls button")[2]')
  assert.match(await evaluate('document.querySelector("#harness .diagram-inspector").innerText'), /prepara el trabajo/i)
  await click('document.querySelectorAll("#harness .diagram-tabs button")[1]')
  assert.match(await evaluate('document.querySelector("#harness .diagram-inspector").innerText'), /búsqueda/i)
  await click('document.querySelectorAll("#harness .diagram-tabs button")[2]')
  assert.match(await evaluate('document.querySelector("#harness .diagram-inspector").innerText'), /solo lectura/i)
  await click('document.querySelectorAll("#harness .diagram-tabs button")[3]')
  await click('document.querySelectorAll("#harness .diagram-controls button")[2]')
  assert.match(await evaluate('document.querySelector("#harness .diagram-inspector").innerText'), /spec\.md/i)
  await click('document.querySelectorAll("#aplicacion .diagram-controls button")[2]')
  assert.match(await evaluate('document.querySelector("#aplicacion .diagram-inspector").innerText'), /construir/i)
  await click('document.querySelectorAll("#aplicacion .diagram-tabs button")[1]')
  assert.match(await evaluate('document.querySelector("#aplicacion .diagram-inspector").innerText'), /prueba falla/i)
  await click('document.querySelectorAll("#aplicacion .odd-diagram .diagram-tabs button")[1]')
  await click('document.querySelectorAll("#aplicacion .odd-diagram .diagram-controls button")[2]')
  assert.match(await evaluate('document.querySelector("#aplicacion .odd-diagram .diagram-inspector").innerText'), /grande/i)
  await click('document.querySelectorAll("#aplicacion .odd-diagram .diagram-controls button")[2]')
  assert.match(await evaluate('document.querySelector("#aplicacion .odd-diagram .diagram-inspector").innerText'), /odd\/tasks/i)
  await screenshot('desktop', 1440, 900)
  await click('document.querySelectorAll(".hero-demo .segmented button")[1]')
  assert.match(await evaluate('document.querySelector(".comparison-result").innerText'), /Contexto/)
  await click('document.querySelector(\'a[href="#concepto-mcp"]\')')
  assert.match(await evaluate('document.querySelector(".concept-detail h3").innerText'), /MCP/)
  assert.equal(await evaluate('location.hash'), '#concepto-mcp')
  await click('document.querySelectorAll(".mini-options button")[2]')
  assert.match(await evaluate('document.querySelector(".observed").innerText'), /servidor/)
  await click('document.querySelector(".outline-button")')
  assert.equal(await evaluate('document.querySelectorAll(".map-node").length'), 13)
  await click('document.querySelectorAll(".map-controls button")[1]')
  assert.match(await evaluate('document.querySelector(".map-controls span").innerText'), /Paso 1/)
  await click('document.querySelectorAll(".map-controls button")[2]')
  await click('document.querySelector(".outline-button")')
  for (let i = 0; i < 11; i++) {
    await click('document.querySelectorAll(".map-controls button")[1]')
    assert.equal(await evaluate('document.querySelectorAll(".map-node.active").length'), 1, `Map step ${i + 1} must show its selected node in simplified view`)
  }
  await setScenario('failure')
  await stepUntilStopped()
  assert.match(await evaluate('document.querySelector(".run-outcome").innerText'), /Validado/)
  assert.match(await evaluate('document.querySelector(".timeline").innerText'), /FALLA/)
  assert.match(await evaluate('document.querySelector(".timeline").innerText'), /corregir_validacion_email/)
  await setScenario('clarification')
  await stepUntilStopped()
  assert.match(await evaluate('document.querySelector(".run-outcome").innerText'), /decisión humana/)
  await click('document.querySelectorAll(".lab-controls button")[3]')
  assert.equal(await evaluate('document.querySelectorAll(".timeline li").length'), 0)
  await setScenario('success')
  await click('document.querySelectorAll(".lab-controls button")[0]')
  await click('document.querySelectorAll(".lab-controls button")[2]')
  assert.match(await evaluate('document.querySelector(".status-pill").innerText'), /EN PAUSA/)
  const pausedCount = await evaluate('document.querySelectorAll(".timeline li").length')
  await wait(1000)
  assert.equal(await evaluate('document.querySelectorAll(".timeline li").length'), pausedCount)
  await click('document.querySelectorAll(".lab-controls button")[1]')
  assert.ok((await evaluate('document.querySelectorAll(".timeline li").length')) > pausedCount)
  await click('document.querySelectorAll(".lab-controls button")[3]')
  assert.equal(await evaluate('document.querySelector(".mode-button").target'), '_blank')
  assert.match(await evaluate('document.querySelector(".mode-button").href'), /presentacion=1/)
  await click('document.querySelector(".text-button")')
  assert.equal(await evaluate('document.querySelector("#glossary-panel") !== null'), true)
  await click('document.querySelector(".glossary-top button")')
  assert.ok((await evaluate('JSON.parse(localStorage.getItem("lab-progress-v1")).length')) > 0)
  await screenshot('mobile', 390, 844)
  await jumpTo('origen')
  await screenshot('mobile-story', 390, 844)
  await jumpTo('harness')
  await screenshot('mobile-harness', 390, 844)
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#harness .diagram-mobile-step")).display'), 'grid')
  assert.match(await evaluate('document.querySelector("#harness .diagram-mobile-step").innerText'), /→/)
  await jumpTo('aplicacion')
  await screenshot('mobile-sdd', 390, 844)
  assert.match(await evaluate('document.querySelector("#aplicacion .odd-diagram .diagram-mobile-step").innerText'), /clasificar|odd\/tasks/i)
  await jumpTo('atlas')
  await screenshot('mobile-atlas', 390, 844)
  await jumpTo('laboratorio')
  await screenshot('mobile-lab', 390, 844)
  await jumpTo('mapa')
  await screenshot('mobile-map', 390, 844)
  await screenshot('small-mobile', 320, 720)
  await jumpTo('harness')
  await screenshot('small-mobile-harness', 320, 720)
  await send('Page.navigate', { url: new URL('?presentacion=1#inicio', url).href })
  for (let i = 0; i < 25 && !(await evaluate('Boolean(document.querySelector(".presentation-screen"))')); i++) await wait(100)
  assert.equal(await evaluate('document.querySelectorAll(".presentation-screen").length'), 1)
  assert.equal(await evaluate('document.querySelector(".hero")'), null, 'The reading page must not remain in the presentation DOM')
  assert.equal(await evaluate('document.querySelector(".presentation-screen").id'), 'inicio')
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".slide-grid")).gridTemplateColumns.split(" ").length'), 1)
  assert.match(await evaluate('document.querySelector(".presentation-bar").innerText'), /Diapositiva highlights/)
  const expectedSlides = ['inicio', 'origen', 'prompt', 'instrucciones', 'archivos', 'context-engineering', 'boilerplate', 'ventana', 'compactacion', 'trazabilidad', 'memoria-externa', 'integraciones', 'mcp', 'loop', 'skills', 'subagentes', 'hooks', 'harness', 'metodologia', 'sdd', 'odd', 'comparacion', 'cierre']
  const observedSlides = []
  await screenshot('presentation-desktop', 1440, 900)
  const slideOverflows = []
  for (const id of expectedSlides) {
    await evaluate(`location.hash = "#${id}"`)
    await wait(80)
    observedSlides.push(await evaluate('document.querySelector(".presentation-screen").id'))
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".slide-grid")).gridTemplateColumns.split(" ").length'), 1)
    if (id === 'archivos') assert.match(await evaluate('document.querySelector(".slide-points").innerText'), /projectbrief\.md[\s\S]*progress\.md/)
    if (id === 'boilerplate') assert.match(await evaluate('document.querySelector(".slide-detail").innerText'), /AGENTS\.md[\s\S]*CLAUDE\.md/)
    if (id === 'trazabilidad') assert.match(await evaluate('document.querySelector(".slide-points").innerText'), /ADR-001\.md[\s\S]*TRACE\.md/)
    if (id === 'mcp') assert.match(await evaluate('document.querySelector(".slide-idea").innerText'), /cliente MCP.*servidor MCP/)
    if (id === 'hooks') assert.match(await evaluate('document.querySelector(".slide-points").innerText'), /Antes[\s\S]*Después[\s\S]*Al cerrar/)
    const overflow = await evaluate('document.querySelector(".presentation-screen").scrollHeight - document.querySelector(".presentation-screen").clientHeight')
    if (overflow > 0) slideOverflows.push(`${id}: ${overflow}px`)
    if (id === 'harness') {
      assert.equal(await evaluate('document.querySelectorAll(".diagram-scene .diagram-node").length'), 6)
      assert.equal(await evaluate('document.querySelectorAll(".diagram-scene .diagram-link.is-active").length'), 0)
      assert.match(await evaluate('document.querySelector(".diagram-scene").getAttribute("aria-label")'), /harness/i)
      assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /contexto/i)
      await click('document.querySelector(".diagram-next")')
      assert.equal(await evaluate('document.querySelectorAll(".diagram-scene .diagram-link.is-active").length'), 1)
      assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /modelo/i)
      for (let i = 0; i < 4; i++) await click('document.querySelector(".diagram-next")')
      assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /observación/i)
      await click("document.querySelector('[aria-label=\"Reproducir recorrido desde el principio\"]')")
      assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /contexto/i)
      await wait(1850)
      assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /modelo/i)
      await screenshot('presentation-harness-desktop', 1440, 900)
    }
    if (id === 'sdd' || id === 'odd') {
      await click('document.querySelector(".diagram-next")')
      assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /spec|contexto|clasific/i)
      await screenshot(`presentation-${id}-desktop`, 1440, 900)
      if (id === 'odd') {
        await click('document.querySelector(".diagram-next")')
        assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /ruta pequeña/i)
        await click('document.querySelector(".diagram-next")')
        assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /verificar/i)
        assert.equal(await evaluate('document.querySelector(".diagram-next").disabled'), true)
        await click("document.querySelector('.diagram-route[data-route=\"large\"]')")
        assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /clasificar/i)
        await click('document.querySelector(".diagram-next")')
        assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /ruta grande/i)
      }
    }
    if (id === 'comparacion') {
      await click('document.querySelector(".diagram-mode")')
      assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /requisito|spec/i)
    }
  }
  assert.deepEqual(observedSlides, expectedSlides, 'The speaker narrative must keep the specified order')
  assert.deepEqual(slideOverflows, [], 'All slides should fit the desktop viewport')
  await evaluate('location.hash = "#inicio"')
  await wait(80)
  await click('document.querySelector(".presentation-controls .slide-next")')
  assert.equal(await evaluate('location.hash'), '#origen')
  assert.equal(await evaluate('document.querySelector(".presentation-screen").id'), 'origen')
  await evaluate('document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))')
  assert.equal(await evaluate('location.hash'), '#prompt')
  await send('Page.reload')
  for (let i = 0; i < 25 && !(await evaluate('Boolean(document.querySelector(".presentation-screen"))')); i++) await wait(100)
  assert.equal(await evaluate('document.querySelector(".presentation-screen").id'), 'prompt', 'Refresh must restore the current slide')
  await evaluate('document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }))')
  assert.equal(await evaluate('location.hash'), '#cierre')
  assert.equal(await evaluate('document.querySelector(".slide-next").disabled'), true)
  await evaluate('document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }))')
  assert.equal(await evaluate('location.hash'), '#inicio')
  await screenshot('presentation-mobile', 390, 844)
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".slide-grid")).gridTemplateColumns.split(" ").length'), 1)
  assert.equal(await evaluate('document.querySelector(".presentation-screen").getBoundingClientRect().bottom <= document.querySelector(".presentation-controls").getBoundingClientRect().top'), true, 'Presentation content must not overlap its controls')
  await evaluate('location.hash = "#harness"')
  await wait(80)
  await screenshot('presentation-harness-mobile', 390, 844)
  assert.equal(await evaluate('document.querySelector(".diagram-scene").scrollWidth <= document.querySelector(".diagram-scene").clientWidth'), true, 'Diagram must fit the mobile viewport without hidden horizontal steps')
  assert.equal(await evaluate("document.querySelector('.diagram-advance-mobile').closest('[aria-hidden=\"true\"]')"), null, 'The mobile action must remain available to assistive technology')
  assert.equal(await evaluate('document.querySelector(".diagram-advance-mobile").getBoundingClientRect().bottom <= document.querySelector(".presentation-controls").getBoundingClientRect().top'), true, 'The diagram next-step action must be visible above slide navigation on mobile')
  await click('document.querySelector(".diagram-advance-mobile")')
  assert.match(await evaluate('document.querySelector(".diagram-readout").innerText'), /modelo/i)
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true)
  await screenshot('presentation-harness-small-mobile', 320, 720)
  assert.equal(await evaluate('document.querySelector(".diagram-scene").scrollWidth <= document.querySelector(".diagram-scene").clientWidth'), true)
  assert.deepEqual(errors, [], 'No console errors or uncaught exceptions')
  console.log('Browser controls and desktop/mobile responsive smoke checks passed.')
} finally {
  socket?.close()
  browser.kill()
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 })
}
