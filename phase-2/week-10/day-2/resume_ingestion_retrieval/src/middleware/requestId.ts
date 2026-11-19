import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Attaches a unique request ID to every incoming request so that every
 * phase and every error can be traced back to a single request.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = uuidv4();
  req.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
