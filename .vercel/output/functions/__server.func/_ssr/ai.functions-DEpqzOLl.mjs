import { c as createServerRpc } from "./createServerRpc-wJmril6S.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-LQvPTbq-.mjs";
import { G as GoogleGenerativeAI } from "../_libs/google__generative-ai.mjs";
import { c as createServerFn } from "./server-BVeZWv3h.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, b as arrayType, s as stringType, e as enumType } from "../_libs/zod.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./createMiddleware-BvN2ghIY.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
const ChatInput = objectType({
  message: stringType().min(1).max(2e3),
  history: arrayType(objectType({
    role: enumType(["user", "assistant"]),
    content: stringType()
  })).max(20).default([])
});
const chatWithAssistant_createServerFn_handler = createServerRpc({
  id: "bcdee306dc21b5ba28a0566471f76de3fe258d06de3e9683a2fb5059df9316e0",
  name: "chatWithAssistant",
  filename: "src/lib/ai.functions.ts"
}, (opts) => chatWithAssistant.__executeServer(opts));
const chatWithAssistant = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => ChatInput.parse(d)).handler(chatWithAssistant_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roleRows
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (roleRows ?? []).map((r) => r.role);
  const role = roles.includes("admin") ? "admin" : roles.includes("engineer") ? "engineer" : "client";
  let dbContext = "";
  if (role === "client") {
    const {
      data: projects
    } = await supabase.from("projects").select("id,title,service,status,location,scheduled_date,created_at").eq("client_id", userId).order("created_at", {
      ascending: false
    }).limit(25);
    const ids = (projects ?? []).map((p) => p.id);
    const {
      data: quotes
    } = ids.length ? await supabase.from("quotations").select("id,project_id,subtotal,vat_amount,grand_total,status").in("project_id", ids) : {
      data: []
    };
    dbContext = `Client's projects:
${JSON.stringify(projects ?? [])}
Quotations:
${JSON.stringify(quotes ?? [])}`;
  } else if (role === "engineer") {
    const {
      data: projects
    } = await supabase.from("projects").select("id,title,service,status,location,scheduled_date,engineer_id,created_at").order("created_at", {
      ascending: false
    }).limit(40);
    const {
      data: quotes
    } = await supabase.from("quotations").select("id,project_id,grand_total,status").order("created_at", {
      ascending: false
    }).limit(40);
    const {
      data: insp
    } = await supabase.from("inspections").select("id,project_id,stage,flagged,remarks,created_at").order("created_at", {
      ascending: false
    }).limit(25);
    dbContext = `Projects:
${JSON.stringify(projects ?? [])}
Quotations:
${JSON.stringify(quotes ?? [])}
Inspections:
${JSON.stringify(insp ?? [])}`;
  } else {
    const {
      data: projects
    } = await supabase.from("projects").select("id,title,service,status,location,scheduled_date,engineer_id,client_id,created_at").order("created_at", {
      ascending: false
    }).limit(80);
    const {
      data: quotes
    } = await supabase.from("quotations").select("id,project_id,subtotal,vat_amount,grand_total,labour,status").limit(80);
    const {
      data: items
    } = await supabase.from("quotation_items").select("quotation_id,description,amount,actual_cost").limit(300);
    dbContext = `All projects:
${JSON.stringify(projects ?? [])}
Quotations:
${JSON.stringify(quotes ?? [])}
Line items (for quoted vs actual analysis):
${JSON.stringify(items ?? [])}`;
  }
  const system = `You are FusionPro AI, the assistant for RealArc Estates property operations.
Role of the user: ${role}.
RULES (strict):
- Answer ONLY based on the SYSTEM DATA below.
- If the answer is not in the data, reply: "I don't see that in the system records yet."
- Never invent project names, IDs, dates, statuses, or amounts.
- Use Kenyan Shilling (KES) for currency. Be concise.

=== SYSTEM DATA ===
${dbContext}
=== END DATA ===`;
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("AI is not configured. Please set GOOGLE_GEMINI_API_KEY environment variable.");
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const messages = [{
      role: "system",
      content: system
    }, ...data.history, {
      role: "user",
      content: data.message
    }];
    const geminiMessages = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{
        text: m.content
      }]
    }));
    if (geminiMessages.length > 0 && geminiMessages[0].role === "user") {
      geminiMessages[0].parts[0].text = system + "\n\n" + geminiMessages[0].parts[0].text;
    }
    const candidates = ["models/gemini-3.5-flash", "models/gemini-3.1-flash-lite", "models/gemini-2.5-flash", "models/gemini-2.0-flash"];
    let lastError = null;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (const candidate of candidates) {
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        try {
          const model = genAI.getGenerativeModel({
            model: candidate
          });
          const chat = model.startChat({
            history: geminiMessages.slice(0, -1)
          });
          const result = await chat.sendMessage(geminiMessages[geminiMessages.length - 1]?.parts[0]?.text || data.message);
          const reply = result.response.text();
          return {
            reply,
            role
          };
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("503") || msg.toLowerCase().includes("high demand") || msg.toLowerCase().includes("service unavailable")) {
            attempt++;
            if (attempt < maxAttempts) {
              const backoff = 1e3 * Math.pow(2, attempt - 1);
              await sleep(backoff);
              continue;
            }
            break;
          }
          if (msg.includes("not found") || msg.includes("404") || msg.includes("is not found")) {
            break;
          }
          throw err;
        }
      }
    }
    const le = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`AI model not available or busy. Tried models: ${candidates.join(", ")}. Last error: ${le}`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("429")) throw new Error("AI rate limit reached. Try again in a moment.");
      if (error.message.includes("402")) throw new Error("AI usage limit reached. Please add credits.");
      throw new Error(`AI error: ${error.message}`);
    }
    throw new Error("Failed to get AI response");
  }
});
export {
  chatWithAssistant_createServerFn_handler
};
