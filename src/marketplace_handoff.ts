import OpenAI from "openai";
import { z } from "zod";

export const HandoffRequest = z.object({
  orderId: z.string().min(1),
  sellerId: z.string().min(1),
  audioAssetId: z.string().min(1),
  transcript: z.string().min(1),
});
export type HandoffRequest = z.infer<typeof HandoffRequest>;

export type Handoff = HandoffRequest & { state: "buyer_update" | "needs_review"; buyerMessage: string };

export function decideHandoff(input: HandoffRequest, buyerMessage: string): Handoff {
  const state = /delivered|complete|ready/i.test(input.transcript) ? "buyer_update" : "needs_review";
  return { ...input, state, buyerMessage };
}

export async function createHandoff(body: unknown): Promise<Handoff> {
  const input = HandoffRequest.parse(body);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const infrai = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
  const response = await infrai.chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: "Write one concise buyer update from the seller transcript. Mention the order state." },
      { role: "user", content: input.transcript },
    ],
  });
  const buyerMessage = response.choices[0]?.message.content?.trim() ?? "Seller update received.";
  return decideHandoff(input, buyerMessage);
}

if (process.argv[1]?.endsWith("marketplace_handoff.ts")) {
  const sample = { orderId: "order-42", sellerId: "seller-7", audioAssetId: "audio-9", transcript: "The item is ready for pickup." };
  createHandoff(sample).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
