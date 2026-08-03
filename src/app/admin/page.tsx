"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminWhatsAppSetup } from "@/components/AdminWhatsAppSetup";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCOP, formatDate, orderStatusLabel } from "@/lib/format";

type Filter =
  | "all"
  | "paid"
  | "cod_pending"
  | "cod_confirmed"
  | "shipped"
  | "delivered"
  | "failed";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [checking, setChecking] = useState(true);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/admin/orders");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setOrders(data.orders || []);
    setAuthed(true);
  }, []);

  useEffect(() => {
    loadOrders()
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, [loadOrders]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid").length;
    const cod = orders.filter((o) => o.status === "cod_pending").length;
    const revenue = orders
      .filter((o) => ["paid", "cod_confirmed", "delivered"].includes(o.status))
      .reduce((s, o) => s + o.total, 0);
    return {
      total: orders.length,
      paid,
      cod,
      revenue,
    };
  }, [orders]);

  const visible = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }
      setPassword("");
      await loadOrders();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setOrders([]);
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "No se pudo actualizar");
      return;
    }
    await loadOrders();
  };

  if (checking) {
    return (
      <div className="admin-shell">
        <div className="container" style={{ color: "white" }}>
          Cargando panel...
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="admin-shell">
        <form className="admin-card admin-login form-grid" onSubmit={onLogin}>
          <div>
            <h1 style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>
              Panel admin
            </h1>
            <p className="product-meta">medixuniformes · verificación de pedidos</p>
          </div>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <p className="product-meta">
            Por defecto: <code>medixadmin2026</code> (configurable con ADMIN_PASSWORD)
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Pedidos medixuniformes</h1>
            <p style={{ color: "rgba(255,255,255,0.75)" }}>
              Verifica pagos con tarjeta y gestiona contraentregas
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>

        <div className="stats">
          <div className="stat">
            <span>Pedidos</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat">
            <span>Pagados tarjeta</span>
            <strong>{stats.paid}</strong>
          </div>
          <div className="stat">
            <span>Contraentrega pendiente</span>
            <strong>{stats.cod}</strong>
          </div>
          <div className="stat">
            <span>Ingresos confirmados</span>
            <strong>{formatCOP(stats.revenue)}</strong>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: "1.25rem" }}>
          <AdminWhatsAppSetup />
        </div>

        <div className="admin-card">
          <div className="filters">
            {(
              [
                ["all", "Todos"],
                ["paid", "Pagados tarjeta"],
                ["cod_pending", "Contraentrega"],
                ["cod_confirmed", "COD confirmada"],
                ["shipped", "Enviados"],
                ["delivered", "Entregados"],
                ["failed", "Fallidos"],
              ] as [Filter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="chip"
                data-active={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => loadOrders()}>
              Actualizar
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="empty-state">
              <h2>Sin pedidos en este filtro</h2>
              <p>Cuando los clientes compren, aparecerán aquí.</p>
            </div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.id}</strong>
                      <div className="product-meta">{formatDate(order.createdAt)}</div>
                      <div className="product-meta">
                        {order.items
                          .map((i) => `${i.name} (${i.size}) x${i.quantity}`)
                          .join(", ")}
                      </div>
                    </td>
                    <td>
                      <strong>{order.customer.name}</strong>
                      <div className="product-meta">{order.customer.phone}</div>
                      <div className="product-meta">
                        {order.customer.address}, {order.customer.city}
                      </div>
                    </td>
                    <td>
                      {order.paymentMethod === "card" ? "Tarjeta" : "Contraentrega"}
                      {order.card && (
                        <div className="product-meta">
                          {order.card.brand} **** {order.card.last4}
                          <br />
                          Auth {order.card.authCode}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{formatCOP(order.total)}</strong>
                    </td>
                    <td>
                      <span className={`status-pill status-${order.status}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <div className="order-actions">
                        {order.status === "paid" && (
                          <button
                            type="button"
                            className="btn btn-accent"
                            onClick={() => updateStatus(order.id, "shipped")}
                          >
                            Marcar enviado
                          </button>
                        )}
                        {order.status === "cod_pending" && (
                          <button
                            type="button"
                            className="btn btn-accent"
                            onClick={() => updateStatus(order.id, "cod_confirmed")}
                          >
                            Confirmar pago COD
                          </button>
                        )}
                        {(order.status === "cod_confirmed" ||
                          order.status === "shipped") && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => updateStatus(order.id, "delivered")}
                          >
                            Entregado
                          </button>
                        )}
                        {order.status === "cod_pending" && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => updateStatus(order.id, "shipped")}
                          >
                            Enviar
                          </button>
                        )}
                        {!["delivered", "cancelled"].includes(order.status) && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => updateStatus(order.id, "cancelled")}
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
      </div>
    </div>
  );
}
