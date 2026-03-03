declare module 'swagger-autogen' {
  function swaggerAutogen(
    options?: { openapi?: string }
  ): (
    outputFile: string,
    routes: string[],
    doc?: Record<string, any>
  ) => Promise<any>;

  export default swaggerAutogen;
}
