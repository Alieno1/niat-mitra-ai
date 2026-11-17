/**
 * @file src/app/api/agent/extract-profile/route.ts
 * @description Fallback profile extractor for natural text/voice input.
 */

import { NextRequest, NextResponse } from "next/server";

const KNOWN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi NCR",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

const KNOWN_LANGUAGES = [
  "Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "Marathi",
  "Gujarati", "Punjabi", "Bengali", "Odia", "English",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const lower = text.toLowerCase();
    const stateMatch = KNOWN_STATES.find((s) => lower.includes(s.toLowerCase())) || "Telangana";
    const langMatch = KNOWN_LANGUAGES.find((l) => lower.includes(l.toLowerCase())) || "English";
    const phoneDigits = (text.replace(/\s+/g, "").match(/(?:\+91)?(\d{10})/) || [])[1] || "";

    return NextResponse.json({
      mode: "regex-fallback",
      extracted: {
        student_name: "Student",
        parent_name: "Parent",
        phone: phoneDigits,
        state: stateMatch,
        preferred_language: langMatch,
        exam_type: "JEE Main",
        exam_rank: 0,
        nat_score: 80,
        budget_lakhs: 12,
        primary_objection: text,
      },
    });
  } catch (error) {
    console.error("Extract profile error:", error);
    return NextResponse.json({ error: "Failed to extract profile." }, { status: 500 });
  }
}

