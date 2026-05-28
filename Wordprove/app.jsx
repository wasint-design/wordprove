/* global React, ReactDOM, ProjectsPage, ReviewPage, SCREENS */
// Wording Review — root app. State, persistence, seed data, routing.

const { useState, useEffect, useCallback } = React;

const STORAGE_KEY = "wording-review/v1";

// ---- seed data ------------------------------------------------------------
// One realistic in-flight review project (with seeded pins), one approved
// historical project, and one ongoing-but-empty project — so the projects
// list reads as a real workspace on first load.
const NOW = Date.now();
const HRS = 3600_000;
const DAYS = 24 * HRS;

const seedProjects = () => [
  {
    id: "proj_addcard_v3",
    name: "Add a card — v3",
    prototypeUrl: "https://www.figma.com/proto/4xN2k8/MuvMi-Payments?node-id=120-450",
    status: "ongoing",
    createdAt: NOW - 6 * DAYS,
    updatedAt: NOW - 2 * HRS,
    pulledAt: NOW - 2 * HRS,
    screenIds: SCREENS.map(s => s.id),
    activeScreenId: "s1",
    pins: [
      {
        id: "pin_1",
        screenId: "s1",
        x: 16, y: 24,
        en: "\"How would you like to pay?\" feels too chatty for a finance flow — try \"Choose a payment method\" to match the rest of the wallet area.",
        th: "",
        resolved: false,
        createdAt: NOW - 5 * DAYS,
      },
      {
        id: "pin_2",
        screenId: "s1",
        x: 78, y: 60,
        en: "",
        th: "คำว่า E-Wallet อาจฟังดูแปลกสำหรับผู้ใช้ไทย ลองเปลี่ยนเป็น \"กระเป๋าเงินดิจิทัล\" ดูครับ ตรงกับที่ธนาคารใช้",
        resolved: false,
        createdAt: NOW - 4 * DAYS - 3 * HRS,
      },
      {
        id: "pin_3",
        screenId: "s2",
        x: 80, y: 52,
        en: "Most Thai banks label this CVV, not CVC. Let's use \"CVV\" everywhere to match what users see on their cards.",
        th: "ใช้คำว่า CVV จะคุ้นเคยกว่า ธนาคารในไทยส่วนใหญ่เรียก CVV",
        resolved: false,
        createdAt: NOW - 3 * DAYS,
      },
      {
        id: "pin_4",
        screenId: "s3",
        x: 50, y: 51,
        en: "\"Nickname\" doesn't translate cleanly. Consider \"Card label\" or just \"Name this card\".",
        th: "",
        resolved: false,
        createdAt: NOW - 1 * DAYS - 4 * HRS,
      },
      {
        id: "pin_5",
        screenId: "s4",
        x: 50, y: 75,
        en: "The ฿1 verification fee disclaimer is good, but \"refunded within 7 business days\" sounds slow. Confirm with finance — is it really 7?",
        th: "ค่าธรรมเนียม ฿1 จะคืนภายใน 7 วันทำการจริงหรือ? ฟังดูนานไปนะ ลองเช็คกับทีมการเงินดู",
        resolved: false,
        createdAt: NOW - 2 * HRS - 18 * 60_000,
      },
      {
        id: "pin_6",
        screenId: "s5",
        x: 50, y: 42,
        en: "\"You're all set\" is cute but inconsistent with the rest of the flow (we use \"Card added\" in confirmation toasts). Let's align.",
        th: "",
        resolved: true,
        createdAt: NOW - 5 * DAYS - 6 * HRS,
      },
    ],
  },
  {
    id: "proj_top_up",
    name: "Wallet top-up flow",
    prototypeUrl: "https://www.figma.com/proto/9hQ1zP/MuvMi-Wallet?node-id=86-2210",
    status: "approved",
    createdAt: NOW - 21 * DAYS,
    updatedAt: NOW - 9 * DAYS,
    pulledAt: NOW - 21 * DAYS,
    screenIds: ["s1", "s4", "s5"],
    activeScreenId: "s1",
    pins: [
      { id: "tp_1", screenId: "s1", x: 50, y: 18, en: "Aligned on \"Top up wallet\" across all entry points.", th: "ใช้ \"เติมเงินกระเป๋า\" ทุกที่", resolved: true, createdAt: NOW - 20 * DAYS },
      { id: "tp_2", screenId: "s4", x: 50, y: 55, en: "Receipt copy approved by finance & legal.", th: "", resolved: true, createdAt: NOW - 12 * DAYS },
    ],
  },
  {
    id: "proj_referral",
    name: "Referral & rewards",
    prototypeUrl: "https://framer.com/share/MuvMi-Referral-flow--abc123",
    status: "ongoing",
    createdAt: NOW - 3 * DAYS,
    updatedAt: NOW - 18 * HRS,
    pulledAt: NOW - 3 * DAYS,
    screenIds: ["s3", "s5"],
    activeScreenId: "s3",
    pins: [
      { id: "rf_1", screenId: "s3", x: 22, y: 30, en: "\"Invite a friend, get a free trip\" — does this break our Pass terms? Check with growth.", th: "", resolved: false, createdAt: NOW - 18 * HRS },
    ],
  },
];

// ---- persistence ----------------------------------------------------------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.projects || !Array.isArray(parsed.projects)) return null;
    return parsed;
  } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ---- App ------------------------------------------------------------------
function App() {
  const [state, setState] = useState(() => {
    const loaded = loadState();
    if (loaded) return loaded;
    return {
      projects: seedProjects(),
      route: { name: "projects" },
      lastUrl: "",
    };
  });

  useEffect(() => { saveState(state); }, [state]);

  const goProjects = () => setState(s => ({ ...s, route: { name: "projects" } }));
  const openProject = (id) => setState(s => ({ ...s, route: { name: "review", projectId: id } }));

  const updateProject = useCallback((next) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === next.id ? next : p),
    }));
  }, []);

  const createProject = ({ name, prototypeUrl }) => {
    const id = `proj_${Date.now().toString(36)}`;

    // Derive a readable screen name from the URL filename
    const getScreenName = (url) => {
      try {
        const file = new URL(url).pathname.split('/').pop().replace(/\.html?$/i, '');
        if (!file) return 'Screen 1';
        return file.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      } catch { return 'Screen 1'; }
    };

    const screenId = `screen_${Date.now().toString(36)}`;
    const proj = {
      id,
      name,
      prototypeUrl,
      status: "ongoing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pulledAt: Date.now(),
      screenIds: [],
      customScreens: [{ id: screenId, name: getScreenName(prototypeUrl), url: prototypeUrl, page: '01' }],
      activeScreenId: screenId,
      pins: [],
    };
    setState(s => ({
      ...s,
      projects: [proj, ...s.projects],
      lastUrl: prototypeUrl,
      route: { name: "review", projectId: id },
    }));
  };

  const deleteProject = (id) => {
    setState(s => ({
      ...s,
      projects: s.projects.filter(p => p.id !== id),
    }));
  };

  const activeProject =
    state.route.name === "review"
      ? state.projects.find(p => p.id === state.route.projectId)
      : null;

  return (
    <div className="app">
      {state.route.name === "projects" && (
        <>
          <ProjectsTopbar />
          <ProjectsPage
            projects={state.projects}
            onOpen={openProject}
            onCreate={createProject}
            onDelete={deleteProject}
          />
        </>
      )}
      {state.route.name === "review" && activeProject && (
        <ReviewPage
          project={activeProject}
          onUpdate={updateProject}
          onBack={goProjects}
        />
      )}
      {state.route.name === "review" && !activeProject && (
        // project was deleted while open — bounce home
        <ProjectGoneFallback onBack={goProjects} />
      )}
    </div>
  );
}

function ProjectsTopbar() {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-mark">WR</span>
        <span className="brand-name">Wording <b>Review</b></span>
      </div>
      <span className="topbar-sep"></span>
      <div className="crumbs"><span className="here">Projects</span></div>
      <span className="topbar-spacer"></span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--c-text-3)" }}>EN · TH</span>
        <span className="topbar-sep"></span>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #0D57E2, #4F8DEF)",
          color: "#fff", display: "grid", placeItems: "center",
          fontWeight: 600, fontSize: 12,
        }}>NK</div>
      </div>
    </div>
  );
}

function ProjectGoneFallback({ onBack }) {
  return (
    <div style={{ padding: 80, textAlign: "center" }}>
      <p>That project no longer exists.</p>
      <button className="btn btn-primary" onClick={onBack}>Back to projects</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
