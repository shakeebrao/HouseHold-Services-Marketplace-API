import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Household Services Management API',
    version: '1.0.0',
    description: 'API for managing household service jobs — posting, browsing, and tracking.',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  definitions: {
    Job: {
      id: 1,
      title: 'Fix kitchen plumbing',
      description: 'Kitchen sink is leaking and needs repair',
      budget: 150.00,
      status: 'OPEN',
      created_at: '2026-02-19T10:00:00.000Z',
    },
    JobInput: {
      $title: 'Fix kitchen plumbing',
      $description: 'Kitchen sink is leaking and needs repair',
      $budget: 150.00,
      $status: 'OPEN',
    },
  },
};

const outputFile = './swagger-output.json';
const routes = ['./index.ts'];

const generateSwagger = async () => {
  await swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc);
};

export default generateSwagger;
