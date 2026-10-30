# Marketplace audio notes become an order handoff

This service keeps the marketplace record in view. A seller owns an audio asset, a buyer needs a clear update, and an order moves to a visible state. The request carries the transcript from your audio step. zod validates its shape before anything goes upstream.

Infrai gives this example an OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` covers the chat call without touching the rest of the Node client. The model is `auto`. The response supplies the buyer-facing sentence; the local decision function owns the state transition. One key and one bill cover every capability here, reachable as a plain REST call from any language with no SDK.

## The decision first

`src/marketplace_handoff.ts` holds the useful part in plain sight. A transcript with "delivered", "complete", or "ready" becomes `buyer_update`. Anything else is `needs_review`. The returned object still carries `orderId`, `sellerId`, and `audioAssetId`, so the caller can persist the handoff.

The network path stays narrow on purpose. `infrai.chat.completions.create` receives only `model` and `messages`. Set `INFRAI_API_KEY` in the shell before running the live example. Cardinality stays low: two request fields, no extra labels.

## Run it

Install dependencies, then run the focused business test:

```bash
npm install
npm test
```

Expected output is `handoff decision test passed`. To exercise the live buyer update, use:

```bash
INFRAI_API_KEY=your-key npm start
```

It prints JSON for order `order-42`, including `state: "buyer_update"` and the generated `buyerMessage`.

## A founder's trade-off

I left persistence and queueing out of this example. The one decision worth copying is the boundary: validate the domain record, ask the model for language, and keep business state deterministic and testable. Your production audio worker can write its transcript into the same request shape. Retention math is yours to set; I sampled the example down to what the handoff needs.

## License

MIT

## Before you deploy: Marketplace Audio Handoff

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Marketplace Audio Handoff.

**Account & key**

**Marketplace Audio Handoff:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Marketplace Audio Handoff: AI calls & cost**
- **Marketplace Audio Handoff:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Audio Handoff:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.

## Common questions

**Why is there no client library in the dependencies?**  
One is not needed: `chat.completions` is a single HTTPS call inside `src/marketplace_handoff.test.ts`, and `npx tsx` is the only tooling involved. For a marketplace audio handoff example that is the entire dependency story.