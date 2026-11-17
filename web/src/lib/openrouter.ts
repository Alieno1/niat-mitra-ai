/**
 * @file src/lib/openrouter.ts
 * @description OpenRouter AI Agent Orchestrator with multi-turn function/tool calling.
 * Coordinates between OpenRouter LLMs (e.g., google/gemini-2.5-flash) and our
 * 4 Neon/live-web backend tools, with a graceful deterministic fallback if no API key is set.
 */

import {
  AGENT_TOOL_DEFINITIONS,
  calculateScholarshipAndRoi,
  executeAgentTool,
  fetchLiveNiatPublicStatus,
  fetchVerifiedProofs,
  matchNiatCampus,
} from "./agent-tools";

export interface ToolTraceItem {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown>;
  latency_ms: number;
}

export interface AgentAnalysisResult {
  mode: "openrouter-live" | "deterministic-fallback";
  model_used: string;
  matched_campus_id: number;
  cac_saved_inr: number;
  trust_score: number;
  parent_brief_native: string;
  whatsapp_message_native: string;
  closer_script_english: string;
  tool_trace: ToolTraceItem[];
}

/**
 * Runs the full NIAT TrustBridge tool-calling agent for a newly submitted student/parent lead.
 * Enforces NIAT's /llm-info legal guardrails and generates a native-language parent dossier.
 */
export async function runTrustBridgeAgent(params: {
  student_name: string;
  parent_name: string;
  state: string;
  city: string;
  exam_type: string;
  exam_rank: number;
  nat_score: number;
  budget_lakhs: number;
  preferred_language: string;
  primary_objection: string;
  apiKeyOverride?: string;
}): Promise<AgentAnalysisResult> {
  const apiKey = params.apiKeyOverride?.trim() || process.env.OPENROUTER_API_KEY?.trim();
  const primaryModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
  const modelsToTry = [primaryModel, "openrouter/free"];
  const toolTrace: ToolTraceItem[] = [];

  // Fallback path when no OpenRouter API key is configured: still runs all 4 real Neon/HTTP tools
  if (!apiKey) {
    return runDeterministicPipeline(params, toolTrace);
  }

  const systemPrompt = `You are NIAT Mitra AI, an honest, empathetic, and data-backed admission verification agent for NxtWave's NIAT program.
Your job is to resolve a skeptical parent's doubts using REAL tool outputs—never make up numbers or guarantees.

STRICT LEGAL GUARDRAILS (from niatindia.com/llm-info):
1. Always clarify that NIAT is NOT a university; the UGC-approved B.Tech degree is awarded by the collaborating university, and NIAT provides the 4-year on-campus tech upskilling layer + Industry Ready Certificate.
2. NEVER guarantee placements, jobs, or ₹80 LPA packages. Explain outcomes depend on student skill & effort.
3. Be 100% transparent about NAT scholarship eligibility (human affiliates sometimes hide this, which hurts parent trust).

WORKFLOW:
1. In your FIRST turn, call match_niat_campus and fetch_verified_proofs in parallel.
2. In your NEXT turn, call calculate_scholarship_and_roi and fetch_live_niat_public_status in parallel using the matched campus fee/slug.
3. After all 4 tools return, respond ONLY with valid JSON (no markdown fences) matching this schema:
{
  "trust_score": <integer 65-95>,
  "parent_brief_native": "<A warm, clear 120-160 word explanation written natively in ${params.preferred_language} addressing ${params.parent_name}'s exact objection with the verified UGC status, scholarship math, and local student proof>",
  "whatsapp_message_native": "<A concise 60-80 word WhatsApp message in ${params.preferred_language} inviting ${params.parent_name} to book their Campus Visit before the 7-day window expires>",
  "closer_script_english": "<3 bullet points in English for the human NxtWave counsellor summarizing the matched campus, scholarship waiver, and next step>"
}`;

  const userPrompt = `Student: ${params.student_name} | Parent: ${params.parent_name}
Location: ${params.city}, ${params.state}
Exam: ${params.exam_type} (Rank: ${params.exam_rank || "N/A"}) | NAT Score: ${params.nat_score}/100
4-Year Budget: ₹${params.budget_lakhs} Lakhs | Preferred Parent Language: ${params.preferred_language}
Parent's Primary Objection: "${params.primary_objection}"`;

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    let activeModel = modelsToTry[0];
    // Up to 5 rounds of tool-calling orchestration via OpenRouter (auto-shifts to openrouter/free on 402/429)
    for (let round = 0; round < 5; round++) {
      let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://niat-trustbridge.vercel.app",
          "X-Title": "NIAT Mitra AI",
        },
        body: JSON.stringify({
          model: activeModel,
          messages,
          tools: AGENT_TOOL_DEFINITIONS,
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 700,
        }),
      });

      if ((response.status === 402 || response.status === 429) && activeModel !== "openrouter/free") {
        activeModel = "openrouter/free";
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://niat-trustbridge.vercel.app",
            "X-Title": "NIAT Mitra AI",
          },
          body: JSON.stringify({
            model: activeModel,
            messages,
            tools: AGENT_TOOL_DEFINITIONS,
            tool_choice: "auto",
            temperature: 0.3,
            max_tokens: 700,
          }),
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        console.warn("OpenRouter API error, falling back to deterministic pipeline:", errText);
        return runDeterministicPipeline(params, toolTrace);
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message;
      if (!choice) break;

      messages.push(choice);

      // If the LLM requested tool calls, execute all of them in parallel and append results
      if (choice.tool_calls && choice.tool_calls.length > 0) {
        const executed = await Promise.all(
          choice.tool_calls.map(async (call: { id: string; function?: { name?: string; arguments?: string } }) => {
            const fnName = call.function?.name || "";
            let fnArgs: Record<string, unknown> = {};
            try {
              fnArgs = JSON.parse(call.function?.arguments || "{}");
            } catch {
              fnArgs = {};
            }
            const { output, latencyMs } = await executeAgentTool(fnName, fnArgs);
            return { callId: call.id, fnName, fnArgs, output, latencyMs };
          })
        );

        for (const item of executed) {
          toolTrace.push({
            tool_name: item.fnName,
            tool_input: item.fnArgs,
            tool_output: item.output,
            latency_ms: item.latencyMs,
          });
          messages.push({
            role: "tool",
            tool_call_id: item.callId,
            content: JSON.stringify(item.output),
          });
        }
        continue;
      }

      // Final JSON response from the LLM
      const rawContent = String(choice.content || "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(rawContent);

      const campusTool = toolTrace.find((t) => t.tool_name === "match_niat_campus");
      const matchedCampus = (campusTool?.tool_output as { matched_campus?: { id: number; affiliate_payout_inr: number } })?.matched_campus;

      return {
        mode: "openrouter-live",
        model_used: activeModel,
        matched_campus_id: matchedCampus?.id || 1,
        cac_saved_inr: matchedCampus?.affiliate_payout_inr || 35000,
        trust_score: Number(parsed.trust_score || 82),
        parent_brief_native: parsed.parent_brief_native,
        whatsapp_message_native: parsed.whatsapp_message_native,
        closer_script_english: parsed.closer_script_english,
        tool_trace: toolTrace,
      };
    }
  } catch (err) {
    console.warn("OpenRouter orchestration error, using deterministic pipeline:", err);
  }

  return runDeterministicPipeline(params, toolTrace);
}

/**
 * Multi-turn vernacular parent chat handler via OpenRouter.
 * Answers follow-up parent questions in their chosen regional language.
 */
export async function runVernacularParentChat(params: {
  leadContext: {
    student_name: string;
    parent_name: string;
    campus_name: string;
    campus_ugc: string;
    preferred_language: string;
    nat_score: number;
  };
  history: Array<{ role: string; content: string }>;
  userMessage: string;
  apiKeyOverride?: string;
}): Promise<{ reply: string; mode: "openrouter-live" | "deterministic-fallback"; trustDelta: number }> {
  const apiKey = params.apiKeyOverride?.trim() || process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

  if (!apiKey) {
    return {
      mode: "deterministic-fallback",
      trustDelta: 4,
      reply: buildSmartChatFallback(params),
    };
  }

  const bsccNote = hasFuzzyTopic(params.userMessage, ["bihar", "bscc", "credit"])
    ? `\n- Bihar Student Credit Card (BSCC): Applies ONLY if the specific partner university is on Bihar's MNSSBY approved list (NAAC A/UGC/NIRF) for B.Tech tuition, not standalone upskilling unless consolidated.`
    : "";

  try {
    const payloadMessages = [
      {
        role: "system",
        content: `You are NIAT Mitra AI speaking respectfully to ${params.leadContext.parent_name} (parent of ${params.leadContext.student_name}, NAT score ${params.leadContext.nat_score}/100).
CRITICAL LANGUAGE RULE: Write your response STRICTLY in ${params.leadContext.preferred_language} (even if earlier messages in the conversation were in another language).
RELEVANCE RULE: Answer ONLY what the parent is asking right now. Do NOT bring up unrelated states or schemes (like Bihar Student Credit Card) unless the parent specifically asks about them.
Facts:
- Matched University: ${params.leadContext.campus_name} (${params.leadContext.campus_ugc}). NIAT is the 4-year on-campus tech upskilling layer (AI/ML, Full-Stack, Data Science); the University awards the official UGC/AICTE-approved B.Tech degree.
- Fees & Scholarships: Total 4-year fees range ₹8L–₹18L by campus. NAT (90-min online test, ₹1,200 fee, no negative marking) offers up to 100% merit scholarship on the upskilling portion. Standard bank education loans (SBI/private banks) are available against the UGC B.Tech admission.
- Hostels & Exams: Hostels/mess are managed by the partner university (inspectable on Campus Visit). University semester exams + NIAT coding run in an integrated schedule.
- Competitors: Scaler SST (Bangalore, ₹20L+) & Newton NST (Pune/Sonipat, ₹20L+); NIAT partners with 35+ universities across 15+ cities (South India hubs: Hyderabad, Bengaluru, Chennai, Coimbatore, Vijayawada, Visakhapatnam).${bsccNote}
- Never guarantee jobs or ₹80 LPA packages. Keep answers under 115 words, warm, honest, and factual.`,
      },
      ...params.history.slice(-6),
      { role: "user", content: params.userMessage },
    ];

    for (const candidateModel of [model, "openrouter/free"]) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://niat-trustbridge.vercel.app",
          "X-Title": "NIAT Mitra AI",
        },
        body: JSON.stringify({
          model: candidateModel,
          temperature: 0.4,
          max_tokens: candidateModel === "openrouter/free" ? 1200 : 350,
          messages: payloadMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return { reply, mode: "openrouter-live", trustDelta: 6 };
        }
      }
      if (res.status !== 402 && res.status !== 429) break;
    }
  } catch (err) {
    console.warn("Vernacular chat fallback triggered:", err);
  }

  return {
    mode: "deterministic-fallback",
    trustDelta: 4,
    reply: buildSmartChatFallback(params),
  };
}

/**
 * Computes Levenshtein edit distance between two words so offline fallbacks
 * understand misspellings (e.g. "schlorships" -> "scholarship", "hostl" -> "hostel").
 */
function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Returns true if any word in `text` closely matches any keyword (exact substring or edit distance <= 2).
 */
export function hasFuzzyTopic(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  if (keywords.some((kw) => lower.includes(kw))) return true;
  const words = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4);
  return words.some((w) =>
    keywords.some((kw) => kw.length >= 4 && Math.abs(w.length - kw.length) <= 2 && editDistance(w, kw) <= 2)
  );
}

/**
 * Question-aware fallback for follow-up parent chat when OpenRouter quota is exhausted,
 * ensuring accurate answers on BSCC/loans, hostels, scholarships, refunds, and placements.
 */
function buildSmartChatFallback(params: {
  leadContext: {
    student_name: string;
    parent_name: string;
    campus_name: string;
    campus_ugc: string;
    preferred_language: string;
    nat_score: number;
  };
  userMessage: string;
}): string {
  const q = params.userMessage.toLowerCase();
  const isHindi = params.leadContext.preferred_language === "Hindi";
  const campus = params.leadContext.campus_name;

  if (hasFuzzyTopic(q, ["bihar", "credit", "bscc", "loan", "karz", "udhar"])) {
    return isHindi
      ? `${params.leadContext.parent_name} जी, Bihar Student Credit Card (BSCC, ₹4 लाख तक) केवल उन्हीं कॉलेजों पर लागू होता है जो बिहार सरकार के MNSSBY पोर्टल की अनुमोदित सूची (NAAC A / UGC / NIRF मानदंड) में शामिल हैं। चूंकि ${campus} एक ${params.leadContext.campus_ugc} है, इसलिए आपको 7nishchay-yuvaupmission.bihar.gov.in पर ${campus} का नाम और B.Tech ट्यूशन फीस की पुष्टि करनी होगी—NIAT का अलग अपस्किलिंग शुल्क BSCC में स्वतः शामिल नहीं होता। सामान्य बैंक एजुकेशन लोन (SBI आदि) मान्य B.Tech एडमिशन पर उपलब्ध रहते हैं।`
      : `${params.leadContext.parent_name}, Bihar Student Credit Card (BSCC, up to ₹4L) applies ONLY if the specific partner university (${campus}) is listed on Bihar's official MNSSBY portal (7nishchay-yuvaupmission.bihar.gov.in) under NAAC/UGC rules—and it covers the university B.Tech fee, not separate upskilling fees unless consolidated. Standard bank education loans (SBI/private banks) are available on the UGC-approved B.Tech admission.`;
  }

  if (hasFuzzyTopic(q, ["hostel", "mess", "food", "stay", "room", "khana", "campus"])) {
    return isHindi
      ? `${params.leadContext.parent_name} जी, हॉस्टल और मेस की सुविधा ${campus} द्वारा प्रदान की जाती है (शुल्क कैंपस और रूम टाइप के अनुसार अलग होता है)। आप कैंपस विजिट के दौरान खुद हॉस्टल और मेस देख सकते हैं।`
      : `Hostel and mess facilities are managed by ${campus} (fees vary by room type). You can inspect the hostel and campus directly during your scheduled Campus Visit.`;
  }

  if (hasFuzzyTopic(q, ["scholarship", "waiver", "concession", "discount", "fee", "fees", "paisa", "kharch"])) {
    return isHindi
      ? `${params.leadContext.student_name} के NAT स्कोर (${params.leadContext.nat_score}/100) के आधार पर NIAT अपस्किलिंग हिस्से पर पारदर्शी मेरिट स्कॉलरशिप (100% तक) का मूल्यांकन होता है।`
      : `With a NAT score of ${params.leadContext.nat_score}/100, ${params.leadContext.student_name} is evaluated transparently for merit scholarships (up to 100% on the NIAT upskilling component).`;
  }

  if (hasFuzzyTopic(q, ["placement", "job", "package", "salary", "internship", "naukri", "company"])) {
    return isHindi
      ? `${campus} से UGC-मान्य B.Tech डिग्री मिलती है और NxtWave 2,500+ हायरिंग पार्टनर्स के जरिए प्लेसमेंट सहायता देता है। हालांकि, नौकरी या पैकेज की गारंटी नहीं होती—यह छात्र की मेहनत और कोडिंग स्किल्स पर निर्भर करता है।`
      : `${campus} awards the UGC-approved B.Tech degree and NxtWave provides placement support across 2,500+ hiring partners. Jobs/packages are not guaranteed—outcomes depend on the student's coding skills and effort.`;
  }

  return isHindi
    ? `${params.leadContext.parent_name} जी, ${campus} (${params.leadContext.campus_ugc}) आधिकारिक B.Tech डिग्री देता है और NIAT कैंपस में प्रैक्टिकल AI व सॉफ्टवेयर इंजीनियरिंग की ट्रेनिंग देता है।`
    : `Thank you for asking, ${params.leadContext.parent_name}. ${campus} (${params.leadContext.campus_ugc}) awards the official B.Tech degree while NIAT delivers the hands-on AI & software engineering training on campus.`;
}

/**
 * Deterministic pipeline that still executes all 4 real Neon DB + HTTP verification tools
 * so every demo/test works reliably even before an OpenRouter key is added.
 */
async function runDeterministicPipeline(
  params: {
    student_name: string;
    parent_name: string;
    state: string;
    exam_type: string;
    exam_rank: number;
    nat_score: number;
    budget_lakhs: number;
    preferred_language: string;
    primary_objection: string;
  },
  existingTrace: ToolTraceItem[]
): Promise<AgentAnalysisResult> {
  const t1Start = Date.now();
  const campusRes = await matchNiatCampus(params.state, params.budget_lakhs);
  existingTrace.push({
    tool_name: "match_niat_campus",
    tool_input: { state: params.state, budget_lakhs: params.budget_lakhs },
    tool_output: campusRes as unknown as Record<string, unknown>,
    latency_ms: Date.now() - t1Start,
  });

  const campus = campusRes.matched_campus;

  const t2Start = Date.now();
  const roiRes = calculateScholarshipAndRoi({
    exam_type: params.exam_type,
    exam_rank: params.exam_rank,
    nat_score: params.nat_score,
    campus_fee_lakhs: Number(campus.estimated_4yr_fee_lakhs),
    local_tier3_avg_lpa: Number(campus.local_tier3_avg_lpa),
  });
  existingTrace.push({
    tool_name: "calculate_scholarship_and_roi",
    tool_input: {
      exam_type: params.exam_type,
      exam_rank: params.exam_rank,
      nat_score: params.nat_score,
      campus_fee_lakhs: Number(campus.estimated_4yr_fee_lakhs),
    },
    tool_output: roiRes as unknown as Record<string, unknown>,
    latency_ms: Date.now() - t2Start,
  });

  const t3Start = Date.now();
  const proofRes = await fetchVerifiedProofs(params.state);
  existingTrace.push({
    tool_name: "fetch_verified_proofs",
    tool_input: { state: params.state },
    tool_output: proofRes as unknown as Record<string, unknown>,
    latency_ms: Date.now() - t3Start,
  });

  const t4Start = Date.now();
  const liveRes = await fetchLiveNiatPublicStatus(campus.slug);
  existingTrace.push({
    tool_name: "fetch_live_niat_public_status",
    tool_input: { slug: campus.slug },
    tool_output: liveRes as unknown as Record<string, unknown>,
    latency_ms: Date.now() - t4Start,
  });

  const topProof = proofRes.regional_student_proofs[0];
  const langGreetings: Record<string, string> = {
    Telugu: `నమస్కారం ${params.parent_name} గారు! ${params.student_name} కోసం ${campus.name} (${campus.city}) ఉత్తమ ఎంపిక.`,
    Hindi: `नमस्ते ${params.parent_name} जी! ${params.student_name} के लिए ${campus.name} (${campus.city}) एक सुरक्षित और UGC-मान्यता प्राप्त विकल्प है।`,
    Tamil: `வணக்கம் ${params.parent_name}! ${params.student_name} அவர்களுக்கு ${campus.name} (${campus.city}) ஒரு UGC அங்கீகரிக்கப்பட்ட சிறந்த தேர்வாகும்.`,
    Kannada: `ನಮಸ್ಕಾರ ${params.parent_name} ಅವರೇ! ${params.student_name} ಅವರಿಗೆ ${campus.name} (${campus.city}) UGC ಮಾನ್ಯತೆ ಪಡೆದ ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಯಾಗಿದೆ.`,
    Malayalam: `നമസ്കാരം ${params.parent_name}! ${params.student_name}ന് ${campus.name} (${campus.city}) UGC അംഗീകാരമുള്ള മികച്ച തിരഞ്ഞെടുപ്പാണ്.`,
    Marathi: `नमस्कार ${params.parent_name} जी! ${params.student_name} साठी ${campus.name} (${campus.city}) हा UGC-मान्यताप्राप्त उत्तम पर्याय आहे.`,
    Gujarati: `નમસ્તે ${params.parent_name} જી! ${params.student_name} માટે ${campus.name} (${campus.city}) એક UGC-માન્ય અને સુરક્ષિત વિકલ્પ છે.`,
    Punjabi: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${params.parent_name} ਜੀ! ${params.student_name} ਲਈ ${campus.name} (${campus.city}) ਇੱਕ UGC-ਮਾਨਤਾ ਪ੍ਰਾਪਤ ਵਧੀਆ ਵਿਕਲਪ ਹੈ।`,
    Bengali: `নমস্কার ${params.parent_name}! ${params.student_name}-এর জন্য ${campus.name} (${campus.city}) একটি UGC-অনুমোদিত সেরা বিকল্প।`,
    Odia: `ନମସ୍କାର ${params.parent_name}! ${params.student_name}ଙ୍କ ପାଇଁ ${campus.name} (${campus.city}) ଏକ UGC-ଅନୁମୋଦିତ ଉତ୍ତମ ବିକଳ୍ପ।`,
    English: `Hello ${params.parent_name}, here is the verified breakdown for ${params.student_name} at ${campus.name} (${campus.city}).`,
  };

  const greeting = langGreetings[params.preferred_language] || langGreetings.English;

  const parent_brief_native = `${greeting}

1) Degree & Legal Proof: ${campus.name} holds "${campus.ugc_status}" and directly awards the official 4-year B.Tech degree. NIAT runs the practical AI & software engineering upskilling layer on campus.
2) Transparent Fee & Scholarship: With a NAT score of ${params.nat_score}/100, ${params.student_name} qualifies for an estimated ${roiRes.eligible_upskilling_scholarship_pct}% upskilling waiver (~₹${roiRes.estimated_waiver_lakhs}L off), bringing the net 4-year fee to ~₹${roiRes.net_4yr_fee_lakhs}L (vs. local Tier-3 colleges averaging ${campus.local_tier3_avg_lpa} LPA).
3) Real Local Proof: ${topProof ? `${topProof.project_name} at ${topProof.university_name} (${topProof.metric_label}) — ${topProof.summary}` : "NIAT students build 50+ real-world industry projects from Year 1."}`;

  const whatsapp_message_native = `${greeting} Your verified NIAT Trust Dossier for ${campus.name} is ready: UGC-approved B.Tech + estimated ₹${roiRes.estimated_waiver_lakhs}L NAT scholarship waiver. Book your Campus Visit within 7 days to lock priority review!`;

  const closer_script_english = `• Matched Campus: ${campus.name} (${campus.category} | Saves ₹${campus.affiliate_payout_inr.toLocaleString("en-IN")} affiliate payout)\n• Scholarship & ROI: ${roiRes.eligible_upskilling_scholarship_pct}% upskilling waiver -> Net ₹${roiRes.net_4yr_fee_lakhs}L vs ${campus.local_tier3_avg_lpa} LPA local baseline\n• Objection Addressed: "${params.primary_objection}" — UGC status verified live & regional proof (${topProof?.project_name || "NIAT Showcase"}) shared in ${params.preferred_language}.`;

  return {
    mode: "deterministic-fallback",
    model_used: "deterministic-tool-pipeline",
    matched_campus_id: campus.id,
    cac_saved_inr: campus.affiliate_payout_inr,
    trust_score: 84,
    parent_brief_native,
    whatsapp_message_native,
    closer_script_english,
    tool_trace: existingTrace,
  };
}

