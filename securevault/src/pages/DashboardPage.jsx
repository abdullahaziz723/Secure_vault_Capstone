// ═══════════════════════════════════════════════════════════════════
// DashboardPage.jsx — Main overview page
// ═══════════════════════════════════════════════════════════════════

import AuditEntry from "../components/AuditEntry";

export default function DashboardPage({ notes, audit, navigate, chainBlocks, threatStats }) {
  const allNotes = Object.values(notes);
  const total       = allNotes.length;
  const active      = allNotes.filter((n) => !(n.expiresAt && Date.now() > n.expiresAt) && !(n.viewed && n.oneTime)).length;
  const destroyed   = allNotes.filter((n) => n.viewed && n.oneTime).length;
  const pwProtected = allNotes.filter((n) => n.hasPassword).length;
  const expired     = allNotes.filter((n) => n.expiresAt && Date.now() > n.expiresAt).length;

  // Activity chart – last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label    = d.toLocaleDateString("en", { weekday: "short" });
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    const count    = audit.filter((a) => a.ts >= dayStart.getTime() && a.ts <= dayEnd.getTime()).length;
    return { label, count };
  });
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        {[
          { val: total,        label: "Total Notes",     color: "var(--c1)", icon: "📊" },
          { val: active,       label: "Active Notes",    color: "var(--c2)", icon: "✅" },
          { val: destroyed,    label: "Self-Destructed", color: "var(--c3)", icon: "💣" },
          { val: pwProtected,  label: "PW Protected",    color: "var(--c5)", icon: "🔑" },
          { val: chainBlocks || 0, label: "Chain Blocks", color: "#f59e0b",  icon: "⛓", onClick: () => navigate("blockchain") },
          { val: threatStats?.activeThreats || 0, label: "Active Threats", color: threatStats?.activeThreats > 0 ? "#ef4444" : "var(--c2)", icon: "🤖", onClick: () => navigate("threats") },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={s.onClick ? { cursor: "pointer" } : {}} onClick={s.onClick}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
              <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-2">
        {/* Activity chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 Activity — Last 7 Days</span>
            <span className="badge badge-cyan">{audit.length} events</span>
          </div>
          <div className="card-body">
            <div className="chart-bar-wrap">
              {days.map((d, i) => (
                <div
                  key={i}
                  className="chart-bar"
                  style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: 4 }}
                >
                  <div className="cb-tip">{d.count} events</div>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {days.map((d, i) => (
                <div key={i} className="chart-label">{d.label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Security overview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔒 Security Overview</span>
          </div>
          <div className="card-body">
            {[
              { label: "Encryption",     val: "AES-256-GCM",             ok: true },
              { label: "Key Derivation", val: "PBKDF2 / 310K iter",      ok: true },
              { label: "Self-Destruct",  val: active > 0 ? "Active" : "No notes", ok: true },
              { label: "Expired Notes",  val: expired,                   ok: expired === 0 },
            ].map((r) => (
              <div
                key={r.label}
                style={{ display: "flex", justifyContent: "space-between", padding: ".55rem 0", borderBottom: "1px solid rgba(26,37,53,.6)", fontSize: ".78rem" }}
              >
                <span style={{ color: "var(--muted)" }}>{r.label}</span>
                <span className={r.ok ? "text-c2" : "text-c4"}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent audit entries */}
      <div className="card mb-2">
        <div className="card-header">
          <span className="card-title">📜 Recent Activity</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("audit")}>
            View all
          </button>
        </div>
        <div style={{ padding: "0 1.5rem" }}>
          {audit.slice(0, 5).length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📋</span>
              <div className="empty-title">No activity yet</div>
              <div className="empty-text">Events will appear here</div>
            </div>
          ) : (
            audit.slice(0, 5).map((e) => <AuditEntry key={e.id} entry={e} />)
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header"><span className="card-title">🚀 Quick Actions</span></div>
        <div className="card-body">
          <div className="grid-3">
            {[
              { icon: "✏️", label: "Create Secret Note",  desc: "Compose and encrypt a new message",      action: () => navigate("create"),   color: "var(--c1)" },
              { icon: "📋", label: "Manage Notes",         desc: "View and control your active notes",     action: () => navigate("notes"),    color: "var(--c2)" },
              { icon: "🛡️", label: "Security Details",    desc: "Learn about our encryption methods",     action: () => navigate("security"), color: "var(--c5)" },
            ].map((q) => (
              <div
                key={q.label}
                onClick={q.action}
                style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "1.125rem", cursor: "pointer", transition: "border-color .2s, transform .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.transform = ""; }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>{q.icon}</div>
                <div style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: ".85rem", marginBottom: ".3rem" }}>{q.label}</div>
                <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{q.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
