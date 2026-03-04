// ═══════════════════════════════════════════════════════════════════
// ViewPage.jsx — Note Recipient View
// Handles: auto-decrypt, password prompt, brute-force lockout,
//          countdown timer, one-time destroy, blurred reveal
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { decrypt, hashPassword } from "../utils/crypto";
import { getNote, saveNote, deleteNote, addAudit } from "../utils/store";
import { useCountdown } from "../hooks/hooks";
import { recordTransaction } from "../utils/blockchain";

// Terminal-style state screens
const STATE_MAP = {
  loading:   { icon: "⏳", title: "Loading...",          msg: "Fetching encrypted note from secure storage." },
  decrypting:{ icon: "🔓", title: "Decrypting...",       msg: "Running AES-256-GCM decryption algorithm." },
  notfound:  { icon: "🚫", title: "Note Not Found",      msg: "This note does not exist or was never created in this session." },
  expired:   { icon: "⏰", title: "Note Expired",        msg: "This note passed its expiry time and has been permanently deleted." },
  destroyed: { icon: "💨", title: "Note Destroyed",      msg: "This was a one-time note. It was viewed and permanently destroyed. No data remains." },
  maxviews:  { icon: "🔒", title: "Max Views Reached",   msg: "This note has reached its maximum allowed view count." },
  locked:    { icon: "🔒", title: "Account Locked",      msg: "Too many incorrect password attempts. Access to this note is blocked." },
};

export default function ViewPage({ noteId, refreshChain }) {
  const [status, setStatus]     = useState("loading");
  const [noteData, setNoteData] = useState(null);
  const [decrypted, setDecrypted] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [blurred, setBlurred]   = useState(false);

  const countdown = useCountdown(noteData?.expiresAt);

  useEffect(() => {
    const search = window.location.hash.split("?")[1] || "";
    const k = new URLSearchParams(search).get("k");
    const note = getNote(noteId);

    if (!note) {
      addAudit({ type: "fail", action: "Note not found", noteId: noteId?.slice(0, 8) });
      setStatus("notfound");
      return;
    }
    if (note.expiresAt && Date.now() > note.expiresAt) {
      deleteNote(noteId);
      addAudit({ type: "delete", action: "Expired note accessed & deleted", noteId: noteId.slice(0, 8) });
      recordTransaction("NOTE_EXPIRED", noteId.slice(0, 8), "Note expired and was permanently deleted on access");
      setStatus("expired");
      return;
    }
    if (note.viewed && note.oneTime) {
      addAudit({ type: "view", action: "Destroyed note access attempt", noteId: noteId.slice(0, 8) });
      setStatus("destroyed");
      return;
    }
    if (!note.oneTime && note.viewCount >= note.maxViews) {
      setStatus("maxviews");
      return;
    }

    setNoteData(note);

    // Auto-decrypt if key is in URL fragment
    if (!note.hasPassword && k) {
      attemptDecrypt(note, k, 0);
    } else {
      setStatus("password");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const attemptDecrypt = async (note, pass, currentAttempts) => {
    setStatus("decrypting");
    try {
      // Verify password hash for password-protected notes
      if (note.hasPassword && note.pwHash) {
        const h = await hashPassword(pass);
        if (h !== note.pwHash) throw new Error("Wrong password");
      }
      const plain = await decrypt(note.encrypted, pass);
      setDecrypted(plain);
      setStatus("ready");
      addAudit({ type: "view", action: "Note decrypted successfully", noteId: noteId.slice(0, 8) });
      recordTransaction("NOTE_VIEWED", noteId.slice(0, 8), "Note accessed and decrypted successfully");
      if (refreshChain) refreshChain();
    } catch {
      const next = currentAttempts + 1;
      setAttempts(next);
      setError(`Incorrect password. Attempt ${next}/5.`);
      if (next >= 5) {
        addAudit({ type: "fail", action: "5 failed decrypt attempts — note locked", noteId: noteId.slice(0, 8) });
        recordTransaction("AUTH_FAILED", noteId.slice(0, 8), "5 consecutive failed password attempts — access locked");
        if (refreshChain) refreshChain();
        setStatus("locked");
      } else {
        setStatus("password");
      }
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    const updated = {
      ...noteData,
      viewCount: (noteData.viewCount || 0) + 1,
      viewed: noteData.oneTime ? true : noteData.viewed,
    };
    saveNote(noteId, updated);
    setNoteData(updated);
  };

  // ── Terminal screens ────────────────────────────────────────────
  if (STATE_MAP[status]) {
    const s = STATE_MAP[status];
    return (
      <div className="fade-in" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>{s.icon}</div>
            {(status === "loading" || status === "decrypting") && (
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, margin: "0 auto 1rem" }} />
            )}
            <div style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 800, fontSize: "1.4rem", marginBottom: ".6rem" }}>
              {s.title}
            </div>
            <p style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.7 }}>{s.msg}</p>
            {!["loading", "decrypting"].includes(status) && (
              <button className="btn btn-ghost" style={{ marginTop: "1.5rem" }} onClick={() => (window.location.hash = "")}>
                ← Go home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Password prompt ─────────────────────────────────────────────
  if (status === "password") {
    return (
      <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="card">
          <div className="card-header"><span className="card-title">🔑 Password Required</span></div>
          <div className="card-body">
            {noteData?.oneTime && (
              <div className="alert alert-warn mb-2">
                <span className="alert-icon">💣</span>
                This is a one-time note — it will be destroyed after viewing.
              </div>
            )}
            {error && (
              <div className="alert alert-danger mb-2">
                <span className="alert-icon">⚠️</span>{error}
              </div>
            )}

            {/* Attempt tracker */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "1rem" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < attempts ? "var(--c3)" : "var(--border2)" }} />
              ))}
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter the password provided by the sender..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && attemptDecrypt(noteData, password, attempts)}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={() => attemptDecrypt(noteData, password, attempts)}
              disabled={!password}
            >
              🔓 Decrypt Note
            </button>

            {/* Countdown */}
            {countdown && !countdown.expired && (
              <div style={{ marginTop: "1.25rem" }}>
                <div style={{ fontSize: ".68rem", color: "var(--muted)", textAlign: "center", marginBottom: ".5rem" }}>
                  Note expires in:
                </div>
                <div className="countdown">
                  {countdown.d > 0 && <div className="cd-unit"><span className="cd-val">{countdown.d}</span><span className="cd-label">days</span></div>}
                  <div className="cd-unit"><span className="cd-val">{String(countdown.h).padStart(2, "0")}</span><span className="cd-label">hrs</span></div>
                  <div className="cd-unit"><span className="cd-val">{String(countdown.m).padStart(2, "0")}</span><span className="cd-label">min</span></div>
                  <div className="cd-unit"><span className="cd-val">{String(countdown.s).padStart(2, "0")}</span><span className="cd-label">sec</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Ready: decrypted note ───────────────────────────────────────
  if (status === "ready") {
    return (
      <div className="fade-in" style={{ maxWidth: 680, margin: "0 auto" }}>
        {noteData.oneTime && (
          <div className="alert alert-warn mb-2">
            <span className="alert-icon">💣</span>
            One-time note: after revealing, this note is permanently destroyed and no one else can access it.
          </div>
        )}

        <div className="card mb-2">
          <div className="card-header">
            <span className="card-title">📬 {noteData.title || "Secret Note"}</span>
            <div className="flex gap-1">
              {revealed && (
                <button className="btn btn-ghost btn-sm" onClick={() => setBlurred(!blurred)}>
                  {blurred ? "👁 Show" : "🙈 Hide"}
                </button>
              )}
              {revealed && (
                <button
                  className={`copy-btn ${copied ? "copied" : ""}`}
                  onClick={() => { navigator.clipboard.writeText(decrypted); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                >
                  {copied ? "✓" : "📋"}
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            {!revealed ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: ".75rem" }}>🔒</div>
                <p style={{ color: "var(--muted)", fontSize: ".82rem", marginBottom: "1.5rem", lineHeight: 1.7 }}>
                  Decryption successful. Click below to reveal the message content.
                  {noteData.oneTime && " This will permanently destroy the note."}
                </p>
                <button className="btn btn-primary" style={{ minWidth: 220 }} onClick={handleReveal}>
                  👁 Reveal Decrypted Message
                </button>
              </div>
            ) : (
              <div className={`note-reveal ${blurred ? "blurred" : ""}`}>{decrypted}</div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="card mb-2">
          <div className="card-header"><span className="card-title">📋 Note Metadata</span></div>
          <div className="card-body">
            <div className="grid-2">
              {[
                ["Status",    noteData.viewed && noteData.oneTime ? "🔴 Destroyed" : "🟢 Active"],
                ["Encryption","AES-256-GCM"],
                ["Views",     `${noteData.viewCount || 0} / ${noteData.oneTime ? 1 : noteData.maxViews}`],
                ["Created",   new Date(noteData.createdAt).toLocaleString()],
                ["Expires",   noteData.expiresAt ? new Date(noteData.expiresAt).toLocaleString() : "Never"],
                ["Tags",      noteData.tags?.length ? noteData.tags.join(", ") : "None"],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: ".5rem .75rem", background: "var(--s2)", borderRadius: 6 }}>
                  <div style={{ fontSize: ".63rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>{k}</div>
                  <div style={{ fontSize: ".78rem", marginTop: ".2rem" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Live countdown */}
            {countdown && !countdown.expired && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: ".68rem", color: "var(--muted)", marginBottom: ".4rem" }}>Time remaining:</div>
                <div className="countdown" style={{ justifyContent: "flex-start" }}>
                  {countdown.d > 0 && <div className="cd-unit"><span className="cd-val" style={{ fontSize: "1.1rem" }}>{countdown.d}</span><span className="cd-label">d</span></div>}
                  <div className="cd-unit"><span className="cd-val" style={{ fontSize: "1.1rem" }}>{countdown.h}</span><span className="cd-label">h</span></div>
                  <div className="cd-unit"><span className="cd-val" style={{ fontSize: "1.1rem" }}>{countdown.m}</span><span className="cd-label">m</span></div>
                  <div className="cd-unit"><span className="cd-val" style={{ fontSize: "1.1rem" }}>{countdown.s}</span><span className="cd-label">s</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-ghost" onClick={() => (window.location.hash = "")}>← Return home</button>
      </div>
    );
  }

  return null;
}
