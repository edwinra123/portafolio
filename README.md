# medixuniformes

Tienda online de uniformes profesionales basada en el catálogo Medix (Treinta), con:

- Catálogo de productos y carrito
- Checkout con **pago con tarjeta** (pasarela demo) y **contraentrega**
- Panel de administrador para verificar pedidos pagados y gestionar contraentregas

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Panel admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Contraseña por defecto: `medixadmin2026`  
Configura `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` con el archivo `.env.example`.

## Pagos

### Tarjeta (pasarela demo)

Valida número (Luhn), vencimiento y CVC. Guarda solo marca, últimos 4 dígitos y código de autorización.

- Ejemplo OK: `4242 4242 4242 4242`
- Ejemplo rechazo: cualquier tarjeta válida que termine en `0000`

En producción puedes conectar Wompi, Mercado Pago o PayU reemplazando `src/lib/payment.ts` y el endpoint `/api/checkout`.

### Contraentrega

Crea el pedido en estado `cod_pending`. El admin puede confirmar el pago al entregar.

## Admin

Desde el panel puedes:

- Ver pedidos pagados con tarjeta
- Filtrar por contraentrega / enviados / entregados
- Marcar enviado, confirmar COD, entregar o cancelar

Los pedidos se guardan en `data/orders.json` (se crea automáticamente).

## Chatbot de WhatsApp (modo standalone)

El bot está pensado para atender **solo por WhatsApp**. El cliente no necesita entrar a la página web: pregunta productos, tallas, envíos y puede pedir un *asesor*.

Meta sí exige una URL HTTPS pública para el webhook (el “cerebro” del bot). Eso no es la tienda para clientes; es solo el servidor API.

### 1. Variables de entorno

```bash
WHATSAPP_STANDALONE=true
NEXT_PUBLIC_SITE_URL=https://tu-servidor.vercel.app
WHATSAPP_TOKEN=EAAB...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_VERIFY_TOKEN=medix-verify-token
WHATSAPP_APP_SECRET=opcional_pero_recomendado
```

Guía interactiva: `http://localhost:3000/admin` → **Conectar chatbot de WhatsApp**

### 2. Webhook en Meta

1. App en [developers.facebook.com](https://developers.facebook.com/) + producto **WhatsApp**
2. Callback URL: `https://tu-servidor.vercel.app/api/whatsapp/webhook`
3. Verify token: el mismo de `WHATSAPP_VERIFY_TOKEN`
4. Suscribe `messages`
5. Escribe `hola` al número de prueba

### 3. Probar sin Meta (local)

```bash
curl -X POST http://localhost:3000/api/whatsapp/simulate \
  -H 'Content-Type: application/json' \
  -d '{"message":"uniforme azul"}'
```

### Comandos del bot

- `pedido` → toma orden (modelo, talla, cantidad, ciudad, nombre) y la guarda para el admin
- `hola` / `ayuda`
- `productos` / `uniforme azul`
- `tallas` · `envíos` · `formas de pago` · `horario`
- `asesor` (atención humana en el mismo chat)

En `/admin` ves **Pedidos por WhatsApp** con cuántos tienes abiertos / por preparar.

## Deploy

Compatible con Vercel u otro host Node:

```bash
npm run build
npm start
```

> En entornos serverless, considera mover el almacenamiento de pedidos a una base de datos (Postgres/Supabase) porque el filesystem puede ser efímero.
>
> El webhook de WhatsApp necesita una URL HTTPS pública (Vercel + Meta).
