// ═══════════════════════════════════════════════════════════════════
// ThreatPage.jsx — AI Threat Detection Dashboard
//
// Features:
//   • Live threat feed with severity badges
//   • Risk score gauge
//   • Attack type breakdown chart
//   • Behavioral baseline status
//   • Session activity timeline
//   • Threat simulation panel (for demo)
//   • Threat resolver
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import {
  getThreats, getThreatStats, getThreatLevel,
  ATTACK_TYPES, THREAT_LEVELS, resolveThreats,
  simulateThreat, getSessions, clearThreatData,
} from "../utils/threatDetection";

// ─── Risk Gauge ───────────────────────────────────────────────────
function RiskGauge({ score }) {
  const level = getThreatLevel(score);
  const angle = -135 + (score / 100) * 270; // -135deg to +135deg arc

  return (
    <div style={{ textAlign: "center", padding: "1.5rem 1rem 0.5rem" }}>
      <svg width="180" height="110" viewBox="0 0 180 110">
        {/* Background arc */}
        <path d="M 20 100 A 70 70 0 1 1 160 100" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="14" strokeLinecap="round" />
        {/* Colored arc — green to red gradient zones */}
        {[
          { color: "#22c55e", d: "M 20 100 A 70 70 0 0 1 56 30" },
          { color: "#f59e0b", d: "M 56 30 A 70 70 0 0 1 124 30" },
          { color: "#ef4444", d: "M 124 30 A 70 70 0 0 1 160 100" },
        ].map((arc, i) => (
          <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth="14"
            strokeLinecap="round" opacity="0.25" />
        ))}
        {/* Active arc up to score */}
        <path
          d="M 20 100 A 70 70 0 1 1 160 100"
          fill="none"
          stroke={level.color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 220} 220`}
          opacity="0.85"
        />
        {/* Needle */}
        <g transform={`rotate(${angle}, 90, 100)`}>
          <line x1="90" y1="100" x2="90" y2="42" stroke={level.color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="90" cy="100" r="6" fill={level.color} />
          <circle cx="90" cy="100" r="3" fill="#0c1219" />
        </g>
        {/* Score text */}
        <text x="90" y="88" textAnchor="middle" fill={level.color} fontSize="22" fontWeight="800" fontFamily="monospace">
          {score}
        </text>
        <text x="90" y="102" textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize="9" fontFamily="monospace">
          RISK SCORE
        </text>
      </svg>
      <div style={{ marginTop: "0.25rem" }}>
        <span style={{
          fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em",
          color: level.color, background: level.bg,
          padding: "3px 12px", borderRadius: 20,
          border: `1px solid ${level.color}44`
        }}>
          {level.icon} {level.label.toUpperCase()} RISK
        </span>
      </div>
    </div>
  );
}

// ─── Threat Card ──────────────────────────────────────────────────
function ThreatCard({ threat, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const level = getThreatLevel(threat.score);
  const attackMeta = ATTACK_TYPES[threat.primaryType] || { icon: "⚠️", label: threat.primaryType };
  const age = Math.floor((Date.now() - threat.ts) / 1000);
  const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 3600)}h ago`;

  return (
    <div style={{
      background: threat.resolved ? "var(--s1)" : "var(--s2)",
      border: `1px solid ${threat.resolved ? "var(--border)" : level.color + "44"}`,
      borderLeft: `3px solid ${threat.resolved ? "var(--border)" : level.color}`,
      borderRadius: 10,
      overflow: "hidden",
      opacity: threat.resolved ? 0.55 : 1,
      transition: "all .2s",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: ".85rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: ".75rem" }}
      >
        {/* Icon */}
        <div style={{ fontSize: "1.3rem", flexShrink: 0 }}>{attackMeta.icon}</div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: ".82rem" }}>{attackMeta.label}</span>
            <span style={{
              fontSize: ".6rem", padding: "1px 8px", borderRadius: 10,
              background: level.bg, color: level.color,
              border: `1px solid ${level.color}33`,
              fontWeight: 700, letterSpacing: ".06em"
            }}>{level.label.toUpperCase()}</span>
            {threat.resolved && (
              <span style={{ fontSize: ".6rem", padding: "1px 8px", borderRadius: 10, background: "rgba(34,197,94,.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,.2)" }}>
                RESOLVED
              </span>
            )}
            {threat.event?.simulated && (
              <span style={{ fontSize: ".6rem", padding: "1px 8px", borderRadius: 10, background: "rgba(168,85,247,.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,.2)" }}>
                SIMULATED
              </span>
            )}
          </div>
          <div style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: ".2rem" }}>
            {attackMeta.desc} · {ageStr}
          </div>
        </div>

        {/* Score badge */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "1.1rem", color: level.color }}>
            {threat.score}
          </div>
          <div style={{ fontSize: ".55rem", color: "var(--muted)", textTransform: "uppercase" }}>score</div>
        </div>

        <div style={{ color: "var(--muted)", fontSize: ".75rem" }}>{expanded ? "▲" : "▼"}</div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border)" }}>
          {/* Auto action */}
          <div style={{
            display: "inline-block", fontSize: ".68rem", padding: "3px 10px",
            borderRadius: 6, marginTop: ".75rem", marginBottom: ".75rem",
            background: threat.autoAction === "NOTE_LOCKED" ? "rgba(239,68,68,.1)" :
                        threat.autoAction === "USER_WARNED" ? "rgba(245,158,11,.1)" : "rgba(100,116,139,.1)",
            color: threat.autoAction === "NOTE_LOCKED" ? "#ef4444" :
                   threat.autoAction === "USER_WARNED" ? "#f59e0b" : "var(--muted2)",
            border: `1px solid ${threat.autoAction === "NOTE_LOCKED" ? "#ef444433" :
                                  threat.autoAction === "USER_WARNED" ? "#f59e0b33" : "var(--border)"}`,
          }}>
            🤖 AI Action: {threat.autoAction === "NOTE_LOCKED" ? "Note automatically locked" :
                           threat.autoAction === "USER_WARNED" ? "User warned" : "Logged only"}
          </div>

          {/* All detections */}
          <div style={{ marginBottom: ".75rem" }}>
            <div style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".4rem" }}>
              Detection Signals ({threat.detections.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
              {threat.detections.map((d, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: ".625rem",
                  background: "var(--s1)", borderRadius: 6, padding: ".4rem .75rem"
                }}>
                  <div style={{
                    width: 36, height: 6, borderRadius: 3, flexShrink: 0,
                    background: `linear-gradient(90deg, ${getThreatLevel(d.score).color} ${d.score}%, rgba(255,255,255,.07) ${d.score}%)`
                  }} />
                  <span style={{ fontSize: ".68rem", color: "var(--muted2)", flex: 1 }}>{d.reason}</span>
                  <span style={{ fontSize: ".65rem", fontFamily: "monospace", color: getThreatLevel(d.score).color }}>{d.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".4rem", marginBottom: ".75rem" }}>
            {[
              ["Note ID",  threat.noteId?.slice(0, 8) || "—"],
              ["Hour",     `${threat.hour}:00`],
              ["Timezone", threat.timezone?.split("/")[1] || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--s1)", borderRadius: 6, padding: ".4rem .5rem" }}>
                <div style={{ fontSize: ".58rem", color: "var(--muted)", textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontSize: ".72rem", marginTop: ".1rem" }}>{v}</div>
              </div>
            ))}
          </div>

          {!threat.resolved && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: ".72rem" }}
              onClick={() => onResolve(threat.id)}
            >
              ✓ Mark Resolved
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────
function AttackTypeChart({ topTypes }) {
  const entries = Object.entries(topTypes).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = entries[0]?.[1] || 1;
  if (entries.length === 0) return (
    <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontSize: ".78rem" }}>
      No threats recorded yet
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
      {entries.map(([type, count]) => {
        const meta = ATTACK_TYPES[type] || { icon: "⚠️", label: type };
        const pct = (count / max) * 100;
        return (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <span style={{ fontSize: ".9rem", flexShrink: 0, width: 20 }}>{meta.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".68rem", color: "var(--muted2)", marginBottom: ".2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {meta.label}
              </div>
              <div style={{ height: 6, background: "var(--s1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--c1)", borderRadius: 3, transition: "width .6s ease" }} />
              </div>
            </div>
            <span style={{ fontSize: ".7rem", fontFamily: "monospace", color: "var(--c1)", flexShrink: 0 }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Session Timeline ─────────────────────────────────────────────
function SessionTimeline({ sessions }) {
  const recent = sessions.slice(0, 15);
  const TYPE_COLOR = {
    view: "var(--c2)", auth_fail: "var(--c3)", create: "var(--c5)",
    delete: "var(--c4)", default: "var(--muted)"
  };
  const TYPE_ICON = { view: "👁", auth_fail: "❌", create: "➕", delete: "🗑" };

  if (recent.length === 0) return (
    <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--muted)", fontSize: ".78rem" }}>
      No sessions recorded yet. Start using the app to build your behavioral baseline.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
      {recent.map((s, i) => {
        const age = Math.floor((Date.now() - s.ts) / 1000);
        const ageStr = age < 60 ? `${age}s` : age < 3600 ? `${Math.floor(age / 60)}m` : `${Math.floor(age / 3600)}h`;
        const color = TYPE_COLOR[s.type] || TYPE_COLOR.default;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".35rem .625rem", background: "var(--s2)", borderRadius: 6 }}>
            <span style={{ fontSize: ".8rem" }}>{TYPE_ICON[s.type] || "•"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: ".7rem", color, fontWeight: 600 }}>{s.type}</span>
              {s.noteId && <span style={{ fontSize: ".65rem", color: "var(--muted)", marginLeft: ".4rem" }}>#{s.noteId?.slice(0, 8)}</span>}
              {s.simulated && <span style={{ fontSize: ".58rem", color: "#a855f7", marginLeft: ".35rem" }}>[sim]</span>}
            </div>
            <span style={{ fontSize: ".62rem", color: "var(--muted)", flexShrink: 0 }}>{`${s.hour}:${String(s.minute).padStart(2,"0")}`}</span>
            <span style={{ fontSize: ".62rem", color: "var(--muted2)", flexShrink: 0 }}>{ageStr}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ThreatPage() {
  const [threats, setThreats]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [tab, setTab]               = useState("dashboard");
  const [filter, setFilter]         = useState("all");
  const [simulating, setSimulating] = useState(null);
  const [simResult, setSimResult]   = useState(null);
  const [cleared, setCleared]       = useState(false);

  const refresh = useCallback(() => {
    setThreats(getThreats());
    setStats(getThreatStats());
    setSessions(getSessions());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const handleResolve = (id) => {
    resolveThreats([id]);
    refresh();
  };

  const handleResolveAll = () => {
    const ids = threats.filter(t => !t.resolved).map(t => t.id);
    resolveThreats(ids);
    refresh();
  };

  const handleSimulate = async (type) => {
    setSimulating(type);
    setSimResult(null);
    try {
      const result = await simulateThreat(type);
      setSimResult(result);
      setTimeout(refresh, 300);
    } catch (e) {
      setSimResult({ error: e.message });
    }
    setSimulating(null);
  };

  const handleClearAll = () => {
    clearThreatData();
    setCleared(true);
    refresh();
    setTimeout(() => setCleared(false), 2000);
  };

  const filteredThreats = threats.filter(t => {
    if (filter === "active")   return !t.resolved && t.score >= 40;
    if (filter === "critical") return t.level === "Critical" || t.level === "High";
    if (filter === "resolved") return t.resolved;
    return true;
  });

  const activeCount = threats.filter(t => !t.resolved && t.score >= 40).length;

  if (!stats) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="fade-in">

      {/* Active threat banner */}
      {activeCount > 0 && (
        <div style={{
          background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)",
          borderRadius: 10, padding: ".875rem 1.25rem",
          display: "flex", alignItems: "center", gap: ".875rem",
          marginBottom: "1.25rem", animation: "pulse 2s infinite"
        }}>
          <span style={{ fontSize: "1.3rem" }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#ef4444", fontSize: ".85rem" }}>
              {activeCount} Active Threat{activeCount > 1 ? "s" : ""} Detected
            </div>
            <div style={{ fontSize: ".72rem", color: "var(--muted2)", marginTop: ".15rem" }}>
              AI threat detection has flagged suspicious activity. Review and resolve below.
            </div>
          </div>
          <button className="btn btn-sm" style={{ background: "rgba(239,68,68,.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)" }} onClick={handleResolveAll}>
            Resolve All
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", marginBottom: "1.25rem" }}>
        {[
          { val: stats.total,         label: "Total Threats",   color: "var(--c1)", icon: "🛡" },
          { val: stats.activeThreats, label: "Active",          color: "#ef4444",   icon: "🚨" },
          { val: stats.last24h,       label: "Last 24 Hours",   color: "#f59e0b",   icon: "📅" },
          { val: stats.byLevel.CRITICAL || 0, label: "Critical", color: "#dc2626",  icon: "⚠️" },
          { val: stats.byLevel.HIGH || 0,     label: "High",     color: "#ef4444",  icon: "🔴" },
          { val: stats.sessionCount,  label: "Sessions",        color: "var(--c2)", icon: "📋" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="stat-val" style={{ color: s.color, fontSize: "1.6rem" }}>{s.val}</div>
              <span style={{ fontSize: "1.1rem" }}>{s.icon}</span>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.25rem" }}>
        {[
          { id: "dashboard", label: "🧠 AI Dashboard" },
          { id: "threats",   label: `⚠️ Threats ${threats.length > 0 ? `(${threats.length})` : ""}` },
          { id: "sessions",  label: "📋 Sessions" },
          { id: "simulate",  label: "🧪 Simulate" },
          { id: "howit",     label: "📚 How It Works" },
        ].map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── Dashboard Tab ── */}
      {tab === "dashboard" && (
        <div className="fade-in">
          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Left: Gauge + baseline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="card">
                <div className="card-header"><span className="card-title">🎯 Current Risk Score</span></div>
                <RiskGauge score={stats.riskScore} />
                <div style={{ padding: ".75rem 1.5rem 1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                  {Object.entries(THREAT_LEVELS).map(([key, lvl]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: ".5rem", background: "var(--s2)", borderRadius: 6, padding: ".4rem .625rem" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: lvl.color, flexShrink: 0 }} />
                      <span style={{ fontSize: ".68rem", color: "var(--muted2)" }}>{lvl.label}</span>
                      <span style={{ fontSize: ".68rem", fontFamily: "monospace", color: lvl.color, marginLeft: "auto" }}>
                        {stats.byLevel[key] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">🧠 Behavioral Baseline</span></div>
                <div className="card-body">
                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".75rem" }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                      background: stats.baselineReady ? "#22c55e" : "#f59e0b",
                      boxShadow: `0 0 6px ${stats.baselineReady ? "#22c55e" : "#f59e0b"}`
                    }} />
                    <span style={{ fontSize: ".78rem", fontWeight: 600 }}>
                      {stats.baselineReady ? "Baseline Active" : "Building Baseline..."}
                    </span>
                  </div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted2)", lineHeight: 1.7 }}>
                    {stats.baselineReady
                      ? `Trained on ${stats.baselineSamples} sessions. The AI model has learned your normal usage patterns and can now detect deviations.`
                      : `${stats.sessionCount}/5 sessions collected. The AI needs at least 5 sessions to establish a behavioral baseline. Use the app to generate sessions.`}
                  </div>
                  {!stats.baselineReady && (
                    <div style={{ marginTop: ".75rem", height: 6, background: "var(--s2)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, stats.sessionCount / 5 * 100)}%`, background: "#f59e0b", borderRadius: 3, transition: "width .6s" }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Attack types + recent */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="card">
                <div className="card-header"><span className="card-title">📊 Attack Type Distribution</span></div>
                <div className="card-body">
                  <AttackTypeChart topTypes={stats.topAttackType} />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">⚠️ Recent Threats</span>
                  <span className="badge badge-cyan">{threats.length}</span>
                </div>
                <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: ".5rem", maxHeight: 300, overflowY: "auto" }}>
                  {threats.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--muted)", fontSize: ".78rem" }}>
                      No threats detected. System is secure.
                    </div>
                  ) : threats.slice(0, 5).map(t => {
                    const level = getThreatLevel(t.score);
                    const meta = ATTACK_TYPES[t.primaryType] || { icon: "⚠️", label: t.primaryType };
                    const age = Math.floor((Date.now() - t.ts) / 1000);
                    const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 3600)}h ago`;
                    return (
                      <div key={t.id} style={{
                        display: "flex", alignItems: "center", gap: ".625rem",
                        padding: ".5rem .75rem", background: "var(--s2)", borderRadius: 7,
                        borderLeft: `3px solid ${t.resolved ? "var(--border)" : level.color}`,
                        opacity: t.resolved ? 0.5 : 1
                      }}>
                        <span style={{ fontSize: ".9rem" }}>{meta.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: ".72rem", fontWeight: 600 }}>{meta.label}</div>
                          <div style={{ fontSize: ".62rem", color: "var(--muted)" }}>{ageStr}</div>
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: ".8rem", fontWeight: 700, color: level.color }}>{t.score}</span>
                      </div>
                    );
                  })}
                  {threats.length > 5 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab("threats")}>
                      View all {threats.length} threats →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Threats Tab ── */}
      {tab === "threats" && (
        <div className="fade-in">
          <div style={{ display: "flex", gap: ".625rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
            {[
              { id: "all",      label: `All (${threats.length})` },
              { id: "active",   label: `Active (${activeCount})` },
              { id: "critical", label: "High/Critical" },
              { id: "resolved", label: "Resolved" },
            ].map(f => (
              <button
                key={f.id}
                className={`btn btn-sm ${filter === f.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: ".5rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={refresh}>↺ Refresh</button>
              {activeCount > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ color: "#22c55e" }} onClick={handleResolveAll}>
                  ✓ Resolve All
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
            {filteredThreats.length === 0 ? (
              <div className="card"><div className="card-body">
                <div className="empty">
                  <span className="empty-icon">🛡</span>
                  <div className="empty-title">No threats found</div>
                  <div className="empty-text">
                    {filter === "active" ? "No active threats — system is secure" : "No threats match this filter"}
                  </div>
                </div>
              </div></div>
            ) : (
              filteredThreats.map(t => (
                <ThreatCard key={t.id} threat={t} onResolve={handleResolve} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Sessions Tab ── */}
      {tab === "sessions" && (
        <div className="fade-in">
          <div className="card mb-2">
            <div className="card-header">
              <span className="card-title">📋 Session Activity Log</span>
              <span className="badge badge-cyan">{sessions.length} sessions</span>
            </div>
            <div className="card-body">
              <SessionTimeline sessions={sessions} />
            </div>
          </div>
        </div>
      )}

      {/* ── Simulate Tab ── */}
      {tab === "simulate" && (
        <div className="fade-in">
          <div className="card mb-2">
            <div className="card-header"><span className="card-title">🧪 Attack Simulation Panel</span></div>
            <div className="card-body">
              <div style={{ background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 8, padding: ".75rem 1rem", marginBottom: "1.25rem", fontSize: ".78rem", color: "var(--muted2)" }}>
                ⚠️ These simulations inject artificial events into the session log to demonstrate the AI detection system. They are clearly marked as [SIMULATED] in all logs.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".875rem" }}>
                {[
                  { id: "brute_force", icon: "🔨", title: "Brute Force Attack", desc: "Simulates 5 rapid failed password attempts on the same note. Triggers BRUTE_FORCE detection.", expectedScore: "~95" },
                  { id: "velocity",    icon: "⚡", title: "Velocity Attack",    desc: "Simulates 12 note access events within 60 seconds. Triggers VELOCITY_ATTACK detection.", expectedScore: "~65" },
                  { id: "harvesting",  icon: "🌾", title: "Note Harvesting",    desc: "Simulates access to 8 different notes in 5 minutes. Triggers HARVESTING detection.", expectedScore: "~55" },
                  { id: "anomaly",     icon: "🧠", title: "Behavioral Anomaly", desc: "Simulates off-hours (3am) access from a different timezone. Triggers ACCESS + GEO anomaly.", expectedScore: "~60" },
                ].map(sim => (
                  <div key={sim.id} style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem 1.125rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                      <span style={{ fontSize: "1.3rem" }}>{sim.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: ".82rem" }}>{sim.title}</div>
                        <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>Expected score: {sim.expectedScore}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: ".75rem", color: "var(--muted2)", lineHeight: 1.6, marginBottom: ".875rem" }}>{sim.desc}</p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSimulate(sim.id)}
                      disabled={simulating === sim.id}
                      style={{ width: "100%" }}
                    >
                      {simulating === sim.id ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Running...</> : `▶ Run ${sim.title}`}
                    </button>
                  </div>
                ))}
              </div>

              {simResult && (
                <div style={{ marginTop: "1.25rem", animation: "fadeIn .3s" }}>
                  {simResult.error ? (
                    <div className="alert alert-danger">Error: {simResult.error}</div>
                  ) : (
                    <div>
                      <div className="alert alert-success" style={{ marginBottom: ".75rem" }}>
                        ✅ Simulation complete — threat detected with score {simResult.score}
                      </div>
                      <ThreatCard threat={simResult} onResolve={handleResolve} />
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--c3)" }} onClick={handleClearAll}>
                  🗑 Clear All Threat & Session Data
                </button>
                {cleared && <span style={{ marginLeft: ".75rem", fontSize: ".72rem", color: "#22c55e" }}>✓ Cleared</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── How It Works Tab ── */}
      {tab === "howit" && (
        <div className="fade-in">
          {[
            {
              icon: "🧠",
              title: "How the AI Detection Works",
              body: "SecureVault's threat detection uses a rule-based weighted scoring model — the same foundational approach as production anomaly detection systems (Isolation Forest, One-Class SVM). Each 'feature' (failed attempts, access timing, request velocity, etc.) contributes a score from 0 to 100. These are combined using a composite formula: primary signal score + 20% weight from each secondary signal. The result is a threat score that determines the severity level and automatic action."
            },
            {
              icon: "📊",
              title: "Behavioral Baseline (Unsupervised Learning)",
              body: "The system builds a behavioral baseline from your last 50 sessions — recording which hours you typically access notes, how fast you make requests, and how many notes you access in a time window. This is the 'training' phase of unsupervised anomaly detection. Once the baseline is built, any session that significantly deviates from it (measured in standard deviations, or Z-score) is flagged as a behavioral anomaly. This means the system gets smarter the more you use it."
            },
            {
              icon: "🔨",
              title: "Brute Force Detection",
              body: "The brute force detector counts failed authentication attempts on a specific note within a sliding 5-minute window. 1 failure = score 20 (logged). 2 failures = score 45 (user warned). 3 failures = score 70 (note locked). 5+ failures = score 95 (critical — note locked + blockchain record created). This sliding window approach prevents attackers from spacing attempts to avoid detection."
            },
            {
              icon: "⚡",
              title: "Velocity Attack Detection",
              body: "The velocity analyzer counts total access events (any type) within a 60-second window. Normal human usage: 1-3 events per minute. Automated attack tools: 10-50+ events per minute. Threshold: 6 events/min = warning (40), 10 events/min = high (65), 20 events/min = critical (90). This detects automated scraping, enumeration attacks, and denial-of-service probing."
            },
            {
              icon: "🌍",
              title: "Geographic Anomaly Detection",
              body: "The geo detector compares the current browser timezone against the last 10 recorded sessions. If the current timezone is different from the most common historical timezone (with at least 5 confirmed historical sessions), it flags a potential geographic anomaly — suggesting either a new device, a VPN, or account compromise. In production, this would use IP geolocation for more precise detection."
            },
            {
              icon: "🎯",
              title: "Composite Scoring & Auto Actions",
              body: "Multiple detectors can fire simultaneously. The composite score is: primary_score + (sum of secondary scores × 0.2). This ensures multiple weak signals together can trigger a higher severity than any single signal alone. Based on the final score: 0-39 = LOG ONLY, 40-64 = WARN USER (banner shown), 65-84 = NOTE LOCKED (requires re-authentication), 85-100 = CRITICAL LOCK (blockchain alert + note permanently locked)."
            },
          ].map(s => (
            <div key={s.title} className="card mb-2">
              <div className="card-header"><span className="card-title">{s.icon} {s.title}</span></div>
              <div className="card-body">
                <p style={{ fontSize: ".82rem", color: "var(--muted2)", lineHeight: 1.8 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
