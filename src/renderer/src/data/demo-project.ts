export const DEMO_PROJECT = {
  openapi: '3.0.0',
  info: {
    title: 'Mocky Demo',
    description: 'This is a demo project',
    version: '1.0.0'
  },
  paths: {
    '/hello': {
      get: {
        tags: ['Demo'],
        summary: 'Get API',
        responses: {
          '200': {
            description: 'Mock response',
            content: {
              'application/json': {
                example: {
                  code: 0,
                  message: 'OK',
                  data: 'Hello Mocky'
                }
              }
            }
          }
        }
      }
    },
    '/member/{id}': {
      post: {
        tags: ['Demo'],
        summary: 'Post API',
        responses: {
          '200': {
            description: 'Mock response',
            content: {
              'application/json': {
                example: {
                  code: 0,
                  message: 'update success',
                  data: ''
                }
              }
            }
          }
        },
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ]
      }
    },
    '/point/{id}': {
      put: {
        tags: ['Demo'],
        summary: 'Put API',
        responses: {
          '200': {
            description: 'Mock response',
            content: {
              'application/json': {
                example: {
                  code: 0,
                  message: 'update success',
                  data: ''
                }
              }
            }
          }
        },
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ]
      }
    },
    '/article/{id}': {
      delete: {
        tags: ['Demo'],
        summary: 'Delete API',
        responses: {
          '200': {
            description: 'Mock response',
            content: {
              'application/json': {
                example: {
                  code: 0,
                  message: 'delete success',
                  data: ''
                }
              }
            }
          }
        },
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ]
      }
    }
  }
}
