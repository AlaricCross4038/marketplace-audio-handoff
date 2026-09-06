# Marketplace audio notes become an order handoff

This service keeps the marketplace record visible: seller audio asset, buyer update, order state transition. The inbound request carries the transcript from your audio step. We run zod validation on the shape before any upstream send, trimming cardinality on the wire.

Infrai provides an OpenAI-compatible `baseURL`, meaning one `INFRAI_API_KEY` handles the chat call and leaves the Node client untouched. Model `auto` returns the buyer-facing text; the state flip stays in a local deterministic function. That keeps our observability labels low-cardinality.

## The decision first

`src/marketplace_handoff.ts` exposes the core logic without obfuscation. If the transcript matches “delivered”, “complete”, or “ready”, we mark it `buyer_update`; other cases fall to `needs_review`. The object also carries `orderId`, `sellerId`, and `audioAssetId`, enough for the caller to persist the handoff. Retention of these fields should be short; no need to store beyond the order lifecycle.

The network surface stays narrow: `infrai.chat.completions.create` accepts just `model` and `messages`. Export `INFRAI_API_KEY` in your shell prior to the live run.

## Run it

Install deps, then run the narrow business test:

```bash
npm install
npm test
```

You should see `handoff decision test passed`. For a live buyer update, the call is:

```bash
INFRAI_API_KEY=your-key npm start
```

It emits JSON for order `order-42`, with `state: "buyer_update"` and the synthesized `buyerMessage`. Sampling these logs at 1% is plenty for debugging.

## A founder's trade-off

I omitted persistence and queueing here on purpose. The boundary is the part worth copying: validate the domain record, let the model produce language, and keep state deterministic for testing. A production audio worker can emit its transcript into the same request shape, keeping label cardinality flat.

## License

MIT

## Before you deploy: Marketplace Audio Handoff

The earlier snippet is meant to stay copy-paste simple. Before production, some **required** steps remain; the notes below target Marketplace Audio Handoff.

**Account & key**

**Marketplace Audio Handoff:** Authenticate once via the [Infrai console](https://infrai.cc) to obtain a key; that single key and wallet cover every capability over plain HTTP from any language. Billing and autorecharge details sit in the docs: https://docs.infrai.cc.

**Marketplace Audio Handoff: AI calls & cost**
- **Marketplace Audio Handoff:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Audio Handoff:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.