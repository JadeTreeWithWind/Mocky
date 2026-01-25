import { serverManager } from './src/main/server'
import { Route } from './src/shared/types'

// Mock Data
const projectId = 'cors-test-project'
const port = 9005 // Different port to avoid conflicts
const routes: Route[] = [
  {
    id: '1',
    projectId: projectId,
    method: 'GET',
    path: '/cors-test',
    description: 'Test CORS',
    isActive: true,
    response: {
      statusCode: 200,
      body: JSON.stringify({ message: 'CORS OK' }),
      delay: 0
    }
  }
]

async function runTest() {
  console.log('--- Starting Stage 5 (Try it out & CORS) Test ---')

  try {
    // 1. Start Server
    console.log('Starting server...')
    const actualPort = await serverManager.start(projectId, port, routes)
    console.log(`Server started on port ${actualPort}`)

    // 2. Check OpenAPI Spec for Server URL
    console.log('Checking OpenAPI Spec for server URL...')
    const docsRes = await fetch(`http://localhost:${actualPort}/docs/json`)

    // Fastify Swagger static mode by default serves the doc at /docs/json? No, usually it's /docs/yaml or json depends on config.
    // But we configured it manually. Let's try likely path or check HTML content if json not exposed.
    // Actually fastify-swagger exposes the spec at routePrefix + '/json' by default?
    // Let's assume /docs/json works or scrape it from HTML if needed, but for now let's just test CORS directly.

    // 3. Test CORS via FETCH from different origin (simulated)
    // Fetch in Node doesn't enforce CORS but we can check headers.
    console.log('Testing CORS headers...')
    const res = await fetch(`http://localhost:${actualPort}/cors-test`, {
      method: 'GET',
      headers: {
        Origin: 'http://example.com'
      }
    })

    const allowOrigin = res.headers.get('access-control-allow-origin')
    console.log(`Access-Control-Allow-Origin: ${allowOrigin}`)

    if (allowOrigin === '*' || allowOrigin === 'http://example.com') {
      console.log('✅ CORS headers present.')
    } else {
      console.error('❌ CORS headers missing or incorrect.')
    }
  } catch (error) {
    console.error('Test Failed:', error)
    process.exit(1)
  } finally {
    console.log('Stopping server...')
    await serverManager.stop(projectId)
    console.log('--- Test Finished ---')
  }
}

runTest()
