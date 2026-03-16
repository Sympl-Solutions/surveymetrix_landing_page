export interface OrgLogo {
  name: string;
  initials: string;
  logo?: string;
}

const orgLogos: OrgLogo[] = [
  { name: "Bright Futures Foundation", initials: "BF" },
  { name: "Urban Youth Alliance", initials: "UY" },
  { name: "Community Builders Network", initials: "CB" },
  { name: "Hope & Wellness Initiative", initials: "HW" },
  { name: "Pathways to Success", initials: "PS" },
  { name: "Empower Together", initials: "ET" },
  { name: "NextGen Leaders", initials: "NL" },
  { name: "Resilient Communities", initials: "RC" },
  { name: "Bridge to Opportunity", initials: "BO" },
  { name: "Thrive Collective", initials: "TC" },
];

export default orgLogos;
