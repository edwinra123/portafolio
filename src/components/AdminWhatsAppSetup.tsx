"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type WhatsAppAdminInfo = {
  configured: boolean;
  standalone: boolean;
  tokenConfigured: boolean;
  phoneNumberIdConfigured: boolean;
  appSecretConfigured: boolean;
  verifyTokenConfigured: boolean;
  verifyToken: string;
  siteUrl: string;
  webhookUrl: string;
  envTemplate: string;
  ready: boolean;
};

type ValidateResult = {
  ok: boolean;
  error?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  message?: string;
};

type SimulateResult = {
  whatsappText?: string;
  reply?: { suggestions?: string[] };
  error?: string;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function AdminWhatsAppSetup() {
  const [info, setInfo] = useState<WhatsAppAdminInfo | null>(null);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(
    null
  );
  const [simulateMessage, setSimulateMessage] = useState("hola");
  const [simulateResult, setSimulateResult] = useState<SimulateResult | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/whatsapp");
    if (!res.ok) {
      setError("No se pudo cargar el estado de WhatsApp.");
      return;
    }
    setInfo(await res.json());
  }, []);

  useEffect(() => {
    load().catch(() => setError("Error al cargar WhatsApp."));
  }, [load]);

  const onCopy = async (label: string, value: string) => {
    const ok = await copyText(value);
    setCopied(ok ? label : "");
    if (ok) window.setTimeout(() => setCopied(""), 1600);
  };

  const onValidate = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setValidateResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          phoneNumberId: phoneNumberId || undefined,
        }),
      });
      const data = (await res.json()) as ValidateResult;
      setValidateResult(data);
    } catch {
      setValidateResult({ ok: false, error: "Error de conexión." });
    } finally {
      setBusy(false);
    }
  };

  const onSimulate = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setSimulateResult(null);
    try {
      const res = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simulateMessage }),
      });
      const data = (await res.json()) as SimulateResult;
      setSimulateResult(data);
    } catch {
      setSimulateResult({ error: "No se pudo simular." });
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!info) {
    return <p className="product-meta">Cargando guía de WhatsApp...</p>;
  }

  return (
    <div className="whatsapp-setup">
      <div className="whatsapp-setup-head">
        <div>
          <h2>Conectar chatbot de WhatsApp</h2>
          <p>
            Modo <strong>solo WhatsApp</strong>: el cliente habla por WhatsApp,
            sin usar la página web. Solo necesitas Meta + una URL HTTPS para el
            webhook (<code>/api/whatsapp/webhook</code>).
          </p>
        </div>
        <span
          className={`status-pill ${info.configured ? "status-paid" : "status-cod_pending"}`}
        >
          {info.configured ? "Credenciales detectadas" : "Falta configurar .env"}
        </span>
      </div>

      <ol className="whatsapp-steps">
        <li>
          <strong>Crea la app en Meta</strong>
          <p>
            Entra a{" "}
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noreferrer"
            >
              developers.facebook.com/apps
            </a>
            , crea una app tipo Business y agrega el producto{" "}
            <strong>WhatsApp</strong>.
          </p>
        </li>
        <li>
          <strong>Copia Token y Phone number ID</strong>
          <p>
            En WhatsApp → API Setup copia el <em>Temporary access token</em> y el{" "}
            <em>Phone number ID</em>. Pégalos en variables de entorno del
            hosting (Vercel). Los clientes no usan la web: el bot responde solo
            en WhatsApp.
          </p>
          <pre className="whatsapp-code">{info.envTemplate}</pre>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onCopy("env", info.envTemplate)}
          >
            {copied === "env" ? "Copiado" : "Copiar plantilla .env"}
          </button>
        </li>
        <li>
          <strong>URL HTTPS solo para el webhook</strong>
          <p>
            Meta necesita una URL pública HTTPS para avisarte cuando llega un
            mensaje. No es la “tienda” para clientes: es solo el servidor del
            bot (Vercel o ngrok).
          </p>
          <p>
            URL actual: <code>{info.siteUrl}</code>
            {!info.siteUrl.startsWith("https://") ? (
              <span className="whatsapp-warn">
                {" "}
                · todavía no es HTTPS público
              </span>
            ) : null}
          </p>
        </li>
        <li>
          <strong>Configura el webhook en Meta</strong>
          <p>WhatsApp → Configuration → Webhook:</p>
          <div className="whatsapp-copy-row">
            <div>
              <span>Callback URL</span>
              <code>{info.webhookUrl}</code>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onCopy("webhook", info.webhookUrl)}
            >
              {copied === "webhook" ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="whatsapp-copy-row">
            <div>
              <span>Verify token</span>
              <code>{info.verifyToken}</code>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onCopy("verify", info.verifyToken)}
            >
              {copied === "verify" ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p>
            Luego en <strong>Manage</strong> suscribe el campo{" "}
            <code>messages</code>.
          </p>
        </li>
        <li>
          <strong>Prueba en WhatsApp</strong>
          <p>
            Escribe <em>hola</em> al número de prueba. El bot responde productos,
            tallas, envíos y puede pasar a <em>asesor</em> — todo dentro de
            WhatsApp.
          </p>
        </li>
      </ol>

      <div className="whatsapp-panels">
        <form className="whatsapp-panel form-grid" onSubmit={onValidate}>
          <h3>Validar con Meta</h3>
          <p className="product-meta">
            Si ya están en el servidor, déjalos vacíos y pulsa validar.
          </p>
          <label>
            Access token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={
                info.tokenConfigured ? "Usando WHATSAPP_TOKEN del servidor" : "EAAB..."
              }
            />
          </label>
          <label>
            Phone number ID
            <input
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder={
                info.phoneNumberIdConfigured
                  ? "Usando WHATSAPP_PHONE_NUMBER_ID del servidor"
                  : "106540352242922"
              }
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Validar credenciales
          </button>
          {validateResult ? (
            <div
              className={`alert ${validateResult.ok ? "alert-success" : "alert-error"}`}
            >
              {validateResult.ok ? (
                <>
                  {validateResult.message}
                  {validateResult.displayPhoneNumber ? (
                    <>
                      <br />
                      Número: {validateResult.displayPhoneNumber}
                      {validateResult.verifiedName
                        ? ` · ${validateResult.verifiedName}`
                        : ""}
                    </>
                  ) : null}
                </>
              ) : (
                validateResult.error
              )}
            </div>
          ) : null}
        </form>

        <form className="whatsapp-panel form-grid" onSubmit={onSimulate}>
          <h3>Simular respuesta del bot</h3>
          <p className="product-meta">
            Prueba local sin enviar nada a WhatsApp.
          </p>
          <label>
            Mensaje del cliente
            <input
              value={simulateMessage}
              onChange={(e) => setSimulateMessage(e.target.value)}
              placeholder="uniforme azul"
              required
            />
          </label>
          <button className="btn btn-accent" type="submit" disabled={busy}>
            Simular
          </button>
          {simulateResult?.whatsappText ? (
            <pre className="whatsapp-code">{simulateResult.whatsappText}</pre>
          ) : null}
          {simulateResult?.reply?.suggestions?.length ? (
            <p className="product-meta">
              Botones: {simulateResult.reply.suggestions.slice(0, 3).join(" · ")}
            </p>
          ) : null}
          {simulateResult?.error ? (
            <div className="alert alert-error">{simulateResult.error}</div>
          ) : null}
        </form>
      </div>

      <div className="whatsapp-checklist">
        <div data-done={info.tokenConfigured}>Token</div>
        <div data-done={info.phoneNumberIdConfigured}>Phone number ID</div>
        <div data-done={Boolean(info.verifyToken)}>Verify token</div>
        <div data-done={info.appSecretConfigured}>App Secret (opcional)</div>
        <div data-done={info.siteUrl.startsWith("https://")}>HTTPS público</div>
        <div data-done={info.ready}>Listo para producción</div>
      </div>
    </div>
  );
}
