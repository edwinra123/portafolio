import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getChatReply } from "@/lib/chatbot";
import {
  buildInteractiveButtons,
  formatReplyForWhatsApp,
  getSiteUrl,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * Helper: returns the WhatsApp-formatted reply without calling Meta.
 * Allowed in development, with WHATSAPP_ALLOW_SIMULATE=true, or for admin sessions.
 */
export async function POST(request: NextRequest) {
  const allow =
    process.env.NODE_ENV !== "production" ||
    process.env.WHATSAPP_ALLOW_SIMULATE === "true" ||
    (await isAdminAuthenticated());

  if (!allow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    message?: string;
  } | null;

  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json(
      { error: "Envía { \"message\": \"hola\" }" },
      { status: 400 }
    );
  }

  const reply = getChatReply(message, "whatsapp");
  const siteUrl = getSiteUrl();
  const text = formatReplyForWhatsApp(reply, siteUrl);
  const interactive = buildInteractiveButtons(text, reply.suggestions);

  return NextResponse.json({
    configured: isWhatsAppConfigured(),
    input: message,
    reply,
    whatsappText: text,
    interactiveButtons: interactive?.interactive ?? null,
  });
}
