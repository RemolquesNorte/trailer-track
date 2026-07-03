import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://dhksanhrzjiwtultfetp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pByYqUdxfQbGtL9LNOpIog_xQ3GgRQz";

async function sb(path, options = {}) {
  const { prefer, headers: extraHeaders, ...fetchOptions } = options;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...extraHeaders,
    },
    ...fetchOptions,
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const PINS = {
  "0000": { role: "admin" },
  "1111": { role: "station", station: "cutting" },
  "2222": { role: "station", station: "welding" },
  "3333": { role: "station", station: "framing" },
  "4444": { role: "station", station: "flooring" },
  "5555": { role: "station", station: "painting" },
  "6666": { role: "station", station: "electrical" },
  "7777": { role: "station", station: "assembly" },
  "8888": { role: "station", station: "qc" },
  "9999": { role: "station", station: "ready" },
};

const STATIONS = [
  { id: "cutting",    label: "Cutting",      icon: "✂️",  color: "#E67E22" },
  { id: "welding",    label: "Welding",       icon: "🔥",  color: "#E74C3C" },
  { id: "framing",    label: "Framing",       icon: "🏗️", color: "#8E44AD" },
  { id: "flooring",   label: "Flooring",      icon: "🪵",  color: "#795548" },
  { id: "painting",   label: "Painting",      icon: "🎨",  color: "#2980B9" },
  { id: "electrical", label: "Electrical",    icon: "⚡",  color: "#F1C40F" },
  { id: "assembly",   label: "Assembly",      icon: "🔧",  color: "#27AE60" },
  { id: "qc",         label: "Quality Check", icon: "✅",  color: "#16A085" },
  { id: "ready",      label: "Ready",         icon: "🏁",  color: "#27AE60" },
];

const TRAILER_TYPES = ["Horse Trailer","Flatbed","Enclosed Cargo","Utility","Livestock","Car Hauler","Gooseneck"];

function generateVIN() {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function stripAsterisks(val) { return val?.replace(/\*/g, "").trim() || ""; }

const S = {
  app:      { fontFamily: "'Inter','Segoe UI',sans-serif", background: "#0F1923", minHeight: "100vh", color: "#E8EDF2" },
  header:   { background: "#162233", borderBottom: "2px solid #FF6B35", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 },
  logo:     { display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 18, color: "#FF6B35", letterSpacing: 1 },
  nav:      { display: "flex", gap: 4, flexWrap: "wrap" },
  navBtn:   (a) => ({ padding: "8px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: a ? "#FF6B35" : "transparent", color: a ? "#fff" : "#8FA0B0", transition: "all 0.15s" }),
  content:  { padding: "24px", maxWidth: 1100, margin: "0 auto" },
  card:     { background: "#162233", borderRadius: 10, padding: "20px", border: "1px solid #1E3048" },
  statCard: (c) => ({ background: "#162233", border: `1px solid ${c}33`, borderRadius: 10, padding: "16px 20px" }),
  label:    { fontSize: 11, fontWeight: 700, color: "#8FA0B0", textTransform: "uppercase", letterSpacing: 1 },
  bigNum:   (c) => ({ fontSize: 32, fontWeight: 800, color: c || "#FF6B35", marginTop: 4 }),
  input:    { background: "#0F1923", border: "1px solid #1E3048", borderRadius: 6, padding: "10px 14px", color: "#E8EDF2", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  select:   { background: "#0F1923", border: "1px solid #1E3048", borderRadius: 6, padding: "10px 14px", color: "#E8EDF2", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn:      (v) => ({ padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: v === "primary" ? "#FF6B35" : v === "danger" ? "#C0392B" : v === "ghost" ? "transparent" : "#1E3048", color: v === "ghost" ? "#8FA0B0" : "#fff", transition: "all 0.15s" }),
  pill:     (c) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${c}22`, color: c, border: `1px solid ${c}44` }),
  row:      { display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #1E3048" },
  bar:      { display: "flex", gap: 3, marginTop: 6 },
  step:     (f, c) => ({ height: 4, flex: 1, borderRadius: 2, background: f ? c : "#1E3048" }),
  result:   (ok) => ({ padding: "14px 18px", borderRadius: 8, marginTop: 16, background: ok ? "#0D2B1A" : "#2B1010", border: `1px solid ${ok ? "#27AE60" : "#E74C3C"}`, color: ok ? "#4CD37A" : "#E74C3C", fontWeight: 600 }),
  hist:     { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1E3048" },
  dot:      (c) => ({ width: 10, height: 10, borderRadius: "50%", background: c || "#8FA0B0", flexShrink: 0 }),
  stGrid:   { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 },
  stPill:   (a, c) => ({ padding: "8px 12px", borderRadius: 6, border: `1px solid ${a ? c : "#1E3048"}`, background: a ? `${c}22` : "#0F1923", color: a ? c : "#8FA0B0", cursor: "pointer", fontWeight: 600, fontSize: 13, textAlign: "center", transition: "all 0.15s" }),
  checkbox: { width: 18, height: 18, accentColor: "#FF6B35", cursor: "pointer", flexShrink: 0 },
  modal:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalBox: { background: "#162233", border: "1px solid #1E3048", borderRadius: 12, padding: 28, width: 480, maxWidth: "90vw" },
};

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleKey(digit) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => {
        const match = PINS[next];
        if (match) { onLogin(match); }
        else { setError("Incorrect PIN. Try again."); setPin(""); }
      }, 200);
    }
  }

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);
  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚛</div>
        <div style={{ fontWeight: 800, fontSize: 24, color: "#FF6B35", letterSpacing: 1 }}>TRAILER TRACK</div>
        <div style={{ color: "#8FA0B0", fontSize: 14, marginTop: 6 }}>Enter your PIN to continue</div>
      </div>
      <div style={{ background: "#162233", borderRadius: 16, padding: 32, border: "1px solid #1E3048", width: 280 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 28 }}>
          {dots.map((filled, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: filled ? "#FF6B35" : "#1E3048", border: `2px solid ${filled ? "#FF6B35" : "#3A4F63"}`, transition: "all 0.1s" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
            <button key={i} onClick={() => k === "⌫" ? (setPin(""), setError("")) : k ? handleKey(k) : null}
              style={{ padding: "16px 0", borderRadius: 10, border: "1px solid #1E3048", background: k === "" ? "transparent" : k === "⌫" ? "#1E3048" : "#0F1923", color: "#E8EDF2", fontSize: 20, fontWeight: 700, cursor: k ? "pointer" : "default", visibility: k === "" ? "hidden" : "visible" }}
            >{k}</button>
          ))}
        </div>
        {error && <div style={{ color: "#E74C3C", textAlign: "center", marginTop: 16, fontSize: 13, fontWeight: 600 }}>{error}</div>}
      </div>
    </div>
  );
}

// ── Worker Scan Screen ────────────────────────────────────────────────────────
function WorkerScanScreen({ station, onLogout, trailers, loadAll }) {
  const st = STATIONS.find(s => s.id === station);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleScan(e) {
    e?.preventDefault?.();
    const vin = scanInput.trim().toUpperCase();
    if (!vin) return;
    const trailer = trailers.find(t => t.vin === vin);
    if (!trailer) { setScanResult({ success: false, message: `VIN ${vin} not found in the system.` }); return; }
    setSaving(true);
    try {
      await sb("trailers?vin=eq." + vin, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ current_station: station }) });
      await sb("trailer_history", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ vin, station }) });
      await loadAll();
      setScanResult({ success: true, message: `✅ ${trailer.type} — ${vin} checked into ${st.label}` });
      setScanInput("");
    } catch (err) { setScanResult({ success: false, message: "Error: " + err.message }); }
    finally { setSaving(false); }
  }

  const inThisStation = trailers.filter(t => t.current_station === station);
  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}><span style={{ fontSize: 22 }}>🚛</span> TRAILER TRACK</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ ...S.pill(st.color), fontSize: 13, padding: "6px 14px" }}>{st.icon} {st.label}</span>
          <button style={{ ...S.btn("ghost"), fontSize: 12 }} onClick={onLogout}>Lock</button>
        </div>
      </div>
      <div style={{ ...S.content, maxWidth: 520 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>{st.icon} {st.label} Station</h2>
          <p style={{ margin: 0, color: "#8FA0B0", fontSize: 14 }}>{inThisStation.length} trailer{inThisStation.length !== 1 ? "s" : ""} currently here</p>
        </div>
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 8 }}>Scan or Type VIN</div>
          <input style={{ ...S.input, fontSize: 18, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}
            placeholder="Scan barcode or type VIN…" value={scanInput}
            onChange={e => { setScanInput(e.target.value); setScanResult(null); }}
            autoFocus onKeyDown={e => e.key === "Enter" && handleScan(e)} />
          <button style={{ ...S.btn("primary"), width: "100%", padding: "13px", fontSize: 16, opacity: saving ? 0.6 : 1 }} onClick={handleScan} disabled={saving}>
            {saving ? "Saving…" : `Check In to ${st.label} →`}
          </button>
          {scanResult && <div style={S.result(scanResult.success)}>{scanResult.message}</div>}
        </div>
        {inThisStation.length > 0 && (
          <div style={{ ...S.card, marginTop: 20 }}>
            <div style={{ ...S.label, marginBottom: 12 }}>Currently at {st.label}</div>
            {inThisStation.map(t => (
              <div key={t.vin} style={{ padding: "10px 0", borderBottom: "1px solid #1E3048", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>{t.vin}</span>
                <span style={{ fontSize: 12, color: "#8FA0B0" }}>{t.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ trailer, onSave, onClose, saving }) {
  const [vin, setVin]     = useState(trailer.vin);
  const [type, setType]   = useState(trailer.type || "");
  const [notes, setNotes] = useState(trailer.notes || "");
  const [station, setStation] = useState(trailer.current_station || "");

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800 }}>Edit Trailer</h3>

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...S.label, marginBottom: 6 }}>VIN Number</div>
          <input style={{ ...S.input, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}
            value={vin} onChange={e => setVin(e.target.value.toUpperCase())} maxLength={17} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...S.label, marginBottom: 6 }}>Model / Type</div>
          <input style={S.input} value={type} onChange={e => setType(e.target.value)} placeholder="e.g. Horse Trailer" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...S.label, marginBottom: 6 }}>Notes</div>
          <input style={S.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Customer name, order #…" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ ...S.label, marginBottom: 6 }}>Current Station</div>
          <select style={S.select} value={station} onChange={e => setStation(e.target.value)}>
            <option value="">Not Started</option>
            {STATIONS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.btn("primary"), flex: 1, opacity: saving ? 0.6 : 1 }} disabled={saving}
            onClick={() => onSave({ oldVin: trailer.vin, vin: vin.trim(), type, notes, current_station: station || null })}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button style={S.btn("secondary")} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmModal({ count, onConfirm, onClose, saving }) {
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{ ...S.modalBox, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, textAlign: "center" }}>Delete {count} Trailer{count > 1 ? "s" : ""}?</h3>
        <p style={{ color: "#8FA0B0", fontSize: 14, textAlign: "center", margin: "0 0 24px" }}>
          This will permanently delete {count > 1 ? `these ${count} trailers` : "this trailer"} and all their history. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.btn("danger"), flex: 1, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={onConfirm}>
            {saving ? "Deleting…" : `Delete ${count > 1 ? count + " Trailers" : "Trailer"}`}
          </button>
          <button style={S.btn("secondary")} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin App ────────────────────────────────────────────────────────────
export default function TrailerTracker() {
  const [session, setSession]         = useState(null);
  const [trailers, setTrailers]       = useState([]);
  const [histories, setHistories]     = useState({});
  const [loading, setLoading]         = useState(true);
  const [dbReady, setDbReady]         = useState(null);
  const [view, setView]               = useState("dashboard");
  const [activeStation, setActiveStation] = useState(null);
  const [scanInput, setScanInput]     = useState("");
  const [scanStation, setScanStation] = useState(STATIONS[0].id);
  const [scanResult, setScanResult]   = useState(null);
  const [selectedVin, setSelectedVin] = useState(null);
  const [addForm, setAddForm]         = useState({ vin: "", type: TRAILER_TYPES[0], notes: "" });
  const [search, setSearch]           = useState("");
  const [saving, setSaving]           = useState(false);
  const [importText, setImportText]   = useState("");
  const [importPreview, setImportPreview] = useState([]);
  const [importResult, setImportResult]   = useState(null);

  // Selection state
  const [selected, setSelected]       = useState(new Set()); // Set of VINs
  const [editTrailer, setEditTrailer] = useState(null);      // trailer being edited
  const [confirmDelete, setConfirmDelete] = useState(false); // show confirm modal

  const loadAll = useCallback(async () => {
    try {
      async function fetchAll(table, order) {
        const PAGE = 1000;
        let rows = [], from = 0;
        while (true) {
          const batch = await fetch(
            `${SUPABASE_URL}/rest/v1/${table}?select=*&order=${order}&offset=${from}&limit=${PAGE}`,
            { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "count=none" } }
          ).then(r => r.json());
          rows = rows.concat(batch || []);
          if (!batch || batch.length < PAGE) break;
          from += PAGE;
        }
        return rows;
      }
      const [tRows, hRows] = await Promise.all([
        fetchAll("trailers", "created_at.desc"),
        fetchAll("trailer_history", "timestamp.asc"),
      ]);
      setTrailers(tRows || []);
      const map = {};
      (hRows || []).forEach(h => { if (!map[h.vin]) map[h.vin] = []; map[h.vin].push(h); });
      setHistories(map);
      setDbReady(true);
    } catch { setDbReady(false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    if (!dbReady) return;
    const id = setInterval(loadAll, 30000);
    return () => clearInterval(id);
  }, [dbReady, loadAll]);

  if (!session) return <LoginScreen onLogin={setSession} />;
  if (session.role === "station") return <WorkerScanScreen station={session.station} onLogout={() => setSession(null)} trailers={trailers} loadAll={loadAll} />;

  if (dbReady === false) return (
    <div style={S.app}>
      <div style={S.header}><div style={S.logo}><span style={{ fontSize: 22 }}>🚛</span> TRAILER TRACK</div></div>
      <div style={{ ...S.content, maxWidth: 640 }}>
        <div style={{ background: "#162233", border: "1px solid #FF6B35", borderRadius: 10, padding: 24 }}>
          <h2 style={{ margin: "0 0 8px", color: "#FF6B35" }}>⚙️ One-time Database Setup</h2>
          <p style={{ color: "#8FA0B0", margin: "0 0 20px", fontSize: 14 }}>Run this SQL once in your Supabase SQL Editor:</p>
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
          <button style={{ ...S.btn("primary"), width: "100%" }} onClick={loadAll}>I've run the SQL — connect now →</button>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#8FA0B0" }}><div style={{ fontSize: 32, marginBottom: 12 }}>🚛</div>Loading…</div>
    </div>
  );

  // ── Admin actions ───────────────────────────────────────────────────────────
  async function handleScan(e) {
    e?.preventDefault?.();
    const vin = scanInput.trim().toUpperCase();
    if (!vin) return;
    const trailer = trailers.find(t => t.vin === vin);
    if (!trailer) { setScanResult({ success: false, message: `VIN ${vin} not found.` }); return; }
    const station = STATIONS.find(s => s.id === scanStation);
    setSaving(true);
    try {
      await sb("trailers?vin=eq." + vin, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ current_station: scanStation }) });
      await sb("trailer_history", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ vin, station: scanStation }) });
      await loadAll();
      setScanResult({ success: true, message: `${trailer.type} — ${vin} checked into ${station.label}` });
      setScanInput("");
    } catch (err) { setScanResult({ success: false, message: "Error: " + err.message }); }
    finally { setSaving(false); }
  }

  async function handleAdd(e) {
    e?.preventDefault?.();
    const vin = addForm.vin.trim().toUpperCase();
    if (!vin) return;
    if (trailers.find(t => t.vin === vin)) { alert("VIN already exists."); return; }
    setSaving(true);
    try {
      await sb("trailers", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ vin, type: addForm.type, notes: addForm.notes }) });
      await sb("trailer_history", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ vin, station: "registered" }) });
      await loadAll();
      setAddForm({ vin: "", type: TRAILER_TYPES[0], notes: "" });
      setView("dashboard");
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  }

  // ── Edit single trailer ─────────────────────────────────────────────────────
  async function handleEdit({ oldVin, vin, type, notes, current_station }) {
    setSaving(true);
    try {
      if (oldVin !== vin) {
        // VIN changed — insert new, migrate history, delete old
        await sb("trailers", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ vin, type, notes, current_station }) });
        await fetch(`${SUPABASE_URL}/rest/v1/trailer_history?vin=eq.${oldVin}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ vin }),
        });
        await sb(`trailers?vin=eq.${oldVin}`, { method: "DELETE", prefer: "return=minimal" });
      } else {
        await sb(`trailers?vin=eq.${vin}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ type, notes, current_station }) });
      }
      await loadAll();
      setEditTrailer(null);
      if (view === "detail") setSelectedVin(vin);
    } catch (err) { alert("Error saving: " + err.message); }
    finally { setSaving(false); }
  }

  // ── Delete selected trailers ────────────────────────────────────────────────
  async function handleDeleteSelected() {
    const vins = [...selected];
    setSaving(true);
    try {
      const CHUNK = 50;
      for (let i = 0; i < vins.length; i += CHUNK) {
        const chunk = vins.slice(i, i + CHUNK);
        const filter = chunk.map(v => `vin.eq.${v}`).join(",");
        await fetch(`${SUPABASE_URL}/rest/v1/trailers?or=(${filter})`, {
          method: "DELETE",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        });
      }
      await loadAll();
      setSelected(new Set());
      setConfirmDelete(false);
      if (view === "detail" && vins.includes(selectedVin)) setView("dashboard");
    } catch (err) { alert("Error deleting: " + err.message); }
    finally { setSaving(false); }
  }

  // ── Selection helpers ───────────────────────────────────────────────────────
  function toggleSelect(vin) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(vin) ? next.delete(vin) : next.add(vin);
      return next;
    });
  }

  function toggleSelectAll(visibleVins) {
    const allSelected = visibleVins.every(v => selected.has(v));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) { visibleVins.forEach(v => next.delete(v)); }
      else { visibleVins.forEach(v => next.add(v)); }
      return next;
    });
  }

  // ── Import ──────────────────────────────────────────────────────────────────
  function parseImport(text) {
    return text.split("\n").map(row => {
      const cols  = row.split("\t");
      const model = stripAsterisks(cols[0]);
      const vin   = stripAsterisks(cols[1]).toUpperCase();
      if (!vin || vin.length < 3) return null; // skips empty rows and header rows automatically
      return { model, vin, exists: !!trailers.find(t => t.vin === vin) };
    }).filter(Boolean);
  }

  function handleImportPaste(text) {
    setImportText(text);
    setImportResult(null);
    setImportPreview(text.trim() ? parseImport(text) : []);
  }

  async function handleImportSave() {
    const toAdd = importPreview.filter(r => !r.exists);
    if (!toAdd.length) { setImportResult({ success: false, message: "No new trailers to import." }); return; }
    setSaving(true); setImportResult(null);
    try {
      const CHUNK = 100;
      for (let i = 0; i < toAdd.length; i += CHUNK) {
        const chunk = toAdd.slice(i, i + CHUNK);
        await fetch(`${SUPABASE_URL}/rest/v1/trailers`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify(chunk.map(r => ({ vin: r.vin, type: r.model, notes: "" }))),
        });
        await fetch(`${SUPABASE_URL}/rest/v1/trailer_history`, {
          method: "POST",
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(chunk.map(r => ({ vin: r.vin, station: "registered" }))),
        });
      }
      await loadAll();
      setImportResult({ success: true, message: `✅ ${toAdd.length} trailer${toAdd.length > 1 ? "s" : ""} imported!` });
      setImportText(""); setImportPreview([]);
    } catch (err) { setImportResult({ success: false, message: "Error: " + err.message }); }
    finally { setSaving(false); }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  function stationIdx(trailer) {
    if (!trailer.current_station) return -1;
    return STATIONS.findIndex(s => s.id === trailer.current_station);
  }

  const stationCounts = STATIONS.reduce((acc, s) => {
    acc[s.id] = trailers.filter(t => t.current_station === s.id).length;
    return acc;
  }, {});

  // activeStation: null = nothing selected, "all" = show all, anything else = exact station match
  const showList = activeStation !== null || search.length > 0;

  const dashboardTrailers = (() => {
    if (!showList) return [];
    let list = trailers;
    // Apply station filter first (ignore if searching without a station)
    if (activeStation && activeStation !== "all") {
      list = list.filter(t => t.current_station === activeStation);
    }
    // Apply search filter on top
    if (search) {
      const q = search.toUpperCase();
      list = list.filter(t => t.vin.includes(q) || t.type?.toLowerCase().includes(search.toLowerCase()));
    }
    // Sort by last 6 digits descending
    return list.slice().sort((a, b) => {
      const numA = parseInt(a.vin.slice(-6), 10) || 0;
      const numB = parseInt(b.vin.slice(-6), 10) || 0;
      return numB - numA;
    });
  })();

  const visibleVins      = dashboardTrailers.map(t => t.vin);
  const allVisibleSelected = visibleVins.length > 0 && visibleVins.every(v => selected.has(v));
  const someVisibleSelected = visibleVins.some(v => selected.has(v));
  const detailTrailer    = trailers.find(t => t.vin === selectedVin);
  const detailHistory    = selectedVin ? (histories[selectedVin] || []) : [];

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* Modals */}
      {editTrailer && <EditModal trailer={editTrailer} onSave={handleEdit} onClose={() => setEditTrailer(null)} saving={saving} />}
      {confirmDelete && <ConfirmModal count={selected.size} onConfirm={handleDeleteSelected} onClose={() => setConfirmDelete(false)} saving={saving} />}

      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}><span style={{ fontSize: 22 }}>🚛</span> TRAILER TRACK</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <nav style={S.nav}>
            {[["dashboard","Dashboard"],["all","All VINs"],["scan","Scan VIN"],["add","Register"],["import","Import Sheet"]].map(([id, label]) => (
              <button key={id} style={S.navBtn(view === id || (view === "detail" && id === "dashboard"))}
                onClick={() => { setView(id); setActiveStation(id === "all" ? "all" : null); setSelected(new Set()); }}>{label}</button>
            ))}
          </nav>
          <button style={{ ...S.btn("ghost"), fontSize: 12, marginLeft: 8 }} onClick={() => setSession(null)}>Lock 🔒</button>
        </div>
      </div>

      <div style={S.content}>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Production Floor</h2>
                <p style={{ margin: 0, color: "#8FA0B0", fontSize: 14 }}>{trailers.length} trailers · live sync every 8s</p>
              </div>
              <button style={{ ...S.btn("secondary"), fontSize: 12 }} onClick={loadAll}>↻ Refresh</button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              {[
                ["Total", trailers.length, "#FF6B35"],
                ["In Production", trailers.filter(t => t.current_station && t.current_station !== "ready").length, "#27AE60"],
                ["Ready", trailers.filter(t => t.current_station === "ready").length, "#16A085"],
                ["Not Started", trailers.filter(t => !t.current_station).length, "#8FA0B0"],
              ].map(([label, val, color]) => (
                <div key={label} style={S.statCard(color)}>
                  <div style={S.label}>{label}</div>
                  <div style={S.bigNum(color)}>{val}</div>
                </div>
              ))}
            </div>

            {/* Station buttons */}
            <div style={{ ...S.card, marginBottom: 24 }}>
              <div style={{ ...S.label, marginBottom: 14 }}>Stations — click to filter</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

                {STATIONS.map(s => (
                  <button key={s.id} onClick={() => setActiveStation(s.id)}
                    style={{ textAlign: "center", padding: "12px 18px", background: activeStation === s.id ? `${s.color}22` : "#0F1923", borderRadius: 8, border: `2px solid ${activeStation === s.id ? s.color : stationCounts[s.id] ? s.color + "55" : "#1E3048"}`, cursor: "pointer", transition: "all 0.15s", minWidth: 90 }}>
                    <div style={{ fontSize: 20 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, color: "#8FA0B0", marginTop: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: stationCounts[s.id] ? s.color : "#3A4F63", marginTop: 2 }}>{stationCounts[s.id] || 0}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trailer list */}
            <div style={S.card}>
              {/* Toolbar */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
                <input style={{ ...S.input, flex: 1, minWidth: 160 }} placeholder="Search VIN or model…" value={search} onChange={e => setSearch(e.target.value)} />
                {activeStation && activeStation !== "all" && <button style={{ ...S.btn("ghost"), fontSize: 12, whiteSpace: "nowrap" }} onClick={() => setActiveStation(null)}>Clear filter ✕</button>}
              </div>

              {/* Bulk action bar */}
              {selected.size > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#FF6B3511", border: "1px solid #FF6B3544", borderRadius: 8, marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, color: "#FF6B35", fontSize: 14 }}>{selected.size} selected</span>
                  <button style={{ ...S.btn("danger"), padding: "6px 14px", fontSize: 13 }} onClick={() => setConfirmDelete(true)}>
                    🗑 Delete {selected.size} Trailer{selected.size > 1 ? "s" : ""}
                  </button>
                  <button style={{ ...S.btn("ghost"), padding: "6px 14px", fontSize: 13 }} onClick={() => setSelected(new Set())}>
                    Clear selection
                  </button>
                </div>
              )}

              {/* Select all row */}
              {showList && dashboardTrailers.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "2px solid #1E3048", marginBottom: 4 }}>
                  <input type="checkbox" style={S.checkbox} checked={allVisibleSelected} onChange={() => toggleSelectAll(visibleVins)}
                    ref={el => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected; }} />
                  <span style={{ fontSize: 12, color: "#8FA0B0", fontWeight: 600 }}>
                    {allVisibleSelected ? "Deselect all" : `Select all ${dashboardTrailers.length} visible`}
                  </span>
                </div>
              )}

              {!showList ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8FA0B0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>☝️</div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: "#E8EDF2" }}>Click a station above to see its trailers</div>
                  <div style={{ fontSize: 13 }}>Or use the search bar to find a specific VIN or model</div>
                </div>
              ) : dashboardTrailers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8FA0B0" }}>
                  {trailers.length === 0 ? "No trailers yet. Register one to get started." : "No trailers match this filter."}
                </div>
              ) : dashboardTrailers.map(trailer => {
                const idx  = stationIdx(trailer);
                const st   = STATIONS.find(s => s.id === trailer.current_station);
                const isSel = selected.has(trailer.vin);
                return (
                  <div key={trailer.vin} style={{ ...S.row, background: isSel ? "#FF6B3508" : "transparent", borderRadius: isSel ? 6 : 0 }}>
                    {/* Checkbox */}
                    <input type="checkbox" style={{ ...S.checkbox, marginRight: 10 }} checked={isSel}
                      onChange={() => toggleSelect(trailer.vin)} onClick={e => e.stopPropagation()} />

                    {/* Info — clickable to detail */}
                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setSelectedVin(trailer.vin); setView("detail"); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontFamily: "monospace", fontSize: 15, letterSpacing: 1 }}>{trailer.vin}</span>
                        <span style={S.pill(st?.color || "#8FA0B0")}>{st ? `${st.icon} ${st.label}` : "Not Started"}</span>
                        <span style={{ fontSize: 12, color: "#8FA0B0" }}>{trailer.type}</span>
                      </div>
                      <div style={S.bar}>
                        {STATIONS.map((s, i) => <div key={s.id} style={S.step(i <= idx, s.color)} />)}
                      </div>
                    </div>

                    {/* Edit button */}
                    <button style={{ ...S.btn("secondary"), padding: "6px 12px", fontSize: 12, marginLeft: 10, whiteSpace: "nowrap" }}
                      onClick={e => { e.stopPropagation(); setEditTrailer(trailer); }}>
                      ✏️ Edit
                    </button>

                    {/* Delete single */}
                    <button style={{ ...S.btn("danger"), padding: "6px 12px", fontSize: 12, marginLeft: 6, whiteSpace: "nowrap" }}
                      onClick={e => { e.stopPropagation(); setSelected(new Set([trailer.vin])); setConfirmDelete(true); }}>
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ALL VINs ── */}
        {view === "all" && (
          <div>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>All VINs</h2>
                <p style={{ margin: 0, color: "#8FA0B0", fontSize: 14 }}>{trailers.length} trailers total</p>
              </div>
              <button style={{ ...S.btn("secondary"), fontSize: 12 }} onClick={loadAll}>↻ Refresh</button>
            </div>

            <div style={S.card}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Search VIN or model…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {selected.size > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#FF6B3511", border: "1px solid #FF6B3544", borderRadius: 8, marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, color: "#FF6B35", fontSize: 14 }}>{selected.size} selected</span>
                  <button style={{ ...S.btn("danger"), padding: "6px 14px", fontSize: 13 }} onClick={() => setConfirmDelete(true)}>
                    🗑 Delete {selected.size} Trailer{selected.size > 1 ? "s" : ""}
                  </button>
                  <button style={{ ...S.btn("ghost"), padding: "6px 14px", fontSize: 13 }} onClick={() => setSelected(new Set())}>Clear selection</button>
                </div>
              )}

              {dashboardTrailers.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "2px solid #1E3048", marginBottom: 4 }}>
                  <input type="checkbox" style={S.checkbox}
                    checked={dashboardTrailers.length > 0 && dashboardTrailers.every(t => selected.has(t.vin))}
                    onChange={() => toggleSelectAll(dashboardTrailers.map(t => t.vin))}
                    ref={el => { if (el) el.indeterminate = dashboardTrailers.some(t => selected.has(t.vin)) && !dashboardTrailers.every(t => selected.has(t.vin)); }} />
                  <span style={{ fontSize: 12, color: "#8FA0B0", fontWeight: 600 }}>Select all {dashboardTrailers.length} visible</span>
                </div>
              )}

              {dashboardTrailers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8FA0B0" }}>No trailers match your search.</div>
              ) : dashboardTrailers.map(trailer => {
                const idx  = stationIdx(trailer);
                const st   = STATIONS.find(s => s.id === trailer.current_station);
                const isSel = selected.has(trailer.vin);
                return (
                  <div key={trailer.vin} style={{ ...S.row, background: isSel ? "#FF6B3508" : "transparent", borderRadius: isSel ? 6 : 0 }}>
                    <input type="checkbox" style={{ ...S.checkbox, marginRight: 10 }} checked={isSel}
                      onChange={() => toggleSelect(trailer.vin)} onClick={e => e.stopPropagation()} />
                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setSelectedVin(trailer.vin); setView("detail"); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontFamily: "monospace", fontSize: 15, letterSpacing: 1 }}>{trailer.vin}</span>
                        <span style={S.pill(st?.color || "#8FA0B0")}>{st ? `${st.icon} ${st.label}` : "Not Started"}</span>
                        <span style={{ fontSize: 12, color: "#8FA0B0" }}>{trailer.type}</span>
                      </div>
                      <div style={S.bar}>
                        {STATIONS.map((s, i) => <div key={s.id} style={S.step(i <= idx, s.color)} />)}
                      </div>
                    </div>
                    <button style={{ ...S.btn("secondary"), padding: "6px 12px", fontSize: 12, marginLeft: 10 }}
                      onClick={e => { e.stopPropagation(); setEditTrailer(trailer); }}>✏️ Edit</button>
                    <button style={{ ...S.btn("danger"), padding: "6px 12px", fontSize: 12, marginLeft: 6 }}
                      onClick={e => { e.stopPropagation(); setSelected(new Set([trailer.vin])); setConfirmDelete(true); }}>🗑</button>
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
            <p style={{ margin: "0 0 24px", color: "#8FA0B0", fontSize: 14 }}>Update a trailer's station manually.</p>
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
                <input style={{ ...S.input, fontSize: 18, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}
                  placeholder="Scan or type VIN…" value={scanInput}
                  onChange={e => { setScanInput(e.target.value); setScanResult(null); }}
                  autoFocus onKeyDown={e => e.key === "Enter" && handleScan(e)} />
              </div>
              <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", opacity: saving ? 0.6 : 1 }} onClick={handleScan} disabled={saving}>
                {saving ? "Saving…" : "Check In →"}
              </button>
              {scanResult && <div style={S.result(scanResult.success)}>{scanResult.success ? "✅ " : "⚠️ "}{scanResult.message}</div>}
            </div>
          </div>
        )}

        {/* ── ADD ── */}
        {view === "add" && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Register Trailer</h2>
            <p style={{ margin: "0 0 24px", color: "#8FA0B0", fontSize: 14 }}>Add a single trailer manually.</p>
            <div style={S.card}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>VIN Number</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...S.input, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", flex: 1 }}
                    placeholder="17-character VIN" value={addForm.vin}
                    onChange={e => setAddForm(f => ({ ...f, vin: e.target.value }))} maxLength={17} />
                  <button style={S.btn("secondary")} onClick={() => setAddForm(f => ({ ...f, vin: generateVIN() }))}>Generate</button>
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
                <input style={S.input} placeholder="Customer name, order #…" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", opacity: saving ? 0.6 : 1 }} onClick={handleAdd} disabled={saving}>
                {saving ? "Saving…" : "Register Trailer →"}
              </button>
            </div>
          </div>
        )}

        {/* ── IMPORT ── */}
        {view === "import" && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Import from Google Sheets</h2>
            <p style={{ margin: "0 0 24px", color: "#8FA0B0", fontSize: 14 }}>Select all (Ctrl+A), copy (Ctrl+C) from your sheet, then paste below.</p>
            <div style={S.card}>
              <div style={{ background: "#0F1923", borderRadius: 8, padding: "12px 16px", marginBottom: 16, border: "1px solid #1E3048", fontSize: 13, color: "#8FA0B0" }}>
                <strong style={{ color: "#E8EDF2" }}>Expected format:</strong> Column A = Model, Column B = VIN, starting from row 3. Asterisks stripped automatically.
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Paste here</div>
                <textarea style={{ ...S.input, height: 140, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
                  placeholder="Paste your Google Sheets data…" value={importText} onChange={e => handleImportPaste(e.target.value)} />
              </div>
              {importPreview.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ ...S.label, marginBottom: 10 }}>Preview — {importPreview.filter(r => !r.exists).length} new · {importPreview.filter(r => r.exists).length} already exist</div>
                  <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #1E3048", borderRadius: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#0F1923" }}>
                          {["Model","VIN","Status"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#8FA0B0", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, i) => (
                          <tr key={i} style={{ borderTop: "1px solid #1E3048", opacity: row.exists ? 0.5 : 1 }}>
                            <td style={{ padding: "8px 12px", color: "#E8EDF2" }}>{row.model || "—"}</td>
                            <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#E8EDF2", letterSpacing: 1 }}>{row.vin}</td>
                            <td style={{ padding: "8px 12px" }}>{row.exists ? <span style={S.pill("#8FA0B0")}>Already exists</span> : <span style={S.pill("#27AE60")}>✓ Will import</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {importPreview.length > 0 && (
                <button style={{ ...S.btn("primary"), width: "100%", padding: "12px", opacity: saving ? 0.6 : 1 }}
                  onClick={handleImportSave} disabled={saving || importPreview.filter(r => !r.exists).length === 0}>
                  {saving ? "Importing…" : `Import ${importPreview.filter(r => !r.exists).length} New Trailers →`}
                </button>
              )}
              {importResult && <div style={S.result(importResult.success)}>{importResult.message}</div>}
            </div>
          </div>
        )}

        {/* ── DETAIL ── */}
        {view === "detail" && detailTrailer && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button style={{ ...S.btn("ghost"), padding: "4px 0", fontSize: 13 }} onClick={() => setView("dashboard")}>← Back</button>
              <div style={{ flex: 1 }} />
              <button style={{ ...S.btn("secondary"), padding: "8px 16px", fontSize: 13 }} onClick={() => setEditTrailer(detailTrailer)}>✏️ Edit</button>
              <button style={{ ...S.btn("danger"), padding: "8px 16px", fontSize: 13 }}
                onClick={() => { setSelected(new Set([detailTrailer.vin])); setConfirmDelete(true); }}>🗑 Delete</button>
            </div>

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

      </div>
    </div>
  );
}
