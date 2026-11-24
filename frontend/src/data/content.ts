/* ===========================================================================
   content.ts — the single source of truth for every piece of text on the site.
   ===========================================================================

   Nothing user-visible should be written into a component any more. To change
   a word, a bullet, a link or a section heading, change it here and the site
   follows.

   This replaced the previous setup, where name/bio/role/projects/skills came
   from the NestJS + MongoDB API (`/api/profile`, `/api/projects`,
   `/api/skills`). Those three endpoints are no longer called by the frontend.
   The contact form is the one thing still talking to the backend: it posts to
   `/api/contact`, which saves the message and emails a notification.

   Types are declared alongside the data so components get real autocomplete,
   and so a missing field fails at build time rather than rendering a blank.
--------------------------------------------------------------------------- */

/* ---------------------------------------------------------------- profile -- */

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  github: string;
  linkedin: string;
  /** Served from /public. page.tsx checks it exists before linking to it. */
  resume: string;
  /** Developer-focused résumé, same rules as `resume`. */
  resumeFullStack: string;
  availability: string;
  /** Remote image — the hostname is allow-listed in next.config.ts. */
  profilePic: string;
  /**
   * Background-removed PNG under /public, shown full-height in the hero.
   * page.tsx checks it exists before passing it down, so a missing file
   * degrades to a type-only hero rather than a broken image.
   */
  portrait: string;
}

export const profile: Profile = {
  name: "Majall",
  title: "IT Support Engineer",
  tagline: "IT Support · IT Operations · Network Support",
  location: "Colombo, Sri Lanka",
  email: "majaalmj7@gmail.com",
  phone: "+94 76 213 0670",
  whatsapp: "https://wa.me/94762130670",
  github: "https://github.com/Majall",
  linkedin: "https://www.linkedin.com/in/Majaal_MJ",
  resume: "/Majaal_Resume.pdf",
  resumeFullStack: "/Majaal_Resume_FullStack.pdf",
  availability:
    "Available for work: shift work, night shifts and on-call. Open to relocating to Colombo.",
  profilePic:
    "https://res.cloudinary.com/df8ohajqt/image/upload/v1774592351/portfolio/profiles/ctiqsurjrfuecm1xjk2h.jpg",
  portrait: "/portrait.png",
};

/* ------------------------------------------------------------------- meta -- */

export const meta = {
  title: `${profile.name} — ${profile.title}`,
  description: `Portfolio of ${profile.name}, ${profile.title} in ${profile.location}. ${profile.tagline}.`,
};

/* -------------------------------------------------------------------- nav -- */

export interface NavLink {
  name: string;
  href: string;
  /** The id of the section it points at — drives the scroll-spy in NavBar. */
  id: string;
}

export const nav: NavLink[] = [
  { name: "Home", href: "#home", id: "home" },
  { name: "About", href: "#about", id: "about" },
  { name: "Service", href: "#service", id: "service" },
  { name: "Labs", href: "#labs", id: "labs" },
  { name: "Projects", href: "#project", id: "project" },
  { name: "Contact", href: "#contact", id: "contact" },
];

/* ----------------------------------------------------------------- loader -- */

export const loader = {
  /** Revealed letter by letter, left to right. */
  name: "MAJALL",
  /** Replaces the name on the final beat. */
  word: "PORTFOLIO",
};

/* ------------------------------------------------------------------- hero -- */

export const hero = {
  /**
   * The single oversized chrome word behind the portrait. It is deliberately
   * NOT the job title: the title is set beneath it in `roleLead` /
   * `roleAccent`, so the two do not repeat each other.
   */
  word: "PORTFOLIO",

  /** The role, split so the last word can take the italic serif. Used by
      the intro loader's closing frame. */
  roleLead: "IT Support",
  roleAccent: "Engineer",

  /** Typed out one after another under the hero word. The first is rendered
      complete on the server, so it is the one a visitor sees if motion is
      reduced — put the most important discipline first. */
  roleCycle: ["IT Support & Networking", "Software Development"],

  /** Announced in place of the decorative word for assistive tech. */
  srHeadline: "Majall — IT Support Engineer",

  intro:
    "HNDIT graduate moving into IT Support and IT Operations. Methodical troubleshooter across Windows, networking, servers and databases.",
  contactCta: { label: "Contact", href: "#contact" },
  scrollCueLabel: "Scroll down",
  scrollCue: "Scroll to begin",
  resumeLabel: "Resume",
};

/* ------------------------------------------------------------------ about -- */

export interface Highlight {
  value: string;
  label: string;
}

export const about = {
  eyebrow: "Background & Foundations",
  index: "01",
  /* Chapter headings are set as a heavy uppercase lead plus one italic serif
     accent word, so `heading` and `headingAccent` are rendered in different
     faces rather than concatenated. */
  heading: "Where I've",
  headingAccent: "been",

  bio: "HNDIT graduate moving into IT Support and IT Operations, with one year of professional technical experience diagnosing faults and resolving application, server and database issues. I have practical knowledge of Windows setup and configuration, PC hardware and software troubleshooting, and networking: TCP/IP, subnetting, VLANs, switching, routing, DNS, DHCP, NAT, ACLs and Wi-Fi, built through structured Cisco CCNA 200-301 study and hands-on labs in Cisco Packet Tracer. I'm a methodical troubleshooter, developing my PowerShell and Python automation skills.",

  /* Three stat items. `value` is set large, `label` small underneath. */
  highlights: [
    { value: "1 year", label: "Professional experience" },
    { value: "CCNA 200-301", label: "In progress" },
    { value: "HNDIT", label: "Graduate — SLIATE" },
  ] satisfies Highlight[],

  /* The disciplines pill above the heading. */
  badge: "IT Support · Networking · Software Development",

  /* Terms lifted out of `bio` and set in full-strength text, so the
     paragraph can be skimmed for capability without being rewritten into a
     list. Matched longest-first in About.tsx, so "Windows Server" wins over
     "Windows" where the two overlap. Anything here that is not literally
     present in `bio` is simply ignored. */
  bioHighlights: [
    "IT Support",
    "IT Operations",
    "Windows",
    "TCP/IP",
    "subnetting",
    "VLANs",
    "switching",
    "routing",
    "DNS",
    "DHCP",
    "NAT",
    "ACLs",
    "Wi-Fi",
    "Cisco CCNA 200-301",
    "Cisco Packet Tracer",
    "PowerShell",
    "Python",
  ],

  toolkitLabel: "My toolkit",
  journeyLabel: "My journey",
  socialLabel: "Social links",

  ghostWord: "About",
  resumeLabel: "Download résumé",
  resumeFullStackLabel: "Full Stack résumé",
  availabilityLabel: "Availability",
};

/* ------------------------------------------------------------- experience -- */

export interface Experience {
  role: string;
  company: string;
  type: string;
  dates: string;
  points: string[];
}

export const experience: Experience[] = [
  {
    role: "Full Stack Developer",
    company: "Witsberry Pvt Ltd",
    type: "On-site · Full-time internship",
    dates: "September 2025 – November 2026",
    points: [
      "Built and maintained backend services and REST APIs with Node.js, NestJS and Express.",
      "Modelled and queried MySQL, PostgreSQL and MongoDB databases, protecting data integrity and resolving data issues raised by users and colleagues.",
      "Investigated and debugged application, server and database problems, finding root causes and applying fixes that improved reliability.",
      "Integrated backend endpoints with React and Next.js front ends.",
      "Supported deployment, configuration and troubleshooting across Linux and cloud-hosted servers.",
      "Used Git and GitHub for version control and change tracking in a professional team.",
      "Worked on-site with the team, writing technical notes and communicating findings clearly in English with minimal supervision.",
    ],
  },
];

export const experienceSection = {
  label: "Experience",
  eyebrow: "Professional Record",
  index: "05",
  heading: "Where I've",
  headingAccent: "worked",
  note: "One year of full-time technical work, on-site with the team.",
  ghostWord: "Exp",
};

/* -------------------------------------------------------------- education -- */

export interface Education {
  qualification: string;
  institution: string;
  dates: string;
  modules: string[];
}

export const education: Education[] = [
  {
    qualification: "Higher National Diploma in Information Technology (HNDIT)",
    institution: "SLIATE, Batticaloa",
    dates: "August 2023 – 2026",
    modules: [
      "Computer Networks",
      "Operating Systems",
      "Database Management Systems",
      "IT Fundamentals",
      "Programming and System Development",
    ],
  },
];

export const educationSection = {
  label: "Education",
  modulesLabel: "Key modules",
};

/* ------------------------------------------------------------------ journey -- */

/**
 * One timeline covering both study and work.
 *
 * The entries are built from `education` and `experience` rather than being
 * retyped, so the CV data stays in one place and a change to a date or a
 * bullet cannot leave the timeline disagreeing with the rest of the site.
 *
 * Ordered oldest-first: the diploma starts in 2023 and the job starts in 2025,
 * so reading top to bottom follows the career forwards.
 */
export interface JourneyEntry {
  id: string;
  kind: "education" | "experience";
  tag: string;
  dates: string;
  title: string;
  org: string;
  /** A one-line summary under the organisation. */
  summary?: string;
  /** Detail bullets, shown only where there are any. */
  points?: string[];
  /** Chips under the body — key modules for study, nothing for work. */
  chips?: string[];
  chipsLabel?: string;
}

export const journey: JourneyEntry[] = [
  ...education.map((item, i) => ({
    id: `education-${i}`,
    kind: "education" as const,
    tag: "Education",
    dates: item.dates,
    title: item.qualification,
    org: item.institution,
    chips: item.modules,
    chipsLabel: educationSection.modulesLabel,
  })),
  ...experience.map((item, i) => ({
    id: `experience-${i}`,
    kind: "experience" as const,
    tag: "Experience",
    dates: item.dates,
    title: item.role,
    org: item.company,
    summary: item.type,
    points: item.points,
  })),
];

export const journeySection = {
  label: "My journey",
  index: "01",
  eyebrow: "Professional record",
  heading: "Where I've",
  headingAccent: "been",
  note: "Study and work, in the order it happened.",
  ghostWord: "Path",
};

/* -------------------------------------------------- languages & strengths -- */

export interface Language {
  name: string;
  level: string;
}

export const languages: Language[] = [
  { name: "English", level: "Professional working proficiency" },
  { name: "Tamil", level: "Native" },
  { name: "Sinhala", level: "Basic" },
];

export const strengths: string[] = [
  "Structured troubleshooting",
  "Analytical thinking",
  "Clear written and spoken English",
  "Fast technical learner",
  "Attention to detail",
  "Remote collaboration",
  "Technical documentation",
];

export const languagesSection = { label: "Languages" };
export const strengthsSection = { label: "Strengths" };

/* --------------------------------------------------------------- services -- */

export interface Service {
  number: string;
  title: string;
  description: string;
  bullets: string[];
}

export const services: Service[] = [
  {
    number: "01",
    title: "IT Support & Troubleshooting",
    description:
      "First-line and escalated support for end users and the machines they depend on.",
    bullets: [
      "Technical and end-user support",
      "PC hardware and software troubleshooting",
      "Fault diagnosis and escalation",
      "Hardware and peripheral installation",
      "Endpoint setup",
    ],
  },
  {
    number: "02",
    title: "Windows & Operating Systems",
    description:
      "Building, configuring and keeping desktop and server operating systems healthy.",
    bullets: [
      "Windows installation, configuration and maintenance",
      "Linux fundamentals",
      "Basic system administration",
      "User account management",
    ],
  },
  {
    number: "03",
    title: "Network Support",
    description:
      "Designing, configuring and fault-finding small to medium office networks.",
    bullets: [
      "TCP/IP, IPv4/IPv6, subnetting",
      "VLANs, switching and routing",
      "DNS, DHCP, NAT and ACLs",
      "LAN/WAN and Wi-Fi",
      "Troubleshooting with ping, tracert, ipconfig and nslookup",
    ],
  },
  {
    number: "04",
    title: "Server & Database Support",
    description:
      "Keeping the back end and its data reachable, correct and recoverable.",
    bullets: [
      "SQL, MySQL, PostgreSQL and MongoDB",
      "Backend and API troubleshooting",
      "Cloud-hosted Linux servers",
      "Docker fundamentals",
    ],
  },
  {
    number: "05",
    title: "Scripting & Automation",
    description:
      "Turning repeated manual work into something that runs the same way every time.",
    bullets: [
      "Windows PowerShell (developing)",
      "Python (working knowledge)",
      "Bash fundamentals",
      "Git and GitHub",
    ],
  },
  {
    number: "06",
    title: "Documentation & Communication",
    description:
      "Writing things down so the next person — or the next shift — does not start from zero.",
    bullets: [
      "Technical notes and runbooks",
      "Clear written and spoken English",
      "Working with remote teams",
      "Structured problem solving",
    ],
  },
];

export const servicesSection = {
  eyebrow: "Capabilities",
  index: "02",
  heading: "What I can",
  headingAccent: "do",
  note: "Six areas I support, from the endpoint on someone's desk to the database behind it.",
  ghostWord: "Support",
  /** Printed inside the one expanded row. */
  viewProjectsLabel: "View projects",
  expandLabel: "Expand",
  collapseLabel: "Collapse",
};

/* ----------------------------------------------------------------- skills -- */

/* ---------------------------------------------------------------------------
   Skills, as four disciplines of individual items.

   Every entry here already appears somewhere else in this file — in the old
   toolkit groups, in a project's `tech` list, or in an experience bullet.
   Compound chips were split into their parts ("DHCP & DNS" became two) rather
   than anything new being added, so the grid stays an honest re-cut of what is
   claimed elsewhere on the page.

   `icon` names a glyph drawn inline in Toolkit.tsx. They are deliberately
   generic shapes rather than brand marks: shipping third-party logos means
   shipping their trademarks, and a wrong-coloured logo looks worse than a
   clean symbol.
--------------------------------------------------------------------------- */

export type SkillIcon =
  | "code"
  | "component"
  | "server"
  | "database"
  | "api"
  | "terminal"
  | "network"
  | "route"
  | "globe"
  | "shield"
  | "windows"
  | "users"
  | "folder"
  | "key"
  | "wrench"
  | "git"
  | "box"
  | "wifi";

export interface Skill {
  name: string;
  icon: SkillIcon;
}

export interface SkillCategory {
  key: string;
  label: string;
  /** CSS custom property holding this discipline's accent colour. */
  accent: string;
  items: Skill[];
}

export const skillCategories: SkillCategory[] = [
  {
    key: "software",
    label: "Software Development",
    accent: "var(--accent-dev)",
    items: [
      { name: "Full-stack development", icon: "code" },
      { name: "Backend development", icon: "server" },
      { name: "REST APIs", icon: "api" },
      { name: "React", icon: "component" },
      { name: "Next.js", icon: "component" },
      { name: "Node.js", icon: "server" },
      { name: "NestJS", icon: "server" },
      { name: "Express.js", icon: "server" },
      { name: "JavaScript", icon: "code" },
      { name: "PHP", icon: "code" },
      { name: "Laravel", icon: "code" },
      { name: "MySQL", icon: "database" },
      { name: "PostgreSQL", icon: "database" },
      { name: "MongoDB", icon: "database" },
      { name: "Prisma", icon: "database" },
      { name: "Tailwind CSS", icon: "component" },
      { name: "Socket.IO", icon: "network" },
    ],
  },
  {
    key: "networking",
    label: "Networking",
    accent: "var(--accent-net)",
    items: [
      { name: "TCP/IP", icon: "network" },
      { name: "IPv4 addressing", icon: "network" },
      { name: "Subnetting", icon: "route" },
      { name: "VLANs", icon: "network" },
      { name: "Trunking", icon: "route" },
      { name: "Inter-VLAN routing", icon: "route" },
      { name: "DHCP", icon: "globe" },
      { name: "DNS", icon: "globe" },
      { name: "NAT", icon: "route" },
      { name: "ACL fundamentals", icon: "shield" },
      { name: "Cisco IOS CLI", icon: "terminal" },
      { name: "Cisco Packet Tracer", icon: "network" },
    ],
  },
  {
    key: "windows",
    label: "Windows & System Administration",
    accent: "var(--accent-sys)",
    items: [
      { name: "Windows 10 / 11", icon: "windows" },
      { name: "Windows Server", icon: "server" },
      { name: "Active Directory (AD DS)", icon: "users" },
      { name: "Organizational Units (OUs)", icon: "folder" },
      { name: "User & group management", icon: "users" },
      { name: "Group Policy (GPO)", icon: "key" },
      { name: "Domain joining", icon: "network" },
      { name: "Shared folder permissions", icon: "folder" },
      { name: "Hardware & software troubleshooting", icon: "wrench" },
      { name: "Linux", icon: "terminal" },
    ],
  },
  {
    key: "tools",
    label: "Tools & Technologies",
    accent: "var(--accent-tools)",
    items: [
      { name: "Git & GitHub", icon: "git" },
      { name: "Vite", icon: "box" },
      { name: "Prisma", icon: "database" },
      { name: "Neon", icon: "database" },
    ],
  },
];

/** Total across every discipline, for the "all" tab. */
export const skillCount: number = skillCategories.reduce(
  (total, category) => total + category.items.length,
  0,
);

export const skillsSection = {
  label: "Technical skills",
  note: "Grouped by discipline.",
};

/* The strip renders one marquee row per group, alternating direction. Each
   row is its own discipline, so the rows stay legible as categories rather
   than becoming one undifferentiated scroll of words. */
/* The toolkit chapter: one card per discipline, each listing its skills as
   chips with a live count in the card header. */
export const toolkitSection = {
  label: "My toolkit",
  index: "03",
  eyebrow: "Capabilities",
  heading: "What I",
  headingAccent: "know",
  note: "Grouped by discipline, with everything I work with listed out rather than summarised.",
  countLabel: "skills",
  allLabel: "All skills",
  filterAria: "Filter skills by discipline",
  ghostWord: "Stack",
};

/* ------------------------------------------------------------------- labs -- */

export interface Lab {
  number: string;
  title: string;
  description: string;
  configured: string[];
  /** Packet Tracer topology screenshot. null renders a numbered placeholder. */
  image: string | null;
}

export const labs: Lab[] = [
  {
    number: "01",
    title: "VLANs & inter-VLAN routing",
    description:
      "Segmented a switched office network and routed between the segments on Cisco switches.",
    configured: [
      "VLAN creation",
      "Access and trunk ports",
      "Inter-VLAN routing",
      "Basic port security",
    ],
    image: null,
  },
  {
    number: "02",
    title: "Static & dynamic routing",
    description:
      "Configured static and dynamic routing across multi-router topologies and verified it from the Cisco IOS CLI.",
    configured: [
      "Static routes",
      "Dynamic routing protocols",
      "Multi-router topologies",
      "Verification from the IOS CLI",
    ],
    image: null,
  },
  {
    number: "03",
    title: "DHCP, DNS, NAT & ACLs",
    description:
      "Brought up core network services and controlled traffic across a multi-router lab.",
    configured: [
      "DHCP pools and reservations",
      "DNS resolution",
      "NAT translation",
      "Standard and extended ACLs",
    ],
    image: null,
  },
  {
    number: "04",
    title: "IPv4/IPv6 addressing & VLSM",
    description:
      "Planned addressing schemes for small and medium office networks.",
    configured: [
      "IPv4 subnetting",
      "IPv6 addressing",
      "VLSM designs",
      "Small and medium office plans",
    ],
    image: null,
  },
];

export const labsSection = {
  eyebrow: "CCNA Training",
  index: "03",
  heading: "Hands-on",
  headingAccent: "labs",
  note: "Built in Cisco Packet Tracer alongside structured CCNA study.",
  certificationNote:
    "Cisco CCNA (200-301): currently preparing / retaking. Studying the full syllabus: network fundamentals, network access, IP connectivity, IP services, security fundamentals and automation basics.",
  configuredLabel: "Configured",
  ghostWord: "Labs",

  /* Shelf chrome: the label on the rail, and the hint printed under it. */
  railHint: "Drag the rail to browse the labs.",
  shelfHint: "Scroll to spin the shelf",
};

/* --------------------------------------------------------------- projects -- */

export interface Project {
  /** Stable key for React lists. */
  id: string;
  number: string;
  /** The title is split so the first part can be set in heavy display type... */
  titleLead: string;
  /** ...and the second part in a lighter lowercase accent. */
  titleAccent: string;
  description: string;
  tech: string[];
  image: string;
  liveUrl: string | null;
  githubUrl: string;
}

export const projects: Project[] = [
  {
    id: "clothing-store",
    number: "01",
    titleLead: "CLOTHING",
    titleAccent: "store",
    description:
      "StyleHub, a single-vendor clothing store with secure authentication and an admin dashboard for products, categories, sizes and inventory. Responsive across desktop, tablet and mobile, deployed to the cloud.",
    tech: [
      "React",
      "Laravel",
      "PHP",
      "MySQL",
      "Tailwind CSS",
      "Vite",
      "JavaScript",
      "REST API",
      "Git",
    ],
    image:
      "https://res.cloudinary.com/df8ohajqt/image/upload/v1777352400/portfolio/projects/unedmp3fugep1mufbyzs.png",
    liveUrl: null,
    githubUrl: "https://github.com/Majall/Clothing-E-Commerce-Web-Application",
  },
  {
    id: "getitware",
    number: "02",
    titleLead: "GETITWARE",
    titleAccent: "electronics",
    description:
      "A single-vendor electronics store on the MERN stack, with secure authentication and an admin dashboard for products, categories and inventory. Deployed on Vercel.",
    tech: [
      "MongoDB",
      "Express.js",
      "React.js",
      "Node.js",
      "REST APIs",
      "Tailwind CSS",
    ],
    image:
      "https://res.cloudinary.com/df8ohajqt/image/upload/v1777192008/portfolio/projects/wc2gxqlzw0n80glvg8gw.png",
    liveUrl: "https://electro-website-frontend.vercel.app/",
    githubUrl: "https://github.com/Majall/Electronic-Website-main",
  },
  {
    id: "service-provider",
    number: "03",
    titleLead: "SERVICE",
    titleAccent: "platform",
    description:
      "A platform for discovering and booking service providers, managing bookings and leaving reviews. Next.js front end against a NestJS REST API with Prisma, deployed on Render.",
    tech: [
      "Next.js",
      "NestJS",
      "Node.js",
      "Prisma",
      "Neon",
      "REST APIs",
      "Tailwind CSS",
    ],
    image:
      "https://res.cloudinary.com/df8ohajqt/image/upload/v1777095121/portfolio/projects/gb5hwinzbpsjolnsub08.png",
    liveUrl: "https://service-provider-frontend-qbrk.onrender.com",
    githubUrl: "https://github.com/Majall/service-provider-main",
  },
  /* Carried over from the previous site. Delete this entry if you want only
     the three projects named in the CV. */
  {
    id: "realtime-chat",
    number: "04",
    titleLead: "REALTIME",
    titleAccent: "chat",
    description:
      "A MERN chat application using Socket.IO for instant messaging, with image sharing in chats, dark and light themes and a responsive UI.",
    tech: [
      "Express.js",
      "React.js",
      "Node.js",
      "Socket.IO",
      "REST APIs",
      "Tailwind CSS",
    ],
    image:
      "https://res.cloudinary.com/df8ohajqt/image/upload/v1774506292/portfolio/projects/yny8hc6060lrrtscpu2q.png",
    liveUrl: "https://realtime-chatapp-frontend-f0ce.onrender.com/",
    githubUrl: "https://github.com/Majall/RealTime-ChatApp.git",
  },
];

export const projectsSection = {
  eyebrow: "Supporting Work",
  index: "04",
  heading: "Things I've",
  headingAccent: "built",
  note: "Full-stack web projects from my diploma and internship — where the server, database and deployment troubleshooting above came from.",
  ghostWord: "Work",
  liveLabel: "Live",
  codeLabel: "Code",
  prevLabel: "Previous project",
  nextLabel: "Next project",
  browseLabel: "View the code",
  messageLabel: "Message me",
};

/* ---------------------------------------------------------------- contact -- */

export interface NetworkLink {
  label: string;
  href: string;
  handle: string;
}

export const contact = {
  availabilityPill: "Available for work",
  whatsappLabel: "Message on WhatsApp",
  emailLabel: "Send an email",
  cardLabels: {
    email: "Email",
    phone: "Phone",
    basedIn: "Based in",
    elsewhere: "Elsewhere",
  },
  eyebrow: "Open to work & collaboration",
  index: "05",
  heading: "Let's",
  headingAccent: "talk",
  ghostWord: "Contact",

  networkLabel: "Find me elsewhere",
  formLabel: "Or send a message",

  network: [
    { label: "Email", href: `mailto:${profile.email}`, handle: profile.email },
    { label: "WhatsApp", href: profile.whatsapp, handle: profile.phone },
    {
      label: "LinkedIn",
      href: profile.linkedin,
      handle: "Experience & network",
    },
    {
      label: "GitHub",
      href: profile.github,
      handle: "Source & side projects",
    },
  ] satisfies NetworkLink[],

  details: [
    { label: "Phone", value: profile.phone },
    { label: "Location", value: profile.location },
  ],

  form: {
    nameLabel: "Your name",
    namePlaceholder: "Your full name",
    emailLabel: "Your email",
    emailPlaceholder: "name@company.com",
    messageLabel: "Message",
    messagePlaceholder: "What do you need help with?",
    submitLabel: "Send message",
    sendingLabel: "Sending…",
    successLabel: "✓ Message sent — I'll reply soon",
    errorLabel: "✕ Could not send. Try again, or email me directly.",
  },
};

/* ------------------------------------------------------------------- game -- */

export const game = {
  label: "Easter egg",
  heading: "Break it if you",
  headingAccent: "can",
  intro:
    "A wall of pixels, one ball, three lives. Move your mouse — or use ← → — to steer the paddle, then type your own text and break that too.",

  matrixLabel: "Destructible 5×7 bitmap font matrix",

  /* Networking by default, because this sits on an IT support portfolio and
     a ping to loopback is the first thing anyone types when something is
     broken. Both lines are editable at runtime. */
  defaultLines: ["PING", "127.0.0.1"],
  /* Past this the glyphs get too small to hit on a phone. */
  maxLineLength: 12,
  lives: 3,

  ballsLabel: "Balls",
  launchHint: "Click, tap or press space to launch",
  rasterizeLabel: "Rasterize custom text",
  resetLabel: "Reset the wall",
  lineLabels: ["First line", "Second line"],
  soundOn: "Mute sound",
  soundOff: "Unmute sound",

  clearedLabel: "Cleared — it still ships.",
  lostLabel: "Out of balls. Reset and go again.",
  hint: "Move the paddle with your mouse, the arrow keys, or a finger.",
  srDescription:
    "A decorative brick-breaker game whose wall spells out editable text. Entirely optional — nothing on this page depends on playing it.",
};

/* ------------------------------------------------------------------- chat -- */

/* Copy for the floating assistant. What the bot actually knows is not written
   here: its prompt is generated from the rest of this file in
   src/lib/chatPrompt.ts, so it follows every edit made above. */
export const chat = {
  title: `Ask about ${profile.name}`,
  /** Shown in the panel header and above each of the assistant's messages. */
  name: "JARVIS",
  badge: "AI",
  status: "Online · AI",
  listeningStatus: "Listening…",
  speakingStatus: "Speaking…",
  /** Said out loud the first time the chat is opened. Kept short: it is
      heard, not read. */
  spokenGreeting: `I am Jarvis, ${profile.name}'s assistant. Ask me anything about their work.`,
  youLabel: "You",
  suggestedLabel: "Suggested topics",
  disclaimer: `Replies are generated by Google Gemini from ${profile.name}'s public portfolio. Please don't share personal information.`,

  /* Header controls. */
  stopTalkingLabel: "Stop talking",
  speakerOnLabel: "Turn voice on",
  speakerOffLabel: "Mute voice",
  clearLabel: "Clear conversation",
  minimiseLabel: "Minimise chat",
  endLabel: "Close and end chat",

  /* Voice input. */
  micStartLabel: "Ask by voice",
  micStopLabel: "Stop listening",
  listeningPlaceholder: "Listening… speak now",
  micDeniedLabel:
    "Microphone access was blocked. Allow it in the browser to ask by voice.",

  /** What the robot says in its speech bubble shortly after the page loads. */
  bubble: `Hi! I'm JARVIS, ${profile.name}'s assistant. Tap me and ask anything about their work.`,
  bubbleStatus: "Online · Tap to chat",
  openLabel: "Open chat assistant",
  greeting: `Hi! I'm JARVIS, an AI assistant that can answer questions about ${profile.name}: experience, skills, projects and availability.`,
  suggestions: [
    "Work experience?",
    "IT support skills?",
    "Networking skills?",
    "Projects built?",
    "Available for work?",
  ],
  inputLabel: "Your question",
  placeholder: `Ask about ${profile.name}…`,
  sendLabel: "Send",
  typingLabel: "Typing…",
  errorLabel: "Couldn't get a reply. Please try again.",
  rateLimitedLabel: "Too many messages. Give it a minute and try again.",
};

/* ----------------------------------------------------------------- footer -- */

export const footer = {
  indexLabel: "Index",
  elsewhereLabel: "Elsewhere",
  backToTop: "Back to top ↑",
  rights: "All rights reserved.",
  links: [
    { label: "Email", href: `mailto:${profile.email}` },
    { label: "WhatsApp", href: profile.whatsapp },
    { label: "LinkedIn", href: profile.linkedin },
    { label: "GitHub", href: profile.github },
  ],
};

/* ------------------------------------------------------------- UI chrome -- */

export const ui = {
  skipToContent: "Skip to content",
  menuLabel: "Menu",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  navAriaLabel: "Navigation",
  elsewhereLabel: "Elsewhere",
  talkCta: "Let's talk",
  resumeLabel: "Resume",
  resumeFullStackLabel: "Full Stack Resume",
  portraitMissing: "Portrait missing",
  noImage: "No image",
  themeLabel: "Theme",
  themeToLight: "Switch to light theme",
  themeToDark: "Switch to dark theme",
};
