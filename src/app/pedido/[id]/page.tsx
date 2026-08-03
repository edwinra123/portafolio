import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { formatCOP, formatDate, orderStatusLabel } from "@/lib/format";
import { store } from "@/lib/data";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const isCod = order.paymentMethod === "cod";
  const isPaid = order.status === "paid";
  const isFailed = order.status === "failed";

  return (
    <section className="container stack-page">
      <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>
          {isFailed
            ? "Pago no completado"
            : isPaid
              ? "¡Pago confirmado!"
              : isCod
                ? "Pedido contraentrega recibido"
                : "Pedido registrado"}
        </h1>
        <p className="product-meta" style={{ marginBottom: "1rem" }}>
          Pedido <strong>{order.id}</strong> · {formatDate(order.createdAt)}
        </p>

        <div
          className={`alert ${
            isFailed
              ? "alert-error"
              : isPaid
                ? "alert-success"
                : "alert-info"
          }`}
        >
          Estado: {orderStatusLabel(order.status)}
          {order.card &&
            ` · ${order.card.brand} **** ${order.card.last4} · Auth ${order.card.authCode}`}
        </div>

        <h2 style={{ color: "var(--navy)", margin: "1rem 0 0.5rem" }}>
          Resumen
        </h2>
        {order.items.map((item) => (
          <div className="summary-line" key={`${item.productId}-${item.size}`}>
            <span>
              {item.name} · {item.size} × {item.quantity}
            </span>
            <span>{formatCOP(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="summary-line">
          <span>Envío</span>
          <span>{order.shipping === 0 ? "Gratis" : formatCOP(order.shipping)}</span>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <span>{formatCOP(order.total)}</span>
        </div>

        <h2 style={{ color: "var(--navy)", margin: "1.25rem 0 0.5rem" }}>
          Envío a
        </h2>
        <p>
          {order.customer.name}
          <br />
          {order.customer.address}, {order.customer.city}
          <br />
          {order.customer.phone} · {order.customer.email}
        </p>

        {isCod && (
          <div className="alert alert-info" style={{ marginTop: "1rem" }}>
            Prepárate para pagar {formatCOP(order.total)} al recibir. Te
            contactaremos al WhatsApp {store.phone}.
          </div>
        )}

        <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          <Link href="/uniformes" className="btn btn-primary">
            Seguir comprando
          </Link>
          <a
            className="btn btn-secondary"
            href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(
              `Hola medixuniformes, mi pedido es ${order.id}`
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
