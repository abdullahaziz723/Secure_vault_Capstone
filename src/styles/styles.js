// ═══════════════════════════════════════════════════════════════════
// styles.js — Global CSS
// Injected via <style> tag in App.jsx
// ═══════════════════════════════════════════════════════════════════

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Fira+Code:wght@300;400;500&display=swap');

*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #04070a; --s1: #080d12; --s2: #0c1219; --s3: #111820;
  --border: #1a2535; --border2: #243040;
  --c1: #00d4ff; --c2: #00ff88; --c3: #ff4060; --c4: #ffb800; --c5: #a855f7;
  --text: #dde6f0; --muted: #4a6070; --muted2: #6a8090;
  --r: 10px;
  font-size: 15px;
}

body { background: var(--bg); color: var(--text); font-family: 'Fira Code', monospace; min-height: 100vh; overflow-x: hidden; }
#root { min-height: 100vh; }

/* Scan line overlay */
body::after { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.012) 2px, rgba(0,212,255,0.012) 4px); pointer-events: none; z-index: 9999; }

/* Noise texture */
body::before { content: ''; position: fixed; inset: 0; opacity: 0.035; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; }

/* ── Layout ─────────────────────────────────────────────────── */
.layout { display: flex; min-height: 100vh; }
.sidebar { width: 240px; flex-shrink: 0; background: var(--s1); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; transition: transform .3s; }
.main { margin-left: 240px; flex: 1; min-height: 100vh; display: flex; flex-direction: column; }
@media(max-width:768px) { .sidebar { transform: translateX(-100%); } .sidebar.open { transform: translateX(0); } .main { margin-left: 0; } }

/* ── Sidebar ────────────────────────────────────────────────── */
.sb-brand { padding: 1.5rem 1.25rem 1rem; border-bottom: 1px solid var(--border); }
.sb-logo { display: flex; align-items: center; gap: .625rem; }
.sb-logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg,var(--c1),#0050cc); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; box-shadow: 0 0 16px rgba(0,212,255,.35); flex-shrink: 0; }
.sb-logo-text { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: .95rem; letter-spacing: -.02em; }
.sb-logo-text span { color: var(--c1); }
.sb-version { font-size: .6rem; color: var(--muted); margin-top: .15rem; }
.sb-nav { flex: 1; padding: 1rem .75rem; overflow-y: auto; }
.sb-section { font-size: .6rem; color: var(--muted); letter-spacing: .12em; text-transform: uppercase; padding: .5rem .5rem .375rem; margin-top: .75rem; }
.sb-item { display: flex; align-items: center; gap: .625rem; padding: .55rem .75rem; border-radius: 8px; cursor: pointer; transition: all .15s; font-size: .78rem; color: var(--muted2); border: 1px solid transparent; margin-bottom: .15rem; }
.sb-item:hover { background: var(--s2); color: var(--text); border-color: var(--border); }
.sb-item.active { background: rgba(0,212,255,.08); color: var(--c1); border-color: rgba(0,212,255,.2); }
.sb-item .icon { font-size: .95rem; width: 18px; text-align: center; }
.sb-item .badge-nav { margin-left: auto; background: var(--c3); color: #fff; font-size: .58rem; padding: 1px 6px; border-radius: 10px; font-family: 'Space Grotesk', sans-serif; }
.sb-footer { padding: 1rem .75rem; border-top: 1px solid var(--border); }
.sb-status { display: flex; align-items: center; gap: .5rem; font-size: .68rem; color: var(--muted2); }
.sb-dot { width: 7px; height: 7px; background: var(--c2); border-radius: 50%; box-shadow: 0 0 8px var(--c2); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

/* ── Topbar ─────────────────────────────────────────────────── */
.topbar { background: var(--s1); border-bottom: 1px solid var(--border); padding: .875rem 2rem; display: flex; align-items: center; gap: 1rem; position: sticky; top: 0; z-index: 50; }
.topbar-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.1rem; flex: 1; }
.topbar-subtitle { font-size: .7rem; color: var(--muted); font-weight: 400; margin-top: .1rem; }
.mobile-menu-btn { display: none; background: none; border: 1px solid var(--border); color: var(--text); padding: .4rem .6rem; border-radius: 6px; cursor: pointer; font-size: 1rem; }
@media(max-width:768px) { .mobile-menu-btn { display: block; } }

/* ── Content ────────────────────────────────────────────────── */
.content { flex: 1; padding: 2rem; max-width: 1100px; width: 100%; }

/* ── Cards ──────────────────────────────────────────────────── */
.card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); position: relative; overflow: hidden; }
.card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,212,255,.3), transparent); }
.card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: .82rem; letter-spacing: .08em; text-transform: uppercase; color: var(--c1); }
.card-body { padding: 1.5rem; }

/* ── Stats ──────────────────────────────────────────────────── */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); padding: 1.25rem; }
.stat-val { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 2rem; line-height: 1; }
.stat-label { font-size: .68rem; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; margin-top: .375rem; }

/* ── Forms ──────────────────────────────────────────────────── */
.field { margin-bottom: 1.125rem; }
.field > label, .field-label { display: block; font-size: .68rem; color: var(--muted); letter-spacing: .08em; text-transform: uppercase; margin-bottom: .4rem; }
textarea, input[type=text], input[type=password], input[type=email], input[type=number], select {
  width: 100%; background: var(--s2); border: 1px solid var(--border2); color: var(--text);
  font-family: 'Fira Code', monospace; font-size: .82rem; border-radius: 8px; padding: .7rem .9rem;
  outline: none; transition: border-color .2s, box-shadow .2s; resize: vertical;
}
textarea:focus, input:focus, select:focus { border-color: var(--c1); box-shadow: 0 0 0 3px rgba(0,212,255,.1); }
textarea { min-height: 130px; }
select option { background: var(--s2); }
.char-count { font-size: .65rem; color: var(--muted); text-align: right; margin-top: .25rem; }

/* ── Toggle ─────────────────────────────────────────────────── */
.toggle-wrap { display: flex; align-items: center; justify-content: space-between; padding: .7rem .9rem; background: var(--s2); border: 1px solid var(--border2); border-radius: 8px; cursor: pointer; transition: border-color .2s; gap: .75rem; user-select: none; }
.toggle-wrap:hover { border-color: var(--c1); }
.toggle-info { flex: 1; }
.toggle-info .tl { font-size: .8rem; }
.toggle-info .td { font-size: .67rem; color: var(--muted); margin-top: .15rem; }
.toggle { width: 38px; height: 21px; background: var(--border2); border-radius: 11px; position: relative; transition: background .2s; flex-shrink: 0; }
.toggle.on { background: var(--c1); }
.toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; background: #fff; border-radius: 50%; transition: transform .2s; }
.toggle.on::after { transform: translateX(17px); }

/* ── Buttons ────────────────────────────────────────────────── */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; padding: .65rem 1.25rem; border-radius: 8px; border: none; font-family: 'Fira Code', monospace; font-size: .78rem; cursor: pointer; transition: all .2s; font-weight: 500; letter-spacing: .02em; white-space: nowrap; }
.btn-primary { background: var(--c1); color: #000; font-weight: 700; }
.btn-primary:hover { background: #33ddff; box-shadow: 0 0 20px rgba(0,212,255,.4); transform: translateY(-1px); }
.btn-primary:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-ghost { background: transparent; border: 1px solid var(--border2); color: var(--muted2); }
.btn-ghost:hover { border-color: var(--c1); color: var(--c1); }
.btn-danger { background: rgba(255,64,96,.15); border: 1px solid var(--c3); color: var(--c3); }
.btn-danger:hover { background: var(--c3); color: #fff; }
.btn-success { background: rgba(0,255,136,.15); border: 1px solid var(--c2); color: var(--c2); }
.btn-success:hover { background: var(--c2); color: #000; }
.btn-sm { padding: .4rem .8rem; font-size: .72rem; }
.btn-full { width: 100%; }
.btn-icon { padding: .55rem; width: 34px; height: 34px; }

/* ── Tabs ───────────────────────────────────────────────────── */
.tabs { display: flex; gap: .25rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }
.tab { padding: .6rem 1rem; font-size: .78rem; color: var(--muted2); cursor: pointer; border-bottom: 2px solid transparent; transition: all .2s; font-family: 'Space Grotesk', sans-serif; font-weight: 600; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--c1); border-bottom-color: var(--c1); }

/* ── Alerts ─────────────────────────────────────────────────── */
.alert { padding: .8rem 1rem; border-radius: 8px; font-size: .78rem; margin-bottom: 1rem; border: 1px solid; line-height: 1.6; display: flex; gap: .6rem; align-items: flex-start; }
.alert-icon { flex-shrink: 0; margin-top: .05rem; }
.alert-danger { background: rgba(255,64,96,.08); border-color: rgba(255,64,96,.3); color: #ff8099; }
.alert-success { background: rgba(0,255,136,.08); border-color: rgba(0,255,136,.3); color: #66ffbb; }
.alert-warn { background: rgba(255,184,0,.08); border-color: rgba(255,184,0,.3); color: #ffd060; }
.alert-info { background: rgba(0,212,255,.08); border-color: rgba(0,212,255,.3); color: var(--c1); }

/* ── Badges ─────────────────────────────────────────────────── */
.badge { font-size: .63rem; padding: 2px 8px; border-radius: 20px; border: 1px solid; letter-spacing: .05em; text-transform: uppercase; display: inline-flex; align-items: center; gap: .3rem; }
.badge-cyan { color: var(--c1); border-color: rgba(0,212,255,.3); background: rgba(0,212,255,.08); }
.badge-green { color: var(--c2); border-color: rgba(0,255,136,.3); background: rgba(0,255,136,.08); }
.badge-red { color: var(--c3); border-color: rgba(255,64,96,.3); background: rgba(255,64,96,.08); }
.badge-warn { color: var(--c4); border-color: rgba(255,184,0,.3); background: rgba(255,184,0,.08); }
.badge-purple { color: var(--c5); border-color: rgba(168,85,247,.3); background: rgba(168,85,247,.08); }

/* ── Table ──────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th { font-size: .65rem; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; padding: .75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); font-weight: 500; }
td { padding: .75rem 1rem; font-size: .78rem; border-bottom: 1px solid rgba(26,37,53,.6); vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(0,212,255,.03); }

/* ── Password Strength ──────────────────────────────────────── */
.strength-bar { height: 4px; border-radius: 2px; background: var(--border2); overflow: hidden; margin-top: .4rem; }
.strength-fill { height: 100%; border-radius: 2px; transition: width .3s, background .3s; }

/* ── Link Box ───────────────────────────────────────────────── */
.link-box { background: var(--s2); border: 1px solid rgba(0,212,255,.3); border-radius: 8px; padding: .875rem 1rem; display: flex; align-items: center; gap: .75rem; }
.link-box code { flex: 1; font-size: .72rem; color: var(--c1); word-break: break-all; line-height: 1.5; }

/* ── QR Box ─────────────────────────────────────────────────── */
.qr-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem; background: var(--s2); border-radius: var(--r); border: 1px solid var(--border); }
.qr-canvas { border-radius: 8px; border: 3px solid var(--c1); box-shadow: 0 0 20px rgba(0,212,255,.25); }

/* ── Divider ────────────────────────────────────────────────── */
.divider { height: 1px; background: var(--border); margin: 1.25rem 0; }
.divider-text { display: flex; align-items: center; gap: .75rem; color: var(--muted); font-size: .7rem; margin: 1.25rem 0; }
.divider-text::before, .divider-text::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* ── Grid ───────────────────────────────────────────────────── */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
@media(max-width:640px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

/* ── Note Items ─────────────────────────────────────────────── */
.note-item { background: var(--s1); border: 1px solid var(--border); border-radius: var(--r); padding: 1.125rem 1.25rem; transition: border-color .2s, transform .15s; position: relative; overflow: hidden; }
.note-item:hover { border-color: var(--border2); transform: translateY(-1px); }
.note-item.destroyed { opacity: .45; }
.note-item::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--c1); }
.note-item.destroyed::before { background: var(--muted); }
.note-item.expired::before { background: var(--c3); }
.ni-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-bottom: .6rem; }
.ni-id { font-size: .7rem; color: var(--c1); font-family: 'Fira Code', monospace; }
.ni-badges { display: flex; flex-wrap: wrap; gap: .3rem; }
.ni-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
.ni-meta-item { font-size: .68rem; color: var(--muted); display: flex; align-items: center; gap: .3rem; }
.ni-actions { display: flex; gap: .4rem; margin-top: .75rem; }

/* ── Spinner ────────────────────────────────────────────────── */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner { width: 18px; height: 18px; border: 2px solid rgba(0,212,255,.2); border-top-color: var(--c1); border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; flex-shrink: 0; }

/* ── Animations ─────────────────────────────────────────────── */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.fade-in { animation: fadeInUp .35s ease both; }

/* ── Countdown ──────────────────────────────────────────────── */
.countdown { display: flex; gap: .75rem; justify-content: center; margin: 1rem 0; }
.cd-unit { text-align: center; background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: .6rem .9rem; min-width: 60px; }
.cd-val { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 1.5rem; color: var(--c1); display: block; }
.cd-label { font-size: .6rem; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }

/* ── Audit Log ──────────────────────────────────────────────── */
.audit-entry { display: flex; gap: .75rem; padding: .75rem 0; border-bottom: 1px solid rgba(26,37,53,.8); align-items: flex-start; }
.audit-entry:last-child { border-bottom: none; }
.audit-icon { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .85rem; flex-shrink: 0; margin-top: .1rem; }
.audit-icon.create { background: rgba(0,212,255,.12); border: 1px solid rgba(0,212,255,.2); }
.audit-icon.view { background: rgba(0,255,136,.12); border: 1px solid rgba(0,255,136,.2); }
.audit-icon.delete { background: rgba(255,64,96,.12); border: 1px solid rgba(255,64,96,.2); }
.audit-icon.fail { background: rgba(255,184,0,.12); border: 1px solid rgba(255,184,0,.2); }
.audit-body { flex: 1; min-width: 0; }
.audit-title { font-size: .78rem; color: var(--text); margin-bottom: .15rem; }
.audit-meta { font-size: .65rem; color: var(--muted); display: flex; gap: .75rem; flex-wrap: wrap; }

/* ── Settings ───────────────────────────────────────────────── */
.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border); gap: 1rem; }
.setting-row:last-child { border-bottom: none; }
.setting-info .sl { font-size: .82rem; font-weight: 500; }
.setting-info .sd { font-size: .7rem; color: var(--muted); margin-top: .2rem; }

/* ── Note Reveal ────────────────────────────────────────────── */
.note-reveal { background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; font-size: .82rem; line-height: 1.8; white-space: pre-wrap; word-break: break-word; position: relative; min-height: 80px; }
.note-reveal.blurred { filter: blur(8px); user-select: none; }

/* ── Tags ───────────────────────────────────────────────────── */
.tags-wrap { display: flex; flex-wrap: wrap; gap: .4rem; padding: .5rem .75rem; background: var(--s2); border: 1px solid var(--border2); border-radius: 8px; min-height: 42px; cursor: text; }
.tags-wrap:focus-within { border-color: var(--c1); box-shadow: 0 0 0 3px rgba(0,212,255,.1); }
.tag-pill { background: rgba(0,212,255,.1); border: 1px solid rgba(0,212,255,.25); color: var(--c1); font-size: .7rem; padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: .35rem; }
.tag-pill button { background: none; border: none; color: var(--c1); cursor: pointer; font-size: .75rem; line-height: 1; padding: 0; }
.tag-input { background: none; border: none; outline: none; color: var(--text); font-family: 'Fira Code', monospace; font-size: .78rem; flex: 1; min-width: 80px; }

/* ── Chart ──────────────────────────────────────────────────── */
.chart-bar-wrap { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
.chart-bar { flex: 1; background: rgba(0,212,255,.15); border-radius: 3px 3px 0 0; border: 1px solid rgba(0,212,255,.2); transition: height .5s ease; position: relative; cursor: default; min-width: 8px; }
.chart-bar:hover { background: rgba(0,212,255,.3); }
.chart-bar .cb-tip { position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); background: #1a2535; border: 1px solid var(--border2); padding: 2px 6px; border-radius: 4px; font-size: .62rem; white-space: nowrap; opacity: 0; transition: opacity .2s; pointer-events: none; }
.chart-bar:hover .cb-tip { opacity: 1; }
.chart-labels { display: flex; gap: 4px; margin-top: .3rem; }
.chart-label { flex: 1; font-size: .58rem; color: var(--muted); text-align: center; min-width: 8px; }

/* ── Modal / Overlay ────────────────────────────────────────── */
.overlay { position: fixed; inset: 0; background: rgba(4,7,10,.85); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal { background: var(--s1); border: 1px solid var(--border2); border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; gap: .75rem; justify-content: flex-end; }

/* ── Copy Button ────────────────────────────────────────────── */
.copy-btn { padding: .35rem .75rem; background: var(--c1); color: #000; border: none; border-radius: 6px; font-family: 'Fira Code', monospace; font-size: .68rem; cursor: pointer; font-weight: 700; transition: all .2s; flex-shrink: 0; }
.copy-btn:hover { background: #33ddff; }
.copy-btn.copied { background: var(--c2); color: #000; }

/* ── Empty State ────────────────────────────────────────────── */
.empty { text-align: center; padding: 3rem 1.5rem; color: var(--muted); }
.empty-icon { font-size: 2.5rem; margin-bottom: .75rem; display: block; opacity: .4; }
.empty-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: var(--muted2); margin-bottom: .4rem; }
.empty-text { font-size: .78rem; }

/* ── Utilities ──────────────────────────────────────────────── */
.text-c1 { color: var(--c1); } .text-c2 { color: var(--c2); } .text-c3 { color: var(--c3); } .text-muted { color: var(--muted); }
.font-sg { font-family: 'Space Grotesk', sans-serif; }
.mt-1 { margin-top: .5rem; } .mt-2 { margin-top: 1rem; } .mt-3 { margin-top: 1.5rem; }
.mb-1 { margin-bottom: .5rem; } .mb-2 { margin-bottom: 1rem; } .mb-3 { margin-bottom: 1.5rem; }
.flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; } .gap-1 { gap: .5rem; } .gap-2 { gap: 1rem; }
.w-full { width: 100%; } .text-right { text-align: right; } .text-center { text-align: center; }

/* ── Scrollbar ──────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--s1); }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted); }
`;
