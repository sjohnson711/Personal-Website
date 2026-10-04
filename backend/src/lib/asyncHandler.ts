import { Request, Response, NextFunction, RequestHandler } from "express";

// Express 4 does not automatically pass rejected async handlers to middleware.
export function asyncHandler(handler: (req: Request<any>, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next); };
}
