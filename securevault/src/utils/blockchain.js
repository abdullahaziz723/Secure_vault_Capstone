// ═══════════════════════════════════════════════════════════════════
// blockchain.js — Tamper-Evident Blockchain Audit Ledger
//
// PURPOSE:
//   Every sensitive action (note created, viewed, deleted) is recorded
//   as a transaction inside a SHA-256 chained block. The chain is
//   immutable — altering any block breaks all subsequent hashes,
//   making tampering immediately detectable.
//
// ARCHITECTURE:
//   Genesis Block → Block 1 → Block 2 → ... → Block N
//   Each block contains: index, timestamp, transactions[],
//                        previousHash, nonce, hash
//
// CONSENSUS: Proof-of-Work (difficulty 2) — keeps the demo fast
//            while demonstrating the real PoW concept.
//
// STORAGE: localStorage key "sv_chain_v1"
// ═══════════════════════════════════════════════════════════════════

const CHAIN_KEY  = "sv_chain_v1";
const DIFFICULTY = 2; // leading zeros required in block hash

// ─── Transaction Metadata ──────────────────────────────────────────

/**
 * Metadata for each transaction type, used for UI display.
 */
export const TX_META = {
  CHAIN_INITIALIZED: { icon: "⛓", label: "Chain Initialized", color: "var(--c1)" },
  NOTE_CREATED:      { icon: "➕", label: "Note Created",      color: "var(--c5)" },
  NOTE_VIEWED:       { icon: "👁", label: "Note Viewed",       color: "var(--c2)" },
  NOTE_DELETED:      { icon: "🗑", label: "Note Deleted",      color: "var(--c3)" },
  NOTE_EXPIRED:      { icon: "⏰", label: "Note Expired",      color: "var(--c4)" },
  AUTH_FAILED:       { icon: "⚠️", label: "Auth Failed",       color: "var(--c4)" },
};

// ─── Hashing ─────────────────────────────────────────────────────

/**
 * Computes SHA-256 hash of a string and returns hex string.
 * Uses Web Crypto API — same as the encryption engine.
 * @param {string} data
 * @returns {Promise<string>}
 */
export async function sha256(data) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Block Structure ──────────────────────────────────────────────

/**
 * @typedef {Object} Transaction
 * @property {string} type        - 'NOTE_CREATED' | 'NOTE_VIEWED' | 'NOTE_DELETED' | 'NOTE_EXPIRED' | 'AUTH_FAILED'
 * @property {string} noteId      - Truncated note ID
 * @property {string} description - Human-readable description
 * @property {string} dataHash    - SHA-256 of note metadata (proves integrity)
 * @property {number} timestamp
 */

/**
 * @typedef {Object} Block
 * @property {number}        index
 * @property {number}        timestamp
 * @property {Transaction[]} transactions
 * @property {string}        previousHash
 * @property {number}        nonce
 * @property {string}        hash
 * @property {string}        merkleRoot   - Merkle root of transactions
 */

// ─── Merkle Root ─────────────────────────────────────────────────

/**
 * Computes a simple Merkle root from an array of transaction hashes.
 * Demonstrates the Merkle tree concept used in Bitcoin/Ethereum.
 * @param {Transaction[]} txs
 * @returns {Promise<string>}
 */
export async function computeMerkleRoot(txs) {
  if (txs.length === 0) return await sha256("empty");

  let hashes = await Promise.all(
    txs.map((tx) => sha256(JSON.stringify(tx)))
  );

  // Reduce pairs until single root remains
  while (hashes.length > 1) {
    const next = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left  = hashes[i];
      const right = hashes[i + 1] || left; // duplicate last if odd count
      next.push(await sha256(left + right));
    }
    hashes = next;
  }

  return hashes[0];
}

// ─── Block Mining (Proof of Work) ─────────────────────────────────

/**
 * Mines a block by finding a nonce such that hash starts with
 * DIFFICULTY leading zeros. Demonstrates Proof-of-Work.
 * @param {number}        index
 * @param {number}        timestamp
 * @param {Transaction[]} transactions
 * @param {string}        previousHash
 * @param {string}        merkleRoot
 * @returns {Promise<{nonce: number, hash: string}>}
 */
async function mineBlock(index, timestamp, transactions, previousHash, merkleRoot) {
  const prefix = "0".repeat(DIFFICULTY);
  let nonce = 0;

  while (true) {
    const content = JSON.stringify({ index, timestamp, transactions, previousHash, merkleRoot, nonce });
    const hash = await sha256(content);
    if (hash.startsWith(prefix)) return { nonce, hash };
    nonce++;
    // Yield to browser every 100 iterations to avoid blocking UI
    if (nonce % 100 === 0) await new Promise((r) => setTimeout(r, 0));
  }
}

// ─── Block Hash Verification ──────────────────────────────────────

/**
 * Recomputes the hash of a block for verification.
 * @param {Block} block
 * @returns {Promise<string>}
 */
export async function computeBlockHash(block) {
  const { index, timestamp, transactions, previousHash, merkleRoot, nonce } = block;

  // Handle legacy blocks that might not have merkleRoot
  const dataToHash = {
    index,
    timestamp,
    transactions,
    previousHash,
    nonce,
    ...(merkleRoot && { merkleRoot }) // Only include if it exists
  };

  return sha256(JSON.stringify(dataToHash));
}

// ─── Genesis Block ────────────────────────────────────────────────

/**
 * Creates the genesis (first) block of the chain.
 * Contains a single "CHAIN_INITIALIZED" transaction.
 * @returns {Promise<Block>}
 */
async function createGenesisBlock() {
  const transactions = [
    {
      type: "CHAIN_INITIALIZED",
      noteId: "GENESIS",
      description: "SecureVault blockchain ledger initialized",
      dataHash: await sha256("SecureVault::Genesis::v2"),
      timestamp: Date.now(),
    },
  ];
  const timestamp   = Date.now();
  const merkleRoot  = await computeMerkleRoot(transactions);
  const { nonce, hash } = await mineBlock(0, timestamp, transactions, "0".repeat(64), merkleRoot);

  return {
    index: 0,
    timestamp,
    transactions,
    previousHash: "0".repeat(64),
    nonce,
    hash,
    merkleRoot,
  };
}

// ─── Chain Persistence ────────────────────────────────────────────

/** @returns {Block[]} */
export function loadChain() {
  try {
    return JSON.parse(localStorage.getItem(CHAIN_KEY) || "null") || [];
  } catch {
    return [];
  }
}

/** @param {Block[]} chain */
export function saveChain(chain) {
  localStorage.setItem(CHAIN_KEY, JSON.stringify(chain));
}

/** Wipes the chain (used in Settings → danger zone) */
export function clearChain() {
  localStorage.removeItem(CHAIN_KEY);
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Initializes the blockchain. Creates genesis block if chain is empty.
 * Call this once on app startup.
 * @returns {Promise<Block[]>}
 */
export async function initChain() {
  let chain = loadChain();
  if (chain.length === 0) {
    const genesis = await createGenesisBlock();
    chain = [genesis];
    saveChain(chain);
  }
  return chain;
}

/**
 * Adds a new block containing one or more transactions.
 * Each block is mined with Proof-of-Work before being appended.
 *
 * @param {Omit<Transaction, 'timestamp'>[]} transactions
 * @returns {Promise<Block>} The newly mined block
 */
export async function addBlock(transactions) {
  const chain = loadChain();
  const previous = chain[chain.length - 1];

  const txsWithTime = transactions.map((tx) => ({
    ...tx,
    timestamp: Date.now(),
  }));

  const index      = chain.length;
  const timestamp  = Date.now();
  const merkleRoot = await computeMerkleRoot(txsWithTime);
  const { nonce, hash } = await mineBlock(
    index, timestamp, txsWithTime, previous.hash, merkleRoot
  );

  const block = {
    index,
    timestamp,
    transactions: txsWithTime,
    previousHash: previous.hash,
    nonce,
    hash,
    merkleRoot,
  };

  chain.push(block);
  saveChain(chain);
  return block;
}

/**
 * Records a single note action as a new blockchain transaction.
 * Convenience wrapper around addBlock().
 *
 * @param {'NOTE_CREATED'|'NOTE_VIEWED'|'NOTE_DELETED'|'NOTE_EXPIRED'|'AUTH_FAILED'} type
 * @param {string} noteId
 * @param {string} description
 * @param {Object} metadata   - Any additional data to hash into the transaction
 * @returns {Promise<Block>}
 */
export async function recordTransaction(type, noteId, description, metadata = {}) {
  const dataHash = await sha256(JSON.stringify({ noteId, ...metadata, ts: Date.now() }));
  return addBlock([{ type, noteId, description, dataHash }]);
}

/**
 * Verifies the entire chain for integrity.
 * Checks: hash validity, previousHash linkage, PoW compliance.
 *
 * @returns {Promise<{valid: boolean, errors: string[], checkedBlocks: number}>}
 */
export async function verifyChain() {
  const chain = loadChain();
  const errors = [];

  console.log(`Verifying chain with ${chain.length} blocks`);

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    console.log(`Verifying block ${i}:`, block);

    try {
      // 1. Verify block hash
      const recomputed = await computeBlockHash(block);
      console.log(`Block ${i} hash check: stored=${block.hash}, computed=${recomputed}`);
      if (recomputed !== block.hash) {
        errors.push(`Block ${i}: Hash mismatch — expected ${block.hash.slice(0, 12)}... got ${recomputed.slice(0, 12)}...`);
      }

      // 2. Verify Proof-of-Work
      if (!block.hash.startsWith("0".repeat(DIFFICULTY))) {
        errors.push(`Block ${i}: Proof-of-Work invalid — hash does not meet difficulty ${DIFFICULTY}`);
      }

      // 3. Verify chain linkage (skip genesis)
      if (i > 0 && block.previousHash !== chain[i - 1].hash) {
        errors.push(`Block ${i}: Previous hash mismatch — chain is broken at this block`);
      }

      // 4. Verify Merkle root (only for blocks that have it)
      if (block.merkleRoot) {
        const merkle = await computeMerkleRoot(block.transactions);
        console.log(`Block ${i} merkle check: stored=${block.merkleRoot}, computed=${merkle}`);
        if (merkle !== block.merkleRoot) {
          errors.push(`Block ${i}: Merkle root mismatch — transaction data may have been tampered`);
        }
      }
    } catch (error) {
      console.error(`Error verifying block ${i}:`, error);
      errors.push(`Block ${i}: Verification failed — ${error.message}`);
    }
  }

  const result = {
    valid: errors.length === 0,
    errors,
    checkedBlocks: chain.length,
  };

  console.log('Verification result:', result);
  return result;
}

/**
 * Returns summary statistics about the chain.
 */
export function getChainStats() {
  const chain = loadChain();
  const allTxs = chain.flatMap((b) => b.transactions);
  return {
    blockCount: chain.length,
    txCount: allTxs.length,
    noteCreated: allTxs.filter((t) => t.type === "NOTE_CREATED").length,
    noteViewed:  allTxs.filter((t) => t.type === "NOTE_VIEWED").length,
    noteDeleted: allTxs.filter((t) => t.type === "NOTE_DELETED").length,
    authFailed:  allTxs.filter((t) => t.type === "AUTH_FAILED").length,
    latestBlock: chain[chain.length - 1] || null,
  };
}

/**
 * SIMULATION: Tamper with a specific block by changing its transaction data.
 * This demonstrates how tampering breaks the entire chain.
 * @param {number} blockIndex - Index of block to tamper with
 * @param {string} newDescription - New description to inject
 * @returns {boolean} - True if tampering was successful
 */
export function simulateTampering(blockIndex, newDescription) {
  const chain = loadChain();
  if (blockIndex < 0 || blockIndex >= chain.length) return false;

  // Tamper with the block's first transaction
  if (chain[blockIndex].transactions.length > 0) {
    chain[blockIndex].transactions[0].description = newDescription;
    // Note: We don't recompute the hash here - that's the point!
    // The stored hash is now invalid because the data changed.
    saveChain(chain);
    return true;
  }
  return false;
}

/**
 * Reset the blockchain to a clean state (for demonstration purposes).
 * Recreates the genesis block and clears all other blocks.
 */
export async function resetChainForDemo() {
  clearChain();
  await initChain();
}
