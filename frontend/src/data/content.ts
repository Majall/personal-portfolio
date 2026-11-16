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
  { name: "Experience", href: "#experience", id: "experience" },
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

  /** The role, split so the last word can take the italic serif. */
  roleLead: "IT Support",
  roleAccent: "Engineer",

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

  ghostWord: "About",
  resumeLabel: "Download résumé",
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
    role: "Full Stack Developer Intern",
    company: "Witsberry (Pvt) Ltd",
    type: "On-site · Full-time internship",
    dates: "September 2025 – November 2026",
    points: [
      "Diagnosed and resolved technical faults across applications, servers and databases, from first report to verified resolution.",
      "Investigated and debugged system problems, finding root causes and applying fixes that improved reliability and reduced recurring incidents.",
      "Queried and maintained SQL and NoSQL databases, protecting data integrity and resolving data issues raised by users and colleagues.",
      "Supported deployment, configuration and troubleshooting across Linux and cloud-hosted servers.",
      "Used Git and GitHub for version control and change tracking in a professional team.",
      "Wrote technical notes and documentation that supported troubleshooting and knowledge sharing.",
      "Worked on-site with the team, communicating findings clearly in English with minimal supervision.",
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

export interface SkillGroup {
  key: string;
  label: string;
  note: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    key: "networking",
    label: "Networking",
    note: "Addressing, switching, routing and services",
    items: [
      "TCP/IP",
      "IPv4/IPv6",
      "Subnetting",
      "VLSM",
      "VLANs",
      "Switching",
      "Routing",
      "DNS",
      "DHCP",
      "NAT",
      "ACLs",
      "Wi-Fi",
      "Cisco IOS",
      "Packet Tracer",
    ],
  },
  {
    key: "systems",
    label: "Systems",
    note: "Operating systems, accounts and automation",
    items: [
      "Windows",
      "Linux",
      "PowerShell",
      "Bash",
      "User account management",
      "Docker",
    ],
  },
  {
    key: "data-dev",
    label: "Data & Dev",
    note: "Databases, languages and version control",
    items: [
      "SQL",
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Python",
      "Laravel",
      "React",
      "Node.js",
      "Git",
      "GitHub",
    ],
  },
];

export const skillsSection = {
  label: "Technical skills",
  note: "Grouped by discipline.",
};

/** Flat list for the scrolling tech strip below the hero. */
export const techStrip: string[] = skillGroups.flatMap((group) => group.items);

/* The strip renders one marquee row per group, alternating direction. Each
   row is its own discipline, so the rows stay legible as categories rather
   than becoming one undifferentiated scroll of words. */
export const stackSection = {
  label: "The stack",
  note: "Everything I work with day to day.",
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
  index: "06",
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
  tagline: "Break it if you can. It still ships.",
  /** Spelled out in bricks on a dot-matrix grid. */
  word: ["HELLO", "WORLD"],
  playLabel: "Play",
  restartLabel: "Restart",
  clearedLabel: "Cleared — it still ships.",
  lostLabel: "Dropped it. Try again.",
  hint: "Move the paddle with your mouse, the arrow keys, or a finger.",
  srDescription:
    "A decorative brick-breaker game spelling HELLO WORLD. Entirely optional — nothing on this page depends on playing it.",
};

/* ------------------------------------------------------------------- chat -- */

/* Copy for the floating assistant. What the bot actually knows is not written
   here: its prompt is generated from the rest of this file in
   src/lib/chatPrompt.ts, so it follows every edit made above. */
export const chat = {
  title: `Ask about ${profile.name}`,
  subtitle: "AI assistant · Online",
  /** What the robot says in its speech bubble shortly after the page loads. */
  bubble: `Hi! I'm ${profile.name}'s assistant. Tap me and ask anything about their work.`,
  bubbleStatus: "Online · Tap to chat",
  openLabel: "Open chat assistant",
  closeLabel: "Close chat assistant",
  greeting: `Hi! I'm an AI assistant that can answer questions about ${profile.name}: experience, skills, projects and availability.`,
  suggestions: [
    "What experience does Majall have?",
    "Which networking skills?",
    "What projects have they built?",
    "Is Majall available for work?",
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
  portraitMissing: "Portrait missing",
  noImage: "No image",
  themeLabel: "Theme",
  themeToLight: "Switch to light theme",
  themeToDark: "Switch to dark theme",
};
