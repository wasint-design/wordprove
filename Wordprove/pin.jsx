/* global React */
// Pin component — teardrop-shaped numbered marker on the canvas.

function Pin({ number, x, y, resolved, active, onClick }) {
  return (
    <div
      className={`pin${resolved ? " resolved" : ""}${active ? " active" : ""}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
    >
      <div className="pin-shape">
        <div className="pin-inner">{number}</div>
        <div className="pin-tail"></div>
      </div>
    </div>
  );
}

function GhostPin({ x, y }) {
  return (
    <div className="pin-ghost" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="pin-shape">
        <div className="pin-inner">+</div>
        <div className="pin-tail"></div>
      </div>
    </div>
  );
}

Object.assign(window, { Pin, GhostPin });
