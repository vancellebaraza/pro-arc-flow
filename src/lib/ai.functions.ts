import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ChatInput = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .default([]),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
    const role: "admin" | "engineer" | "client" = roles.includes("admin")
      ? "admin"
      : roles.includes("engineer")
        ? "engineer"
        : "client";

    let dbContext = "";
    if (role === "client") {
      const { data: projects } = await supabase
        .from("projects")
        .select("id,title,service,status,location,scheduled_date,created_at")
        .eq("client_id", userId)
        .order("created_at", { ascending: false })
        .limit(25);
      const ids = (projects ?? []).map((p: { id: string }) => p.id);
      const { data: quotes } = ids.length
        ? await supabase
            .from("quotations")
            .select("id,project_id,subtotal,vat_amount,grand_total,status")
            .in("project_id", ids)
        : { data: [] };
      dbContext = `Client's projects:\n${JSON.stringify(projects ?? [])}\nQuotations:\n${JSON.stringify(quotes ?? [])}`;
    } else if (role === "engineer") {
      const { data: projects } = await supabase
        .from("projects")
        .select("id,title,service,status,location,scheduled_date,engineer_id,created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      const { data: quotes } = await supabase
        .from("quotations")
        .select("id,project_id,grand_total,status")
        .order("created_at", { ascending: false })
        .limit(40);
      const { data: insp } = await supabase
        .from("inspections")
        .select("id,project_id,stage,flagged,remarks,created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      dbContext = `Projects:\n${JSON.stringify(projects ?? [])}\nQuotations:\n${JSON.stringify(quotes ?? [])}\nInspections:\n${JSON.stringify(insp ?? [])}`;
    } else {
      const { data: projects } = await supabase
        .from("projects")
        .select("id,title,service,status,location,scheduled_date,engineer_id,client_id,created_at")
        .order("created_at", { ascending: false })
        .limit(80);
      const { data: quotes } = await supabase
        .from("quotations")
        .select("id,project_id,subtotal,vat_amount,grand_total,labour,status")
        .limit(80);
      const { data: items } = await supabase
        .from("quotation_items")
        .select("quotation_id,description,amount,actual_cost")
        .limit(300);
      dbContext = `All projects:\n${JSON.stringify(projects ?? [])}\nQuotations:\n${JSON.stringify(quotes ?? [])}\nLine items (for quoted vs actual analysis):\n${JSON.stringify(items ?? [])}`;
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

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          ...data.history,
          { role: "user", content: data.message },
        ],
      }),
    });
    if (res.status === 429) throw new Error("AI rate limit reached. Try again in a moment.");
    if (res.status === 402) throw new Error("AI usage limit reached. Please add credits.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { reply: json.choices?.[0]?.message?.content ?? "", role };
  });
