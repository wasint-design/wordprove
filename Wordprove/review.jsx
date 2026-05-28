/* global React, SCREENS, Pin, GhostPin, Composer, UKFlag, THFlag, StatusPill, formatRelative, hostOf */
// Review page — 3-column workspace: screens rail, phone canvas, notes thread.

const { useState: useStateR, useEffect: useEffectR, useMemo: useMemoR, useRef: useRefR } = React;

function ReviewPage({ project, onUpdate, onBack }) {
  const firstScreenId = project.activeScreenId
    || (project.screenIds || [])[0]
    || (project.customScreens || [])[0]?.id;

  const [activeScreenId, setActiveScreenId] = useStateR(firstScreenId);
  const [draft, setDraft] = useStateR(null);
  const [editingPinId, setEditingPinId] = useStateR(null);
  const [langFilter, setLangFilter] = useStateR("both");
  const [scopeFilter, setScopeFilter] = useStateR("all");

  // Detected heights for URL-based screens { [screenId]: number }
  const [screenHeights, setScreenHeights] = useStateR({});
  const iframeRefs = useRefR({});

  // ---- unified screen list -----------------------------------------------
  const allScreens = useMemoR(() => {
    const mockScreens = (project.screenIds || [])
      .map(sid => SCREENS.find(s => s.id === sid))
      .filter(Boolean);
    const customScreens = project.customScreens || [];
    return [...mockScreens, ...customScreens];
  }, [project.screenIds, project.customScreens]);

  const screenById = useMemoR(
    () => Object.fromEntries(allScreens.map(s => [s.id, s])),
    [allScreens]
  );

  // ---- pins helpers -------------------------------------------------------
  const allPins = project.pins || [];
  const screenPins = useMemoR(
    () => allPins.filter(p => p.screenId === activeScreenId),
    [allPins, activeScreenId]
  );

  const numberMap = useMemoR(() => {
    const sorted = [...allPins].sort((a, b) => a.createdAt - b.createdAt);
    const map = {};
    sorted.forEach((p, i) => { map[p.id] = i + 1; });
    return map;
  }, [allPins]);

  // ---- height detection --------------------------------------------------
  // Returns the content height for a screen (detected or default 760).
  const getScreenHeight = (screenId) => screenHeights[screenId] || 760;

  // Called when an iframe finishes loading — try same-origin read first.
  const handleIframeLoad = (screenId, iframe) => {
    try {
      const h = iframe.contentDocument.documentElement.scrollHeight
             || iframe.contentDocument.body.scrollHeight;
      if (h > 100) {
        setScreenHeights(prev => ({ ...prev, [screenId]: Math.ceil(h) }));
      }
    } catch (_) {
      // Cross-origin — height will come via postMessage if the page supports it.
    }
  };

  // Listen for postMessage from iframe pages.
  // Pages that want auto-fit can add this one liner:
  //   <script>new ResizeObserver(()=>parent.postMessage({type:'wr-resize',height:document.body.scrollHeight},'*')).observe(document.body)</script>
  useEffectR(() => {
    const onMsg = (e) => {
      if (e.data?.type !== 'wr-resize' || !e.data?.height) return;
      // Match the message source to one of our iframes.
      const screen = allScreens.find(s => {
        const el = iframeRefs.current[s.id];
        return el && el.contentWindow === e.source;
      });
      if (screen) {
        setScreenHeights(prev => ({ ...prev, [screen.id]: Math.ceil(e.data.height) }));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [allScreens]);

  // ---- Esc closes composer -----------------------------------------------
  useEffectR(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setDraft(null); setEditingPinId(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- mutations ---------------------------------------------------------
  const persistPins = (nextPins) => {
    onUpdate({ ...project, pins: nextPins, updatedAt: Date.now() });
  };

  const handleSavePin = ({ en, th }) => {
    if (!en && !th) return;
    if (draft) {
      persistPins([...allPins, {
        id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        screenId: draft.screenId, x: draft.x, y: draft.y,
        en, th, resolved: false, createdAt: Date.now(),
      }]);
      setDraft(null);
    } else if (editingPinId) {
      persistPins(allPins.map(p => p.id === editingPinId ? { ...p, en, th } : p));
      setEditingPinId(null);
    }
  };

  const handleDeletePin = () => {
    if (editingPinId) {
      persistPins(allPins.filter(p => p.id !== editingPinId));
      setEditingPinId(null);
    }
    setDraft(null);
  };

  const handleToggleResolved = () => {
    if (editingPinId) {
      persistPins(allPins.map(p => p.id === editingPinId ? { ...p, resolved: !p.resolved } : p));
    }
  };

  const handleCanvasClick = (e) => {
    if (draft || editingPinId) { setDraft(null); setEditingPinId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x < 2 || x > 98 || y < 2 || y > 98) return;
    setDraft({ screenId: activeScreenId, x, y });
    setEditingPinId(null);
  };

  const handlePinClick = (pinId) => {
    setDraft(null);
    setEditingPinId(pinId);
  };

  const editingPin = editingPinId ? allPins.find(p => p.id === editingPinId) : null;

  const filteredNotes = useMemoR(() => {
    let arr = [...allPins].sort((a, b) => b.createdAt - a.createdAt);
    if (scopeFilter === "screen") arr = arr.filter(p => p.screenId === activeScreenId);
    if (langFilter === "en") arr = arr.filter(p => p.en);
    if (langFilter === "th") arr = arr.filter(p => p.th);
    return arr;
  }, [allPins, langFilter, scopeFilter, activeScreenId]);

  const cycleStatus = () => {
    const order = ["ongoing", "approved"];
    const idx = order.indexOf(project.status);
    const next = order[(idx + 1) % order.length] || "ongoing";
    onUpdate({ ...project, status: next, updatedAt: Date.now() });
  };

  // ---- screen content renderer ------------------------------------------
  const renderScreenContent = (screen) => {
    if (!screen) return null;
    if (screen.url) {
      const h = getScreenHeight(screen.id);
      return (
        <iframe
          key={screen.url}
          ref={el => { if (el) iframeRefs.current[screen.id] = el; }}
          src={screen.url}
          style={{ width: 390, height: h, border: 'none', display: 'block', pointerEvents: 'none' }}
          onLoad={(e) => handleIframeLoad(screen.id, e.target)}
          title={screen.name}
          tabIndex={-1}
        />
      );
    }
    const C = screen.Component;
    return C ? <C /> : null;
  };

  const currentScreen = screenById[activeScreenId];
  const isUrlScreen = Boolean(currentScreen?.url);
  const canvasH = isUrlScreen ? getScreenHeight(activeScreenId) : 760;
  const frameH = canvasH + 20; // used only for mock phone frame (padding 10+10)

  // Shared overlay + pin layer rendered inside whichever container is active
  const pinLayer = (
    <>
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'crosshair' }}
        onClick={handleCanvasClick}
      />
      {screenPins.map(p => (
        <Pin
          key={p.id}
          number={numberMap[p.id]}
          x={p.x} y={p.y}
          resolved={p.resolved}
          active={editingPinId === p.id}
          onClick={() => handlePinClick(p.id)}
        />
      ))}
      {draft && draft.screenId === activeScreenId && (
        <GhostPin x={draft.x} y={draft.y} />
      )}
      {draft && draft.screenId === activeScreenId && (
        <Composer
          pin={{ number: allPins.length + 1, x: draft.x, y: draft.y, en: "", th: "", resolved: false, isDraft: true }}
          containerW={isUrlScreen ? 390 : 390}
          containerH={canvasH}
          onSave={handleSavePin}
          onCancel={() => setDraft(null)}
          onDelete={handleDeletePin}
          onToggleResolved={handleToggleResolved}
        />
      )}
      {editingPin && editingPin.screenId === activeScreenId && (
        <Composer
          pin={{ number: numberMap[editingPin.id], x: editingPin.x, y: editingPin.y, en: editingPin.en, th: editingPin.th, resolved: editingPin.resolved, isDraft: false }}
          containerW={390}
          containerH={canvasH}
          onSave={handleSavePin}
          onCancel={() => setEditingPinId(null)}
          onDelete={handleDeletePin}
          onToggleResolved={handleToggleResolved}
        />
      )}
    </>
  );

  return (
    <>
      <ReviewTopbar project={project} onBack={onBack} onCycleStatus={cycleStatus} />
      <div className="review-shell">

        {/* LEFT: SCREENS RAIL */}
        <aside className="screens-rail">
          <div className="rail-head">
            <h3>Screens <span className="count">{allScreens.length}</span></h3>
            <div className="pulled">
              <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Pulled {formatRelative(project.pulledAt || project.createdAt)}
            </div>
          </div>
          <div className="screens-list">
            {allScreens.map(screen => {
              const sid = screen.id;
              const pinsOnScreen = allPins.filter(p => p.screenId === sid);
              const open = pinsOnScreen.filter(p => !p.resolved).length;
              const resolved = pinsOnScreen.filter(p => p.resolved).length;
              return (
                <div
                  key={sid}
                  className={`screen-row${activeScreenId === sid ? " active" : ""}`}
                  onClick={() => setActiveScreenId(sid)}
                >
                  <div className="screen-thumb-wrap">
                    {screen.url ? (
                      <iframe
                        key={screen.url}
                        src={screen.url}
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: 390, height: getScreenHeight(sid),
                          border: 'none',
                          transformOrigin: 'top left',
                          transform: `scale(${44 / 390})`,
                          pointerEvents: 'none',
                        }}
                        title={screen.name}
                        tabIndex={-1}
                      />
                    ) : (
                      <div className="screen-thumb-inner" style={{ transform: `scale(${44 / 390})` }}>
                        {(() => { const C = screen.Component; return C ? <C /> : null; })()}
                      </div>
                    )}
                    {pinsOnScreen.map(p => (
                      <span
                        key={p.id}
                        className={`screen-pin-dot${p.resolved ? " resolved" : ""}`}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      />
                    ))}
                  </div>
                  <div className="screen-meta">
                    <span className="screen-idx">{screen.page}</span>
                    <span className="screen-name">{screen.name}</span>
                    <div className="screen-pin-badges">
                      {pinsOnScreen.length === 0 ? (
                        <span className="pin-badge empty">No comments</span>
                      ) : (
                        <>
                          {open > 0 && (
                            <span className="pin-badge">
                              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              {open}
                            </span>
                          )}
                          {resolved > 0 && (
                            <span className="pin-badge resolved">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              {resolved}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER: CANVAS */}
        <main className="canvas-area">
          <div className="canvas-scroll">
            {isUrlScreen ? (
              /* URL-based screen — no phone chrome, just the raw page */
              <div className="full-page-canvas" style={{ height: canvasH }}>
                {renderScreenContent(currentScreen)}
                {pinLayer}
              </div>
            ) : (
              /* Mock component screen — wrapped in decorative phone frame */
              <div className="phone-frame" style={{ height: frameH }}>
                <div className="phone-screen" style={{ height: canvasH }}>
                  {renderScreenContent(currentScreen)}
                  {pinLayer}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT: NOTES RAIL */}
        <aside className="notes-rail">
          <div className="notes-head">
            <h3>Comments <span className="count">{filteredNotes.length}{scopeFilter === "screen" && allPins.length !== filteredNotes.length ? ` / ${allPins.length}` : ""}</span></h3>
            <div className="scope-tabs">
              <button className={`scope-tab${scopeFilter === "all" ? " active" : ""}`} onClick={() => setScopeFilter("all")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                All pages
                <span className="scope-count">{allPins.length}</span>
              </button>
              <button className={`scope-tab${scopeFilter === "screen" ? " active" : ""}`} onClick={() => setScopeFilter("screen")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2.5"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
                This page
                <span className="scope-count">{allPins.filter(p => p.screenId === activeScreenId).length}</span>
              </button>
            </div>
            <div className="lang-tabs">
              <button className={`lang-tab${langFilter === "both" ? " active" : ""}`} onClick={() => setLangFilter("both")}>Both</button>
              <button className={`lang-tab${langFilter === "en" ? " active" : ""}`} onClick={() => setLangFilter("en")}><UKFlag /> EN</button>
              <button className={`lang-tab${langFilter === "th" ? " active" : ""}`} onClick={() => setLangFilter("th")}><THFlag /> TH</button>
            </div>
          </div>
          <div className="notes-list">
            {filteredNotes.length === 0 ? (
              <div className="empty-notes">
                <div className="empty-notes-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p>No comments yet</p>
                <p>Click on the screen to drop your first pin.</p>
              </div>
            ) : filteredNotes.map(p => (
              <NoteCard
                key={p.id}
                pin={p}
                number={numberMap[p.id]}
                screenName={screenById[p.screenId]?.name || "—"}
                active={editingPinId === p.id}
                onOpen={() => { setActiveScreenId(p.screenId); setEditingPinId(p.id); setDraft(null); }}
                onResolve={() => onUpdate({ ...project, pins: allPins.map(x => x.id === p.id ? { ...x, resolved: !x.resolved } : x), updatedAt: Date.now() })}
                onDelete={() => onUpdate({ ...project, pins: allPins.filter(x => x.id !== p.id), updatedAt: Date.now() })}
              />
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function ReviewTopbar({ project, onBack, onCycleStatus }) {
  return (
    <div className="topbar">
      <div className="brand" onClick={onBack}>
        <span className="brand-mark">WR</span>
        <span className="brand-name">Wording <b>Review</b></span>
      </div>
      <span className="topbar-sep"></span>
      <div className="crumbs">
        <span className="crumb-link" onClick={onBack}>Projects</span>
        <span className="sep">/</span>
        <span className="here">{project.name}</span>
      </div>
      <span className="topbar-spacer"></span>
      <div className="url-field" style={{ minWidth: 320, maxWidth: 420 }}>
        <svg className="link-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <input value={project.prototypeUrl} readOnly />
        <button className="btn btn-ghost" title="Re-pull screenshots">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>
          Re-pull
        </button>
      </div>
      <span className="topbar-sep"></span>
      <button onClick={onCycleStatus} title="Cycle status" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}>
        <StatusPill status={project.status} />
      </button>
    </div>
  );
}

function NoteCard({ pin, number, screenName, active, onOpen, onResolve, onDelete }) {
  const showEn = pin.en && pin.en.trim().length > 0;
  const showTh = pin.th && pin.th.trim().length > 0;
  return (
    <div
      className={`note-card${pin.resolved ? " resolved" : ""}${active ? " active" : ""}`}
      onClick={onOpen}
    >
      <div className="note-head">
        <span className="note-pin-num">{number}</span>
        <span className="note-screen">{screenName}</span>
        <span className="note-time">{formatRelative(pin.createdAt)}</span>
      </div>
      {showEn && (
        <>
          <div className="note-body-lang"><UKFlag /> EN</div>
          <p className="note-body">{pin.en}</p>
        </>
      )}
      {showEn && showTh && <div className="note-divider"></div>}
      {showTh && (
        <>
          <div className="note-body-lang"><THFlag /> TH</div>
          <p className="note-body th">{pin.th}</p>
        </>
      )}
      <div className="note-actions" onClick={e => e.stopPropagation()}>
        <button className="note-action success" onClick={onResolve}>
          {pin.resolved ? (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><polyline points="3 4 3 10 9 10"/></svg>Reopen</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Resolve</>
          )}
        </button>
        <button className="note-action danger" onClick={onDelete}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
          Delete
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ReviewPage });
