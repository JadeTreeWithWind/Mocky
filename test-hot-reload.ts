import { serverManager } from './src/main/server'
import { Route } from './src/shared/types'

const projectId = 'hot-reload-test'
const initialPort = 9000

const route1: Route = {
  id: 'r1',
  projectId,
  method: 'GET',
  path: '/test',
  isActive: true,
  response: { statusCode: 200, body: '{"ver": 1}', delay: 0 }
}

const route2: Route = {
  id: 'r1',
  projectId,
  method: 'GET',
  path: '/test',
  isActive: true,
  response: { statusCode: 200, body: '{"ver": 2}', delay: 0 }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runTest() {
  console.log('--- Starting Hot Reload (Port Stability) Test ---')

  try {
    // 1. Start Server
    console.log(`[1] Starting server on port ${initialPort}...`)
    const port1 = await serverManager.start(projectId, initialPort, [route1])
    console.log(`    Server runnning at ${port1}`)

    if (port1 !== initialPort) {
      console.warn(`    ⚠️ Warning: Wanted ${initialPort}, got ${port1}`)
    }

    // 2. Restart Server (Simulate Hot Reload)
    console.log(`[2] Restarting server (Hot Reload) with updated route...`)
    // In the app, stop() is called inside start(), but let's emulate exactly what start() does
    // serverManager.start() calls stop() internally.

    const port2 = await serverManager.start(projectId, initialPort, [route2])
    console.log(`    Server runnning at ${port2}`)

    // 3. Verify Port Stability
    if (port1 === port2) {
      console.log('    ✅ Port remained stable.')
    } else {
      console.error(
        `    ❌ Port changed from ${port1} to ${port2}. This triggers "Port Busy" warnings in UI.`
      )
      // This is acceptable if external factors but for hot-reload it should ideally be stable.
    }

    // 4. Verify Content Update
    console.log('[3] Verifying content update...')
    const res = await fetch(`http://localhost:${port2}/test`)
    const json = await res.json()
    console.log('    Response:', json)

    if (json.ver === 2) {
      console.log('    ✅ Content updated successfully.')
    } else {
      console.error('    ❌ Content did NOT update.')
    }

    // 5. Verify Swagger Update
    console.log('[4] Verifying Swagger update...')
    const docRes = await fetch(`http://localhost:${port2}/docs`)
    if (docRes.ok) {
      console.log('    ✅ Docs still accessible.')
    } else {
      console.error('    ❌ Docs not accessible.')
    }
  } catch (error) {
    console.error('Test Failed:', error)
    process.exit(1)
  } finally {
    await serverManager.stop(projectId)
    console.log('--- Test Finished ---')
  }
}

runTest()
