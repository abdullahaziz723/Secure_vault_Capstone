import { useState, useEffect } from "react";
import { CSS } from "./styles/styles";
import { useHash, useNotes } from "./hooks/hooks";
import { getAudit } from "./utils/store";
import { initChain, loadChain } from "./utils/blockchain";
import { getThreatStats } from "./utils/threatDetection";

import Sidebar          from "./components/Sidebar";
import Topbar           from "./components/Topbar";
import DashboardPage    from "./pages/DashboardPage";
import CreatePage       from "./pages/CreatePage";
import NotesPage        from "./pages/NotesPage";
import AuditPage        from "./pages/AuditPage";
import SecurityPage     from "./pages/SecurityPage";
import SettingsPage     from "./pages/SettingsPage";
import ViewPage         from "./pages/ViewPage";
import BlockchainPage   from "./pages/BlockchainPage";
import ThreatPage       from "./pages/ThreatPage";

export default function App() {
  const hash                          = useHash();
  const [page, setPage]               = useState("dashboard");
  const [noteId, setNoteId]           = useState(null);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [notes, refreshNotes]         = useNotes();
  const [audit, setAudit]             = useState([]);
  const [chainReady, setChainReady]   = useState(false);
  const [chainBlocks, setChainBlocks] = useState(0);
  const [threatStats, setThreatStats] = useState(null);

  useEffect(() => {
    initChain().then((chain) => {
      setChainBlocks(chain.length);
      setChainReady(true);
    });
  }, []);

  useEffect(() => {
    setAudit(getAudit());
    setChainBlocks(loadChain().length);
    setThreatStats(getThreatStats());
  }, [page]);

  useEffect(() => {
    if (hash.startsWith("#/note/")) {
      const parts = hash.replace("#/note/", "").split("?");
      setNoteId(parts[0]);
      setPage("view");
    } else if (hash === "#/create")     { setPage("create"); }
    else if (hash === "#/blockchain")   { setPage("blockchain"); }
    else if (hash === "#/threats")      { setPage("threats"); }
    else { setPage("dashboard"); setNoteId(null); }
  }, [hash]);

  const navigate = (p) => {
    if (p === "view") return;
    const hashRoutes = { dashboard: "", create: "/create", blockchain: "/blockchain", threats: "/threats" };
    if (hashRoutes.hasOwnProperty(p)) {
      window.location.hash = hashRoutes[p];
    }
    setPage(p);
    setMobileOpen(false);
  };

  const refreshChain = () => {
    console.log('refreshChain called in App.jsx');
    setChainBlocks(loadChain().length);
    setThreatStats(getThreatStats());
  };

  if (!chainReady) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:"1rem" }}>
          <div className="spinner" style={{ width:40, height:40, borderWidth:3 }} />
          <div style={{ color:"var(--muted)", fontSize:".82rem" }}>Initializing secure systems...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="layout">
        {mobileOpen && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:99 }} onClick={() => setMobileOpen(false)} />
        )}
        <Sidebar
          page={page} navigate={navigate} notes={notes} audit={audit}
          chainBlocks={chainBlocks} mobileOpen={mobileOpen}
          activeThreats={threatStats?.activeThreats || 0}
        />
        <div className="main">
          <Topbar page={page} navigate={navigate} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
          <div className="content fade-in">
            {page === "dashboard"  && <DashboardPage notes={notes} audit={audit} navigate={navigate} chainBlocks={chainBlocks} threatStats={threatStats} />}
            {page === "create"     && <CreatePage refreshNotes={refreshNotes} refreshChain={refreshChain} />}
            {page === "notes"      && <NotesPage notes={notes} refreshNotes={refreshNotes} refreshChain={refreshChain} />}
            {page === "audit"      && <AuditPage audit={audit} />}
            {page === "security"   && <SecurityPage />}
            {page === "settings"   && <SettingsPage />}
            {page === "blockchain" && <BlockchainPage />}
            {page === "threats"    && <ThreatPage />}
            {page === "view"       && <ViewPage noteId={noteId} refreshChain={refreshChain} />}
          </div>
        </div>
      </div>
    </>
  );
}
