import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { tenantConfig } from "@storefront/config";

export const configRouter: ExpressRouter = Router();


// Returns only what the frontend needs — never secrets
configRouter.get("/public", (_req, res) => {
  res.json({
    success: true,
    data: {
      identity: {
        shopName: tenantConfig.identity.shopName,
        tagline: tenantConfig.identity.tagline,
        logoPath: tenantConfig.identity.logoPath,
        phone: tenantConfig.identity.phone,
        email: tenantConfig.identity.email,
        address: tenantConfig.identity.address,
        mapLink: tenantConfig.identity.mapLink,
        businessHours: tenantConfig.identity.businessHours,
        currency: tenantConfig.identity.currency,
        currencySymbol: tenantConfig.identity.currencySymbol,
      },
      theme: tenantConfig.theme,
      navigation: tenantConfig.navigation,
      features: tenantConfig.features,
      social: tenantConfig.social,
      seo: tenantConfig.seo,
      businessType: tenantConfig.businessType,
      pages: tenantConfig.pages,
      ai: {
        enabled: tenantConfig.ai.enabled,
        assistantName: tenantConfig.ai.assistantName,
        greetingMessage: tenantConfig.ai.greetingMessage,
      },
    },
  });
});
