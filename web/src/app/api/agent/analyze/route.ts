/**
 * @file src/app/api/agent/analyze/route.ts
 * @description Executes the 4-component NIAT TrustBridge AI pipeline:
 * 1. Stores the incoming lead in Neon Postgres.
 * 2. Runs the OpenRouter Tool-Calling Agent (Campus Match + ROI + Proofs + Live Web Check).
 * 3. Persists every tool call to `agent_tool_logs` & vernacular brief to `conversations`.
 * 4. Dispatches an automated WhatsApp parent briefing into `whatsapp_dispatches`.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { runTrustBridgeAgent } from "@/lib/openrouter";
import { dispatchWhatsappMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKeyOverride = req.headers.get("x-openrouter-key") || undefined;

    const student_name = String(body.student_name || "").trim();
    const parent_name = String(body.parent_name || "").trim();
    const phone = String(body.phone || "+91-9000000000").trim();
    const state = String(body.state || "Telangana").trim();
    const city = String(body.city || "Hyderabad").trim();
    const exam_type = String(body.exam_type || "JEE Main").trim();
    const exam_rank = Number(body.exam_rank || 0);
    const nat_score = Math.min(100, Math.max(1, Number(body.nat_score || 82)));
    const budget_lakhs = Number(body.budget_lakhs || 13);
    const preferred_language = String(body.preferred_language || "Telugu").trim();
    const primary_objection = String(
      body.primary_objection ||
        "Is the B.Tech degree UGC-approved and worth the fee?"
    ).trim();

    if (!student_name || !parent_name) {
      return NextResponse.json(
        { error: "Student name and Parent name are required." },
        { status: 400 }
      );
    }

    // Step 1: Run the multi-tool AI agent
    const agentResult = await runTrustBridgeAgent({
      student_name,
      parent_name,
      state,
      city,
      exam_type,
      exam_rank,
      nat_score,
      budget_lakhs,
      preferred_language,
      primary_objection,
      apiKeyOverride,
    });

    const sql = getDb();

    // Step 2: Insert the verified lead into Neon Postgres
    const insertedLeads = await sql`
      INSERT INTO leads (
        student_name, parent_name, phone, state, city,
        exam_type, exam_rank, nat_score, budget_lakhs,
        preferred_language, primary_objection, matched_campus_id,
        trust_score, funnel_stage, open_market_expires_at, cac_saved_inr
      )
      VALUES (
        ${student_name}, ${parent_name}, ${phone}, ${state}, ${city},
        ${exam_type}, ${exam_rank}, ${nat_score}, ${budget_lakhs},
        ${preferred_language}, ${primary_objection}, ${agentResult.matched_campus_id},
        ${agentResult.trust_score}, 'AI_COUNSELLED', NOW() + INTERVAL '7 days', ${agentResult.cac_saved_inr}
      )
      RETURNING *
    `;
    const lead = insertedLeads[0];

    // Step 3 & 4 & 5: Persist tool logs, initial conversation, and WhatsApp dispatch in parallel
    const waDelivery = await dispatchWhatsappMessage(
      phone,
      agentResult.whatsapp_message_native
    );

    await Promise.all([
      ...agentResult.tool_trace.map((trace) =>
        sql`
          INSERT INTO agent_tool_logs (lead_id, tool_name, tool_input, tool_output, latency_ms)
          VALUES (
            ${lead.id},
            ${trace.tool_name},
            ${JSON.stringify(trace.tool_input)}::jsonb,
            ${JSON.stringify(trace.tool_output)}::jsonb,
            ${trace.latency_ms}
          )
        `
      ),
      sql`
        INSERT INTO conversations (lead_id, role, language, content)
        VALUES (
          ${lead.id},
          'assistant',
          ${preferred_language},
          ${agentResult.parent_brief_native}
        )
      `,
      sql`
        INSERT INTO whatsapp_dispatches (lead_id, language, message_type, message_body, status)
        VALUES (
          ${lead.id},
          ${preferred_language},
          'TRUST_DOSSIER_BRIEF',
          ${agentResult.whatsapp_message_native},
          ${waDelivery.status}
        )
      `,
    ]);

    // Fetch matched campus details to return full context to the UI
    const campusRows = await sql`
      SELECT * FROM niat_campuses WHERE id = ${agentResult.matched_campus_id} LIMIT 1
    `;

    return NextResponse.json({
      lead,
      matched_campus: campusRows[0] || null,
      agent: agentResult,
      whatsapp: waDelivery,
    });
  } catch (error) {
    console.error("Agent analyze error:", error);
    return NextResponse.json(
      { error: "Failed to run TrustBridge AI analysis." },
      { status: 500 }
    );
  }
}

