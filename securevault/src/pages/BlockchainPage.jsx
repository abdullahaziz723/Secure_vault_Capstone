// ═══════════════════════════════════════════════════════════════════
// BlockchainPage.jsx — Blockchain Explorer & Integrity Verifier
//
// Features:
//   • Live chain stats dashboard
//   • Block explorer with expandable blocks
//   • Transaction detail viewer
//   • Chain integrity verifier (full SHA-256 re-verification)
//   • Visual chain diagram
//   • Note certificate lookup (verify a note's blockchain receipt)
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import {
  loadChain, verifyChain, getChainStats, sha256, TX_META, simulateTampering, resetChainForDemo,
} from "../utils/blockchain";

// ─── Block Card ───────────────────────────────────────────────────

function BlockCard({ block, isLatest, onClick, selected }) {
  const meta = TX_META[block.transactions[0]?.type] || TX_META.CHAIN_INITIALIZED;
  const age  = Math.floor((Date.now() - block.timestamp) / 1000);
  const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age/60)}m ago` : `${Math.floor(age/3600)}h ago`;

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "rgba(0,212,255,0.08)" : "var(--s2)",
        border: `1px solid ${selected ? "var(--c1)" : "var(--border)"}`,
        borderRadius: 10,
        padding: "1rem 1.125rem",
        cursor: "pointer",
        transition: "all .2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent strip */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: meta.color }} />

      {/* Block header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".5rem", paddingLeft: ".5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <span style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 800, fontSize: ".95rem", color: meta.color }}>
              #{block.index}
            </span>
            {isLatest && (
              <span style={{ fontSize: ".6rem", background: "rgba(0,255,136,.15)", border: "1px solid rgba(0,255,136,.3)", color: "var(--c2)", padding: "1px 7px", borderRadius: 10, letterSpacing: ".06em" }}>
                LATEST
              </span>
            )}
            {block.index === 0 && (
              <span style={{ fontSize: ".6rem", background: "rgba(168,85,247,.15)", border: "1px solid rgba(168,85,247,.3)", color: "var(--c5)", padding: "1px 7px", borderRadius: 10, letterSpacing: ".06em" }}>
                GENESIS
              </span>
            )}
          </div>
          <div style={{ fontSize: ".68rem", color: "var(--muted)", marginTop: ".15rem" }}>
            {new Date(block.timestamp).toLocaleString()} · {ageStr}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: ".72rem", color: "var(--muted2)" }}>
            {block.transactions.length} tx{block.transactions.length !== 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: ".65rem", color: "var(--muted)", marginTop: ".1rem" }}>
            nonce: {block.nonce}
          </div>
        </div>
      </div>

      {/* Hash preview */}
      <div style={{ paddingLeft: ".5rem" }}>
        <div style={{ fontSize: ".65rem", color: "var(--muted)", marginBottom: ".2rem" }}>BLOCK HASH</div>
        <code style={{ fontSize: ".68rem", color: "var(--c1)", wordBreak: "break-all", lineHeight: 1.4 }}>
          <span style={{ color: "var(--c2)", fontWeight: 700 }}>{block.hash.slice(0, 4)}</span>{block.hash.slice(4, 20)}...
        </code>
      </div>

      {/* Transaction previews */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginTop: ".6rem", paddingLeft: ".5rem" }}>
        {block.transactions.slice(0, 3).map((tx, i) => {
          const m = TX_META[tx.type] || TX_META.CHAIN_INITIALIZED;
          return (
            <span key={i} style={{ fontSize: ".62rem", padding: "1px 7px", borderRadius: 10, border: `1px solid ${m.color}33`, color: m.color, background: `${m.color}11` }}>
              {m.icon} {m.label}
            </span>
          );
        })}
        {block.transactions.length > 3 && (
          <span style={{ fontSize: ".62rem", color: "var(--muted)", padding: "1px 7px" }}>+{block.transactions.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

// ─── Block Detail Panel ───────────────────────────────────────────

function BlockDetail({ block, onClose }) {
  if (!block) return null;

  const fields = [
    ["Block Index",    block.index],
    ["Timestamp",      new Date(block.timestamp).toLocaleString()],
    ["Unix Time",      block.timestamp],
    ["Nonce",          block.nonce],
    ["Transactions",   block.transactions.length],
  ];

  return (
    <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, fontSize: ".82rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--c1)" }}>
          ⛓ Block #{block.index} Details
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* Key-value fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem", marginBottom: "1rem" }}>
          {fields.map(([k, v]) => (
            <div key={k} style={{ background: "var(--s2)", borderRadius: 6, padding: ".5rem .75rem" }}>
              <div style={{ fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>{k}</div>
              <div style={{ fontSize: ".78rem", marginTop: ".2rem" }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Hashes */}
        <div style={{ marginBottom: "1rem" }}>
          {[
            { label: "Block Hash",       val: block.hash,         color: "var(--c1)" },
            { label: "Previous Hash",    val: block.previousHash, color: "var(--muted2)" },
            { label: "Merkle Root",      val: block.merkleRoot,   color: "var(--c5)" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ marginBottom: ".625rem" }}>
              <div style={{ fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".2rem" }}>{label}</div>
              <code style={{ fontSize: ".68rem", color, wordBreak: "break-all", lineHeight: 1.5, background: "var(--s2)", padding: ".4rem .625rem", borderRadius: 6, display: "block" }}>
                {val}
              </code>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div style={{ fontSize: ".72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".625rem" }}>
          Transactions ({block.transactions.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          {block.transactions.map((tx, i) => {
            const m = TX_META[tx.type] || TX_META.CHAIN_INITIALIZED;
            return (
              <div key={i} style={{ background: "var(--s2)", borderRadius: 8, padding: ".75rem 1rem", borderLeft: `3px solid ${m.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem" }}>
                  <span style={{ fontSize: ".75rem", color: m.color, fontWeight: 600 }}>{m.icon} {m.label}</span>
                  <span style={{ fontSize: ".65rem", color: "var(--muted)" }}>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: ".72rem", color: "var(--muted2)", marginBottom: ".3rem" }}>{tx.description}</div>
                {tx.noteId !== "GENESIS" && (
                  <div style={{ fontSize: ".65rem", color: "var(--muted)" }}>
                    Note ID: <code style={{ color: "var(--c1)" }}>{tx.noteId}</code>
                  </div>
                )}
                <div style={{ fontSize: ".62rem", color: "var(--muted)", marginTop: ".3rem" }}>
                  Data Hash: <code style={{ color: "var(--muted2)" }}>{tx.dataHash?.slice(0, 32)}...</code>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Chain Visualizer ─────────────────────────────────────────────

function ChainVisualizer({ chain, onSelectBlock }) {
  const visible = chain.slice(-8).reverse(); // show last 8 blocks

  return (
    <div style={{ overflowX: "auto", padding: ".5rem 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, minWidth: "max-content" }}>
        {visible.map((block, i) => {
          const meta = TX_META[block.transactions[0]?.type] || TX_META.CHAIN_INITIALIZED;
          return (
            <div key={block.index} style={{ display: "flex", alignItems: "center" }}>
              {/* Connector arrow (not for last/leftmost) */}
              {i < visible.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", color: "var(--border2)", fontSize: "1.1rem", padding: "0 .25rem" }}>
                  ←
                </div>
              )}
              {/* Block node */}
              <div
                onClick={() => onSelectBlock(block)}
                style={{ width: 80, textAlign: "center", cursor: "pointer", transition: "transform .15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}
              >
                <div style={{ width: 56, height: 56, margin: "0 auto", background: "var(--s2)", border: `2px solid ${block.index === visible[0].index ? "var(--c1)" : "var(--border2)"}`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: block.index === visible[0].index ? "0 0 12px rgba(0,212,255,.3)" : "none" }}>
                  <span style={{ fontSize: "1.1rem" }}>{meta.icon}</span>
                  <span style={{ fontSize: ".55rem", color: "var(--muted)", marginTop: ".1rem" }}>#{block.index}</span>
                </div>
                <div style={{ fontSize: ".58rem", color: "var(--muted)", marginTop: ".3rem", wordBreak: "break-all" }}>
                  {block.hash.slice(0, 8)}...
                </div>
              </div>
            </div>
          );
        })}

        {chain.length > 8 && (
          <div style={{ display: "flex", alignItems: "center", paddingLeft: ".5rem" }}>
            <div style={{ color: "var(--muted)", fontSize: ".68rem" }}>← +{chain.length - 8} more</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function BlockchainPage() {
  const [chain, setChain]             = useState([]);
  const [tab, setTab]                 = useState("explorer");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [verifyResult, setVerifyResult]   = useState(null);
  const [verifying, setVerifying]         = useState(false);
  const [certNoteId, setCertNoteId]       = useState("");
  const [certResult, setCertResult]       = useState(null);
  const [stats, setStats]                 = useState(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [tamperBlockIndex, setTamperBlockIndex] = useState("");
  const [tamperDescription, setTamperDescription] = useState("TAMPERED: This data was modified!");

  const refresh = useCallback(() => {
    const c = loadChain();
    setChain(c);
    setStats(getChainStats());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Chain Verification ─────────────────────────────────────────
  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyChain();
      setVerifyResult(result);
    } catch (e) {
      setVerifyResult({ valid: false, errors: [e.message], checkedBlocks: 0 });
    }
    setVerifying(false);
  };

  // ── Certificate Lookup ────────────────────────────────────────
  const handleCertLookup = async () => {
    if (!certNoteId.trim()) return;
    const q = certNoteId.trim().toLowerCase();
    const blocks = chain.filter((b) =>
      b.transactions.some((tx) => tx.noteId?.toLowerCase().includes(q))
    );
    if (blocks.length === 0) {
      setCertResult({ found: false });
    } else {
      const txs = blocks.flatMap((b) =>
        b.transactions
          .filter((tx) => tx.noteId?.toLowerCase().includes(q))
          .map((tx) => ({ ...tx, blockIndex: b.index, blockHash: b.hash }))
      );
      setCertResult({ found: true, txs, blocks });
    }
  };

  // ── Tampering Simulation ───────────────────────────────────────
  const handleSimulateTamper = () => {
    const index = parseInt(tamperBlockIndex);
    if (isNaN(index) || index < 0 || index >= chain.length) {
      alert(`Please enter a valid block index between 0 and ${chain.length - 1}`);
      return;
    }
    if (!tamperDescription.trim()) {
      alert("Please enter a description for the tampered data");
      return;
    }

    const success = simulateTampering(index, tamperDescription.trim());
    if (success) {
      refresh(); // Reload the chain to show changes
      setVerifyResult(null); // Clear previous verification results
      alert(`✅ Block #${index} has been tampered with!\n\nThe transaction description was changed to: "${tamperDescription.trim()}"\n\nNow run the verification to see how the entire chain becomes invalid.`);
    } else {
      alert("Failed to tamper with the block. It may not have any transactions.");
    }
  };

  // ── Reset Chain ─────────────────────────────────────────────────
  const handleResetChain = async () => {
    if (!confirm("This will reset the blockchain to its initial state, clearing all transaction history. Continue?")) return;
    await resetChainForDemo();
    refresh();
    setVerifyResult(null);
    setSelectedBlock(null);
    setTamperBlockIndex("");
    alert("✅ Blockchain has been reset to genesis state.");
  };

  // ── Filtered chain for explorer ───────────────────────────────
  const filteredChain = searchQuery
    ? chain.filter((b) =>
        b.hash.includes(searchQuery) ||
        b.transactions.some((tx) =>
          tx.noteId?.includes(searchQuery) ||
          tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.type?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : chain;

  const displayChain = [...filteredChain].reverse(); // newest first

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <p style={{ color: "var(--muted)", marginTop: "1rem", fontSize: ".8rem" }}>Loading blockchain...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))" }}>
        {[
          { val: stats.blockCount,  label: "Total Blocks",    color: "var(--c1)", icon: "⛓" },
          { val: stats.txCount,     label: "Transactions",    color: "var(--c2)", icon: "📋" },
          { val: stats.noteCreated, label: "Notes Created",   color: "var(--c5)", icon: "➕" },
          { val: stats.noteViewed,  label: "Notes Viewed",    color: "var(--c2)", icon: "👁" },
          { val: stats.noteDeleted, label: "Notes Deleted",   color: "var(--c3)", icon: "🗑" },
          { val: stats.authFailed,  label: "Auth Failures",   color: "var(--c4)", icon: "⚠️" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="stat-val" style={{ color: s.color, fontSize: "1.75rem" }}>{s.val}</div>
              <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chain visualizer */}
      {chain.length > 0 && (
        <div className="card mb-2">
          <div className="card-header">
            <span className="card-title">⛓ Chain Visualization (newest → oldest)</span>
            <span className="badge badge-cyan">{chain.length} blocks</span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <ChainVisualizer chain={chain} onSelectBlock={setSelectedBlock} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: "explorer",  label: "🔍 Block Explorer" },
          { id: "verify",    label: "✅ Verify Integrity" },
          { id: "certificate", label: "📜 Note Certificate" },
          { id: "howit",     label: "📚 How It Works" },
        ].map((t) => (
          <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── Explorer Tab ── */}
      {tab === "explorer" && (
        <div className="fade-in">
          <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Search by hash, note ID, or transaction type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-ghost btn-sm" onClick={refresh}>↺ Refresh</button>
          </div>

          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Block list */}
            <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
              {displayChain.length === 0 ? (
                <div className="card"><div className="card-body"><div className="empty"><span className="empty-icon">⛓</span><div className="empty-title">No blocks found</div><div className="empty-text">The chain is empty or your search returned no results</div></div></div></div>
              ) : (
                displayChain.map((block) => (
                  <BlockCard
                    key={block.index}
                    block={block}
                    isLatest={block.index === chain.length - 1}
                    selected={selectedBlock?.index === block.index}
                    onClick={() => setSelectedBlock(selectedBlock?.index === block.index ? null : block)}
                  />
                ))
              )}
            </div>

            {/* Detail panel */}
            <div style={{ position: "sticky", top: "80px" }}>
              {selectedBlock ? (
                <BlockDetail block={selectedBlock} onClose={() => setSelectedBlock(null)} />
              ) : (
                <div className="card">
                  <div className="card-body" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                    <div style={{ fontSize: "2rem", marginBottom: ".75rem", opacity: .4 }}>⛓</div>
                    <div style={{ fontFamily: "Space Grotesk,sans-serif", fontWeight: 700, color: "var(--muted2)", marginBottom: ".4rem" }}>Select a Block</div>
                    <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>Click any block to view its transactions, hashes, and Merkle root</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Verify Tab ── */}
      {tab === "verify" && (
        <div className="fade-in">
          <div className="card mb-2">
            <div className="card-header"><span className="card-title">✅ Chain Integrity Verifier</span></div>
            <div className="card-body">
              <p style={{ fontSize: ".82rem", color: "var(--muted2)", lineHeight: 1.75, marginBottom: "1.25rem" }}>
                This verifier re-computes every block hash from scratch using SHA-256, checks that each block correctly references its predecessor's hash, validates the Proof-of-Work, and verifies the Merkle root of each block's transactions. Any tampering with the stored chain will be immediately detected.
              </p>

              <div style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".75rem", fontSize: ".78rem" }}>
                  {[
                    { label: "Blocks to verify", val: chain.length },
                    { label: "Difficulty target", val: `${"0".repeat(2)}...` },
                    { label: "Algorithm", val: "SHA-256" },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div style={{ color: "var(--muted)", fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".2rem" }}>{label}</div>
                      <div style={{ color: "var(--c1)" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleVerify} disabled={verifying || chain.length === 0}>
                {verifying ? <><span className="spinner" /> Verifying {chain.length} blocks...</> : "🔍 Run Full Chain Verification"}
              </button>

              {/* Tampering Simulation */}
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255,193,7,.05)", border: "1px solid rgba(255,193,7,.2)", borderRadius: 8 }}>
                <div style={{ fontSize: ".82rem", fontWeight: 600, color: "#ffb300", marginBottom: ".75rem" }}>
                  🧪 Tampering Demonstration
                </div>
                <p style={{ fontSize: ".75rem", color: "var(--muted2)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Simulate what happens when an attacker tries to modify blockchain data. Change a transaction in any block, then run verification to see how the entire chain becomes invalid.
                </p>

                <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-end", marginBottom: ".75rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: ".7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: ".3rem" }}>
                      Block Index to Tamper
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max={chain.length - 1}
                      value={tamperBlockIndex}
                      onChange={(e) => setTamperBlockIndex(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: ".7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: ".3rem" }}>
                      New Description
                    </label>
                    <input
                      type="text"
                      placeholder="TAMPERED: This data was modified!"
                      value={tamperDescription}
                      onChange={(e) => setTamperDescription(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleSimulateTamper}
                    disabled={chain.length === 0}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    ⚠️ Tamper & Break Chain
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleResetChain}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    🔄 Reset Chain
                  </button>
                </div>

                <div style={{ fontSize: ".7rem", color: "var(--muted)", lineHeight: 1.5 }}>
                  <strong>How it works:</strong> This changes the transaction data but keeps the old hash. When you verify, SHA-256 will detect the mismatch, proving the chain's immutability.
                </div>
              </div>

              {verifyResult && (
                <div style={{ marginTop: "1.25rem" }}>
                  <div className={`alert ${verifyResult.valid ? "alert-success" : "alert-danger"}`}>
                    <span className="alert-icon">{verifyResult.valid ? "✅" : "❌"}</span>
                    <div>
                      <strong>{verifyResult.valid ? "Chain is valid and untampered" : "Chain integrity violation detected!"}</strong>
                      <div style={{ marginTop: ".3rem", fontSize: ".75rem" }}>
                        Verified {verifyResult.checkedBlocks} blocks · {verifyResult.errors.length} error(s)
                      </div>
                    </div>
                  </div>

                  {verifyResult.errors.length > 0 && (
                    <div style={{ marginTop: ".75rem", display: "flex", flexDirection: "column", gap: ".4rem" }}>
                      {verifyResult.errors.map((e, i) => (
                        <div key={i} style={{ background: "rgba(255,64,96,.08)", border: "1px solid rgba(255,64,96,.2)", borderRadius: 6, padding: ".625rem .875rem", fontSize: ".75rem", color: "#ff8099" }}>
                          {e}
                        </div>
                      ))}
                    </div>
                  )}

                  {verifyResult.valid && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: ".75rem", marginTop: ".75rem" }}>
                      {[
                        { label: "Hash Validity",      status: "✓ All hashes match" },
                        { label: "Chain Linkage",       status: "✓ All prev-hashes valid" },
                        { label: "Proof-of-Work",       status: "✓ Difficulty met" },
                        { label: "Merkle Roots",        status: "✓ All roots verified" },
                      ].map(({ label, status }) => (
                        <div key={label} style={{ background: "rgba(0,255,136,.05)", border: "1px solid rgba(0,255,136,.2)", borderRadius: 6, padding: ".625rem .875rem" }}>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
                          <div style={{ fontSize: ".75rem", color: "var(--c2)", marginTop: ".2rem" }}>{status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Latest block info */}
          {stats.latestBlock && (
            <div className="card">
              <div className="card-header"><span className="card-title">🔗 Latest Block</span></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                  {[
                    ["Index",       stats.latestBlock.index],
                    ["Nonce",       stats.latestBlock.nonce],
                    ["Transactions", stats.latestBlock.transactions.length],
                    ["Mined at",    new Date(stats.latestBlock.timestamp).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: "var(--s2)", borderRadius: 6, padding: ".5rem .75rem" }}>
                      <div style={{ fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>{k}</div>
                      <div style={{ fontSize: ".78rem", marginTop: ".2rem" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: ".75rem" }}>
                  <div style={{ fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: ".3rem" }}>Block Hash</div>
                  <code style={{ fontSize: ".7rem", color: "var(--c1)", wordBreak: "break-all", background: "var(--s2)", padding: ".5rem .75rem", borderRadius: 6, display: "block", lineHeight: 1.6 }}>
                    {stats.latestBlock.hash}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Certificate Tab ── */}
      {tab === "certificate" && (
        <div className="fade-in">
          <div className="card mb-2">
            <div className="card-header"><span className="card-title">📜 Note Blockchain Certificate</span></div>
            <div className="card-body">
              <p style={{ fontSize: ".82rem", color: "var(--muted2)", lineHeight: 1.75, marginBottom: "1.25rem" }}>
                Every note action (creation, viewing, deletion) is anchored on the blockchain. Enter a Note ID to retrieve its complete on-chain history — a cryptographic certificate proving when it was created, who accessed it, and when it was destroyed.
              </p>

              <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Enter note ID (first 8 characters)..."
                  value={certNoteId}
                  onChange={(e) => setCertNoteId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCertLookup()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={handleCertLookup} disabled={!certNoteId.trim()}>
                  🔍 Lookup
                </button>
              </div>

              {certResult && !certResult.found && (
                <div className="alert alert-warn">
                  <span className="alert-icon">🔍</span>
                  No blockchain records found for this Note ID. The note may not exist or was created before the chain was initialized.
                </div>
              )}

              {certResult?.found && (
                <div className="fade-in">
                  <div className="alert alert-success mb-2">
                    <span className="alert-icon">✅</span>
                    <span>Found {certResult.txs.length} blockchain record(s) for this note ID across {certResult.blocks.length} block(s).</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                    {certResult.txs.map((tx, i) => {
                      const m = TX_META[tx.type] || TX_META.CHAIN_INITIALIZED;
                      return (
                        <div key={i} style={{ background: "var(--s2)", border: `1px solid ${m.color}33`, borderRadius: 8, padding: "1rem 1.25rem", borderLeft: `3px solid ${m.color}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
                            <span style={{ color: m.color, fontWeight: 600, fontSize: ".82rem" }}>{m.icon} {m.label}</span>
                            <span style={{ fontSize: ".68rem", color: "var(--muted)" }}>Block #{tx.blockIndex}</span>
                          </div>
                          <div style={{ fontSize: ".75rem", color: "var(--muted2)", marginBottom: ".5rem" }}>{tx.description}</div>
                          <div style={{ fontSize: ".65rem", color: "var(--muted)", lineHeight: 1.8 }}>
                            <div>Timestamp: <span style={{ color: "var(--text)" }}>{new Date(tx.timestamp).toLocaleString()}</span></div>
                            <div>Data Hash: <code style={{ color: "var(--c1)" }}>{tx.dataHash}</code></div>
                            <div>Block Hash: <code style={{ color: "var(--muted2)" }}>{tx.blockHash?.slice(0, 32)}...</code></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── How It Works Tab ── */}
      {tab === "howit" && (
        <div className="fade-in">
          {[
            {
              icon: "⛓",
              title: "What is the Blockchain doing here?",
              body: "SecureVault uses a SHA-256 chained ledger as a tamper-evident audit trail. Every note lifecycle event — creation, viewing, expiry, deletion, and failed authentication — is recorded as an immutable transaction inside a block. This provides non-repudiation: it is cryptographically provable that an event occurred at a specific time and in a specific order.",
            },
            {
              icon: "🔨",
              title: "Proof-of-Work (Mining)",
              body: "Each block must be 'mined' before being added to the chain. Mining means finding a nonce value such that SHA-256(block_data + nonce) produces a hash beginning with the required number of leading zeros (difficulty = 2). This makes retroactive tampering expensive: changing any historical block would require re-mining it and every subsequent block.",
            },
            {
              icon: "🌿",
              title: "Merkle Tree Verification",
              body: "Transactions within each block are organized into a Merkle tree. Pairs of transaction hashes are repeatedly hashed together until a single 'Merkle root' remains. This root is stored in the block header. Verifying a single transaction only requires O(log n) hashes, and any change to any transaction will produce a different Merkle root — instantly detectable.",
            },
            {
              icon: "🔗",
              title: "Hash Chaining",
              body: "Every block stores the hash of its predecessor (previousHash). This chains the blocks together: changing Block 5 changes its hash, which breaks Block 6's previousHash reference, which breaks Block 7, and so on. The only way to tamper undetected would be to re-mine the entire chain from the tampered block forward — computationally infeasible for long chains.",
            },
            {
              icon: "📜",
              title: "Note Integrity Certificates",
              body: "When a note is created, its metadata is hashed (SHA-256) and stored as a 'dataHash' in the blockchain transaction. This creates a cryptographic certificate: the note's existence and creation time are immutably anchored on-chain. Even if the note is later deleted, its blockchain record proves it existed. Recipients can verify the note's authenticity against the chain.",
            },
            {
              icon: "🆚",
              title: "Why not Ethereum / Bitcoin?",
              body: "This is a simulated local blockchain for demonstration purposes, which is appropriate for a capstone project. In a production deployment, note hashes could be anchored to Ethereum or a permissioned chain like Hyperledger Fabric. The local chain demonstrates all the core concepts: PoW, Merkle trees, hash chaining, and transaction immutability — without requiring external network infrastructure or gas fees.",
            },
          ].map((s) => (
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
