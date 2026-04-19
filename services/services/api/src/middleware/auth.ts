import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; role: string; email: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    req.user = { id: payload.id, role: payload.role, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
