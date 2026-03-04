// ═══════════════════════════════════════════════════════════════════
// AuditPage.jsx — Full Audit Log with filter stats
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import AuditEntry from "../components/AuditEntry";
import { clearAudit } from "../utils/store";

export default function AuditPage({ audit }) {
  const [filter, setFilter] = useState("all");

  const filtered = audit.filter((e) => filter === "all" || e.type === filter);

  const counts = audit.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  const handleClear = () => {
    if (window.confirm("Clear the entire audit log? This action cannot be undone.")) {
      clearAudit();
      window.location.reload();
    }
  };

  return (
    <div className="fade-in">
      {/* Filter stat cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Created",         val: counts.create || 0, color: "var(--c1)", type: "create" },
          { label: "Viewed",          val: counts.view   || 0, color: "var(--c2)", type: "view"   },
          { label: "Deleted",         val: counts.delete || 0, color: "var(--c3)", type: "delete" },
          { label: "Failed attempts", val: counts.fail   || 0, color: "var(--c4)", type: "fail"   },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ cursor: "pointer", borderColor: filter === s.type ? s.color : "" }}
            onClick={() => setFilter(filter === s.type ? "all" : s.type)}
          >
            <div className="stat-val" style={{ color: s.color, fontSize: "1.5rem" }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">📜 Event Log</span>
          <div className="flex gap-1">
            <span className="badge badge-cyan">{filtered.length} events</span>
            <button className="btn btn-danger btn-sm" onClick={handleClear}>Clear log</button>
          </div>
        </div>
        <div style={{ padding: "0 1.5rem" }}>
          {filtered.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📜</span>
              <div className="empty-title">No events</div>
              <div className="empty-text">System activity will appear here</div>
            </div>
          ) : (
            filtered.map((e) => <AuditEntry key={e.id} entry={e} />)
          )}
        </div>
      </div>
    </div>
  );
}
