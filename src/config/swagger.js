/**
 * OpenAPI / Swagger Configuration
 * Configures Swagger UI documentation for all Student endpoints.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Management RESTful Web Service',
      version: '1.0.0',
      description: 'Lab 3 - RESTful Web Services API implementation using Express.js (Controller-Service-Repository Architecture). Demonstrates full CRUD operations, input validation, structured JSON error handling, and OpenAPI interactive documentation.',
      contact: {
        name: 'Web Services & SOA Laboratory',
        email: 'student@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server'
      }
    ],
    components: {
      schemas: {
        Student: {
          type: 'object',
          required: ['name', 'email', 'course', 'semester'],
          properties: {
            id: {
              type: 'integer',
              example: 1,
              description: 'Unique identifier automatically assigned to the student'
            },
            name: {
              type: 'string',
              example: 'Aarav Patel',
              description: 'Full name of the student'
            },
            email: {
              type: 'string',
              example: 'aarav@example.com',
              description: 'Valid email address of the student'
            },
            course: {
              type: 'string',
              example: 'Computer Science',
              description: 'Academic program / course name'
            },
            semester: {
              type: 'integer',
              example: 5,
              description: 'Current academic semester (must be positive integer)'
            }
          }
        },
        StudentInput: {
          type: 'object',
          required: ['name', 'email', 'course', 'semester'],
          properties: {
            name: {
              type: 'string',
              example: 'Aarav Patel'
            },
            email: {
              type: 'string',
              example: 'aarav@example.com'
            },
            course: {
              type: 'string',
              example: 'Computer Science'
            },
            semester: {
              type: 'integer',
              example: 5
            }
          }
        },
        StudentUpdateInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Aarav Patel Updated'
            },
            email: {
              type: 'string',
              example: 'aarav.updated@example.com'
            },
            course: {
              type: 'string',
              example: 'Data Science'
            },
            semester: {
              type: 'integer',
              example: 6
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 400
            },
            error: {
              type: 'string',
              example: 'Bad Request'
            },
            message: {
              type: 'string',
              example: 'Validation failed for student creation payload'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'A valid email address is required' }
                }
              }
            }
          }
        }
      }
    },
    paths: {
      '/students': {
        get: {
          summary: 'List all students',
          description: 'Returns a full array of all student records from the in-memory store.',
          responses: {
            200: {
              description: 'List of students successfully retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Successfully retrieved all students' },
                      count: { type: 'integer', example: 3 },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Student' }
                      }
                    }
                  }
                }
              }
            },
            500: {
              description: 'Internal Server Error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new student',
          description: 'Validates and creates a new student resource in memory.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StudentInput' }
              }
            }
          },
          responses: {
            201: {
              description: 'Student created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer', example: 201 },
                      message: { type: 'string', example: 'Student created successfully' },
                      data: { $ref: '#/components/schemas/Student' }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Validation Error / Bad Request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/students/{id}': {
        get: {
          summary: 'Get student by ID',
          description: 'Retrieves a single student record matching the specified ID parameter.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique ID of the student',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            200: {
              description: 'Student found and returned',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Successfully retrieved student with ID 1' },
                      data: { $ref: '#/components/schemas/Student' }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Invalid ID supplied',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
              }
            },
            404: {
              description: 'Student not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
              }
            }
          }
        },
        put: {
          summary: 'Update student by ID',
          description: 'Updates attributes of an existing student record by ID.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique ID of the student to update',
              schema: { type: 'integer', example: 1 }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StudentUpdateInput' }
              }
            }
          },
          responses: {
            200: {
              description: 'Student updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Student with ID 1 updated successfully' },
                      data: { $ref: '#/components/schemas/Student' }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Bad Request / Validation error',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
              }
            },
            404: {
              description: 'Student ID not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
              }
            }
          }
        },
        patch: {
          summary: 'Partially update student by ID',
          description: 'Partially updates fields of an existing student record by ID.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique ID of the student',
              schema: { type: 'integer', example: 1 }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StudentUpdateInput' }
              }
            }
          },
          responses: {
            200: {
              description: 'Student updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Student with ID 1 updated successfully' },
                      data: { $ref: '#/components/schemas/Student' }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Bad Request / Validation error',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
              }
            },
            404: {
              description: 'Student ID not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
              }
            }
          }
        },
        delete: {
          summary: 'Delete student by ID',
          description: 'Removes the student record matching the specified ID from memory.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique ID of student to delete',
              schema: { type: 'integer', example: 1 }
            }
          ],
          responses: {
            200: {
              description: 'Student deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'integer', example: 200 },
                      message: { type: 'string', example: 'Student with ID 1 was successfully deleted' }
                    }
                  }
                }
              }
            },
            404: {
              description: 'Student ID not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = setupSwagger;
