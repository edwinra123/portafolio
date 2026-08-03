import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readOrders } from "@/lib/orders";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const orders = await readOrders();
  return NextResponse.json({ orders });
}
