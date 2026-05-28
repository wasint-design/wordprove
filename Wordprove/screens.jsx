/* global React */
// Mock mobile screens for the MuvMi "Add a card" payment flow.
// All screens render inside a 390x760 phone viewport.

const Icon = ({ d, size = 20, stroke = 2, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const ChevronLeft = (p) => <Icon size={p.size || 20} d={<polyline points="15 18 9 12 15 6" />} />;
const ChevronRight = (p) => <Icon size={p.size || 16} d={<polyline points="9 18 15 12 9 6" />} />;
const InfoIcon = (p) => <Icon size={p.size || 14} d={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />;

const StatusBar = () => (
  <div className="phone-status-bar">
    <span>9:41</span>
    <span className="phone-status-icons">
      <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4" y="5" width="3" height="6" rx="0.5"/><rect x="8" y="3" width="3" height="8" rx="0.5"/><rect x="12" y="0" width="3" height="11" rx="0.5"/></svg>
      <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="18" height="10" rx="2"/><rect x="2" y="2" width="15" height="7" rx="1" fill="currentColor"/><rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor"/></svg>
    </span>
  </div>
);

// --- Screen 1: Choose payment method ----------------------------------------
const ScreenChoosePayment = () => (
  <div className="ps">
    <StatusBar />
    <div className="ps-back"><ChevronLeft size={20} /></div>
    <h1>How would you like to pay?</h1>
    <p className="ps-sub">Pick a payment method to add. You can change this anytime in Wallet.</p>

    <div className="pay-tile selected">
      <div className="pay-tile-ico card">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="pay-tile-name">Credit or debit card</p>
        <p className="pay-tile-desc">Visa, Mastercard, JCB · Most popular</p>
      </div>
      <span className="pay-tile-chevron"><ChevronRight /></span>
    </div>

    <div className="pay-tile">
      <div className="pay-tile-ico bank">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 8 22 8 12 2" /><line x1="4" y1="8" x2="4" y2="20"/><line x1="9" y1="8" x2="9" y2="20"/><line x1="15" y1="8" x2="15" y2="20"/><line x1="20" y1="8" x2="20" y2="20"/><line x1="1" y1="22" x2="23" y2="22"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="pay-tile-name">Bank account (PromptPay)</p>
        <p className="pay-tile-desc">SCB, KBank, BBL and 8 more</p>
      </div>
      <span className="pay-tile-chevron"><ChevronRight /></span>
    </div>

    <div className="pay-tile">
      <div className="pay-tile-ico wallet">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="pay-tile-name">E-Wallet</p>
        <p className="pay-tile-desc">TrueMoney, Rabbit LINE Pay, ShopeePay</p>
      </div>
      <span className="pay-tile-chevron"><ChevronRight /></span>
    </div>

    <div className="disclaimer">
      <InfoIcon />
      <span>We'll only charge you when you confirm a trip. No fees for adding a payment method.</span>
    </div>
  </div>
);

// --- Screen 2: Enter card details -------------------------------------------
const ScreenCardDetails = () => (
  <div className="ps">
    <StatusBar />
    <div className="ps-back"><ChevronLeft size={20} /></div>
    <h1>Add your card</h1>
    <p className="ps-sub">We'll keep this safe with 256-bit encryption. Only the last 4 digits are visible to drivers.</p>

    <div className="ps-field">
      <div className="ps-field-label">Card number</div>
      <div className="ps-field-input">
        <span className="placeholder">1234 5678 9012 3456</span>
        <svg width="28" height="20" viewBox="0 0 36 24" fill="none"><rect width="36" height="24" rx="3" fill="#1A1F71"/><text x="18" y="16" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Poppins">VISA</text></svg>
      </div>
    </div>

    <div className="ps-field-row">
      <div className="ps-field">
        <div className="ps-field-label">Expiry</div>
        <div className="ps-field-input"><span className="placeholder">MM / YY</span></div>
      </div>
      <div className="ps-field">
        <div className="ps-field-label">CVC</div>
        <div className="ps-field-input">
          <span className="placeholder">123</span>
          <InfoIcon size={16} />
        </div>
      </div>
    </div>

    <div className="ps-field">
      <div className="ps-field-label">Cardholder name</div>
      <div className="ps-field-input"><span className="placeholder">As printed on card</span></div>
    </div>

    <div className="disclaimer" style={{ marginTop: 14 }}>
      <InfoIcon />
      <span>By continuing you agree to our card terms. Saved cards can be removed anytime.</span>
    </div>

    <div className="ps-cta">Continue</div>
  </div>
);

// --- Screen 3: Nickname ------------------------------------------------------
const ScreenNickname = () => (
  <div className="ps">
    <StatusBar />
    <div className="ps-back"><ChevronLeft size={20} /></div>

    <div className="virtual-card">
      <div className="vc-brand">MuvMi</div>
      <div className="vc-chip"></div>
      <div className="vc-number">•••• •••• •••• 4242</div>
      <div className="vc-foot">
        <div>
          <div className="vc-name" style={{ marginBottom: 4 }}>Cardholder</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>SOMSAK J.</div>
        </div>
        <div className="vc-logo"></div>
      </div>
    </div>

    <h1>Give your card a nickname</h1>
    <p className="ps-sub">This helps you tell cards apart at checkout. You can change it anytime.</p>

    <div className="ps-field">
      <div className="ps-field-label">Nickname</div>
      <div className="ps-field-input"><span style={{ color: "#161618" }}>My everyday card</span></div>
    </div>

    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {["Everyday", "Trips", "Work", "Personal"].map(t => (
        <span key={t} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 999, background: "#F4F4F8", color: "#5A5A62", fontWeight: 500 }}>{t}</span>
      ))}
    </div>

    <div style={{ flex: 1 }} />
    <div className="ps-cta">Save card</div>
  </div>
);

// --- Screen 4: Review & confirm ---------------------------------------------
const ScreenReview = () => (
  <div className="ps">
    <StatusBar />
    <div className="ps-back"><ChevronLeft size={20} /></div>
    <h1>Review & confirm</h1>
    <p className="ps-sub">Please double-check your details before we add the card to your wallet.</p>

    <div style={{ background: "#F9F9FB", borderRadius: 14, padding: "4px 16px", marginBottom: 18 }}>
      <div className="summary-row">
        <span className="lbl">Card</span>
        <span className="val">Visa •••• 4242</span>
      </div>
      <div className="summary-row">
        <span className="lbl">Nickname</span>
        <span className="val">My everyday card</span>
      </div>
      <div className="summary-row">
        <span className="lbl">Cardholder</span>
        <span className="val">Somsak J.</span>
      </div>
      <div className="summary-row">
        <span className="lbl">Expiry</span>
        <span className="val">08 / 28</span>
      </div>
    </div>

    <div className="disclaimer" style={{ marginTop: 0, marginBottom: 14 }}>
      <InfoIcon />
      <span>Your bank may charge a small verification fee of ฿1. This will be refunded within 7 business days.</span>
    </div>

    <div style={{ flex: 1 }} />
    <div className="ps-cta">Confirm and add card</div>
  </div>
);

// --- Screen 5: Success -------------------------------------------------------
const ScreenSuccess = () => (
  <div className="ps success-screen">
    <StatusBar />
    <div className="success-check">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h1>You're all set</h1>
    <p className="ps-sub">Your card is ready to ride. We've sent a confirmation to your email.</p>

    <div style={{ width: "100%", marginTop: 20 }}>
      <div className="ps-cta">Book a trip</div>
      <div className="ps-cta secondary" style={{ marginTop: 10 }}>Back to wallet</div>
    </div>
  </div>
);

const SCREENS = [
  { id: "s1", name: "Choose payment method", page: "01", Component: ScreenChoosePayment },
  { id: "s2", name: "Enter card details",   page: "02", Component: ScreenCardDetails },
  { id: "s3", name: "Give your card a nickname", page: "03", Component: ScreenNickname },
  { id: "s4", name: "Review & confirm",      page: "04", Component: ScreenReview },
  { id: "s5", name: "You're all set",        page: "05", Component: ScreenSuccess },
];

Object.assign(window, { SCREENS, ChevronLeft, ChevronRight, InfoIcon, Icon });
