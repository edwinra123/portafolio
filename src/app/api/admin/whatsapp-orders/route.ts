import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import type { WhatsAppOrderStatus } from "@/lib/types";
import {
  countOpenWhatsAppOrders,
  readWhatsAppOrders,
  updateWhatsAppOrderStatus,
} from "@/lib/whatsappOrders";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await readWhatsAppOrders();
  return NextResponse.json({
    orders,
    openCount: countOpenWhatsAppOrders(orders),
    totalCount: orders.length,
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    status?: WhatsAppOrderStatus;
  } | null;

  if (!body?.id || !body.status) {
    return NextResponse.json(
      { error: "Envía id y status." },
      { status: 400 }
    );
  }

  const allowed: WhatsAppOrderStatus[] = [
    "nuevo",
    "preparar",
    "enviado",
    "cancelado",
  ];
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const updated = await updateWhatsAppOrderStatus(body.id, body.status);
  if (!updated) {
    return NextResponse.json(
      { error: "Pedido no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ order: updated });
}
