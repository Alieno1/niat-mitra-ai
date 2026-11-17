/**
 * @file src/app/api/agent/general-chat/route.ts
 * @description Always-on dynamic AI Assistant endpoint that answers ANY arbitrary question
 * about NIAT, partner universities, NAT exam, fees, scholarships, or comparisons (Scaler/Newton)
 * in 11 Indian languages, grounded in live Neon Postgres campus & proof data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, NiatCampus, StudentProof } from "@/lib/db";
import { hasFuzzyTopic } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKeyOverride = req.headers.get("x-openrouter-key") || undefined;
    const question = String(body.question || "").trim();
    const language = String(body.language || "English").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const sql = getDb();
    const campuses = (await sql`
      SELECT name, city, state, estimated_4yr_fee_lakhs, ugc_status, local_tier3_avg_lpa
      FROM niat_campuses ORDER BY state ASC
    `) as NiatCampus[];
    const proofs = (await sql`
      SELECT project_name, university_name, metric_label, summary FROM student_proofs LIMIT 5
    `) as StudentProof[];

    const apiKey = apiKeyOverride?.trim() || process.env.OPENROUTER_API_KEY?.trim();
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

    const bsccFact = hasFuzzyTopic(question, ["bihar", "bscc", "credit"])
      ? `\n- Bihar Student Credit Card (BSCC): Applies ONLY if the specific partner university is on Bihar's MNSSBY approved list (NAAC A/UGC/NIRF) for B.Tech tuition, not standalone upskilling unless consolidated.`
      : "";

    const knowledgeContext = `NIAT FACTS (Source of Truth):
- NIAT (NxtWave of Innovation in Advanced Technologies) is NOT a standalone university; it is a 4-year on-campus tech upskilling program offered inside 35+ UGC-approved partner universities across India.
- Degree: Awarded by the partner university (UGC/AICTE approved). NIAT awards an Industry Ready Certificate (IRC).
- NAT Exam: 90-min online test (Psychometric + Critical Thinking + Math), ₹1,200 fee, no negative marking. Scholarships up to 100% on the upskilling component.
- Total 4-year fee: ₹8L–₹18L depending on campus. Standard bank education loans (SBI/private banks) are available against the UGC B.Tech degree.${bsccFact}
- Competitors: Scaler School of Technology (Bangalore, ~₹20L+, 1-yr residency) & Newton School of Technology (Pune/Sonipat, ~₹20L+, residential B.Tech).
- Partner Campuses in DB: ${campuses.map((c) => `${c.name} (${c.city}, ₹${c.estimated_4yr_fee_lakhs}L, ${c.ugc_status})`).join(" | ")}
- Real Student Proofs: ${proofs.map((p) => `${p.project_name} at ${p.university_name}: ${p.metric_label}`).join(" | ")}`;

    if (apiKey) {
      try {
        for (const candidateModel of [model, "openrouter/free"]) {
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://niat-trustbridge.vercel.app",
              "X-Title": "NIAT TrustBridge AI Assistant",
            },
            body: JSON.stringify({
              model: candidateModel,
              temperature: 0.35,
              max_tokens: candidateModel === "openrouter/free" ? 1200 : 450,
              messages: [
                {
                  role: "system",
                  content: `You are an expert, friendly NIAT Admission & Career Assistant for parents and 12th-grade students.
Answer ANY question accurately using the verified NIAT facts below.
LANGUAGE RULE: The user may ask or speak in English, Hinglish, Hindi, or any Indian language—understand their intent regardless of input language, and ALWAYS write your reply strictly in ${language} (using natural, easy-to-read script). Keep replies concise (under 130 words) and easy for a parent to understand. Never guarantee jobs or ₹80 LPA packages.

${knowledgeContext}`,
                },
                ...history.slice(-6),
                { role: "user", content: question },
              ],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) {
              return NextResponse.json({ reply, mode: "openrouter-live" });
            }
          }
          if (res.status !== 402 && res.status !== 429) break;
        }
      } catch (e) {
        console.warn("General chat OpenRouter fallback:", e);
      }
    }

    // Smart dynamic fallback grounded in real Neon DB records
    const q = question.toLowerCase();
    let reply = "";
    const matchedCampus = campuses.find(
      (c) =>
        q.includes(c.city.toLowerCase()) ||
        q.includes(c.state.toLowerCase()) ||
        q.includes(c.name.toLowerCase().split(" ")[0])
    );

    if (hasFuzzyTopic(q, ["bihar", "credit", "bscc", "loan"])) {
      reply = `Bihar Student Credit Card (BSCC, up to ₹4L) ONLY applies if the specific NIAT partner university is listed on Bihar's official MNSSBY portal (7nishchay-yuvaupmission.bihar.gov.in) under NAAC/UGC rules, and covers university B.Tech tuition—not standalone upskilling fees unless consolidated. Standard bank education loans (SBI/private banks) are available for the UGC-approved B.Tech degree.`;
    } else if (matchedCampus) {
      reply = `At ${matchedCampus.name} (${matchedCampus.city}, ${matchedCampus.state}), the estimated 4-year total fee is ~₹${matchedCampus.estimated_4yr_fee_lakhs} Lakhs. The B.Tech degree is awarded directly by the university (${matchedCampus.ugc_status}), while NIAT delivers daily coding & AI training on campus.`;
    } else if (hasFuzzyTopic(q, ["scaler", "newton", "compare", "different"])) {
      reply = `Great question! Scaler SST (Bangalore) and Newton NST (Pune/Sonipat) cost ₹20L+ and focus on 1–2 campuses. NIAT partners with 35+ UGC-approved universities across 15+ cities (₹8L–₹18L total) so students can study closer to home with NAT merit scholarships.`;
    } else if (hasFuzzyTopic(q, ["exam", "test", "syllabus", "pattern"]) || q.includes("nat")) {
      reply = `NAT (NxtWave Assessment Test) is a 90-minute online test (₹1,200 fee, no negative marking) covering Psychometric traits, Logical Reasoning, and High-School Math. Qualifying unlocks 1:1 counselling and merit scholarships up to 100% on the upskilling fee.`;
    } else if (hasFuzzyTopic(q, ["degree", "valid", "fake", "recognized"]) || q.includes("ugc")) {
      reply = `NIAT itself is not a university—it is the tech upskilling partner. Your official 4-year B.Tech degree is awarded by a UGC-recognized / AICTE-approved partner university (like Aurora, Chaitanya, Yenepoya, or Noida International Univ), so it is 100% valid for jobs, MS abroad, and govt exams.`;
    } else if (hasFuzzyTopic(q, ["scholarship", "waiver", "cost", "fees", "discount"]) || q.includes("fee")) {
      reply = `Total 4-year fees range from ₹8L to ₹18L depending on the partner university (university tuition + NIAT upskilling). Based on your NAT score and 12th marks, you can qualify for merit scholarships on the upskilling portion.`;
    } else {
      reply = `NIAT combines a UGC-approved B.Tech degree from one of 35+ partner universities (like ${campuses[0]?.name} or ${campuses[1]?.name}) with 4 years of practical AI, Full-Stack coding, and project training by NxtWave. Ask me about any specific city, fee, NAT exam, or comparison!`;
    }

    return NextResponse.json({ reply, mode: "neon-knowledge-fallback" });
  } catch (error) {
    console.error("General chat error:", error);
    return NextResponse.json({ error: "Failed to answer question." }, { status: 500 });
  }
}

