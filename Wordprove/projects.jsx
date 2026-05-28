/* global React, ChevronRight, InfoIcon */
// Projects landing page — lists all projects, status pills, filters,
// stats summary, empty state, and the "New project" modal that simulates
// pulling screenshots from a prototype URL.

const { useState: useStateP, useEffect: useEffectP, useMemo: useMemoP, useRef: useRefP } = React;

function formatRelative(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return new Date(ts).toLocaleDateString();
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function ProjectsPage({ projects, onOpen, onCreate, onDelete }) {
  const [filter, setFilter] = useStateP("all"); // all | ongoing | approved
  const [showModal, setShowModal] = useStateP(false);

  const counts = useMemoP(() => ({
    all: projects.length,
    ongoing: projects.filter(p => p.status === "ongoing").length,
    approved: projects.filter(p => p.status === "approved").length,
  }), [projects]);

  const totalComments = useMemoP(() =>
    projects.reduce((acc, p) => acc + (p.pins?.length || 0), 0), [projects]);
  const totalScreens = useMemoP(() =>
    projects.reduce((acc, p) => acc + (p.screenIds?.length || 0) + (p.customScreens?.length || 0), 0), [projects]);

  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1 className="projects-title">Projects</h1>
          <p className="projects-sub">Review the wording in every prototype, side by side, in two languages.</p>
        </div>
        <div className="projects-actions">
          <div className="projects-filters">
            {[
              { id: "all", label: "All", count: counts.all },
              { id: "ongoing", label: "Ongoing", count: counts.ongoing },
              { id: "approved", label: "Approved", count: counts.approved },
            ].map(t => (
              <button
                key={t.id}
                className={`filter-tab${filter === t.id ? " active" : ""}`}
                onClick={() => setFilter(t.id)}
              >
                {t.label}<span className="count">{t.count}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New project
          </button>
        </div>
      </div>

      <div className="projects-stats">
        <div className="stat">
          <span className="stat-num">{counts.all}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat">
          <span className="stat-num">{totalScreens}</span>
          <span className="stat-label">Screens pulled</span>
        </div>
        <div className="stat">
          <span className="stat-num">{totalComments}</span>
          <span className="stat-label">Comments left</span>
        </div>
        <div className="stat">
          <span className="stat-num" style={{ color: "var(--c-success)" }}>{counts.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState onCreate={() => setShowModal(true)} hasAny={projects.length > 0} filter={filter} />
      ) : (
        <div className="projects-list">
          <div className="projects-list-head">
            <span>Project</span>
            <span>Screens</span>
            <span>Comments</span>
            <span>Status</span>
            <span>Last updated</span>
            <span></span>
          </div>
          {filtered.map(p => (
            <ProjectRow key={p.id} project={p} onOpen={() => onOpen(p.id)} onDelete={() => onDelete(p.id)} />
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onCancel={() => setShowModal(false)}
          onCreate={(p) => { setShowModal(false); onCreate(p); }}
        />
      )}
    </div>
  );
}

function ProjectRow({ project, onOpen, onDelete }) {
  const [menuOpen, setMenuOpen] = useStateP(false);
  const pinCount = project.pins?.length || 0;
  const unresolved = project.pins?.filter(p => !p.resolved).length || 0;

  return (
    <div className="project-row" onClick={onOpen}>
      <div className="proj-name-cell">
        <div className="proj-thumb">
          <div className="proj-thumb-stack">
            <span /><span /><span />
          </div>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="proj-name">{project.name}</p>
          <p className="proj-url">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span className="host">{hostOf(project.prototypeUrl)}</span>
          </p>
        </div>
      </div>
      <div className="proj-meta">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        {(project.screenIds?.length || 0) + (project.customScreens?.length || 0)}
      </div>
      <div className="proj-meta">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {pinCount}{unresolved > 0 && pinCount !== unresolved && (
          <span style={{ color: "var(--c-text-3)", fontSize: 12 }}>·{unresolved} open</span>
        )}
      </div>
      <div>
        <StatusPill status={project.status} />
      </div>
      <div className="proj-meta" style={{ fontSize: 12, color: "var(--c-text-3)" }}>
        {formatRelative(project.updatedAt)}
      </div>
      <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
        <button className="row-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="More">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>
        </button>
        {menuOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
            <div style={{
              position: "absolute", right: 0, top: 32,
              minWidth: 160,
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-s)",
              boxShadow: "var(--shadow-2)",
              padding: 4,
              zIndex: 41,
            }}>
              <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", height: 32, fontSize: 12 }} onClick={() => { setMenuOpen(false); onOpen(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Open
              </button>
              <button className="btn btn-danger" style={{ width: "100%", justifyContent: "flex-start", height: 32, fontSize: 12 }} onClick={() => { setMenuOpen(false); onDelete(); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
                Delete project
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  if (status === "approved") return <span className="status-pill status-approved"><span className="dot"></span>Approved</span>;
  if (status === "ongoing") return <span className="status-pill status-ongoing"><span className="dot"></span>Ongoing</span>;
  return <span className="status-pill status-draft"><span className="dot"></span>Draft</span>;
}

function EmptyState({ onCreate, hasAny, filter }) {
  if (hasAny) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h3>No {filter} projects</h3>
        <p>Try switching the filter, or start a new review.</p>
      </div>
    );
  }
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div>
      <h3>No reviews yet</h3>
      <p>Drop in a Figma, Framer, or Adobe XD link and pull screenshots to start commenting.</p>
      <button className="btn btn-primary" onClick={onCreate}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New project
      </button>
    </div>
  );
}

// --- Modal: paste prototype URL, simulate pulling screens -------------------
function NewProjectModal({ onCancel, onCreate }) {
  const [name, setName] = useStateP("");
  const [url, setUrl] = useStateP("");
  const [step, setStep] = useStateP("idle"); // idle | pulling | done
  const [progress, setProgress] = useStateP({ msg: "", count: 0 });
  const cancelRef = useRefP(false);
  const inputRef = useRefP(null);

  useEffectP(() => {
    inputRef.current && inputRef.current.focus();
    const onKey = (e) => { if (e.key === "Escape" && step !== "pulling") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onCancel]);

  const sample = "https://www.figma.com/proto/abc123/MuvMi-Add-card-flow";

  const startPull = async () => {
    if (!url.trim()) return;
    setStep("pulling");
    cancelRef.current = false;
    const steps = [
      { msg: "Authenticating with Figma…", delay: 500 },
      { msg: "Reading prototype tree…",    delay: 600 },
      { msg: "Capturing screen 1 of 5…",   delay: 380 },
      { msg: "Capturing screen 2 of 5…",   delay: 360 },
      { msg: "Capturing screen 3 of 5…",   delay: 360 },
      { msg: "Capturing screen 4 of 5…",   delay: 360 },
      { msg: "Capturing screen 5 of 5…",   delay: 360 },
      { msg: "Indexing copy strings…",     delay: 450 },
    ];
    for (let i = 0; i < steps.length; i++) {
      if (cancelRef.current) return;
      setProgress({ msg: steps[i].msg, count: i });
      await new Promise(r => setTimeout(r, steps[i].delay));
    }
    setStep("done");
    setProgress({ msg: "Pulled 5 screens.", count: steps.length });
    setTimeout(() => {
      onCreate({
        name: name.trim() || "Untitled review",
        prototypeUrl: url.trim() || sample,
      });
    }, 350);
  };

  return (
    <div className="modal-scrim" onClick={() => step !== "pulling" && onCancel()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>New review</h2>
          <p>Paste a prototype link. We'll pull the latest frames and you can start commenting.</p>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">Project name</label>
            <input
              ref={inputRef}
              className="field-input"
              placeholder="e.g. Add a card flow — v2"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={step === "pulling"}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Prototype URL</label>
            <input
              className="field-input"
              placeholder={sample}
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={step === "pulling"}
            />
            <p className="field-hint">Figma, Framer, Adobe XD, or any public prototype link.</p>
          </div>

          {step === "pulling" && (
            <div className="pull-progress">
              <div className="spinner" />
              <div style={{ flex: 1 }}>
                <div className="step-name">{progress.msg}</div>
                <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "var(--c-accent-soft-2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--c-accent)", width: `${(progress.count / 8) * 100}%`, transition: "width 220ms ease" }} />
                </div>
              </div>
            </div>
          )}
          {step === "done" && (
            <div className="pull-progress" style={{ background: "var(--c-success-soft)", color: "var(--c-success)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontWeight: 500, color: "var(--c-success)" }}>{progress.msg} Opening review…</span>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={step === "pulling"}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={startPull}
            disabled={step === "pulling" || step === "done" || !url.trim()}
          >
            {step === "pulling" ? "Pulling…" : "Pull screenshots"}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProjectsPage, StatusPill, formatRelative, hostOf });
