import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.QA_URL ?? 'http://127.0.0.1:5173'
const executablePath = process.env.BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outputDir = path.resolve('artifacts/visual-qa')
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true, executablePath })

async function captureDesktop() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.tutorial-modal')
  const tutorialSteps = await page.locator('.tutorial-progress button').count()
  await page.screenshot({ path: path.join(outputDir, '00-desktop-tutorial.png'), fullPage: false })
  await page.getByTitle('Close tutorial').click()
  await page.waitForSelector('.market-bubble')
  await page.waitForTimeout(3500)
  await page.screenshot({ path: path.join(outputDir, '01-desktop-market.png'), fullPage: true })

  await page.getByRole('button', { name: 'Open tutorial' }).click()
  await page.waitForSelector('.tutorial-modal')
  await page.getByTitle('Close tutorial').click()

  const bubbleCount = await page.locator('.market-bubble').count()
  await page.getByRole('button', { name: /Solana/ }).first().click()
  await page.getByRole('button', { name: /Join league/i }).click()
  await page.getByPlaceholder('Your name').fill('Brandon')
  await page.getByPlaceholder('Your team or research desk').fill('Ghostmint Research')
  await page.getByRole('button', { name: /Open paper desk/i }).click()
  await page.getByLabel('Player 2 name').fill('Primo')
  await page.getByRole('button', { name: /Start player match/i }).click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /Settle round now/i }).click()
  await page.getByRole('button', { name: /LIMIT/ }).last().click()
  await page.getByRole('button', { name: /Place paper buy/i }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(outputDir, '02-desktop-operated.png'), fullPage: true })

  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    canvasCount: document.querySelectorAll('canvas').length,
    bubbleCount: document.querySelectorAll('.market-bubble').length,
    receiptCount: document.querySelectorAll('.receipt-preview').length,
    orderCount: document.querySelectorAll('.paper-order-row').length,
    playerDeskCount: document.querySelectorAll('.player-desk').length,
    h1: document.querySelector('h1')?.textContent ?? null,
  }))
  await page.close()
  return { metrics: { ...metrics, bubbleCount, tutorialSteps }, errors }
}

async function captureMobile() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.tutorial-modal')
  await page.getByTitle('Close tutorial').click()
  await page.waitForSelector('.market-bubble')
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(outputDir, '03-mobile-market.png'), fullPage: true })
  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    canvasCount: document.querySelectorAll('canvas').length,
    bubbleCount: document.querySelectorAll('.market-bubble').length,
    bottomNavHeight: document.querySelector('.tool-rail')?.getBoundingClientRect().height ?? 0,
  }))
  await page.close()
  return { metrics, errors }
}

const desktop = await captureDesktop()
const mobile = await captureMobile()
await browser.close()

const result = { baseUrl, desktop, mobile }
console.log(JSON.stringify(result, null, 2))

if (desktop.errors.length || mobile.errors.length) process.exitCode = 1
if (desktop.metrics.scrollWidth > desktop.metrics.viewportWidth || mobile.metrics.scrollWidth > mobile.metrics.viewportWidth) process.exitCode = 1
if (desktop.metrics.canvasCount < 1 || mobile.metrics.canvasCount < 1) process.exitCode = 1
if (desktop.metrics.receiptCount < 1 || desktop.metrics.orderCount < 1) process.exitCode = 1
if (desktop.metrics.playerDeskCount !== 2 || desktop.metrics.tutorialSteps !== 6) process.exitCode = 1
