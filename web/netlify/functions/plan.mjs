// POST /api/plan - the orchestrator (Theo) picks the expert panel for a question.
// Body: {question, history?: [{question, answer}]}
// Returns: {rationale, experts: [{agent, persona, title, task}]}
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  EFFORT, EXPERT_IDS, checkKey, checkPassword, describeApiError, getClient, httpError,
  modelFor, personaOf, systemPromptFor, titleOf,
} from "../lib/experts.mjs";

export const config = { path: "/api/plan" };

const MAX_PANEL = 6;

const PlanSchema = z.object({
  rationale: z.string(),
  experts: z.array(
    z.object({
      agent: z.enum(EXPERT_IDS),
      task: z.string(),
    }),
  ),
});

export default async (req) => {
  if (req.method !== "POST") return httpError(405, "Use POST");
  const denied = checkPassword(req) ?? checkKey();
  if (denied) return denied;

  let question;
  let history = [];
  try {
    const body = await req.json();
    question = body.question;
    if (typeof question !== "string" || !question.trim() || question.length > 30000) throw new Error("question is required");
    if (Array.isArray(body.history)) {
      history = body.history.slice(-6).filter((h) => typeof h?.question === "string" && typeof h?.answer === "string");
    }
  } catch (err) {
    return httpError(400, err.message);
  }

  const prompt =
    `PLANNING STEP.\n\nThe consultant asks:\n${question}\n\n` +
    `Choose the expert panel using the expert-routing skill. Start with the topic experts, then add the mandatory reviewers. ` +
    `Use 1-${MAX_PANEL} experts; use 1 when a single domain covers it. ` +
    `For each expert, write a specific, self-contained task: what they must answer and what to leave to others. ` +
    `"rationale" is one or two sentences for the consultant explaining who you picked and why. Return only the JSON.`;

  try {
    const response = await getClient().messages.parse({
      model: modelFor("orchestrator"),
      max_tokens: 8000,
      system: [{ type: "text", text: systemPromptFor("orchestrator"), cache_control: { type: "ephemeral" } }],
      messages: [
        ...history.flatMap((h) => [
          { role: "user", content: h.question.slice(0, 30000) },
          { role: "assistant", content: h.answer.slice(0, 30000) },
        ]),
        { role: "user", content: prompt },
      ],
      output_config: { effort: EFFORT.plan, format: zodOutputFormat(PlanSchema) },
    });
    if (response.stop_reason === "refusal") return httpError(422, "The orchestrator declined this request.");
    const plan = response.parsed_output;
    if (!plan) return httpError(502, "The orchestrator didn't return a valid plan. Try again.");

    const seen = new Set();
    const experts = plan.experts
      .filter((e) => !seen.has(e.agent) && seen.add(e.agent))
      .slice(0, MAX_PANEL)
      .map((e) => ({ agent: e.agent, persona: personaOf(e.agent), title: titleOf(e.agent), task: e.task }));
    return Response.json({ rationale: plan.rationale, experts }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return httpError(502, describeApiError(err));
  }
};
