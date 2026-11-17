/**
 * @file src/app/api/agent/chat/route.ts
 * @description Multi-turn Vernacular Parent Counsellor chat API.
 * Persists every message in Neon `conversations` and increments `trust_score`.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { runVernacularParentChat } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKeyOverride = req.headers.get("x-openrouter-key") || undefined;

    const leadId = Number(body.lead_id);
    const userMessage = String(body.message || "").trim();
    const languageOverride = body.language ? String(body.language).trim() : null;

    if (!leadId || !userMessage) {
      return NextResponse.json(
        { error: "lead_id and message are required." },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Load lead + matched campus context and conversation history in parallel
    const [leadRows, historyRows] = await Promise.all([
      sql`
        SELECT l.*, c.name AS campus_name, c.ugc_status AS campus_ugc
        FROM leads l
        LEFT JOIN niat_campuses c ON l.matched_campus_id = c.id
        WHERE l.id = ${leadId}
        LIMIT 1
      `,
      sql`
        SELECT role, content FROM conversations
        WHERE lead_id = ${leadId}
        ORDER BY created_at ASC
      `,
    ]);
    const history = historyRows as Array<{ role: string; content: string }>;

    const lead = leadRows[0];
    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const activeLanguage = languageOverride || lead.preferred_language;

    // Generate native-language response via OpenRouter while saving the user message in parallel
    const [, chatRes] = await Promise.all([
      sql`
        INSERT INTO conversations (lead_id, role, language, content)
        VALUES (${leadId}, 'user', ${activeLanguage}, ${userMessage})
      `,
      runVernacularParentChat({
        leadContext: {
          student_name: lead.student_name,
          parent_name: lead.parent_name,
          campus_name: lead.campus_name || "Collaborating NIAT University",
          campus_ugc: lead.campus_ugc || "UGC-Approved University",
          preferred_language: activeLanguage,
          nat_score: lead.nat_score,
        },
        history,
        userMessage,
        apiKeyOverride,
      }),
    ]);

    // Store assistant reply & boost parent trust score in parallel
    const [, updatedLeads] = await Promise.all([
      sql`
        INSERT INTO conversations (lead_id, role, language, content)
        VALUES (${leadId}, 'assistant', ${activeLanguage}, ${chatRes.reply})
      `,
      sql`
        UPDATE leads
        SET trust_score = LEAST(98, trust_score + ${chatRes.trustDelta})
        WHERE id = ${leadId}
        RETURNING trust_score
      `,
    ]);

    return NextResponse.json({
      reply: chatRes.reply,
      mode: chatRes.mode,
      trust_score: updatedLeads[0]?.trust_score ?? lead.trust_score,
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "Failed to process vernacular parent chat." },
      { status: 500 }
    );
  }
}

