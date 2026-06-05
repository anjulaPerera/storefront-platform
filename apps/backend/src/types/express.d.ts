export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: "customer" | "admin" | "super_admin";
      };
    }
  }
}
