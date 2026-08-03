"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatCOP } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shipping, total, clear } = useCart();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Cúcuta",
    notes: "",
  });

  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvc: "",
    holderName: "",
  });

  const canSubmit = useMemo(() => {
    return (
      items.length > 0 &&
      customer.name &&
      customer.email &&
      customer.phone &&
      customer.address &&
      customer.city
    );
  }, [items, customer]);

  if (items.length === 0) {
    return (
      <section className="container stack-page">
        <div className="empty-state panel">
          <h2>No hay productos para pagar</h2>
          <Link href="/uniformes" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Ver uniformes
          </Link>
        </div>
      </section>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer,
          paymentMethod: method,
          card: method === "card" ? card : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo procesar el pedido.");
        setLoading(false);
        return;
      }
      clear();
      router.push(`/pedido/${data.order.id}`);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <section className="container stack-page">
      <h1>Checkout</h1>
      <form className="checkout-layout" onSubmit={onSubmit}>
        <div className="panel form-grid">
          <h2 style={{ color: "var(--navy)" }}>Datos de envío</h2>
          <div className="form-row">
            <label>
              Nombre completo
              <input
                required
                value={customer.name}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, name: e.target.value }))
                }
              />
            </label>
            <label>
              Teléfono / WhatsApp
              <input
                required
                value={customer.phone}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, phone: e.target.value }))
                }
              />
            </label>
          </div>
          <label>
            Correo electrónico
            <input
              required
              type="email"
              value={customer.email}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, email: e.target.value }))
              }
            />
          </label>
          <label>
            Dirección
            <input
              required
              value={customer.address}
              onChange={(e) =>
                setCustomer((c) => ({ ...c, address: e.target.value }))
              }
            />
          </label>
          <div className="form-row">
            <label>
              Ciudad
              <input
                required
                value={customer.city}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, city: e.target.value }))
                }
              />
            </label>
            <label>
              Notas (opcional)
              <input
                value={customer.notes}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, notes: e.target.value }))
                }
              />
            </label>
          </div>

          <h2 style={{ color: "var(--navy)", marginTop: "0.5rem" }}>
            Método de pago
          </h2>
          <div className="pay-options">
            <label
              className="pay-option"
              data-active={method === "card"}
            >
              <input
                type="radio"
                name="pay"
                checked={method === "card"}
                onChange={() => setMethod("card")}
              />
              <span>
                <strong>Tarjeta débito / crédito</strong>
                <span>
                  Pago inmediato. El admin puede verificar el pedido como pagado.
                </span>
              </span>
            </label>
            <label
              className="pay-option"
              data-active={method === "cod"}
            >
              <input
                type="radio"
                name="pay"
                checked={method === "cod"}
                onChange={() => setMethod("cod")}
              />
              <span>
                <strong>Contraentrega</strong>
                <span>Pagas en efectivo al recibir el pedido.</span>
              </span>
            </label>
          </div>

          {method === "card" && (
            <div className="card-fields">
              <p className="product-meta">
                Pasarela demo: usa una tarjeta válida Luhn (ej. 4242 4242 4242
                4242). Termina en 0000 para simular rechazo.
              </p>
              <label>
                Nombre del titular
                <input
                  required={method === "card"}
                  value={card.holderName}
                  onChange={(e) =>
                    setCard((c) => ({ ...c, holderName: e.target.value }))
                  }
                />
              </label>
              <label>
                Número de tarjeta
                <input
                  required={method === "card"}
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={card.number}
                  onChange={(e) =>
                    setCard((c) => ({ ...c, number: e.target.value }))
                  }
                />
              </label>
              <div className="form-row">
                <label>
                  Vencimiento (MM/AA)
                  <input
                    required={method === "card"}
                    placeholder="12/28"
                    value={card.expiry}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, expiry: e.target.value }))
                    }
                  />
                </label>
                <label>
                  CVC
                  <input
                    required={method === "card"}
                    inputMode="numeric"
                    placeholder="123"
                    value={card.cvc}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, cvc: e.target.value }))
                    }
                  />
                </label>
              </div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
        </div>

        <aside className="panel">
          <h2 style={{ color: "var(--navy)", marginBottom: "0.75rem" }}>
            Tu pedido
          </h2>
          {items.map((item) => (
            <div className="summary-line" key={`${item.productId}-${item.size}`}>
              <span>
                {item.name} · {item.size} × {item.quantity}
              </span>
              <span>{formatCOP(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="summary-line">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="summary-line">
            <span>Envío</span>
            <span>{shipping === 0 ? "Gratis" : formatCOP(shipping)}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={!canSubmit || loading}
          >
            {loading
              ? "Procesando..."
              : method === "card"
                ? `Pagar ${formatCOP(total)}`
                : "Confirmar contraentrega"}
          </button>
        </aside>
      </form>
    </section>
  );
}
