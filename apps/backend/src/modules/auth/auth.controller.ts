import { Request, Response, NextFunction } from "express";
import * as authService from "@/modules/auth/auth.service";

const COOKIE_NAME = "refresh_token";

const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, firstName, lastName } = req.body as Record<
      string,
      string
    >;
    const user = await authService.registerUser(
      email,
      password,
      firstName,
      lastName,
    );
    res.status(201).json({
      success: true,
      data: {
        user,
        message: "Account created. Please verify your email to continue.",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as Record<string, string>;
    const { user, accessToken, refreshToken } = await authService.loginUser(
      email,
      password,
    );
    res.cookie(COOKIE_NAME, refreshToken, cookieConfig);
    res.json({ success: true, data: { user, accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies[COOKIE_NAME] as string | undefined;
    if (!token) {
      res
        .status(401)
        .json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "No refresh token" },
        });
      return;
    }
    const { accessToken, refreshToken } =
      await authService.refreshTokens(token);
    res.cookie(COOKIE_NAME, refreshToken, cookieConfig);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user) await authService.logoutUser(req.user.userId);
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.forgotPassword((req.body as { email: string }).email);
    res.json({
      success: true,
      data: {
        message: "If that email is registered, a reset link has been sent.",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, password } = req.body as { token: string; password: string };
    await authService.resetPassword(token, password);
    res.json({
      success: true,
      data: { message: "Password reset successful. Please log in." },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.verifyEmail(req.params.token as string);
    res.json({
      success: true,
      data: { message: "Email verified successfully." },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.getUserById(req.user!.userId);
    if (!user) {
      res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        });
      return;
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}
