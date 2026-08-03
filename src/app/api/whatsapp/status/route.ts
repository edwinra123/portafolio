import { NextResponse } from "next/server";
import {
  getSiteUrl,
  getWhatsAppVerifyToken,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";

export async function GET() {
  return NextResponse.json({
    configured: isWhatsAppConfigured(),
    verifyTokenConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN?.trim()),
    appSecretConfigured: Boolean(process.env.WHATSAPP_APP_SECRET?.trim()),
    siteUrl: getSiteUrl(),
    webhookPath: "/api/whatsapp/webhook",
    // Expose default only when using the built-in fallback, so setup is easy in dev.
    verifyTokenHint: process.env.WHATSAPP_VERIFY_TOKEN?.trim()
      ? "(definido en WHATSAPP_VERIFY_TOKEN)"
      : getWhatsAppVerifyToken(),
  });
}
