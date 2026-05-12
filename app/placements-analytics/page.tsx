"use client";
import { useEffect, useState, useCallback } from "react";
import DrivesTab    from "@/components/DrivesTab";
import CompaniesTab from "@/components/CompaniesTab";

type Tab = "drives" | "companies" | "analytics";
type Drive   = { id: string; job_title: string; job_type: string; package_lpa?: number; scheduled_at?: string; status: string; openings: number; companies?: { name: string; industry: string } };
type Company = { id: string; name: string; industry: string; website?: string; location?: string; contact_name?: string; contact_email?: string; contact_phone?: string; tier?: string; placement_drives?: any[] };

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key:"drives",    label:"Placement Drives", icon:"business_center" },
  { key:"companies", label:"Companies",         icon:"business"       },
  { key:"analytics", label:"Analytics",         icon:"analytics"      },
];

export default function PlacementsAnalytics() {
  const [tab, setTab]           = useState<Tab>("drives");
  const [drives, setDrives]     = useState<Drive[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [dR, cR] = await Promise.all([fetch("/api/placements"), fetch("/api/companies")]);
    if (dR.ok) { const j = await dR.json(); setDrives(j.data||[]); }
    if (cR.ok) { const j = await cR.json(); setCompanies(j.data||[]); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  /* ── KPIs ── */
  const totalDrives   = drives.length;
  const upcoming      = drives.filter(d=>d.status==="Upcoming").length;
  const completed     = drives.filter(d=>d.status==="Completed").length;
  const totalOpenings = drives.reduce((s,d)=>s+d.openings,0);
  const avgPkg        = drives.filter(d=>d.package_lpa).reduce((s,d,_,a)=>s+(d.package_lpa||0)/a.length,0);
  const maxPkg        = Math.max(0,...drives.map(d=>d.package_lpa||0));
  const minPkg        = Math.min(...drives.filter(d=>d.package_lpa).map(d=>d.package_lpa||Infinity));

  /* ── Analytics derived data ── */
  const byIndustry = companies.reduce<Record<string,number>>((acc,c)=>{
    acc[c.industry] = (acc[c.industry]||0) + 1; return acc;
  },{});
  const byType = drives.reduce<Record<string,number>>((acc,d)=>{
    acc[d.job_type] = (acc[d.job_type]||0) + 1; return acc;
  },{});
  const byStatus = drives.reduce<Record<string,number>>((acc,d)=>{
    acc[d.status] = (acc[d.status]||0) + 1; return acc;
  },{});
  const topCompanies = [...companies]
    .filter(c=>Array.isArray(c.placement_drives)&&c.placement_drives.length>0)
    .sort((a,b)=>(b.placement_drives?.length||0)-(a.placement_drives?.length||0))
    .slice(0,5);
  const pkgDrives = drives.filter(d=>d.package_lpa).sort((a,b)=>(b.package_lpa||0)-(a.package_lpa||0)).slice(0,5);

  return (
    <main className="flex-1 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-white/10">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Placements & Reports</h1>
          <p className="text-sm text-white/40">Manage recruitment drives, company relationships, and track analytics.</p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {[
            {label:"Total Drives",  val:totalDrives,  color:"indigo"},
            {label:"Upcoming",      val:upcoming,      color:"violet"},
            {label:"Completed",     val:completed,     color:"emerald"},
            {label:"Companies",     val:companies.length, color:"teal"},
            {label:"Total Openings",val:totalOpenings, color:"amber"},
            {label:"Avg Package",   val:avgPkg>0?`₹${avgPkg.toFixed(1)}L`:"—", color:"pink"},
          ].map(({label,val,color})=>(
            <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-3`}>
              <div className={`text-xl font-bold text-${color}-300 font-mono leading-none`}>{val}</div>
              <div className={`text-[10px] text-${color}-300/50 mt-1`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
          {TABS.map(({key,label,icon})=>(
            <button key={key} onClick={()=>setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===key?"bg-white/10 text-white shadow-sm":"text-white/40 hover:text-white hover:bg-white/5"}`}>
              <span className="material-symbols-outlined text-[16px]">{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-8">
        {tab==="drives"    && <DrivesTab    companies={companies.map(c=>({id:c.id,name:c.name,industry:c.industry}))} onRefresh={load} />}
        {tab==="companies" && <CompaniesTab companies={companies} loading={loading} onRefresh={load} />}

        {/* ── Analytics Tab ── */}
        {tab==="analytics" && (
          <div className="space-y-6">
            {/* Summary row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {label:"Highest Package", val:maxPkg>0?`₹${maxPkg}L`:"—", sub:"Best offer received",          color:"yellow", icon:"emoji_events"},
                {label:"Average Package", val:avgPkg>0?`₹${avgPkg.toFixed(1)}L`:"—", sub:"Across all drives", color:"emerald", icon:"trending_up"},
                {label:"Lowest Package",  val:(minPkg<Infinity&&minPkg>0)?`₹${minPkg}L`:"—", sub:"Entry-level offers", color:"indigo", icon:"trending_down"},
              ].map(({label,val,sub,color,icon})=>(
                <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-5 flex items-center gap-4`}>
                  <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-${color}-300 text-[22px]`}>{icon}</span>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold text-${color}-300 font-mono`}>{val}</div>
                    <div className="text-[11px] text-white/40">{label}</div>
                    <div className="text-[10px] text-white/25">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drive Status breakdown */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-indigo-300">donut_large</span>Drive Status
                </h3>
                <div className="space-y-3">
                  {Object.entries(byStatus).map(([status,count])=>{
                    const pct = Math.round((count/drives.length)*100);
                    const colors: Record<string,string> = { Upcoming:"bg-indigo-400", Ongoing:"bg-emerald-400", Completed:"bg-white/40", Cancelled:"bg-red-400" };
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-white/60">{status}</span>
                          <span className="text-white font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${colors[status]||"bg-white/30"}`} style={{width:`${pct}%`}} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(byStatus).length===0 && <div className="text-sm text-white/30 text-center py-4">No data yet</div>}
                </div>
              </div>

              {/* Job type breakdown */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-teal-300">work</span>Job Type Mix
                </h3>
                <div className="space-y-3">
                  {Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([type,count])=>{
                    const pct = Math.round((count/drives.length)*100);
                    const colors: Record<string,string> = { "Full-Time":"bg-violet-400", "Internship":"bg-teal-400", "Part-Time":"bg-amber-400", "Contract":"bg-pink-400" };
                    return (
                      <div key={type}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-white/60">{type}</span>
                          <span className="text-white font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[type]||"bg-white/30"}`} style={{width:`${pct}%`}} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(byType).length===0 && <div className="text-sm text-white/30 text-center py-4">No data yet</div>}
                </div>
              </div>

              {/* Top companies by drives */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-300">leaderboard</span>Most Active Companies
                </h3>
                {topCompanies.length===0 ? (
                  <div className="text-sm text-white/30 text-center py-4">No data yet</div>
                ) : (
                  <div className="space-y-3">
                    {topCompanies.map((c,i)=>{
                      const n = c.placement_drives?.length||0;
                      const max = topCompanies[0].placement_drives?.length||1;
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <div className="w-5 text-right text-[11px] text-white/30 font-mono shrink-0">#{i+1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white truncate">{c.name}</span>
                              <span className="text-white/50 font-mono shrink-0 ml-2">{n} drive{n!==1?"s":""}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-400" style={{width:`${(n/max)*100}%`}} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top packages */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-yellow-300">payments</span>Highest Packages
                </h3>
                {pkgDrives.length===0 ? (
                  <div className="text-sm text-white/30 text-center py-4">No package data yet</div>
                ) : (
                  <div className="space-y-3">
                    {pkgDrives.map((d,i)=>(
                      <div key={d.id} className="flex items-center gap-3">
                        <div className="w-5 text-right text-[11px] text-white/30 font-mono shrink-0">#{i+1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <div className="min-w-0">
                              <div className="text-xs text-white truncate">{d.job_title}</div>
                              <div className="text-[10px] text-white/40 truncate">{d.companies?.name}</div>
                            </div>
                            <div className="text-sm font-bold text-emerald-300 font-mono shrink-0 ml-2">₹{d.package_lpa}L</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Industry breakdown */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-pink-300">pie_chart</span>Industry Distribution
              </h3>
              {Object.keys(byIndustry).length===0 ? (
                <div className="text-sm text-white/30 text-center py-4">No company data yet</div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {Object.entries(byIndustry).sort((a,b)=>b[1]-a[1]).map(([ind,count])=>(
                    <div key={ind} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-xs text-white">{ind}</span>
                      <span className="text-xs font-bold text-white/60 font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
