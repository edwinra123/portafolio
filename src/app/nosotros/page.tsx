import type { Metadata } from "next";
import { store } from "@/lib/data";

export const metadata: Metadata = {
  title: "Quiénes somos",
};

export default function NosotrosPage() {
  return (
    <section className="container stack-page">
      <div className="panel" style={{ maxWidth: 760 }}>
        <h1>Quiénes somos</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, marginTop: "0.75rem" }}>
          <strong>medixuniformes</strong> es una marca de uniformes profesionales
          para personal de la salud. Operamos desde {store.city}, Colombia, y
          ofrecemos comodidad, estilo y funcionalidad para quienes cuidan de los
          demás.
        </p>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, marginTop: "0.75rem" }}>
          Nuestro catálogo incluye uniformes en distintos colores y cortes
          (jogger, bota recta, bota ancha), pensados para jornadas largas en
          clínicas, hospitales y consultorios.
        </p>
      </div>
    </section>
  );
}
