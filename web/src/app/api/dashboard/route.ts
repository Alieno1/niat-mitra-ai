/**
 * @file src/app/api/dashboard/route.ts
 * @description Returns live Neon Postgres data for both the Student/Parent Portal
 * (campus registry) and the NIAT Growth Manager Command Center (leads, tool logs, dispatches, KPIs).
 */

import { connection, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    const sql = getDb();

    // Fetch all leads joined with their matched NIAT collaborating campus
    const leads = await sql`
      SELECT
        l.*,
        c.name AS campus_name,
        c.city AS campus_city,
        c.category AS campus_category,
        c.ugc_status AS campus_ugc
      FROM leads l
      LEFT JOIN niat_campuses c ON l.matched_campus_id = c.id
      ORDER BY l.created_at DESC
      LIMIT 50
    `;

    // Fetch all collaborating campuses (CAT-A and CAT-B)
    const campuses = await sql`
      SELECT * FROM niat_campuses ORDER BY category DESC, state ASC
    `;

    // Fetch recent real AI tool-call execution logs
    const toolLogs = await sql`
      SELECT * FROM agent_tool_logs ORDER BY created_at DESC LIMIT 30
    `;

    // Fetch recent automated WhatsApp nurture & visit dispatches
    const dispatches = await sql`
      SELECT w.*, l.student_name, l.parent_name
      FROM whatsapp_dispatches w
      JOIN leads l ON w.lead_id = l.id
      ORDER BY w.created_at DESC
      LIMIT 25
    `;

    // Compute Growth Manager KPIs directly from Postgres rows
    const totalCacSaved = leads.reduce(
      (sum, row) => sum + Number(row.cac_saved_inr || 0),
      0
    );
    const avgTrustScore =
      leads.length > 0
        ? Math.round(
            leads.reduce((sum, row) => sum + Number(row.trust_score || 0), 0) /
              leads.length
          )
        : 0;
    const catBCount = leads.filter(
      (row) => row.campus_category === "CAT-B"
    ).length;

    return NextResponse.json({
      kpis: {
        total_leads: leads.length,
        total_cac_saved_inr: totalCacSaved,
        avg_trust_score: avgTrustScore,
        cat_b_rescued: catBCount,
        has_openrouter_key: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
      },
      leads,
      campuses,
      toolLogs,
      dispatches,
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data from Neon Postgres." },
      { status: 500 }
    );
  }
}
