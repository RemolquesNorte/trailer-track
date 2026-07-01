import { useState, useEffect, useCallback } from "react";

// ── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://dhksanhrzjiwtultfetp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pByYqUdxfQbGtL9LNOpIog_xQ3GgRQz";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Constants ────────────────────────────────────────────────────────────────
const STATIONS = [
  { id: "cutting",    label: "Cutting",       icon: "✂️",  color: "#E67E22" },
  { id: "welding",    label: "Welding",        icon: "🔥",  color: "#E74C3C" },
  { id: "framing",    label: "Framing",        icon: "🏗️", color: "#8E44AD" },
  { id: "flooring",   label: "Flooring",       icon: "🪵",  color: "#795548" },
  { id: "painting",   label: "Painting",       icon: "🎨",  color: "#2980B9" },
  { id: "electrical", label: "Electrical",     icon: "⚡",  color: "#F1C40F" },
  { id: "assembly",   label: "Assembly",       icon: "🔧",  color: "#27AE60" },
  { id: "qc",         label: "Quality Check",  icon: "✅",  color: "#16A085" },
  { id: "shipping",   label: "Shipping",       icon: "🚚",  color: "#2C3E50" },
];

const TRAILER_TYPES = [
  "Horse Trailer", "Flatbed", "Enclosed Cargo",
  "Utility", "Livestock", "Car Hauler", "Gooseneck",
];

function generateVIN() {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app:   { fontFamily: "'Inter','Segoe UI',sans-serif", background: "#0F1923", minHeight: "100vh", color: "#E8EDF2" },
  header:{ background: "#162233", borderBottom: "2px solid #FF6B35", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 },
  logo:  { display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 18, color: "#FF6B35", letterSpacing: 1 },
  nav:   { display: "flex", gap: 4 },
  navBtn:(a) => ({ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: a ? "#FF6B35" : "transparent", color: a ? "#fff" : "#8FA0B0", transition: "all 0.15s" }),
  content:{ padding: "24px", maxWidth: 1100, margin: "0 auto" },
  card:  { background: "#162233", borderRadius: 10, padding: "20px", border: "1px solid #1E3048" },
  statCard:(c) => ({ background: "#162233", border: `1px solid ${c}33`, borderRadius: 10, padding: "16px 20px" }),
  label: { fontSize: 11, fontWeight: 700, color: "#8FA0B0", textTransform: "uppercase", letterSpacing: 1 },
  bigNum:(c) => ({ fontSize: 32, fontWeight: 800, color: c || "#FF6B35", marginTop: 4 }),
  input: { background: "#0F1923", border: "1px solid #1E3048", borderRadius: 6, padding: "10px 14px", color: "#E8EDF2", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  select:{ background: "#0F1923", border: "1px solid #1E3048", borderRadius: 6, padding: "10px 14px", color: "#E8EDF2", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn:   (v) => ({ padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: v === "primary" ? "#FF6B35" : v === "ghost" ? "transparent" : "#1E3048", color: v === "ghost" ? "#8FA0B0" : "#fff", transition: "all 0.15s" }),
  pill:  (c) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${c}22`, color: c, border: `1px solid ${c}44` }),
  row:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #1E3048", cursor: "pointer" },
  bar:   { display: "flex", gap: 3, marginTop: 6 },
  step:  (f, c) => ({ height: 4, flex: 1, borderRadius: 2, background: f ? c : "#1E3048" }),
  result:(ok) => ({ padding: "14px 18px", borderRadius: 8, marginTop: 16, background: ok ? "#0D2B1A" : "#2B1010", border: `1px solid ${ok ? "#27AE60" : "#E74C3C"}`, color: ok ? "#4CD37A" : "#E74C3C", fontWeight: 600 }),
  hist:  { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1E3048" },
  dot:   (c) => ({ width: 10, height: 10, borderRadius: "50%", background: c || "#8FA0B0", flexShrink: 0 }),
  stGrid:{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 },
  stPill:(a, c) => ({ padding: "8px 12px", borderRadius: 6, border: `1px solid ${a ? c : "#1E3048"}`, background: a ? `${c}22` : "#0F1923", color: a ? c : "#8FA0B0", cursor: "pointer", fontWeight: 600, fontSize: 13, textAlign: "center", transition: "all 0.15s" }),
  setupBox: { background: "#162233", border: "1px solid #FF6B35", borderRadius: 10, padding: 24, maxWidth: 580 },
};

// ── Main component ───────────────────────────────────────────────────────────
export default function TrailerTracker() {
  const [trailers, setTrailers]     = useState([]);
  const [histories, setHistories]   = useState({}); // { [vin]: [...entries] }
  const [loading, setLoading]       = useState(true);
  const [dbReady, setDbReady]       = useState(null); // null=checking, true, false
  const [view, setView]             = useState("dashboard");
  const [scanInput, setScanInput]   = useState("");
  const [scanStation, setScanStation] = useState(STATIONS[0].id);
  const [scanResult, setScanResult] = useState(null);
  const [selectedVin, setSelectedVin] = useState(null);
  const [addForm, setAddForm]       = useState({ vin: "", type: TRAILER_TYPES[0], notes: "" });
  const [filterStation, setFilterStation] = useState("all");
  const [search, setSearch]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState([]); // [{vin, type, status}]
  const [importResult, setImportResult] = useState(null);

  // ── DB setup check ──────────────────────────────────────────────────────
  async function setupDatabase() {
    setSaving(true);
    try {
      // Try creating tables via RPC — if that fails we'll show SQL instructions
      // First just test if tables exist by querying them
      await sb("trailers?limit=1");
      setDbReady(true);
    } catch (e) {
      setDbReady(false);
    } finally {
      setSaving(false);
    }
  }

  // ── Load data ───────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [tRows, hRows] = await Promise.all([
        sb("trailers?select=*&order=created_at.desc"),
        sb("trailer_history?select=*&order=timestamp.asc"),
      ]);
      setTrailers(tRows || []);
      const map = {};
      (hRows || []).forEach(h => {
        if (!map[h.vin]) map[h.vin] = [];
        map[h.vin].push(h);
      });
      setHistories(map);
      setDbReady(true);
    } catch (e) {
      setDbReady(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Realtime polling (every 8s) ─────────────────────────────────────────
  useEffect(() => {
    if (!dbReady) return;
    const id = setInterval(loadAll, 8000);
    return () => clearInterval(id);
  }, [dbReady, loadAll]);

  // ── Actions ─────────────────────────────────────────────────────────────
  async function handleScan(e) {
    e?.preventDefault?.();
    const vin = scanInput.trim().toUpperCase();
    if (!vin) return;
    const trailer = trailers.find(t => t.vin === vin);
    if (!trailer) {
      setScanResult({ success: false, message: `VIN ${vin} not found. Register it first.` });
      return;
    }
    const station = STATIONS.find(s => s.id === scanStation);
    setSaving(true);
    try {
      await sb("trailers?vin=eq." + vin, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ current_station: scanStation }),
      });
      await sb("trailer_history", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ vin, station: scanStation }),
      });
      await loadAll();
      setScanResult({ success: true, message: `${trailer.type} — ${vin} checked into ${station.label}` });
      setScanInput("");
    } catch (err) {
      setScanResult({ success: false, message: "Error saving: " + err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e) {
    e?.preventDefault?.();
    const vin = addForm.vin.trim().toUpperCase();
    if (!vin) return;
    if (trailers.find(t => t.vin === vin)) { alert("VIN already exists."); return; }
    setSaving(true);
    try {
      await sb("trailers", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ vin, type: addForm.type, notes: addForm.notes }),
      });
      await sb("trailer_history", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ vin, station: "registered" }),
      });
      await loadAll();
      setAddForm({ vin: "", type: TRAILER_TYPES[0], notes: "" });
      setView("dashboard");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Import from Google Sheets paste ─────────────────────────────────────
  function stripAsterisks(val) {
    return val?.replace(/\*/g, "").trim() || "";
  }

  function parseImport(text) {
    const rows = text.trim().split("\n").slice(2); // skip rows 1 & 2 (header rows)
    const parsed = [];
    for (const row of rows) {
      const cols  = row.split("\t");
      const model = stripAsterisks(cols[0]);
      const vin   = stripAsterisks(cols[1]).toUpperCase();
      if (!vin || vin.length < 3) continue; // skip empty rows
      const existing = trailers.find(t => t.vin === vin);
      parsed.push({ model, vin, exists: !!existing });
    }
    return parsed;
  }

  function handleImportPaste(text) {
    setImportText(text);
    setImportResult(null);
    if (!text.trim()) { setImportPreview([]); return; }
    setImportPreview(parseImport(text));
  }

  async function handleImportSave() {
    const toAdd = importPreview.filter(r => !r.exists);
    if (toAdd.length === 0) {
      setImportResult({ success: false, message: "No new trailers to import — all VINs already exist." });
      return;
    }
    setSaving(true);
    setImportResult(null);
    try {
      // Insert in chunks of 100 to avoid request size limits
      const CHUNK = 100;
      for (let i = 0; i < toAdd.length; i += CHUNK) {
        const chunk = toAdd.slice(i, i + CHUNK);
        await fetch(`${SUPABASE_URL}/rest/v1/trailers`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=ignore-duplicates,return=minimal",
          },
          body: JSON.stringify(chunk.map(r => ({ vin: r.vin, type: r.model, notes: "" }))),
        });
        await fetch(`${SUPABASE_URL}/rest/v1/trailer_history`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(chunk.map(r => ({ vin: r.vin, station: "registered" }))),
        });
      }
      await loadAll();
      setImportResult({ success: true, message: `✅ ${toAdd.length} trailer${toAdd.length > 1 ? "s" : ""} imported successfully!` });
      setImportText("");
      setImportPreview([]);
    } catch (err) {
      setImportResult({ success: false, message: "Error importing: " + err.message });
    } finally {
      setSaving(false);
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  function stationIdx(trailer) {
    if (!trailer.current_station) return -1;
    return STATIONS.findIndex(s => s.id === trailer.current_station);
  }

  const filtered = trailers.filter(t => {
    const ms = filterStation === "all" || t.current_station === filterStation || (filterStation === "none" && !t.current_station);
    const mq = !search || t.vin.includes(search.toUpperCase()) || t.type?.toLowerCase().includes(search.toLowerCase());
    return ms && mq;
  });

  const stationCounts = STATIONS.reduce((acc, s) => {
    acc[s.id] = trailers.filter(t => t.current_station === s.id).length;
    return acc;
  }, {});

  const detailTrailer = trailers.find(t => t.vin === selectedVin);
  const detailHistory = selectedVin ? (histories[selectedVin] || []) : [];

  // ── DB not ready — show setup instructions ──────────────────────────────
  if (dbReady === false) {
    return (
      <div style={S.app}>
        <div style={S.header}>
          <div style={S.logo}><span style={{ fontSize: 22 }}>🚛</span> TRAILER TRACK</div>
        </div>
        <div style={{ ...S.content, maxWidth: 640 }}>
          <div style={S.setupBox}>
            <h2 style={{ margin: "0 0 8px", color: "#FF6B35" }}>⚙️ One-time Database Setup</h2>
            <p style={{ color: "#8FA0B0", margin: "0 0 20px", fontSize: 14 }}>
              Your Supabase project is connected but the tables don't exist yet. Run this SQL once in your Supabase dashboard:
            </p>
            <div style={{ background: "#0F1923", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#4CD37A", lineHeight: 1.7, overflowX: "auto", border: "1px solid #1E3048", marginBottom: 20 }}>
{`create table trailers (
  vin text primary key,
  type text,
  notes text,
  current_station text,
  created_at timestamptz default now()
);

create table trailer_history (
  id uuid default gen_random_uuid() primary key,
  vin text references trailers(vin) on delete cascade,
  station text,
  timestamp timestamptz default now()
);

alter table trailers enable row level security;
alter table trailer_history enable row level security;

create policy "allow all" on trailers for all using (true) with check (true);
create policy "allow all" on trailer_history for all using (true) with check (true);`}
            </div>
            <p style={{ color: "#8FA0B0", fontSize: 13, margin: "0 0 16px" }}>
              Go to <strong style={{ color: "#E8EDF2" }}>supabase.com → your project → SQL Editor</strong>, paste the above, and click Run.
            </p>
            <button style={{ ...S.btn("primary"), width: "100%" }} onClick={loadAll}>
              I've run the SQL — connect now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#8FA0B0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚛</div>
          Connecting to database…
        </div>
      </div>
    );
  }

  // ── App ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.logo}><span style={{ fontSize: 22 }}>🚛</span> TRAILER TRACK</div>
        <nav style={S.nav}>
          {[["dashboard","Dashboard"],["scan","Scan VIN"],["add","Register Trailer"],["import","Import Sheet"]].map(([id, label]) => (
            <button key={id} style={S.navBtn(view === id || (view === "detail" && id === "dashboard"))} onClick={() => setView(id)}>{label}</button>
          ))}
        </nav>
      </div>

      <div style={S.content}>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Production Floor</h2>
                <p style={{ margin: 0, color: "#8FA0B0", fontSize: 14 }}>{trailers.length} trailers registered · live sync every 8s</p>
              </div>
              <button style={{ ...S.btn("secondary"), fontSize: 12 }} onClick={loadAll}>↻ Refresh</button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              {[
                ["Total", trailers.length, "#FF6B35"],
                ["In Production", trailers.filter(t => t.current_station && t.current_station !== "shipping").length, "#27AE60"],
                ["Shipped", trailers.filter(t => t.current_station === "shipping").length, "#2980B9"],
                ["Not Started", trailers.filter(t => !t.current_station).length, "#8FA0B0"],
              ].map(([label, val, color]) => (
                <div key={label} style={S.statCard(color)}>
                  <div style={S.label}>{label}</div>
                  <div style={S.bigNum(color)}>{val}</div>
                </div>
              ))}
            </div>

            {/* Station overview */}
            <div style={{ ...S.card, marginBottom: 24 }}>
              <div style={{ ...S.label, marginBottom: 14 }}>By Station</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATIONS.map(s => (
                  <div key={s.id} style={{ textAlign: "center", padding: "10px 14px", background: "#0F1923", borderRadius: 8, border: `1px solid ${stationCounts[s.id] ? s.color + "66" : "#1E3048"}`, minWidth: 80 }}>
                    <div style={{ fontSize: 18 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, color: "#8FA0B0", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: stationCounts[s.id] ? s.color : "#3A4F63", marginTop: 2 }}>{stationCounts[s.id] || 0}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trailer list */}
            <div style={S.card}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <input style={{ ...S.input, flex: 1, minWidth: 160 }} placeholder="Search VIN or type…" value={search} onChange={e => setSearch(e.target.value)} />
                <select style={{ ...S.select, width: "auto" }} value={filterStation} onChange={e => setFilterStation(e.target.value)}>
                  <option value="all">All Stations</option>
                  <option value="none">Not Started</option>
                  {STATIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8FA0B0" }}>
                  {trailers.length === 0 ? "No trailers yet. Register one to get started." : "No trailers match this filter."}
                </div>
              ) : filtered.map(trailer => {
                const idx = stationIdx(trailer);
                const st  = STATIONS.find(s => s.id === trailer.current_station);
                return (
                  <div key={trailer.vin} style={S.row} onClick={() => { setSelectedVin(trailer.vin); setView("detail"); }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontFamily: "monospace", fontSize: 15, letterSpacing: 1 }}>{trailer.vin}</span>
                        <span style={S.pill(st?.color || "#8FA0B0")}>{st ? `${st.icon} ${st.label}` : "Not Started"}</span>
                        <span style={{ fontSize: 12, color: "#8FA0B0" }}>{trailer.type}</span>
                      </div>
                      <div style={S.bar}>
                        {STATIONS.map((s, i) => <div key={s.id} style={S.step(i <= idx, s.color)} />)}
                      </div>
                    </div>
                    <div style={{ color: "#3A4F63", marginLeft: 12 }}>›</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SCAN ── */}
        {view === "scan" && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Scan VIN</h2>
            <p style={{ margin: "0 0 24px", color: "#8FA0B0", fontSize: 14 }}>Scan or type a VIN to update its production stage.</p>
            <div style={S.card}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Station</div>
                <div style={S.stGrid}>
                  {STATIONS.map(s => (
                    <div key={s.id} style={S.stPill(scanStation === s.id, s.color)} onClick={() => setScanStation(s.id)}>
                      {s.icon} {s.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>VIN Number</div>
                <input
                  style={{ ...S.input, fontSize: 18, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}
                  placeholder="Scan or type VIN…"
                  value={scanInput}
                  onChange={e => { setScanInput(e.target.value); setScanResult(null); }}
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleScan(e)}
                />
              </div>
              <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", opacity: saving ? 0.6 : 1 }} onClick={handleScan} disabled={saving}>
                {saving ? "Saving…" : "Check In →"}
              </button>
              {scanResult && <div style={S.result(scanResult.success)}>{scanResult.success ? "✅ " : "⚠️ "}{scanResult.message}</div>}
            </div>
            <p style={{ color: "#3A4F63", fontSize: 12, marginTop: 12, textAlign: "center" }}>
              Tip: A barcode scanner types the VIN and presses Enter automatically.
            </p>
          </div>
        )}

        {/* ── ADD ── */}
        {view === "add" && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Register Trailer</h2>
            <p style={{ margin: "0 0 24px", color: "#8FA0B0", fontSize: 14 }}>Add a new trailer to the tracking system.</p>
            <div style={S.card}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>VIN Number</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ ...S.input, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", flex: 1 }}
                    placeholder="17-character VIN"
                    value={addForm.vin}
                    onChange={e => setAddForm(f => ({ ...f, vin: e.target.value }))}
                    maxLength={17}
                  />
                  <button style={{ ...S.btn("secondary"), whiteSpace: "nowrap" }} onClick={() => setAddForm(f => ({ ...f, vin: generateVIN() }))}>
                    Generate
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Trailer Type</div>
                <select style={S.select} value={addForm.type} onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}>
                  {TRAILER_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Notes (optional)</div>
                <input style={S.input} placeholder="Customer name, order #, special notes…" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", opacity: saving ? 0.6 : 1 }} onClick={handleAdd} disabled={saving}>
                {saving ? "Saving…" : "Register Trailer →"}
              </button>
            </div>
          </div>
        )}

        {/* ── DETAIL ── */}
        {view === "detail" && detailTrailer && (
          <div style={{ maxWidth: 640 }}>
            <button style={{ ...S.btn("ghost"), padding: "4px 0", marginBottom: 16, fontSize: 13 }} onClick={() => setView("dashboard")}>← Back to Dashboard</button>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>{detailTrailer.vin}</div>
                <div style={{ color: "#8FA0B0", fontSize: 14, marginTop: 2 }}>{detailTrailer.type}</div>
                {detailTrailer.notes && <div style={{ color: "#8FA0B0", fontSize: 13, marginTop: 4, fontStyle: "italic" }}>{detailTrailer.notes}</div>}
              </div>
              {(() => {
                const s = STATIONS.find(st => st.id === detailTrailer.current_station);
                return s
                  ? <span style={{ ...S.pill(s.color), fontSize: 14, padding: "6px 14px" }}>{s.icon} {s.label}</span>
                  : <span style={{ ...S.pill("#8FA0B0"), fontSize: 14, padding: "6px 14px" }}>Not Started</span>;
              })()}
            </div>

            {/* Progress */}
            <div style={{ ...S.card, marginBottom: 20 }}>
              <div style={{ ...S.label, marginBottom: 14 }}>Production Progress</div>
              {STATIONS.map((s, i) => {
                const idx  = stationIdx(detailTrailer);
                const done = i <= idx;
                const cur  = i === idx;
                const last = detailHistory.filter(h => h.station === s.id).slice(-1)[0];
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < STATIONS.length - 1 ? "1px solid #1E3048" : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${done ? s.color : "#1E3048"}`, background: cur ? `${s.color}33` : done ? `${s.color}22` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                      {done ? s.icon : <span style={{ color: "#3A4F63", fontSize: 12 }}>{i + 1}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: cur ? 700 : 600, color: done ? "#E8EDF2" : "#3A4F63", fontSize: 14 }}>
                        {s.label} {cur && <span style={{ ...S.pill(s.color), marginLeft: 6 }}>Current</span>}
                      </div>
                      {last && <div style={{ fontSize: 12, color: "#8FA0B0", marginTop: 2 }}>{new Date(last.timestamp).toLocaleString()}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* History */}
            <div style={S.card}>
              <div style={{ ...S.label, marginBottom: 14 }}>Full History</div>
              {[...detailHistory].reverse().map((entry, i) => {
                const s = STATIONS.find(st => st.id === entry.station);
                return (
                  <div key={i} style={S.hist}>
                    <div style={S.dot(s?.color)} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s ? `${s.icon} ${s.label}` : "Registered"}</div>
                      <div style={{ fontSize: 12, color: "#8FA0B0" }}>{new Date(entry.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
              {detailHistory.length === 0 && <div style={{ color: "#8FA0B0", fontSize: 14 }}>No history yet.</div>}
            </div>
          </div>
        )}

        {/* ── IMPORT ── */}
        {view === "import" && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Import from Google Sheets</h2>
            <p style={{ margin: "0 0 24px", color: "#8FA0B0", fontSize: 14 }}>
              Select all cells in your Google Sheet (Ctrl+A), copy (Ctrl+C), then paste below.
            </p>

            <div style={S.card}>
              {/* Instructions */}
              <div style={{ background: "#0F1923", borderRadius: 8, padding: "12px 16px", marginBottom: 16, border: "1px solid #1E3048", fontSize: 13, color: "#8FA0B0", lineHeight: 1.8 }}>
                <strong style={{ color: "#E8EDF2" }}>Expected format:</strong> Column A = Model, Column B = VIN, starting from row 3.
                Rows 1 and 2 are skipped automatically.
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Paste your Google Sheet data here</div>
                <textarea
                  style={{ ...S.input, height: 140, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
                  placeholder={"Paste your copied Google Sheets data here…\n\nExample (after pasting):\nModel\tVIN\nHorse Trailer\t1HGCM82633A123456\nFlatbed\t2FMDK3KC5BB123456"}
                  value={importText}
                  onChange={e => handleImportPaste(e.target.value)}
                />
              </div>

              {/* Preview table */}
              {importPreview.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ ...S.label, marginBottom: 10 }}>
                    Preview — {importPreview.filter(r => !r.exists).length} new · {importPreview.filter(r => r.exists).length} already exist
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #1E3048", borderRadius: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#0F1923", position: "sticky", top: 0 }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#8FA0B0", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Model</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#8FA0B0", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>VIN</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", color: "#8FA0B0", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, i) => (
                          <tr key={i} style={{ borderTop: "1px solid #1E3048", opacity: row.exists ? 0.5 : 1 }}>
                            <td style={{ padding: "8px 12px", color: "#E8EDF2" }}>{row.model || "—"}</td>
                            <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#E8EDF2", letterSpacing: 1 }}>{row.vin}</td>
                            <td style={{ padding: "8px 12px" }}>
                              {row.exists
                                ? <span style={S.pill("#8FA0B0")}>Already exists</span>
                                : <span style={S.pill("#27AE60")}>✓ Will import</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importPreview.length > 0 && (
                <button
                  style={{ ...S.btn("primary"), width: "100%", padding: "12px", opacity: saving ? 0.6 : 1 }}
                  onClick={handleImportSave}
                  disabled={saving || importPreview.filter(r => !r.exists).length === 0}
                >
                  {saving ? "Importing…" : `Import ${importPreview.filter(r => !r.exists).length} New Trailers →`}
                </button>
              )}

              {importResult && (
                <div style={S.result(importResult.success)}>{importResult.message}</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
