import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ComptaLink API',
      version: '1.0.0',
      description: 'API documentation for ComptaLink - Platform connecting enterprises and accounting firms',
      contact: {
        name: 'ComptaLink Support',
        email: 'support@comptalink.com',
      },
    },
    servers: [
      {
        url: env.apiUrl || 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
