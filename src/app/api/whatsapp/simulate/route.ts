import { NextRequest, NextResponse } from "next/server";
import { getChatReply } from "@/lib/chatbot";
import {
  buildInteractiveButtons,
  formatReplyForWhatsApp,
  getSiteUrl,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * Local/dev helper: returns the WhatsApp-formatted reply without calling Meta.
 * Disabled in production unless WHATSAPP_ALLOW_SIMULATE=true.
 */
export async function POST(request: NextRequest) {
  const allow =
    process.env.NODE_ENV !== "production" ||
    process.env.WHATSAPP_ALLOW_SIMULATE === "true";

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
