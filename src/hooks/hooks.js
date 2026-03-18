// ═══════════════════════════════════════════════════════════════════
// hooks.js — Custom React Hooks
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { getNotes } from "../utils/store";

/**
 * Tracks window.location.hash and re-renders on changes.
 * Used for client-side hash-based routing.
 */
export function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return hash;
}

/**
 * Loads all notes from storage and provides a refresh callback.
 * @returns {[Object, Function]} [notes, refreshFn]
 */
export function useNotes() {
  const [notes, setNotes] = useState({});
  const refresh = useCallback(() => setNotes({ ...getNotes() }), []);
  useEffect(() => { refresh(); }, [refresh]);
  return [notes, refresh];
}

/**
 * Live countdown timer to a future timestamp.
 * Returns null if no expiresAt provided.
 * @param {number|null} expiresAt - Unix ms timestamp
 * @returns {{d,h,m,s,expired}|null}
 */
export function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const s = Math.floor((remaining || 0) / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
    expired: remaining === 0,
  };
}
