export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_payment: "Pago pendiente",
    paid: "Pagado (tarjeta)",
    cod_pending: "Contraentrega pendiente",
    cod_confirmed: "Contraentrega confirmada",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    failed: "Pago fallido",
  };
  return map[status] ?? status;
}
