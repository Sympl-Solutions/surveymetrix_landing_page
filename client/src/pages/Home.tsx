import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import orgLogos from "@/assets/logos/logoMap";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, WAITLIST_COLLECTION } from "@/lib/firebase";
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
  CreditCard,
  Instagram,
  Facebook
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

// Submit to Mailchimp via JSONP (avoids CORS — standard approach for Mailchimp embeds)
function submitToMailchimp(data: { email: string; name: string; organization: string; sector: string }): Promise<void> {
  return new Promise((resolve) => {
    const cbName = `mc_cb_${Date.now()}`;
    const timer = setTimeout(() => {
      delete (window as any)[cbName];
      resolve(); // fire-and-forget — don't block on Mailchimp timeout
    }, 6000);

    (window as any)[cbName] = () => {
      clearTimeout(timer);
      delete (window as any)[cbName];
      document.getElementById(cbName)?.remove();
      resolve();
    };

    const nameParts = data.name.trim().split(/\s+/);
    const fname = nameParts[0] || "";
    const lname = nameParts.slice(1).join(" ") || "";

    const params = new URLSearchParams({
      EMAIL: data.email,
      FNAME: fname,
      LNAME: lname,
      MMERGE6: data.organization,
      MMERGE7: data.sector,
      // honeypot — must be present and empty
      b_0146b9edcb771a6cfcc87f3a7_6602e09b30: "",
      c: cbName,
    });

    const script = document.createElement("script");
    script.id = cbName;
    script.src = `https://symplsolutions.us21.list-manage.com/subscribe/post-json?u=0146b9edcb771a6cfcc87f3a7&id=6602e09b30&f_id=0036afe6f0&${params}`;
    document.head.appendChild(script);
  });
}

function WaitlistModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [sector, setSector] = useState("");
  const [otherSector, setOtherSector] = useState("");
  const [step, setStep] = useState<"form" | "pledge">("form");
  const [message, setMessage] = useState("");
  const [pledgeLoading, setPledgeLoading] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: { email: string; name: string; organization: string; sector: string; newsletter: boolean }) => {
      const docId = data.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const docRef = doc(db, WAITLIST_COLLECTION, docId);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        if (data.newsletter) submitToMailchimp(data).catch(() => {});
        return { message: "You're already on the waitlist!", alreadyExists: true };
      }
      // Write to Firebase always; send to Mailchimp only with explicit consent
      const tasks: Promise<any>[] = [
        setDoc(docRef, {
          name: data.name,
          email: data.email,
          organization: data.organization,
          sector: data.sector,
          pledged: false,
          newsletter: data.newsletter,
          consentAt: data.newsletter ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
        }),
      ];
      if (data.newsletter) tasks.push(submitToMailchimp(data));
      await Promise.all(tasks);
      return { message: "You're on the waitlist!", alreadyExists: false };
    },
    onSuccess: (data) => {
      setMessage(data.message);
      setStep("pledge");
      // Update URL to /welcome for Meta URL-based conversion tracking
      window.history.pushState({}, '', '/welcome');
      // Fire Meta Pixel Lead event on successful waitlist signup
      if (!data.alreadyExists) {
        (window as any).fbq?.('track', 'Lead');
      }
    },
    onError: () => {
      setMessage("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setMessage("Please enter your name."); return; }
    if (!email.trim()) { setMessage("Please enter your email address."); return; }
    if (!organization.trim()) { setMessage("Please enter your organization name."); return; }
    setMessage("");
    mutation.mutate({
      email: email.trim(),
      name: name.trim(),
      organization: organization.trim(),
      sector: sector === "Other" ? otherSector.trim() : sector,
      newsletter: subscribeNewsletter,
    });
  };

  const handlePledge = async () => {
    if (!email.trim()) return;
    setPledgeLoading(true);
    // Fire Meta Pixel InitiateCheckout when user clicks the pledge button
    (window as any).fbq?.('track', 'InitiateCheckout', { value: 5, currency: 'USD' });
    try {
      const res = await fetch("/api/create-pledge-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage("Could not start payment. Please try again.");
        setPledgeLoading(false);
      }
    } catch {
      setMessage("Could not start payment. Please try again.");
      setPledgeLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Step 2: fire when someone opens the Early Access modal
      (window as any).fbq?.('track', 'ViewContent', { content_name: 'Early Access Form' });
    } else {
      // Revert /welcome URL back to / when modal is dismissed
      if (window.location.pathname === '/welcome') {
        window.history.pushState({}, '', '/');
      }
      setTimeout(() => {
        setEmail("");
        setName("");
        setOrganization("");
        setSector("");
        setOtherSector("");
        setStep("form");
        setMessage("");
        setPledgeLoading(false);
        setSubscribeNewsletter(false);
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
                  placeholder="Your name *"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5550BA] focus:ring-2 focus:ring-[#5550BA]/20 outline-none transition-all text-sm"
                  data-testid="input-name"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email, you@nonprofit.org *"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5550BA] focus:ring-2 focus:ring-[#5550BA]/20 outline-none transition-all text-sm"
                  data-testid="input-email"
                />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Organization name *"
                  required
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
                {/* Newsletter consent — required by CASL/GDPR; unchecked by default */}
                <label className="flex items-start gap-3 cursor-pointer group" data-testid="label-newsletter-consent">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={subscribeNewsletter}
                      onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                      className="sr-only"
                      data-testid="checkbox-newsletter"
                    />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${subscribeNewsletter ? "bg-[#5550BA] border-[#5550BA]" : "border-gray-300 group-hover:border-[#5550BA]"}`}>
                      {subscribeNewsletter && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#6A7290] leading-relaxed">
                    Yes, I'd like to receive product updates, tips, and news from SurveyMetrix. You can unsubscribe at any time.
                  </span>
                </label>

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
                  disabled={pledgeLoading}
                  data-testid="button-pledge"
                  className="w-full bg-[#B86890] text-white font-bold py-3 rounded-xl hover:bg-[#9E4A74] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#B86890]/20 group text-sm disabled:opacity-60"
                >
                  {pledgeLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Redirecting to payment...</>
                  ) : (
                    <><CreditCard size={16} /> Pledge $5 — Become a Founding Tester <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></>
                  )}
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
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => { setPhase(2); setAdded([0]); }, 2450),
      setTimeout(() => setAdded([0, 2]), 4200),
      setTimeout(() => { setPhase(3); setAdded([0, 1, 2]); }, 5950),
      setTimeout(() => onComplete?.(), 7700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col relative text-left">
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

      {/* Category chips */}
      {phase >= 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-2 flex gap-1 flex-wrap">
          {[
            "All Outcomes",
            "Workforce Development",
            "Youth Development",
            "Arts & Culture",
            "Community Health",
            "Human Services",
            "Environment",
            "Mental Health",
          ].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border ${i === 0 ? 'bg-[#5550BA] text-white border-[#5550BA]' : 'bg-white text-[#4A5068] border-gray-200'}`}
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
                    className={`bg-white border rounded-xl p-2.5 flex flex-col items-start text-left transition-all relative ${isAdded ? 'border-[#5550BA] ring-1 ring-[#5550BA]/20 shadow-sm' : 'border-gray-200'}`}
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
                    <div className={`text-[10px] font-bold leading-tight mb-1 pr-5 w-full ${isAdded ? 'text-[#5550BA]' : 'text-[#211E62]'}`}>{o.name}</div>
                    <div className="text-[8px] text-[#6A7290] leading-snug flex-1 line-clamp-2 sm:line-clamp-4 w-full">{o.desc}</div>
                    {isAdded && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden sm:block text-[8px] text-[#6A7290] italic mt-1.5 leading-snug border-t border-[#EEEDfb] pt-1.5 w-full">"{o.q}"</motion.div>
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
              className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-col items-start text-left"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2 bg-gray-50">{o.emoji}</div>
              <div className="text-[10px] font-bold leading-tight mb-1 text-[#211E62] w-full">{o.name}</div>
              <div className="text-[8px] text-[#6A7290] leading-snug flex-1 line-clamp-2 sm:line-clamp-4 w-full">{o.desc}</div>
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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState(false);
  const [editDone, setEditDone] = useState(false);
  const [editTargetName, setEditTargetName] = useState("Job Search Confidence");
  const editQRef = useRef<HTMLDivElement>(null);

  // Unified library — first 3 are pre-selected from Step 1, rest are available to add
  const library = [
    { emoji: "💰", name: "Wage Growth & Earnings",     q: "How much has your income improved since joining this program?",       qEdited: "How much has your income improved since joining Employment Readiness?", type: "Likert",   tag: "WIOA",   isPre: true  },
    { emoji: "📋", name: "Job Retention at 6 Months",  q: "Are you currently employed at the same job you had 6 months ago?",  qEdited: "Are you still in the same role you held 6 months after completing Employment Readiness?", type: "Yes / No", tag: "WIOA",   isPre: true  },
    { emoji: "💛", name: "Empathy & Social Awareness", q: "How often do you try to understand things from another person's point of view?",                                                                          type: "Likert",   tag: "CASEL",  isPre: true  },
    { emoji: "🔍", name: "Job Search Confidence",      q: "How confident do you feel about finding a new job right now?",       qEdited: "How confident do you feel about finding work in digital marketing right now?", type: "Likert",   tag: "Custom", isPre: false },
    { emoji: "💡", name: "Financial Literacy",         q: "How well do you understand budgeting and managing your finances?",                                                                                        type: "Likert",   tag: "SDOH",   isPre: false },
    { emoji: "🏆", name: "Credential Attainment",      q: "Have you obtained a new credential since starting the program?",                                                                                         type: "Yes / No", tag: "WIOA",   isPre: false },
    { emoji: "🌱", name: "Mental Wellbeing",           q: "Over the past two weeks, how often have you felt calm and at ease?",                                                                                      type: "Likert",   tag: "WHO-5",  isPre: false },
    { emoji: "🤝", name: "Community Belonging",        q: "How strongly do you feel you belong to your local community?",                                                                                           type: "Likert",   tag: "CASEL",  isPre: false },
  ];

  useEffect(() => {
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      // ── Mobile: simplified flow — questions pre-loaded, assign program, personalise ──
      setEditTargetName("Job Retention at 6 Months");
      const timers = [
        setTimeout(() => { setPhase(1); setSelected(new Set([0, 1, 2])); }, 350),
        setTimeout(() => setPhase(2), 1260),   // dropdown opens
        setTimeout(() => setPhase(3), 2100),   // Employment Readiness selected
        setTimeout(() => setEditing(true), 3010),  // personalise Wage Growth
        setTimeout(() => { setEditDone(true); setEditing(false); }, 4200),
        setTimeout(() => setPhase(4), 4760),   // success
        setTimeout(() => onComplete?.(), 6650),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      // ── Desktop: full flow — library panel visible, cursor picks from library ──
      setEditTargetName("Job Retention at 6 Months");
      const timers = [
        setTimeout(() => { setPhase(1); setSelected(new Set([0, 1, 2])); }, 490),
        setTimeout(() => setPhase(2), 1540),
        setTimeout(() => setPhase(3), 2520),
        setTimeout(() => setSelected(new Set([0, 1, 2, 3])), 3360),
        setTimeout(() => setSelected(new Set([0, 1, 2, 3, 5])), 4410),
        setTimeout(() => setEditing(true), 5460),
        setTimeout(() => { setEditDone(true); setEditing(false); }, 6720),
        setTimeout(() => setPhase(4), 7280),
        setTimeout(() => onComplete?.(), 9450),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, []);

  // Auto-scroll to the question being edited
  useEffect(() => {
    if (editing && editQRef.current) {
      editQRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editing]);

  const surveyItems = Array.from(selected)
    .sort((a, b) => a - b)
    .map(idx => library[idx]);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col sm:flex-row relative pointer-events-none select-none">

      {/* ── Left panel: Outcome Library — hidden on mobile, always visible on desktop ── */}
      <div className="hidden sm:flex sm:w-[42%] sm:border-r flex-col bg-gray-50/60 overflow-hidden border-gray-100">

        {/* Header */}
        <div className="px-2.5 pt-2.5 pb-1.5 border-b border-gray-100 shrink-0">
          <div className="text-[8px] font-bold text-[#6A7290] uppercase tracking-widest mb-1.5">Outcome Library</div>
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <Search size={8} className="text-gray-400 shrink-0" />
            <span className="text-[8.5px] text-gray-400">Search outcomes...</span>
          </div>
        </div>

        {/* "Pre-selected" label */}
        {phase >= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2.5 pt-1.5 pb-0.5 shrink-0 flex items-center gap-1.5">
            <span className="text-[7px] font-semibold text-[#5550BA] uppercase tracking-wide">From Step 1</span>
            <div className="flex-1 h-px bg-[#DAD8F6]" />
            <span className="text-[7px] text-[#948EDE]">{Array.from(selected).filter(i => library[i].isPre).length} selected</span>
          </motion.div>
        )}

        {/* 2-column grid */}
        <div className="px-2.5 pb-2 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {phase >= 1 && library.map((o, i) => {
              const isSel = selected.has(i);
              return (
                <motion.div
                  key={o.name}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-xl p-2 border flex flex-col items-start text-left gap-1 transition-all duration-300 ${
                    isSel
                      ? o.isPre
                        ? 'bg-[#EEEDfb] border-[#5550BA]/30 shadow-sm'
                        : 'bg-[#EEEDfb] border-[#5550BA]/40 shadow-sm'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="w-full flex items-start justify-between gap-0.5">
                    <span className="text-[12px] leading-none">{o.emoji}</span>
                    {isSel ? (
                      <div className="w-4 h-4 rounded-full bg-[#5550BA] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={9} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Plus size={8} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className={`text-[7.5px] font-semibold leading-tight w-full ${isSel ? 'text-[#5550BA]' : 'text-[#211E62]'}`}>{o.name}</div>
                  <div className="flex gap-1 flex-wrap">
                    <span className={`text-[6px] px-1 py-0.5 rounded font-medium ${isSel ? 'text-[#5550BA] bg-[#DAD8F6]' : 'text-[#5550BA] bg-[#EEEDfb]'}`}>{o.tag}</span>
                    <span className="text-[6px] text-[#6A7290] bg-gray-100 px-1 py-0.5 rounded font-medium">{o.type}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right panel: Survey Builder — always visible ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Program selector */}
        <div className="px-2.5 pt-2.5 pb-2 border-b border-gray-100 shrink-0 relative">
          <div className="text-[8px] font-bold text-[#6A7290] uppercase tracking-widest mb-1.5">Survey Builder</div>
          <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 border cursor-pointer transition-all ${phase >= 2 && phase < 3 ? 'border-[#5550BA] ring-1 ring-[#5550BA]/20 bg-white' : phase >= 3 ? 'bg-[#EEEDfb] border-[#5550BA]/20' : 'bg-white border-gray-200'}`}>
            {phase >= 3 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className="w-5 h-5 rounded-md bg-[#5550BA] flex items-center justify-center shrink-0">
                  <span className="text-[7px] font-bold text-white">ER</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-[#211E62] leading-none">Employment Readiness</div>
                  <div className="text-[7px] text-[#6A7290] mt-0.5">Workforce Program · Active</div>
                </div>
                <motion.span key={surveyItems.length} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="text-[7.5px] font-bold text-[#5550BA] bg-white border border-[#5550BA]/20 rounded px-1.5 py-0.5 shrink-0">{surveyItems.length}q</motion.span>
              </motion.div>
            ) : (
              <span className="text-[9px] text-[#9DA4BC]">Select a program...</span>
            )}
            <ChevronDown size={10} className="text-[#9DA4BC] shrink-0 ml-1" />
          </div>
          {/* Dropdown */}
          {phase === 2 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="absolute left-2.5 right-2.5 top-full mt-0.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30">
              {[
                { initials: "ER", name: "Employment Readiness", sub: "Workforce Program", color: "#5550BA", active: true },
                { initials: "DS", name: "Digital Skills",       sub: "Digital Training",  color: "rgb(168,85,247)", active: false },
                { initials: "YL", name: "Youth Leadership",     sub: "Youth Program",     color: "#B86890", active: false },
              ].map((p, i) => (
                <div key={p.name} className={`flex items-center gap-2 px-2.5 py-1.5 border-b last:border-0 border-gray-100 ${p.active ? 'bg-[#EEEDfb]' : ''}`}>
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: p.color }}>
                    <span className="text-[7px] font-bold text-white">{p.initials}</span>
                  </div>
                  <div className="flex-1">
                    <div className={`text-[9px] font-semibold ${p.active ? 'text-[#5550BA]' : 'text-[#211E62]'}`}>{p.name}</div>
                    <div className="text-[7px] text-[#9DA4BC]">{p.sub}</div>
                  </div>
                  {p.active && <CheckCircle2 size={10} className="text-[#5550BA]" />}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Survey questions */}
        <div className="flex-1 px-2.5 py-2 overflow-y-auto space-y-1.5">

          {/* Section header — auto-added from Step 1 */}
          {phase >= 1 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 pb-0.5">
              <div className="flex items-center gap-1 bg-[#EEEDfb] border border-[#DAD8F6] rounded-lg px-1.5 py-0.5 shrink-0">
                <span className="text-[6px] font-bold text-[#5550BA] uppercase tracking-wide">Step 1 Outcomes</span>
                <span className="text-[6px] text-[#948EDE]">· Auto-added</span>
              </div>
              <div className="flex-1 h-px bg-[#DAD8F6]" />
              <span className="text-[6.5px] text-[#948EDE] shrink-0">{Array.from(selected).filter(i => library[i].isPre).length}q</span>
            </motion.div>
          )}

          <AnimatePresence>
            {surveyItems.map((o, pos) => {
              const isThisEditing = editing && o.name === editTargetName;
              const isThisDone    = editDone && o.name === editTargetName;
              const qText = isThisDone && (o as any).qEdited ? (o as any).qEdited : o.q;
              return (
                <motion.div
                  key={o.name}
                  ref={isThisEditing || isThisDone ? editQRef : undefined}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className={`bg-white rounded-xl border px-2.5 py-2 shadow-sm transition-all ${
                    isThisEditing ? 'border-[#B86890] ring-1 ring-[#B86890]/20'
                    : isThisDone  ? 'border-[#B86890]/40'
                    : o.isPre     ? 'border-[#DAD8F6]'
                    :               'border-[#5550BA]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-md bg-[#EEEDfb] text-[#5550BA] text-[7px] font-bold flex items-center justify-center shrink-0">{pos + 1}</span>
                    <span className={`text-[6.5px] font-bold px-1.5 py-0.5 rounded shrink-0 ${o.isPre ? 'bg-[#DAD8F6] text-[#5550BA]' : 'bg-[#5550BA] text-white'}`}>{o.type}</span>
                    <span className="text-[7.5px] text-[#6A7290] truncate flex-1">{o.name}</span>
                    {o.isPre && !isThisEditing && !isThisDone && (
                      <span className="text-[6px] text-[#948EDE] bg-[#EEEDfb] border border-[#DAD8F6] px-1 py-0.5 rounded shrink-0 font-medium">Step 1</span>
                    )}
                    {isThisEditing && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 text-[6.5px] text-[#B86890] font-semibold shrink-0">
                        <PenTool size={7} /> Editing
                      </motion.span>
                    )}
                    {isThisDone && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 text-[6.5px] text-[#B86890] font-semibold shrink-0">
                        <CheckCircle2 size={7} className="text-[#B86890]" /> Personalised
                      </motion.span>
                    )}
                  </div>
                  <div className={`text-[8.5px] leading-snug mb-1.5 ${isThisEditing ? 'text-[#B86890] font-medium' : 'text-[#211E62]'}`}>
                    {qText}
                    {isThisEditing && (
                      <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.65 }} className="inline-block w-0.5 h-2.5 bg-[#B86890] ml-0.5 align-middle" />
                    )}
                  </div>
                  {o.type === "Yes / No" ? (
                    <div className="flex gap-1.5">
                      <div className="flex-1 text-center text-[8px] font-bold border border-green-200 rounded-lg py-1.5 text-green-700 bg-green-50">✓ Yes</div>
                      <div className="flex-1 text-center text-[8px] font-bold border border-rose-200 rounded-lg py-1.5 text-rose-600 bg-rose-50">✗ No</div>
                    </div>
                  ) : (
                    <div className="flex gap-0.5">
                      {["1","2","3","4","5"].map(n => (
                        <div key={n} className="flex-1 text-center text-[7px] border border-gray-200 rounded-lg py-1 text-[#9DA4BC] bg-gray-50">{n}</div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {phase >= 4 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-green-50 border border-green-200 rounded-xl py-2 px-2.5 flex items-center gap-2">
              <CheckCircle2 size={11} className="text-green-600 shrink-0" />
              <div>
                <div className="text-[8px] font-bold text-green-700">Survey ready · {surveyItems.length} questions linked</div>
                <div className="text-[7px] text-green-600">Employment Readiness · Active</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Cursor — desktop only: library → dropdown → library picks → edit question */}
      <motion.div className="hidden sm:block absolute z-30 pointer-events-none" animate={{
        left: phase < 2 ? '30%'     // hovering over library col2
            : phase < 3 ? '75%'     // moving to program dropdown
            : !selected.has(3) ? '30%'  // back to library: pick idx3 (col2 row2)
            : !selected.has(5) ? '30%'  // pick idx5 (col2 row3)
            : editing || editDone ? '78%'  // move to question card (right panel)
            : '30%',
        top:  phase < 2 ? '55%'
            : phase < 3 ? '22%'
            : !selected.has(3) ? '52%'   // row2 center in grid
            : !selected.has(5) ? '68%'   // row3 center in grid
            : editing || editDone ? '62%'
            : '68%',
      }} transition={{ duration: 0.65, ease: "easeInOut" }}>
        <svg width="14" height="18" viewBox="0 0 20 24" fill="none"><path d="M1 1L1 17.5L5.5 13.5L9 21L12 19.5L8.5 12H14.5L1 1Z" fill="#211E62" stroke="white" strokeWidth="1.5"/></svg>
      </motion.div>
    </div>
  );
};

const Step3 = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),    // filter bar / computing tooltip
      setTimeout(() => setPhase(2), 2240),   // KPI cards animate in
      setTimeout(() => setPhase(3), 4200),   // bottom panels slide in
      setTimeout(() => setPhase(4), 6300),   // insight badge appears
      setTimeout(() => onComplete?.(), 10150), // hold fully-loaded dashboard then cycle
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const programs = [
    { name: "Employment Readiness", color: "#5550BA" },
    { name: "Digital Skills", color: "rgb(168,85,247)" },
    { name: "Youth Leadership", color: "#B86890" },
  ];

  const stats = [
    { label: "Total Responses", value: "342",  unit: "",   change: "+18%", from: "290 → 342", color: "#5550BA",          delay: 0.1  },
    { label: "Avg KPI Score",   value: "3.8",  unit: "/5", change: "+0.6", from: "3.2 → 3.8", color: "rgb(168,85,247)", delay: 0.2  },
    { label: "Job Confidence",  value: "76",   unit: "%",  change: "+18%", from: "58% → 76%", color: "#5550BA",          delay: 0.3  },
    { label: "Wellbeing Score", value: "3.9",  unit: "/5", change: "+0.7", from: "3.2 → 3.9", color: "#B86890",          delay: 0.42 },
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
    <div className="w-full h-full flex flex-col relative bg-[#FAFAFA] overflow-hidden text-left">
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
        <div className="grid grid-cols-4 gap-1.5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-2 pt-2 pb-1.5 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-xl" style={{ backgroundColor: s.color }} />
              <div className="text-[6.5px] text-[#6A7290] font-medium mb-0.5 mt-0.5 leading-tight text-center w-full">{s.label}</div>
              {phase >= 2 ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: s.delay }} className="flex flex-col flex-1 items-center w-full">
                  <div className="text-[15px] font-bold text-[#211E62] leading-none mb-1 text-center">
                    {s.value}<span className="text-[8px] text-[#9DA4BC] font-medium">{s.unit}</span>
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: s.delay + 0.3 }} className="flex items-center justify-between mt-auto w-full">
                    <span className="text-[6.5px] font-bold text-[#B86890] bg-[#FAF0F3] px-1 py-0.5 rounded inline-flex items-center gap-0.5">
                      <ArrowUp size={6} />{s.change}
                    </span>
                    <span className="text-[6px] text-[#9DA4BC] leading-tight text-right">{s.from}</span>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="text-[15px] font-bold text-gray-200">—</div>
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

            {/* Mini grouped bar chart by quarter — fills available flex height */}
            <div className="flex-1 flex gap-1.5 min-h-0">
              {quarterData.map((qd, qi) => (
                <div key={qd.q} className="flex-1 flex flex-col min-h-0">
                  {/* Bar group fills remaining height */}
                  <div className="flex-1 flex items-end gap-0.5 min-h-0">
                    {[
                      { val: qd.er, color: "#5550BA" },
                      { val: qd.ds, color: "rgb(168,85,247)" },
                      { val: qd.yl, color: "#B86890" },
                    ].map((bar, bi) => (
                      <motion.div
                        key={bi}
                        className="flex-1 rounded-t-sm"
                        style={{ backgroundColor: bar.color, height: `${bar.val}%`, transformOrigin: "bottom" }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.3 + qi * 0.12 + bi * 0.05, duration: 0.6, ease: "easeOut" }}
                      />
                    ))}
                  </div>
                  <span className="text-[6px] text-[#9DA4BC] text-center pt-0.5 shrink-0">{qd.q}</span>
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
  const [location, navigate] = useLocation();
  const [animationStarted, setAnimationStarted] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPledgeSuccess, setShowPledgeSuccess] = useState(location === '/pledge-success');
  const animationRef = useRef<HTMLDivElement>(null);

  // On /pledge-success: fire Meta Pixel Purchase event once
  useEffect(() => {
    if (location === '/pledge-success') {
      setShowPledgeSuccess(true);
      (window as any).fbq?.('track', 'Purchase', { value: 5, currency: 'USD' });
    }
  }, [location]);

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

      {/* Pledge success modal — shown after returning from Stripe /pledge-success */}
      <AnimatePresence>
        {showPledgeSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowPledgeSuccess(false); navigate('/'); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full z-10 overflow-hidden"
              data-testid="modal-pledge-success"
            >
              <button
                onClick={() => { setShowPledgeSuccess(false); navigate('/'); }}
                className="absolute top-4 right-4 text-[#9DA4BC] hover:text-[#4A5068] transition-colors z-20"
                data-testid="button-close-pledge-success"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="bg-gradient-to-br from-[#211E62] via-[#2E2A78] to-[#1a1754] px-8 pt-8 pb-7 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#5550BA]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#B86890]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
                    className="w-14 h-14 rounded-full bg-green-400/20 border border-green-400/40 flex items-center justify-center mb-5"
                  >
                    <CheckCircle2 size={30} className="text-green-400" />
                  </motion.div>
                  <h3 className="font-display font-bold text-2xl leading-tight mb-2">
                    You're a Founding Tester!
                  </h3>
                  <p className="text-[#C4C0E8] text-sm leading-relaxed" data-testid="text-pledge-success">
                    Your $5 pledge is confirmed. We've locked in your founding tester status — it'll be applied as credit when we launch.
                  </p>
                </div>
              </div>

              {/* Perks */}
              <div className="bg-[#F4F3FC] px-8 py-6">
                <p className="text-xs font-bold text-[#211E62] uppercase tracking-wider mb-4">What's coming your way</p>
                <div className="space-y-3">
                  {[
                    { icon: Zap,    color: "text-[#5550BA]", bg: "bg-[#EEEDfb]", text: "First access before the public launch" },
                    { icon: Shield, color: "text-[#B86890]", bg: "bg-[#FAF0F3]", text: "2 months free at launch ($100+ value)" },
                    { icon: Crown,  color: "text-[#B86890]", bg: "bg-[#FAF0F3]", text: "Founding Tester badge on your account" },
                    { icon: Users,  color: "text-[#5550BA]", bg: "bg-[#EEEDfb]", text: "Private channel with the product team" },
                  ].map((perk) => (
                    <div key={perk.text} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                      <div className={`w-7 h-7 rounded-lg ${perk.bg} flex items-center justify-center shrink-0`}>
                        <perk.icon size={14} className={perk.color} />
                      </div>
                      <span className="text-sm text-[#4A5068]">{perk.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setShowPledgeSuccess(false); navigate('/'); }}
                  data-testid="button-pledge-success-done"
                  className="w-full mt-5 bg-[#5550BA] text-white font-bold py-3 rounded-xl hover:bg-[#211E62] transition-all text-sm"
                >
                  Back to SurveyMetrix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                Surveys That Measure Outcomes
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
              A survey tool built for nonprofits{' '}
              that actually{' '}
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
                Get Early Access — It's Free
              </button>
            </motion.div>

            <div className="w-11 h-0.5 bg-[#B86890] rounded-full mx-auto mb-8"></div>

            <motion.div
              ref={animationRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              id="platform"
              className="scroll-mt-20 lg:max-w-3xl mx-auto"
            >
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#5550BA] via-[#B86890] to-[#948EDE] rounded-t-2xl"></div>
                <div className="min-h-[420px] sm:min-h-[460px] lg:min-h-[460px] relative p-2 sm:p-3 md:p-6 lg:pb-2">
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
                    className="rounded-2xl overflow-hidden shadow-xl"
                    style={{ borderLeft: "1.5px solid rgba(85,80,186,0.22)", borderRight: "1.5px solid rgba(85,80,186,0.22)", borderBottom: "1.5px solid rgba(85,80,186,0.22)" }}
                  >
                    <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: "linear-gradient(180deg, rgba(140,134,220,0.58) 0%, rgba(85,80,186,0.42) 100%)", backdropFilter: "blur(20px) saturate(200%)", WebkitBackdropFilter: "blur(20px) saturate(200%)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(33,30,98,0.20)", borderTop: "1px solid rgba(255,255,255,0.45)", borderBottom: "1px solid rgba(85,80,186,0.30)", borderRadius: "0.75rem 0.75rem 0 0" }}>
                      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#28C840]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                    </div>
                    <img
                      src="/outcome-library.png"
                      alt="Outcome Library screenshot"
                      className="w-full h-[316px] sm:h-[354px] object-cover object-top block"
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
                    className="rounded-2xl overflow-hidden shadow-xl"
                    style={{ borderLeft: "1.5px solid rgba(85,80,186,0.22)", borderRight: "1.5px solid rgba(85,80,186,0.22)", borderBottom: "1.5px solid rgba(85,80,186,0.22)" }}
                  >
                    <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: "linear-gradient(180deg, rgba(140,134,220,0.58) 0%, rgba(85,80,186,0.42) 100%)", backdropFilter: "blur(20px) saturate(200%)", WebkitBackdropFilter: "blur(20px) saturate(200%)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(33,30,98,0.20)", borderTop: "1px solid rgba(255,255,255,0.45)", borderBottom: "1px solid rgba(85,80,186,0.30)", borderRadius: "0.75rem 0.75rem 0 0" }}>
                      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#28C840]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                    </div>
                    <img
                      src="/survey-builder.png"
                      alt="Survey builder screenshot"
                      className="w-full h-[316px] sm:h-[354px] object-cover object-top block"
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
                    className="rounded-2xl overflow-hidden shadow-xl"
                    style={{ borderLeft: "1.5px solid rgba(85,80,186,0.22)", borderRight: "1.5px solid rgba(85,80,186,0.22)", borderBottom: "1.5px solid rgba(85,80,186,0.22)" }}
                  >
                    <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: "linear-gradient(180deg, rgba(140,134,220,0.58) 0%, rgba(85,80,186,0.42) 100%)", backdropFilter: "blur(20px) saturate(200%)", WebkitBackdropFilter: "blur(20px) saturate(200%)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(33,30,98,0.20)", borderTop: "1px solid rgba(255,255,255,0.45)", borderBottom: "1px solid rgba(85,80,186,0.30)", borderRadius: "0.75rem 0.75rem 0 0" }}>
                      <div className="w-2 h-2 rounded-full bg-[#FF5F57]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#28C840]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                    </div>
                    <img
                      src="/dashboard.png"
                      alt="Outcome dashboard screenshot"
                      className="w-full h-[316px] sm:h-[354px] object-cover object-top block"
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

        <div className="relative -mx-6">
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
            <h2 className="font-display text-3xl sm:text-4xl text-[#211E62] leading-tight max-w-lg">
              Outcomes designed for<br />
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }} className="text-[#5550BA]">your organization</span>
            </h2>
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
                emoji: "🌍",
                title: "Settlement & Immigration",
                desc: "Track language confidence, social integration, employment readiness, and service navigation for newcomer and refugee support programs.",
                tags: ["Custom", "IRCC-aligned"],
              },
              {
                emoji: "🎨",
                title: "Arts & Culture",
                desc: "Quantify joy, creative confidence, community cohesion, and reduced isolation — outcomes that foundation funders increasingly require as evidence.",
                tags: ["WHO-5", "UCLA Scale"],
              },
              {
                emoji: "🏥",
                title: "Community Health",
                desc: "Run SDOH screeners, food security surveys, and social connection assessments — with built-in longitudinal follow-up sequences.",
                tags: ["PRAPARE", "WHO-5"],
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
              <div className="rounded-2xl overflow-hidden shadow-xl" style={{ borderLeft: "1.5px solid rgba(85,80,186,0.22)", borderRight: "1.5px solid rgba(85,80,186,0.22)", borderBottom: "1.5px solid rgba(85,80,186,0.22)" }}>
                <div className="flex items-center gap-1.5 px-4 py-2" style={{ background: "linear-gradient(180deg, rgba(140,134,220,0.58) 0%, rgba(85,80,186,0.42) 100%)", backdropFilter: "blur(20px) saturate(200%)", WebkitBackdropFilter: "blur(20px) saturate(200%)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.50), inset 0 -1px 0 rgba(33,30,98,0.20)", borderTop: "1px solid rgba(255,255,255,0.45)", borderBottom: "1px solid rgba(85,80,186,0.30)", borderRadius: "0.75rem 0.75rem 0 0" }}>
                  <div className="w-2 h-2 rounded-full bg-[#FF5F57]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                  <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                  <div className="w-2 h-2 rounded-full bg-[#28C840]" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)" }}></div>
                </div>
              <div className="bg-white overflow-hidden">
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
              ✦ Early Access — First 2 Months Free
            </div>

            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-[3.5rem] text-white mb-6 leading-[1.1]">
              Surveys are great but measuring{' '}
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }} className="text-[#B86890] text-[110%]">outcome</span>
              {' '}is even better
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
              <img src="/logo.png" alt="SurveyMetrix" className="h-7 w-7 rounded-lg object-contain" />
              <span className="font-display text-base text-white">Survey<span className="text-[#948EDE]">Metrix</span></span>
            </div>

            <div className="flex items-center gap-5">
              <a
                href="/privacy-policy"
                className="text-xs text-[#7268CD] hover:text-[#948EDE] transition-colors"
                data-testid="link-privacy-policy"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.instagram.com/surveymetrix"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SurveyMetrix on Instagram"
                className="text-[#7268CD] hover:text-[#948EDE] transition-colors"
                data-testid="link-instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61580726204388"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SurveyMetrix on Facebook"
                className="text-[#7268CD] hover:text-[#948EDE] transition-colors"
                data-testid="link-facebook"
              >
                <Facebook size={16} />
              </a>
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