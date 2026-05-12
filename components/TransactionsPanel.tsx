"use client";
import { useState } from "react";

type Transaction = {
  id: string; txn_id: string; amount: number; type: string;
  status: string; gateway?: string; reference?: string;
  created_at: string; students?: { full_name: string; student_id: string };
};

const STATUS_STYLES: Record<string, string> = {
  Settled:    "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Processing: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Failed:     "bg-red-500/10 text-red-300 border-red-500/20",
  Pending:    "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
};
const STATUS_DOT: Record<string, string> = {
  Settled: "bg-emerald-400", Processing: "bg-amber-400", Failed: "bg-red-400", Pending: "bg-indigo-400",
};

const TXN_TYPES = ["Tuition","Lab Fee","Application Fee","Deposit","Hostel","Library Fine","Exam Fee","Other"];
const GATEWAYS  = ["Stripe","Razorpay","Wire Transfer","Cash","UPI","Net Banking"];

type Props = {
  transactions: Transaction[];
  students: { id: string; full_name: string; student_id: string }[];
  loading: boolean;
  onRefresh: () => void;
};

export default function TransactionsPanel({ transactions, students, loading, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ student_id: "", amount: "", type: "Tuition", gateway: "Stripe", reference: "" });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.txn_id.toLowerCase().includes(q) || (t.students?.full_name || "").toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    const rows = [["TXN ID","Student","Type","Amount","Gateway","Status","Date"],
      ...filtered.map(t=>[t.txn_id, t.students?.full_name||"", t.type, t.amount, t.gateway||"", t.status, new Date(t.created_at).toLocaleDateString()])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="transactions.csv"; a.click();
  };

  const addTxn = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/transactions", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false); setShowAdd(false); setForm({ student_id:"", amount:"", type:"Tuition", gateway:"Stripe", reference:"" });
    onRefresh();
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/transactions/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status }) });
    setUpdatingId(null); onRefresh();
  };

  const totals = {
    settled:    transactions.filter(t=>t.status==="Settled").reduce((s,t)=>s+t.amount,0),
    processing: transactions.filter(t=>t.status==="Processing").reduce((s,t)=>s+t.amount,0),
    failed:     transactions.filter(t=>t.status==="Failed").reduce((s,t)=>s+t.amount,0),
  };

  return (
    <>
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Collected", val: totals.settled, color: "emerald" },
          { label: "Processing", val: totals.processing, color: "amber" },
          { label: "Failed", val: totals.failed, color: "red" },
        ].map(({ label, val, color }) => (
          <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
            <p className={`text-[11px] text-${color}-300/70 mb-1`}>{label}</p>
            <p className={`text-lg font-bold text-${color}-300 font-mono`}>${val.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3 justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
              <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-40" placeholder="Search TXN, student…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {["Settled","Processing","Pending","Failed"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={()=>setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-[15px]">add</span> Record Payment
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {["TXN ID","Student","Type","Amount","Gateway","Date","Status","Action"].map(h=>(
                    <th key={h} className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-white/30 text-sm">No transactions found</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-3 px-4 font-mono text-[11px] text-white/50">{t.txn_id}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-white">{t.students?.full_name || "—"}</div>
                      {t.students?.student_id && <div className="text-[10px] text-white/30 font-mono">{t.students.student_id}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-white/70">{t.type}</td>
                    <td className="py-3 px-4 font-mono text-sm text-white font-semibold">${t.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-white/50">{t.gateway || "—"}</td>
                    <td className="py-3 px-4 text-[11px] text-white/30">{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border font-mono ${STATUS_STYLES[t.status] || "bg-white/10 text-white/40 border-white/10"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status]}`} />{t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {updatingId === t.id ? (
                        <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <select
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/60 outline-none hover:border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          value={t.status}
                          onChange={e => updateStatus(t.id, e.target.value)}
                        >
                          {["Settled","Processing","Pending","Failed"].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="p-3 border-t border-white/5 text-xs text-white/30 text-right">{filtered.length} transactions · Total: ${filtered.reduce((s,t)=>s+t.amount,0).toFixed(2)}</div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">Record Payment</h2>
              <button onClick={()=>setShowAdd(false)} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <form onSubmit={addTxn} className="space-y-3">
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Student</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.student_id} onChange={e=>setForm(f=>({...f,student_id:e.target.value}))}>
                  <option value="">No student (walk-in)</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Amount (USD) *</label>
                  <input type="number" min="0" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Type</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {TXN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Gateway</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.gateway} onChange={e=>setForm(f=>({...f,gateway:e.target.value}))}>
                    {GATEWAYS.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Reference</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50" value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} placeholder="Optional" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
