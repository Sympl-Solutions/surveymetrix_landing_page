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
  const [step, setStep] = useState<"form" | "pledge" | "done">("form");
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
    // For now, show success state
    setStep("done");
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
              <h3 className="font-display font-bold text-2xl text-[#211E62] mb-2">Join the Waitlist</h3>
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
              <div className="bg-gradient-to-br from-[#211E62] via-[#2E2A78] to-[#1a1754] px-8 pt-8 pb-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#5550BA]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#B86890]/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#B86890] flex items-center justify-center shadow-lg shadow-[#B86890]/30">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div className="bg-[#B86890]/20 border border-[#B86890]/30 text-[#F0C4D8] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Limited — Founding Testers
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-2xl mb-2 leading-tight">
                    Want to shape<br />SurveyMetrix?
                  </h3>
                  <p className="text-[#C4C0E8] text-sm leading-relaxed">
                    Pledge <span className="text-white font-bold">$5</span> to become a founding tester. You'll get exclusive access and directly influence what we build.
                  </p>
                </div>
              </div>

              <div className="px-8 py-6">
                <div className="space-y-3 mb-6">
                  {[
                    { icon: Zap, text: "First access to the platform before public launch", color: "text-[#5550BA]", bg: "bg-[#EEEDfb]" },
                    { icon: Crown, text: "Founding Tester badge — locked to first 200 signups", color: "text-[#B86890]", bg: "bg-[#FAF0F3]" },
                    { icon: Users, text: "Private feedback channel with the product team", color: "text-[#5550BA]", bg: "bg-[#EEEDfb]" },
                    { icon: Shield, text: "3 months free when we launch (worth $87+)", color: "text-[#B86890]", bg: "bg-[#FAF0F3]" },
                  ].map((perk) => (
                    <div key={perk.text} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg ${perk.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <perk.icon size={14} className={perk.color} />
                      </div>
                      <span className="text-sm text-[#4A5068] leading-snug">{perk.text}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-[#FDFCFA] border border-[#DAD8F6] rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#6A7290] uppercase tracking-wider">Founding Tester Pledge</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-display text-2xl font-bold text-[#211E62]">$5</span>
                      <span className="text-xs text-[#9DA4BC]">one-time</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9DA4BC] leading-relaxed">
                    100% refundable if we don't ship. Your pledge helps us validate demand and build faster.
                  </p>
                </div>

                <button
                  onClick={handlePledge}
                  data-testid="button-pledge"
                  className="w-full bg-[#B86890] text-white font-bold py-3.5 rounded-xl hover:bg-[#9E4A74] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#B86890]/20 group"
                >
                  <CreditCard size={18} />
                  Pledge $5 — Become a Founding Tester
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => setStep("done")}
                  data-testid="button-skip-pledge"
                  className="w-full text-center text-xs text-[#9DA4BC] hover:text-[#6A7290] mt-3 py-2 transition-colors"
                >
                  No thanks, I'll just stay on the waitlist
                </button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full bg-[#B86890]/10 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 size={32} className="text-[#B86890]" />
              </motion.div>
              <h3 className="font-display font-bold text-2xl text-[#211E62] mb-2">You're in!</h3>
              <p className="text-[#6A7290]" data-testid="text-success">
                {message || "We'll be in touch soon with early access details."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const Step1 = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 4500),
      setTimeout(() => onComplete?.(), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col relative">
      <div className="p-4 flex items-center gap-3 z-10">
        <div className="w-8 h-8 rounded-lg bg-[#FAF0F3] text-[#B86890] flex items-center justify-center">
          <BarChart size={16} />
        </div>
        <div>
          <h3 className="font-bold text-sm text-[#211E62]">Outcome Framework</h3>
          <p className="text-xs text-[#6A7290]">KPI & Question Linking</p>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden relative flex-col sm:flex-row">
        <motion.div layout className={`p-4 sm:p-6 flex flex-col justify-center transition-all duration-700 ease-in-out ${phase >= 2 ? 'sm:w-1/2 sm:border-r border-b sm:border-b-0 border-gray-100' : 'w-full items-center'}`}>
          <motion.div layout className={phase >= 2 ? 'w-full' : 'w-full max-w-sm'}>
            <h4 className="text-xs font-semibold text-[#6A7290] uppercase tracking-wider mb-3 sm:mb-4">Strategic KPIs</h4>
            <div className="space-y-3">
              <motion.div layout className={`bg-white border-2 rounded-lg p-4 shadow-sm relative z-20 transition-colors ${phase >= 1 ? 'border-[#5550BA]' : 'border-gray-200'}`}>
                <div className="font-medium text-sm text-[#211E62]">Program Rating</div>
                <div className="text-xs text-[#6A7290] mt-1 mb-4">Average rating out of 5</div>
                
                {phase < 2 ? (
                  <div className="relative">
                    <div className={`text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 w-full justify-center shadow-md relative z-10 transition-all ${phase >= 1 ? 'bg-[#5550BA] text-white shadow-[#5550BA]/20' : 'bg-gray-200 text-gray-400'}`}>
                      <LinkIcon size={14} /> Link to Question
                    </div>
                    {phase >= 1 && (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#5550BA] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-lg">
                        Linking KPI to question library...
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#5550BA]"></div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-[#B86890] font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Linked to Library
                  </motion.div>
                )}

                {phase >= 2 && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "120px", opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="absolute top-1/2 -right-[120px] h-0.5 bg-[#5550BA]/30 border-t border-dashed border-[#5550BA] z-0 hidden sm:flex items-center justify-center">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-5 h-5 rounded-full bg-[#5550BA] text-white flex items-center justify-center absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shadow-md">
                      <LinkIcon size={10} />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div layout className="bg-white border border-gray-100 rounded-lg p-4 opacity-60">
                <div className="font-medium text-sm text-[#211E62]">Recommendation Rate</div>
                <div className="text-xs text-[#6A7290] mt-1">NPS Score calculation</div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
        
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="sm:w-1/2 p-4 sm:p-6 flex flex-col justify-center">
              <h4 className="text-xs font-semibold text-[#6A7290] uppercase tracking-wider mb-3 sm:mb-4">Question Library</h4>
              <div className="space-y-3 relative z-10">
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} className="bg-white border border-[#5550BA]/40 shadow-[0_0_15px_rgba(31,78,121,0.08)] rounded-lg p-3 pl-8 relative">
                  <GripVertical size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                  <div className="font-medium text-sm text-[#5550BA]">Rate the program out of 5</div>
                  <div className="text-xs text-[#6A7290] mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#B86890] inline-block"></span>
                    Rating Scale (1-5)
                  </div>
                </motion.div>
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }} className="bg-white border border-gray-200 rounded-lg p-3 pl-8 relative opacity-60">
                  <GripVertical size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                  <div className="font-medium text-sm text-[#4A5068]">How satisfied were you?</div>
                  <div className="text-xs text-[#6A7290] mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
                    Multiple Choice
                  </div>
                </motion.div>
              </div>
              {phase >= 3 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-[#EEEDfb] text-[#5550BA] text-xs font-medium px-4 py-2 rounded-lg text-center">
                  Questions matched to your KPIs automatically
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="absolute z-30 pointer-events-none" animate={{ left: phase < 2 ? '42%' : '72%', top: phase < 2 ? '55%' : '45%' }} transition={{ duration: 0.6, ease: "easeInOut" }}>
          <svg width="18" height="22" viewBox="0 0 20 24" fill="none"><path d="M1 1L1 17.5L5.5 13.5L9 21L12 19.5L8.5 12H14.5L1 1Z" fill="#211E62" stroke="white" strokeWidth="1.5"/></svg>
        </motion.div>
      </div>
    </div>
  );
};

const Step2 = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [text, setText] = useState("Rate the program out of 5");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 3200),
      setTimeout(() => { setPhase(3); setText("Rate the mentoring program out of 5"); }, 4800),
      setTimeout(() => onComplete?.(), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col relative">
      <div className="p-3 flex items-center gap-2">
        <span className="font-semibold text-sm">Survey Builder</span>
        <span className="text-xs text-[#9DA4BC]">/ Mid-Year Review</span>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-3 sm:p-6 flex gap-4 sm:gap-6 relative">
          <div className="flex-1 max-w-sm mx-auto flex flex-col items-center">
            <div className="w-full h-10 sm:h-12 bg-[#5550BA] rounded-t-xl"></div>
            <div className="w-full bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm p-3 sm:p-5 pb-6 sm:pb-8 min-h-[220px] sm:min-h-[250px] relative">
              <h3 className="text-base sm:text-lg font-bold text-[#211E62] text-center mb-4 sm:mb-6">Mid-Year Program Feedback</h3>
              
              {phase < 1 ? (
                <div className="relative">
                  <motion.div className="border-2 border-dashed border-[#DAD8F6] rounded-lg h-24 mb-4 flex items-center justify-center bg-[#EEEDfb]/30" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <span className="text-xs text-[#5550BA] font-medium">Drop question here</span>
                  </motion.div>
                </div>
              ) : (
                <motion.div initial={{ y: -50, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className={`bg-white border rounded-lg p-4 shadow-md relative ${phase < 2 ? 'border-[#5550BA]' : 'border-[#5550BA]/20'}`}>
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="relative w-full">
                      <div className="w-full font-medium text-sm text-[#211E62]">{text}</div>
                      {phase === 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="absolute top-0.5 right-0 w-0.5 h-4 bg-[#5550BA]" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-1 mb-3 relative z-10">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className="flex-1 h-8 rounded border border-gray-200 flex items-center justify-center text-xs text-[#9DA4BC]">{n}</div>
                    ))}
                  </div>
                  
                  <div className="relative z-10">
                    {phase >= 3 ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#FAF0F3] text-[#B86890] text-[10px] px-2 py-1 rounded flex items-center gap-1 font-medium w-fit">
                        <CheckCircle2 size={10} /> Personalized for Mentoring Program
                      </motion.div>
                    ) : (
                      <div className="bg-[#EEEDfb] text-[#5550BA] text-[10px] px-2 py-1 rounded flex items-center gap-1 font-medium w-fit">
                        <LinkIcon size={10} /> Linked to: Participant Satisfaction KPI
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {phase === 1 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#5550BA] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-lg">
                  Question dropped into survey
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#5550BA]"></div>
                </motion.div>
              )}
              {phase === 2 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#B86890] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-lg">
                  Auto-personalizing for your program...
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#B86890]"></div>
                </motion.div>
              )}
              {phase >= 3 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap z-20 shadow-lg flex items-center gap-1">
                  <CheckCircle2 size={10} /> Survey ready to send
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-green-600"></div>
                </motion.div>
              )}
            </div>
          </div>

          <motion.div className="absolute z-30 pointer-events-none" animate={{ left: phase < 1 ? '48%' : phase < 2 ? '48%' : '55%', top: phase < 1 ? '50%' : phase < 2 ? '58%' : '52%' }} transition={{ duration: 0.5, ease: "easeInOut" }}>
            <svg width="18" height="22" viewBox="0 0 20 24" fill="none"><path d="M1 1L1 17.5L5.5 13.5L9 21L12 19.5L8.5 12H14.5L1 1Z" fill="#211E62" stroke="white" strokeWidth="1.5"/></svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const Step3 = ({ onComplete }: { onComplete?: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 3200),
      setTimeout(() => setPhase(3), 4800),
      setTimeout(() => onComplete?.(), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="z-20">
        <div className="p-3 sm:p-4 pb-2 flex justify-between items-center relative">
          <h2 className="text-base sm:text-lg font-bold text-[#211E62]">Impact Dashboard</h2>
          <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-white bg-[#5550BA] rounded-md px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm transition-all ${phase >= 1 ? 'ring-2 ring-green-400/50' : ''}`}>
            <Filter size={12} /> {phase >= 1 ? 'Filters Applied' : 'Apply Filters'}
          </div>
        </div>
        
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-2.5 flex items-center justify-between relative">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#6A7290] uppercase tracking-wider mb-0.5">Surveys Included</span>
              <span className="text-[11px] sm:text-xs font-semibold text-[#211E62] flex items-center gap-1">4 Surveys Selected <ChevronDown size={12} className="text-[#9DA4BC]" /></span>
            </div>
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full border border-white bg-[#5550BA] flex items-center justify-center text-[8px] text-white font-bold">M</div>
              <div className="w-5 h-5 rounded-full border border-white bg-purple-500 flex items-center justify-center text-[8px] text-white font-bold">W</div>
              <div className="w-5 h-5 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[8px] text-[#4A5068] font-bold">+2</div>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-2.5 flex items-center justify-between relative">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#6A7290] uppercase tracking-wider mb-0.5">Time Range</span>
              <span className="text-[11px] sm:text-xs font-semibold text-[#211E62] flex items-center gap-1">Jan - Dec 2024 <ChevronDown size={12} className="text-[#9DA4BC]" /></span>
            </div>
            <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-[#6A7290] font-medium hidden sm:inline">Over Time</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden relative">
        {phase >= 1 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#5550BA] text-white text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap z-30 shadow-lg">
            Aggregating data across 4 surveys...
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#5550BA]"></div>
          </motion.div>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4">
          {[
            { label: "Satisfaction", icon: BarChart, value: "4.6", unit: "/5", change: "+0.8", from: "from 3.8 last period", color: "#5550BA", delay: 0.3 },
            { label: "Skill Dev.", icon: Users, value: "84", unit: "%", change: "+15%", from: "from 69% last period", color: "rgb(168,85,247)", delay: 0.5 },
            { label: "Retention", icon: CheckSquare, value: "92", unit: "%", change: "+4%", from: "from 88% last period", color: "rgb(249,115,22)", delay: 0.7 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-2.5 sm:p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="text-[10px] sm:text-xs font-medium mb-1 flex items-center gap-1 sm:gap-1.5" style={{ color: phase >= 2 ? '#6A7290' : '#9DA4BC' }}>
                <stat.icon size={12} className="shrink-0" style={{ color: phase >= 2 ? stat.color : '#d1d5db' }} /> <span className="truncate">{stat.label}</span>
              </div>
              <div className="flex items-end gap-1 sm:gap-2 mt-1 sm:mt-2">
                {phase >= 2 ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay }} className="flex flex-col sm:flex-row sm:items-end gap-0.5 sm:gap-2">
                    <div className="text-xl sm:text-3xl font-bold text-[#211E62]">{stat.value}<span className="text-sm sm:text-lg text-[#9DA4BC] font-medium">{stat.unit}</span></div>
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: stat.delay + 0.4, type: "spring" }} className="flex items-center text-[10px] sm:text-xs font-bold text-[#B86890] sm:mb-1 bg-[#FAF0F3] px-1 sm:px-1.5 py-0.5 rounded w-fit">
                      <ArrowUp size={10} className="mr-0.5" /> {stat.change}
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="text-xl sm:text-3xl font-bold text-gray-300">—<span className="text-sm sm:text-lg text-gray-200 font-medium">{stat.unit}</span></div>
                )}
              </div>
              {phase >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: stat.delay + 0.6 }} className="text-[9px] sm:text-[10px] text-[#9DA4BC] mt-1 hidden sm:block">{stat.from}</motion.div>
              )}
            </div>
          ))}
        </div>

        {phase >= 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5550BA] to-[#948EDE] rounded-t-xl"></div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[#211E62] mb-1">Cross-Survey Analysis</h3>
              <p className="text-xs text-[#6A7290] mb-3">Compare outcomes across all programs and timeframes</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {["Mentoring", "Workshops", "Leadership"].map((p) => (
                  <span key={p} className="text-xs bg-[#5550BA] text-white px-3 py-1.5 rounded-md shadow-sm">{p}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div className="absolute z-30 pointer-events-none" animate={{ left: phase < 1 ? '82%' : phase < 2 ? '35%' : '60%', top: phase < 1 ? '8%' : phase < 2 ? '42%' : '75%' }} transition={{ duration: 0.6, ease: "easeInOut" }}>
          <svg width="18" height="22" viewBox="0 0 20 24" fill="none"><path d="M1 1L1 17.5L5.5 13.5L9 21L12 19.5L8.5 12H14.5L1 1Z" fill="#211E62" stroke="white" strokeWidth="1.5"/></svg>
        </motion.div>
      </div>
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

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % stepsData.length);
      setHighestStep((prev) => Math.max(prev, (currentStep + 1) % stepsData.length));
    }, 7000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep]);

  return (
    <div className="min-h-screen bg-[#FDFCFA] text-[#211E62] font-sans selection:bg-[#B86890]/20">
      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
      
      {/* 1) Nav bar */}
      <header className="px-6 lg:px-12 py-4 flex justify-between items-center bg-[#FDFCFA] border-b border-[#DAD8F6] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl text-[#211E62]">Survey<span className="text-[#5550BA]">Metrix</span></span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6 text-xs font-medium items-center uppercase tracking-wider">
          <a href="#how-it-works" className="text-[#44429C] hover:text-[#211E62] transition-colors">How it works</a>
          <a href="#impact-areas" className="text-[#44429C] hover:text-[#211E62] transition-colors">Impact Areas</a>
          <button onClick={() => setShowWaitlist(true)} data-testid="button-waitlist-nav" className="bg-[#5550BA] text-white px-5 py-2.5 rounded-lg hover:bg-[#44429C] transition-colors font-semibold normal-case tracking-normal text-sm">
            Join the Waitlist
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
            Join the Waitlist
          </button>
        </div>
      )}

      {/* 2) Hero Section */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 bg-[#EEEDfb]" style={{ height: 'calc(100% - 240px)' }}></div>
        <div className="absolute inset-x-0 bottom-0 bg-[#FDFCFA]" style={{ height: '240px' }}></div>

        <div className="relative z-10 pt-8 sm:pt-10 md:pt-14 pb-8 sm:pb-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
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
              className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] text-[#211E62] mb-5 sm:mb-6 leading-[1.1]"
            >
              Surveys that actually{' '}
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }} className="text-[#5550BA] text-[110%]">measure</span> outcomes.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-[#4A5068] mb-10 leading-relaxed max-w-xl mx-auto font-light"
            >
              SurveyMetrics automatically measures participant change and aggregates outcomes—no spreadsheets, no manual work.
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
                <div className="min-h-[380px] sm:min-h-[420px] lg:min-h-[480px] relative p-2 sm:p-3 md:p-6">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#B86890]/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#EEEDfb] rounded-full blur-3xl"></div>
                  </div>
                  <div className="w-full h-full relative z-10" style={{ minHeight: '360px' }}>
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
      <section id="how-it-works" className="py-14 sm:py-24 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-20"
          >
            <div className="inline-block bg-[#DAD8F6] border border-[#BCB8EE] text-[#2E2E7A] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
              How it works
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#211E62] mb-4">
              Three steps to <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }} className="text-[#5550BA]">real</span> outcomes
            </h2>
            <p className="text-[#4A5068] text-base font-light max-w-md mx-auto">
              From defining what matters to watching data fill in — it all connects automatically.
            </p>
          </motion.div>

          <div className="space-y-16 sm:space-y-32">
            {[
              {
                step: "1",
                title: "Choose what you want to measure",
                subtitle: "Start with what matters",
                body: "Pick outcomes from a pre-validated library — wellbeing, job confidence, skill gain, belonging, and more. Aligned to WIOA, CASEL, and SDOH standards your funders already recognise. No starting from scratch.",
                highlights: ["Pre-validated outcome library", "Aligned to WIOA, CASEL & SDOH", "Funder-recognised standards"],
                visual: (
                  <div className="bg-white rounded-2xl border border-[#DAD8F6] p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-[#EEEDfb] flex items-center justify-center">
                        <Target size={16} className="text-[#5550BA]" />
                      </div>
                      <span className="text-xs font-semibold text-[#211E62] uppercase tracking-wider">Outcome Framework</span>
                    </div>
                    <div className="space-y-3">
                      {["Participant Confidence", "Skill Development", "Community Belonging"].map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                          className="flex items-center gap-3 bg-[#FDFCFA] border border-[#DAD8F6] rounded-lg px-4 py-3"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 + i * 0.15, type: "spring" }}
                            className="w-6 h-6 rounded-full bg-[#5550BA] flex items-center justify-center"
                          >
                            <CheckCircle2 size={14} className="text-white" />
                          </motion.div>
                          <span className="text-sm font-medium text-[#211E62]">{item}</span>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.7 + i * 0.15, duration: 0.6 }}
                            className="flex-1 h-1.5 bg-[#EEEDfb] rounded-full overflow-hidden ml-auto max-w-[80px]"
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${[75, 60, 45][i]}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.9 + i * 0.15, duration: 0.8 }}
                              className="h-full bg-[#5550BA] rounded-full"
                            />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2, duration: 0.4 }}
                      className="mt-4 flex items-center gap-2 text-xs text-[#B86890] font-medium"
                    >
                      <LinkIcon size={12} />
                      3 outcomes linked to 12 questions
                    </motion.div>
                  </div>
                ),
              },
              {
                step: "2",
                title: "Auto-generated surveys you can make your own",
                subtitle: "Generated, then personalized",
                body: "We auto-generate your pre- and post-program surveys from validated question sets — then let you tweak every question to match your program's language, context, and audience. No writing from scratch, but full control to personalize.",
                highlights: ["Auto-generated from validated question banks", "Edit any question to fit your program", "Personalize language, scale, and context"],
                visual: (
                  <div className="bg-white rounded-2xl border border-[#DAD8F6] p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF0F3] flex items-center justify-center">
                        <PenTool size={16} className="text-[#B86890]" />
                      </div>
                      <span className="text-xs font-semibold text-[#211E62] uppercase tracking-wider">Survey Builder</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { q: "I feel more confident in my abilities", edited: false, type: "Likert Scale", color: "bg-[#5550BA]" },
                        { q: "I learned new skills in this mentoring program", edited: true, type: "Likert Scale", color: "bg-[#B86890]" },
                        { q: "How would you rate the program?", edited: false, type: "Rating", color: "bg-[#948EDE]" },
                      ].map((item, i) => (
                        <motion.div
                          key={item.q}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
                          className={`bg-[#FDFCFA] border rounded-lg p-3 pl-7 relative ${item.edited ? 'border-[#B86890]/40 ring-1 ring-[#B86890]/10' : 'border-gray-200'}`}
                        >
                          <GripVertical size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                          <div className="font-medium text-sm text-[#211E62]">{item.q}</div>
                          <div className="text-xs text-[#6A7290] mt-1 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.color} inline-block`}></span>
                            {item.type}
                            {item.edited && (
                              <span className="ml-auto text-[10px] text-[#B86890] font-medium flex items-center gap-1">
                                <PenTool size={10} /> Personalized
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.0, type: "spring" }}
                      className="mt-4 flex gap-2"
                    >
                      <div className="flex-1 bg-[#5550BA] text-white text-xs font-semibold py-2 rounded-lg text-center">Share Survey</div>
                      <div className="flex-1 bg-[#EEEDfb] text-[#5550BA] text-xs font-semibold py-2 rounded-lg text-center border border-[#DAD8F6]">Preview</div>
                    </motion.div>
                  </div>
                ),
              },
              {
                step: "3",
                title: "See outcomes and insights — not just responses",
                subtitle: "Data meets meaning",
                body: "As responses come in, SurveyMetrix calculates outcomes automatically. How much did confidence improve? Which program cohorts are performing best? You can answer those questions now — without touching a spreadsheet.",
                highlights: ["Automatic outcome calculation", "Compare across cohorts & programs", "No spreadsheets required"],
                visual: (
                  <div className="bg-white rounded-2xl border border-[#DAD8F6] p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-[#EEEDfb] flex items-center justify-center">
                        <BarChart size={16} className="text-[#5550BA]" />
                      </div>
                      <span className="text-xs font-semibold text-[#211E62] uppercase tracking-wider">Outcome Dashboard</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Confidence", pct: 78, color: "bg-[#5550BA]" },
                        { label: "Skill Growth", pct: 65, color: "bg-[#B86890]" },
                        { label: "Belonging", pct: 82, color: "bg-[#948EDE]" },
                      ].map((item, i) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium text-[#211E62]">{item.label}</span>
                            <motion.span
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.8 + i * 0.15 }}
                              className="font-mono text-[#5550BA] font-medium"
                            >
                              {item.pct}%
                            </motion.span>
                          </div>
                          <div className="h-2.5 bg-[#EEEDfb] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.pct}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.5 + i * 0.15, duration: 1, ease: "easeOut" }}
                              className={`h-full ${item.color} rounded-full`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.3, duration: 0.4 }}
                      className="mt-5 flex items-center justify-between bg-[#FAF0F3] border border-[#B86890]/20 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-xs font-medium text-[#B86890]">142 responses across 3 programs</span>
                      <div className="text-xs font-semibold text-[#B86890] flex items-center gap-1">
                        <Download size={12} /> Export
                      </div>
                    </motion.div>
                  </div>
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
                  <h3 className="font-display text-2xl md:text-3xl text-[#211E62] mb-4">
                    {step.step}. {step.title}
                  </h3>
                  <p className="text-[#4A5068] text-base font-light leading-relaxed mb-6">{step.body}</p>
                  <ul className="space-y-2.5">
                    {step.highlights.map((h, j) => (
                      <motion.li
                        key={h}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + j * 0.1, duration: 0.35 }}
                        className="flex items-center gap-2.5 text-sm text-[#4A5068]"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#EEEDfb] flex items-center justify-center shrink-0">
                          <CheckCircle2 size={12} className="text-[#5550BA]" />
                        </div>
                        {h}
                      </motion.li>
                    ))}
                  </ul>
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
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-[#211E62] mb-4 leading-[1.15]">
              Works for the programs<br />your organisation already runs.
            </h2>
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
              Join the Waitlist <ArrowRight size={16} />
            </button>

          </motion.div>

          <div className="max-w-5xl mx-auto mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-[#5550BA]/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-display text-base text-white">Survey<span className="text-[#948EDE]">Metrix</span></span>

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