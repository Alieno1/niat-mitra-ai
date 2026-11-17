/**
 * @file src/lib/db.ts
 * @description Neon Serverless Postgres client and shared TypeScript domain types
 * for the NIAT TrustBridge AI Growth System.
 */

import { neon } from "@neondatabase/serverless";

/**
 * Returns a Neon SQL query executor bound to DATABASE_URL.
 * Uses HTTP-based serverless pooling so it works cleanly on Vercel Edge/Node and Render.
 */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return neon(databaseUrl);
}

/** Represents a real NIAT collaborating university from niatindia.com/campus */
export interface NiatCampus {
  id: number;
  name: string;
  city: string;
  state: string;
  category: "CAT-A" | "CAT-B";
  affiliate_payout_inr: number;
  estimated_4yr_fee_lakhs: number;
  ugc_status: string;
  local_tier3_avg_lpa: number;
  slug: string;
}

/** Represents a verified student project/startup outcome from /revenue-by-niatians */
export interface StudentProof {
  id: number;
  project_name: string;
  university_name: string;
  state: string;
  metric_label: string;
  summary: string;
}

/** Represents a student/parent lead in the 7-day NIAT attribution funnel */
export interface LeadRecord {
  id: number;
  student_name: string;
  parent_name: string;
  phone: string;
  state: string;
  city: string;
  exam_type: string;
  exam_rank: number | null;
  nat_score: number;
  budget_lakhs: number;
  preferred_language: string;
  primary_objection: string;
  matched_campus_id: number | null;
  campus_name?: string;
  campus_city?: string;
  campus_category?: string;
  campus_ugc?: string;
  trust_score: number;
  funnel_stage: string;
  open_market_expires_at: string;
  cac_saved_inr: number;
  created_at: string;
}

/** Logs every real backend tool invocation made by the AI Agent */
export interface AgentToolLog {
  id: number;
  lead_id: number;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown>;
  latency_ms: number;
  created_at: string;
}

/** Multi-turn vernacular chat message stored in Postgres */
export interface ConversationMessage {
  id: number;
  lead_id: number;
  role: "user" | "assistant" | "system";
  language: string;
  content: string;
  created_at: string;
}

/** Automated WhatsApp nurture & campus visit dispatch record */
export interface WhatsappDispatch {
  id: number;
  lead_id: number;
  student_name?: string;
  parent_name?: string;
  language: string;
  message_type: string;
  message_body: string;
  scheduled_visit_slot: string | null;
  status: string;
  created_at: string;
}

