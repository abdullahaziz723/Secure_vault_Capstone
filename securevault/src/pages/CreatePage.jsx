// ═══════════════════════════════════════════════════════════════════
// CreatePage.jsx — 3-Tab Note Creation Wizard
// Tab 1: Compose  |  Tab 2: Options  |  Tab 3: Preview
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import QRCode from "../components/QRCode";
import { encrypt, hashPassword, genId, entropyScore } from "../utils/crypto";
import { saveNote, addAudit } from "../utils/store";
import { recordTransaction } from "../utils/blockchain";
import { analyzeThreat } from "../utils/threatDetection";

const PW_LABELS = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
const PW_COLORS = ["var(--muted)", "var(--c3)", "var(--c4)", "#8be58b", "var(--c2)"];

export default function CreatePage({ refreshNotes, refreshChain }) {
  const [tab, setTab]               = useState("compose");
  const [note, setNote]             = useState("");
  const [title, setTitle]           = useState("");
  const [tags, setTags]             = useState([]);
  const [tagInput, setTagInput]     = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [pwVisible, setPwVisible]   = useState(false);
  const [oneTime, setOneTime]       = useState(true);
  const [expiry, setExpiry]         = useState("24h");
  const [maxViews, setMaxViews]     = useState(1);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [copied, setCopied]         = useState(false);
  const [showQR, setShowQR]         = useState(false);

  const pwScore  = entropyScore(password);
  const pwLevel  = pwScore < 30 ? 0 : pwScore < 50 ? 1 : pwScore < 70 ? 2 : pwScore < 85 ? 3 : 4;

  // ── Tag helpers ───────────────────────────────────────────────
  const addTag = (t) => {
    const clean = t.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean && !tags.includes(clean) && tags.length < 5) setTags([...tags, clean]);
    setTagInput("");
  };

  // ── Create note ───────────────────────────────────────────────
  const handleCreate = async () => {
    if (!note.trim()) return;
    if (usePassword && password !== confirmPw) return;
    setLoading(true);
    try {
      const pass      = usePassword ? password : genId(16);
      const encrypted = await encrypt(note.trim(), pass);
      const pwHash    = usePassword ? await hashPassword(password) : null;
      const id        = genId();
      const expiryMs  = { "30m": 1800000, "1h": 3600000, "6h": 21600000, "24h": 86400000, "3d": 259200000, "7d": 604800000, never: null }[expiry];

      const meta = {
        encrypted,
        oneTime,
        pwHash,
        maxViews: oneTime ? 1 : parseInt(maxViews),
        viewCount: 0,
        expiresAt: expiryMs ? Date.now() + expiryMs : null,
        createdAt: Date.now(),
        hasPassword: usePassword,
        keyHint: usePassword ? null : pass,
        tags,
        title: title || "Untitled Note",
        status: "active",
      };
      saveNote(id, meta);
      addAudit({ type: "create", action: "Note created", noteId: id.slice(0, 8), tags, oneTime, hasPassword: usePassword });
      // Record on blockchain
      await recordTransaction("NOTE_CREATED", id.slice(0, 8), `Note "${title || "Untitled"}" created — ${oneTime ? "one-time" : "multi-view"}, expires: ${expiry}`, { tags, oneTime, hasPassword: usePassword });
      analyzeThreat({ type: "create", noteId: id.slice(0, 8) });
      refreshNotes();
      if (refreshChain) refreshChain();

      const base = window.location.href.split("#")[0];
      const link = usePassword ? `${base}#/note/${id}` : `${base}#/note/${id}?k=${pass}`;
      setResult({ link, id, pass: usePassword ? null : pass });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setResult(null); setNote(""); setPassword(""); setConfirmPw(""); setTitle(""); setTags([]); setCopied(false);
  };

  // ── Result screen ─────────────────────────────────────────────
  if (result) {
    return (
      <div className="fade-in">
        <div className="alert alert-success mb-2">
          <span className="alert-icon">✅</span>
          <span>Note encrypted and stored successfully. Share the link below with your intended recipient.</span>
        </div>

        <div className="card mb-2">
          <div className="card-header">
            <span className="card-title">🔗 Shareable Link</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(!showQR)}>
              📱 {showQR ? "Hide" : "Show"} QR
            </button>
          </div>
          <div className="card-body">
            <div className="alert alert-warn mb-2">
              <span className="alert-icon">⚠️</span>
              <span>Copy this link now — it won't be shown again after you navigate away.</span>
            </div>
            <div className="link-box mb-2">
              <code>{result.link}</code>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={() => handleCopy(result.link)}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>

            {showQR && (
              <div className="qr-container">
                <QRCode text={result.link} size={200} />
                <div style={{ fontSize: ".72rem", color: "var(--muted)", textAlign: "center" }}>
                  Scan to open the secret note
                </div>
              </div>
            )}

            {result.pass && (
              <div style={{ marginTop: ".75rem" }}>
                <div className="divider-text">Decryption key embedded in link</div>
                <div className="link-box">
                  <code style={{ fontSize: ".68rem", opacity: .7 }}>{result.pass}</code>
                  <button className="copy-btn" onClick={() => handleCopy(result.pass)}>Copy key</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: "1rem" }}>
              {oneTime    && <span className="badge badge-red">💣 One-time view</span>}
              {expiry !== "never" && <span className="badge badge-warn">⏱ Expires in {expiry}</span>}
              {usePassword && <span className="badge badge-cyan">🔑 Password protected</span>}
              <span className="badge badge-green">🔐 AES-256-GCM</span>
              {tags.map((t) => <span key={t} className="badge badge-purple">#{t}</span>)}
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Note Details</span></div>
          <div className="card-body">
            <div className="grid-2">
              {[
                ["Note ID",        result.id.slice(0, 16) + "..."],
                ["Encryption",     "AES-256-GCM"],
                ["Key Derivation", "PBKDF2 · 310,000 iterations"],
                ["One-time View",  oneTime ? "Yes" : "No"],
                ["Expiry",         expiry === "never" ? "Never" : `In ${expiry}`],
                ["Password",       usePassword ? "Yes (hash stored)" : "No (key in URL)"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: ".2rem", padding: ".6rem", background: "var(--s2)", borderRadius: "6px" }}>
                  <span style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>{k}</span>
                  <span style={{ fontSize: ".78rem" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem" }}>
          <button className="btn btn-ghost" onClick={reset}>+ Create another</button>
          <button className="btn btn-ghost" onClick={() => (window.location.hash = "")}>← Dashboard</button>
        </div>
      </div>
    );
  }

  // ── Wizard tabs ───────────────────────────────────────────────
  return (
    <div className="fade-in">
      <div className="tabs">
        {["compose", "options", "preview"].map((t) => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "compose" ? "📝 Compose" : t === "options" ? "⚙️ Options" : "👁 Preview"}
          </div>
        ))}
      </div>

      {/* ── Compose tab ── */}
      {tab === "compose" && (
        <div className="fade-in">
          <div className="card mb-2">
            <div className="card-header"><span className="card-title">✏️ Compose Message</span></div>
            <div className="card-body">
              <div className="field">
                <label>Note title (optional)</label>
                <input type="text" placeholder="e.g. Server credentials, API key..." value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
              </div>
              <div className="field">
                <label>Secret message</label>
                <textarea
                  placeholder={"Type your confidential message here...\n\nThis content will be encrypted with AES-256-GCM before storage."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ minHeight: 200 }}
                />
                <div className="char-count">{note.length} characters · ~{Math.round(note.length / 5)} words</div>
              </div>
              <div className="field">
                <label>Tags (press Enter, max 5)</label>
                <div className="tags-wrap" onClick={(e) => e.currentTarget.querySelector("input").focus()}>
                  {tags.map((t) => (
                    <span key={t} className="tag-pill">
                      #{t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))}>×</button>
                    </span>
                  ))}
                  <input
                    className="tag-input"
                    placeholder={tags.length < 5 ? "Add tag..." : ""}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                      if (e.key === "Backspace" && !tagInput) setTags(tags.slice(0, -1));
                    }}
                    disabled={tags.length >= 5}
                  />
                </div>
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => setTab("options")} disabled={!note.trim()}>
            Next: Configure Options →
          </button>
        </div>
      )}

      {/* ── Options tab ── */}
      {tab === "options" && (
        <div className="fade-in">
          <div className="card mb-2">
            <div className="card-header"><span className="card-title">🔑 Security Settings</span></div>
            <div className="card-body">
              <div className="field">
                <div className="toggle-wrap" onClick={() => setUsePassword(!usePassword)}>
                  <div className="toggle-info">
                    <div className="tl">Password Protection</div>
                    <div className="td">Recipient must enter a password to decrypt</div>
                  </div>
                  <div className={`toggle ${usePassword ? "on" : ""}`} />
                </div>
              </div>

              {usePassword && (
                <div className="fade-in">
                  <div className="field">
                    <label>Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={pwVisible ? "text" : "password"}
                        placeholder="Enter a strong password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <button
                        onClick={() => setPwVisible(!pwVisible)}
                        style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: ".9rem" }}
                      >
                        {pwVisible ? "🙈" : "👁"}
                      </button>
                    </div>
                    {password && (
                      <>
                        <div className="strength-bar mt-1">
                          <div className="strength-fill" style={{ width: `${pwScore}%`, background: PW_COLORS[pwLevel] }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".3rem" }}>
                          <span style={{ fontSize: ".68rem", color: PW_COLORS[pwLevel] }}>{PW_LABELS[pwLevel]}</span>
                          <span style={{ fontSize: ".65rem", color: "var(--muted)" }}>Score: {pwScore}/100</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="field">
                    <label>Confirm password</label>
                    <input type="password" placeholder="Re-enter password..." value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                    {confirmPw && password !== confirmPw && <div style={{ color: "var(--c3)", fontSize: ".7rem", marginTop: ".3rem" }}>⚠ Passwords do not match</div>}
                    {confirmPw && password === confirmPw && <div style={{ color: "var(--c2)", fontSize: ".7rem", marginTop: ".3rem" }}>✓ Passwords match</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card mb-2">
            <div className="card-header"><span className="card-title">⏱ Expiry & Access Control</span></div>
            <div className="card-body">
              <div className="grid-2 mb-2">
                <div className="field">
                  <label>Auto-expire after</label>
                  <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                    <option value="1m">1 minutes</option>
                    <option value="30m">30 minutes</option>
                    <option value="1h">1 hours</option>
                    <option value="6h">6 hours</option>
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="never">Never expire</option>
                  </select>
                </div>
                <div className="field">
                  <label>Max view count</label>
                  <input type="number" min={1} max={100} value={maxViews} onChange={(e) => setMaxViews(e.target.value)} disabled={oneTime} />
                </div>
              </div>
              <div className="field">
                <div className="toggle-wrap" onClick={() => setOneTime(!oneTime)}>
                  <div className="toggle-info">
                    <div className="tl">🔥 One-time view (self-destruct)</div>
                    <div className="td">Note is permanently destroyed after first view</div>
                  </div>
                  <div className={`toggle ${oneTime ? "on" : ""}`} />
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleCreate}
            disabled={loading || !note.trim() || (usePassword && (!password || password !== confirmPw))}
          >
            {loading
              ? <><span className="spinner" /> Encrypting with AES-256-GCM...</>
              : "🔐 Encrypt & Generate Link"}
          </button>
        </div>
      )}

      {/* ── Preview tab ── */}
      {tab === "preview" && (
        <div className="fade-in">
          <div className="card mb-2">
            <div className="card-header"><span className="card-title">👁 Note Preview</span></div>
            <div className="card-body">
              {title && <div style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".75rem" }}>{title}</div>}
              <div className="note-reveal blurred">{note || "No content yet..."}</div>
              <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: ".5rem", textAlign: "center" }}>
                ↑ Content will be AES-256-GCM encrypted before storage
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">📋 Configuration Summary</span></div>
            <div className="card-body">
              {[
                ["Algorithm",      "AES-256-GCM"],
                ["Key Derivation", "PBKDF2 · SHA-256 · 310,000 iterations"],
                ["Salt",           "128-bit random"],
                ["IV",             "96-bit random (per encryption)"],
                ["Password",       usePassword ? `Yes (strength: ${PW_LABELS[pwLevel]})` : "Auto-generated (embedded in link)"],
                ["One-time",       oneTime ? "Yes" : "No"],
                ["Expiry",         expiry],
                ["Tags",           tags.length ? tags.join(", ") : "None"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: ".5rem 0", borderBottom: "1px solid rgba(26,37,53,.6)", fontSize: ".78rem" }}>
                  <span style={{ color: "var(--muted)" }}>{k}</span>
                  <span style={{ textAlign: "right", maxWidth: "60%" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
