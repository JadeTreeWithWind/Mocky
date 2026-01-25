import { toOpenApi, fromOpenApi } from './src/renderer/src/utils/transformer'
import { Project, Route, PROJECT_STATUS } from './src/shared/types'
import { v4 as uuidv4 } from 'uuid'

console.log('--- Starting Transformer Test ---')

// 1. Create Dummy Data
const mockProject: Project = {
  id: uuidv4(),
  name: 'Test Project',
  description: 'A test project for verification',
  port: 8080,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: PROJECT_STATUS.STOPPED
}

const mockRoutes: Route[] = [
  {
    id: uuidv4(),
    projectId: mockProject.id,
    method: 'GET',
    path: '/users',
    description: 'Get all users',
    isActive: true,
    response: {
      statusCode: 200,
      body: JSON.stringify([{ id: 1, name: 'John' }]),
      delay: 0
    }
  },
  {
    id: uuidv4(),
    projectId: mockProject.id,
    method: 'POST',
    path: '/users',
    description: 'Create user',
    isActive: true,
    response: {
      statusCode: 201,
      body: JSON.stringify({ id: 2, name: 'Jane' }),
      delay: 0
    }
  }
]

// 2. Test toOpenApi
console.log('Testing toOpenApi...')
const openApiDoc = toOpenApi(mockProject, mockRoutes)
console.log('OpenAPI Info Title:', openApiDoc.info.title)
if (openApiDoc.info.title !== mockProject.name) console.error('FAIL: Title mismatch')
if (!openApiDoc.paths['/users']) console.error('FAIL: Path /users missing')
if (!openApiDoc.paths['/users']?.get) console.error('FAIL: GET /users missing')
if (!openApiDoc.paths['/users']?.post) console.error('FAIL: POST /users missing')

console.log('OpenAPI Document generated successfully.')
// console.log(JSON.stringify(openApiDoc, null, 2));

// 3. Test fromOpenApi
console.log('Testing fromOpenApi...')
const { project: importedProject, routes: importedRoutes } = fromOpenApi(openApiDoc)

console.log('Imported Project Name:', importedProject.name)
if (importedProject.name !== mockProject.name) console.error('FAIL: Imported name mismatch')

console.log('Imported Routes Count:', importedRoutes.length)
if (importedRoutes.length !== 2) console.error('FAIL: Route count mismatch')

const getRoute = importedRoutes.find((r) => r.path === '/users' && r.method === 'GET')
if (!getRoute) console.error('FAIL: Imported GET /users route missing')
if (getRoute && getRoute.response?.statusCode !== 200) console.error('FAIL: Status code mismatch')

console.log('--- Test Finished ---')
