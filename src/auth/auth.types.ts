export type AuthRole = 'user' | 'admin';

export interface JwtPayload {
  userId?: number;
  email: string;
  role: AuthRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
