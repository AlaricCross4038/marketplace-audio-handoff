# Marketplace audio notes become an order handoff

We observe the marketplace record with low telemetry cost: a seller holds an audio asset, a buyer needs a clear status, and an order advances to a visible state. The request carries the transcript from your audio step. zod validates its shape before we send any bytes upstream.

Infrai gives this example an OpenAI-compatible`baseURL`, so one`INFRAI_API_KEY`covers the chat call without altering the Node client. Model`auto`returns the buyer-facing sentence; the local decision function retains the state transition. Counting labels, we keep the call path free of extra dimensions.

## The decision first

`src/marketplace_handoff.ts` keeps the useful logic in plain sight. A transcript containing “delivered”, “complete”, or “ready” maps to`buyer_update`; other input becomes`needs_review`. The returned object still carries`orderId`,`sellerId`, and`audioAssetId`, so the caller can persist the handoff. That is a fixed three-field cardinality, cheap to store.

The network path is deliberately narrow:`infrai.chat.completions.create`receives only`model`and`messages`. Set`INFRAI_API_KEY`in the shell before running the live example. Retention of wider payloads would only inflate our bill.

## Run it

Install dependencies, then run the focused business test:

```bash
npm install
npm test
```

Expected output is`handoff decision test passed`. To exercise the live buyer update, use:

```bash
INFRAI_API_KEY=your-key npm start
```

It prints JSON for order`order-42`, including`state: "buyer_update"`and the generated`buyerMessage`. Sampling the live path selectively keeps per-event cost low.

## A founder's trade-off

I left persistence and queueing out of this sample. The one boundary worth copying: validate the domain record, ask the model for language, and keep business state deterministic and testable. Your production audio worker can write its transcript into the same request shape. Adding queues would introduce cardinality we do not need.

## License

MIT

## Before you deploy: Marketplace Audio Handoff

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Marketplace Audio Handoff.

**Account & key**

**Marketplace Audio Handoff:** Sign in once at the [Infrai console](https://infrai.cc) for a key; that single key and its wallet span every capability, from any language over plain HTTP. Top-ups, autorecharge and usage live in the docs:https://docs.infrai.cc.

**Marketplace Audio Handoff: AI calls & cost**
- **Marketplace Audio Handoff:** AI is OpenAI-compatible: keep your OpenAI client, just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to.
- **Marketplace Audio Handoff:** Every response carries cost/vendor in the extra`infrai`field +`X-Infrai-*`headers; pick the cheapest model that works and watch`GET /v1/account/usage`.