import { Request, Response, NextFunction } from "express";
import { tenantConfig } from "@storefront/config";
import * as svc from "@/modules/ai/ai.service";

export async function chat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!tenantConfig.ai.enabled) {
      res.status(503).json({
        success: false,
        error: {
          code: "AI_DISABLED",
          message: "AI assistant is not enabled for this shop",
        },
      });
      return;
    }

    const { message, sessionId, history } = req.body as {
      message: string;
      sessionId: string;
      history: svc.ChatMessage[];
    };

    const data = await svc.chat(
      message,
      sessionId,
      history ?? [],
      req.user?.userId,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await svc.getSessionHistory(req.params.sessionId as string);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function generateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { productName, externalLink } = req.body as {
      productName: string;
      externalLink?: string;
    };

    const data = await svc.generateProductDescription(
      productName,
      externalLink,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
