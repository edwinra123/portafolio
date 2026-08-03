import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getSiteUrl,
  getWhatsAppVerifyToken,
  isWhatsAppConfigured,
  isWhatsAppStandalone,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const siteUrl = getSiteUrl();
  const verifyToken = getWhatsAppVerifyToken();
  const configured = isWhatsAppConfigured();
  const standalone = isWhatsAppStandalone();

  return NextResponse.json({
    configured,
    standalone,
    tokenConfigured: Boolean(process.env.WHATSAPP_TOKEN?.trim()),
    phoneNumberIdConfigured: Boolean(
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
    ),
    appSecretConfigured: Boolean(process.env.WHATSAPP_APP_SECRET?.trim()),
    verifyTokenConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN?.trim()),
    verifyToken,
    siteUrl,
    webhookUrl: `${siteUrl}/api/whatsapp/webhook`,
    storePhone: process.env.NEXT_PUBLIC_STORE_WHATSAPP || null,
    checklist: {
      metaApp: "Crea una app en developers.facebook.com y agrega WhatsApp",
      credentials:
        "Copia Temporary access token y Phone number ID en las variables de entorno",
      publicUrl:
        "Necesitas solo una URL HTTPS pública para el webhook (Vercel/ngrok). No hace falta la tienda web para los clientes.",
      webhook:
        "En Meta → WhatsApp → Configuration pega el Callback URL y Verify token",
      subscribe: "Suscribe el campo messages",
      test: "Envía hola al número de prueba / Business",
    },
    envTemplate: [
      "WHATSAPP_STANDALONE=true",
      `NEXT_PUBLIC_SITE_URL=${siteUrl}`,
      "WHATSAPP_TOKEN=pega_aqui_el_token",
      "WHATSAPP_PHONE_NUMBER_ID=pega_aqui_el_phone_number_id",
      `WHATSAPP_VERIFY_TOKEN=${verifyToken}`,
      "WHATSAPP_APP_SECRET=pega_aqui_el_app_secret",
    ].join("\n"),
    ready: configured && siteUrl.startsWith("https://"),
  });
}

/** One-shot credential check against Meta Graph API (does not persist secrets). */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    token?: string;
    phoneNumberId?: string;
  } | null;

  const token =
    body?.token?.trim() || process.env.WHATSAPP_TOKEN?.trim() || "";
  const phoneNumberId =
    body?.phoneNumberId?.trim() ||
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    "";

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta token o phone number ID. Pégalos en el formulario o en .env.",
      },
      { status: 400 }
    );
  }

  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
    phoneNumberId
  )}?fields=display_phone_number,verified_name,quality_rating`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await response.json()) as {
      display_phone_number?: string;
      verified_name?: string;
      quality_rating?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data.error?.message ||
            "Meta rechazó las credenciales. Revisa token y Phone number ID.",
          status: response.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      displayPhoneNumber: data.display_phone_number,
      verifiedName: data.verified_name,
      qualityRating: data.quality_rating,
      message:
        "Credenciales válidas. Si el webhook ya está verificado, escribe hola al número para probar el bot.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo contactar a la API de Meta desde este servidor.",
      },
      { status: 502 }
    );
  }
}
