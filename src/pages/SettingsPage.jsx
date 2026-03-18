// ═══════════════════════════════════════════════════════════════════
// SettingsPage.jsx — Application Configuration & Danger Zone
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { getSettings, saveSettings, getNotes, getAudit, clearAllData } from "../utils/store";
import { clearChain } from "../utils/blockchain";
import { clearThreatData } from "../utils/threatDetection";

export default function SettingsPage() {
  const [settings, setSettings] = useState(getSettings());

  const update = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
  };

  const handleClearAll = () => {
    if (window.confirm("This will delete ALL notes, audit logs, blockchain records, and threat data. This action is irreversible.")) {
      clearAllData();
      clearChain();
      clearThreatData();
      window.location.reload();
    }
  };

  const toggleRows = [
    { key: "notifications", label: "Event Notifications",       desc: "Show alerts when notes are created or viewed" },
    { key: "autoDelete",    label: "Auto-delete Expired Notes", desc: "Automatically purge expired notes on access" },
  ];

  const securityRows = [
    ["Encryption Algorithm", "AES-256-GCM (non-configurable)"],
    ["PBKDF2 Iterations",    "310,000 (NIST recommended minimum: 10,000)"],
    ["Salt Length",          "128 bits"],
    ["IV Length",            "96 bits"],
    ["Max Password Attempts","5 (then locked)"],
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      {/* App settings */}
      <div className="card mb-2">
        <div className="card-header"><span className="card-title">⚙️ Application Settings</span></div>
        <div className="card-body">
          {toggleRows.map((r) => (
            <div key={r.key} className="setting-row">
              <div className="setting-info">
                <div className="sl">{r.label}</div>
                <div className="sd">{r.desc}</div>
              </div>
              <div
                className={`toggle ${settings[r.key] ? "on" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => update(r.key, !settings[r.key])}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security config (read-only) */}
      <div className="card mb-2">
        <div className="card-header"><span className="card-title">🔐 Security Configuration</span></div>
        <div className="card-body">
          {securityRows.map(([k, v]) => (
            <div key={k} className="setting-row">
              <div className="setting-info">
                <div className="sl">{k}</div>
                <div className="sd">{v}</div>
              </div>
              <span className="badge badge-green">Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* Storage stats */}
      <div className="card mb-2">
        <div className="card-header"><span className="card-title">📊 Storage Info</span></div>
        <div className="card-body">
          {[
            ["Notes stored",      Object.keys(getNotes()).length],
            ["Audit log entries", getAudit().length],
            ["Storage engine",    "localStorage (browser)"],
          ].map(([k, v]) => (
            <div key={k} className="setting-row">
              <div className="setting-info"><div className="sl">{k}</div></div>
              <span style={{ fontSize: ".82rem", color: "var(--c1)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card">
        <div className="card-header"><span className="card-title">⚠️ Danger Zone</span></div>
        <div className="card-body">
          <p style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.7 }}>
            Permanently delete all notes and audit log entries. This action cannot be undone.
            All encrypted data will be irrecoverably lost.
          </p>
          <button className="btn btn-danger" onClick={handleClearAll}>
            🗑 Clear all data permanently
          </button>
        </div>
      </div>
    </div>
  );
}
