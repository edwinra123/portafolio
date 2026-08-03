"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCOP, formatDate } from "@/lib/format";
import type { WhatsAppOrder, WhatsAppOrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<WhatsAppOrderStatus, string> = {
  nuevo: "Nuevo",
  preparar: "Por preparar",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

export function AdminWhatsAppOrders() {
  const [orders, setOrders] = useState<WhatsAppOrder[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/whatsapp-orders");
    if (!res.ok) {
      setError("No se pudieron cargar los pedidos de WhatsApp.");
      return;
    }
    const data = await res.json();
    setOrders(data.orders || []);
    setOpenCount(data.openCount || 0);
    setError("");
  }, []);

  useEffect(() => {
    load()
      .catch(() => setError("Error al cargar pedidos WhatsApp."))
      .finally(() => setLoading(false));
  }, [load]);

  const updateStatus = async (id: string, status: WhatsAppOrderStatus) => {
    const res = await fetch("/api/admin/whatsapp-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "No se pudo actualizar");
      return;
    }
    await load();
  };

  if (loading) {
    return <p className="product-meta">Cargando pedidos de WhatsApp...</p>;
  }

  return (
    <div className="whatsapp-orders">
      <div className="whatsapp-setup-head">
        <div>
          <h2>Pedidos por WhatsApp</h2>
          <p>
            Aquí ves cuántos pedidos te llegan del bot. Los clientes escriben{" "}
            <strong>pedido</strong> en WhatsApp y el bot toma modelo, talla,
            cantidad y ciudad.
          </p>
        </div>
        <span className="status-pill status-paid">
          {openCount} por preparar
        </span>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="stats" style={{ marginBottom: "1rem" }}>
        <div className="stat" style={{ background: "var(--sky-soft)", color: "var(--navy)", border: "1px solid var(--line)" }}>
          <span>Abiertos</span>
          <strong>{openCount}</strong>
        </div>
        <div className="stat" style={{ background: "var(--sky-soft)", color: "var(--navy)", border: "1px solid var(--line)" }}>
          <span>Total WhatsApp</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="stat" style={{ background: "var(--sky-soft)", color: "var(--navy)", border: "1px solid var(--line)" }}>
          <span>Unidades abiertas</span>
          <strong>
            {orders
              .filter((o) => o.status === "nuevo" || o.status === "preparar")
              .reduce((sum, o) => sum + o.quantity, 0)}
          </strong>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => load()}>
          Actualizar
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h2>Aún no hay pedidos de WhatsApp</h2>
          <p>
            Cuando un cliente escriba <em>pedido</em> al bot y confirme, aparecerá
            aquí para que sepas cuántos tienes que hacer.
          </p>
        </div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Uniforme</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.id}</strong>
                  <div className="product-meta">{formatDate(order.createdAt)}</div>
                </td>
                <td>
                  <strong>{order.customerName}</strong>
                  <div className="product-meta">{order.customerPhone}</div>
                  <div className="product-meta">{order.city}</div>
                </td>
                <td>
                  <strong>{order.productName}</strong>
                  <div className="product-meta">
                    Talla {order.size} · x{order.quantity}
                  </div>
                </td>
                <td>
                  <strong>{formatCOP(order.total)}</strong>
                </td>
                <td>
                  <span className={`status-pill status-${order.status === "nuevo" ? "cod_pending" : order.status === "preparar" ? "paid" : order.status === "enviado" ? "delivered" : "cancelled"}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td>
                  <div className="order-actions">
                    {order.status === "nuevo" && (
                      <button
                        type="button"
                        className="btn btn-accent"
                        onClick={() => updateStatus(order.id, "preparar")}
                      >
                        Por preparar
                      </button>
                    )}
                    {(order.status === "nuevo" || order.status === "preparar") && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => updateStatus(order.id, "enviado")}
                      >
                        Enviado
                      </button>
                    )}
                    {order.status !== "cancelado" && order.status !== "enviado" && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => updateStatus(order.id, "cancelado")}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
