import { toOpenApi } from './src/main/utils/openapi-generator'
import { Route } from './src/shared/types'

// Mock Data
const project = {
  name: 'Test Project',
  description: 'A test project',
  version: '1.0.0'
}

const routes: Route[] = [
  {
    id: '1',
    projectId: 'p1',
    method: 'GET',
    path: '/users/:id',
    description: 'Get User By ID',
    isActive: true,
    response: {
      statusCode: 200,
      body: JSON.stringify({ id: 123, name: 'Alice' }),
      delay: 0
    }
  },
  {
    id: '1b',
    projectId: 'p1',
    method: 'DELETE',
    path: '/users/:id',
    description: 'Delete User',
    isActive: true,
    response: {
      statusCode: 204,
      body: '',
      delay: 0
    }
  },
  {
    id: '2',
    projectId: 'p1',
    method: 'POST',
    path: '/users',
    description: 'Create User',
    isActive: true,
    response: {
      statusCode: 201,
      body: JSON.stringify({ success: true }),
      delay: 0
    }
  }
]

console.log('Generating OpenAPI Spec...')
const openApiSpec = toOpenApi(project, routes)

console.log(JSON.stringify(openApiSpec, null, 2))

// Validation Checks
let hasError = false

// Check 1: Dynamic Path Conversion
const pathKey = '/users/{id}'
if (!openApiSpec.paths[pathKey]) {
  console.error(`❌ Failed: Path ${pathKey} is missing!`)
  hasError = true
} else {
  console.log(`✅ Path conversion /users/:id -> ${pathKey} successful`)
}

// Check 2: Method GET
if (openApiSpec.paths[pathKey]?.get) {
  console.log(`✅ Method GET found for ${pathKey}`)
} else {
  console.error(`❌ Failed: Method GET is missing for ${pathKey}!`)
  hasError = true
}

// Check 3: Parameters
const getOp = openApiSpec.paths[pathKey]?.get
if (getOp?.parameters && getOp.parameters.length > 0) {
  // @ts-ignore: parameter might be a reference object
  const paramName = getOp.parameters[0].name
  if (paramName === 'id') {
    console.log(`✅ Path parameter 'id' extracted correctly`)
  } else {
    console.error(`❌ Failed: Expected param 'id', got '${paramName}'`)
    hasError = true
  }
} else {
  console.error(`❌ Failed: No parameters found for ${pathKey}`)
  hasError = true
}

// Check 4: Multiple methods on same path
if (openApiSpec.paths[pathKey]?.delete) {
  console.log(`✅ Method DELETE found for ${pathKey}`)
} else {
  console.log(`❌ Failed: Method DELETE missing for ${pathKey}`)
  hasError = true
}

if (hasError) {
  console.error('❌ Stage 1 Test Failed')
  process.exit(1)
} else {
  console.log('✅ Stage 1 Test Passed All Checks!')
}
