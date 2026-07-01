/* ===========================================================
   templates.js — the four ATS-safe single-column templates
   cssClass -> preview.css skin; role -> suggested-skills dict;
   iconStyle -> brand icons render in colour or solid black.
   =========================================================== */
window.RF = window.RF || {};

RF.templates = [
  {
    key: "software",
    name: "Software Engineering",
    desc: "The classic Overleaf single-column layout (your uploaded default).",
    cssClass: "tpl-classic",
    accent: "#1a4ed8",
    role: "software",
    iconStyle: "mono"
  },
  {
    key: "uiux",
    name: "UI/UX Design",
    desc: "Sans-serif, accent section rules, portfolio-forward.",
    cssClass: "tpl-modern",
    accent: "#2f6df6",
    role: "uiux",
    iconStyle: "color"
  },
  {
    key: "graphic",
    name: "Graphic Design",
    desc: "Bold uppercase headline, strong accent - still 100% text.",
    cssClass: "tpl-creative",
    accent: "#c0392b",
    role: "graphic",
    iconStyle: "color"
  },
  {
    key: "academic",
    name: "Researcher / Academic",
    desc: "Serif, justified, publications-first CV style.",
    cssClass: "tpl-academic",
    accent: "#0f766e",
    role: "academic",
    iconStyle: "color"
  }
];

RF.getTemplate = (key) => RF.templates.find(t => t.key === key) || RF.templates[0];
