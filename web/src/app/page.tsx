"use client";

/**
 * @file src/app/page.tsx
 * @description Modern SaaS Lead Recovery System inspired by clean EdTech dashboards:
 * - Left Sidebar: Dashboard, Parent & Student Portal, 7-Day Lead Pipeline, Partner Campuses
 * - Top Navbar: Dynamic Greeting, Candidate/Campus Search, CSV Export, Theme Toggle
 * - 4 Stat Cards, SVG Charts, and Clean Status Tables
 */

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Globe,
  GraduationCap,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  Moon,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  TrendingUp,
  Users,
  Volume2,
  Wallet,
  X,
} from "lucide-react";

interface Campus {
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

interface Lead {
  id: number;
  student_name: string;
  parent_name: string;
  phone: string;
  state: string;
  city: string;
  exam_type: string;
  exam_rank: number;
  nat_score: number;
  budget_lakhs: number;
  preferred_language: string;
  primary_objection: string;
  matched_campus_id: number;
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

interface ToolTraceItem {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown>;
  latency_ms: number;
}

interface DispatchItem {
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

interface DashboardData {
  kpis: {
    total_leads: number;
    total_cac_saved_inr: number;
    avg_trust_score: number;
    cat_b_rescued: number;
    has_openrouter_key: boolean;
  };
  leads: Lead[];
  campuses: Campus[];
  toolLogs: Array<ToolTraceItem & { id: number; lead_id: number; created_at: string }>;
  dispatches: DispatchItem[];
}

const LANGUAGES = [
  "Telugu",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Bengali",
  "Odia",
  "English",
];

/** Maps UI language names to BCP-47 Indian regional voice/speech locales */
const SPEECH_LOCALE_MAP: Record<string, string> = {
  Telugu: "te-IN",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Marathi: "mr-IN",
  Gujarati: "gu-IN",
  Punjabi: "pa-IN",
  Bengali: "bn-IN",
  Odia: "or-IN",
  English: "en-IN",
};

const PRESET_SCENARIOS = [
  {
    label: "Telangana Parent (Telugu) — Is the B.Tech Degree Valid?",
    student_name: "Sai Charan",
    parent_name: "Venkateshwarlu",
    phone: "+91-9849012345",
    state: "Telangana",
    city: "Karimnagar",
    exam_type: "TS EAPCET",
    exam_rank: 39200,
    nat_score: 86,
    budget_lakhs: 13.0,
    preferred_language: "Telugu",
    primary_objection: "NIAT is not a university. Will my son get a valid UGC B.Tech degree for government exams or MS abroad?",
  },
  {
    label: "Delhi NCR Parent (Hindi) — Are Fees Worth It vs. Online Reviews?",
    student_name: "Rohan Verma",
    parent_name: "Sanjay Verma",
    phone: "+91-9810234567",
    state: "Delhi NCR",
    city: "Noida",
    exam_type: "JEE Main",
    exam_rank: 162000,
    nat_score: 81,
    budget_lakhs: 14.0,
    preferred_language: "Hindi",
    primary_objection: "Some online reviews say NIAT fees are high and jobs are not guaranteed. Why not join a normal local college?",
  },
  {
    label: "Tamil Nadu Parent (Tamil) — Can We Get a Scholarship?",
    student_name: "Kavya Subramanian",
    parent_name: "Subramanian R",
    phone: "+91-9840155667",
    state: "Tamil Nadu",
    city: "Madurai",
    exam_type: "12th Boards",
    exam_rank: 0,
    nat_score: 91,
    budget_lakhs: 12.5,
    preferred_language: "Tamil",
    primary_objection: "An admission agent told us there is no scholarship. Is there a real NAT merit waiver?",
  },
  {
    label: "Maharashtra Parent (Marathi) — Hostel Safety & Campus Life?",
    student_name: "Atharva Kulkarni",
    parent_name: "Prakash Kulkarni",
    phone: "+91-9822011223",
    state: "Maharashtra",
    city: "Pune",
    exam_type: "MHT-CET",
    exam_rank: 29500,
    nat_score: 83,
    budget_lakhs: 14.5,
    preferred_language: "Marathi",
    primary_objection: "How are the hostels, food, and campus facilities at Pune partner universities compared to regular colleges?",
  },
  {
    label: "Gujarat Student (Gujarati) — Low JEE Rank: Local College vs. NIAT?",
    student_name: "Dev Patel",
    parent_name: "Mahesh Patel",
    phone: "+91-9825044556",
    state: "Rajasthan",
    city: "Ahmedabad",
    exam_type: "JEE Main",
    exam_rank: 185000,
    nat_score: 85,
    budget_lakhs: 12.5,
    preferred_language: "Gujarati",
    primary_objection: "With a 1.85L JEE rank, I only get a local Tier-3 college. Is NIAT worth the extra investment for 4 years?",
  },
  {
    label: "Karnataka Parent (Kannada) — Are Placements Guaranteed?",
    student_name: "Ananya Gowda",
    parent_name: "Ramesh Gowda",
    phone: "+91-9845077889",
    state: "Karnataka",
    city: "Bengaluru",
    exam_type: "KCET",
    exam_rank: 34000,
    nat_score: 89,
    budget_lakhs: 14.5,
    preferred_language: "Kannada",
    primary_objection: "Does NIAT guarantee an ₹80 LPA job or internship, or how do placements actually work?",
  },
  {
    label: "Bihar Parent (Hindi) — Education Loan & Nearest Campus?",
    student_name: "Aman Kumar",
    parent_name: "Binod Kumar",
    phone: "+91-9431011223",
    state: "Bihar",
    city: "Patna",
    exam_type: "JEE Main",
    exam_rank: 140000,
    nat_score: 82,
    budget_lakhs: 11.5,
    preferred_language: "Hindi",
    primary_objection: "We are from Bihar. Which nearest partner campus fits an ₹11.5L budget and can we get a bank education loan?",
  },
  {
    label: "Andhra Pradesh Parent (Telugu) — First-Year Internships Real?",
    student_name: "Lakshmi Narayana",
    parent_name: "Srinivas Rao",
    phone: "+91-9848522334",
    state: "Andhra Pradesh",
    city: "Vijayawada",
    exam_type: "AP EAPCET",
    exam_rank: 46000,
    nat_score: 88,
    budget_lakhs: 11.0,
    preferred_language: "Telugu",
    primary_objection: "Do students really get internships in Year 1–2, or is it just marketing? Also explain the IIT Kharagpur course.",
  },
  {
    label: "West Bengal Parent (Bengali) — No Prior Coding Experience?",
    student_name: "Riddhi Chatterjee",
    parent_name: "Subrata Chatterjee",
    phone: "+91-9830066778",
    state: "West Bengal",
    city: "Kolkata",
    exam_type: "WBJEE",
    exam_rank: 31000,
    nat_score: 80,
    budget_lakhs: 12.0,
    preferred_language: "Bengali",
    primary_objection: "My daughter has never done coding in 11th–12th. Will she be able to cope with AI & ML from Day 1?",
  },
  {
    label: "Kerala Parent (Malayalam) — Campus Visit & Refund Policy?",
    student_name: "Nikhil Menon",
    parent_name: "Rajeev Menon",
    phone: "+91-9847033445",
    state: "Kerala",
    city: "Kochi",
    exam_type: "12th Boards (%)",
    exam_rank: 88,
    nat_score: 84,
    budget_lakhs: 13.5,
    preferred_language: "Malayalam",
    primary_objection: "Can we visit the Bengaluru/Coimbatore partner campus with our family before paying the Seat Reservation fee?",
  },
  {
    label: "Punjab Parent (Punjabi) — Drop-Year (2024/2025 Pass-Out) Eligible?",
    student_name: "Harpreet Singh",
    parent_name: "Gurpreet Singh",
    phone: "+91-9814055667",
    state: "Punjab",
    city: "Ludhiana",
    exam_type: "JEE Main",
    exam_rank: 155000,
    nat_score: 79,
    budget_lakhs: 12.0,
    preferred_language: "Punjabi",
    primary_objection: "My son passed 12th last year (drop year for JEE). Is he eligible for NAT and Haryana/NCR partner campuses?",
  },
  {
    label: "Uttar Pradesh Parent (Hindi) — Regular B.Tech Exams vs. NIAT?",
    student_name: "Aditya Mishra",
    parent_name: "Rakesh Mishra",
    phone: "+91-9415088990",
    state: "Uttar Pradesh",
    city: "Lucknow",
    exam_type: "CUET",
    exam_rank: 0,
    nat_score: 78,
    budget_lakhs: 11.0,
    preferred_language: "Hindi",
    primary_objection: "How does a student manage both university semester exams and NIAT coding classes without getting overloaded?",
  },
];

const CAMPUS_OFFICIAL_URLS: Record<string, string> = {
  "Noida International University": "https://niu.edu.in/",
  "Sushant University": "https://sushantuniversity.edu.in/",
  "Geeta University": "https://geetauniversity.edu.in/",
  "Scope Global Skills University": "https://sgsuniversity.ac.in/",
  "Alard University": "https://alarduniversity.edu.in/",
  "Ajeenkya DY Patil University": "https://adypu.edu.in/",
  "Sri Sri University": "https://srisriuniversity.edu.in/",
  "Vivekananda Global University": "https://vgu.ac.in/",
  "T.S. Mishra University": "https://tsm.edu.in/",
  "NSRIT": "https://nsrit.edu.in/",
  "GMR Institute of Technology": "https://gmrit.edu.in/",
  "Annamacharya University": "https://annamacharyauniversity.edu.in/",
  "S-VYASA (Deemed-to-be University)": "https://svyasa.edu.in/",
  "Yenepoya University (Bangalore)": "https://yenepoya.edu.in/",
  "Takshashila University": "https://takshashilauniv.ac.in/",
  "AMET University": "https://ametuniv.ac.in/",
  "B.S. Abdur Rahman Crescent Institute": "https://crescent.education/",
  "SNS College of Technology": "https://snsct.org/",
  "Chaitanya (Deemed to be University)": "https://chaitanya.edu.in/",
  "Malla Reddy Vishwavidyapeeth": "https://mrvv.edu.in/",
  "Aurora Deemed University": "https://aurora.edu.in/",
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "portal" | "pipeline" | "campuses">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [bulkReconciling, setBulkReconciling] = useState(false);
  const [stageFilter, setStageFilter] = useState<"ALL" | "AI_COUNSELLED" | "CAMPUS_VISIT_BOOKED" | "SEAT_RESERVED">("ALL");
  const [stageFilterOpen, setStageFilterOpen] = useState(false);
  const stageFilterRef = React.useRef<HTMLDivElement | null>(null);
  const [paymentsRange, setPaymentsRange] = useState<"Monthly" | "Weekly" | "Quarterly">("Monthly");
  const [paymentsRangeOpen, setPaymentsRangeOpen] = useState(false);
  const paymentsRangeRef = React.useRef<HTMLDivElement | null>(null);
  const [registrationsRange, setRegistrationsRange] = useState<"Monthly" | "Weekly" | "Quarterly">("Monthly");
  const [registrationsRangeOpen, setRegistrationsRangeOpen] = useState(false);
  const registrationsRangeRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (stageFilterRef.current && !stageFilterRef.current.contains(e.target as Node)) {
        setStageFilterOpen(false);
      }
      if (paymentsRangeRef.current && !paymentsRangeRef.current.contains(e.target as Node)) {
        setPaymentsRangeOpen(false);
      }
      if (registrationsRangeRef.current && !registrationsRangeRef.current.contains(e.target as Node)) {
        setRegistrationsRangeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Export Leads to CSV (all or selected)
  function handleExportCSV(onlySelected = false) {
    if (!dashboard?.leads || dashboard.leads.length === 0) return;
    const sourceLeads =
      onlySelected && selectedLeadIds.length > 0
        ? dashboard.leads.filter((l) => selectedLeadIds.includes(l.id))
        : dashboard.leads;
    if (sourceLeads.length === 0) return;
    const headers = ["ID", "Student Name", "Parent Name", "Phone", "Campus", "Category", "Language", "Trust Score", "Funnel Stage", "CAC Saved (INR)"];
    const rows = sourceLeads.map((l) => [
      l.id,
      `"${l.student_name}"`,
      `"${l.parent_name}"`,
      `"${l.phone}"`,
      `"${l.campus_name}"`,
      l.campus_category,
      l.preferred_language,
      `${l.trust_score}%`,
      l.funnel_stage,
      l.cac_saved_inr,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${onlySelected && selectedLeadIds.length > 0 ? "niat_leads_selected_" : "niat_leads_"}${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /** Bulk reconciles all checked leads to SEAT_RESERVED in Neon Postgres */
  async function handleBulkReconcile() {
    if (!dashboard?.leads || selectedLeadIds.length === 0) return;
    const pendingIds = dashboard.leads
      .filter((l) => selectedLeadIds.includes(l.id) && l.funnel_stage !== "SEAT_RESERVED")
      .map((l) => l.id);
    if (pendingIds.length === 0) {
      setSelectedLeadIds([]);
      return;
    }
    setBulkReconciling(true);
    try {
      await Promise.all(
        pendingIds.map((id) =>
          fetch(`/api/leads/${id}/stage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ funnel_stage: "SEAT_RESERVED", visit_slot: visitSlot }),
          })
        )
      );
      setSelectedLeadIds([]);
      await refreshDashboard();
    } finally {
      setBulkReconciling(false);
    }
  }

  const [greeting, setGreeting] = useState("Good Morning!");

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const currentHour = new Date().getHours();
      setGreeting(currentHour < 12 ? "Good Morning!" : currentHour < 17 ? "Good Afternoon!" : "Good Evening!");
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  const [lightMode, setLightMode] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [syncingDb, setSyncingDb] = useState(false);
  const [dbSynced, setDbSynced] = useState(false);

  async function handleManualDbSync() {
    if (syncingDb) return;
    setSyncingDb(true);
    setDbSynced(false);
    try {
      await refreshDashboard();
      setDbSynced(true);
      setTimeout(() => setDbSynced(false), 2000);
    } finally {
      setSyncingDb(false);
    }
  }

  // Student/Parent Intake Form State
  const [form, setForm] = useState<{
    label: string;
    student_name: string;
    parent_name: string;
    phone: string;
    state: string;
    city: string;
    exam_type: string;
    exam_rank: number | "";
    nat_score: number | "";
    budget_lakhs: number | "";
    preferred_language: string;
    primary_objection: string;
  }>(PRESET_SCENARIOS[0]);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumberOnly, setPhoneNumberOnly] = useState("9849012345");
  const [analyzing, setAnalyzing] = useState(false);

  // Active AI Analysis Result State
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [matchedCampus, setMatchedCampus] = useState<Campus | null>(null);
  const [agentResult, setAgentResult] = useState<{
    mode: string;
    model_used: string;
    trust_score: number;
    cac_saved_inr: number;
    parent_brief_native: string;
    whatsapp_message_native: string;
    closer_script_english: string;
    tool_trace: ToolTraceItem[];
  } | null>(null);

  // Vernacular Chat & Voice (TTS / STT) + WhatsApp State
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [listeningTarget, setListeningTarget] = useState<"objection" | "general" | "followup" | null>(null);
  const recognitionRef = React.useRef<{ stop: () => void } | null>(null);
  const [waMeUrl, setWaMeUrl] = useState<string | null>(null);
  const [waMode, setWaMode] = useState<string | null>(null);
  const [visitSlot, setVisitSlot] = useState("This Saturday, 11:00 AM IST");
  const [visitBooked, setVisitBooked] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);

  // Always-On Dynamic "Ask NIAT AI Anything" Jarvis Assistant Modal State (synced with global theme)
  const [assistantOpen, setAssistantOpen] = useState(false);
  const assistantTheme: "dark" | "light" = lightMode ? "light" : "dark";

  function toggleAssistantTheme() {
    setLightMode((prev) => !prev);
  }
  const [generalChat, setGeneralChat] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content:
        "Hi! I am your NIAT AI Guide. Ask me anything in plain words—about any of our 35+ partner colleges, total fees, NAT exam, UGC degree validity, or how NIAT compares to Scaler & Newton!",
    },
  ]);
  const [generalInput, setGeneralInput] = useState("");
  const [generalLoading, setGeneralLoading] = useState(false);
  const generalChatEndRef = React.useRef<HTMLDivElement | null>(null);
  const generalTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const followupChatEndRef = React.useRef<HTMLDivElement | null>(null);
  const followupTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = generalTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [generalInput, assistantOpen]);

  useEffect(() => {
    const el = followupTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [chatInput]);

  useEffect(() => {
    if (chatHistory.length > 1 || chatLoading) {
      followupChatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chatHistory, chatLoading]);

  useEffect(() => {
    if (assistantOpen) {
      generalChatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [generalChat, generalLoading, assistantOpen]);

  /** Formats **bold** markdown segments and line breaks cleanly without horizontal overflow */
  function renderFormattedMessage(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {parts.map((part, idx) =>
          part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
            <strong key={idx} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <React.Fragment key={idx}>{part}</React.Fragment>
          )
        )}
      </span>
    );
  }

  /** Sends any arbitrary question to the Neon-grounded Dynamic AI Assistant */
  async function handleGeneralAsk(questionText?: string) {
    const q = (questionText ?? generalInput).trim();
    if (!q || generalLoading) return;
    if (!questionText) setGeneralInput("");
    setGeneralChat((prev) => [...prev, { role: "user", content: q }]);
    setGeneralLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const res = await fetch("/api/agent/general-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question: q,
          language: form.preferred_language,
          history: generalChat,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneralChat((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } finally {
      setGeneralLoading(false);
    }
  }

  /** Speaks any specific brief or chat reply aloud using the most natural available voice */
  function toggleVoiceBrief(text: string, id: string = "brief") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();

    // Strip markdown formatting so TTS reads smoothly without awkward pauses
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/[*#_`]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const targetLang = SPEECH_LOCALE_MAP[form.preferred_language] || "en-IN";
    const baseLang = targetLang.split("-")[0];
    const voices = window.speechSynthesis.getVoices();

    // Prefer Google / Microsoft / Natural neural voices over basic robotic OS voices
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(targetLang.toLowerCase()) &&
          /google|natural|neural|microsoft/i.test(v.name)
      ) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.toLowerCase())) ||
      voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(baseLang.toLowerCase()) &&
          /google|natural|neural|microsoft/i.test(v.name)
      ) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(baseLang.toLowerCase())) ||
      voices.find((v) => /google/i.test(v.name));

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = targetLang;
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.12;
    utterance.pitch = 1.02;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  /** Immediately stops any active TTS playback */
  const stopVoicePlayback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  }, []);

  /** Stops both TTS playback and active mic recognition when assistant closes or unmounts */
  const stopAllVoice = useCallback(() => {
    stopVoicePlayback();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
    }
    setListeningTarget(null);
  }, [stopVoicePlayback]);

  function closeAssistant() {
    stopAllVoice();
    setAssistantOpen(false);
  }

  useEffect(() => {
    return () => {
      stopAllVoice();
    };
  }, [stopAllVoice]);

  /** Captures live multi-language voice input (Web Speech STT) with real-time interim transcription */
  function toggleVoiceInput(target: "objection" | "general" | "followup") {
    if (typeof window === "undefined") return;

    // Stop any playing voice output as soon as user clicks the mic button
    stopVoicePlayback();

    // Stop if already listening
    if (listeningTarget) {
      recognitionRef.current?.stop();
      setListeningTarget(null);
      return;
    }

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice recognition requires Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRec() as {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (ev: { results: ArrayLike<{ isFinal?: boolean; 0: { transcript: string } }> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };

    // Use en-IN as universal Indian speech recognition (handles English, Hinglish & Indian accents)
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    const baseObjection = form.primary_objection;
    const baseGeneral = generalInput;
    const baseFollowup = chatInput;

    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i]?.[0]?.transcript || "";
      }
      const clean = combined.trim();
      if (target === "objection") {
        setForm((prev) => ({
          ...prev,
          primary_objection: baseObjection ? `${baseObjection} ${clean}` : clean,
        }));
      } else if (target === "general") {
        setGeneralInput(baseGeneral ? `${baseGeneral} ${clean}` : clean);
      } else {
        setChatInput(baseFollowup ? `${baseFollowup} ${clean}` : clean);
      }
    };

    recognition.onerror = () => setListeningTarget(null);
    recognition.onend = () => setListeningTarget(null);
    recognitionRef.current = recognition;
    setListeningTarget(target);
    recognition.start();
  }

  /** Fetches live Neon Postgres data for the Growth Manager dashboard */
  const refreshDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard:", e);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Lock background page scrolling and close on Escape key when the Jarvis AI Assistant popup is open
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = assistantOpen ? "hidden" : "";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && assistantOpen) {
        setAssistantOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [assistantOpen]);

  /** Triggers the 4-component OpenRouter + Neon AI pipeline */
  async function handleRunAnalysis(e: React.FormEvent) {
    e.preventDefault();
    setAnalyzing(true);
    setVisitBooked(false);
    const fullPhone = `${countryCode}-${phoneNumberOnly.replace(/\D/g, "")}`;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const res = await fetch("/api/agent/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...form, phone: fullPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveLead(data.lead);
        setMatchedCampus(data.matched_campus);
        setAgentResult(data.agent);
        setWaMeUrl(data.whatsapp?.wa_me_url || null);
        setWaMode(data.whatsapp?.delivery_mode || null);
        setChatHistory([{ role: "assistant", content: data.agent.parent_brief_native }]);
        await refreshDashboard();
      }
    } finally {
      setAnalyzing(false);
    }
  }

  /** Sends a follow-up parent question to the Vernacular Counsellor API */
  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLead || !chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          lead_id: activeLead.id,
          message: msg,
          language: form.preferred_language,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setAgentResult((prev) => (prev ? { ...prev, trust_score: data.trust_score } : prev));
        // Refresh dashboard KPIs in background so UI responds immediately
        void refreshDashboard();
      }
    } finally {
      setChatLoading(false);
    }
  }

  /** Books a Campus Visit or marks Seat Reserved in Neon Postgres */
  async function handleStageUpdate(leadId: number, stage: string, slot?: string) {
    const res = await fetch(`/api/leads/${leadId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnel_stage: stage, visit_slot: slot || visitSlot }),
    });
    if (res.ok) {
      if (activeLead?.id === leadId) setVisitBooked(true);
      await refreshDashboard();
    }
  }

  return (
    <div
      data-theme={lightMode ? "light" : "dark"}
      className={`min-h-screen w-full overflow-x-hidden flex transition-colors duration-200 ${
        lightMode ? "light-theme hogwarts-parchment text-[#2A1C0E]" : "bg-[#090D16] text-slate-100"
      }`}
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sleek Sidebar: Warm Ivory/Gold in Light Mode, Dark Charcoal in Dark Mode */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r p-5 shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          lightMode
            ? "border-[#C9A24D]/45 bg-[#FFFDF7] text-[#2A1C0E]"
            : "preserve-dark border-slate-800/80 bg-[#141820] text-slate-200"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div
            className={`flex flex-col items-center text-center gap-3 border-b pb-5 ${
              lightMode ? "border-[#D7C6A7]" : "border-slate-800"
            }`}
          >
            <Image
              src="/niat-logo.png"
              alt="NIAT Logo"
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl border-2 border-[#C9A24D]/50 object-contain p-1 shadow-lg bg-[#8B1E24]"
            />
            <div>
              <div
                className={`text-lg font-bold leading-tight tracking-tight ${
                  lightMode ? "text-[#5C171B]" : "text-white"
                }`}
              >
                NIAT TrustBridge
              </div>
              <div className={`mt-0.5 text-xs font-medium ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                NxtWave Growth Engine
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div>
            <div
              className={`mb-2 px-3 text-[11px] font-bold uppercase tracking-wider ${
                lightMode ? "text-[#8C7355]" : "text-slate-500"
              }`}
            >
              Menu
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("dashboard");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeTab === "dashboard"
                    ? lightMode
                      ? "preserve-dark bg-[#6E1B20] text-white shadow-sm font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : lightMode
                    ? "text-[#4A3520] hover:bg-[#FAF0D7] hover:text-[#2A1C0E]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("portal");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeTab === "portal"
                    ? lightMode
                      ? "preserve-dark bg-[#6E1B20] text-white shadow-sm font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : lightMode
                    ? "text-[#4A3520] hover:bg-[#FAF0D7] hover:text-[#2A1C0E]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Bot className="h-4 w-4" />
                Parent &amp; Student Portal
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("pipeline");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeTab === "pipeline"
                    ? lightMode
                      ? "preserve-dark bg-[#6E1B20] text-white shadow-sm font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : lightMode
                    ? "text-[#4A3520] hover:bg-[#FAF0D7] hover:text-[#2A1C0E]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                7-Day Lead Pipeline
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("campuses");
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  activeTab === "campuses"
                    ? lightMode
                      ? "preserve-dark bg-[#6E1B20] text-white shadow-sm font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : lightMode
                    ? "text-[#4A3520] hover:bg-[#FAF0D7] hover:text-[#2A1C0E]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Partner Campuses
              </button>
            </nav>
          </div>

          {/* Quick Stats / General */}
          <div>
            <div
              className={`mb-2 px-3 text-[11px] font-bold uppercase tracking-wider ${
                lightMode ? "text-[#8C7355]" : "text-slate-500"
              }`}
            >
              General
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={handleManualDbSync}
                disabled={syncingDb}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium transition disabled:opacity-70 ${
                  lightMode
                    ? "text-[#4A3520] hover:bg-[#FAF0D7] hover:text-[#2A1C0E]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingDb ? "animate-spin" : ""}`} />
                  {syncingDb ? "Syncing..." : dbSynced ? "Synced ✓" : "Sync Neon DB"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    lightMode
                      ? "bg-[#FAF0D7] border border-[#C9A24D]/50 text-[#5C171B]"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {dashboard?.kpis.total_leads ?? 0}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* User Card at Bottom of Sidebar */}
        <div
          className={`rounded-2xl border p-3 ${
            lightMode ? "border-[#D7C6A7] bg-[#FAF0D7]/70" : "border-slate-800 bg-slate-900/70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs ${
                lightMode ? "bg-[#6E1B20] text-[#F3D283]" : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              GM
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-xs font-bold ${lightMode ? "text-[#2A1C0E]" : "text-white"}`}>
                Growth Manager
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${lightMode ? "bg-emerald-600" : "bg-emerald-400"}`}></span>
                Neon Postgres Active
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur px-3.5 py-3 sm:px-8 sm:py-4 ${
            lightMode ? "border-[#C9A24D]/45 bg-[#FFFDF7]/92" : "border-slate-800 bg-[#090D16]/90"
          }`}
        >
          <div className="flex items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={`shrink-0 rounded-xl border p-2 sm:p-2.5 lg:hidden ${
                  lightMode ? "border-[#C9A24D]/60 text-[#3B2610]" : "border-slate-700 text-slate-300"
                }`}
                title="Open Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className={`truncate text-base font-bold sm:text-xl tracking-tight ${lightMode ? "text-[#2A1C0E]" : "text-white"}`}>
                    Hello Growth Team 👋
                  </h1>
                </div>
                <div className={`truncate text-[11px] sm:text-sm ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                  {greeting} · 7-Day Lead Recovery Engine
                </div>
              </div>
            </div>

            {/* Search Bar (shown on Lead Pipeline & Partner Campuses where filtering applies) */}
            {(activeTab === "pipeline" || activeTab === "campuses") && (
              <div className="relative min-w-[260px] flex-1 max-w-lg hidden sm:block">
                <Search className={`absolute left-3.5 top-3 h-4 w-4 ${lightMode ? "text-[#8C7355]" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="Search candidate, campus, state, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none ${
                    lightMode
                      ? "border-[#C9A24D]/70 bg-[#FAF0D7]/60 text-[#2A1C0E] placeholder-[#8C7355] focus:border-[#6E1B20]"
                      : "border-slate-700 bg-slate-900 text-slate-200 focus:border-emerald-500"
                  }`}
                />
              </div>
            )}

            {/* Right Tools */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setLightMode(!lightMode)}
                className={`flex cursor-pointer items-center justify-center rounded-xl border p-2.5 text-sm transition hover:-translate-y-0.5 hover:shadow-sm ${
                  lightMode
                    ? "border-[#C9A24D]/70 bg-[#FAF0D7] text-[#3B2610] hover:bg-[#F0DCAD]"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                }`}
                title="Toggle Dashboard Theme"
              >
                {lightMode ? <Moon className="h-4.5 w-4.5 text-[#6E1B20]" /> : <Sun className="h-4.5 w-4.5 text-amber-400" />}
              </button>

              {activeTab === "dashboard" && (
                <button
                  type="button"
                  onClick={() => handleExportCSV(false)}
                  className={`hidden sm:flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${
                    lightMode
                      ? "border-[#C9A24D]/70 bg-[#FAF0D7] text-[#3B2610] hover:bg-[#F0DCAD]"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                  }`}
                  title="Export CSV"
                >
                  <Download className={`h-4 w-4 ${lightMode ? "text-[#6E1B20]" : "text-emerald-400"}`} />
                  Export CSV
                </button>
              )}

            </div>
          </div>
        </header>

        {/* Dynamic Main Views */}
        <main className="flex-1 p-3 sm:p-8 pb-28 sm:pb-28 max-w-[1600px] w-full mx-auto">
          {/* VIEW 1: PARENT & STUDENT PORTAL (Hogwarts / Wizarding World Edition - Light Parchment & Dark Starry Night) */}
          {activeTab === "portal" && (
            <div
              className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-8 shadow-2xl space-y-6 sm:space-y-8 transition-colors ${
                lightMode
                  ? "hogwarts-parchment border-[#C9A24D]/50 text-slate-900"
                  : "hogwarts-stars border-[#D4AF37]/30 text-slate-100"
              }`}
            >
              {/* Top Hogwarts Crest Hero Banner (Light Parchment Box in Light Mode | Starry Night in Dark Mode) */}
              <div
                style={lightMode ? undefined : { backgroundColor: "#0C1020" }}
                className={`rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between transition-colors ${
                  lightMode
                    ? "hogwarts-scroll-card-light text-slate-900"
                    : "preserve-dark hogwarts-stars border border-[#D4AF37]/35 text-white"
                }`}
              >
                <div className="max-w-2xl space-y-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wider uppercase ${
                      lightMode
                        ? "border-[#C9A24D] bg-[#FAF1DC] text-[#7A5410]"
                        : "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F3D283]"
                    }`}
                  >
                    <GraduationCap className={`h-4 w-4 ${lightMode ? "text-[#7A5410]" : "text-[#E6C567]"}`} />
                    NIAT · NxtWave 4-Year On-Campus Upskilling + UGC B.Tech
                  </span>
                  <h2
                    className={`font-hogwarts text-2xl font-bold tracking-wide sm:text-4xl leading-snug ${
                      lightMode ? "text-[#1A1F36]" : "text-white"
                    }`}
                  >
                    Create Your{" "}
                    <span className={lightMode ? "text-[#9A6B16]" : "text-[#E6C567]"}>
                      Student &amp; Parent
                    </span>{" "}
                    Admission Profile
                  </h2>
                  <p className={`text-sm sm:text-base leading-relaxed ${lightMode ? "text-slate-700" : "text-slate-200/90"}`}>
                    Verify official university accreditation, calculate honest 4-year fees &amp; NAT scholarships, and listen in your preferred Indian language.
                  </p>
                </div>

                <div
                  className={`flex flex-wrap items-center gap-6 sm:gap-8 rounded-2xl border px-6 py-4 ${
                    lightMode
                      ? "border-[#C9A24D]/50 bg-[#FAF6EC]"
                      : "border-[#D4AF37]/25 bg-black/35 backdrop-blur-sm"
                  }`}
                >
                  <div className="text-center">
                    <div className={`font-hogwarts text-2xl sm:text-3xl font-bold ${lightMode ? "text-[#8A5A12]" : "text-[#E6C567]"}`}>
                      35+
                    </div>
                    <div className={`text-[11px] font-bold uppercase tracking-widest ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                      Campuses
                    </div>
                  </div>
                  <div className={`h-8 w-px hidden sm:block ${lightMode ? "bg-[#C9A24D]/40" : "bg-[#D4AF37]/25"}`} />
                  <div className="text-center">
                    <div className={`font-hogwarts text-2xl sm:text-3xl font-bold ${lightMode ? "text-[#8A5A12]" : "text-[#E6C567]"}`}>
                      100%
                    </div>
                    <div className={`text-[11px] font-bold uppercase tracking-widest ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                      UGC Valid
                    </div>
                  </div>
                  <div className={`h-8 w-px hidden sm:block ${lightMode ? "bg-[#C9A24D]/40" : "bg-[#D4AF37]/25"}`} />
                  <div className="text-center">
                    <div className={`font-hogwarts text-2xl sm:text-3xl font-bold ${lightMode ? "text-[#8A5A12]" : "text-[#E6C567]"}`}>
                      11
                    </div>
                    <div className={`text-[11px] font-bold uppercase tracking-widest ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                      Languages
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
                {/* LEFT COLUMN: Two Distinct, Well-Spaced Cards (FAQs Card + Student Profile Form Card) */}
                <div className="lg:col-span-5 space-y-8">
                  {/* CARD 1: Quick Parent FAQs & Scenarios */}
                  <section
                    className={`rounded-2xl p-6 sm:p-7 space-y-4 transition-colors ${
                      lightMode
                        ? "hogwarts-scroll-card-light text-slate-900"
                        : "hogwarts-scroll-card-dark text-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[#C9A24D]/30 pb-3.5">
                      <div>
                        <h3 className={`font-hogwarts text-lg font-bold tracking-wide ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                          1. Common Parent Questions
                        </h3>
                        <p className={`mt-0.5 text-sm ${lightMode ? "text-slate-600" : "text-slate-300"}`}>
                          Select any real parent scenario to auto-fill
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                          lightMode
                            ? "border-[#C9A24D] bg-[#FAF1DC] text-[#7A5410]"
                            : "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F3D283]"
                        }`}
                      >
                        {PRESET_SCENARIOS.length} Presets
                      </span>
                    </div>

                    <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1.5">
                      {[...PRESET_SCENARIOS]
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map((preset, idx) => {
                          const isSelected = form.label === preset.label;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setForm(preset);
                                const parts = preset.phone.split("-");
                                if (parts.length === 2) {
                                  setCountryCode(parts[0]);
                                  setPhoneNumberOnly(parts[1]);
                                }
                              }}
                              className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-medium leading-snug transition ${
                                isSelected
                                  ? lightMode
                                    ? "border-[#5B4CE6] bg-[#5B4CE6]/10 text-[#1A1F36] font-bold shadow-xs"
                                    : "border-[#E6C567] bg-[#E6C567]/15 text-white font-bold"
                                  : lightMode
                                  ? "border-[#DFD2B5] bg-[#FAF6EC] text-slate-800 hover:border-[#C9A24D] hover:bg-[#F5ECD7]"
                                  : "border-slate-700/80 bg-[#0D1120] text-slate-200 hover:border-[#D4AF37]/60 hover:bg-[#192038]"
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            label: "__CUSTOM__",
                            student_name: "",
                            parent_name: "",
                            phone: "",
                            state: "",
                            city: "",
                            exam_type: "",
                            exam_rank: "",
                            nat_score: "",
                            budget_lakhs: "",
                            preferred_language: "English",
                            primary_objection: "",
                          });
                          setPhoneNumberOnly("");
                        }}
                        className={`w-full cursor-pointer rounded-xl border-2 border-dashed px-4 py-3 text-left text-sm font-bold transition ${
                          form.label === "__CUSTOM__"
                            ? lightMode
                              ? "border-[#5B4CE6] bg-[#5B4CE6]/10 text-[#3E32B8]"
                              : "border-[#E6C567] bg-[#E6C567]/15 text-[#F3D283]"
                            : lightMode
                            ? "border-[#C9A24D] bg-white text-[#7A5410] hover:bg-[#FAF1DC]"
                            : "border-[#D4AF37]/40 bg-[#0D1120] text-[#F3D283] hover:border-[#E6C567]"
                        }`}
                      >
                        ✨ Ask Your Own Question
                      </button>
                    </div>
                  </section>

                  {/* CARD 2: Student & Parent Profile Form (Separate Card with Generous Gap) */}
                  <section
                    className={`rounded-2xl p-6 sm:p-7 space-y-5 transition-colors ${
                      lightMode
                        ? "hogwarts-scroll-card-light text-slate-900"
                        : "hogwarts-scroll-card-dark text-slate-100"
                    }`}
                  >
                    <div className="border-b border-[#C9A24D]/30 pb-3.5">
                      <h3 className={`font-hogwarts text-lg font-bold tracking-wide ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                        2. Student &amp; Parent Details
                      </h3>
                      <p className={`mt-0.5 text-sm ${lightMode ? "text-slate-600" : "text-slate-300"}`}>
                        Enter your child&apos;s academic profile &amp; language
                      </p>
                    </div>

                    <form onSubmit={handleRunAnalysis} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            Student Name
                          </label>
                          <input
                            required
                            value={form.student_name}
                            onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            Parent Name
                          </label>
                          <input
                            required
                            value={form.parent_name}
                            onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                          Parent WhatsApp Number{" "}
                          <span className={`text-xs font-normal ${lightMode ? "text-[#7A5410]" : "text-[#F3D283]"}`}>
                            (For sending brief)
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className={`shrink-0 w-24 sm:w-28 rounded-xl border px-2 py-2.5 text-sm sm:text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          >
                            <option value="+91">+91 (IN)</option>
                            <option value="+971">+971 (AE)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+65">+65 (SG)</option>
                          </select>
                          <input
                            required
                            type="tel"
                            value={phoneNumberOnly}
                            onChange={(e) => setPhoneNumberOnly(e.target.value.replace(/[^\d]/g, ""))}
                            placeholder="9876543210"
                            className={`min-w-0 w-full flex-1 rounded-xl border px-3 py-2.5 text-sm sm:text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            State / Region
                          </label>
                          <select
                            required
                            value={form.state}
                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          >
                            <option value="">Select State / UT...</option>
                            {[
                              "Andhra Pradesh",
                              "Arunachal Pradesh",
                              "Assam",
                              "Bihar",
                              "Chhattisgarh",
                              "Delhi NCR",
                              "Goa",
                              "Gujarat",
                              "Haryana",
                              "Himachal Pradesh",
                              "Jharkhand",
                              "Karnataka",
                              "Kerala",
                              "Madhya Pradesh",
                              "Maharashtra",
                              "Manipur",
                              "Meghalaya",
                              "Mizoram",
                              "Nagaland",
                              "Odisha",
                              "Punjab",
                              "Rajasthan",
                              "Sikkim",
                              "Tamil Nadu",
                              "Telangana",
                              "Tripura",
                              "Uttar Pradesh",
                              "Uttarakhand",
                              "West Bengal",
                              "Andaman and Nicobar Islands (UT)",
                              "Chandigarh (UT)",
                              "Dadra and Nagar Haveli and Daman and Diu (UT)",
                              "Jammu and Kashmir (UT)",
                              "Ladakh (UT)",
                              "Lakshadweep (UT)",
                              "Puducherry (UT)",
                            ].map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            Parent Language
                          </label>
                          <select
                            value={form.preferred_language}
                            onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          >
                            {LANGUAGES.map((lang) => (
                              <option key={lang} value={lang}>
                                {lang}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            Entrance Exam
                          </label>
                          <select
                            required
                            value={form.exam_type}
                            onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                            className={`w-full rounded-xl border px-3 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          >
                            <option value="">Select Exam...</option>
                            {[
                              "JEE Main",
                              "JEE Advanced",
                              "TS EAPCET",
                              "AP EAPCET",
                              "KCET",
                              "MHT-CET",
                              "WBJEE",
                              "COMEDK",
                              "CUET",
                              "VITEEE",
                              "SRMJEEE",
                              "BITSAT",
                              "12th Boards (%)",
                              "Other State CET",
                            ].map((ex) => (
                              <option key={ex} value={ex}>
                                {ex}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            Exam Rank / %{" "}
                            <span className="text-xs font-normal text-slate-400">(0 if N/A)</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.exam_rank}
                            onChange={(e) =>
                              setForm({ ...form, exam_rank: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                            placeholder="e.g. 42000"
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            NAT Test Score (/100)
                          </label>
                          <input
                            required
                            type="number"
                            min={1}
                            max={100}
                            value={form.nat_score}
                            onChange={(e) =>
                              setForm({ ...form, nat_score: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                            placeholder="e.g. 82"
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`mb-1.5 block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            Budget (₹ Lakhs)
                          </label>
                          <input
                            required
                            type="number"
                            step="0.5"
                            min={8}
                            max={22}
                            value={form.budget_lakhs}
                            onChange={(e) =>
                              setForm({ ...form, budget_lakhs: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                            placeholder="e.g. 12.5"
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <label className={`block text-sm font-semibold ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                            Parent&apos;s Question / Doubt
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleVoiceInput("objection")}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold transition ${
                              listeningTarget === "objection"
                                ? "border-rose-500 bg-rose-50 text-rose-600 animate-pulse"
                                : lightMode
                                ? "border-[#C9A24D] bg-[#FAF1DC] text-[#7A5410] hover:bg-[#F3E3BD]"
                                : "border-[#D4AF37]/40 bg-[#0C1020] text-[#F3D283] hover:border-[#E6C567]"
                            }`}
                          >
                            {listeningTarget === "objection" ? (
                              <>
                                <MicOff className="h-3.5 w-3.5" /> Listening...
                              </>
                            ) : (
                              <>
                                <Mic className="h-3.5 w-3.5" /> Speak Doubt
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={form.primary_objection}
                          onChange={(e) => setForm({ ...form, primary_objection: e.target.value })}
                          placeholder="Optional: Type or click Speak Doubt (any language)..."
                          suppressHydrationWarning
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-base focus:border-[#C9A24D] focus:outline-none ${
                            lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-[#0C1020] text-white"
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={analyzing}
                        className="preserve-dark flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#5B4CE6] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#5B4CE6]/25 transition hover:bg-[#4B3CD6] disabled:opacity-60"
                      >
                        <Sparkles className="h-4 w-4 text-[#F3D283]" />
                        {analyzing ? "Preparing University & Fee Brief..." : "Get Verified University & Fee Brief"}
                      </button>
                    </form>
                  </section>
                </div>

                {/* RIGHT COLUMN: Hogwarts Acceptance Letter / Parent Trust Scroll */}
                <section className="lg:col-span-7 space-y-6">
                  {!agentResult ? (
                    <div
                      className={`flex h-full min-h-[620px] flex-col items-center justify-center rounded-2xl p-8 sm:p-10 text-center transition-colors ${
                        lightMode
                          ? "hogwarts-scroll-card-light text-slate-900"
                          : "hogwarts-scroll-card-dark text-slate-100"
                      }`}
                    >
                      <div
                        className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 ${
                          lightMode ? "border-[#C9A24D] bg-[#FAF1DC]" : "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                        }`}
                      >
                        <GraduationCap className={`h-10 w-10 ${lightMode ? "text-[#7A5410]" : "text-[#E6C567]"}`} />
                      </div>
                      <h3 className={`font-hogwarts text-2xl sm:text-3xl font-bold ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                        Your Personalized University &amp; Fee Guide
                      </h3>
                      <p className={`mt-4 max-w-xl text-center text-base leading-relaxed ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        If you are exploring the best engineering campus for your child, select any parent scenario or fill in your details on the left. Our counselor engine will verify UGC degree validity, calculate exact NAT scholarships, and prepare a clear family brief.
                      </p>

                      {/* 4 Friendly Steps */}
                      <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
                        <div className={`rounded-xl border p-4 ${lightMode ? "border-[#DFD2B5] bg-[#FAF6EC]" : "border-slate-800 bg-[#0C1020]"}`}>
                          <div className={`flex items-center gap-2 text-sm font-bold ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                            <Building2 className="h-4 w-4 text-[#C9A24D]" />
                            1. Best-Fit University
                          </div>
                          <p className={`mt-1.5 text-sm leading-snug ${lightMode ? "text-slate-600" : "text-slate-400"}`}>
                            Matches your state, exam rank &amp; budget with UGC-approved campuses.
                          </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${lightMode ? "border-[#DFD2B5] bg-[#FAF6EC]" : "border-slate-800 bg-[#0C1020]"}`}>
                          <div className={`flex items-center gap-2 text-sm font-bold ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                            <Wallet className="h-4 w-4 text-[#C9A24D]" />
                            2. Clear 4-Year Fee &amp; Scholarship
                          </div>
                          <p className={`mt-1.5 text-sm leading-snug ${lightMode ? "text-slate-600" : "text-slate-400"}`}>
                            Shows exact net tuition after NAT merit scholarship — zero hidden fees.
                          </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${lightMode ? "border-[#DFD2B5] bg-[#FAF6EC]" : "border-slate-800 bg-[#0C1020]"}`}>
                          <div className={`flex items-center gap-2 text-sm font-bold ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                            <ShieldCheck className="h-4 w-4 text-[#C9A24D]" />
                            3. Real Student Outcomes
                          </div>
                          <p className={`mt-1.5 text-sm leading-snug ${lightMode ? "text-slate-600" : "text-slate-400"}`}>
                            Verified projects &amp; internship proofs from students in your region.
                          </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${lightMode ? "border-[#DFD2B5] bg-[#FAF6EC]" : "border-slate-800 bg-[#0C1020]"}`}>
                          <div className={`flex items-center gap-2 text-sm font-bold ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                            <Globe className="h-4 w-4 text-[#C9A24D]" />
                            4. Audio Brief in Your Language
                          </div>
                          <p className={`mt-1.5 text-sm leading-snug ${lightMode ? "text-slate-600" : "text-slate-400"}`}>
                            Listen as a voice note or send directly to your family WhatsApp.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAssistantOpen(true)}
                        className={`mt-7 flex cursor-pointer items-center gap-2 rounded-full border-2 px-7 py-3 text-sm font-bold uppercase tracking-wider transition ${
                          lightMode
                            ? "border-[#1A1F36] bg-white text-[#1A1F36] hover:bg-[#1A1F36] hover:text-white"
                            : "border-[#E6C567] bg-[#0C1020] text-[#E6C567] hover:bg-[#E6C567] hover:text-slate-950"
                        }`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Ask Our NIAT AI Counselor
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl p-6 sm:p-7 space-y-6 transition-colors ${
                        lightMode
                          ? "hogwarts-scroll-card-light text-slate-900"
                          : "hogwarts-scroll-card-dark text-slate-100"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C9A24D]/30 pb-5">
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-widest ${lightMode ? "text-[#7A5410]" : "text-[#F3D283]"}`}>
                            {matchedCampus?.category === "CAT-B"
                              ? "Expansion Partner Campus · Scholarship Priority"
                              : "Established Partner University"}
                          </span>
                          <h3 className={`font-hogwarts mt-1 text-xl sm:text-2xl font-bold ${lightMode ? "text-[#1A1F36]" : "text-white"}`}>
                            {matchedCampus?.name} — {matchedCampus?.city}
                          </h3>
                          <p className={`mt-0.5 text-sm ${lightMode ? "text-slate-600" : "text-slate-300"}`}>
                            {matchedCampus?.ugc_status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-xl border px-4 py-2.5 text-center ${
                              lightMode ? "border-emerald-300 bg-emerald-50" : "border-emerald-500/30 bg-emerald-500/10"
                            }`}
                          >
                            <div className={`text-[11px] font-bold uppercase ${lightMode ? "text-emerald-800" : "text-emerald-300"}`}>
                              Trust Score
                            </div>
                            <div className={`text-xl font-extrabold ${lightMode ? "text-emerald-900" : "text-emerald-400"}`}>
                              {agentResult.trust_score}/100
                            </div>
                          </div>
                          <div
                            className={`rounded-xl border px-4 py-2.5 text-center ${
                              lightMode ? "border-[#C9A24D] bg-[#FAF1DC]" : "border-[#D4AF37]/40 bg-[#D4AF37]/10"
                            }`}
                          >
                            <div className={`text-[11px] font-bold uppercase ${lightMode ? "text-[#7A5410]" : "text-[#F3D283]"}`}>
                              Est. 4-Yr Fee
                            </div>
                            <div className={`text-xl font-extrabold ${lightMode ? "text-[#1A1F36]" : "text-white"}`}>
                              ₹{matchedCampus?.estimated_4yr_fee_lakhs}L
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Native Language Parent Brief + Voice-Note TTS */}
                      <div
                        className={`rounded-xl border p-5 ${
                          lightMode ? "border-[#DFD2B5] bg-[#FAF6EC]" : "border-slate-800 bg-[#0C1020]"
                        }`}
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className={`flex items-center gap-2 text-sm font-bold ${lightMode ? "text-[#1A1F36]" : "text-[#E6C567]"}`}>
                            <Globe className="h-4 w-4 text-[#C9A24D]" />
                            Parent Trust Brief ({form.preferred_language})
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleVoiceBrief(agentResult.parent_brief_native, "brief")}
                            className="preserve-dark flex cursor-pointer items-center gap-1.5 rounded-full bg-[#5B4CE6] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4B3CD6]"
                          >
                            {speakingId === "brief" ? (
                              <>
                                <Square className="h-3.5 w-3.5 text-rose-200" /> Stop Voice Note
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4 text-[#F3D283]" /> Play Voice Note ({form.preferred_language})
                              </>
                            )}
                          </button>
                        </div>
                        <p className={`whitespace-pre-line text-base leading-relaxed ${lightMode ? "text-slate-800" : "text-slate-200"}`}>
                          {agentResult.parent_brief_native}
                        </p>
                      </div>

                      {/* Multi-Turn Vernacular Parent Chat */}
                      <div
                        className={`rounded-2xl border p-3.5 sm:p-6 space-y-3 sm:space-y-4 ${
                          lightMode
                            ? "border-[#C9A24D]/70 bg-[#FFFDF7]"
                            : "border-[#D4AF37]/30 bg-[#0C1020]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                          <span
                            className={`font-hogwarts flex items-center gap-2 text-base sm:text-lg font-bold ${
                              lightMode ? "text-[#5C171B]" : "text-[#F0D078]"
                            }`}
                          >
                            <MessageSquare className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${lightMode ? "text-[#6E1B20]" : "text-[#D4AF37]"}`} />
                            Ask Follow-Up Doubts
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs sm:text-sm font-semibold ${lightMode ? "text-[#3B2610]" : "text-[#C8B89A]"}`}>
                              Reply in:
                            </span>
                            <select
                              value={form.preferred_language}
                              onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                              className={`rounded-xl border px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold focus:outline-none ${
                                lightMode
                                  ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610]"
                                  : "border-[#8C6828] bg-[#1D1417] text-[#F0D078]"
                              }`}
                            >
                              {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                  {lang}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div
                          className={`max-h-80 space-y-3 overflow-y-auto overflow-x-hidden rounded-2xl border p-2.5 sm:p-4 ${
                            lightMode
                              ? "border-[#C9A24D]/60 bg-[#EFE0BC]/35"
                              : "border-[#8C6828]/40 bg-[#0B0709]/80"
                          }`}
                        >
                          {chatHistory.slice(1).map((m, idx) => {
                            const msgVoiceId = `followup-${idx}`;
                            return (
                              <div
                                key={idx}
                                className={`rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3.5 text-sm sm:text-base leading-relaxed ${
                                  m.role === "user"
                                    ? lightMode
                                      ? "ml-4 sm:ml-10 border-[#C9A24D] bg-[#EED18E] text-[#2A1C0E] shadow-xs"
                                      : "ml-4 sm:ml-10 border-[#8C3238] bg-[#4E1519] text-[#FFF5F5]"
                                    : lightMode
                                    ? "mr-0 sm:mr-6 border-[#C9A24D]/70 bg-[#FFFDF6] text-[#2A1C0E] shadow-xs"
                                    : "mr-0 sm:mr-6 border-[#8C6828]/45 bg-[#181113] text-[#F5EAD4]"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                                  <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                                    <span
                                      className={`mr-2 font-bold ${
                                        m.role === "user"
                                          ? lightMode
                                            ? "text-[#5C171B]"
                                            : "text-[#F0D078]"
                                          : lightMode
                                          ? "text-[#6E1B20]"
                                          : "text-[#F0D078]"
                                      }`}
                                    >
                                      {m.role === "user" ? `${form.parent_name}:` : "Counselor:"}
                                    </span>
                                    {renderFormattedMessage(m.content)}
                                  </div>
                                  {m.role === "assistant" && (
                                    <button
                                      type="button"
                                      onClick={() => toggleVoiceBrief(m.content, msgVoiceId)}
                                      title="Play voice note for this reply"
                                      className={`self-start shrink-0 flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                                        lightMode
                                          ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610] hover:bg-[#F0DCAD]"
                                          : "border-[#8C6828] bg-[#1D1417] text-[#F0D078] hover:border-[#F0D078]"
                                      }`}
                                    >
                                      {speakingId === msgVoiceId ? (
                                        <>
                                          <Square className="h-3 w-3 text-rose-500" /> Stop
                                        </>
                                      ) : (
                                        <>
                                          <Volume2 className={`h-3.5 w-3.5 ${lightMode ? "text-[#6E1B20]" : "text-[#F0D078]"}`} /> Voice
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {chatLoading && (
                            <div
                              className={`mr-0 sm:mr-6 rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 text-sm ${
                                lightMode
                                  ? "border-[#C9A24D]/70 bg-[#FFFDF6] text-[#5C4426]"
                                  : "border-[#8C6828]/45 bg-[#181113] text-[#C8B89A]"
                              }`}
                            >
                              <span className={`mr-2 font-bold ${lightMode ? "text-[#6E1B20]" : "text-[#F0D078]"}`}>
                                Counselor:
                              </span>
                              <span className="animate-pulse">Thinking...</span>
                            </div>
                          )}
                          <div ref={followupChatEndRef} />
                        </div>

                        <form
                          onSubmit={handleSendChat}
                          className={`flex items-end gap-1.5 sm:gap-2 rounded-2xl border p-1.5 sm:p-2 transition focus-within:ring-1 ${
                            lightMode
                              ? "border-[#A67C2E] bg-[#FFFDF6] focus-within:border-[#6E1B20] focus-within:ring-[#6E1B20]/30"
                              : "border-[#8C6828] bg-[#181113] focus-within:border-[#F0D078] focus-within:ring-[#F0D078]/30"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleVoiceInput("followup")}
                            title={`Speak in ${form.preferred_language}`}
                            className={`shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-xl border text-sm transition ${
                              listeningTarget === "followup"
                                ? "border-rose-500 bg-rose-500/20 text-rose-500 animate-pulse"
                                : lightMode
                                ? "border-[#A67C2E]/60 bg-[#FAF0D7] text-[#6E1B20] hover:bg-[#F0DCAD]"
                                : "border-[#8C6828]/60 bg-[#1D1417] text-[#F0D078] hover:border-[#F0D078]"
                            }`}
                          >
                            {listeningTarget === "followup" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </button>
                          <textarea
                            ref={followupTextareaRef}
                            rows={1}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChat(e as unknown as React.FormEvent);
                              }
                            }}
                            placeholder={`Ask in ${form.preferred_language}...`}
                            className={`min-h-[36px] sm:min-h-[40px] max-h-36 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1.5 sm:px-2 py-1.5 sm:py-2 text-sm sm:text-base leading-relaxed focus:outline-none ${
                              lightMode
                                ? "text-[#2A1C0E] placeholder-[#8C7355]"
                                : "text-[#F5EAD4] placeholder-[#8C7A65]"
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={chatLoading || !chatInput.trim()}
                            className="preserve-dark shrink-0 flex h-9 sm:h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#C9A24D]/50 bg-[#6E1B20] px-3 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-[#571317] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {chatLoading ? "..." : "Ask"}
                          </button>
                        </form>
                      </div>

                      {/* Campus Visit Booking + Automated WhatsApp Dispatch */}
                      <div
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                          lightMode ? "border-[#DFD2B5] bg-[#FAF6EC]" : "border-slate-800 bg-[#0C1020]"
                        }`}
                      >
                        <div>
                          <div className={`flex items-center gap-2 text-sm font-bold ${lightMode ? "text-[#1A1F36]" : "text-white"}`}>
                            <span>Book Campus Visit / 1:1 Parent Call</span>
                            {waMode && (
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  lightMode ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/15 text-emerald-300"
                                }`}
                              >
                                {waMode === "meta-cloud-live" ? "Sent via Meta API" : "WhatsApp Ready"}
                              </span>
                            )}
                          </div>
                          <div className={`mt-0.5 text-xs ${lightMode ? "text-slate-600" : "text-slate-400"}`}>
                            WhatsApp brief prepared for {countryCode}-{phoneNumberOnly || "9876543210"}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          {waMeUrl && (
                            <a
                              href={waMeUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                navigator.clipboard.writeText(agentResult.whatsapp_message_native);
                                setCopiedWa(true);
                                setTimeout(() => setCopiedWa(false), 3000);
                              }}
                              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold ${
                                lightMode
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                              }`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Send on WhatsApp
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(agentResult.whatsapp_message_native);
                              setCopiedWa(true);
                              setTimeout(() => setCopiedWa(false), 2000);
                            }}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                              lightMode
                                ? "border-[#D5C5A1] bg-white text-slate-700 hover:bg-slate-50"
                                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            {copiedWa ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedWa ? "Copied!" : "Copy Msg"}
                          </button>
                          <select
                            value={visitSlot}
                            onChange={(e) => setVisitSlot(e.target.value)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                              lightMode ? "border-[#D5C5A1] bg-white text-slate-900" : "border-slate-700 bg-slate-900 text-white"
                            }`}
                          >
                            <option>This Saturday, 11:00 AM IST</option>
                            <option>This Sunday, 4:00 PM IST</option>
                            <option>Tomorrow, 5:30 PM (1:1 Video)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => activeLead && handleStageUpdate(activeLead.id, "CAMPUS_VISIT_BOOKED", visitSlot)}
                            className="preserve-dark flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#C59B48] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#B08735]"
                          >
                            <CalendarCheck className="h-4 w-4" />
                            {visitBooked ? "Visit Booked!" : "Book Visit"}
                          </button>
                        </div>
                        {visitBooked && (
                          <div
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm ${
                              lightMode
                                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            }`}
                          >
                            ✅ <strong>Campus Visit Confirmed</strong> for <strong>{visitSlot}</strong> — saved to Neon Postgres, Parent Trust Score boosted, and visible in the <strong>Dashboard</strong>!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* VIEW 2: DASHBOARD (MATCHING IMAGE 1 REFERENCE - Full Light & Dark Mode) */}
          {activeTab === "dashboard" && (() => {
            const allLeads = dashboard?.leads ?? [];
            const filteredLeads =
              stageFilter === "ALL" ? allLeads : allLeads.filter((l) => l.funnel_stage === stageFilter);
            const filteredLeadIds = new Set(filteredLeads.map((l) => l.id));
            const filteredSrPaid = filteredLeads.filter((l) => l.funnel_stage === "SEAT_RESERVED").length;
            const filteredPending = Math.max(0, filteredLeads.length - filteredSrPaid);
            const filteredCacInr =
              stageFilter === "ALL"
                ? dashboard?.kpis.total_cac_saved_inr ?? 0
                : filteredLeads.reduce((acc, l) => acc + Number(l.cac_saved_inr || 0), 0);
            const filteredLogs =
              stageFilter === "ALL"
                ? dashboard?.toolLogs ?? []
                : (dashboard?.toolLogs ?? []).filter((log) => filteredLeadIds.has(log.lead_id));
            const gridStroke = lightMode ? "#CBD5E1" : "#334155";
            const labelFill = lightMode ? "#475569" : "#94A3B8";

            return (
            <div className="space-y-6">
              {/* Dashboard Sub-Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold sm:text-2xl tracking-tight ${lightMode ? "text-[#2A1C0E]" : "text-white"}`}>
                    Dashboard
                  </h2>
                  <p className={`mt-0.5 text-xs sm:text-sm ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                    Your organization&apos;s 7-day lead recovery overview at a glance
                  </p>
                </div>
                <div className="relative" ref={stageFilterRef}>
                  <button
                    type="button"
                    onClick={() => setStageFilterOpen((prev) => !prev)}
                    aria-expanded={stageFilterOpen}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition hover:shadow-sm ${
                      lightMode
                        ? "border-[#C9A24D]/70 bg-[#FFFDF7] text-[#2A1C0E] hover:border-[#6E1B20]/60 shadow-xs"
                        : "border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500/60"
                    }`}
                  >
                    <Filter className={`h-4 w-4 ${lightMode ? "text-[#6E1B20]" : "text-emerald-500"}`} />
                    <span className={lightMode ? "text-[#6B5438]" : "text-slate-400"}>Filter By:</span>
                    <span className={`font-semibold ${lightMode ? "text-[#2A1C0E]" : "text-white"}`}>
                      {stageFilter === "ALL"
                        ? "All Stages"
                        : stageFilter === "AI_COUNSELLED"
                        ? "AI Counselled"
                        : stageFilter === "CAMPUS_VISIT_BOOKED"
                        ? "Visit Booked"
                        : "Seat Reserved"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        stageFilterOpen ? "rotate-180" : ""
                      } ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}
                    />
                  </button>

                  {stageFilterOpen && (
                    <div
                      className={`absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border p-1.5 shadow-xl ${
                        lightMode
                          ? "border-[#C9A24D] bg-[#FFFDF7] text-[#2A1C0E]"
                          : "border-slate-700 bg-[#0F172A] text-slate-200"
                      }`}
                    >
                      {(
                        [
                          { value: "ALL", label: "All Stages" },
                          { value: "AI_COUNSELLED", label: "AI Counselled" },
                          { value: "CAMPUS_VISIT_BOOKED", label: "Visit Booked" },
                          { value: "SEAT_RESERVED", label: "Seat Reserved" },
                        ] as const
                      ).map((opt) => {
                        const isSelected = stageFilter === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setStageFilter(opt.value);
                              setStageFilterOpen(false);
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium transition ${
                              isSelected
                                ? lightMode
                                  ? "bg-[#FAF0D7] text-[#5C171B] font-semibold"
                                  : "bg-emerald-500/15 text-emerald-400 font-semibold"
                                : lightMode
                                ? "text-[#3B2610] hover:bg-[#FAF0D7]/60"
                                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && (
                              <Check className={`h-3.5 w-3.5 ${lightMode ? "text-[#6E1B20]" : "text-emerald-400"}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Pastel / Gradient Cards matching Image 1 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Candidates Registered (Lilac) */}
                <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-sm transition hover:shadow-md ${
                  lightMode ? "bg-[#EDE9FE] border-[#DDD6FE]" : "bg-indigo-950/30 border-indigo-500/20"
                }`}>
                  <div>
                    <div className={`text-xs font-semibold ${lightMode ? "text-indigo-950" : "text-indigo-200"}`}>
                      Total Candidates Registered
                    </div>
                    <div className={`mt-2 text-3xl font-extrabold ${lightMode ? "text-indigo-900" : "text-white"}`}>
                      {filteredLeads.length}
                    </div>
                    <div className={`mt-1 text-[11px] font-medium ${lightMode ? "text-indigo-700" : "text-indigo-400/80"}`}>
                      Neon Postgres Live
                    </div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${
                    lightMode ? "bg-indigo-200/70 text-indigo-700" : "bg-indigo-500/20 text-indigo-400"
                  }`}>
                    <Users className="h-6 w-6" />
                  </div>
                </div>

                {/* Card 2: Total Payments Made / SR Paid (Sky Blue) */}
                <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-sm transition hover:shadow-md ${
                  lightMode ? "bg-[#E0F2FE] border-[#BAE6FD]" : "bg-sky-950/30 border-sky-500/20"
                }`}>
                  <div>
                    <div className={`text-xs font-semibold ${lightMode ? "text-sky-950" : "text-sky-200"}`}>
                      Total Payments Made (SR)
                    </div>
                    <div className={`mt-2 text-3xl font-extrabold ${lightMode ? "text-sky-900" : "text-white"}`}>
                      {filteredSrPaid}
                    </div>
                    <div className={`mt-1 text-[11px] font-medium ${lightMode ? "text-sky-700" : "text-sky-400/80"}`}>
                      ₹50,000 reservation secured
                    </div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${
                    lightMode ? "bg-sky-200/70 text-sky-700" : "bg-sky-500/20 text-sky-400"
                  }`}>
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>

                {/* Card 3: Pending Admission Decisions / 7-Day Window At Risk (Peach) */}
                <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-sm transition hover:shadow-md ${
                  lightMode ? "bg-[#FFEDD5] border-[#FED7AA]" : "bg-amber-950/30 border-amber-500/20"
                }`}>
                  <div>
                    <div className={`text-xs font-semibold ${lightMode ? "text-amber-950" : "text-amber-200"}`}>
                      Pending Admission Decisions
                    </div>
                    <div className={`mt-2 text-3xl font-extrabold ${lightMode ? "text-amber-900" : "text-white"}`}>
                      {filteredPending}
                    </div>
                    <div className={`mt-1 text-[11px] font-medium ${lightMode ? "text-amber-800" : "text-amber-500/90"}`}>
                      7-Day Window Active
                    </div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${
                    lightMode ? "bg-amber-200/70 text-amber-700" : "bg-amber-500/20 text-amber-500"
                  }`}>
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                {/* Card 4: Total Admissions / CAC Capital Saved (Mint Green) */}
                <div className={`rounded-2xl border p-5 flex items-center justify-between shadow-sm transition hover:shadow-md ${
                  lightMode ? "bg-[#DCFCE7] border-[#BBF7D0]" : "bg-emerald-950/30 border-emerald-500/20"
                }`}>
                  <div>
                    <div className={`text-xs font-semibold ${lightMode ? "text-emerald-950" : "text-emerald-200"}`}>
                      Total CAC Capital Saved
                    </div>
                    <div className={`mt-2 text-3xl font-extrabold ${lightMode ? "text-emerald-900" : "text-emerald-400"}`}>
                      ₹{(filteredCacInr / 100000).toFixed(2)}L
                    </div>
                    <div className={`mt-1 text-[11px] font-medium ${lightMode ? "text-emerald-700" : "text-emerald-400/80"}`}>
                      Saved vs ₹35k–₹60k payout
                    </div>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${
                    lightMode ? "bg-emerald-200/70 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    <GraduationCap className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Middle Row: Visual Charts matching Image 1 */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Chart: Payments / Fee Recovery Trend (Smooth curved SVG line) */}
                {(() => {
                  const paymentChartConfig =
                    paymentsRange === "Weekly"
                      ? {
                          subtitle: "Weekly recovery trajectory",
                          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                          points: [
                            { x: 50, y: 130 },
                            { x: 135, y: 95 },
                            { x: 220, y: 110 },
                            { x: 305, y: 60 },
                            { x: 390, y: 38 },
                            { x: 470, y: 72 },
                          ],
                          path: "M 50 130 Q 95 95 135 95 T 220 110 T 305 60 T 390 38 T 470 72",
                          area: "M 50 130 Q 95 95 135 95 T 220 110 T 305 60 T 390 38 T 470 72 L 470 155 L 50 155 Z",
                          peakX: 355,
                          peakY: 6,
                          peakLabel: "₹1,50,000",
                          peakDotIdx: 4,
                        }
                      : paymentsRange === "Quarterly"
                      ? {
                          subtitle: "Quarterly recovery trajectory",
                          labels: ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26", "Q2 '26"],
                          points: [
                            { x: 50, y: 135 },
                            { x: 135, y: 105 },
                            { x: 220, y: 78 },
                            { x: 305, y: 42 },
                            { x: 390, y: 58 },
                            { x: 470, y: 32 },
                          ],
                          path: "M 50 135 Q 95 115 135 105 T 220 78 T 305 42 T 390 58 T 470 32",
                          area: "M 50 135 Q 95 115 135 105 T 220 78 T 305 42 T 390 58 T 470 32 L 470 155 L 50 155 Z",
                          peakX: 410,
                          peakY: 4,
                          peakLabel: "₹3,40,000",
                          peakDotIdx: 5,
                        }
                      : {
                          subtitle: "Monthly recovery trajectory",
                          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                          points: [
                            { x: 50, y: 140 },
                            { x: 150, y: 45 },
                            { x: 200, y: 65 },
                            { x: 320, y: 150 },
                            { x: 400, y: 90 },
                            { x: 470, y: 100 },
                          ],
                          path: "M 50 140 Q 130 10 200 65 T 320 150 T 400 90 T 470 100",
                          area: "M 50 140 Q 130 10 200 65 T 320 150 T 400 90 T 470 100 L 470 155 L 50 155 Z",
                          peakX: 115,
                          peakY: 10,
                          peakLabel: "₹1,00,000",
                          peakDotIdx: 1,
                        };
                  const labelXPositions = [50, 135, 220, 305, 390, 470];

                  return (
                <div className={`rounded-2xl border p-5 shadow-sm ${
                  lightMode ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-bold ${lightMode ? "text-slate-900" : "text-white"}`}>
                        Payments &amp; Conversions
                      </h3>
                      <div className={`text-[11px] ${lightMode ? "text-slate-500" : "text-slate-400"}`}>
                        {paymentChartConfig.subtitle}
                      </div>
                    </div>
                    <div className="relative" ref={paymentsRangeRef}>
                      <button
                        type="button"
                        onClick={() => setPaymentsRangeOpen((prev) => !prev)}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                          lightMode
                            ? "border-[#C9A24D]/70 bg-[#FAF0D7] text-[#3B2610] hover:border-[#6E1B20]"
                            : "border-slate-700/80 bg-slate-900 text-slate-300 hover:border-emerald-500/60"
                        }`}
                      >
                        <span>{paymentsRange}</span>
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${paymentsRangeOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {paymentsRangeOpen && (
                        <div
                          className={`absolute right-0 z-20 mt-1.5 w-32 overflow-hidden rounded-xl border p-1 shadow-xl ${
                            lightMode
                              ? "border-[#C9A24D] bg-[#FFFDF7] text-[#2A1C0E]"
                              : "border-slate-700 bg-[#0F172A] text-slate-200"
                          }`}
                        >
                          {(["Monthly", "Weekly", "Quarterly"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setPaymentsRange(opt);
                                setPaymentsRangeOpen(false);
                              }}
                              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
                                paymentsRange === opt
                                  ? lightMode
                                    ? "bg-[#FAF0D7] text-[#5C171B] font-semibold"
                                    : "bg-emerald-500/15 text-emerald-400 font-semibold"
                                  : lightMode
                                  ? "text-[#3B2610] hover:bg-[#FAF0D7]/60"
                                  : "text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              <span>{opt}</span>
                              {paymentsRange === opt && (
                                <Check className={`h-3 w-3 ${lightMode ? "text-[#6E1B20]" : "text-emerald-400"}`} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SVG Curved Chart */}
                  <div className="relative h-48 w-full">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 500 180">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="40" y1="30" x2="480" y2="30" stroke={gridStroke} strokeDasharray="4 4" strokeOpacity="0.6" />
                      <line x1="40" y1="75" x2="480" y2="75" stroke={gridStroke} strokeDasharray="4 4" strokeOpacity="0.6" />
                      <line x1="40" y1="120" x2="480" y2="120" stroke={gridStroke} strokeDasharray="4 4" strokeOpacity="0.6" />
                      <line x1="40" y1="155" x2="480" y2="155" stroke={gridStroke} strokeOpacity="0.8" />

                      {/* Area Fill */}
                      <path d={paymentChartConfig.area} fill="url(#chartGradient)" />

                      {/* Glowing Emerald Curve Line */}
                      <path
                        d={paymentChartConfig.path}
                        fill="none"
                        stroke={lightMode ? "#059669" : "#34D399"}
                        strokeWidth="3"
                        style={lightMode ? undefined : { filter: "drop-shadow(0 0 8px rgba(16,185,129,0.65))" }}
                      />

                      {/* Dots */}
                      {paymentChartConfig.points.map((pt, idx) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={idx === paymentChartConfig.peakDotIdx ? 5.5 : 4.5}
                          fill="#10B981"
                          stroke={idx === paymentChartConfig.peakDotIdx ? "#fff" : undefined}
                          strokeWidth={idx === paymentChartConfig.peakDotIdx ? 2 : undefined}
                        />
                      ))}

                      {/* Tooltip Badge at Peak */}
                      <g transform={`translate(${paymentChartConfig.peakX}, ${paymentChartConfig.peakY})`}>
                        <rect width="74" height="22" rx="6" fill="#10B981" />
                        <text x="37" y="15" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                          {paymentChartConfig.peakLabel}
                        </text>
                      </g>

                      {/* Labels */}
                      {paymentChartConfig.labels.map((lbl, idx) => (
                        <text key={lbl} x={labelXPositions[idx]} y="172" fill={labelFill} fontSize="10" textAnchor="middle">
                          {lbl}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>
                  );
                })()}

                {/* Right Chart: Candidates Registration Bar Chart */}
                {(() => {
                  const regChartConfig =
                    registrationsRange === "Weekly"
                      ? {
                          subtitle: "Weekly new lead intakes",
                          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                          bars: [
                            { y: 95, h: 60 },
                            { y: 70, h: 85 },
                            { y: 55, h: 100 },
                            { y: 80, h: 75 },
                            { y: 38, h: 117 },
                            { y: 65, h: 90 },
                          ],
                        }
                      : registrationsRange === "Quarterly"
                      ? {
                          subtitle: "Quarterly new lead intakes",
                          labels: ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26", "Q2 '26"],
                          bars: [
                            { y: 100, h: 55 },
                            { y: 82, h: 73 },
                            { y: 62, h: 93 },
                            { y: 48, h: 107 },
                            { y: 35, h: 120 },
                            { y: 52, h: 103 },
                          ],
                        }
                      : {
                          subtitle: "Monthly new lead intakes",
                          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                          bars: [
                            { y: 85, h: 70 },
                            { y: 65, h: 90 },
                            { y: 45, h: 110 },
                            { y: 40, h: 115 },
                            { y: 55, h: 100 },
                            { y: 105, h: 50 },
                          ],
                        };
                  const barXs = [55, 125, 195, 265, 335, 405];

                  return (
                <div className={`rounded-2xl border p-5 shadow-sm ${
                  lightMode ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-bold ${lightMode ? "text-slate-900" : "text-white"}`}>
                        Candidates Registration
                      </h3>
                      <div className={`text-[11px] ${lightMode ? "text-slate-500" : "text-slate-400"}`}>
                        {regChartConfig.subtitle}
                      </div>
                    </div>
                    <div className="relative" ref={registrationsRangeRef}>
                      <button
                        type="button"
                        onClick={() => setRegistrationsRangeOpen((prev) => !prev)}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                          lightMode
                            ? "border-[#C9A24D]/70 bg-[#FAF0D7] text-[#3B2610] hover:border-[#6E1B20]"
                            : "border-slate-700/80 bg-slate-900 text-slate-300 hover:border-emerald-500/60"
                        }`}
                      >
                        <span>{registrationsRange}</span>
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${registrationsRangeOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {registrationsRangeOpen && (
                        <div
                          className={`absolute right-0 z-20 mt-1.5 w-32 overflow-hidden rounded-xl border p-1 shadow-xl ${
                            lightMode
                              ? "border-[#C9A24D] bg-[#FFFDF7] text-[#2A1C0E]"
                              : "border-slate-700 bg-[#0F172A] text-slate-200"
                          }`}
                        >
                          {(["Monthly", "Weekly", "Quarterly"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setRegistrationsRange(opt);
                                setRegistrationsRangeOpen(false);
                              }}
                              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
                                registrationsRange === opt
                                  ? lightMode
                                    ? "bg-[#FAF0D7] text-[#5C171B] font-semibold"
                                    : "bg-emerald-500/15 text-emerald-400 font-semibold"
                                  : lightMode
                                  ? "text-[#3B2610] hover:bg-[#FAF0D7]/60"
                                  : "text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              <span>{opt}</span>
                              {registrationsRange === opt && (
                                <Check className={`h-3 w-3 ${lightMode ? "text-[#6E1B20]" : "text-emerald-400"}`} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="relative h-48 w-full">
                    <svg className="h-full w-full" viewBox="0 0 500 180">
                      {/* Grid lines */}
                      <line x1="30" y1="30" x2="480" y2="30" stroke={gridStroke} strokeDasharray="3 3" strokeOpacity="0.6" />
                      <line x1="30" y1="75" x2="480" y2="75" stroke={gridStroke} strokeDasharray="3 3" strokeOpacity="0.6" />
                      <line x1="30" y1="120" x2="480" y2="120" stroke={gridStroke} strokeDasharray="3 3" strokeOpacity="0.6" />
                      <line x1="30" y1="155" x2="480" y2="155" stroke={gridStroke} strokeOpacity="0.8" />

                      {/* 6 Rounded Amber/Gold Bars */}
                      {regChartConfig.bars.map((bar, idx) => (
                        <rect
                          key={idx}
                          x={barXs[idx]}
                          y={bar.y}
                          width="40"
                          height={bar.h}
                          rx="4"
                          fill="#F59E0B"
                          opacity="0.95"
                        />
                      ))}

                      {/* Labels */}
                      {regChartConfig.labels.map((lbl, idx) => (
                        <text key={lbl} x={barXs[idx] + 20} y="172" fill={labelFill} fontSize="10" textAnchor="middle">
                          {lbl}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>
                  );
                })()}
              </div>

              {/* Bottom Row: 3 Donut Cards with Live Partition Percentages */}
              {(() => {
                const leadTotal = filteredLeads.length;
                const pendingCount = filteredLeads.filter((l) => l.funnel_stage === "AI_COUNSELLED").length;
                const verifiedCount = filteredLeads.filter((l) => l.funnel_stage === "CAMPUS_VISIT_BOOKED").length;
                const admittedCount = filteredLeads.filter((l) => l.funnel_stage === "SEAT_RESERVED").length;

                const pctPending = leadTotal ? Math.round((pendingCount / leadTotal) * 100) : 0;
                const pctVerified = leadTotal ? Math.round((verifiedCount / leadTotal) * 100) : 0;
                const pctAdmitted = leadTotal ? Math.max(0, 100 - pctPending - pctVerified) : 0;
                const pctProgressed = leadTotal ? pctVerified + pctAdmitted : 0;

                const catACount = filteredLeads.filter((l) => (l.campus_category || "").includes("CAT-A")).length;
                const catBCount = filteredLeads.filter((l) => (l.campus_category || "").includes("CAT-B")).length;
                const catTotal = catACount + catBCount;
                const pctCatA = catTotal ? Math.round((catACount / catTotal) * 100) : 0;
                const pctCatB = catTotal ? Math.max(0, 100 - pctCatA) : 0;

                const approvedCount = verifiedCount + admittedCount;
                const inReviewCount = pendingCount;
                const pctApproved = leadTotal ? Math.round((approvedCount / leadTotal) * 100) : 0;
                const pctInReview = leadTotal ? Math.round((inReviewCount / leadTotal) * 100) : 0;
                const pctRejected = leadTotal ? Math.max(0, 100 - pctApproved - pctInReview) : 0;

                return (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Donut 1: Candidates Status */}
                <div className={`rounded-2xl border p-5 shadow-sm ${
                  lightMode ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <h4 className={`text-xs font-bold ${lightMode ? "text-slate-900" : "text-white"}`}>
                    Candidates Status
                  </h4>
                  <div className="mt-4 flex items-center justify-around gap-3">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke={lightMode ? "#F3E6CB" : "#1E293B"} strokeWidth="4" />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#F59E0B" strokeWidth="4" strokeDasharray={`${pctPending} ${100 - pctPending}`} strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#0EA5E9" strokeWidth="4" strokeDasharray={`${pctVerified} ${100 - pctVerified}`} strokeDashoffset={`-${pctPending}`} />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#10B981" strokeWidth="4" strokeDasharray={`${pctAdmitted} ${100 - pctAdmitted}`} strokeDashoffset={`-${pctPending + pctVerified}`} />
                      </svg>
                      <span className={`absolute text-xs font-bold ${lightMode ? "text-slate-900" : "text-slate-200"}`}>
                        {pctProgressed}%
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-medium min-w-[110px]">
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Pending
                        </span>
                        <span className="font-bold">{pctPending}%</span>
                      </div>
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-500"></span> Verified
                        </span>
                        <span className="font-bold">{pctVerified}%</span>
                      </div>
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Admitted
                        </span>
                        <span className="font-bold">{pctAdmitted}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Donut 2: Campus Category Allocation */}
                <div className={`rounded-2xl border p-5 shadow-sm ${
                  lightMode ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <h4 className={`text-xs font-bold ${lightMode ? "text-slate-900" : "text-white"}`}>
                    Campus Allocation
                  </h4>
                  <div className="mt-4 flex items-center justify-around gap-3">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke={lightMode ? "#F3E6CB" : "#1E293B"} strokeWidth="4" />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#10B981" strokeWidth="4" strokeDasharray={`${pctCatA} ${100 - pctCatA}`} strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#F59E0B" strokeWidth="4" strokeDasharray={`${pctCatB} ${100 - pctCatB}`} strokeDashoffset={`-${pctCatA}`} />
                      </svg>
                      <span className={`absolute text-xs font-bold ${lightMode ? "text-slate-900" : "text-slate-200"}`}>
                        {pctCatA >= pctCatB ? "CAT-A" : "CAT-B"}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-medium min-w-[130px]">
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> CAT-A (South)
                        </span>
                        <span className="font-bold">{pctCatA}%</span>
                      </div>
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> CAT-B (North)
                        </span>
                        <span className="font-bold">{pctCatB}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Donut 3: Admissions Status */}
                <div className={`rounded-2xl border p-5 shadow-sm ${
                  lightMode ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <h4 className={`text-xs font-bold ${lightMode ? "text-slate-900" : "text-white"}`}>
                    Admissions Status
                  </h4>
                  <div className="mt-4 flex items-center justify-around gap-3">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke={lightMode ? "#F3E6CB" : "#1E293B"} strokeWidth="4" />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#10B981" strokeWidth="4" strokeDasharray={`${pctApproved} ${100 - pctApproved}`} strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#F59E0B" strokeWidth="4" strokeDasharray={`${pctInReview} ${100 - pctInReview}`} strokeDashoffset={`-${pctApproved}`} />
                        <circle cx="18" cy="18" r="14" fill="none" pathLength={100} stroke="#EF4444" strokeWidth="4" strokeDasharray={`${pctRejected} ${100 - pctRejected}`} strokeDashoffset={`-${pctApproved + pctInReview}`} />
                      </svg>
                      <span className={`absolute text-xs font-bold ${lightMode ? "text-slate-900" : "text-slate-200"}`}>
                        {pctApproved}%
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-medium min-w-[115px]">
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Approved
                        </span>
                        <span className="font-bold">{pctApproved}%</span>
                      </div>
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> In Review
                        </span>
                        <span className="font-bold">{pctInReview}%</span>
                      </div>
                      <div className={`flex items-center justify-between gap-3 ${lightMode ? "text-slate-700" : "text-slate-300"}`}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Rejected
                        </span>
                        <span className="font-bold">{pctRejected}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                );
              })()}

              {/* Bottom Logs Row */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className={`rounded-2xl border p-5 shadow-sm ${
                  lightMode ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${lightMode ? "text-slate-900" : "text-white"}`}>
                    <Send className="h-4 w-4 text-emerald-500" />
                    Automated Vernacular WhatsApp Dispatches
                  </h3>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {dashboard?.dispatches.map((d) => (
                      <div
                        key={d.id}
                        className={`rounded-xl border p-3 text-xs ${
                          lightMode ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950"
                        }`}
                      >
                        <div className={`flex items-center justify-between text-[11px] ${lightMode ? "text-slate-600" : "text-slate-400"}`}>
                          <span>
                            To: <strong className={lightMode ? "text-slate-900" : "text-slate-200"}>{d.parent_name}</strong> ({d.language})
                          </span>
                          <span className={`rounded px-1.5 py-0.5 font-semibold ${
                            lightMode ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            {d.status}
                          </span>
                        </div>
                        <p className={`mt-1.5 leading-relaxed ${lightMode ? "text-slate-700" : "text-slate-300"}`}>{d.message_body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 shadow-sm ${
                  lightMode ? "bg-white border-slate-200" : "bg-slate-900/60 border-slate-800"
                }`}>
                  <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${lightMode ? "text-slate-900" : "text-white"}`}>
                    <ExternalLink className="h-4 w-4 text-indigo-500" />
                    Agent Tool Execution Audit Log (Neon DB)
                  </h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                          lightMode ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950"
                        }`}
                      >
                        <div>
                          <span className={`font-mono font-semibold ${lightMode ? "text-indigo-700" : "text-indigo-400"}`}>
                            {log.tool_name}
                          </span>
                          <span className="ml-2 text-[11px] text-slate-500">Lead #{log.lead_id}</span>
                        </div>
                        <span className={`font-mono text-[11px] font-semibold ${lightMode ? "text-emerald-700" : "text-emerald-400"}`}>
                          {log.latency_ms}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* VIEW 3: 7-DAY LEAD PIPELINE (MATCHING IMAGE 2 REFERENCE) */}
          {activeTab === "pipeline" && (() => {
            const filteredPipelineLeads = (dashboard?.leads || []).filter(
              (l) =>
                !searchQuery ||
                l.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (l.campus_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.phone.includes(searchQuery)
            );
            const pendingSelectedCount = filteredPipelineLeads.filter(
              (l) => selectedLeadIds.includes(l.id) && l.funnel_stage !== "SEAT_RESERVED"
            ).length;

            return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold sm:text-2xl tracking-tight ${lightMode ? "text-[#2A1C0E]" : "text-white"}`}>
                    7-Day Open Market Lead Pipeline
                  </h2>
                  <p className={`mt-0.5 text-xs sm:text-sm ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                    Compare system records with live parent outreach to recover dropped leads before open-market expiration.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {selectedLeadIds.length > 0 && (
                    <div
                      className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                        lightMode
                          ? "border-[#C9A24D] bg-[#FAF0D7] text-[#3B2610]"
                          : "border-emerald-500/40 bg-slate-900 text-slate-200"
                      }`}
                    >
                      <span className="font-bold">{selectedLeadIds.length} selected</span>
                      {pendingSelectedCount > 0 && (
                        <button
                          type="button"
                          onClick={handleBulkReconcile}
                          disabled={bulkReconciling}
                          className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold text-white transition disabled:opacity-50 ${
                            lightMode
                              ? "preserve-dark bg-[#6E1B20] hover:bg-[#571317]"
                              : "bg-emerald-600 hover:bg-emerald-500"
                          }`}
                        >
                          {bulkReconciling ? "Reconciling..." : `Reconcile (${pendingSelectedCount})`}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedLeadIds([])}
                        className={`cursor-pointer text-[11px] font-semibold underline-offset-2 hover:underline ${
                          lightMode ? "text-[#6E1B20]" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleExportCSV(selectedLeadIds.length > 0)}
                    className={`group flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${
                      lightMode
                        ? "border-[#C9A24D] bg-[#FAF0D7] text-[#3B2610] hover:border-[#6E1B20] hover:bg-[#EFE0BC] hover:text-[#5C171B]"
                        : "border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500/70 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Download
                      className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5 ${
                        lightMode ? "text-[#6E1B20]" : "text-emerald-400"
                      }`}
                    />
                    {selectedLeadIds.length > 0 ? `Export Selected (${selectedLeadIds.length})` : "Export All CSV"}
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div
                className={`rounded-2xl border overflow-hidden shadow-sm ${
                  lightMode ? "border-[#D7C6A7] bg-[#FFFDF7]" : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead
                      className={`border-b text-xs font-bold uppercase tracking-wider ${
                        lightMode
                          ? "bg-[#FAF0D7] border-[#D7C6A7] text-[#5C171B]"
                          : "bg-slate-950/60 border-slate-800 text-slate-400"
                      }`}
                    >
                      <tr>
                        <th className="py-4 px-5 w-12" aria-label="Select" />
                        <th className="py-4 px-5">Candidate / Lead</th>
                        <th className="py-4 px-5">System Record (Campus)</th>
                        <th className="py-4 px-5">Parent Details</th>
                        <th className="py-4 px-5">Trust Score</th>
                        <th className="py-4 px-5">Funnel Status</th>
                        <th className="py-4 px-5">Action</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        lightMode ? "bg-[#FFFDF7] divide-[#E8DCC5]" : "divide-slate-800/60"
                      }`}
                    >
                      {filteredPipelineLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            className={`transition ${
                              lightMode ? "bg-[#FFFDF7] hover:bg-[#FAF0D7]/55" : "hover:bg-slate-800/30"
                            }`}
                          >
                            <td className="py-4 px-5">
                              <input
                                type="checkbox"
                                checked={selectedLeadIds.includes(lead.id)}
                                onChange={() => {
                                  setSelectedLeadIds((prev) =>
                                    prev.includes(lead.id) ? prev.filter((id) => id !== lead.id) : [...prev, lead.id]
                                  );
                                }}
                                className="h-4 w-4 cursor-pointer rounded border-slate-700"
                              />
                            </td>
                            <td className="py-4 px-5">
                              <div className={`text-sm font-semibold ${lightMode ? "text-[#2A1C0E]" : "text-white"}`}>
                                {lead.student_name}
                              </div>
                              <div className={`mt-0.5 text-xs font-mono ${lightMode ? "text-[#746858]" : "text-slate-400"}`}>
                                ID: FLW-TXN-{lead.id}01
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <span
                                className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                  lightMode
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                }`}
                              >
                                {lead.campus_name}
                              </span>
                              <div className={`mt-1 text-xs ${lightMode ? "text-[#6B5438]" : "text-slate-500"}`}>
                                {lead.campus_category}
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <div className={`text-sm font-medium ${lightMode ? "text-[#2A1C0E]" : "text-slate-200"}`}>
                                {lead.parent_name} ({lead.preferred_language})
                              </div>
                              <div className={`mt-0.5 text-xs ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                                {lead.city} · {lead.phone}
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <div className={`text-sm font-bold ${lightMode ? "text-emerald-700" : "text-emerald-400"}`}>
                                {lead.trust_score}%
                              </div>
                              <div
                                className={`w-20 h-1.5 rounded-full mt-1.5 overflow-hidden ${
                                  lightMode ? "bg-[#E8DCC5]" : "bg-slate-800"
                                }`}
                              >
                                <div className="h-full bg-emerald-600" style={{ width: `${lead.trust_score}%` }}></div>
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              {lead.funnel_stage === "SEAT_RESERVED" ? (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                                    lightMode
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  }`}
                                >
                                  Reconciled
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                                    lightMode
                                      ? "bg-[#FAF0D7] text-[#8A4B08] border-[#C9A24D]/70"
                                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                  }`}
                                >
                                  Unmatched (7D)
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-5">
                              {lead.funnel_stage !== "SEAT_RESERVED" ? (
                                <button
                                  type="button"
                                  onClick={() => handleStageUpdate(lead.id, "SEAT_RESERVED")}
                                  className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition ${
                                    lightMode
                                      ? "preserve-dark bg-[#6E1B20] hover:bg-[#571317]"
                                      : "bg-emerald-600 hover:bg-emerald-500"
                                  }`}
                                >
                                  Reconcile
                                </button>
                              ) : (
                                <span
                                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                                    lightMode ? "text-emerald-700" : "text-emerald-400"
                                  }`}
                                >
                                  <Check className="h-4 w-4" /> Confirmed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            );
          })()}

          {/* VIEW 4: PARTNER CAMPUSES DIRECTORY */}
          {activeTab === "campuses" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className={`text-xl font-bold sm:text-2xl tracking-tight ${lightMode ? "text-[#2A1C0E]" : "text-white"}`}>
                    Verified Partner Universities
                  </h2>
                  <p className={`mt-0.5 text-xs sm:text-sm ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                    All 21 CAT-A &amp; CAT-B universities awarding official UGC-recognized B.Tech degrees with NIAT software training.
                  </p>
                </div>
                <div
                  className={`rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold ${
                    lightMode
                      ? "border-[#D7C6A7] bg-[#FFFDF7] text-[#3B2610]"
                      : "border-slate-700 bg-slate-900 text-slate-300"
                  }`}
                >
                  {dashboard?.campuses.length ?? 0} Campuses in Neon DB
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dashboard?.campuses
                  .filter((c) =>
                    !searchQuery ||
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.state.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((campus) => {
                    const officialUrl =
                      CAMPUS_OFFICIAL_URLS[campus.name] ||
                      `https://www.google.com/search?q=${encodeURIComponent(`${campus.name} official website`)}`;
                    return (
                    <div
                      key={campus.id}
                      className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        lightMode
                          ? "bg-[#FFFDF7] border-[#D7C6A7] hover:border-[#6E1B20]/60"
                          : "bg-slate-900/60 border-slate-800 hover:border-emerald-500/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              campus.category === "CAT-B"
                                ? lightMode
                                  ? "bg-[#FAF0D7] text-[#8A4B08] border-[#C9A24D]/70"
                                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : lightMode
                                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                            }`}
                          >
                            {campus.category}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                              lightMode ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-emerald-500/15 text-emerald-400"
                            }`}
                          >
                            UGC Approved
                          </span>
                        </div>
                        <a
                          href={officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-3 inline-flex items-center gap-1.5 text-sm font-bold leading-snug transition ${
                            lightMode
                              ? "text-[#2A1C0E] hover:text-[#6E1B20]"
                              : "text-white hover:text-emerald-400"
                          }`}
                        >
                          <span>{campus.name}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
                        </a>
                        <div className={`mt-1 text-xs flex items-center gap-1 ${lightMode ? "text-[#6B5438]" : "text-slate-400"}`}>
                          <Building2 className={`h-3 w-3 ${lightMode ? "text-[#8C7355]" : "text-slate-500"}`} />
                          {campus.city}, {campus.state}
                        </div>
                      </div>

                      <div
                        className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 text-xs ${
                          lightMode ? "border-[#E8DCC5]" : "border-slate-800"
                        }`}
                      >
                        <div>
                          <span className={lightMode ? "text-[#6B5438]" : "text-slate-400"}>Total 4-Yr Fee: </span>
                          <span className={`font-semibold ${lightMode ? "text-emerald-700" : "text-emerald-400"}`}>
                            ₹{campus.estimated_4yr_fee_lakhs} Lakhs
                          </span>
                        </div>
                        <a
                          href={officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                            lightMode
                              ? "border-[#C9A24D]/70 bg-[#FAF0D7] text-[#5C171B] hover:border-[#6E1B20] hover:bg-[#EFE0BC]"
                              : "border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          Official Site
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                  })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Assistant Button (Burgundy+Gold Parchment/Obsidian on Portal | Emerald+Black on Dashboard/Pipeline/Campuses) */}
      {!assistantOpen && (
        activeTab === "portal" ? (
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            aria-label="Ask NIAT AI"
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex h-13 w-13 sm:h-auto sm:w-auto cursor-pointer items-center justify-center sm:gap-3 rounded-full p-0 sm:px-5 sm:py-3.5 shadow-xl transition-all hover:scale-105 ${
              lightMode
                ? "border-2 border-[#A67C2E] bg-[#FFF9EB] text-[#5C171B] shadow-[0_10px_28px_rgba(68,48,16,0.28)]"
                : "preserve-dark border-2 border-[#D4AF37]/70 bg-[#181113] text-[#F0D078] shadow-[0_0_28px_rgba(212,175,55,0.28)]"
            }`}
          >
            <span
              className={`relative flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full border ${
                lightMode
                  ? "border-[#A67C2E] bg-[#6E1B20] text-[#F3D283]"
                  : "border-[#D4AF37]/50 bg-[#4E1519] text-[#F0D078]"
              }`}
            >
              <Bot className="h-5 w-5 sm:h-4 sm:w-4" />
              <span
                className={`sm:hidden absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full animate-pulse ${
                  lightMode ? "bg-[#6E1B20]" : "bg-[#F0D078]"
                }`}
              />
            </span>
            <div className="hidden sm:block text-left">
              <div className={`font-hogwarts text-sm font-bold tracking-wide ${lightMode ? "text-[#5C171B]" : "text-[#F0D078]"}`}>
                Ask NIAT AI
              </div>
              <div className={`text-[11px] font-semibold ${lightMode ? "text-[#6E4F1D]" : "text-[#C8B89A]"}`}>
                Voice &amp; 11 Languages
              </div>
            </div>
          </button>
        ) : (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center">
            {/* Hover / Focus Tooltip */}
            <div
              className={`pointer-events-none mr-3 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 ${
                assistantTheme === "light"
                  ? "border-[#D7C6A7] bg-[#F5F0E6] text-[#29231D]"
                  : "preserve-dark border-emerald-500/40 bg-zinc-950 text-emerald-300"
              }`}
            >
              Ask NIAT AI
            </div>

            {/* Compact Circular Launcher with Subtle Pulsing Indicator */}
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              aria-label="Ask NIAT AI"
              className={`relative flex h-13 w-13 cursor-pointer items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-200 hover:scale-105 focus:outline-none ${
                assistantTheme === "light"
                  ? "border-[#D7C6A7] bg-[#F5F0E6] text-[#762E32]"
                  : "preserve-dark border-emerald-400/70 bg-black text-emerald-400"
              }`}
            >
              <span
                className={`pointer-events-none absolute inset-0 rounded-full animate-ping opacity-30 ${
                  assistantTheme === "light" ? "bg-[#B18A48]" : "bg-emerald-400"
                }`}
                style={{ animationDuration: "2.4s" }}
              />
              <Bot className="relative h-6 w-6" />
              <span
                className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 ${
                  assistantTheme === "light"
                    ? "border-[#F5F0E6] bg-[#762E32]"
                    : "border-black bg-emerald-400"
                }`}
              />
            </button>
          </div>
        )
      )}

      {/* Full-Focus AI Assistant Pop-Up Modal (Portal: Unchanged | Dashboard/Pipeline/Campuses: Independent Light & Dark Theme) */}
      {assistantOpen && activeTab === "portal" && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm ${
            lightMode ? "" : "preserve-dark"
          }`}
          onClick={() => closeAssistant()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={
              lightMode
                ? {
                    backgroundColor: "#FFF9EB",
                    backgroundImage: "linear-gradient(180deg, #FFFAF0 0%, #F4E5C3 100%)",
                  }
                : {
                    backgroundColor: "#140D0F",
                    backgroundImage: "linear-gradient(180deg, #181113 0%, #0D080A 100%)",
                  }
            }
            className={`flex h-[92dvh] sm:h-[85vh] w-full max-w-2xl flex-col rounded-2xl p-4 sm:p-8 transition-all ${
              lightMode
                ? "hogwarts-assistant-light border-2 border-[#A67C2E] bg-[#FFF9EB] text-[#2A1C0E]"
                : "preserve-dark hogwarts-assistant-dark border-2 border-[#D4AF37]/65 bg-[#140D0F] text-[#F5EAD4]"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-start justify-between gap-3 border-b pb-4 ${
                lightMode ? "border-[#A67C2E]/40" : "border-[#D4AF37]/30"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    lightMode
                      ? "border-[#A67C2E] bg-[#6E1B20] text-[#F3D283]"
                      : "border-[#D4AF37]/50 bg-[#4E1519] text-[#F0D078]"
                  }`}
                >
                  <Bot className="h-5 w-5" />
                  <span
                    className={`absolute -right-1 -top-1 h-3 w-3 rounded-full animate-pulse ${
                      lightMode ? "bg-[#6E1B20]" : "bg-[#F0D078]"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h3
                    className={`font-hogwarts text-lg sm:text-xl font-bold truncate ${
                      lightMode ? "text-[#5C171B]" : "text-[#F0D078]"
                    }`}
                  >
                    NIAT AI Assistant
                  </h3>
                  <p className={`hidden sm:block text-xs sm:text-sm ${lightMode ? "text-[#5C4426]" : "text-[#C8B89A]"}`}>
                    Ask anything about campuses, fees, NAT exam, or UGC degree validity
                  </p>
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightMode(!lightMode)}
                  title="Switch Assistant Theme"
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition ${
                    lightMode
                      ? "border-[#A67C2E] bg-[#F5E6C4] text-[#5C171B]"
                      : "border-[#D4AF37]/40 bg-[#1D1417] text-[#F0D078]"
                  }`}
                >
                  <Sun className={`h-3.5 w-3.5 ${lightMode ? "text-[#B45309]" : "text-slate-400"}`} />
                  <Moon className={`h-3.5 w-3.5 ${!lightMode ? "text-[#F0D078]" : "text-slate-400"}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const lastBotMsg =
                      [...generalChat].reverse().find((m) => m.role === "assistant")?.content || "";
                    if (lastBotMsg) toggleVoiceBrief(lastBotMsg, "general-latest");
                  }}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    lightMode
                      ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610] hover:bg-[#F0DCAD]"
                      : "border-[#8C6828] bg-[#1D1417] text-[#F0D078] hover:border-[#F0D078]"
                  }`}
                >
                  {speakingId === "general-latest" ? (
                    <>
                      <Square className="h-3.5 w-3.5 text-rose-500" /> Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className={`h-4 w-4 ${lightMode ? "text-[#6E1B20]" : "text-[#F0D078]"}`} />{" "}
                      <span className="hidden sm:inline">Listen Latest</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => closeAssistant()}
                  className={`cursor-pointer rounded-xl border p-2 transition ${
                    lightMode
                      ? "border-[#A67C2E] bg-[#FAF0D7] text-[#5C171B] hover:bg-[#6E1B20] hover:text-white"
                      : "border-[#8C6828] bg-[#1D1417] text-[#C8B89A] hover:border-rose-400 hover:text-white"
                  }`}
                  title="Close Assistant"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Language Control + Starter Chips */}
            <div className="mt-2.5 sm:mt-4 flex shrink-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm font-semibold ${lightMode ? "text-[#3B2610]" : "text-[#C8B89A]"}`}>
                  Reply in:
                </span>
                <select
                  value={form.preferred_language}
                  onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                  className={`rounded-xl border px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold focus:outline-none ${
                    lightMode
                      ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610]"
                      : "border-[#8C6828] bg-[#1D1417] text-[#F0D078]"
                  }`}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <span className={`hidden sm:inline text-xs font-medium ${lightMode ? "text-[#5C4426]" : "text-[#C8B89A]"}`}>
                Speak or type in any language
              </span>
            </div>

            <div className="mt-2 sm:mt-3 flex shrink-0 flex-nowrap overflow-x-auto sm:flex-wrap gap-1.5 sm:gap-2 pb-1 sm:pb-0">
              {[
                "Compare NIAT vs Scaler & Newton",
                "Is the B.Tech degree UGC valid?",
                "What is the NAT exam pattern & fee?",
                "Tell me about Pune or Hyderabad colleges",
              ].map((qChip) => (
                <button
                  key={qChip}
                  type="button"
                  onClick={() => handleGeneralAsk(qChip)}
                  className={`shrink-0 whitespace-nowrap cursor-pointer rounded-full border px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition ${
                    lightMode
                      ? "border-[#B88B38] bg-[#FAF0D7] text-[#3B2610] hover:border-[#6E1B20] hover:bg-[#F2DFB4]"
                      : "border-[#8C6828] bg-[#1D1417] text-[#EBD9B5] hover:border-[#F0D078] hover:text-white"
                  }`}
                >
                  {qChip}
                </button>
              ))}
            </div>

            {/* Spacious Chat Messages Area */}
            <div
              className={`mt-2.5 sm:mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden rounded-2xl border p-3 sm:p-4 ${
                lightMode ? "border-[#C9A24D]/70 bg-[#EFE0BC]/45" : "border-[#8C6828]/50 bg-[#0B0709]/85"
              }`}
            >
              {generalChat.map((m, idx) => {
                const gVoiceId = `general-${idx}`;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl px-4 py-3.5 text-sm sm:text-base leading-relaxed ${
                      m.role === "user"
                        ? lightMode
                          ? "ml-6 sm:ml-10 border border-[#C9A24D] bg-[#EED18E] text-[#2A1C0E] shadow-xs"
                          : "ml-6 sm:ml-10 border border-[#8C3238] bg-[#4E1519] text-[#FFF5F5]"
                        : lightMode
                        ? "mr-2 sm:mr-6 border border-[#C9A24D]/70 bg-[#FFFDF6] text-[#2A1C0E] shadow-xs"
                        : "mr-2 sm:mr-6 border border-[#8C6828]/45 bg-[#181113] text-[#F5EAD4]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                        <span
                          className={`mr-2 font-bold ${
                            m.role === "user"
                              ? lightMode
                                ? "text-[#5C171B]"
                                : "text-[#F0D078]"
                              : lightMode
                              ? "text-[#6E1B20]"
                              : "text-[#F0D078]"
                          }`}
                        >
                          {m.role === "user" ? "You:" : "NIAT AI:"}
                        </span>
                        {renderFormattedMessage(m.content)}
                      </div>
                      {m.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => toggleVoiceBrief(m.content, gVoiceId)}
                          title="Play voice note for this reply"
                          className={`shrink-0 flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                            lightMode
                              ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610] hover:bg-[#F0DCAD]"
                              : "border-[#8C6828] bg-[#1D1417] text-[#F0D078] hover:border-[#F0D078]"
                          }`}
                        >
                          {speakingId === gVoiceId ? (
                            <>
                              <Square className="h-3 w-3 text-rose-500" /> Stop
                            </>
                          ) : (
                            <>
                              <Volume2 className={`h-3.5 w-3.5 ${lightMode ? "text-[#6E1B20]" : "text-[#F0D078]"}`} /> Voice
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {generalLoading && (
                <div
                  className={`mr-2 sm:mr-6 rounded-2xl border px-4 py-3 text-sm ${
                    lightMode
                      ? "border-[#C9A24D]/70 bg-[#FFFDF6] text-[#5C4426]"
                      : "border-[#8C6828]/45 bg-[#181113] text-[#C8B89A]"
                  }`}
                >
                  <span className={`mr-2 font-bold ${lightMode ? "text-[#6E1B20]" : "text-[#F0D078]"}`}>NIAT AI:</span>
                  <span className="animate-pulse">Thinking...</span>
                </div>
              )}
              <div ref={generalChatEndRef} />
            </div>

            {/* ChatGPT-style Auto-Expanding Input & Voice Mic Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGeneralAsk();
              }}
              className={`mt-4 flex items-end gap-2 rounded-2xl border p-2 transition focus-within:ring-1 ${
                lightMode
                  ? "border-[#A67C2E] bg-[#FFFDF6] focus-within:border-[#6E1B20] focus-within:ring-[#6E1B20]/30"
                  : "border-[#8C6828] bg-[#181113] focus-within:border-[#F0D078] focus-within:ring-[#F0D078]/30"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleVoiceInput("general")}
                title="Speak your question in any language"
                className={`shrink-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border text-sm transition ${
                  listeningTarget === "general"
                    ? "border-rose-500 bg-rose-500/20 text-rose-500 animate-pulse"
                    : lightMode
                    ? "border-[#A67C2E]/60 bg-[#FAF0D7] text-[#6E1B20] hover:bg-[#F0DCAD]"
                    : "border-[#8C6828]/60 bg-[#1D1417] text-[#F0D078] hover:border-[#F0D078]"
                }`}
              >
                {listeningTarget === "general" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <textarea
                ref={generalTextareaRef}
                rows={1}
                value={generalInput}
                onChange={(e) => setGeneralInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGeneralAsk();
                  }
                }}
                placeholder={`Ask NIAT AI (${form.preferred_language})...`}
                className={`min-h-[40px] max-h-36 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm sm:text-base leading-relaxed focus:outline-none ${
                  lightMode
                    ? "text-[#2A1C0E] placeholder-[#8C7355]"
                    : "text-[#F5EAD4] placeholder-[#8C7A65]"
                }`}
              />
              <button
                type="submit"
                disabled={generalLoading || !generalInput.trim()}
                className="preserve-dark shrink-0 flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#C9A24D]/50 bg-[#6E1B20] px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#571317] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {generalLoading ? "..." : "Ask AI"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Isolated NIAT AI Assistant Modal for Dashboard / Pipeline / Campuses (Independent Light & Dark Mode) */}
      {assistantOpen && activeTab !== "portal" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => closeAssistant()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={
              assistantTheme === "light"
                ? {
                    backgroundColor: "#FFF9EB",
                    backgroundImage: "linear-gradient(180deg, #FFFAF0 0%, #F4E5C3 100%)",
                  }
                : { backgroundColor: "#000000" }
            }
            className={`flex h-[92dvh] sm:h-[85vh] w-full max-w-2xl flex-col rounded-2xl p-4 sm:p-8 transition-all ${
              assistantTheme === "light"
                ? "hogwarts-assistant-light border-2 border-[#A67C2E] bg-[#FFF9EB] text-[#2A1C0E]"
                : "preserve-dark border border-emerald-500/50 bg-black text-slate-100 shadow-[0_0_45px_rgba(16,185,129,0.22)]"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`flex items-start justify-between gap-3 border-b pb-4 ${
                assistantTheme === "light" ? "border-[#A67C2E]/40" : "border-emerald-500/25"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    assistantTheme === "light"
                      ? "border-[#A67C2E] bg-[#6E1B20] text-[#F3D283]"
                      : "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  <Bot className="h-5 w-5" />
                  <span
                    className={`absolute -right-1 -top-1 h-3 w-3 rounded-full animate-pulse ${
                      assistantTheme === "light" ? "bg-[#6E1B20]" : "bg-emerald-400"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h3
                    className={`truncate ${
                      assistantTheme === "light"
                        ? "font-hogwarts text-lg sm:text-xl font-bold text-[#5C171B]"
                        : "text-base sm:text-lg font-bold text-emerald-300"
                    }`}
                  >
                    NIAT AI Assistant
                  </h3>
                  <p
                    className={`hidden sm:block text-xs ${
                      assistantTheme === "light" ? "sm:text-sm text-[#5C4426]" : "text-emerald-400/75"
                    }`}
                  >
                    Ask anything about campuses, fees, NAT exam, or UGC degree validity
                  </p>
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                {/* Independent Light / Dark Theme Switcher for NIAT AI Assistant */}
                <button
                  type="button"
                  onClick={toggleAssistantTheme}
                  aria-label="Toggle NIAT AI Assistant Theme"
                  title="Switch Assistant Theme"
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition ${
                    assistantTheme === "light"
                      ? "border-[#A67C2E] bg-[#F5E6C4] text-[#5C171B]"
                      : "border-emerald-500/40 bg-zinc-950 text-emerald-300 hover:border-emerald-400"
                  }`}
                >
                  <Sun className={`h-3.5 w-3.5 ${assistantTheme === "light" ? "text-[#B45309]" : "text-slate-400"}`} />
                  <Moon className={`h-3.5 w-3.5 ${assistantTheme === "dark" ? "text-emerald-400" : "text-slate-400"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const lastBotMsg =
                      [...generalChat].reverse().find((m) => m.role === "assistant")?.content || "";
                    if (lastBotMsg) toggleVoiceBrief(lastBotMsg, "general-latest");
                  }}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    assistantTheme === "light"
                      ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610] hover:bg-[#F0DCAD]"
                      : "border-emerald-500/40 bg-zinc-950 text-emerald-300 hover:border-emerald-400"
                  }`}
                >
                  {speakingId === "general-latest" ? (
                    <>
                      <Square className="h-3.5 w-3.5 text-rose-500" /> Stop
                    </>
                  ) : (
                    <>
                      <Volume2
                        className={`h-4 w-4 ${assistantTheme === "light" ? "text-[#6E1B20]" : "text-emerald-400"}`}
                      />{" "}
                      <span className="hidden sm:inline">Listen Latest</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => closeAssistant()}
                  className={`cursor-pointer rounded-xl border p-2 transition ${
                    assistantTheme === "light"
                      ? "border-[#A67C2E] bg-[#FAF0D7] text-[#5C171B] hover:bg-[#6E1B20] hover:text-white"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-rose-500 hover:text-white"
                  }`}
                  title="Close Assistant"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Language Control + Starter Chips */}
            <div className="mt-2.5 sm:mt-4 flex shrink-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs sm:text-sm font-semibold ${
                    assistantTheme === "light" ? "text-[#3B2610]" : "text-emerald-400/80"
                  }`}
                >
                  Reply in:
                </span>
                <select
                  value={form.preferred_language}
                  onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                  className={`rounded-xl border px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold focus:outline-none ${
                    assistantTheme === "light"
                      ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610]"
                      : "border-emerald-500/40 bg-zinc-950 text-emerald-300 focus:border-emerald-400"
                  }`}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <span
                className={`hidden sm:inline text-xs font-medium ${
                  assistantTheme === "light" ? "text-[#5C4426]" : "text-emerald-400/70"
                }`}
              >
                Speak or type in any language
              </span>
            </div>

            <div className="mt-2 sm:mt-3 flex shrink-0 flex-nowrap overflow-x-auto sm:flex-wrap gap-1.5 sm:gap-2 pb-1 sm:pb-0">
              {[
                "Compare NIAT vs Scaler & Newton",
                "Is the B.Tech degree UGC valid?",
                "What is the NAT exam pattern & fee?",
                "Tell me about Pune or Hyderabad colleges",
              ].map((qChip) => (
                <button
                  key={qChip}
                  type="button"
                  onClick={() => handleGeneralAsk(qChip)}
                  className={`shrink-0 whitespace-nowrap cursor-pointer rounded-full border px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition ${
                    assistantTheme === "light"
                      ? "border-[#B88B38] bg-[#FAF0D7] text-[#3B2610] hover:border-[#6E1B20] hover:bg-[#F2DFB4]"
                      : "border-emerald-500/35 bg-zinc-950 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-950/60 hover:text-white"
                  }`}
                >
                  {qChip}
                </button>
              ))}
            </div>

            {/* Spacious Chat Messages Area */}
            <div
              className={`mt-2.5 sm:mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden rounded-2xl border p-3 sm:p-4 ${
                assistantTheme === "light"
                  ? "border-[#C9A24D]/70 bg-[#EFE0BC]/45"
                  : "border-emerald-500/25 bg-zinc-950"
              }`}
            >
              {generalChat.map((m, idx) => {
                const gVoiceId = `general-${idx}`;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border px-4 py-3.5 text-sm sm:text-base leading-relaxed ${
                      m.role === "user"
                        ? assistantTheme === "light"
                          ? "ml-6 sm:ml-10 border-[#C9A24D] bg-[#EED18E] text-[#2A1C0E] shadow-xs"
                          : "ml-6 sm:ml-10 border-emerald-500/40 bg-emerald-600/25 text-emerald-50"
                        : assistantTheme === "light"
                        ? "mr-2 sm:mr-6 border-[#C9A24D]/70 bg-[#FFFDF6] text-[#2A1C0E] shadow-xs"
                        : "mr-2 sm:mr-6 border-zinc-800 bg-black text-zinc-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                        <span
                          className={`mr-2 font-bold ${
                            assistantTheme === "light"
                              ? m.role === "user"
                                ? "text-[#5C171B]"
                                : "text-[#6E1B20]"
                              : "text-emerald-400"
                          }`}
                        >
                          {m.role === "user" ? "You:" : "NIAT AI:"}
                        </span>
                        {renderFormattedMessage(m.content)}
                      </div>
                      {m.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => toggleVoiceBrief(m.content, gVoiceId)}
                          title="Play voice note for this reply"
                          className={`shrink-0 flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                            assistantTheme === "light"
                              ? "border-[#A67C2E] bg-[#FAF0D7] text-[#3B2610] hover:bg-[#F0DCAD]"
                              : "border-emerald-500/40 bg-zinc-900 text-emerald-300 hover:border-emerald-400"
                          }`}
                        >
                          {speakingId === gVoiceId ? (
                            <>
                              <Square className="h-3 w-3 text-rose-500" /> Stop
                            </>
                          ) : (
                            <>
                              <Volume2
                                className={`h-3.5 w-3.5 ${assistantTheme === "light" ? "text-[#6E1B20]" : "text-emerald-400"}`}
                              />{" "}
                              Voice
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {generalLoading && (
                <div
                  className={`mr-2 sm:mr-6 rounded-2xl border px-4 py-3 text-sm ${
                    assistantTheme === "light"
                      ? "border-[#C9A24D]/70 bg-[#FFFDF6] text-[#5C4426]"
                      : "border-zinc-800 bg-black text-emerald-300/80"
                  }`}
                >
                  <span className={`mr-2 font-bold ${assistantTheme === "light" ? "text-[#6E1B20]" : "text-emerald-400"}`}>
                    NIAT AI:
                  </span>
                  <span className="animate-pulse">Thinking...</span>
                </div>
              )}
              <div ref={generalChatEndRef} />
            </div>

            {/* ChatGPT-style Auto-Expanding Input & Voice Mic Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGeneralAsk();
              }}
              className={`mt-4 flex items-end gap-2 rounded-2xl border p-2 transition focus-within:ring-1 ${
                assistantTheme === "light"
                  ? "border-[#A67C2E] bg-[#FFFDF6] focus-within:border-[#6E1B20] focus-within:ring-[#6E1B20]/30"
                  : "border-emerald-500/40 bg-zinc-950 focus-within:border-emerald-400 focus-within:ring-emerald-400/30"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleVoiceInput("general")}
                title="Speak your question in any language"
                className={`shrink-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border text-sm transition ${
                  listeningTarget === "general"
                    ? "border-rose-500 bg-rose-500/20 text-rose-500 animate-pulse"
                    : assistantTheme === "light"
                    ? "border-[#A67C2E]/60 bg-[#FAF0D7] text-[#6E1B20] hover:bg-[#F0DCAD]"
                    : "border-emerald-500/40 bg-zinc-900 text-emerald-400 hover:border-emerald-400"
                }`}
              >
                {listeningTarget === "general" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <textarea
                ref={generalTextareaRef}
                rows={1}
                value={generalInput}
                onChange={(e) => setGeneralInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGeneralAsk();
                  }
                }}
                placeholder={`Ask NIAT AI (${form.preferred_language})...`}
                className={`min-h-[40px] max-h-36 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm sm:text-base leading-relaxed focus:outline-none ${
                  assistantTheme === "light"
                    ? "text-[#2A1C0E] placeholder-[#8C7355]"
                    : "text-white placeholder-zinc-500"
                }`}
              />
              <button
                type="submit"
                disabled={generalLoading || !generalInput.trim()}
                className={`shrink-0 flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  assistantTheme === "light"
                    ? "preserve-dark border border-[#C9A24D]/50 bg-[#6E1B20] hover:bg-[#571317]"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                <Send className="h-4 w-4" />
                {generalLoading ? "..." : "Ask AI"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
