"use client";
import { useEffect, useState, useCallback } from "react";

type Route = { id: string; route_name: string; route_number?: string; driver_name?: string; driver_phone?: string; bus_number?: string; capacity?: number; status: string; stops?: string[] };
type Book  = { id: string; title: string; author: string; isbn?: string; category?: string; copies_total: number; copies_available: number; library_issues?: any[] };

/* ── TRANSPORT ── */
const ROUTE_STATUS: Record<string, string> = {
  Active:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Inactive:    "bg-red-500/20 text-red-300 border-red-500/30",
  Maintenance: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export function TransportTab() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [form, setForm] = useState({ route_name:"", route_number:"", driver_name:"", driver_phone:"", bus_number:"", capacity:40, status:"Active", stops:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/transport");
    if (r.ok) { const j = await r.json(); setRoutes(j.data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      // Convert stops comma-separated string to array for Postgres text[] column
      const stopsArray = form.stops ? form.stops.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      const payload = { 
        ...form,
        stops: stopsArray
      };

      const url = editRoute ? `/api/transport/${editRoute.id}` : "/api/transport";
      const method = editRoute ? "PATCH" : "POST";
      
      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to save route");

      setSaving(false); setShowAdd(false); setEditRoute(null);
      setForm({ route_name:"", route_number:"", driver_name:"", driver_phone:"", bus_number:"", capacity:40, status:"Active", stops:"" });
      load();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const openEdit = (r: Route) => {
    setEditRoute(r);
    setForm({ 
      route_name: r.route_name, 
      route_number: r.route_number || "", 
      driver_name: r.driver_name || "", 
      driver_phone: r.driver_phone || "", 
      bus_number: r.bus_number || "", 
      capacity: r.capacity || 40, 
      status: r.status, 
      stops: Array.isArray(r.stops) ? r.stops.join(', ') : "" 
    });
    setShowAdd(true);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this route?")) return;
    await fetch(`/api/transport/${id}`, { method:"DELETE" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/transport/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    load();
  };

  return (
    <>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">{routes.length} routes · {routes.filter(r=>r.status==="Active").length} active</span>
          </div>
          <button onClick={() => { setEditRoute(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90">
            <span className="material-symbols-outlined text-[16px]">add</span> Add Route
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>
        ) : routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">directions_bus</span>
            <span className="text-sm">No routes configured</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {routes.map(r => (
              <div key={r.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.03] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-teal-300 text-[18px]">directions_bus</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-white">{r.route_name}</span>
                    {r.route_number && <span className="text-[10px] font-mono bg-white/10 text-white/50 px-1.5 py-0.5 rounded">{r.route_number}</span>}
                  </div>
                  <div className="text-[11px] text-white/40 flex flex-wrap gap-3">
                    {r.driver_name && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span>{r.driver_name}</span>}
                    {r.bus_number && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">pin</span>{r.bus_number}</span>}
                    {r.capacity && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">event_seat</span>{r.capacity} seats</span>}
                    {r.driver_phone && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">call</span>{r.driver_phone}</span>}
                  </div>
                  {r.stops && r.stops.length > 0 && (
                    <div className="text-[10px] text-white/30 mt-1 truncate">
                      Stops: {Array.isArray(r.stops) ? r.stops.join(' → ') : r.stops}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select className={`text-[10px] px-2 py-1 rounded border outline-none font-mono ${ROUTE_STATUS[r.status]||"bg-white/10 text-white/40 border-white/10"}`} value={r.status} onChange={e => updateStatus(r.id, e.target.value)}>
                    {["Active","Inactive","Maintenance"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>openEdit(r)} className="w-7 h-7 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/30 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[15px]">edit</span></button>
                  <button onClick={()=>del(r.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[15px]">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editRoute?"Edit Route":"Add Route"}</h2>
              <button onClick={()=>{setShowAdd(false);setEditRoute(null);setError("");}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Route Name *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.route_name} onChange={e=>setForm(f=>({...f,route_name:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Route No</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.route_number} onChange={e=>setForm(f=>({...f,route_number:e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Driver Name</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.driver_name} onChange={e=>setForm(f=>({...f,driver_name:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Driver Phone</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.driver_phone} onChange={e=>setForm(f=>({...f,driver_phone:e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Bus Number</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.bus_number} onChange={e=>setForm(f=>({...f,bus_number:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Capacity</label>
                  <input type="number" min={1} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:parseInt(e.target.value)}))} /></div>
              </div>
              <div><label className="block text-[11px] text-white/40 mb-1">Stops (comma separated)</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.stops} onChange={e=>setForm(f=>({...f,stops:e.target.value}))} placeholder="Gate 1, Hostel, Library…" /></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Status</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {["Active","Inactive","Maintenance"].map(s=><option key={s} value={s}>{s}</option>)}
                </select></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setEditRoute(null);}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Saving…":editRoute?"Update":"Add Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ── LIBRARY ── */
export function LibraryTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:"", author:"", isbn:"", category:"", copies_total:1, copies_available:1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/library?search=${encodeURIComponent(search)}`);
    if (r.ok) { const j = await r.json(); setBooks(j.data || []); }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await fetch("/api/library", { 
        method:"POST", 
        headers:{"Content-Type":"application/json"}, 
        body:JSON.stringify(form) 
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to add book");

      setSaving(false); setShowAdd(false);
      setForm({ title:"", author:"", isbn:"", category:"", copies_total:1, copies_available:1 });
      load();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const rows = [["Title","Author","ISBN","Category","Total","Available"],
      ...books.map(b=>[b.title, b.author, b.isbn||"", b.category||"", b.copies_total, b.copies_available])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="library.csv"; a.click();
  };

  const totalIssued = books.reduce((s, b) => s + (Array.isArray(b.library_issues) ? b.library_issues.length : 0), 0);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {label:"Total Books", val:books.length, color:"indigo"},
          {label:"Total Copies", val:books.reduce((s,b)=>s+b.copies_total,0), color:"violet"},
          {label:"Currently Issued", val:totalIssued, color:"amber"},
        ].map(({label,val,color})=>(
          <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
            <div className={`text-xl font-bold text-${color}-300 font-mono`}>{val}</div>
            <div className={`text-[11px] text-${color}-300/60 mt-0.5`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[220px]">
            <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
            <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-full" placeholder="Search by title…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Book
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/10 bg-white/[0.02]">
                {["Title","Author","ISBN","Category","Copies","Issued","Availability"].map(h=>(
                  <th key={h} className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {books.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-white/30 text-sm">No books found</td></tr>
                ) : books.map(b => {
                  const issued = Array.isArray(b.library_issues) ? b.library_issues.length : 0;
                  const availPct = b.copies_total > 0 ? (b.copies_available/b.copies_total)*100 : 0;
                  return (
                    <tr key={b.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4 text-sm text-white font-medium">{b.title}</td>
                      <td className="py-3 px-4 text-sm text-white/60">{b.author}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-white/40">{b.isbn||"—"}</td>
                      <td className="py-3 px-4 text-[11px] text-white/50">{b.category||"—"}</td>
                      <td className="py-3 px-4 font-mono text-sm text-white">{b.copies_total}</td>
                      <td className="py-3 px-4 font-mono text-sm text-amber-300">{issued}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${availPct>50?"bg-emerald-400":availPct>20?"bg-amber-400":"bg-red-400"}`} style={{width:`${availPct}%`}} />
                          </div>
                          <span className="text-[11px] text-white/50">{b.copies_available} avail</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">Add Book</h2>
              <button onClick={()=>{setShowAdd(false);setError("");}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={save} className="space-y-3">
              <div><label className="block text-[11px] text-white/40 mb-1">Title *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Author *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">ISBN</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.isbn} onChange={e=>setForm(f=>({...f,isbn:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Category</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Total Copies</label>
                  <input type="number" min={1} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.copies_total} onChange={e=>setForm(f=>({...f,copies_total:parseInt(e.target.value),copies_available:parseInt(e.target.value)}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Available</label>
                  <input type="number" min={0} max={form.copies_total} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.copies_available} onChange={e=>setForm(f=>({...f,copies_available:parseInt(e.target.value)}))} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Adding…":"Add Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
