/* global React, GhostPin */
// Composer popover — opens beside a pin. Two tabs (EN/TH), each with its own
// textarea. Save (⌘↵), Cancel (Esc), Delete, Resolve/Reopen.

const { useState, useEffect, useRef, useMemo } = React;

const UKFlag = () => <span className="flag-swatch uk" aria-hidden></span>;
const THFlag = () => <span className="flag-swatch th" aria-hidden></span>;

function Composer({
  pin, // { number, x, y, en, th, resolved, isDraft }
  side,  // 'left' | 'right' — which side of pin the popover sits
  containerW = 390, // actual container width in px (for positioning)
  containerH = 760, // actual container height in px (for clamping)
  onSave,
  onCancel,
  onDelete,
  onToggleResolved,
}) {
  const [activeTab, setActiveTab] = useState(() => (pin.th && !pin.en ? "th" : "en"));
  const [en, setEn] = useState(pin.en || "");
  const [th, setTh] = useState(pin.th || "");
  const enRef = useRef(null);
  const thRef = useRef(null);

  // Position the composer next to the pin, expressed in absolute px inside the canvas container.
  // pin x/y are percentages of containerW x containerH.
  const COMP_W = 340;
  const px = (pin.x / 100) * containerW;
  const py = (pin.y / 100) * containerH;

  // Compute side automatically if not provided
  const chosenSide = side || (px < containerW * 0.55 ? "right" : "left");
  const offsetX = chosenSide === "right" ? px + 22 : px - COMP_W - 22;
  // clamp top so composer stays in view
  const composerTop = Math.max(40, Math.min(py - 24, containerH - 280));

  // Autofocus appropriate textarea on tab change
  useEffect(() => {
    const r = activeTab === "en" ? enRef : thRef;
    if (r.current) {
      r.current.focus();
      const len = r.current.value.length;
      r.current.setSelectionRange(len, len);
    }
  }, [activeTab]);

  // ⌘↵ / Ctrl↵ to save, Esc to cancel
  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      doSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const doSave = () => {
    onSave({ en: en.trim(), th: th.trim() });
  };

  const canSave = en.trim().length > 0 || th.trim().length > 0;

  return (
    <div
      className="composer"
      style={{ left: offsetX, top: composerTop }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleKey}
    >
      <span className={`composer-arrow ${chosenSide === "right" ? "left" : "right"}`}></span>

      <div className="composer-tabs">
        <button
          className={`composer-tab${activeTab === "en" ? " active" : ""}`}
          onClick={() => setActiveTab("en")}
        >
          <UKFlag /> EN
          {en.trim().length > 0 && <span className="has-content" title="Has content" />}
        </button>
        <button
          className={`composer-tab${activeTab === "th" ? " active" : ""}`}
          onClick={() => setActiveTab("th")}
        >
          <THFlag /> TH
          {th.trim().length > 0 && <span className="has-content" title="Has content" />}
        </button>
      </div>

      <div className="composer-body">
        {activeTab === "en" ? (
          <textarea
            ref={enRef}
            className="composer-textarea"
            placeholder="Suggest a wording change in English…"
            value={en}
            onChange={(e) => setEn(e.target.value)}
          />
        ) : (
          <textarea
            ref={thRef}
            className="composer-textarea th"
            placeholder="เสนอการแก้ไขถ้อยคำเป็นภาษาไทย…"
            value={th}
            onChange={(e) => setTh(e.target.value)}
          />
        )}
      </div>

      <div className="composer-meta">
        <span className="pin-num">#{pin.number}</span>
        <span className="dot"></span>
        <span>{pin.isDraft ? "New comment" : "Editing"}</span>
        {pin.resolved && (<><span className="dot"></span><span style={{ color: "var(--c-success)" }}>Resolved</span></>)}
      </div>

      <div className="composer-foot">
        <div className="composer-foot-left">
          {!pin.isDraft && (
            <button className="btn btn-sm btn-danger" onClick={onDelete} title="Delete comment">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete
            </button>
          )}
          {!pin.isDraft && (
            <button className={`btn btn-sm ${pin.resolved ? "btn-ghost" : "btn-success"}`} onClick={onToggleResolved}>
              {pin.resolved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><polyline points="3 4 3 10 9 10"/></svg>
                  Reopen
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Resolve
                </>
              )}
            </button>
          )}
        </div>
        <div className="composer-foot-right">
          <button className="btn btn-sm btn-ghost" onClick={onCancel}>
            Cancel <span className="kbd">Esc</span>
          </button>
          <button className="btn btn-sm btn-primary" disabled={!canSave} onClick={doSave}>
            Save <span className="kbd">⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Composer, UKFlag, THFlag });
