// ═══════════════════════════════════════════════════════════════════
// threatDetection.js — AI-Powered Threat Detection Engine
//
// HOW IT WORKS (No external ML library needed):
//   Uses a rule-based scoring model with weighted features — the same
//   foundational approach as real anomaly detection systems (Isolation
//   Forest, One-Class SVM). Each "feature" contributes to a threat
//   score. When the score crosses a threshold, an alert fires.
//
// DETECTION MODELS:
//   1. Brute Force Detector     — failed attempt velocity + timing
//   2. Access Anomaly Detector  — unusual hour, burst access patterns
//   3. Geographic Anomaly       — impossible travel (simulated)
//   4. Note Harvesting Detector — bulk note access patterns
//   5. Velocity Analyzer        — requests per time window (rate ML)
//   6. Behavioral Baseline      — deviation from normal usage pattern
//
// THREAT LEVELS:
//   LOW    (0–39)   — informational, log only
//   MEDIUM (40–64)  — warn user, flag in dashboard
//   HIGH   (65–84)  — lock note, require re-auth
//   CRITICAL(85–100)— immediate lock + blockchain alert
// ═══════════════════════════════════════════════════════════════════

const THREAT_KEY      = "sv_threats_v1";
const BEHAVIOR_KEY    = "sv_behavior_v1";
const SESSIONS_KEY    = "sv_sessions_v1";
const MAX_THREATS     = 200;

// ─── Threat Level Definitions ─────────────────────────────────────
export const THREAT_LEVELS = {
  LOW:      { min: 0,  max: 39,  label: "Low",      color: "#22c55e", bg: "rgba(34,197,94,.1)",   icon: "🟢" },
  MEDIUM:   { min: 40, max: 64,  label: "Medium",   color: "#f59e0b", bg: "rgba(245,158,11,.1)",  icon: "🟡" },
  HIGH:     { min: 65, max: 84,  label: "High",     color: "#ef4444", bg: "rgba(239,68,68,.1)",   icon: "🔴" },
  CRITICAL: { min: 85, max: 100, label: "Critical", color: "#dc2626", bg: "rgba(220,38,38,.15)",  icon: "🚨" },
};

export function getThreatLevel(score) {
  if (score >= 85) return THREAT_LEVELS.CRITICAL;
  if (score >= 65) return THREAT_LEVELS.HIGH;
  if (score >= 40) return THREAT_LEVELS.MEDIUM;
  return THREAT_LEVELS.LOW;
}

// ─── Attack Type Definitions ──────────────────────────────────────
export const ATTACK_TYPES = {
  BRUTE_FORCE:         { label: "Brute Force Attack",         icon: "🔨", desc: "Repeated failed password attempts detected" },
  ACCESS_ANOMALY:      { label: "Unusual Access Time",        icon: "🕐", desc: "Access during abnormal hours" },
  VELOCITY_ATTACK:     { label: "High Velocity Access",       icon: "⚡", desc: "Unusually rapid note access attempts" },
  GEO_ANOMALY:         { label: "Geographic Anomaly",         icon: "🌍", desc: "Access from unexpected location pattern" },
  HARVESTING:          { label: "Note Harvesting",            icon: "🌾", desc: "Bulk access pattern across multiple notes" },
  BEHAVIORAL_ANOMALY:  { label: "Behavioral Anomaly",         icon: "🧠", desc: "Significant deviation from baseline behavior" },
  REPLAY_ATTACK:       { label: "Replay Attack",              icon: "🔄", desc: "Same note accessed in suspicious rapid succession" },
  ENUMERATION:         { label: "Note Enumeration",           icon: "🔢", desc: "Sequential note ID guessing pattern detected" },
};

// ─── Storage ──────────────────────────────────────────────────────
export function getThreats() {
  try { return JSON.parse(localStorage.getItem(THREAT_KEY) || "[]"); }
  catch { return []; }
}

function saveThreats(threats) {
  localStorage.setItem(THREAT_KEY, JSON.stringify(threats.slice(0, MAX_THREATS)));
}

function getBehaviorBaseline() {
  try { return JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || "null"); }
  catch { return null; }
}

function saveBehaviorBaseline(baseline) {
  localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(baseline));
}

export function getSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); }
  catch { return []; }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 500)));
}

export function clearThreatData() {
  localStorage.removeItem(THREAT_KEY);
  localStorage.removeItem(BEHAVIOR_KEY);
  localStorage.removeItem(SESSIONS_KEY);
}

// ─── Session Logger ───────────────────────────────────────────────
/**
 * Records every access event for pattern analysis.
 * Called on every note view attempt, creation, deletion.
 */
export function logSession(event) {
  const sessions = getSessions();
  const now = new Date();
  sessions.unshift({
    ...event,
    ts: Date.now(),
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
    minute: now.getMinutes(),
    // Simulated geo: in production this would come from IP geolocation API
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent.slice(0, 80),
  });
  saveSessions(sessions);
  return sessions;
}

// ─── Behavioral Baseline Builder ─────────────────────────────────
/**
 * Builds a statistical baseline from the last N sessions.
 * Used to detect deviations from normal behavior.
 * This is the "training" phase of anomaly detection.
 */
function buildBaseline(sessions) {
  if (sessions.length < 5) return null;

  const recent = sessions.slice(0, 50);

  // Hour distribution (which hours are "normal" for this user)
  const hourCounts = new Array(24).fill(0);
  recent.forEach(s => hourCounts[s.hour]++);
  const totalSessions = recent.length;
  const hourDistribution = hourCounts.map(c => c / totalSessions);

  // Inter-arrival time (time between events)
  const interArrivals = [];
  for (let i = 0; i < Math.min(recent.length - 1, 20); i++) {
    interArrivals.push(recent[i].ts - recent[i + 1].ts);
  }
  const avgInterArrival = interArrivals.length
    ? interArrivals.reduce((a, b) => a + b, 0) / interArrivals.length
    : 300000; // 5 minutes default

  // Event type distribution
  const typeCounts = {};
  recent.forEach(s => { typeCounts[s.type] = (typeCounts[s.type] || 0) + 1; });

  // Notes per session window (15 min)
  const windowedCounts = [];
  for (let i = 0; i < recent.length; i++) {
    const windowStart = recent[i].ts;
    const inWindow = recent.filter(
      s => Math.abs(s.ts - windowStart) <= 900000
    ).length;
    windowedCounts.push(inWindow);
  }
  const avgWindowedAccess = windowedCounts.reduce((a, b) => a + b, 0) / windowedCounts.length;

  return {
    hourDistribution,
    avgInterArrival,
    stdDevInterArrival: standardDeviation(interArrivals),
    typeCounts,
    avgWindowedAccess,
    builtAt: Date.now(),
    sampleSize: recent.length,
  };
}

function standardDeviation(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sq = arr.map(x => Math.pow(x - mean, 2));
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / arr.length);
}

// ─── Feature Extractors ───────────────────────────────────────────
// Each function returns a score contribution (0-100) and a reason

function detectBruteForce(sessions, noteId) {
  // Count failed attempts on this specific note in last 5 minutes
  const cutoff = Date.now() - 300000; // 5 min window
  const recentFails = sessions.filter(
    s => s.type === "auth_fail" && s.noteId === noteId && s.ts > cutoff
  );

  if (recentFails.length >= 5)  return { score: 95, reason: `${recentFails.length} failed attempts in 5 minutes` };
  if (recentFails.length >= 3)  return { score: 70, reason: `${recentFails.length} failed attempts in 5 minutes` };
  if (recentFails.length >= 2)  return { score: 45, reason: `${recentFails.length} failed attempts in 5 minutes` };
  if (recentFails.length === 1) return { score: 20, reason: "1 failed attempt recorded" };
  return { score: 0, reason: null };
}

function detectVelocityAttack(sessions) {
  // Count total access events in last 60 seconds
  const cutoff = Date.now() - 60000; // 1 min window
  const recent = sessions.filter(s => s.ts > cutoff);

  if (recent.length >= 20) return { score: 90, reason: `${recent.length} requests in 60 seconds` };
  if (recent.length >= 10) return { score: 65, reason: `${recent.length} requests in 60 seconds` };
  if (recent.length >= 6)  return { score: 40, reason: `${recent.length} requests in 60 seconds` };
  return { score: 0, reason: null };
}

function detectAccessAnomaly(currentHour, baseline) {
  if (!baseline) return { score: 0, reason: null };

  // How unusual is this hour based on historical behavior?
  const historicalFrequency = baseline.hourDistribution[currentHour];

  // Sleeping hours (1am–5am) with zero history
  const isSleepingHour = currentHour >= 1 && currentHour <= 5;
  if (isSleepingHour && historicalFrequency === 0) {
    return { score: 55, reason: `Access at ${currentHour}:00 — outside normal usage hours` };
  }
  if (isSleepingHour && historicalFrequency < 0.02) {
    return { score: 40, reason: `Access at ${currentHour}:00 — rarely used hour` };
  }

  // Zero historical frequency at this hour
  if (historicalFrequency === 0 && baseline.sampleSize > 15) {
    return { score: 35, reason: `Access at ${currentHour}:00 — never used at this hour before` };
  }
  return { score: 0, reason: null };
}

function detectBehavioralAnomaly(sessions, baseline) {
  if (!baseline || sessions.length < 3) return { score: 0, reason: null };

  // Check inter-arrival time anomaly
  const recent = sessions.slice(0, 3);
  if (recent.length >= 2) {
    const currentInterArrival = recent[0].ts - recent[1].ts;
    const zscore = baseline.stdDevInterArrival > 0
      ? Math.abs(currentInterArrival - baseline.avgInterArrival) / baseline.stdDevInterArrival
      : 0;

    // Z-score > 3 means the timing is extremely unusual (3 standard deviations from mean)
    if (zscore > 5) return { score: 60, reason: `Access timing ${zscore.toFixed(1)}σ from baseline` };
    if (zscore > 3) return { score: 35, reason: `Access timing ${zscore.toFixed(1)}σ from baseline` };
  }

  // Check windowed access rate anomaly
  const cutoff = Date.now() - 900000;
  const windowCount = sessions.filter(s => s.ts > cutoff).length;
  if (windowCount > baseline.avgWindowedAccess * 4) {
    return {
      score: 65,
      reason: `${windowCount} accesses in 15 min (baseline avg: ${baseline.avgWindowedAccess.toFixed(1)})`
    };
  }
  return { score: 0, reason: null };
}

function detectHarvesting(sessions) {
  // Detect if many DIFFERENT notes are being accessed rapidly
  const cutoff = Date.now() - 300000; // 5 min window
  const recentViews = sessions.filter(s => s.type === "view" && s.ts > cutoff);
  const uniqueNotes = new Set(recentViews.map(s => s.noteId)).size;

  if (uniqueNotes >= 10) return { score: 85, reason: `${uniqueNotes} different notes accessed in 5 minutes` };
  if (uniqueNotes >= 5)  return { score: 55, reason: `${uniqueNotes} different notes accessed in 5 minutes` };
  if (uniqueNotes >= 3)  return { score: 25, reason: `${uniqueNotes} different notes accessed in 5 minutes` };
  return { score: 0, reason: null };
}

function detectReplayAttack(sessions, noteId) {
  // Same note accessed more than twice in 30 seconds
  const cutoff = Date.now() - 30000;
  const rapidAccess = sessions.filter(
    s => s.noteId === noteId && s.type === "view" && s.ts > cutoff
  );

  if (rapidAccess.length >= 5) return { score: 75, reason: `Note accessed ${rapidAccess.length} times in 30 seconds` };
  if (rapidAccess.length >= 3) return { score: 50, reason: `Note accessed ${rapidAccess.length} times in 30 seconds` };
  return { score: 0, reason: null };
}

function detectGeoAnomaly(currentTimezone, sessions) {
  // Compare current timezone to recent sessions
  const recentTimezones = sessions.slice(0, 10)
    .map(s => s.timezone)
    .filter(Boolean);

  if (recentTimezones.length < 3) return { score: 0, reason: null };

  // Find most common timezone
  const freq = {};
  recentTimezones.forEach(tz => { freq[tz] = (freq[tz] || 0) + 1; });
  const mostCommon = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];

  if (currentTimezone !== mostCommon && freq[mostCommon] >= 5) {
    return {
      score: 60,
      reason: `Timezone changed: ${mostCommon} → ${currentTimezone}`
    };
  }
  return { score: 0, reason: null };
}

// ─── Main Threat Analyzer ─────────────────────────────────────────
/**
 * Runs all detection models and produces a composite threat assessment.
 *
 * @param {Object} event - The current access event
 * @param {string} event.type - 'view' | 'auth_fail' | 'create' | 'delete'
 * @param {string} event.noteId
 * @returns {ThreatAssessment|null} - null if below minimum threshold
 */
export async function analyzeThreat(event) {
  // Log this event first
  const sessions = logSession(event);

  // Build / refresh behavioral baseline
  let baseline = getBehaviorBaseline();
  if (!baseline || Date.now() - baseline.builtAt > 300000) { // rebuild every 5 min
    baseline = buildBaseline(sessions);
    if (baseline) saveBehaviorBaseline(baseline);
  }

  const currentHour = new Date().getHours();
  const currentTz   = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Run all detectors
  const detections = [
    { type: "BRUTE_FORCE",        ...detectBruteForce(sessions, event.noteId) },
    { type: "VELOCITY_ATTACK",    ...detectVelocityAttack(sessions) },
    { type: "ACCESS_ANOMALY",     ...detectAccessAnomaly(currentHour, baseline) },
    { type: "BEHAVIORAL_ANOMALY", ...detectBehavioralAnomaly(sessions, baseline) },
    { type: "HARVESTING",         ...detectHarvesting(sessions) },
    { type: "REPLAY_ATTACK",      ...detectReplayAttack(sessions, event.noteId) },
    { type: "GEO_ANOMALY",        ...detectGeoAnomaly(currentTz, sessions) },
  ].filter(d => d.score > 0);

  if (detections.length === 0) return null;

  // Composite scoring: weighted max + secondary contributions
  detections.sort((a, b) => b.score - a.score);
  const primaryScore   = detections[0].score;
  const secondaryBonus = detections.slice(1).reduce((acc, d) => acc + d.score * 0.2, 0);
  const compositeScore = Math.min(100, Math.round(primaryScore + secondaryBonus));

  const level = getThreatLevel(compositeScore);

  const threat = {
    id:          Math.random().toString(36).slice(2, 10),
    ts:          Date.now(),
    score:       compositeScore,
    level:       level.label,
    primaryType: detections[0].type,
    detections,
    event,
    noteId:      event.noteId,
    hour:        currentHour,
    timezone:    currentTz,
    baselineAge: baseline ? Math.round((Date.now() - baseline.builtAt) / 1000) : null,
    resolved:    false,
    autoAction:  compositeScore >= 65 ? "NOTE_LOCKED" : compositeScore >= 40 ? "USER_WARNED" : "LOGGED",
  };

  // Store threat
  const threats = getThreats();
  threats.unshift(threat);
  saveThreats(threats);

  return threat;
}

// ─── Threat Stats ─────────────────────────────────────────────────
export function getThreatStats() {
  const threats = getThreats();
  const sessions = getSessions();
  const baseline = getBehaviorBaseline();

  const byLevel = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  threats.forEach(t => { byLevel[t.level.toUpperCase()] = (byLevel[t.level.toUpperCase()] || 0) + 1; });

  const last24h = threats.filter(t => Date.now() - t.ts < 86400000);
  const activeThreats = threats.filter(t => !t.resolved && t.score >= 40);

  // Risk score: weighted average of recent threat scores
  const riskScore = last24h.length > 0
    ? Math.min(100, Math.round(last24h.reduce((a, t) => a + t.score, 0) / last24h.length))
    : 0;

  return {
    total:        threats.length,
    byLevel,
    last24h:      last24h.length,
    activeThreats: activeThreats.length,
    riskScore,
    sessionCount: sessions.length,
    baselineReady: !!baseline,
    baselineSamples: baseline?.sampleSize || 0,
    topAttackType: threats.length > 0
      ? threats.reduce((acc, t) => {
          acc[t.primaryType] = (acc[t.primaryType] || 0) + 1;
          return acc;
        }, {})
      : {},
  };
}

export function resolveThreats(ids) {
  const threats = getThreats();
  const updated = threats.map(t => ids.includes(t.id) ? { ...t, resolved: true } : t);
  saveThreats(updated);
}

// ─── Simulate Threats (for demo/testing) ─────────────────────────
export function simulateThreat(type) {
  const simulations = {
    brute_force: () => {
      const noteId = "demo1234";
      for (let i = 0; i < 5; i++) {
        logSession({ type: "auth_fail", noteId, simulated: true });
      }
      return analyzeThreat({ type: "auth_fail", noteId, simulated: true });
    },
    velocity: () => {
      for (let i = 0; i < 12; i++) {
        logSession({ type: "view", noteId: `note${i}`, simulated: true });
      }
      return analyzeThreat({ type: "view", noteId: "note0", simulated: true });
    },
    harvesting: () => {
      for (let i = 0; i < 8; i++) {
        logSession({ type: "view", noteId: `harvest${i}`, simulated: true });
      }
      return analyzeThreat({ type: "view", noteId: "harvest0", simulated: true });
    },
    anomaly: () => {
      // Simulate off-hours access
      const fakeSession = {
        type: "view", noteId: "anom001",
        ts: Date.now(),
        hour: 3, // 3am
        timezone: "Asia/Tokyo", // different timezone
        simulated: true
      };
      const sessions = getSessions();
      sessions.unshift(fakeSession);
      saveSessions(sessions);
      return analyzeThreat({ type: "view", noteId: "anom001", simulated: true });
    },
  };

  return simulations[type] ? simulations[type]() : null;
}
