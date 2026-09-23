// Shaoor.org — AWS Lambda Handler
// Wraps the Express app for API Gateway integration.

import { createServer, proxy } from "aws-serverless-express";
import { app } from "./app";

const server = createServer(app);

export const handler = (event: any, context: any) => {
  // Keep Lambda warm by not waiting for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  return proxy(server, event, context, "PROMISE").promise;
};
