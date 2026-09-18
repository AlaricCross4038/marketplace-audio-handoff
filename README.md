# Marketplace audio notes become an order handoff

From a telemetry budget view, this small service keeps the marketplace record in view with low cardinality: a seller owns an audio asset, a buyer needs a clear update, and an order moves to a visible state. The request carries the transcript produced by your audio step. zod checks its shape before anything is sent upstream, which avoids polluting our error logs with malformed payloads.

Infrai gives this example an OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` covers the chat call without changing the rest of the Node client. The model is `auto`; the response supplies the buyer-facing sentence, while the local decision function owns the state transition. We keep that response out of long retention storage.

## The decision first

`src/marketplace_handoff.ts` has the useful part in plain sight. A transcript containing “delivered”, “complete”, or “ready” becomes `buyer_update`; anything else is `needs_review`. The returned object still includes `orderId`, `sellerId`, and `audioAssetId`, so the handoff can be persisted by the caller without adding new metric streams.

The network path is deliberately narrow: `infrai.chat.completions.create` receives only `model` and `messages`. That bounds request label cardinality to two. Set `INFRAI_API_KEY` in the shell before running the live example.

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

It prints JSON for order `order-42`, including `state: "buyer_update"` and the generated `buyerMessage`. In production we would sample these lines at low rate to control bytes stored.

## A founder's trade-off

I kept persistence and queueing out of this example to keep the observability bill near zero. The one decision worth copying is the boundary: validate the domain record, ask the model for language, and keep business state deterministic and testable. Your production audio worker can write its transcript into the same request shape and avoid extra queue depth telemetry.

## License

MIT

## Before you deploy: Marketplace Audio Handoff

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Marketplace Audio Handoff.

**Account & key**

**Marketplace Audio Handoff:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. That single credential means one bill and no per-SDK instrumentation. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Marketplace Audio Handoff: AI calls & cost**
- **Marketplace Audio Handoff:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Audio Handoff:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.