import dotenv from "dotenv";
dotenv.config();

import { createApp } from "@/app.js";

const PORT = process.env.PORT ?? 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Storefront API running on http://localhost:${PORT}/api/v1`);
  console.log(`📋 Environment: ${process.env.NODE_ENV ?? "development"}`);
});
