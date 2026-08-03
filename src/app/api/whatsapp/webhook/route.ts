import { NextRequest, NextResponse } from "next/server";
import { getChatReply } from "@/lib/chatbot";
import {
  extractIncomingMessages,
  getWhatsAppConfig,
  getWhatsAppVerifyToken,
  isWhatsAppConfigured,
  markMessageSeen,
  sendChatReplyToWhatsApp,
  verifyMetaSignature,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const verifyToken = getWhatsAppVerifyToken();

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const config = getWhatsAppConfig();

  if (config?.appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyMetaSignature(rawBody, signature, config.appSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const incoming = extractIncomingMessages(
    payload as Parameters<typeof extractIncomingMessages>[0]
  );

  // Always acknowledge quickly so Meta does not retry aggressively.
  const tasks = incoming.map(async (message) => {
    if (!markMessageSeen(message.id)) return;

    const reply = getChatReply(message.text, "whatsapp");

    if (!config || !isWhatsAppConfigured()) {
      console.info("[whatsapp:dry-run]", {
        from: message.from,
        text: message.text,
        reply: reply.text,
      });
      return;
    }

    await sendChatReplyToWhatsApp(config, message.from, reply);
  });

  await Promise.allSettled(tasks);

  return NextResponse.json({ ok: true });
}
