import React, { useState, useEffect, useRef } from "react";
import orgLogos from "@/assets/logos/logoMap";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  BarChart,
  Target,
  CheckSquare,
  Link as LinkIcon,
  GripVertical,
  Plus,
  ArrowUp,
  Filter,
  Users,
  Settings,
  LayoutDashboard,
  CheckCircle2,
  Search,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Mail,
  Loader2,
  GitBranch,
  PenTool,
  LineChart,
  Download,
  Activity,
  TrendingUp,
  Sparkles,
  Shield,
  Zap,
  Crown,
  CreditCard
} from "lucide-react";

const SECTOR_OPTIONS = [
  "Workforce & Skills Training",
  "Youth Development",
  "Human & Social Services",
  "Community Health",
  "Arts & Culture",
  "Settlement & Immigration",
  "Education",
  "Housing & Homelessness",
  "Other",
];

function WaitlistModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [sector, setSector] = useState("");
  const [otherSector, setOtherSector] = useState("");
  const [step, setStep] = useState<"form" | "pledge">("form");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: { email: string; name: string; organization: string; sector: string }) => {
      const res = await apiRequest("POST", "/api/waitlist", data);
      return res.json();
    },
    onSuccess: (data) => {
      setMessage(data.message);
      setStep("pledge");
    },
    onError: (error: Error) => {
      try {
        const parsed = JSON.parse(error.message.split(": ").slice(1).join(": "));
        setMessage(parsed.message || "Something went wrong.");
      } catch {
        setMessage("Please enter a valid email address.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    mutation.mutate({
      email: email.trim(),
      name: name.trim(),
      organization: organization.trim(),
      sector: sector === "Other" ? otherSector.trim() : sector,
    });
  };

  const handlePledge = () => {
    // TODO: Wire up Stripe checkout for $5 pledge
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setEmail("");
        setName("");
        setOrganization("");
        setSector("");
        setOtherSector("");
        setStep("form");
        setMessage("");
        mutation.reset();
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9DA4BC] hover:text-[#4A5068] transition-colors z-20"
          data-testid="button-close-modal"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EEEDfb] flex items-center justify-center mb-4">
                <Mail size={24} className="text-[#5550BA]" />
              </div>
              <h3 className="font-display font-bold text-2xl text-[#211E62] mb-2">Get Early Access</h3>
              <p className="text-[#6A7290] mb-6">Be the first to know when SurveyMetrix launches. No spam, just updates.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5550BA] focus:ring-2 focus:ring-[#5550BA]/20 outline-none transition-all text-sm"
                  data-testid="input-name"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email, you@nonprofit.org"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5550BA] focus:ring-2 focus:ring-[#5550BA]/20 outline-none transition-all text-sm"
                  data-testid="input-email"
                />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Organization name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5550BA] focus:ring-2 focus:ring-[#5550BA]/20 outline-none transition-all text-sm"
                  data-testid="input-organization"
                />
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5550BA] focus:ring-2 focus:ring-[#5550BA]/20 outline-none transition-all text-sm text-[#211E62] appearance-none bg-white"
                  data-testid="select-sector"
                >
                  <option value="" disabled>Select your sector</option>
                  {SECTOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {sector === "Other" && (
                  <input
                    type="text"
                    value={otherSector}
                    onChange={(e) => setOtherSector(e.target.value)}
                    placeholder="Tell us your sector"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5550BA] focus:ring-2 focus:ring-[#5550BA]/20 outline-none transition-all text-sm"
                    data-testid="input-other-sector"
                  />
                )}
                {message && step === "form" && (
                  <p className="text-red-500 text-sm" data-testid="text-error">{message}</p>
                )}
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-[#5550BA] text-white font-bold py-3 rounded-xl hover:bg-[#5550BA]/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#5550BA]/20"
                  data-testid="button-submit-waitlist"
                >
                  {mutation.isPending ? (
                    <><Loader2 size={18} className="animate-spin" /> Joining...</>
                  ) : (
                    "Get Early Access"
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === "pledge" && (
            <motion.div
              key="pledge"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {/* ── Top: Thank you ── */}
              <div className="bg-gradient-to-br from-[#211E62] via-[#2E2A78] to-[#1a1754] px-7 pt-7 pb-7 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#5550BA]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#B86890]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-12 h-12 rounded-full bg-green-400/20 border border-green-400/40 flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 size={26} className="text-green-400" />
                  </motion.div>
                  <h3 className="font-display font-bold text-2xl leading-tight mb-2">
                    You're on the list{name ? `, ${name.split(" ")[0]}` : ""}!
                  </h3>
                  <p className="text-[#C4C0E8] text-sm leading-relaxed" data-testid="text-success">
                    We've saved your spot. You'll be among the first to get access when SurveyMetrix launches — no spam, just the good stuff.
                  </p>
                </div>
              </div>

              {/* ── Bottom: Pledge offer ── */}
              <div className="bg-[#F4F3FC] px-7 py-5">
                {/* Header row with price inline */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FAF0F3] flex items-center justify-center">
                      <Sparkles size={14} className="text-[#B86890]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#211E62] uppercase tracking-wider leading-none">Founding Tester Offer</p>
                      <p className="text-[10px] text-[#9DA4BC] mt-0.5">First 200 signups only</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-display text-2xl font-bold text-[#211E62]">$5</span>
                      <span className="text-[10px] text-[#9DA4BC] ml-0.5">one-time</span>
                    </div>
                    <p className="text-[9px] text-[#B86890] font-medium">100% refundable</p>
                  </div>
                </div>

                {/* 2×2 perk grid */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { icon: Zap,    text: "First access before public launch",      color: "text-[#5550BA]", bg: "bg-[#EEEDfb]" },
                    { icon: Shield, text: "2 months free at launch ($100+ value)",  color: "text-[#B86890]", bg: "bg-[#FAF0F3]" },
                    { icon: Crown,  text: "Founding Tester badge on your account",  color: "text-[#B86890]", bg: "bg-[#FAF0F3]" },
                    { icon: Users,  text: "Private channel with the product team",  color: "text-[#5550BA]", bg: "bg-[#EEEDfb]" },
                  ].map((perk) => (
                    <div key={perk.text} className="flex items-start gap-2 bg-white rounded-xl p-2.5">
                      <div className={`w-6 h-6 rounded-lg ${perk.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <perk.icon size={12} className={perk.color} />
                      </div>
                      <span className="text-[11px] text-[#4A5068] leading-snug">{perk.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handlePledge}
                  data-testid="button-pledge"
                  className="w-full bg-[#B86890] text-white font-bold py-3 rounded-xl hover:bg-[#9E4A74] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#B86890]/20 group text-sm"
                >
                  <CreditCard size={16} />
                  Pledge $5 — Become a Founding Tester
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={onClose}
                  data-testid="button-skip-pledge"
                  className="w-full text-center text-xs text-[#9DA4BC] hover:text-[#6A7290] mt-2.5 py-1.5 transition-colors"
                >
                  No thanks, I'll just stay on the waitlist
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const Step1 = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [added, setAdded] = useState<number[]>([]);

  const outcomes = [
    { emoji: "💰", name: "Wage Growth & Earnings", desc: "Measures entry-to-exit income change. Tracks whether participants are earning meaningfully more after program completion than when they first enrolled.", q: "How much has your income improved since joining this program?", tag: "WIOA", type: "Likert" },
    { emoji: "📋", name: "Job Retention at 6 Months", desc: "Tracks whether participants remain in employment 180 days after placement. A core accountability metric for funders and workforce boards.", q: "Are you currently employed at the same job you had 6 months ago?", tag: "WIOA", type: "Yes / No" },
    { emoji: "💛", name: "Empathy & Social Awareness", desc: "Assesses growth in perspective-taking and care for others. Validated against CASEL's social-emotional learning framework for youth programs.", q: "How often do you try to understand things from another person's point of view?", tag: "CASEL", type: "Likert" },
    { emoji: "😊", name: "Joy & Wellbeing", desc: "Uses validated psychometric questions to measure subjective wellbeing. Adapted from WHO-5 to reflect program participation and sense of belonging.", q: "How much has participating improved your sense of joy and wellbeing?", tag: "WHO-5", type: "Likert" },
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => { setPhase(2); setAdded([0]); }, 3500),
      setTimeout(() => setAdded([0, 2]), 6000),
      setTimeout(() => { setPhase(3); setAdded([0, 1, 2]); }, 8500),
      setTimeout(() => onComplete?.(), 11000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between z-10">
        <div>
          <h3 className="font-bold text-sm text-[#211E62]">Outcome Library</h3>
          <p className="text-[10px] text-[#6A7290]">Browse and manage the outcomes your surveys measure.</p>
        </div>
        {phase >= 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#5550BA] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md">
            <Plus size={10} /> Add Outcome
          </motion.div>
        )}
      </div>

      {/* Filter pills */}
      {phase >= 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {["All Outcomes 29", "Workforce Dev. 7", "Youth Dev. 7"].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className={`text-[9px] font-semibold px-2 py-1 rounded-full border ${i === 0 ? 'bg-[#5550BA] text-white border-[#5550BA]' : 'bg-white text-[#4A5068] border-gray-200'}`}
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Outcome cards — 2-col mobile / 3-col desktop */}
      <div className="flex-1 px-3 pb-3 overflow-hidden flex flex-col">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
          {outcomes.map((o, i) => {
            const isAdded = added.includes(i);
            return (
              <AnimatePresence key={o.name}>
                {phase >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.35 }}
                    className={`bg-white border rounded-xl p-2.5 flex flex-col transition-all relative ${isAdded ? 'border-[#5550BA] ring-1 ring-[#5550BA]/20 shadow-sm' : 'border-gray-200'}`}
                  >
                    {/* Add / check button top-right */}
                    {phase >= 2 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="absolute top-2 right-2">
                        {isAdded ? (
                          <div className="w-5 h-5 rounded-full bg-[#5550BA] flex items-center justify-center">
                            <CheckCircle2 size={11} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center">
                            <Plus size={10} className="text-gray-400" />
                          </div>
                        )}
                      </motion.div>
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2 ${isAdded ? 'bg-[#EEEDfb]' : 'bg-gray-50'}`}>{o.emoji}</div>
                    <div className={`text-[10px] font-bold leading-tight mb-1 pr-5 ${isAdded ? 'text-[#5550BA]' : 'text-[#211E62]'}`}>{o.name}</div>
                    <div className="text-[8px] text-[#6A7290] leading-snug flex-1 line-clamp-2 sm:line-clamp-4">{o.desc}</div>
                    {isAdded && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden sm:block text-[8px] text-[#6A7290] italic mt-1.5 leading-snug border-t border-[#EEEDfb] pt-1.5">"{o.q}"</motion.div>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[7px] text-[#6A7290] bg-gray-100 px-1 py-0.5 rounded font-medium">{o.type}</span>
                      <span className="text-[7px] text-[#5550BA] bg-[#EEEDfb] px-1 py-0.5 rounded font-medium">{o.tag}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
          {/* Placeholder 5th + 6th card slots to fill the row */}
          {phase >= 1 && [
            { emoji: "🧠", name: "Resilience & Self-Management", desc: "Measures emotional regulation and the ability to recover from setbacks. Tied to CASEL competencies used widely in youth-serving and workforce programs.", tag: "CASEL", type: "Likert" },
            { emoji: "🏠", name: "Housing Stability", desc: "Captures risk of losing stable housing in the next 60 days. A critical social determinant linked to program engagement and outcomes.", tag: "SDOH", type: "Yes / No" },
          ].map((o, i) => (
            <motion.div
              key={o.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-col"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2 bg-gray-50">{o.emoji}</div>
              <div className="text-[10px] font-bold leading-tight mb-1 text-[#211E62]">{o.name}</div>
              <div className="text-[8px] text-[#6A7290] leading-snug flex-1 line-clamp-2 sm:line-clamp-4">{o.desc}</div>
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[7px] text-[#6A7290] bg-gray-100 px-1 py-0.5 rounded font-medium">{o.type}</span>
                <span className="text-[7px] text-[#5550BA] bg-[#EEEDfb] px-1 py-0.5 rounded font-medium">{o.tag}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {phase >= 3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-2 bg-[#5550BA] text-white text-xs font-bold py-2 rounded-xl text-center shadow-md">
            3 outcomes selected — Build Survey →
          </motion.div>
        )}
      </div>

      {/* Cursor — aligned with 3-col grid card add buttons */}
      <motion.div className="absolute z-30 pointer-events-none" animate={{
        left:  added.length === 0 ? '29%' : added.length === 1 ? '90%' : added.length === 2 ? '60%' : '49%',
        top:   added.length === 0 ? '37%' : added.length === 1 ? '37%' : added.length === 2 ? '37%' : '91%',
      }} transition={{ duration: 0.7, ease: "easeInOut" }}>
        <svg width="16" height="20" viewBox="0 0 20 24" fill="none"><path d="M1 1L1 17.5L5.5 13.5L9 21L12 19.5L8.5 12H14.5L1 1Z" fill="#211E62" stroke="white" strokeWidth="1.5"/></svg>
      </motion.div>
    </div>
  );
};

const Step2 = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [added, setAdded] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [editDone, setEditDone] = useState(false);

  const libraryOutcomes = [
    { emoji: "📋", name: "Job Retention at 6 Months",   q: "Are you currently employed at the same job you had 6 months ago?",             type: "Yes / No", tag: "WIOA"   },
    { emoji: "💡", name: "Financial Literacy",           q: "How well do you feel you understand budgeting and managing your finances?",      type: "Likert",   tag: "SDOH"   },
    { emoji: "🔍", name: "Job Search Confidence",        q: "How confident do you feel about finding a new job right now?", qEdited: "How confident do you feel about finding work in digital marketing right now?", type: "Likert", tag: "Custom" },
    { emoji: "🌱", name: "Mental Wellbeing",             q: "Over the past two weeks, how often have you felt calm and at ease?",            type: "Likert",   tag: "WHO-5"  },
    { emoji: "🏆", name: "Credential Attainment",        q: "Have you obtained a new professional credential since starting the program?",   type: "Yes / No", tag: "WIOA"   },
    { emoji: "🤝", name: "Community Belonging",          q: "How strongly do you feel you belong to your local community?",                  type: "Likert",   tag: "CASEL"  },
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),            // all 6 library items appear
      setTimeout(() => setPhase(2), 2200),           // cursor → program dropdown (opens)
      setTimeout(() => setPhase(3), 3800),           // program selected
      setTimeout(() => setAdded([0]), 5000),         // select outcome #1 (Job Retention)
      setTimeout(() => setAdded([0, 2]), 6400),      // select outcome #3 (Job Search Confidence) — skips #2
      setTimeout(() => setAdded([0, 2, 4]), 7800),   // select outcome #5 (Credential Attainment) — skips #4
      setTimeout(() => setEditing(true), 9400),      // start editing Q2 (Job Search Confidence)
      setTimeout(() => { setEditDone(true); setEditing(false); }, 11200), // edit done
      setTimeout(() => onComplete?.(), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const allPrograms = ["Employment Readiness", "Digital Skills", "Youth Leadership"];

  // phase: 0=idle, 1=library shown, 2=cursor goes to program dropdown, 3=program selected, 4=outcomes added, 5=editing, 6=edit done+3rd outcome, 7=done
  return (
    <div className="w-full h-full overflow-hidden flex flex-col sm:flex-row relative">
      {/* Left: outcome library — capped height on mobile, fixed width on desktop */}
      <div className="h-[42%] sm:h-auto sm:w-[38%] border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col bg-gray-50/50 overflow-hidden">
        <div className="px-2 pt-2 pb-1 shrink-0">
          <div className="text-[8px] font-bold text-[#6A7290] uppercase tracking-widest mb-1">Outcome Library</div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-0.5">
            <Search size={9} className="text-gray-400 shrink-0" />
            <span className="text-[9px] text-gray-400">Search outcomes...</span>
          </div>
        </div>

        <div className="px-2 pb-1 space-y-1 flex-1 overflow-y-auto">
          {phase >= 1 && libraryOutcomes.map((o, i) => {
            const isAdded = added.includes(i);
            return (
              <motion.div
                key={o.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 border transition-all ${isAdded ? 'bg-[#EEEDfb] border-[#5550BA]/40' : 'bg-white border-gray-200'}`}
              >
                <span className="text-[11px] shrink-0">{o.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[9px] font-semibold truncate ${isAdded ? 'text-[#5550BA]' : 'text-[#211E62]'}`}>{o.name}</div>
                  <div className="hidden sm:flex gap-1 mt-0.5">
                    <span className="text-[7px] text-[#5550BA] bg-[#EEEDfb] px-1 rounded">{o.tag}</span>
                    <span className="text-[7px] text-[#6A7290] bg-gray-100 px-1 rounded">{o.type}</span>
                  </div>
                </div>
                {isAdded ? <CheckCircle2 size={10} className="text-[#5550BA] shrink-0" /> : <Plus size={10} className="text-gray-400 shrink-0" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right: program selector at top, then survey questions */}
      <div className="flex-1 flex flex-col">
        {/* Program selector — cursor goes here first */}
        <div className="px-2.5 pt-2.5 pb-2 border-b border-gray-100 relative">
          <div className="text-[8px] font-bold text-[#6A7290] uppercase tracking-wide mb-1.5">Link Survey to Program</div>
          <div className={`flex items-center justify-between bg-white border rounded-lg px-2.5 py-1.5 cursor-pointer transition-all ${phase >= 2 ? 'border-[#5550BA] ring-1 ring-[#5550BA]/20' : 'border-gray-200'}`}>
            {phase >= 3 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 min-w-0">
                {/* Program tile badge */}
                <div className="flex items-center gap-1.5 bg-[#EEEDfb] border border-[#5550BA]/20 rounded-md px-2 py-1 min-w-0">
                  <div className="w-4 h-4 rounded bg-[#5550BA] flex items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold text-white">ER</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold text-[#211E62] leading-none">Employment Readiness</div>
                    <div className="text-[7px] text-[#6A7290] leading-none mt-0.5">Workforce Program · Active</div>
                  </div>
                </div>
                <span className="text-[7px] text-[#9DA4BC] shrink-0">{added.length} q.</span>
              </motion.div>
            ) : (
              <span className="text-[9px] text-[#9DA4BC]">Select a program...</span>
            )}
            <ChevronDown size={10} className="text-[#9DA4BC] shrink-0 ml-1" />
          </div>
          {/* Dropdown options shown at phase 2 */}
          {phase === 2 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="absolute left-2.5 right-2.5 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-30">
              {allPrograms.map((p, i) => {
                const initials = p.split(" ").map(w => w[0]).join("").slice(0, 2);
                const colors = ["#5550BA", "rgb(168,85,247)", "#B86890"];
                const subtitles = ["Workforce Program", "Digital Training", "Youth Leadership"];
                return (
                  <div key={p} className={`flex items-center gap-2 px-2.5 py-1.5 border-b last:border-b-0 border-gray-100 ${i === 0 ? 'bg-[#EEEDfb]' : 'hover:bg-gray-50'}`}>
                    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: colors[i] }}>
                      <span className="text-[7px] font-bold text-white">{initials}</span>
                    </div>
                    <div>
                      <div className={`text-[9px] font-semibold ${i === 0 ? 'text-[#5550BA]' : 'text-[#211E62]'}`}>{p}</div>
                      <div className="text-[7px] text-[#9DA4BC]">{subtitles[i]}</div>
                    </div>
                    {i === 0 && <CheckCircle2 size={10} className="text-[#5550BA] ml-auto" />}
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>

        <div className="flex-1 px-2 py-2 overflow-hidden space-y-1.5">
          <AnimatePresence>
            {added.map((idx, surveyPos) => {
              const o = libraryOutcomes[idx];
              const isThisEditing = editing && idx === 2;
              const isThisDone = editDone && idx === 2;
              const questionText = isThisDone ? o.qEdited! : o.q;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className={`bg-white border rounded-lg px-2 py-1.5 shadow-sm ${isThisEditing ? 'border-[#B86890] ring-1 ring-[#B86890]/20' : isThisDone ? 'border-[#B86890]/40' : 'border-[#5550BA]/25'}`}
                >
                  {/* Top row: number badge + type + name + status */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-4 h-4 rounded bg-[#EEEDfb] text-[#5550BA] text-[7px] font-bold flex items-center justify-center shrink-0">{surveyPos + 1}</span>
                    <span className="text-[7px] font-semibold text-white bg-[#5550BA] px-1 py-0.5 rounded shrink-0">{o.type}</span>
                    <span className="text-[8px] text-[#6A7290] truncate flex-1">{o.name}</span>
                    {isThisEditing && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 text-[7px] text-[#B86890] font-medium shrink-0">
                        <PenTool size={7} /> Editing
                      </motion.span>
                    )}
                    {isThisDone && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 text-[7px] text-[#B86890] font-medium shrink-0">
                        <CheckCircle2 size={7} /> Personalised
                      </motion.span>
                    )}
                  </div>
                  {/* Question text */}
                  <div className={`text-[9px] leading-snug mb-1 ${isThisEditing ? 'text-[#B86890] font-medium' : 'text-[#211E62]'}`}>
                    {questionText}
                    {isThisEditing && <motion.span animate={{ opacity: [1,0,1] }} transition={{ repeat: Infinity, duration: 0.7 }} className="inline-block w-0.5 h-2.5 bg-[#B86890] ml-0.5 align-middle" />}
                  </div>
                  {/* Compact input preview */}
                  {o.type === "Yes / No" ? (
                    <div className="flex gap-1">
                      <div className="flex-1 text-center text-[7px] font-semibold border border-gray-200 rounded py-0.5 text-[#211E62] bg-gray-50">Yes</div>
                      <div className="flex-1 text-center text-[7px] font-semibold border border-gray-200 rounded py-0.5 text-[#211E62] bg-gray-50">No</div>
                    </div>
                  ) : (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className="flex-1 text-center text-[7px] border border-gray-200 rounded py-0.5 text-[#9DA4BC] bg-gray-50">{n}</div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {added.length === 0 && phase >= 1 && (
            <motion.div animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="border-2 border-dashed border-[#DAD8F6] rounded-xl h-14 flex items-center justify-center">
              <span className="text-[9px] text-[#5550BA] font-medium">Click an outcome to add →</span>
            </motion.div>
          )}
          {editDone && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-green-50 border border-green-200 rounded-lg py-1.5 px-2 flex items-center gap-1.5">
              <CheckCircle2 size={10} className="text-green-600 shrink-0" />
              <div>
                <div className="text-[8px] font-bold text-green-700">Survey ready · 3 questions linked</div>
                <div className="text-[7px] text-green-600">Employment Readiness Program · Active</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Cursor — idle → dropdown → item[0] → item[2] → item[4] → edit Q2 */}
      <motion.div className="absolute z-30 pointer-events-none" animate={{
        left: phase < 2 ? '19%'
            : phase < 3 ? '72%'
            : added.length === 0 ? '18%'
            : added.length === 1 ? '18%'
            : added.length === 2 ? '18%'
            : editing ? '78%'
            : '78%',
        top:  phase < 2 ? '52%'
            : phase < 3 ? '21%'
            : added.length === 0 ? '38%'   // row 0 of 6
            : added.length === 1 ? '56%'   // row 2 of 6
            : added.length === 2 ? '72%'   // row 4 of 6
            : editing ? '58%'
            : '58%',
      }} transition={{ duration: 0.6, ease: "easeInOut" }}>
        <svg width="14" height="18" viewBox="0 0 20 24" fill="none"><path d="M1 1L1 17.5L5.5 13.5L9 21L12 19.5L8.5 12H14.5L1 1Z" fill="#211E62" stroke="white" strokeWidth="1.5"/></svg>
      </motion.div>
    </div>
  );
};

const Step3 = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),   // filter bar / computing tooltip
      setTimeout(() => setPhase(2), 3200),   // KPI cards animate in
      setTimeout(() => setPhase(3), 6000),   // bottom panels slide in
      setTimeout(() => setPhase(4), 9000),   // insight badge appears
      setTimeout(() => onComplete?.(), 14500), // hold fully-loaded dashboard for 5s then cycle
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const programs = [
    { name: "Employment Readiness", color: "#5550BA" },
    { name: "Digital Skills", color: "rgb(168,85,247)" },
    { name: "Youth Leadership", color: "#B86890" },
  ];

  const stats = [
    { label: "Job Confidence", value: "76", unit: "%", change: "+18%", from: "58% → 76%", color: "#5550BA", delay: 0.15 },
    { label: "Job Retention", value: "81", unit: "%", change: "+9%", from: "72% → 81%", color: "rgb(168,85,247)", delay: 0.3 },
    { label: "Wellbeing Score", value: "3.9", unit: "/5", change: "+0.7", from: "3.2 → 3.9", color: "#B86890", delay: 0.45 },
  ];

  // Empathy & Social Awareness — pre/post score as % of 5-point scale
  const empathyBars = [
    { prog: "Employment Readiness", color: "#5550BA", pre: 56, post: 74 },
    { prog: "Digital Skills", color: "rgb(168,85,247)", pre: 52, post: 70 },
    { prog: "Youth Leadership", color: "#B86890", pre: 58, post: 82 },
  ];

  // Credential Attainment — quarterly % of participants who obtained a credential
  const quarterData = [
    { q: "Q1", er: 38, ds: 45, yl: 31 },
    { q: "Q2", er: 52, ds: 58, yl: 44 },
    { q: "Q3", er: 67, ds: 72, yl: 59 },
    { q: "Q4", er: 81, ds: 79, yl: 73 },
  ];

  return (
    <div className="w-full h-full flex flex-col relative bg-[#FAFAFA] overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-1.5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-[11px] font-bold text-[#211E62]">Impact Dashboard</div>
            <div className="text-[8px] text-[#6A7290]">Aggregated across programs & timeframes</div>
          </div>
          <div className="flex gap-1">
            <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-[7px] text-[#6A7290] font-medium">
              📅 All of 2024 <ChevronDown size={7} />
            </div>
            <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-[7px] text-[#6A7290] font-medium">
              3 Surveys <ChevronDown size={7} />
            </div>
          </div>
        </div>
        {/* Program filter chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {programs.map((p, i) => (
            <motion.span
              key={p.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="text-[7px] font-semibold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5"
              style={{ color: p.color, borderColor: p.color + "50", backgroundColor: p.color + "15" }}
            >
              <span className="w-1 h-1 rounded-full inline-block" style={{ backgroundColor: p.color }} />
              {p.name}
            </motion.span>
          ))}
          <span className="text-[7px] text-[#9DA4BC] ml-1">342 responses</span>
        </div>
      </div>

      {/* Phase 1: computing tooltip */}
      {phase === 1 && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-14 left-1/2 -translate-x-1/2 bg-[#211E62] text-white text-[8px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-30 shadow-lg flex items-center gap-1.5">
          <motion.span animate={{ opacity: [1,0.4,1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Aggregating 342 responses across 3 programs & 4 quarters...
        </motion.div>
      )}

      {/* KPI stat cards */}
      <div className="px-2.5 pt-2 pb-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-xl" style={{ backgroundColor: s.color }} />
              <div className="text-[7px] text-[#6A7290] font-medium mb-0.5 mt-0.5">{s.label}</div>
              {phase >= 2 ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: s.delay }}>
                  <div className="text-base font-bold text-[#211E62] leading-none">
                    {s.value}<span className="text-[9px] text-[#9DA4BC] font-medium">{s.unit}</span>
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: s.delay + 0.3 }}>
                    <span className="text-[7px] font-bold text-[#B86890] bg-[#FAF0F3] px-1 py-0.5 rounded inline-flex items-center gap-0.5 mt-0.5">
                      <ArrowUp size={6} />{s.change}
                    </span>
                    <div className="text-[6px] text-[#9DA4BC] mt-0.5">{s.from} avg.</div>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="text-base font-bold text-gray-200">—</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom panels: bar chart + quarterly trend */}
      {phase >= 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1 px-2.5 pb-2.5 grid grid-cols-2 gap-2 overflow-hidden">

          {/* Left: Empathy & Social Awareness pre/post by program */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 flex flex-col">
            <div className="text-[8px] font-bold text-[#211E62] mb-0.5">Empathy & Social Awareness</div>
            <div className="text-[6.5px] text-[#9DA4BC] mb-2">Pre ░ → Post ▓ avg. score (out of 5)</div>
            <div className="space-y-2.5 flex-1">
              {empathyBars.map((b, i) => (
                <div key={b.prog}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[7px] text-[#6A7290] truncate max-w-[70px]">{b.prog}</span>
                    <span className="text-[7px] font-bold" style={{ color: b.color }}>{(b.post / 20).toFixed(1)}/5</span>
                  </div>
                  {/* Pre bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${b.pre}%` }}
                      transition={{ delay: 0.1 + i * 0.12, duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full opacity-30"
                      style={{ backgroundColor: b.color }}
                    />
                  </div>
                  {/* Post bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${b.post}%` }}
                      transition={{ delay: 0.4 + i * 0.12, duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Credential Attainment quarterly per program */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 flex flex-col">
            <div className="text-[8px] font-bold text-[#211E62] mb-0.5">Credential Attainment</div>
            <div className="text-[6.5px] text-[#9DA4BC] mb-1.5">Quarterly % · All programs · 2024</div>

            {/* Mini grouped bar chart by quarter */}
            <div className="flex-1 flex items-end gap-1.5">
              {quarterData.map((qd, qi) => (
                <div key={qd.q} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex items-end gap-0.5" style={{ height: 44 }}>
                    {[
                      { val: qd.er, color: "#5550BA" },
                      { val: qd.ds, color: "rgb(168,85,247)" },
                      { val: qd.yl, color: "#B86890" },
                    ].map((bar, bi) => (
                      <motion.div
                        key={bi}
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: bar.color }}
                        initial={{ height: 0 }}
                        animate={{ height: `${(bar.val / 100) * 44}px` }}
                        transition={{ delay: 0.3 + qi * 0.12 + bi * 0.05, duration: 0.5, ease: "easeOut" }}
                      />
                    ))}
                  </div>
                  <span className="text-[6px] text-[#9DA4BC]">{qd.q}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {programs.map(p => (
                <div key={p.name} className="flex items-center gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: p.color }} />
                  <span className="text-[6px] text-[#6A7290]">{p.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>

            {phase >= 4 && (
              <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-1.5 bg-[#EEEDfb] rounded-lg px-1.5 py-1 flex items-center gap-1">
                <TrendingUp size={8} className="text-[#5550BA] shrink-0" />
                <span className="text-[6.5px] text-[#5550BA] font-semibold">All 3 programs improved Q1→Q4</span>
              </motion.div>
            )}
          </div>

        </motion.div>
      )}

      {/* Cursor — aligned with filter bar → KPI cards → bottom panels */}
      <motion.div className="absolute z-30 pointer-events-none" animate={{
        left: phase < 2 ? '74%' : phase < 3 ? '50%' : phase < 4 ? '25%' : '76%',
        top:  phase < 2 ? '9%'  : phase < 3 ? '44%' : phase < 4 ? '72%' : '88%',
      }} transition={{ duration: 0.7, ease: "easeInOut" }}>
        <svg width="14" height="18" viewBox="0 0 20 24" fill="none"><path d="M1 1L1 17.5L5.5 13.5L9 21L12 19.5L8.5 12H14.5L1 1Z" fill="#211E62" stroke="white" strokeWidth="1.5"/></svg>
      </motion.div>
    </div>
  );
};

const stepsData = [
  {
    title: "Define & Link Metrics",
    description: "Set clear outcomes and connect strategic KPIs directly to survey questions.",
    component: Step1,
    label: "STRATEGY",
    icon: GitBranch
  },
  {
    title: "Build & Personalize",
    description: "Drag and drop to build surveys, then tweak text for specific contexts.",
    component: Step2,
    label: "COLLECTION",
    icon: PenTool
  },
  {
    title: "Analyze Impact",
    description: "Watch data flow in. Instantly see scores and trends across your programs.",
    component: Step3,
    label: "REPORTING",
    icon: LineChart
  }
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const animationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = animationRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animationStarted) {
          setAnimationStarted(true);
          setIsAutoPlaying(true);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animationStarted]);

  // Cycling is driven entirely by each step's onComplete callback — no fixed interval

  return (
    <div className="min-h-screen bg-[#FDFCFA] text-[#211E62] font-sans selection:bg-[#B86890]/20">
      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
      
      {/* 1) Nav bar */}
      <header className="px-6 lg:px-12 py-4 flex justify-between items-center bg-[#FDFCFA] border-b border-[#DAD8F6] sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="SurveyMetrix" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-xl text-[#211E62]">Survey<span className="text-[#5550BA]">Metrix</span></span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6 text-xs font-medium items-center uppercase tracking-wider">
          <a href="#how-it-works" className="text-[#44429C] hover:text-[#211E62] transition-colors">How it works</a>
          <a href="#impact-areas" className="text-[#44429C] hover:text-[#211E62] transition-colors">Impact Areas</a>
          <button onClick={() => setShowWaitlist(true)} data-testid="button-waitlist-nav" className="bg-[#5550BA] text-white px-5 py-2.5 rounded-lg hover:bg-[#44429C] transition-colors font-semibold normal-case tracking-normal text-sm">
            Get Early Access
          </button>
        </div>
        
        {/* Mobile Nav Toggle */}
        <div className="md:hidden">
          <button className="text-[#4A5068]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#DAD8F6] px-6 py-4 flex flex-col gap-3 sticky top-[57px] z-50">
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#44429C] py-2">How it works</a>
          <a href="#impact-areas" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#44429C] py-2">Impact Areas</a>
          <button onClick={() => { setShowWaitlist(true); setMobileMenuOpen(false); }} data-testid="button-waitlist-mobile-nav" className="bg-[#5550BA] text-white px-5 py-2.5 rounded-lg font-semibold text-sm w-full">
            Get Early Access
          </button>
        </div>
      )}

      {/* 2) Hero Section */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 bg-[#EEEDfb]" style={{ height: 'calc(100% - 240px)' }}></div>
        <div className="absolute inset-x-0 bottom-0 bg-[#FDFCFA]" style={{ height: '240px' }}></div>

        <div className="relative z-10 pt-8 sm:pt-10 md:pt-14 pb-8 sm:pb-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block bg-[#DAD8F6] border border-[#BCB8EE] text-[#2E2E7A] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                Outcome Measurement for Nonprofits
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3.25rem] text-[#211E62] mb-5 sm:mb-6 leading-[1.2] font-semibold"
            >
              <span style={{ fontStyle: "italic" }} className="text-[#B86890]">Finally.</span>{' '}
              A survey tool built for nonprofits that actually{' '}
              <span style={{ fontStyle: "italic" }} className="text-[#5550BA]">measures outcomes</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-[#4A5068] mb-10 leading-relaxed max-w-3xl mx-auto font-light"
            >
              With SurveyMetrics, you choose your outcomes, build surveys in a few clicks, and measure participant change automatically — across every program, every cohort, every year.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
            >
              <button onClick={() => setShowWaitlist(true)} data-testid="button-waitlist-hero" className="bg-[#5550BA] text-white text-base font-semibold px-7 py-3 rounded-lg hover:bg-[#44429C] transition-all hover:-translate-y-0.5">
                Get Early Access — Free
              </button>
            </motion.div>

            <div className="w-11 h-0.5 bg-[#B86890] rounded-full mx-auto mb-8"></div>

            <motion.div
              ref={animationRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              id="platform"
              className="scroll-mt-20"
            >
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#5550BA] via-[#B86890] to-[#948EDE] rounded-t-2xl"></div>
                <div className="min-h-[420px] sm:min-h-[460px] lg:min-h-[520px] relative p-2 sm:p-3 md:p-6">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#B86890]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#EEEDfb] rounded-full blur-3xl"></div>
                  </div>
                  <div className="w-full h-full relative z-10" style={{ minHeight: '400px' }}>
                    {animationStarted ? (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStep}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-0 w-full h-full"
                        >
                          {React.createElement(stepsData[currentStep].component, {
                            onComplete: () => {
                              const nextStep = (currentStep + 1) % stepsData.length;
                              setCurrentStep(nextStep);
                              setHighestStep((prev) => Math.max(prev, nextStep));
                            }
                          })}
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-[#DAD8F6] border-t-[#5550BA] animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="border-t border-[#DAD8F6]"></div></div>

      {/* Scroll-based 3-Step Journey */}
      <section id="how-it-works" className="py-8 sm:py-14 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-block bg-[#DAD8F6] border border-[#BCB8EE] text-[#2E2E7A] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
              How it works
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#211E62] mb-0">
              Three steps to <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }} className="text-[#5550BA]">real</span> outcomes
            </h2>
          </motion.div>

          <div className="space-y-10 sm:space-y-16">
            {[
              {
                step: "1",
                title: "Choose what you want to measure",
                subtitle: "Start with what matters",
                body: "Pick from a pre-validated outcome library — wellbeing, confidence, job retention, skill gain, belonging — or add your own outcomes based on your logic model. Aligned to WIOA, CASEL, and SDOH standards your funders already recognise.",
                mobileBody: "Choose from validated outcomes aligned to WIOA, CASEL, and SDOH — or add your own.",
                highlights: [],
                visual: (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="rounded-2xl overflow-hidden shadow-xl border border-[#DAD8F6] h-[340px] sm:h-[380px]"
                  >
                    <img
                      src="/outcome-library.png"
                      alt="Outcome Library screenshot"
                      className="w-full h-full object-cover object-top block"
                    />
                  </motion.div>
                ),
              },
              {
                step: "2",
                title: "Build surveys in a few clicks",
                subtitle: "Generated, then personalized",
                body: "Pre- and post-program surveys are built automatically from validated question sets. No writing. No guessing about whether your questions actually measure what you think they do.",
                mobileBody: "Surveys are auto-built from validated question sets. No writing, no guessing.",
                highlights: [],
                visual: (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="rounded-2xl overflow-hidden shadow-xl border border-[#DAD8F6] h-[340px] sm:h-[380px]"
                  >
                    <img
                      src="/survey-builder.png"
                      alt="Survey builder screenshot"
                      className="w-full h-full object-cover object-top block"
                    />
                  </motion.div>
                ),
              },
              {
                step: "3",
                title: "See outcomes — not just responses",
                subtitle: "Data meets meaning",
                body: "As responses come in, SurveyMetrics calculates outcomes automatically. How much did confidence improve? Which cohorts are performing best? You can answer those questions now — without touching a spreadsheet.",
                mobileBody: "Responses become outcomes automatically. See which programs work — no spreadsheets needed.",
                highlights: [],
                visual: (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="rounded-2xl overflow-hidden shadow-xl border border-[#DAD8F6] h-[340px] sm:h-[380px]"
                  >
                    <img
                      src="/dashboard.png"
                      alt="Outcome dashboard screenshot"
                      className="w-full h-full object-cover object-top block"
                    />
                  </motion.div>
                ),
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
              >
                <div className="w-full lg:w-1/2">
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-[#211E62] mb-3 sm:mb-4">
                    {step.step}. {step.title}
                  </h3>
                  <p className="sm:hidden text-[#4A5068] text-sm font-light leading-relaxed">{step.mobileBody}</p>
                  <p className="hidden sm:block text-[#4A5068] text-base font-light leading-relaxed">{step.body}</p>
                </div>
                <div className="w-full lg:w-1/2">
                  {step.visual}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Ticker */}
      <section className="py-16 px-6 bg-[#EEEDfb] overflow-hidden">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[#211E62] text-2xl md:text-3xl font-display mb-10"
        >
          200+ nonprofit teams already on the list.
        </motion.p>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#EEEDfb] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#EEEDfb] to-transparent z-10 pointer-events-none"></div>

          <div className="flex gap-6 animate-scroll-left">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-6 shrink-0">
                {orgLogos.map((org) => (
                  <div
                    key={`${setIdx}-${org.name}`}
                    className="flex items-center gap-3 bg-white border border-[#DAD8F6] rounded-xl px-5 py-3 shrink-0"
                  >
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} className="w-9 h-9 rounded-lg object-contain" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#DAD8F6] flex items-center justify-center text-[#5550BA] font-bold text-xs">
                        {org.initials}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[#211E62] whitespace-nowrap">{org.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="border-t border-[#DAD8F6]"></div></div>

      {/* Sectors Section */}
      <section id="impact-areas" className="py-14 sm:py-24 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 sm:mb-14"
          >
            <div className="text-xs font-semibold text-[#5550BA] uppercase tracking-widest mb-4">Built for nonprofit programs</div>
            <p className="text-[#4A5068] text-base font-light max-w-lg leading-relaxed">
              Pre-built outcome frameworks for every major nonprofit sector — no setup from scratch, no external consultant, no PhD required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                emoji: "👷",
                title: "Workforce & Skills Training",
                desc: "Measure wage growth, job retention, credential attainment, and digital literacy across employment programs and cohorts.",
                tags: ["WIOA", "ESF", "OECD"],
              },
              {
                emoji: "🌱",
                title: "Youth Development",
                desc: "Track resilience, confidence, belonging, goal-setting, and social-emotional learning in youth and mentorship programs.",
                tags: ["CASEL", "SEL frameworks"],
              },
              {
                emoji: "🤝",
                title: "Human & Social Services",
                desc: "Measure housing stability, financial wellbeing, employment readiness, and daily functioning across wraparound service programs.",
                tags: ["SDOH", "PRAPARE"],
              },
              {
                emoji: "🏥",
                title: "Community Health",
                desc: "Run SDOH screeners, food security surveys, and social connection assessments — with built-in longitudinal follow-up sequences.",
                tags: ["PRAPARE", "WHO-5"],
              },
              {
                emoji: "🎨",
                title: "Arts & Culture",
                desc: "Quantify joy, creative confidence, community cohesion, and reduced isolation — outcomes that foundation funders increasingly require as evidence.",
                tags: ["WHO-5", "UCLA Scale"],
              },
              {
                emoji: "🌍",
                title: "Settlement & Immigration",
                desc: "Track language confidence, social integration, employment readiness, and service navigation for newcomer and refugee support programs.",
                tags: ["Custom", "IRCC-aligned"],
              },
            ].map((sector, i) => (
              <motion.div
                key={sector.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                className="bg-white border border-[#DAD8F6] rounded-2xl p-7 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-4">{sector.emoji}</div>
                <h3 className="font-bold text-lg text-[#211E62] mb-2">{sector.title}</h3>
                <p className="text-[#4A5068] text-sm leading-relaxed mb-4">{sector.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {sector.tags.map((tag) => (
                    <span key={tag} className="text-xs font-semibold text-[#5550BA] bg-[#EEEDfb] px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="border-t border-[#DAD8F6]"></div></div>

      {/* Cross-Program Outcomes */}
      <section className="py-14 sm:py-24 px-4 sm:px-6 bg-[#FDFCFA]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
            <div className="w-full lg:w-5/12">
              <div className="text-xs font-semibold text-[#5550BA] uppercase tracking-widest mb-4">Cross-program outcomes</div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-[#211E62] mb-5 leading-[1.1]">
                Every program, every cohort, one outcome view.
              </h2>
              <p className="text-[#4A5068] text-base font-light leading-relaxed">
                Instead of a separate spreadsheet for every program, SurveyMetrix automatically combines outcomes across all your programs — and keeps them updated as new responses come in.
              </p>
            </div>

            <div className="w-full lg:w-7/12">
              <div className="bg-white rounded-2xl border border-[#DAD8F6] shadow-lg overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#DAD8F6]">
                  {[
                    { label: "Total Participants", value: "521", sub: "▲ 18% vs last year" },
                    { label: "Avg. Wage Growth", value: "+$4.80", sub: "▲ /hr across all programs" },
                    { label: "6-Mo Retention", value: "74%", sub: "▲ 6pts vs 2024 cohorts" },
                    { label: "Response Rate", value: "68%", sub: "— Across 7 active surveys" },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className={`p-3 sm:p-5 ${i < 3 ? 'md:border-r border-[#DAD8F6]' : ''} ${i < 2 ? 'border-b md:border-b-0 border-[#DAD8F6]' : ''} ${i === 0 ? 'border-r border-[#DAD8F6] md:border-r' : ''} ${i === 2 ? 'border-r border-[#DAD8F6] md:border-r' : ''}`}
                    >
                      <div className="text-[9px] sm:text-[10px] text-[#6A7290] uppercase tracking-wider font-medium mb-1">{stat.label}</div>
                      <div className="font-display text-xl sm:text-2xl text-[#211E62] font-bold">{stat.value}</div>
                      <div className="text-[9px] sm:text-[10px] text-[#5550BA] font-medium mt-1 hidden sm:block">{stat.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#211E62]">Outcome Comparison Across Programs</div>
                      <div className="text-[9px] sm:text-[10px] text-[#6A7290]">Pre → Post improvement per outcome, all 2025 cohorts</div>
                    </div>
                    <span className="text-xs text-[#5550BA] font-medium hidden md:inline">View full breakdown →</span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-[#DAD8F6]">
                          <th className="text-left py-2 pr-4 text-[10px] text-[#6A7290] uppercase tracking-wider font-semibold">Program</th>
                          <th className="text-center py-2 px-2 text-[10px] text-[#6A7290] uppercase tracking-wider font-semibold">Wage Growth</th>
                          <th className="text-center py-2 px-2 text-[10px] text-[#6A7290] uppercase tracking-wider font-semibold">Job Retention (6mo)</th>
                          <th className="text-center py-2 px-2 text-[10px] text-[#6A7290] uppercase tracking-wider font-semibold">Digital Literacy</th>
                          <th className="text-center py-2 px-2 text-[10px] text-[#6A7290] uppercase tracking-wider font-semibold">Confidence</th>
                          <th className="text-center py-2 px-2 text-[10px] text-[#6A7290] uppercase tracking-wider font-semibold">Participants</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Digital Skills Bootcamp", color: "bg-[#5550BA]", wage: "+$5.20/hr", retention: "81%", retUp: true, literacy: "+38%", confidence: "+29%", participants: "148" },
                          { name: "Youth Leadership", color: "bg-[#B86890]", wage: "N/A", retention: "N/A", retUp: null, literacy: "+22%", confidence: "+44%", participants: "92" },
                          { name: "Newcomer Employment", color: "bg-[#948EDE]", wage: "+$4.10/hr", retention: "77%", retUp: true, literacy: "+31%", confidence: "+37%", participants: "214" },
                          { name: "Trades Pathways", color: "bg-[#44429C]", wage: "+$6.90/hr", retention: "62%", retUp: false, literacy: "+17%", confidence: "+18%", participants: "67" },
                        ].map((row, i) => (
                          <tr
                            key={row.name}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${row.color} shrink-0`}></span>
                                <span className="font-medium text-[#211E62] whitespace-nowrap">{row.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={row.wage === "N/A" ? "text-[#9DA4BC]" : "text-[#5550BA] font-medium"}>
                                {row.wage !== "N/A" && "▲ "}{row.wage}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={row.retention === "N/A" ? "text-[#9DA4BC]" : row.retUp ? "text-[#5550BA] font-medium" : "text-[#B86890] font-medium"}>
                                {row.retention !== "N/A" && (row.retUp ? "▲ " : "▼ ")}{row.retention}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="text-[#5550BA] font-medium">▲ {row.literacy}</span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className="text-[#5550BA] font-medium">▲ {row.confidence}</span>
                            </td>
                            <td className="text-center py-3 px-2 text-[#211E62]">{row.participants}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5) Final CTA + Footer */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-b from-[#1a1754] via-[#211E62] to-[#19163f] pt-16 sm:pt-24 pb-8 sm:pb-10 px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-block bg-[#5550BA]/30 border border-[#948EDE]/30 text-[#948EDE] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-8">
              ✦ Early Access — First Month Free
            </div>

            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-[3.5rem] text-white mb-6 leading-[1.1]">
              Stop merging spreadsheets.{' '}Start measuring{' '}
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }} className="text-[#B86890] text-[110%]">outcomes</span>.
            </h2>

            <p className="text-[#948EDE] text-base md:text-lg font-light mb-10 max-w-lg mx-auto leading-relaxed">
              Join the SurveyMetrix waitlist and get early access when we launch. Takes 30 seconds. No commitment.
            </p>

            <button
              onClick={() => setShowWaitlist(true)}
              data-testid="button-waitlist-cta"
              className="bg-[#B86890] text-white text-base font-semibold px-8 py-3.5 rounded-lg hover:bg-[#9E4A74] transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              Get Early Access <ArrowRight size={16} />
            </button>

          </motion.div>

          <div className="max-w-5xl mx-auto mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-[#5550BA]/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SurveyMetrix" className="h-7 w-7 rounded-lg object-contain brightness-0 invert" />
              <span className="font-display text-base text-white">Survey<span className="text-[#948EDE]">Metrix</span></span>
            </div>

            <div className="flex gap-6 text-xs font-medium text-[#948EDE]">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <div className="text-xs text-[#7268CD]">
              © {new Date().getFullYear()} SurveyMetrix. All rights reserved.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}