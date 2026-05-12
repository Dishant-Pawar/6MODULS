"use client";
import { useEffect, useState, useCallback } from "react";

type Drive = {
  id: string; job_title: string; job_type: string; package_lpa?: number;
  scheduled_at?: string; status: string; openings: number; description?: string;
  companies?: { name: string; industry: string };
};
type Company = { id: string; name: string; industry: string };

const STATUS_STYLE: Record<string,string> = {
  Upcoming:  "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  Ongoing:   "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Completed: "bg-white/5 text-white/40 border-white/10",
  Cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
};
const JOB_TYPES = ["Full-Time","Internship","Part-Time","Contract"];

type Props = { companies: Company[]; onRefresh: () => void };

export default function DrivesTab({ companies, onRefresh }: Props) {
  const [drives, setDrives]       = useState<Drive[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [typeFilter, setType]     = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [editDrive, setEditDrive] = useState<Drive|null>(null);
  const [showDetail, setDetail]   = useState<Drive|null>(null);
  const [form, setForm] = useState({ company_id:"", job_title:"", job_type:"Full-Time", package_lpa:"", scheduled_at:"", openings:1, description:"", status:"Upcoming" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/placements");
    if (r.ok) { const j = await r.json(); setDrives(j.data||[]); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = drives.filter(d => {
    const q = search.toLowerCase();
    const mQ = !q || d.job_title.toLowerCase().includes(q) || (d.companies?.name||"").toLowerCase().includes(q);
    return mQ && (!statusFilter||d.status===statusFilter) && (!typeFilter||d.job_type===typeFilter);
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, package_lpa: parseFloat(form.package_lpa)||null };
    if (editDrive) {
      await fetch(`/api/placements/${editDrive.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    } else {
      await fetch("/api/placements", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    }
    setSaving(false); setShowAdd(false); setEditDrive(null);
    setForm({ company_id:"", job_title:"", job_type:"Full-Time", package_lpa:"", scheduled_at:"", openings:1, description:"", status:"Upcoming" });
    load(); onRefresh();
  };

  const openEdit = (d: Drive) => {
    setEditDrive(d);
    setForm({ company_id:"", job_title:d.job_title, job_type:d.job_type, package_lpa:String(d.package_lpa||""), scheduled_at:d.scheduled_at?.slice(0,10)||"", openings:d.openings, description:d.description||"", status:d.status });
    setShowAdd(true);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this drive?")) return;
    await fetch(`/api/placements/${id}`, { method:"DELETE" });
    setDetail(null); load(); onRefresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/placements/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    load(); onRefresh();
    setDetail(prev => prev?.id===id ? {...prev,status} : prev);
  };

  const exportCSV = () => {
    const rows = [["Company","Role","Type","Package (LPA)","Openings","Date","Status"],
      ...filtered.map(d=>[d.companies?.name||"", d.job_title, d.job_type, d.package_lpa||"", d.openings, d.scheduled_at?new Date(d.scheduled_at).toLocaleDateString():"TBD", d.status])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="placement_drives.csv"; a.click();
  };

  const avgPkg = drives.filter(d=>d.package_lpa).reduce((s,d,_,arr)=>s+(d.package_lpa||0)/arr.length,0);

  return (
    <>
      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          {label:"Total Drives", val:drives.length, color:"indigo"},
          {label:"Upcoming",     val:drives.filter(d=>d.status==="Upcoming").length, color:"violet"},
          {label:"Ongoing",      val:drives.filter(d=>d.status==="Ongoing").length, color:"emerald"},
          {label:"Avg Package",  val:avgPkg>0?`₹${avgPkg.toFixed(1)}L`:"—", color:"amber"},
        ].map(({label,val,color})=>(
          <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
            <div className={`text-xl font-bold text-${color}-300 font-mono leading-none`}>{val}</div>
            <div className={`text-[11px] text-${color}-300/60 mt-1`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
              <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-36" placeholder="Company, role…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={statusFilter} onChange={e=>setStatus(e.target.value)}>
              <option value="">All Status</option>
              {["Upcoming","Ongoing","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={typeFilter} onChange={e=>setType(e.target.value)}>
              <option value="">All Types</option>
              {JOB_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={()=>{setEditDrive(null);setShowAdd(true);}} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-indigo-500/20">
              <span className="material-symbols-outlined text-[16px]">add</span> New Drive
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/10 bg-white/[0.02]">
                {["Company","Role","Type","Package","Openings","Date","Status","Action"].map(h=>(
                  <th key={h} className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length===0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-white/30 text-sm">No placement drives found</td></tr>
                ) : filtered.map(d=>(
                  <tr key={d.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={()=>setDetail(d)}>
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-white">{d.companies?.name||"—"}</div>
                      <div className="text-[10px] text-white/40 font-mono">{d.companies?.industry}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white/80">{d.job_title}</td>
                    <td className="py-3 px-4 text-[11px] text-white/50">{d.job_type}</td>
                    <td className="py-3 px-4 font-mono text-sm text-emerald-300 font-semibold">{d.package_lpa?`₹${d.package_lpa}L`:"—"}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white">{d.openings}</td>
                    <td className="py-3 px-4 text-[11px] text-white/40 font-mono">{d.scheduled_at?new Date(d.scheduled_at).toLocaleDateString("en-IN"):"TBD"}</td>
                    <td className="py-3 px-4" onClick={e=>e.stopPropagation()}>
                      <select className={`text-[10px] px-2 py-1 rounded border outline-none font-mono ${STATUS_STYLE[d.status]||"bg-white/10 text-white/40 border-white/10"}`} value={d.status} onChange={e=>updateStatus(d.id,e.target.value)}>
                        {["Upcoming","Ongoing","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4" onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>openEdit(d)} className="w-7 h-7 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/30 hover:text-indigo-300"><span className="material-symbols-outlined text-[15px]">edit</span></button>
                        <button onClick={()=>del(d.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-300"><span className="material-symbols-outlined text-[15px]">delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length>0 && <div className="p-3 border-t border-white/5 text-xs text-white/30 text-right">{filtered.length} drives · {filtered.reduce((s,d)=>s+d.openings,0)} total openings</div>}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editDrive?"Edit Drive":"New Placement Drive"}</h2>
              <button onClick={()=>{setShowAdd(false);setEditDrive(null);}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              {!editDrive && (
                <div><label className="block text-[11px] text-white/40 mb-1">Company *</label>
                  <select required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.company_id} onChange={e=>setForm(f=>({...f,company_id:e.target.value}))}>
                    <option value="">Select company…</option>
                    {companies.map(c=><option key={c.id} value={c.id}>{c.name} ({c.industry})</option>)}
                  </select></div>
              )}
              <div><label className="block text-[11px] text-white/40 mb-1">Job Title *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={form.job_title} onChange={e=>setForm(f=>({...f,job_title:e.target.value}))} /></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Description</label>
                <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Job Type</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.job_type} onChange={e=>setForm(f=>({...f,job_type:e.target.value}))}>
                    {JOB_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Package (LPA)</label>
                  <input type="number" step="0.1" min="0" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.package_lpa} onChange={e=>setForm(f=>({...f,package_lpa:e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Date</label>
                  <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Openings</label>
                  <input type="number" min={1} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.openings} onChange={e=>setForm(f=>({...f,openings:parseInt(e.target.value)}))} /></div>
              </div>
              <div><label className="block text-[11px] text-white/40 mb-1">Status</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {["Upcoming","Ongoing","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
                </select></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setEditDrive(null);}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Saving…":editDrive?"Update":"Create Drive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-4" onClick={()=>setDetail(null)}>
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-full" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="text-[10px] text-white/30 font-mono mb-0.5">{showDetail.companies?.name} · {showDetail.companies?.industry}</div>
                <h2 className="text-base font-semibold text-white">{showDetail.job_title}</h2>
              </div>
              <button onClick={()=>setDetail(null)} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white shrink-0"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:"Type", val:showDetail.job_type},
                  {label:"Openings", val:showDetail.openings},
                  {label:"Package", val:showDetail.package_lpa?`₹${showDetail.package_lpa}L`:"Not disclosed"},
                  {label:"Date", val:showDetail.scheduled_at?new Date(showDetail.scheduled_at).toLocaleDateString("en-IN"):"TBD"},
                ].map(({label,val})=>(
                  <div key={label} className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-white/30 mb-0.5">{label}</div>
                    <div className="text-sm text-white font-semibold">{val}</div>
                  </div>
                ))}
              </div>
              {showDetail.description && <div className="bg-white/5 rounded-lg p-3"><div className="text-[10px] text-white/30 mb-1">Description</div><p className="text-sm text-white/70 leading-relaxed">{showDetail.description}</p></div>}
              <div>
                <div className="text-[11px] text-white/40 mb-2">Update Status</div>
                <div className="flex flex-wrap gap-2">
                  {["Upcoming","Ongoing","Completed","Cancelled"].map(s=>(
                    <button key={s} onClick={()=>updateStatus(showDetail.id,s)}
                      className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${showDetail.status===s?STATUS_STYLE[s]+" font-semibold":"border-white/10 text-white/40 hover:border-white/20"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>{openEdit(showDetail);setDetail(null);}} className="flex-1 py-2 rounded-lg border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 text-sm flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">edit</span> Edit
                </button>
                <button onClick={()=>del(showDetail.id)} className="flex-1 py-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 text-sm flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">delete</span> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
