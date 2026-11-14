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
  assert.equal(await evaluate('document.querySelectorAll(".concept-buttons a").length'), 14)
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
  await click('document.querySelector(".mode-button")')
  assert.equal(await evaluate('document.querySelector(".app").classList.contains("presentation")'), true)
  await click('document.querySelector(".mode-button")')
  await click('document.querySelector(".text-button")')
  assert.equal(await evaluate('document.querySelector("#glossary-panel") !== null'), true)
  await click('document.querySelector(".glossary-top button")')
  assert.ok((await evaluate('JSON.parse(localStorage.getItem("lab-progress-v1")).length')) > 0)
  await screenshot('mobile', 390, 844)
  await jumpTo('atlas')
  await screenshot('mobile-atlas', 390, 844)
  await jumpTo('laboratorio')
  await screenshot('mobile-lab', 390, 844)
  await jumpTo('mapa')
  await screenshot('mobile-map', 390, 844)
  await screenshot('small-mobile', 320, 720)
  assert.deepEqual(errors, [], 'No console errors or uncaught exceptions')
  console.log('Browser controls and desktop/mobile responsive smoke checks passed.')
} finally {
  socket?.close()
  browser.kill()
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 })
}
