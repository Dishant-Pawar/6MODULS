"use client";
import { useEffect, useState, useCallback } from "react";
import KanbanPipeline from "@/components/KanbanPipeline";
import TransactionsPanel from "@/components/TransactionsPanel";

type Application = {
  id: string; application_id: string; applicant_name: string; email: string; phone?: string;
  status: string; documents_verified: number; documents_total: number;
  applied_at: string; programs?: { name: string; code: string };
};
type Transaction = {
  id: string; txn_id: string; amount: number; type: string;
  status: string; gateway?: string; reference?: string;
  created_at: string; students?: { full_name: string; student_id: string };
};
type Program = { id: string; name: string; code: string; degree_type: string };
type Student = { id: string; full_name: string; student_id: string };

type Tab = "pipeline" | "transactions" | "feestructure";

export default function AdmissionsFinance() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [applications, setApplications] = useState<Application[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [appForm, setAppForm] = useState({ applicant_name: "", email: "", phone: "", program_id: "" });
  const [saving, setSaving] = useState(false);
  const [appError, setAppError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [appsR, txnR, progR, stuR] = await Promise.all([
      fetch("/api/applications?limit=100"),
      fetch("/api/transactions?limit=100"),
      fetch("/api/programs"),
      fetch("/api/students?limit=100"),
    ]);
    if (appsR.ok) { const j = await appsR.json(); setApplications(j.data || []); }
    if (txnR.ok)  { const j = await txnR.json();  setTransactions(j.data || []); }
    if (progR.ok) { const j = await progR.json(); setPrograms(j.data || []); }
    if (stuR.ok)  { const j = await stuR.json();  setStudents(j.data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // KPIs
  const kpis = {
    revenue:    transactions.filter(t=>t.status==="Settled").reduce((s,t)=>s+t.amount,0),
    pending:    transactions.filter(t=>["Processing","Pending"].includes(t.status)).reduce((s,t)=>s+t.amount,0),
    apps:       applications.length,
    admitted:   applications.filter(a=>a.status==="Admitted").length,
    rejected:   applications.filter(a=>a.status==="Rejected").length,
    screening:  applications.filter(a=>a.status==="Screening").length,
  };

  const moveApp = async (id: string, status: string) => {
    await fetch(`/api/applications/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status }) });
    fetchAll();
  };

  const deleteApp = async (id: string) => {
    if (!confirm("Remove this application?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const updateDocs = async (id: string, verified: number) => {
    await fetch(`/api/applications/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ documents_verified: verified }) });
    fetchAll();
  };

  const submitApp = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setAppError("");
    const r = await fetch("/api/applications", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(appForm) });
    const j = await r.json();
    if (!r.ok) { setAppError(j.error || "Failed"); setSaving(false); return; }
    setShowNewApp(false); setAppForm({ applicant_name:"", email:"", phone:"", program_id:"" }); fetchAll();
    setSaving(false);
  };

  const exportApps = () => {
    const rows = [["App ID","Name","Email","Program","Status","Applied"],
      ...applications.map(a=>[a.application_id, a.applicant_name, a.email, a.programs?.name||"", a.status, new Date(a.applied_at).toLocaleDateString()])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="applications.csv"; a.click();
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Page Header */}
        <div className="px-8 pt-8 pb-5 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Admissions & Finance</h1>
              <p className="text-sm text-white/40">Manage applications, track the pipeline, and record payments.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportApps} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
                <span className="material-symbols-outlined text-[15px]">download</span> Export Apps
              </button>
              <button onClick={() => setShowNewApp(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-indigo-500/20">
                <span className="material-symbols-outlined text-[16px]">person_add</span> New Application
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Revenue",    val: `$${(kpis.revenue/1000).toFixed(1)}K`,  icon: "account_balance_wallet", color: "emerald" },
              { label: "Pending",    val: `$${(kpis.pending/1000).toFixed(1)}K`,  icon: "pending_actions",        color: "amber"   },
              { label: "Total Apps", val: kpis.apps,                              icon: "description",            color: "indigo"  },
              { label: "Screening",  val: kpis.screening,                         icon: "manage_search",          color: "orange"  },
              { label: "Admitted",   val: kpis.admitted,                          icon: "check_circle",           color: "teal"    },
              { label: "Rejected",   val: kpis.rejected,                          icon: "cancel",                 color: "red"     },
            ].map(({ label, val, icon, color }) => (
              <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-3`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`material-symbols-outlined text-[14px] text-${color}-300`}>{icon}</span>
                  <span className={`text-[10px] text-${color}-300/70 uppercase tracking-wider`}>{label}</span>
                </div>
                <div className={`text-lg font-bold text-${color}-300 font-mono leading-none`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 mt-5 bg-white/5 p-1 rounded-xl w-fit">
            {([
              { key: "pipeline",      label: "Pipeline",      icon: "view_kanban"  },
              { key: "transactions",  label: "Transactions",  icon: "payments"     },
              { key: "feestructure",  label: "Fee Structure", icon: "price_check"  },
            ] as const).map(({ key, label, icon }) => (
              <button key={key} onClick={() => setTab(key as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 lg:p-8 space-y-5">
          {tab === "pipeline" && (
            <KanbanPipeline applications={applications} loading={loading} onMove={moveApp} onDelete={deleteApp} onDocsUpdate={updateDocs} />
          )}
          {tab === "transactions" && (
            <TransactionsPanel transactions={transactions} students={students} loading={loading} onRefresh={fetchAll} />
          )}
          {tab === "feestructure" && <FeeStructureTab programs={programs} />}
        </div>
      </main>

      {/* New Application Modal */}
      {showNewApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">New Application</h2>
              <button onClick={() => { setShowNewApp(false); setAppError(""); }} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            {appError && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{appError}</div>}
            <form onSubmit={submitApp} className="space-y-3">
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Applicant Name *</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={appForm.applicant_name} onChange={e=>setAppForm(f=>({...f,applicant_name:e.target.value}))} required />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Email *</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={appForm.email} onChange={e=>setAppForm(f=>({...f,email:e.target.value}))} required />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Phone</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={appForm.phone} onChange={e=>setAppForm(f=>({...f,phone:e.target.value}))} />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Program *</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={appForm.program_id} onChange={e=>setAppForm(f=>({...f,program_id:e.target.value}))} required>
                  <option value="">Select program…</option>
                  {programs.map(p=><option key={p.id} value={p.id}>{p.degree_type} {p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowNewApp(false);setAppError("");}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Submitting…" : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FeeStructureTab({ programs }: { programs: Program[] }) {
  type FeeRow = {
    id: string; program_id?: string; academic_year: string;
    tuition_fee: number; lab_fee: number; library_fee: number;
    hostel_fee: number; transport_fee: number; other_fee: number;
    total_fee: number; currency: string; notes?: string;
    programs?: { name: string; code: string; degree_type: string };
  };
  const EMPTY = { program_id:"", academic_year:"2024-25", tuition_fee:0, lab_fee:0, library_fee:0, hostel_fee:0, transport_fee:0, other_fee:0, currency:"INR", notes:"" };

  const [fees, setFees]         = useState<FeeRow[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow]   = useState<FeeRow|null>(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/fee-structures");
    if (r.ok) { const j = await r.json(); setFees(j.data||[]); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const computeTotal = (f: typeof EMPTY) =>
    (f.tuition_fee||0)+(f.lab_fee||0)+(f.library_fee||0)+(f.hostel_fee||0)+(f.transport_fee||0)+(f.other_fee||0);

  const filtered = fees.filter(f => {
    const q = search.toLowerCase();
    return !q || (f.programs?.name||"").toLowerCase().includes(q) || f.academic_year.includes(q);
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const payload = { ...form, total_fee: computeTotal(form as any) };
    const url  = editRow ? `/api/fee-structures/${editRow.id}` : "/api/fee-structures";
    const method = editRow ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const j = await r.json();
    if (!r.ok) { setError(j.error||"Failed to save"); setSaving(false); return; }
    setSaving(false); setShowModal(false); setEditRow(null); setForm(EMPTY); load();
  };

  const openEdit = (row: FeeRow) => {
    setEditRow(row);
    setForm({ program_id:row.program_id||"", academic_year:row.academic_year, tuition_fee:row.tuition_fee, lab_fee:row.lab_fee, library_fee:row.library_fee, hostel_fee:row.hostel_fee, transport_fee:row.transport_fee, other_fee:row.other_fee, currency:row.currency, notes:row.notes||"" });
    setShowModal(true);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this fee record?")) return;
    await fetch(`/api/fee-structures/${id}`, { method:"DELETE" });
    load();
  };

  const fmt = (n: number, cur: string) => `${cur==="INR"?"₹":"$"}${n.toLocaleString("en-IN")}`;

  const exportCSV = () => {
    const rows = [["Program","Year","Tuition","Lab","Library","Hostel","Transport","Other","Total","Currency"],
      ...filtered.map(f=>[f.programs?.name||"", f.academic_year, f.tuition_fee, f.lab_fee, f.library_fee, f.hostel_fee, f.transport_fee, f.other_fee, f.total_fee, f.currency])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="fee_structure.csv"; a.click();
  };

  const FEE_FIELDS: { key: keyof typeof EMPTY; label: string }[] = [
    {key:"tuition_fee",   label:"Tuition Fee"},
    {key:"lab_fee",       label:"Lab Fee"},
    {key:"library_fee",   label:"Library Fee"},
    {key:"hostel_fee",    label:"Hostel Fee"},
    {key:"transport_fee", label:"Transport Fee"},
    {key:"other_fee",     label:"Other Fee"},
  ];

  return (
    <>
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          {label:"Programs Listed",  val:fees.length,                                                     color:"indigo"},
          {label:"Avg Tuition",      val:fees.length>0?fmt(Math.round(fees.reduce((s,f)=>s+f.tuition_fee,0)/fees.length), fees[0]?.currency||"INR"):"—", color:"emerald"},
          {label:"Highest Total",    val:fees.length>0?fmt(Math.max(...fees.map(f=>f.total_fee)), fees[0]?.currency||"INR"):"—",                           color:"amber"},
        ].map(({label,val,color})=>(
          <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
            <div className={`text-lg font-bold text-${color}-300 font-mono leading-none`}>{val}</div>
            <div className={`text-[11px] text-${color}-300/60 mt-1`}>{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[220px]">
            <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
            <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-full" placeholder="Search program or year…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={()=>{setEditRow(null);setForm(EMPTY);setError("");setShowModal(true);}} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Fee Structure
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/10 bg-white/[0.02]">
                {["Program","Year","Tuition","Lab","Library","Hostel","Transport","Other","Total / Year","Action"].map(h=>(
                  <th key={h} className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length===0 ? (
                  <tr><td colSpan={10} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-white/30">
                      <span className="material-symbols-outlined text-3xl">price_check</span>
                      <span className="text-sm">No fee structures yet — click "Add Fee Structure" to begin</span>
                    </div>
                  </td></tr>
                ) : filtered.map(f=>(
                  <tr key={f.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-white">{f.programs?.name||"Unknown Program"}</div>
                      <div className="text-[10px] text-white/40 font-mono">{f.programs?.code} · {f.programs?.degree_type}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-indigo-300 bg-indigo-500/10 rounded text-center">{f.academic_year}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white/70">{fmt(f.tuition_fee, f.currency)}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white/50">{f.lab_fee>0?fmt(f.lab_fee,f.currency):"—"}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white/50">{f.library_fee>0?fmt(f.library_fee,f.currency):"—"}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white/50">{f.hostel_fee>0?fmt(f.hostel_fee,f.currency):"—"}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white/50">{f.transport_fee>0?fmt(f.transport_fee,f.currency):"—"}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white/50">{f.other_fee>0?fmt(f.other_fee,f.currency):"—"}</td>
                    <td className="py-3 px-4 font-mono text-sm text-emerald-300 font-bold">{fmt(f.total_fee, f.currency)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>openEdit(f)} className="w-7 h-7 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/30 hover:text-indigo-300" title="Edit">
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                        </button>
                        <button onClick={()=>del(f.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-300" title="Delete">
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editRow?"Edit Fee Structure":"Add Fee Structure"}</h2>
              <button onClick={()=>{setShowModal(false);setEditRow(null);setError("");}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-white/40 mb-1">Program *</label>
                  <select required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" value={form.program_id} onChange={e=>setForm(f=>({...f,program_id:e.target.value}))}>
                    <option value="">Select program…</option>
                    {programs.map(p=><option key={p.id} value={p.id}>{p.degree_type} {p.name} ({p.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Academic Year *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" placeholder="e.g. 2024-25" value={form.academic_year} onChange={e=>setForm(f=>({...f,academic_year:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Currency</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                    {["INR","USD","GBP","EUR"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Fee fields grid */}
              <div className="grid grid-cols-2 gap-3">
                {FEE_FIELDS.map(({key,label})=>(
                  <div key={key}>
                    <label className="block text-[11px] text-white/40 mb-1">{label}</label>
                    <input type="number" min={0} step={100}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                      value={(form as any)[key]}
                      onChange={e=>setForm(f=>({...f,[key]:parseFloat(e.target.value)||0}))}
                    />
                  </div>
                ))}
              </div>

              {/* Live total preview */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm text-emerald-300/70">Computed Total / Year</span>
                <span className="text-xl font-bold text-emerald-300 font-mono">
                  {form.currency==="INR"?"₹":"$"}{computeTotal(form as any).toLocaleString("en-IN")}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-white/40 mb-1">Notes</label>
                <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Additional info, scholarships, etc." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowModal(false);setEditRow(null);setError("");}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Saving…":editRow?"Update":"Add Fee Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
