export default function Sidebar({ page, navigate, notes, audit, chainBlocks, activeThreats, mobileOpen }) {
  const noteCount = Object.keys(notes).length;

  const navGroups = [
    {
      label: "Main",
      items: [
        { id: "dashboard", icon: "⬛", label: "Dashboard" },
        { id: "create",    icon: "✏️",  label: "Create Note" },
        { id: "notes",     icon: "📋", label: "My Notes", badge: noteCount > 0 ? noteCount : null },
      ]
    },
    {
      label: "Security",
      items: [
        {
          id: "threats", icon: "🤖", label: "AI Threats",
          badge: activeThreats > 0 ? activeThreats : null,
          badgeColor: activeThreats > 0 ? "#ef4444" : null,
          pulse: activeThreats > 0,
        },
        { id: "blockchain", icon: "⛓", label: "Blockchain", badge: chainBlocks > 0 ? chainBlocks : null, highlight: true },
        { id: "audit",      icon: "📜", label: "Audit Log",  badge: audit.length > 50 ? "50+" : null },
        { id: "security",   icon: "🛡️", label: "Security Info" },
      ]
    },
    {
      label: "Config",
      items: [
        { id: "settings", icon: "⚙️", label: "Settings" },
      ]
    }
  ];

  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sb-brand">
        <div className="sb-logo">
          <div className="sb-logo-icon">🔐</div>
          <div>
            <div className="sb-logo-text">Secret<span>Vault</span></div>
            <div className="sb-version">v2.0 · Capstone Edition</div>
          </div>
        </div>
      </div>

      <nav className="sb-nav">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="sb-section">{group.label}</div>
            {group.items.map(item => (
              <div
                key={item.id}
                className={`sb-item ${page === item.id ? "active" : ""}`}
                onClick={() => navigate(item.id)}
                style={item.highlight && page !== item.id ? { color: "var(--c5)" } : {}}
              >
                <span className="icon" style={{ position: "relative" }}>
                  {item.icon}
                  {item.pulse && (
                    <span style={{
                      position: "absolute", top: -2, right: -2, width: 6, height: 6,
                      borderRadius: "50%", background: "#ef4444",
                      animation: "pulse 1.5s infinite"
                    }} />
                  )}
                </span>
                {item.label}
                {item.badge != null && (
                  <span className="badge-nav" style={item.badgeColor ? { background: item.badgeColor } : item.highlight ? { background: "var(--c5)" } : {}}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-status">
          <span className="sb-dot" style={activeThreats > 0 ? { background: "#ef4444", boxShadow: "0 0 6px #ef4444" } : {}} />
          {activeThreats > 0 ? `${activeThreats} Active Threat${activeThreats > 1 ? "s" : ""}` : "E2E Encrypted · AI Protected"}
        </div>
      </div>
    </aside>
  );
}
