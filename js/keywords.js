/* ===========================================================
   keywords.js — predefined keyword dictionaries
   Every list is a *suggestion* set; a Custom input always lets
   the user type anything not in the list.
   =========================================================== */
window.RF = window.RF || {};

RF.keywords = {

  /* Spoken languages (for the Languages section) */
  spokenLanguages: [
    "English — Native", "English — Fluent", "Hindi — Native", "Hindi — Fluent",
    "Spanish — Intermediate", "French — Intermediate", "German — Intermediate",
    "Mandarin — Basic", "Arabic — Basic", "Bengali — Native", "Tamil — Native",
    "Telugu — Native", "Marathi — Fluent", "Japanese — Basic", "Portuguese — Intermediate"
  ],

  /* Degrees (datalist for education) */
  degrees: [
    "B.Tech in Computer Science", "B.E. in Electronics & Communication",
    "B.Sc in Computer Science", "Bachelor of Arts", "Bachelor of Business Administration",
    "Bachelor of Design (B.Des)", "Bachelor of Fine Arts (BFA)",
    "B.Com", "M.Tech", "M.Sc", "Master of Business Administration (MBA)",
    "Master of Design (M.Des)", "Master of Science in Computer Science",
    "Master of Fine Arts (MFA)", "Ph.D in Computer Science", "Ph.D",
    "Associate's in Liberal Arts", "Diploma in UI/UX Design"
  ],

  /* Common job titles (datalist for experience) */
  jobTitles: [
    "Software Engineer", "Senior Software Engineer", "Full Stack Developer",
    "Frontend Developer", "Backend Developer", "Mobile App Developer",
    "Data Scientist", "Data Analyst", "Machine Learning Engineer", "DevOps Engineer",
    "UI/UX Designer", "Product Designer", "UX Researcher", "Interaction Designer",
    "Graphic Designer", "Visual Designer", "Brand Designer", "Art Director",
    "Research Assistant", "Research Scientist", "Postdoctoral Researcher",
    "Product Manager", "Project Coordinator", "Business Analyst", "Intern",
    "Teaching Assistant", "Marketing Specialist"
  ],

  /* Suggested skill keywords per template/role. Used in the editor
     (suggest chips under Skills) and in the right-panel "suggested keywords". */
  skillsByRole: {
    software: {
      "Languages": ["Java", "Python", "JavaScript", "TypeScript", "C++", "Go", "SQL", "Kotlin", "Swift"],
      "Frameworks": ["React", "Node.js", "Spring Boot", "Django", "Flask", "Express", "Next.js", "FastAPI"],
      "Tools & Cloud": ["Git", "Docker", "Kubernetes", "AWS", "GCP", "CI/CD", "Jenkins", "Terraform"],
      "Concepts": ["REST APIs", "Microservices", "Data Structures", "System Design", "Unit Testing", "Agile"]
    },
    uiux: {
      "Design": ["User Research", "Wireframing", "Prototyping", "Interaction Design", "Usability Testing",
                 "Design Systems", "Information Architecture", "Accessibility (WCAG)"],
      "Tools": ["Figma", "Sketch", "Adobe XD", "Framer", "Miro", "Maze", "Zeplin", "Principle"],
      "Methods": ["Design Thinking", "Heuristic Evaluation", "A/B Testing", "User Personas", "Journey Mapping"]
    },
    graphic: {
      "Software": ["Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "After Effects",
                   "Figma", "CorelDRAW", "Canva", "Procreate"],
      "Skills": ["Brand Identity", "Typography", "Layout Design", "Logo Design", "Packaging Design",
                 "Motion Graphics", "Print Design", "Color Theory", "Illustration"]
    },
    academic: {
      "Research": ["Quantitative Analysis", "Qualitative Research", "Statistical Modeling",
                   "Experimental Design", "Literature Review", "Data Visualization", "Grant Writing"],
      "Tools": ["Python", "R", "MATLAB", "SPSS", "LaTeX", "Stata", "NVivo", "Tableau"],
      "Domains": ["Machine Learning", "NLP", "Computational Biology", "Econometrics", "HCI"]
    }
  },

  /* Master keyword set for JD matching (union of role skills + common ATS terms).
     Built lazily in init(). */
  master: [],

  /* Strong action verbs to start bullet points (ATS + recruiter friendly) */
  actionVerbs: [
    "led","built","developed","designed","implemented","created","launched","managed",
    "improved","increased","reduced","optimized","automated","architected","delivered",
    "drove","spearheaded","engineered","analyzed","researched","collaborated","mentored",
    "shipped","scaled","streamlined","established","coordinated","produced","published",
    "founded","initiated","executed","owned","migrated","redesigned","accelerated"
  ],

  stopwords: new Set(("a an the and or but of to in on for with at by from as is are be been being this that these " +
    "those you your our we their they it its will would can could should may might must have has had do does did " +
    "not no yes if then else when while who whom which what where why how all any each more most other some such " +
    "than too very just about into over under again further once here there work working role team experience " +
    "responsible responsibilities including include etc using use used able strong excellent good great plus " +
    "ability years year months month required preferred must-have nice required").split(/\s+/))
};

/* build master dictionary */
(function buildMaster(){
  const set = new Set();
  Object.values(RF.keywords.skillsByRole).forEach(groups => {
    Object.values(groups).forEach(arr => arr.forEach(k => set.add(k)));
  });
  // common cross-role ATS keywords
  ["Communication","Leadership","Problem Solving","Teamwork","Time Management","Stakeholder Management",
   "Project Management","Data Analysis","Agile","Scrum","Roadmap","KPIs","SEO","Content Strategy",
   "Analytics","Excel","PowerPoint","Tableau","Power BI","Jira","Confluence","Notion","Slack",
   "Cross-functional","Mentoring","Strategy","Budgeting","Reporting","Automation","API","Cloud"
  ].forEach(k => set.add(k));
  RF.keywords.master = Array.from(set);
})();
