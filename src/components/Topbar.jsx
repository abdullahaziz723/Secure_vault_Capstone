// ═══════════════════════════════════════════════════════════════════
// Topbar.jsx — Sticky Top Navigation Bar
// ═══════════════════════════════════════════════════════════════════

const PAGE_META = {
  dashboard:  { title: "Dashboard",     subtitle: "Welcome to SecureVault" },
  create:     { title: "Create Note",   subtitle: "Compose an encrypted secret" },
  notes:      { title: "My Notes",      subtitle: "Manage your active notes" },
  blockchain: { title: "Blockchain",    subtitle: "Immutable tamper-evident audit ledger" },
  audit:      { title: "Audit Log",     subtitle: "System event history" },
  security:   { title: "Security Info", subtitle: "Cryptographic implementation details" },
  settings:   { title: "Settings",      subtitle: "Configure your preferences" },
  view:       { title: "View Note",     subtitle: "Encrypted message recipient" },
};

export default function Topbar({ page, navigate, onMenuToggle }) {
  const meta = PAGE_META[page] || PAGE_META.dashboard;
  // Split title at first space to colorize first word
  const [first, ...rest] = meta.title.split(" ");

  return (
    <div className="topbar">
      <button className="mobile-menu-btn" onClick={onMenuToggle}>
        ☰
      </button>

      <div className="topbar-title">
        <span className="text-c1">{first}</span>
        {rest.length > 0 && ` ${rest.join(" ")}`}
        <div className="topbar-subtitle">{meta.subtitle}</div>
      </div>

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate("create")}
      >
        + New Note
      </button>
    </div>
  );
}
