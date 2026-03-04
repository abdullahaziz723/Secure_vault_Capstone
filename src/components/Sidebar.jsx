// ═══════════════════════════════════════════════════════════════════
// Sidebar.jsx — Navigation Sidebar
// ═══════════════════════════════════════════════════════════════════

export default function Sidebar({ page, navigate, notes, audit, chainBlocks, mobileOpen }) {
  const noteCount = Object.keys(notes).length;

  const navItems = [
    { id: "dashboard",  icon: "⬛", label: "Dashboard",      section: "main" },
    { id: "create",     icon: "✏️",  label: "Create Note",    section: "main" },
    { id: "notes",      icon: "📋", label: "My Notes",        section: "main", badge: noteCount > 0 ? noteCount : null },
    { id: "blockchain", icon: "⛓",  label: "Blockchain",      section: "security", badge: chainBlocks > 0 ? chainBlocks : null, highlight: true },
    { id: "audit",      icon: "📜", label: "Audit Log",       section: "security", badge: audit.length > 50 ? "50+" : null },
    { id: "security",   icon: "🛡️",  label: "Security Info",  section: "security" },
    { id: "settings",   icon: "⚙️",  label: "Settings",       section: "config" },
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-logo">
          <div className="sb-logo-icon">🔐</div>
          <div>
            <div className="sb-logo-text">
              Secret<span>Vault</span>
            </div>
            <div className="sb-version">v2.0 · Capstone Edition</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sb-nav">
        <div className="sb-section">Main</div>
        {navItems.filter(i => i.section === "main").map((item) => (
          <div key={item.id} className={`sb-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
            <span className="icon">{item.icon}</span>
            {item.label}
            {item.badge != null && <span className="badge-nav">{item.badge}</span>}
          </div>
        ))}

        <div className="sb-section">Security</div>
        {navItems.filter(i => i.section === "security").map((item) => (
          <div
            key={item.id}
            className={`sb-item ${page === item.id ? "active" : ""}`}
            onClick={() => navigate(item.id)}
            style={item.highlight && page !== item.id ? { borderColor: "rgba(168,85,247,.3)", color: "var(--c5)" } : {}}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
            {item.badge != null && (
              <span className="badge-nav" style={item.highlight ? { background: "var(--c5)" } : {}}>{item.badge}</span>
            )}
          </div>
        ))}

        <div className="sb-section">Config</div>
        {navItems.filter(i => i.section === "config").map((item) => (
          <div key={item.id} className={`sb-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-status">
          <span className="sb-dot" />
          E2E Encrypted · Blockchain Ledger
        </div>
      </div>
    </aside>
  );
}
