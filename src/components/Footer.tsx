"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { store } from "@/lib/data";
import { BrandMark } from "./BrandMark";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: "0.8rem" }}>
            <BrandMark />
            <span className="brand-text">
              <strong style={{ color: "white" }}>medixuniformes</strong>
              <small style={{ color: "rgba(255,255,255,0.65)" }}>
                Uniformes profesionales
              </small>
            </span>
          </div>
          <p>
            Uniformes médicos diseñados para acompañarte en cada jornada.
            Envíos a toda Colombia desde {store.city}.
          </p>
        </div>
        <div>
          <h4>Navegación</h4>
          <ul>
            <li>
              <Link href="/uniformes">Uniformes</Link>
            </li>
            <li>
              <Link href="/nosotros">Quiénes somos</Link>
            </li>
            <li>
              <Link href="/contacto">Contacto</Link>
            </li>
            <li>
              <Link href="/admin">Panel administrador</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul>
            <li>WhatsApp: {store.phone}</li>
            <li>{store.city}, {store.country}</li>
            <li>Horario: L-D 7:00 - 21:00</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} medixuniformes</span>
        <span>Pago con tarjeta o contraentrega</span>
      </div>
    </footer>
  );
}
