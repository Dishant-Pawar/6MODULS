"use client";
import { useEffect, useState, useCallback } from "react";

type Ann = { id: string; title: string; content: string; target_audience: string; priority: string; created_at: string };
type Grv = { id: string; ticket_id: string; title: string; description?: string; category?: string; status: string; priority: string; created_at: string; students?: { full_name: string; student_id: string } };

const PRIORITY_STYLE: Record<string,string> = {
  Urgent: "bg-red-500/20 text-red-300 border-red-500/30",
  High:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Normal: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
};
const GRV_STATUS_STYLE: Record<string,string> = {
  Open:         "bg-red-500/10 text-red-300 border-red-500/20",
  "In Progress":"bg-amber-500/10 text-amber-300 border-amber-500/20",
  Resolved:     "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Closed:       "bg-white/5 text-white/40 border-white/10",
};

/* ─── ANNOUNCEMENTS ─── */
export function AnnouncementsTab() {
  const [items, setItems] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Ann|null>(null);
  const [form, setForm] = useState({ title:"", content:"", target_audience:"All", priority:"Normal" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/announcements");
    if (r.ok) { const j = await r.json(); setItems(j.data||[]); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()));

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editItem) {
      await fetch(`/api/announcements/${editItem.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    } else {
      await fetch("/api/announcements", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    }
    setSaving(false); setShowAdd(false); setEditItem(null);
    setForm({ title:"", content:"", target_audience:"All", priority:"Normal" });
    load();
  };

  const openEdit = (a: Ann) => {
    setEditItem(a);
    setForm({ title:a.title, content:a.content, target_audience:a.target_audience, priority:a.priority });
    setShowAdd(true);
  };

  const del = async (id: string) => {
    if (!confirm("Delete announcement?")) return;
    await fetch(`/api/announcements/${id}`, { method:"DELETE" });
    load();
  };

  const AUD_COLORS: Record<string,string> = { All:"bg-violet-500/20 text-violet-300", Students:"bg-teal-500/20 text-teal-300", Faculty:"bg-amber-500/20 text-amber-300" };

  return (
    <>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[220px]">
            <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
            <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-full" placeholder="Search announcements…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button onClick={()=>{ setEditItem(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-pink-500/20">
            <span className="material-symbols-outlined text-[16px]">campaign</span> New Announcement
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">campaign</span>
            <span className="text-sm">No announcements</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(a=>(
              <div key={a.id} className="p-4 hover:bg-white/[0.03] transition-colors group">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{a.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLE[a.priority]||"bg-white/10 text-white/40 border-white/10"}`}>{a.priority}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${AUD_COLORS[a.target_audience]||"bg-white/10 text-white/40"}`}>{a.target_audience}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={()=>openEdit(a)} className="w-7 h-7 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/30 hover:text-indigo-300"><span className="material-symbols-outlined text-[15px]">edit</span></button>
                    <button onClick={()=>del(a.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-300"><span className="material-symbols-outlined text-[15px]">delete</span></button>
                  </div>
                </div>
                <p className="text-[12px] text-white/50 line-clamp-2 mb-1">{a.content}</p>
                <div className="text-[10px] text-white/25 font-mono">{new Date(a.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editItem?"Edit":"New"} Announcement</h2>
              <button onClick={()=>{setShowAdd(false);setEditItem(null);}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="block text-[11px] text-white/40 mb-1">Title *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pink-500/50" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Content *</label>
                <textarea required rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none focus:border-pink-500/50" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Audience</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.target_audience} onChange={e=>setForm(f=>({...f,target_audience:e.target.value}))}>
                    {["All","Students","Faculty"].map(a=><option key={a} value={a}>{a}</option>)}
                  </select></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Priority</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                    {["Normal","High","Urgent"].map(p=><option key={p} value={p}>{p}</option>)}
                  </select></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setEditItem(null);}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Saving…":editItem?"Update":"Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── GRIEVANCES ─── */
export function GrievancesTab({ students }: { students: { id: string; full_name: string; student_id: string }[] }) {
  const [items, setItems] = useState<Grv[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Grv|null>(null);
  const [form, setForm] = useState({ title:"", description:"", category:"Academic", priority:"Normal", student_id:"" });
  const [saving, setSaving] = useState(false);

  const CATEGORIES = ["Academic","Infrastructure","Faculty","Administration","Hostel","Transport","Other"];

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/grievances");
    if (r.ok) { const j = await r.json(); setItems(j.data||[]); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(g => {
    const q = search.toLowerCase();
    const matchQ = !q || g.title.toLowerCase().includes(q) || g.ticket_id.toLowerCase().includes(q) || (g.students?.full_name||"").toLowerCase().includes(q);
    return matchQ && (!statusFilter||g.status===statusFilter) && (!priorityFilter||g.priority===priorityFilter);
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/grievances", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setSaving(false); setShowAdd(false);
    setForm({ title:"", description:"", category:"Academic", priority:"Normal", student_id:"" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/grievances/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    load();
    if (showDetail?.id === id) setShowDetail(prev => prev ? {...prev, status} : null);
  };

  const del = async (id: string) => {
    if (!confirm("Delete grievance?")) return;
    await fetch(`/api/grievances/${id}`, { method:"DELETE" });
    setShowDetail(null); load();
  };

  const exportCSV = () => {
    const rows = [["Ticket","Title","Student","Category","Priority","Status","Date"],
      ...filtered.map(g=>[g.ticket_id, g.title, g.students?.full_name||"", g.category||"", g.priority, g.status, new Date(g.created_at).toLocaleDateString()])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="grievances.csv"; a.click();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {label:"Total", val:items.length, color:"indigo"},
            {label:"Open", val:items.filter(g=>g.status==="Open").length, color:"red"},
            {label:"In Progress", val:items.filter(g=>g.status==="In Progress").length, color:"amber"},
            {label:"Resolved", val:items.filter(g=>g.status==="Resolved").length, color:"emerald"},
          ].map(({label,val,color})=>(
            <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
              <div className={`text-xl font-bold text-${color}-300 font-mono`}>{val}</div>
              <div className={`text-[11px] text-${color}-300/60 mt-0.5`}>{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
            <div className="flex gap-3 flex-wrap items-center">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
                <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-36" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                {["Open","In Progress","Resolved","Closed"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}>
                <option value="">All Priority</option>
                {["Normal","High","Urgent"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
                <span className="material-symbols-outlined text-[15px]">download</span> Export
              </button>
              <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-red-500/20">
                <span className="material-symbols-outlined text-[16px]">add</span> New Grievance
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"/></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-white/10 bg-white/[0.02]">
                  {["Ticket","Title","Student","Category","Priority","Status","Action"].map(h=>(
                    <th key={h} className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-white/30 text-sm">No grievances found</td></tr>
                  ) : filtered.map(g=>(
                    <tr key={g.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={()=>setShowDetail(g)}>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">{g.ticket_id}</td>
                      <td className="py-3 px-4 text-sm text-white max-w-[200px]"><div className="truncate">{g.title}</div></td>
                      <td className="py-3 px-4 text-sm text-white/60">{g.students?.full_name||"—"}</td>
                      <td className="py-3 px-4 text-[11px] text-white/50">{g.category||"—"}</td>
                      <td className="py-3 px-4"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLE[g.priority]||"bg-white/10 text-white/40 border-white/10"}`}>{g.priority}</span></td>
                      <td className="py-3 px-4" onClick={e=>e.stopPropagation()}>
                        <select className={`text-[10px] px-2 py-1 rounded border outline-none font-mono ${GRV_STATUS_STYLE[g.status]||"bg-white/10 text-white/40 border-white/10"}`} value={g.status} onChange={e=>updateStatus(g.id, e.target.value)}>
                          {["Open","In Progress","Resolved","Closed"].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-3 px-4" onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>del(g.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/20 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Grievance Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">Raise Grievance</h2>
              <button onClick={()=>setShowAdd(false)} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="block text-[11px] text-white/40 mb-1">Student</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.student_id} onChange={e=>setForm(f=>({...f,student_id:e.target.value}))}>
                  <option value="">Anonymous</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
                </select></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Title *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Description</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Category</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Priority</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                    {["Normal","High","Urgent"].map(p=><option key={p} value={p}>{p}</option>)}
                  </select></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Submitting…":"Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <div className="font-mono text-[11px] text-indigo-300">{showDetail.ticket_id}</div>
                <h2 className="text-base font-semibold text-white mt-0.5">{showDetail.title}</h2>
              </div>
              <button onClick={()=>setShowDetail(null)} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white shrink-0"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-1 rounded border ${PRIORITY_STYLE[showDetail.priority]}`}>{showDetail.priority}</span>
                <span className={`text-[10px] px-2 py-1 rounded border ${GRV_STATUS_STYLE[showDetail.status]}`}>{showDetail.status}</span>
                {showDetail.category && <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-white/50">{showDetail.category}</span>}
              </div>
              {showDetail.students && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-white/30 mb-1">Raised By</div>
                  <div className="text-sm text-white">{showDetail.students.full_name}</div>
                  <div className="text-[10px] font-mono text-white/40">{showDetail.students.student_id}</div>
                </div>
              )}
              {showDetail.description && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-white/30 mb-1">Description</div>
                  <p className="text-sm text-white/70 leading-relaxed">{showDetail.description}</p>
                </div>
              )}
              <div className="text-[10px] text-white/30 font-mono">Filed: {new Date(showDetail.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</div>
              <div>
                <div className="text-[11px] text-white/40 mb-2">Update Status</div>
                <div className="flex flex-wrap gap-2">
                  {["Open","In Progress","Resolved","Closed"].map(s=>(
                    <button key={s} onClick={()=>updateStatus(showDetail.id, s)}
                      className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${showDetail.status===s ? GRV_STATUS_STYLE[s]+" font-semibold" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={()=>del(showDetail.id)} className="w-full py-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 transition-colors text-sm flex items-center justify-center gap-1.5 mt-4">
                <span className="material-symbols-outlined text-[15px]">delete</span> Delete Grievance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
