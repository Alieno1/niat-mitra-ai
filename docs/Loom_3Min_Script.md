# 3-Minute Loom Demo Script — NIAT Mitra AI

**[0:00 – 0:30] The Hook & The Problem**
- "Hi NxtWave team! In my audit of NIAT, I noticed two huge bottlenecks: first, NAT-qualified leads have a strict 7-day window before lapsing into the Open Market. Second, parents hesitate on ₹8L–₹18L fees because of dual-degree confusion, and human affiliates lose their ₹30K–₹80K payout if a student gets a scholarship—so they hide it."
- "So for Track B, I built **NIAT Mitra AI**—a 5-component, vernacular parent closer backed by **Neon Postgres**, **OpenRouter tool-calling**, and live `niatindia.com` verification."

**[0:30 – 1:45] Live Demo: Parent & Student Portal**
- Open the **Parent & Student Portal** tab (show both **Light Mode** & **Dark Mode**).
- Select any of the **12 Parent Scenarios** (e.g., *Andhra Pradesh Parent (Telugu)* or *Bihar Parent (Hindi)*) and click **Verify & Generate Parent Guide**.
- Point to the **4 Real-Time Tool Calls**:
  1. `match_niat_campus()` — queries Neon Postgres across 21 verified CAT-A/CAT-B universities.
  2. `calculate_scholarship_and_roi()` — transparently calculates NAT merit waiver vs. local Tier-3 college ROI.
  3. `fetch_verified_proofs()` — pulls real student revenue proofs (like *Rockerz IT Solutions* at Aurora) and enforces `/llm-info` legal guardrails.
  4. `fetch_live_niat_public_status()` — runs a live HTTP check against `niatindia.com/campus/...`.
- Play the **11-Language Voice Note**, ask a follow-up doubt via text or mic in **Ask Follow-Up Doubts**, and click **Book Visit** to lock the 7-day window and prepare the WhatsApp dispatch.
- Open the floating **Ask NIAT AI** assistant to show instant multilingual Q&A with voice input/output.

**[1:45 – 2:45] Live Demo: Dashboard, 7-Day Lead Pipeline & Partner Campuses**
- Switch to **Dashboard**: show live **Neon Postgres KPIs** (Total Candidates, SR Paid, Pending 7-Day Window, Total CAC Capital Saved), interactive **Weekly / Monthly / Quarterly** charts, stage filtering, live donut percentages, **Automated Vernacular WhatsApp Dispatches**, and the **Agent Tool Execution Audit Log**.
- Switch to **7-Day Lead Pipeline**: demonstrate search, row selection, bulk **Reconcile**, and **Export CSV**.
- Switch to **Partner Campuses**: show all **21 Verified Partner Universities** with direct links to their **Official Websites**.

**[2:45 – 3:00] Closing**
- "Everything you just saw is live on Neon Postgres and OpenRouter with real tool-calling and 11-language voice support. Thank you for reviewing!"

