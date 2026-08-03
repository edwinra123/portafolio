import { products, store } from "@/lib/data";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/lib/types";

export type ChatRole = "bot" | "user";

export type ChatLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type ChatReply = {
  text: string;
  links?: ChatLink[];
  suggestions?: string[];
};

const HOURS = "Lunes a domingo · 7:00 - 21:00";

const DEFAULT_SUGGESTIONS = [
  "Ver productos",
  "Tallas",
  "Envíos",
  "Formas de pago",
  "WhatsApp",
  "Horario",
];

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: string): string {
  return stripAccents(value).toLowerCase().trim().replace(/\s+/g, " ");
}

function whatsappLink(text: string): string {
  return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`;
}

function productLinks(items: Product[]): ChatLink[] {
  return items.slice(0, 4).map((product) => ({
    label: `${product.name} · ${formatCOP(product.price)}`,
    href: `/producto/${product.slug}`,
  }));
}

function findProducts(query: string): Product[] {
  const q = normalize(query);
  if (!q) return [];

  const colorHints = [
    "amarillo",
    "azul",
    "marino",
    "claro",
    "blanco",
    "beich",
    "beige",
    "elec",
    "rey",
    "jogger",
    "bota",
  ];

  const scored = products
    .map((product) => {
      const name = normalize(product.name);
      const slug = normalize(product.slug);
      let score = 0;

      if (name.includes(q) || slug.includes(q)) score += 5;
      for (const token of q.split(" ")) {
        if (token.length < 3) continue;
        if (name.includes(token) || slug.includes(token)) score += 2;
        if (colorHints.includes(token) && name.includes(token)) score += 2;
        if (token === "beige" && name.includes("beich")) score += 3;
      }
      if (product.stock > 0) score += 0.5;
      return { product, score };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score || b.product.stock - a.product.stock);

  return scored.map((item) => item.product);
}

function listCatalog(): ChatReply {
  const available = products.filter((p) => p.stock > 0);
  const names = available
    .slice(0, 6)
    .map((p) => `• ${p.name} (${formatCOP(p.price)})`)
    .join("\n");

  return {
    text: `Tenemos ${available.length} uniformes profesionales disponibles desde ${formatCOP(55000)}. Algunos destacados:\n${names}\n\nPuedes decir un color (azul, blanco, amarillo…) o abrir el catálogo completo.`,
    links: [
      { label: "Ver catálogo", href: "/uniformes" },
      ...productLinks(available),
    ],
    suggestions: ["Uniforme azul", "Uniforme blanco", "Tallas", "Envíos"],
  };
}

function shippingReply(): ChatReply {
  return {
    text: `Enviamos a todo ${store.country} desde ${store.city}.\n\n• Envío: ${formatCOP(store.shippingCost)}\n• Envío gratis desde ${formatCOP(store.shippingThreshold)}\n\nAl finalizar la compra te pedimos ciudad y dirección.`,
    links: [{ label: "Ir al carrito", href: "/carrito" }],
    suggestions: ["Formas de pago", "Ver productos", "WhatsApp"],
  };
}

function paymentReply(): ChatReply {
  return {
    text: "Puedes pagar de dos formas:\n\n• Tarjeta (pasarela demo en la tienda)\n• Contraentrega: pagas al recibir\n\nDespués del pedido puedes hacer seguimiento con el número de orden.",
    links: [{ label: "Ir al checkout", href: "/checkout" }],
    suggestions: ["Envíos", "WhatsApp", "Ver productos"],
  };
}

function sizesReply(): ChatReply {
  return {
    text: "Nuestros uniformes vienen en tallas XS, S, M, L, XL y XXL. Elige la talla al agregar al carrito.\n\nSi necesitas ayuda con la medida o un pedido mayorista, te paso a WhatsApp.",
    links: [
      {
        label: "Consultar talla por WhatsApp",
        href: whatsappLink("Hola medixuniformes, necesito ayuda con la talla de un uniforme."),
        external: true,
      },
      { label: "Ver uniformes", href: "/uniformes" },
    ],
    suggestions: ["Ver productos", "Envíos", "WhatsApp"],
  };
}

function contactReply(): ChatReply {
  return {
    text: `Estamos en ${store.city}, ${store.country}.\nWhatsApp/teléfono: ${store.phone}\nHorario: ${HOURS}\n\nTambién puedes escribirnos desde la página de contacto.`,
    links: [
      {
        label: "Abrir WhatsApp",
        href: whatsappLink("Hola medixuniformes, quiero información sobre uniformes."),
        external: true,
      },
      { label: "Página de contacto", href: "/contacto" },
    ],
    suggestions: ["Horario", "Envíos", "Ver productos"],
  };
}

function hoursReply(): ChatReply {
  return {
    text: `Atendemos ${HOURS}. Si nos escribes fuera de horario, responde el chat o WhatsApp y te contestamos en cuanto estemos disponibles.`,
    links: [
      {
        label: "Escribir por WhatsApp",
        href: whatsappLink("Hola medixuniformes, quiero información."),
        external: true,
      },
    ],
    suggestions: ["WhatsApp", "Ver productos", "Envíos"],
  };
}

function aboutReply(): ChatReply {
  return {
    text: `${store.displayName}: ${store.tagline}\n\nSomos una tienda de uniformes profesionales para el personal de la salud. Diseñamos comodidad para jornadas largas.`,
    links: [
      { label: "Conócenos", href: "/nosotros" },
      { label: "Ver uniformes", href: "/uniformes" },
    ],
    suggestions: ["Ver productos", "Envíos", "WhatsApp"],
  };
}

function helpReply(): ChatReply {
  return {
    text: "Puedo ayudarte con:\n• Catálogo y colores\n• Tallas\n• Envíos y costos\n• Formas de pago\n• Horario y WhatsApp\n\nEscribe tu duda o elige una opción rápida.",
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export function getWelcomeReply(): ChatReply {
  return {
    text: `¡Hola! Soy el asistente de ${store.displayName}. ¿Buscas un uniforme, tallas, envíos o prefieres hablar por WhatsApp?`,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export function getChatReply(input: string): ChatReply {
  const text = input.trim();
  const simple = normalize(text);

  if (!simple) {
    return {
      text: "Cuéntame qué necesitas: productos, tallas, envíos, pagos o WhatsApp.",
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  if (
    /\b(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|ola)\b/.test(
      simple
    )
  ) {
    return getWelcomeReply();
  }

  if (/\b(gracias|muchas gracias|perfecto|ok|vale)\b/.test(simple)) {
    return {
      text: "¡Con gusto! Si necesitas algo más, aquí estoy o te paso a WhatsApp.",
      links: [
        {
          label: "WhatsApp",
          href: whatsappLink("Hola medixuniformes, gracias. Tengo otra consulta."),
          external: true,
        },
      ],
      suggestions: ["Ver productos", "Envíos", "WhatsApp"],
    };
  }

  if (
    /\b(ayuda|que puedes|qué puedes|comandos|opciones|menu|menú)\b/.test(simple)
  ) {
    return helpReply();
  }

  if (
    /\b(whatsapp|wsp|wasap|hablar con|asesor|humano|persona)\b/.test(simple) ||
    /\b(contacto|telefono|teléfono|llamar)\b/.test(simple)
  ) {
    return contactReply();
  }

  if (/\b(horario|hora|abren|cierran|atencion|atención)\b/.test(simple)) {
    return hoursReply();
  }

  if (
    /\b(envio|envío|envios|envíos|domicilio|envio gratis|envío gratis|shipping)\b/.test(
      simple
    )
  ) {
    return shippingReply();
  }

  if (
    /\b(pago|pagos|tarjeta|contraentrega|cod|pasarela|como pago|cómo pago)\b/.test(
      simple
    )
  ) {
    return paymentReply();
  }

  if (/\b(talla|tallas|medida|medidas|size|xs|xxl)\b/.test(simple)) {
    return sizesReply();
  }

  if (
    /\b(quien eres|quién eres|que eres|qué eres|medix|nosotros|historia)\b/.test(
      simple
    )
  ) {
    return aboutReply();
  }

  if (
    /\b(precio|precios|cuanto|cuánto|vale|costo|cuesta)\b/.test(simple) &&
    !/\b(envio|envío)\b/.test(simple)
  ) {
    return {
      text: `La mayoría de uniformes están en ${formatCOP(55000)}. El envío cuesta ${formatCOP(store.shippingCost)} y es gratis desde ${formatCOP(store.shippingThreshold)}.`,
      links: [{ label: "Ver precios en catálogo", href: "/uniformes" }],
      suggestions: ["Ver productos", "Envíos", "Formas de pago"],
    };
  }

  if (
    /\b(producto|productos|catalogo|catálogo|uniforme|uniformes|ver productos|tienda)\b/.test(
      simple
    )
  ) {
    const matched = findProducts(simple);
    if (matched.length > 0 && !/^(ver )?productos?$|^catalogo$|^catálogo$|^uniformes?$/.test(simple)) {
      const list = matched
        .slice(0, 4)
        .map((p) => `• ${p.name} — ${formatCOP(p.price)}${p.stock > 0 ? "" : " (agotado)"}`)
        .join("\n");
      return {
        text: `Encontré estas opciones:\n${list}\n\nToca un enlace para ver detalle y elegir talla.`,
        links: [
          ...productLinks(matched),
          { label: "Ver catálogo completo", href: "/uniformes" },
        ],
        suggestions: ["Tallas", "Envíos", "WhatsApp"],
      };
    }
    return listCatalog();
  }

  const matched = findProducts(simple);
  if (matched.length > 0) {
    const list = matched
      .slice(0, 4)
      .map((p) => `• ${p.name} — ${formatCOP(p.price)}${p.stock > 0 ? "" : " (agotado)"}`)
      .join("\n");
    return {
      text: `Esto encontré relacionado con tu búsqueda:\n${list}`,
      links: [
        ...productLinks(matched),
        { label: "Ver catálogo", href: "/uniformes" },
      ],
      suggestions: ["Tallas", "Envíos", "WhatsApp"],
    };
  }

  return {
    text: "No estoy seguro de haber entendido. Puedo ayudarte con productos, tallas, envíos, pagos u horario. También te conecto con WhatsApp.",
    links: [
      { label: "Ver uniformes", href: "/uniformes" },
      {
        label: "Hablar por WhatsApp",
        href: whatsappLink(`Hola medixuniformes, necesito ayuda con: ${text}`),
        external: true,
      },
    ],
    suggestions: DEFAULT_SUGGESTIONS,
  };
}
