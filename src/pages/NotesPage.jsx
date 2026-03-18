// ═══════════════════════════════════════════════════════════════════
// NotesPage.jsx — Notes Manager
// Filter, search, sort, copy link, delete notes
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { deleteNote, addAudit } from "../utils/store";
import { recordTransaction } from "../utils/blockchain";

function getStatus(n) {
  if (n.viewed && n.oneTime) return { label: "Destroyed", cls: "badge-red",  stripColor: "var(--muted)" };
  if (n.expiresAt && Date.now() > n.expiresAt) return { label: "Expired", cls: "badge-warn", stripColor: "var(--c3)" };
  return { label: "Active", cls: "badge-green", stripColor: "var(--c1)" };
}

export default function NotesPage({ notes, refreshNotes, refreshChain }) {
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState("newest");
  const [deleteModal, setDeleteModal] = useState(null);
  const [copiedId, setCopiedId]     = useState(null);

  const all = Object.entries(notes).map(([id, n]) => ({ id, ...n }));

  const filtered = all
    .filter((n) => {
      if (filter === "active")    return !(n.expiresAt && Date.now() > n.expiresAt) && !(n.viewed && n.oneTime);
      if (filter === "expired")   return n.expiresAt && Date.now() > n.expiresAt;
      if (filter === "destroyed") return n.viewed && n.oneTime;
      return true;
    })
    .filter((n) =>
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.tags?.some((t) => t.includes(search.toLowerCase()))
    )
    .sort((a, b) => sortBy === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  const handleDelete = (id) => {
    deleteNote(id);
    addAudit({ type: "delete", action: "Note manually deleted", noteId: id.slice(0, 8) });
    recordTransaction("NOTE_DELETED", id.slice(0, 8), "Note manually deleted by creator");
    refreshNotes();
    if (refreshChain) refreshChain();
    setDeleteModal(null);
  };

  const handleBulkDelete = () => {
    filtered.forEach((n) => deleteNote(n.id));
    addAudit({ type: "delete", action: `Bulk deleted ${filtered.length} notes` });
    refreshNotes();
  };

  const copyLink = (n) => {
    const base = window.location.href.split("#")[0];
    const link = n.hasPassword
      ? `${base}#/note/${n.id}`
      : `${base}#/note/${n.id}?k=${n.keyHint}`;
    navigator.clipboard.writeText(link);
    setCopiedId(n.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fade-in">
      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-header">
              <span style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700 }}>Delete Note</span>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <span className="alert-icon">⚠️</span>
                This will permanently delete the note. The encrypted data will be irrecoverable.
              </div>
              <p style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                Note ID: <code style={{ color: "var(--c1)" }}>{deleteModal.slice(0, 16)}...</code>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteModal)}>🗑 Delete permanently</button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by title or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "auto" }}>
          <option value="all">All notes</option>
          <option value="active">Active only</option>
          <option value="expired">Expired</option>
          <option value="destroyed">Destroyed</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: "auto" }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        {filtered.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            🗑 Delete filtered ({filtered.length})
          </button>
        )}
      </div>

      {/* Note list */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty">
              <span className="empty-icon">📋</span>
              <div className="empty-title">No notes found</div>
              <div className="empty-text">Create your first encrypted note to get started</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {filtered.map((n) => {
            const st     = getStatus(n);
            const isActive = st.label === "Active";
            return (
              <div
                key={n.id}
                className={`note-item ${st.label === "Destroyed" ? "destroyed" : st.label === "Expired" ? "expired" : ""}`}
                style={{ "--strip-color": st.stripColor }}
              >
                <div className="ni-top">
                  <div>
                    <div style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: ".88rem", marginBottom: ".25rem" }}>
                      {n.title || "Untitled Note"}
                    </div>
                    <div className="ni-id">{n.id.slice(0, 24)}...</div>
                  </div>
                  <div className="ni-badges">
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                    {n.hasPassword && <span className="badge badge-cyan">🔑 PW</span>}
                    {n.oneTime     && <span className="badge badge-red">💣 1x</span>}
                  </div>
                </div>

                <div className="ni-meta">
                  <span className="ni-meta-item">📅 {new Date(n.createdAt).toLocaleString()}</span>
                  {n.expiresAt && <span className="ni-meta-item">⏱ Expires {new Date(n.expiresAt).toLocaleString()}</span>}
                  <span className="ni-meta-item">👁 {n.viewCount || 0} views</span>
                  {n.tags?.length > 0 && <span className="ni-meta-item">{n.tags.map((t) => `#${t}`).join(" ")}</span>}
                </div>

                <div className="ni-actions">
                  {isActive && (
                    <button className="btn btn-ghost btn-sm" onClick={() => copyLink(n)}>
                      {copiedId === n.id ? "✓ Copied!" : "📋 Copy link"}
                    </button>
                  )}
                  {isActive && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { window.location.hash = `/note/${n.id}${n.keyHint ? `?k=${n.keyHint}` : ""}`; }}
                    >
                      👁 View
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(n.id)}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
