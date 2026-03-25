import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    number: "1",
    title: "Overview",
    content: `This Privacy Policy explains how SurveyMetrix collects, uses, and protects personal information gathered through its Meta (Facebook and Instagram) advertising campaign, which is being run as part of a Product Viability Testing phase. This campaign targets nonprofit professionals in the United States, United Kingdom, Canada, and Australia.

By clicking on our ads, submitting the waitlist form, completing a Meta Instant Form, or making a priority access payment, you agree to the practices described in this policy.`,
  },
  {
    number: "2",
    title: "Information We Collect",
    subsections: [
      {
        label: "2a. Via Meta Instant Form",
        items: ["First name and last name", "Email address", "Job role (Program Manager, Executive Director, Grants Manager, or Other)", "Organisation name"],
      },
      {
        label: "2b. Via Website",
        items: ["Email address", "Any additional details voluntarily submitted on the waitlist page"],
      },
      {
        label: "2c. Priority Access Payment",
        items: ["Payment information processed securely through Stripe (we do not store card details)", "Name and email address associated with the payment"],
      },
      {
        label: "2d. Automatically Collected Data",
        items: ["Browser and device type (via Meta Pixel)", "IP address and approximate location", "Ad interaction data including clicks, impressions, and conversions", "UTM parameters (utm_source, utm_medium, utm_campaign, utm_content) used to attribute which ad or ad set you interacted with"],
      },
    ],
  },
  {
    number: "3",
    title: "How We Use Your Information",
    bullets: [
      "To add you to the SurveyMetrix waitlist and send you product updates",
      "To process your priority access payment via Stripe",
      "To measure product-market fit and validate demand for SurveyMetrix among nonprofit professionals",
      "To segment and analyse leads by region (US, UK, Canada, Australia), job role, and campaign source",
      "To optimise our Meta advertising campaigns using aggregated conversion data",
      "To build Lookalike Audiences on Meta using anonymised lead data to reach similar professionals (no individual data is shared with Meta beyond what is required for this purpose)",
      "To communicate with you about SurveyMetrix, including launch updates, early access offers, and product news",
    ],
  },
  {
    number: "4",
    title: "Legal Basis for Processing",
    bullets: [
      "Consent: By submitting the waitlist form or Instant Form, you consent to receiving communications from SurveyMetrix.",
      "Legitimate Interests: We have a legitimate interest in understanding demand for our product among the nonprofit sector and running efficient advertising campaigns.",
      "Contract Performance: For priority access payments, processing is necessary to fulfil the transaction.",
    ],
  },
  {
    number: "5",
    title: "Third-Party Services",
    subsections: [
      {
        label: "Meta (Facebook & Instagram)",
        text: "We use Meta's advertising platform to run our campaigns and the Meta Pixel to track conversion events on our website. Meta may collect data in accordance with its own Privacy Policy. Instant Form submissions are collected and processed by Meta before being transferred to us.",
      },
      {
        label: "Stripe",
        text: "All payments are processed securely through Stripe. SurveyMetrix does not store your credit card details. Please refer to Stripe's Privacy Policy for details on how payment data is handled.",
      },
    ],
  },
  {
    number: "6",
    title: "Data Sharing",
    content: "We do not sell, rent, or trade your personal information to third parties. We may share data in the following limited circumstances:",
    bullets: [
      "With service providers (Meta, Stripe, CRM platform) solely to operate this campaign",
      "If required by law, court order, or regulatory authority",
      "In connection with a business transfer or acquisition, where your data would remain subject to equivalent protections",
    ],
  },
  {
    number: "7",
    title: "Data Retention",
    content: "We retain your personal data for as long as necessary to fulfil the purposes outlined in this policy. Specifically:",
    bullets: [
      "Waitlist and lead data: retained for the duration of the SurveyMetrix product development phase and up to 24 months after product launch",
      "Payment records: retained as required by applicable financial regulations (typically 7 years)",
      "You may request deletion of your data at any time — see Section 9.",
    ],
  },
  {
    number: "8",
    title: "International Data Transfers",
    content: "This campaign collects data from individuals in the United States, United Kingdom, Canada, and Australia. Data may be stored and processed on servers located outside your country of residence. Where required, we apply appropriate safeguards to ensure your data is protected in accordance with applicable law, including UK GDPR and Canada's PIPEDA.",
  },
  {
    number: "9",
    title: "Your Rights",
    content: "Depending on your location, you may have the following rights regarding your personal data:",
    bullets: [
      "Access: Request a copy of the personal data we hold about you",
      "Correction: Request that inaccurate or incomplete data be corrected",
      "Deletion: Request that your data be deleted (right to erasure / right to be forgotten)",
      "Objection: Object to the processing of your data for marketing purposes",
      "Withdrawal of Consent: Unsubscribe from communications at any time via the unsubscribe link in any email we send",
    ],
    footer: "To exercise any of these rights, please contact us at the address below.",
  },
  {
    number: "10",
    title: "Cookies & Tracking Technologies",
    content: "We use the Meta Pixel on our website, which places a cookie in your browser to track whether you have completed a conversion event (such as submitting the waitlist form or completing a purchase). This data is used solely to measure campaign performance and optimise ad delivery. You can opt out of Meta's use of your data for ad targeting via your Meta account's Ad Preferences settings.",
  },
  {
    number: "11",
    title: "Children's Privacy",
    content: "This campaign is directed solely at professionals aged 18 and over. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that data has been collected from a minor, it will be deleted promptly.",
  },
  {
    number: "12",
    title: "Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. Any changes will be posted at our website and, where material, communicated to waitlist members by email. Continued participation in the campaign after updates constitutes acceptance of the revised policy.",
  },
  {
    number: "13",
    title: "Contact Us",
    content: "For any questions about this Privacy Policy or to exercise your data rights, please contact:",
    contact: {
      name: "SurveyMetrix",
      email: "contact@surveymetrix.com",
      website: "www.surveymetrix.com",
    },
    footer: "This policy applies specifically to data collected through the SurveyMetrix Phase 1 Meta Ad Campaign (March 2026). A full product privacy policy will be published at product launch.",
  },
];

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#FDFCFA] text-[#211E62] font-sans">
      {/* Nav */}
      <header className="px-6 lg:px-12 py-4 flex justify-between items-center bg-[#FDFCFA] border-b border-[#DAD8F6] sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="SurveyMetrix" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-xl text-[#211E62]">Survey<span className="text-[#5550BA]">Metrix</span></span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-[#5550BA] hover:text-[#211E62] transition-colors font-medium"
          data-testid="button-back-home"
        >
          <ArrowLeft size={15} /> Back to home
        </button>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#211E62] to-[#2E2A78] px-6 py-16 text-center">
        <p className="text-[#948EDE] text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
        <h1 className="font-display text-3xl md:text-4xl text-white mb-3">Privacy Policy</h1>
        <p className="text-[#C4C0E8] text-sm">Effective: March 2026 &nbsp;·&nbsp; Phase 1 Meta Ad Campaign</p>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-14">
        {sections.map((section) => (
          <div key={section.number} className="mb-10">
            <h2 className="font-display text-xl text-[#211E62] mb-3 flex items-baseline gap-2">
              <span className="text-[#5550BA] font-mono text-sm">{section.number}.</span>
              {section.title}
            </h2>

            {section.content && (
              <p className="text-[#4A5068] leading-relaxed text-sm mb-3 whitespace-pre-line">{section.content}</p>
            )}

            {section.bullets && (
              <ul className="space-y-2 mb-3">
                {section.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-[#4A5068] leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#B86890] shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {section.subsections && section.subsections.map((sub: any) => (
              <div key={sub.label} className="mb-4 pl-4 border-l-2 border-[#DAD8F6]">
                <p className="text-xs font-bold text-[#5550BA] uppercase tracking-wider mb-2">{sub.label}</p>
                {sub.items && (
                  <ul className="space-y-1.5">
                    {sub.items.map((item: string) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-[#4A5068] leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#B86890] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {sub.text && <p className="text-sm text-[#4A5068] leading-relaxed">{sub.text}</p>}
              </div>
            ))}

            {section.footer && (
              <p className="text-[#4A5068] text-sm leading-relaxed mt-3 italic">{section.footer}</p>
            )}

            {section.contact && (
              <div className="mt-3 bg-[#F4F3FC] rounded-xl p-4 text-sm text-[#4A5068] space-y-1">
                <p className="font-semibold text-[#211E62]">{section.contact.name}</p>
                <p>Email: <a href={`mailto:${section.contact.email}`} className="text-[#5550BA] hover:underline">{section.contact.email}</a></p>
                <p>Website: <a href={`https://${section.contact.website}`} className="text-[#5550BA] hover:underline">{section.contact.website}</a></p>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Footer */}
      <div className="border-t border-[#DAD8F6] py-8 text-center">
        <p className="text-xs text-[#9DA4BC]">© {new Date().getFullYear()} SurveyMetrix. All rights reserved.</p>
      </div>
    </div>
  );
}
