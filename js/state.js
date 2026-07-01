/* ===========================================================
   state.js — data model, sample data per profile, persistence
   =========================================================== */
window.RF = window.RF || {};

RF.uid = () => "s" + Math.random().toString(36).slice(2, 9);

/* Section type registry: drives both editor and renderer (data-driven). */
RF.SECTION_TYPES = {
  summary:        { label: "Summary / Objective", shape: "text" },
  experience:     { label: "Work Experience",     shape: "entries" },
  education:      { label: "Education",            shape: "education" },
  projects:       { label: "Projects",            shape: "projects" },
  skills:         { label: "Skills",              shape: "skills" },
  publications:   { label: "Publications",        shape: "list" },
  certifications: { label: "Certifications",       shape: "list" },
  awards:         { label: "Awards & Honors",      shape: "list" },
  languages:      { label: "Languages",            shape: "list" },
  custom:         { label: "Custom (with entries)", shape: "custom" },
  customList:     { label: "Custom (bullet list)",  shape: "list" }
};

/* ---------- builders ---------- */
const _exp = (title, org, location, start, end, bullets) =>
  ({ id: RF.uid(), title, org, location, start, end, bullets });
const _edu = (degree, school, location, start, end, bullets=[]) =>
  ({ id: RF.uid(), degree, school, location, start, end, bullets });
const _proj = (name, tech, start, end, bullets) =>
  ({ id: RF.uid(), name, tech, start, end, bullets });

/* ================= SAMPLE DATA ================= */
RF.samples = {

  /* EXPERIENCED — faithful to the uploaded Overleaf "Jake Ryan" template */
  experienced: () => ({
    meta: { template: "software", type: "experienced", pageSize: "A4", zoom: 1 },
    basics: {
      name: "Jake Ryan",
      headline: "Software Engineer",
      phone: "123-456-7890",
      email: "jake@su.edu",
      location: "Georgetown, TX",
      links: [
        { label: "linkedin.com/in/jake", url: "https://linkedin.com/in/jake" },
        { label: "github.com/jake", url: "https://github.com/jake" }
      ]
    },
    sections: [
      { id: RF.uid(), type: "summary", title: "Summary", text:
        "Software engineer with a CS background and hands-on experience building full-stack web applications and REST APIs. Comfortable across the stack with React, Python and PostgreSQL, and shipping production code in collaborative, fast-moving teams." },
      { id: RF.uid(), type: "education", title: "Education", entries: [
        _edu("Bachelor of Arts in Computer Science, Minor in Business", "Southwestern University", "Georgetown, TX", "Aug. 2018", "May 2021"),
        _edu("Associate's in Liberal Arts", "Blinn College", "Bryan, TX", "Aug. 2014", "May 2018")
      ]},
      { id: RF.uid(), type: "experience", title: "Experience", entries: [
        _exp("Undergraduate Research Assistant", "Texas A&M University", "College Station, TX", "June 2020", "Present", [
          "Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems",
          "Developed a full-stack web application using Flask, React, PostgreSQL and Docker to analyze GitHub data",
          "Explored ways to visualize GitHub collaboration in a classroom setting"
        ]),
        _exp("Information Technology Support Specialist", "Southwestern University", "Georgetown, TX", "Sep. 2018", "Present", [
          "Communicate with managers to set up campus computers used on campus",
          "Assess and troubleshoot computer problems brought by students, faculty and staff",
          "Maintain upkeep of computers, classroom equipment, and 200 printers across campus"
        ]),
        _exp("Artificial Intelligence Research Assistant", "Southwestern University", "Georgetown, TX", "May 2019", "July 2019", [
          "Explored methods to generate video game dungeons based off of The Legend of Zelda",
          "Developed a game in Java to test the generated dungeons",
          "Contributed 50K+ lines of code to an established codebase via Git",
          "Wrote an 8-page paper and gave multiple presentations on campus"
        ])
      ]},
      { id: RF.uid(), type: "projects", title: "Projects", entries: [
        _proj("Gitlytics", "Python, Flask, React, PostgreSQL, Docker", "June 2020", "Present", [
          "Developed a full-stack web application with Flask serving a REST API and React as the frontend",
          "Implemented GitHub OAuth to get data from user's repositories",
          "Used Celery and Redis for asynchronous tasks"
        ]),
        _proj("Simple Paintball", "Spigot API, Java, Maven, TravisCI, Git", "May 2018", "May 2020", [
          "Developed a Minecraft server plugin and published it, gaining 2K+ downloads and a 4.5/5 review",
          "Implemented continuous delivery using TravisCI to build the plugin upon each release"
        ])
      ]},
      { id: RF.uid(), type: "skills", title: "Technical Skills", groups: [
        { label: "Languages", items: ["Java","Python","C/C++","SQL (Postgres)","JavaScript","HTML/CSS","R"] },
        { label: "Frameworks", items: ["React","Node.js","Flask","JUnit","FastAPI","Material-UI"] },
        { label: "Developer Tools", items: ["Git","Docker","Google Cloud Platform","VS Code","IntelliJ"] },
        { label: "Libraries", items: ["pandas","NumPy","Matplotlib"] }
      ]}
    ]
  }),

  /* FRESHER — recent graduate, education-forward, projects + internships */
  fresher: () => ({
    meta: { template: "software", type: "fresher", pageSize: "A4", zoom: 1 },
    basics: {
      name: "Aarav Sharma",
      headline: "Computer Science Graduate · Aspiring Software Engineer",
      phone: "+91 98765 43210",
      email: "aarav.sharma@email.com",
      location: "Bengaluru, India",
      links: [
        { label: "linkedin.com/in/aaravsharma", url: "https://linkedin.com/in/aaravsharma" },
        { label: "github.com/aarav", url: "https://github.com/aarav" }
      ]
    },
    sections: [
      { id: RF.uid(), type: "summary", title: "Objective", text:
        "Final-year Computer Science student seeking a software engineering role where I can apply strong fundamentals in data structures, web development and problem solving. Built 5+ academic and personal projects and solved 300+ DSA problems." },
      { id: RF.uid(), type: "education", title: "Education", entries: [
        _edu("B.Tech in Computer Science", "RV College of Engineering", "Bengaluru, India", "2021", "2025", [
          "CGPA: 8.7/10 · Relevant coursework: Data Structures, DBMS, Operating Systems, Computer Networks"
        ])
      ]},
      { id: RF.uid(), type: "projects", title: "Projects", entries: [
        _proj("StudyBuddy — Collaborative Notes App", "React, Node.js, MongoDB", "2024", "2024", [
          "Built a real-time notes-sharing app used by 200+ classmates with live editing via WebSockets",
          "Reduced page load time by 40% through code-splitting and lazy loading"
        ]),
        _proj("ML Expense Tracker", "Python, scikit-learn, Flask", "2023", "2024", [
          "Trained a model that auto-categorizes expenses with 92% accuracy across 8 categories",
          "Exposed predictions through a Flask REST API consumed by a React dashboard"
        ])
      ]},
      { id: RF.uid(), type: "experience", title: "Internship", entries: [
        _exp("Software Engineering Intern", "TechNova Solutions", "Remote", "May 2024", "July 2024", [
          "Implemented 12 reusable React components, cutting new-feature build time by ~25%",
          "Wrote unit tests raising module coverage from 60% to 85%"
        ])
      ]},
      { id: RF.uid(), type: "skills", title: "Technical Skills", groups: [
        { label: "Languages", items: ["Java","Python","JavaScript","C++","SQL"] },
        { label: "Frameworks", items: ["React","Node.js","Express","Flask"] },
        { label: "Tools", items: ["Git","Docker","Postman","VS Code"] }
      ]},
      { id: RF.uid(), type: "awards", title: "Achievements", items: [
        "Winner — Smart India Hackathon 2024 (team of 6)",
        "Solved 300+ problems on LeetCode (Knight badge)"
      ]}
    ]
  }),

  /* STUDY ABROAD — education-forward, test scores, research, SOP-style summary */
  studyabroad: () => ({
    meta: { template: "academic", type: "studyabroad", pageSize: "A4", zoom: 1 },
    basics: {
      name: "Priya Menon",
      headline: "MS in Computer Science Applicant — Fall 2026",
      phone: "+91 91234 56789",
      email: "priya.menon@email.com",
      location: "Chennai, India",
      links: [
        { label: "linkedin.com/in/priyamenon", url: "https://linkedin.com/in/priyamenon" },
        { label: "Google Scholar", url: "https://scholar.google.com" }
      ]
    },
    sections: [
      { id: RF.uid(), type: "summary", title: "Statement of Purpose", text:
        "Computer Science graduate with research experience in machine learning and NLP, seeking an MS to specialise in trustworthy AI. Co-authored 2 peer-reviewed papers and aim to pursue research at the intersection of language models and human-computer interaction." },
      { id: RF.uid(), type: "education", title: "Education", entries: [
        _edu("B.E. in Computer Science (GPA: 9.1/10)", "Anna University", "Chennai, India", "2020", "2024", [
          "Thesis: Low-resource language translation using transformer architectures"
        ])
      ]},
      { id: RF.uid(), type: "custom", title: "Research Experience", entries: [
        { id: RF.uid(), title: "Research Intern", subtitle: "AI4Bharat Lab, IIT Madras", location: "Chennai, India", start: "2023", end: "2024", bullets: [
          "Built a multilingual NLP pipeline covering 4 Indian languages, improving BLEU score by 6 points",
          "Co-authored a paper accepted at a workshop on low-resource NLP"
        ]}
      ]},
      { id: RF.uid(), type: "publications", title: "Publications", items: [
        "Menon, P., Rao, S. (2024). Low-resource translation with adapter tuning. Workshop on NLP for Indian Languages.",
        "Menon, P., et al. (2023). Bias evaluation in multilingual embeddings. Student Research Symposium."
      ]},
      { id: RF.uid(), type: "skills", title: "Technical Skills", groups: [
        { label: "Languages", items: ["Python","C++","R"] },
        { label: "ML / Research", items: ["PyTorch","TensorFlow","Hugging Face","scikit-learn","LaTeX"] }
      ]},
      { id: RF.uid(), type: "customList", title: "Test Scores", items: [
        "GRE: 327 (Q: 169, V: 158, AWA: 4.5)",
        "TOEFL iBT: 112 / 120",
        "IELTS: 8.0 / 9.0"
      ]},
      { id: RF.uid(), type: "languages", title: "Languages", items: [
        "English — Fluent", "Tamil — Native", "Hindi — Intermediate", "German — Basic (A2)"
      ]}
    ]
  })
};

/* ================= live state ================= */
RF.state = null;
const RF_STORE_KEY = "resumeforge.v1";

RF.loadSample = function (type) {
  RF.state = RF.samples[type] ? RF.samples[type]() : RF.samples.experienced();
};

RF.save = function () {
  try { localStorage.setItem(RF_STORE_KEY, JSON.stringify(RF.state)); } catch (e) {}
};

RF.restore = function () {
  try {
    const raw = localStorage.getItem(RF_STORE_KEY);
    if (raw) { RF.state = JSON.parse(raw); return true; }
  } catch (e) {}
  return false;
};

RF.findSection = (id) => RF.state.sections.find(s => s.id === id);
