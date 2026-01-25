import { serverManager } from './src/main/server'
import { Route } from './src/shared/types'

// Mock Data
const projectId = 'test-project-1'
const port = 8888
const routes: Route[] = [
  {
    id: '1',
    projectId: projectId,
    method: 'GET',
    path: '/hello',
    description: 'Hello Endpoint',
    isActive: true,
    response: {
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello from Mocky' }),
      delay: 0
    }
  }
]

const projectInfo = {
  name: 'Test Project',
  description: 'Documentation Test'
}

async function runTest() {
  console.log('--- Starting Server Integration Test ---')

  try {
    // 1. Start Server
    console.log('Starting server...')
    const actualPort = await serverManager.start(projectId, port, routes, projectInfo)
    console.log(`Server started on port ${actualPort}`)

    if (actualPort !== port) {
      console.log(`Note: Port fell back to ${actualPort} (expected ${port})`)
    }

    // 2. Fetch /docs HTML
    console.log('Fetching /docs...')
    const response = await fetch(`http://localhost:${actualPort}/docs`)

    if (response.status === 200) {
      console.log('✅ /docs returned 200 OK')
      const text = await response.text()
      if (text.includes('<!DOCTYPE html>') || text.includes('swagger')) {
        console.log('✅ /docs contains HTML content')
      } else {
        console.error('❌ /docs content does not look like HTML')
      }
    } else {
      console.error(`❌ /docs returned status ${response.status}`)
    }

    // 3. Fetch OpenAPI Spec JSON (default path usually /docs/json or exposed via internal logic)
    // Fastify Swagger 'static' mode usually serves via the document object, but let's check if ui fetches something.
    // Actually fastify-swagger usually exposes /docs/json or /docs/yaml depending on config?
    // In 'static' mode, we provided the document directly.
    // fastify-swagger-ui usually renders it.

    // Let's try to hit the user endpoint too
    console.log('Fetching /hello...')
    const apiResponse = await fetch(`http://localhost:${actualPort}/hello`)
    const apiJson = await apiResponse.json()
    console.log('API Response:', apiJson)

    if (apiResponse.status === 200 && apiJson.message === 'Hello from Mocky') {
      console.log('✅ API endpoint works')
    } else {
      console.error('❌ API endpoint failed')
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
