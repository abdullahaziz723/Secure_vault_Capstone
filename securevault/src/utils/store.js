// ═══════════════════════════════════════════════════════════════════
// store.js — Persistent Storage Engine
// Wraps localStorage with typed getters/setters for notes,
// audit log, and settings. In a production deployment this would
// be replaced by Flask/MongoDB API calls.
// ═══════════════════════════════════════════════════════════════════

import { genId } from "./crypto";

const NOTES_KEY    = "sv_notes_v2";
const AUDIT_KEY    = "sv_audit_v2";
const SETTINGS_KEY = "sv_settings_v1";

const DEFAULT_SETTINGS = {
  theme: "dark",
  notifications: true,
  autoDelete: true,
};

// ─── Notes ────────────────────────────────────────────────────────

/** @returns {Object.<string, NoteRecord>} */
export function getNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}"); }
  catch { return {}; }
}

/** @param {string} id @param {NoteRecord} data */
export function saveNote(id, data) {
  const notes = getNotes();
  notes[id] = data;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

/** @param {string} id @returns {NoteRecord|null} */
export function getNote(id) {
  return getNotes()[id] || null;
}

/** @param {string} id */
export function deleteNote(id) {
  const notes = getNotes();
  delete notes[id];
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// ─── Audit Log ────────────────────────────────────────────────────

/**
 * @typedef {Object} AuditEntry
 * @property {string} id
 * @property {number} ts
 * @property {'create'|'view'|'delete'|'fail'} type
 * @property {string} action
 * @property {string} [noteId]
 */

/** @returns {AuditEntry[]} */
export function getAudit() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); }
  catch { return []; }
}

/** @param {Omit<AuditEntry,'id'|'ts'>} entry */
export function addAudit(entry) {
  const log = getAudit();
  log.unshift({ ...entry, id: genId(8), ts: Date.now() });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 200)));
}

export function clearAudit() {
  localStorage.removeItem(AUDIT_KEY);
}

// ─── Settings ─────────────────────────────────────────────────────

export function getSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** @param {typeof DEFAULT_SETTINGS} settings */
export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAllData() {
  localStorage.removeItem(NOTES_KEY);
  localStorage.removeItem(AUDIT_KEY);
}

// ─── Convenience object (legacy compat) ───────────────────────────
const store = { getNotes, saveNote, getNote, deleteNote, getAudit, addAudit, getSettings, saveSettings };
export default store;
