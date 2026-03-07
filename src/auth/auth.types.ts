export type AuthRole = 'user' | 'admin';

export interface JwtPayload {
  userId?: number;
  email: string;
  role: AuthRole;
}
