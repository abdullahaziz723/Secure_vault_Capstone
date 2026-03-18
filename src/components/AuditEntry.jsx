// ═══════════════════════════════════════════════════════════════════
// AuditEntry.jsx — Single Audit Log Row
// Shared between DashboardPage and AuditPage
// ═══════════════════════════════════════════════════════════════════

const ICONS   = { create: "➕", view: "👁", delete: "🗑", fail: "⚠️" };
const CLASSES = { create: "create", view: "view", delete: "delete", fail: "fail" };

/**
 * @param {{ entry: import('../utils/store').AuditEntry }} props
 */
export default function AuditEntry({ entry }) {
  return (
    <div className="audit-entry">
      <div className={`audit-icon ${CLASSES[entry.type] || "create"}`}>
        {ICONS[entry.type] || "📋"}
      </div>
      <div className="audit-body">
        <div className="audit-title">{entry.action}</div>
        <div className="audit-meta">
          <span>{new Date(entry.ts).toLocaleString()}</span>
          {entry.noteId && (
            <span>
              ID: <code style={{ color: "var(--c1)" }}>{entry.noteId}</code>
            </span>
          )}
          {entry.tags?.length > 0 && (
            <span>{entry.tags.map((t) => `#${t}`).join(" ")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
