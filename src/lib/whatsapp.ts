import { createHmac, timingSafeEqual } from "crypto";
import type { ChatLink, ChatReply } from "@/lib/chatbot";

const GRAPH_API_VERSION = "v21.0";

export type WhatsAppConfig = {
  token: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret?: string;
  siteUrl: string;
};

export type IncomingWhatsAppMessage = {
  from: string;
  id: string;
  timestamp: string;
  text: string;
  contactName?: string;
};

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "medix-verify-token";
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  if (!token || !phoneNumberId) {
    return null;
  }

  return { token, phoneNumberId, verifyToken, appSecret, siteUrl };
}

export function getWhatsAppVerifyToken(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN?.trim() || "medix-verify-token";
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  try {
    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(received, "utf8");
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

function absoluteUrl(href: string, siteUrl: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  return `${siteUrl}${href.startsWith("/") ? href : `/${href}`}`;
}

export function formatReplyForWhatsApp(
  reply: ChatReply,
  siteUrl: string
): string {
  const links = (reply.links || [])
    .filter((link) => !isWhatsAppMeLink(link))
    .slice(0, 5)
    .map((link) => `• ${link.label}\n  ${absoluteUrl(link.href, siteUrl)}`)
    .join("\n");

  if (!links) return reply.text;
  return `${reply.text}\n\nEnlaces:\n${links}`;
}

function isWhatsAppMeLink(link: ChatLink): boolean {
  return link.href.includes("wa.me/") || Boolean(link.external && link.href.includes("whatsapp"));
}

function buttonId(label: string, index: number): string {
  const slug = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 180);
  return `btn_${index}_${slug || "opt"}`;
}

export function buildInteractiveButtons(
  bodyText: string,
  suggestions: string[] | undefined
) {
  const buttons = (suggestions || [])
    .filter(Boolean)
    .slice(0, 3)
    .map((title, index) => ({
      type: "reply" as const,
      reply: {
        id: buttonId(title, index),
        title: title.slice(0, 20),
      },
    }));

  if (buttons.length === 0) return null;

  return {
    messaging_product: "whatsapp",
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText.slice(0, 1024) },
      action: { buttons },
    },
  };
}

export async function sendWhatsAppText(
  config: WhatsAppConfig,
  to: string,
  body: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  return sendWhatsAppPayload(config, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { preview_url: true, body: body.slice(0, 4096) },
  });
}

export async function sendWhatsAppPayload(
  config: WhatsAppConfig,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function sendChatReplyToWhatsApp(
  config: WhatsAppConfig,
  to: string,
  reply: ChatReply
): Promise<void> {
  const body = formatReplyForWhatsApp(reply, config.siteUrl);
  const interactive = buildInteractiveButtons(body, reply.suggestions);

  if (interactive) {
    const result = await sendWhatsAppPayload(config, {
      ...interactive,
      to,
    });
    if (result.ok) return;

    // Fallback to plain text if interactive fails (e.g. policy limits).
    console.warn("WhatsApp interactive send failed, falling back to text", result);
  }

  const textResult = await sendWhatsAppText(config, to, body);
  if (!textResult.ok) {
    console.error("WhatsApp text send failed", textResult);
  }
}

type WhatsAppWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          interactive?: {
            type?: string;
            button_reply?: { id?: string; title?: string };
            list_reply?: { id?: string; title?: string };
          };
          button?: { text?: string; payload?: string };
        }>;
      };
    }>;
  }>;
};

export function extractIncomingMessages(
  payload: WhatsAppWebhookPayload
): IncomingWhatsAppMessage[] {
  if (payload.object !== "whatsapp_business_account") return [];

  const messages: IncomingWhatsAppMessage[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field && change.field !== "messages") continue;
      const value = change.value;
      if (!value?.messages?.length) continue;

      const contactName = value.contacts?.[0]?.profile?.name;

      for (const message of value.messages) {
        if (!message.from || !message.id) continue;

        let text = "";
        if (message.type === "text") {
          text = message.text?.body?.trim() || "";
        } else if (message.type === "interactive") {
          text =
            message.interactive?.button_reply?.title?.trim() ||
            message.interactive?.list_reply?.title?.trim() ||
            "";
        } else if (message.type === "button") {
          text = message.button?.text?.trim() || message.button?.payload?.trim() || "";
        } else {
          continue;
        }

        if (!text) continue;

        messages.push({
          from: message.from,
          id: message.id,
          timestamp: message.timestamp || String(Date.now()),
          text,
          contactName,
        });
      }
    }
  }

  return messages;
}

/** Simple in-memory dedupe for webhook retries within the same process. */
const seenMessageIds = new Set<string>();
const MAX_SEEN = 500;

export function markMessageSeen(id: string): boolean {
  if (seenMessageIds.has(id)) return false;
  seenMessageIds.add(id);
  if (seenMessageIds.size > MAX_SEEN) {
    const first = seenMessageIds.values().next().value;
    if (first) seenMessageIds.delete(first);
  }
  return true;
}
