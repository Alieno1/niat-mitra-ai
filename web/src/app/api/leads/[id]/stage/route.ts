/**
 * @file src/app/api/leads/[id]/stage/route.ts
 * @description Advances a lead's funnel stage (e.g., CAMPUS_VISIT_BOOKED or SEAT_RESERVED)
 * and dispatches a confirmation WhatsApp notification in Neon Postgres.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { dispatchWhatsappMessage } from "@/lib/whatsapp";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const leadId = Number(id);
    const body = await req.json();
    const nextStage = String(body.funnel_stage || "CAMPUS_VISIT_BOOKED");
    const visitSlot = String(body.visit_slot || "Saturday, 11:00 AM IST");

    if (!leadId) {
      return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });
    }

    const sql = getDb();
    const updated = await sql`
      UPDATE leads
      SET
        funnel_stage = ${nextStage},
        trust_score = LEAST(99, trust_score + 8)
      WHERE id = ${leadId}
      RETURNING *
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const lead = updated[0];
    const messageBody =
      nextStage === "SEAT_RESERVED"
        ? `Seat Reservation (₹4,000 SR Milestone) confirmed for ${lead.student_name}! Welcome to NIAT.`
        : `Confirmed: Campus Visit & 1:1 Parent Counselling booked for ${lead.student_name} & ${lead.parent_name} on ${visitSlot}.`;

    const waDelivery = await dispatchWhatsappMessage(lead.phone, messageBody);

    await sql`
      INSERT INTO whatsapp_dispatches (
        lead_id, language, message_type, message_body, scheduled_visit_slot, status
      )
      VALUES (
        ${leadId},
        ${lead.preferred_language},
        ${nextStage},
        ${messageBody},
        ${visitSlot},
        ${waDelivery.status}
      )
    `;

    return NextResponse.json({ lead, messageBody, whatsapp: waDelivery });
  } catch (error) {
    console.error("Lead stage update error:", error);
    return NextResponse.json(
      { error: "Failed to update lead stage." },
      { status: 500 }
    );
  }
}

