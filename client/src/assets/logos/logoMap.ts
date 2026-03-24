import smallWorldMusic from "./Small_World_Music.png";
import bCurrent from "./BCurrent.png";
import sakeenahFoundation from "./Sakeenah_Foundation.png";
import eastEndArts from "./East_End_Arts.png";
import folkCanada from "./Folk_Canada.png";
import settlementAid from "./Settlement_Aid_For_Newcomers.png";
import glenEden from "./Glen_Eden_Youth_Center.png";
import careOf from "./Care_Of.png";

export interface OrgLogo {
  name: string;
  initials: string;
  logo?: string;
}

const orgLogos: OrgLogo[] = [
  { name: "Small World Music", initials: "SW", logo: smallWorldMusic },
  { name: "BCurrent", initials: "BC", logo: bCurrent },
  { name: "Sakeenah Foundation", initials: "SF", logo: sakeenahFoundation },
  { name: "East End Arts", initials: "EE", logo: eastEndArts },
  { name: "Folk Canada", initials: "FC", logo: folkCanada },
  { name: "Settlement Aid for Newcomers", initials: "SA", logo: settlementAid },
  { name: "Glen Eden Youth Center", initials: "GE", logo: glenEden },
  { name: "Care/Of", initials: "CO", logo: careOf },
];

export default orgLogos;
