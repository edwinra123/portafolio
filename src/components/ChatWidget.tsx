"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  getChatReply,
  getWelcomeReply,
  type ChatLink,
  type ChatReply,
  type ChatRole,
} from "@/lib/chatbot";
import { store } from "@/lib/data";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  links?: ChatLink[];
  suggestions?: string[];
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toBotMessage(reply: ChatReply): ChatMessage {
  return {
    id: createId(),
    role: "bot",
    text: reply.text,
    links: reply.links,
    suggestions: reply.suggestions,
  };
}

export function ChatWidget() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    toBotMessage(getWelcomeReply()),
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    inputRef.current?.focus();
  }, [open, messages, pending]);

  function pushUserAndReply(text: string) {
    const clean = text.trim();
    if (!clean || pending) return;

    setMessages((prev) => [
      ...prev,
      { id: createId(), role: "user", text: clean },
    ]);
    setInput("");
    setPending(true);

    window.setTimeout(() => {
      setMessages((prev) => [...prev, toBotMessage(getChatReply(clean))]);
      setPending(false);
    }, 280);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    pushUserAndReply(input);
  }

  const lastBot = [...messages].reverse().find((m) => m.role === "bot");

  return (
    <div className="chatbot" data-open={open ? "true" : "false"}>
      <div
        className="chatbot-panel"
        id={panelId}
        role="dialog"
        aria-modal="false"
        aria-label={`Asistente de ${store.displayName}`}
        hidden={!open}
      >
        <header className="chatbot-header">
          <div className="chatbot-brand">
            <img src={store.logo} alt="" width={40} height={40} />
            <div>
              <strong>{store.displayName}</strong>
              <span>Asistente de la tienda · en línea</span>
            </div>
          </div>
          <button
            type="button"
            className="chatbot-icon-btn"
            aria-label="Cerrar chat"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </header>

        <div className="chatbot-messages" ref={listRef} aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chatbot-bubble chatbot-bubble-${message.role}`}
            >
              <p>{message.text}</p>
              {message.links && message.links.length > 0 ? (
                <div className="chatbot-links">
                  {message.links.map((link) =>
                    link.external ? (
                      <a
                        key={`${message.id}-${link.href}-${link.label}`}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={`${message.id}-${link.href}-${link.label}`}
                        href={link.href}
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              ) : null}
            </article>
          ))}
          {pending ? (
            <article className="chatbot-bubble chatbot-bubble-bot is-typing">
              <span />
              <span />
              <span />
            </article>
          ) : null}
        </div>

        {lastBot?.suggestions && lastBot.suggestions.length > 0 && !pending ? (
          <div className="chatbot-suggestions" aria-label="Sugerencias">
            {lastBot.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => pushUserAndReply(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form className="chatbot-form" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="medix-chat-input">
            Escribe tu mensaje
          </label>
          <input
            id="medix-chat-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ej: uniforme azul, envíos, tallas…"
            autoComplete="off"
            disabled={pending}
          />
          <button type="submit" className="btn btn-primary" disabled={pending || !input.trim()}>
            Enviar
          </button>
        </form>
      </div>

      <button
        type="button"
        className="chatbot-launcher"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="chatbot-launcher-pulse" aria-hidden="true" />
        {open ? "Cerrar chat" : "¿Necesitas ayuda?"}
      </button>
    </div>
  );
}
