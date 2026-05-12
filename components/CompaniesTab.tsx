"use client";
import { useEffect, useState, useCallback } from "react";

type Company = {
  id: string; name: string; industry: string; website?: string; location?: string;
  contact_name?: string; contact_email?: string; contact_phone?: string; tier?: string;
  placement_drives?: { id: string; job_title: string; status: string; package_lpa?: number }[];
};

const INDUSTRIES = ["Technology","Finance","Healthcare","Manufacturing","Consulting","Media","E-Commerce","Education","Retail","Other"];
const TIERS = ["Tier 1","Tier 2","Tier 3","Dream","Super Dream"];
const TIER_STYLE: Record<string,string> = {
  "Super Dream": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Dream":       "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Tier 1":      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Tier 2":      "bg-indigo-500/20 text-indigo-300 border-indigo-500/20",
  "Tier 3":      "bg-white/10 text-white/50 border-white/10",
};

type Props = { companies: Company[]; loading: boolean; onRefresh: () => void };

export default function CompaniesTab({ companies, loading, onRefresh }: Props) {
  const [search, setSearch]     = useState("");
  const [indFilter, setInd]     = useState("");
  const [showAdd, setShowAdd]   = useState(false);
  const [editCo, setEditCo]     = useState<Company|null>(null);
  const [form, setForm] = useState({ name:"", industry:"Technology", website:"", location:"", contact_name:"", contact_email:"", contact_phone:"", tier:"Tier 1" });
  const [saving, setSaving]     = useState(false);

  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)) && (!indFilter || c.industry===indFilter);
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editCo) {
      await fetch(`/api/companies/${editCo.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    } else {
      await fetch("/api/companies", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    }
    setSaving(false); setShowAdd(false); setEditCo(null);
    setForm({ name:"", industry:"Technology", website:"", location:"", contact_name:"", contact_email:"", contact_phone:"", tier:"Tier 1" });
    onRefresh();
  };

  const openEdit = (c: Company) => {
    setEditCo(c);
    setForm({ name:c.name, industry:c.industry, website:c.website||"", location:c.location||"", contact_name:c.contact_name||"", contact_email:c.contact_email||"", contact_phone:c.contact_phone||"", tier:c.tier||"Tier 1" });
    setShowAdd(true);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    await fetch(`/api/companies/${id}`, { method:"DELETE" });
    onRefresh();
  };

  const exportCSV = () => {
    const rows = [["Name","Industry","Tier","Location","Contact","Email","Website","Drives"],
      ...filtered.map(c=>[c.name, c.industry, c.tier||"", c.location||"", c.contact_name||"", c.contact_email||"", c.website||"", Array.isArray(c.placement_drives)?c.placement_drives.length:0])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="companies.csv"; a.click();
  };

  return (
    <>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
              <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-36" placeholder="Search companies…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={indFilter} onChange={e=>setInd(e.target.value)}>
              <option value="">All Industries</option>
              {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
            </select>
            <span className="text-xs text-white/30">{filtered.length} companies</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={()=>{setEditCo(null);setShowAdd(true);}} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-teal-500/20">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Company
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"/></div>
        ) : filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">business</span>
            <span className="text-sm">No companies found</span>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c=>{
              const drives = Array.isArray(c.placement_drives) ? c.placement_drives : [];
              const avgPkg = drives.filter(d=>d.package_lpa).reduce((s,d,_,arr)=>s+(d.package_lpa||0)/arr.length,0);
              return (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                        {c.tier && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${TIER_STYLE[c.tier]||"bg-white/10 text-white/40 border-white/10"}`}>{c.tier}</span>}
                      </div>
                      <div className="text-[11px] text-white/40">{c.industry}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={()=>openEdit(c)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-indigo-500/20 text-white/30 hover:text-indigo-300"><span className="material-symbols-outlined text-[13px]">edit</span></button>
                      <button onClick={()=>del(c.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-white/30 hover:text-red-300"><span className="material-symbols-outlined text-[13px]">delete</span></button>
                    </div>
                  </div>
                  <div className="space-y-1 text-[11px] text-white/40 mb-3">
                    {c.location && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">location_on</span>{c.location}</div>}
                    {c.contact_name && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">person</span>{c.contact_name}</div>}
                    {c.contact_email && <div className="flex items-center gap-1.5 truncate"><span className="material-symbols-outlined text-[12px]">mail</span><span className="truncate">{c.contact_email}</span></div>}
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors" onClick={e=>e.stopPropagation()}><span className="material-symbols-outlined text-[12px]">link</span><span className="truncate">{c.website.replace(/^https?:\/\//,"")}</span></a>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-white/30">{drives.length} drive{drives.length!==1?"s":""}</span>
                    {avgPkg>0 && <span className="text-[10px] text-emerald-300 font-mono">Avg ₹{avgPkg.toFixed(1)}L</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editCo?"Edit Company":"Add Company"}</h2>
              <button onClick={()=>{setShowAdd(false);setEditCo(null);}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-[11px] text-white/40 mb-1">Company Name *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500/50" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Industry</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))}>
                    {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                  </select></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Tier</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.tier} onChange={e=>setForm(f=>({...f,tier:e.target.value}))}>
                    {TIERS.map(t=><option key={t} value={t}>{t}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-[11px] text-white/40 mb-1">Location</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="City, Country" /></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Website</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Contact Person</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.contact_name} onChange={e=>setForm(f=>({...f,contact_name:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Contact Phone</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.contact_phone} onChange={e=>setForm(f=>({...f,contact_phone:e.target.value}))} /></div>
              </div>
              <div><label className="block text-[11px] text-white/40 mb-1">Contact Email</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.contact_email} onChange={e=>setForm(f=>({...f,contact_email:e.target.value}))} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setEditCo(null);}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Saving…":editCo?"Update":"Add Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
