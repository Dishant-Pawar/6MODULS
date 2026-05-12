"use client";
import { useEffect, useState, useCallback } from "react";

type Student = { id: string; student_id: string; full_name: string; email: string; phone?: string; year: number; semester: number; status: string; created_at: string; programs?: { name: string; code: string; degree_type: string } };
type Program = { id: string; name: string; code: string; degree_type: string };

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Exchange: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "On Leave": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Graduated: "bg-white/10 text-white/50 border-white/10",
  Inactive: "bg-red-500/20 text-red-300 border-red-500/30",
};

const STATUSES = ["Active", "On Leave", "Exchange", "Graduated", "Inactive"];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

type Props = { programs: Program[] };

export default function StudentsTab({ programs }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", program_id: "", year: 1, semester: 1, status: "Active" });
  const [editForm, setEditForm] = useState<Partial<Student & { program_id: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const limit = 10;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit), search });
    if (statusFilter) p.set("status", statusFilter);
    const r = await fetch(`/api/students?${p}`);
    if (r.ok) { const j = await r.json(); setStudents(j.data || []); setTotal(j.count || 0); }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const exportCSV = () => {
    const rows = [["ID","Name","Email","Phone","Program","Year","Sem","Status"],
      ...students.map(s => [s.student_id, s.full_name, s.email, s.phone||"", s.programs?.name||"", s.year, s.semester, s.status])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "students.csv"; a.click();
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const r = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) { setError(j.error || "Failed"); setSaving(false); return; }
    setShowAdd(false); setForm({ full_name: "", email: "", phone: "", program_id: "", year: 1, semester: 1, status: "Active" }); fetch_();
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!selected) return; setSaving(true);
    await fetch(`/api/students/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setSaving(false); setSelected(null); fetch_();
  };

  const deleteStudent = async (id: string) => {
    if (!confirm("Delete this student? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to delete student");
      
      setSelected(null); 
      fetch_();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openDrawer = (s: Student) => { setSelected(s); setEditForm({ full_name: s.full_name, email: s.email, phone: s.phone, year: s.year, semester: s.semester, status: s.status }); };
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3 justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[220px]">
            <span className="material-symbols-outlined text-white/40 text-[18px]">search</span>
            <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-full" placeholder="Search name, email, ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 text-sm transition-colors">
            <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20">
            <span className="material-symbols-outlined text-[16px]">person_add</span> Add Student
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-60"><div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["Student Info", "Student ID", "Program & Year", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="py-3 px-5 text-[11px] font-semibold text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-white/30 text-sm">No students found</td></tr>
              ) : students.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => openDrawer(s)}>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 border border-white/10 flex items-center justify-center text-white font-bold text-xs shrink-0">{initials(s.full_name)}</div>
                      <div>
                        <div className="text-sm font-semibold text-white">{s.full_name}</div>
                        <div className="text-xs text-white/40">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs text-white/70">{s.student_id}</td>
                  <td className="py-4 px-5">
                    <div className="text-sm text-white">{s.programs?.name || "—"}</div>
                    <div className="text-xs text-white/40">Year {s.year} · Sem {s.semester}</div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${STATUS_STYLES[s.status] || "bg-white/10 text-white/40 border-white/10"}`}>{s.status}</span>
                  </td>
                  <td className="py-4 px-5 text-xs text-white/40">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="py-4 px-5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openDrawer(s)} className="w-7 h-7 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/40 hover:text-indigo-300 transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={() => deleteStudent(s.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-300 transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-white/40">Showing {Math.min((page-1)*limit+1,total)}–{Math.min(page*limit,total)} of {total}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/5 disabled:opacity-30">
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          {Array.from({length: Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded border text-xs font-semibold transition-colors ${page===p?"bg-indigo-500/20 border-indigo-500/30 text-indigo-300":"border-white/10 text-white/40 hover:bg-white/5"}`}>{p}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/5 disabled:opacity-30">
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Edit Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-[#0e1018] border-l border-white/10 flex flex-col shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 border border-white/10 flex items-center justify-center text-white font-bold text-sm">{initials(selected.full_name)}</div>
                <div>
                  <div className="text-sm font-semibold text-white">{selected.full_name}</div>
                  <div className="text-xs text-white/40 font-mono">{selected.student_id}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <p className="text-[11px] text-white/30 uppercase tracking-widest">Edit Student Profile</p>
              {[
                { label: "Full Name", key: "full_name", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Phone", key: "phone", type: "tel" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                    value={(editForm as any)[key] || ""} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Year</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    value={editForm.year||1} onChange={e=>setEditForm(f=>({...f,year:parseInt(e.target.value)}))}>
                    {[1,2,3,4,5].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Semester</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    value={editForm.semester||1} onChange={e=>setEditForm(f=>({...f,semester:parseInt(e.target.value)}))}>
                    {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(st => (
                    <button key={st} onClick={() => setEditForm(f => ({ ...f, status: st }))}
                      className={`px-3 py-1 rounded-full text-xs border transition-all ${editForm.status===st ? STATUS_STYLES[st] : "border-white/10 text-white/40 hover:border-white/20"}`}>{st}</button>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">Read-only Info</p>
                  <div className="flex justify-between text-xs"><span className="text-white/40">Program</span><span className="text-white">{selected.programs?.name || "—"}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-white/40">Degree</span><span className="text-white">{selected.programs?.degree_type || "—"}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-white/40">Enrolled</span><span className="text-white">{new Date(selected.created_at).toLocaleDateString("en-IN")}</span></div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button onClick={() => deleteStudent(selected.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">Add New Student</h2>
              <button onClick={() => { setShowAdd(false); setError(""); }} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
            <form onSubmit={addStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Full Name *</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Email *</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Phone</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Program *</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.program_id} onChange={e=>setForm(f=>({...f,program_id:e.target.value}))} required>
                    <option value="">Select program…</option>
                    {programs.map(p=><option key={p.id} value={p.id}>{p.degree_type} {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Year</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.year} onChange={e=>setForm(f=>({...f,year:parseInt(e.target.value)}))}>
                    {[1,2,3,4,5].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Semester</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.semester} onChange={e=>setForm(f=>({...f,semester:parseInt(e.target.value)}))}>
                    {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setError("");}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Adding…" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
