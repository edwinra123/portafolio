import type { Metadata } from "next";
import { store } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function ContactoPage() {
  const wa = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(
    "Hola medixuniformes, quiero información sobre uniformes."
  )}`;

  return (
    <section className="container stack-page">
      <div className="panel" style={{ maxWidth: 760 }}>
        <h1>Contacto</h1>
        <p style={{ color: "var(--muted)", margin: "0.75rem 0 1.25rem" }}>
          Escríbenos para pedidos especiales, tallas o mayoristas.
        </p>
        <div className="form-grid">
          <div>
            <strong style={{ color: "var(--navy)" }}>WhatsApp</strong>
            <p>{store.phone}</p>
          </div>
          <div>
            <strong style={{ color: "var(--navy)" }}>Ciudad</strong>
            <p>
              {store.city}, {store.country}
            </p>
          </div>
          <div>
            <strong style={{ color: "var(--navy)" }}>Horario</strong>
            <p>Lunes a domingo · 7:00 - 21:00</p>
          </div>
          <a className="btn btn-primary" href={wa} target="_blank" rel="noreferrer">
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
