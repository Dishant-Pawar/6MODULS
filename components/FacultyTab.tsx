"use client";
import { useEffect, useState, useCallback } from "react";

type Faculty = { id: string; faculty_id: string; full_name: string; email: string; phone?: string; department?: string; designation?: string; specialization?: string; status: string; joined_at?: string; created_at: string };

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Inactive: "bg-red-500/20 text-red-300 border-red-500/30",
  "On Leave": "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Visiting Faculty", "Research Scholar"];
const DEPARTMENTS = ["Computer Science", "Engineering", "Business", "Arts & Design", "Mathematics", "Physics", "Chemistry"];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function FacultyTab() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", department: "", designation: "", specialization: "" });
  const [editForm, setEditForm] = useState<Partial<Faculty>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/faculty?search=${encodeURIComponent(search)}&limit=50`);
    if (r.ok) { const j = await r.json(); setFaculty(j.data || []); setTotal(j.count || 0); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const exportCSV = () => {
    const rows = [["Faculty ID","Name","Email","Department","Designation","Status"],
      ...faculty.map(f => [f.faculty_id, f.full_name, f.email, f.department||"", f.designation||"", f.status])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "faculty.csv"; a.click();
  };

  const addFaculty = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    const r = await fetch("/api/faculty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) { setError(j.error || "Failed"); setSaving(false); return; }
    setShowAdd(false); setForm({ full_name: "", email: "", phone: "", department: "", designation: "", specialization: "" }); fetch_();
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!selected) return; setSaving(true);
    await fetch(`/api/faculty/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setSaving(false); setSelected(null); fetch_();
  };

  const deleteFaculty = async (id: string) => {
    if (!confirm("Delete this faculty member? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/faculty/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to delete faculty member");
      
      setSelected(null); 
      fetch_();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openDrawer = (f: Faculty) => { setSelected(f); setEditForm({ full_name: f.full_name, email: f.email, phone: f.phone, department: f.department, designation: f.designation, specialization: f.specialization, status: f.status }); };

  return (
    <>
      {/* Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3 justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[220px]">
          <span className="material-symbols-outlined text-white/40 text-[18px]">search</span>
          <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-full" placeholder="Search faculty…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">{total} members</span>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 text-sm transition-colors">
            <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-violet-500/20">
            <span className="material-symbols-outlined text-[16px]">person_add</span> Add Faculty
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-5 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-60"><div className="w-7 h-7 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>
        ) : faculty.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">school</span>
            <span className="text-sm">No faculty found</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {faculty.map(f => (
              <button key={f.id} onClick={() => openDrawer(f)} className="group text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 hover:bg-white/[0.07] transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">{initials(f.full_name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{f.full_name}</div>
                    <div className="text-xs text-white/40 truncate">{f.email}</div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${STATUS_STYLES[f.status] || "bg-white/10 text-white/40 border-white/10"}`}>{f.status}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="material-symbols-outlined text-[13px]">badge</span>
                    <span className="font-mono">{f.faculty_id}</span>
                  </div>
                  {f.department && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="material-symbols-outlined text-[13px]">domain</span>
                      <span className="truncate">{f.department}</span>
                    </div>
                  )}
                  {f.designation && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="material-symbols-outlined text-[13px]">workspace_premium</span>
                      <span className="truncate">{f.designation}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-[#0e1018] border-l border-white/10 flex flex-col shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center text-white font-bold text-sm">{initials(selected.full_name)}</div>
                <div>
                  <div className="text-sm font-semibold text-white">{selected.full_name}</div>
                  <div className="text-xs text-white/40 font-mono">{selected.faculty_id}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <p className="text-[11px] text-white/30 uppercase tracking-widest">Edit Faculty Profile</p>
              {[{ label: "Full Name", key: "full_name", type: "text" }, { label: "Email", key: "email", type: "email" }, { label: "Phone", key: "phone", type: "tel" }, { label: "Specialization", key: "specialization", type: "text" }].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">{label}</label>
                  <input type={type} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
                    value={(editForm as any)[key] || ""} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Department</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={editForm.department||""} onChange={e=>setEditForm(f=>({...f,department:e.target.value}))}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Designation</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={editForm.designation||""} onChange={e=>setEditForm(f=>({...f,designation:e.target.value}))}>
                  <option value="">Select…</option>
                  {DESIGNATIONS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-2">Status</label>
                <div className="flex gap-2">
                  {["Active","On Leave","Inactive"].map(st=>(
                    <button key={st} onClick={()=>setEditForm(f=>({...f,status:st}))}
                      className={`px-3 py-1 rounded-full text-xs border transition-all ${editForm.status===st ? STATUS_STYLES[st] : "border-white/10 text-white/40 hover:border-white/20"}`}>{st}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button onClick={() => deleteFaculty(selected.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm transition-colors">
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">Add New Faculty</h2>
              <button onClick={()=>{setShowAdd(false);setError("");}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
            <form onSubmit={addFaculty} className="space-y-3">
              {[{label:"Full Name",key:"full_name",type:"text",req:true},{label:"Email",key:"email",type:"email",req:true},{label:"Phone",key:"phone",type:"tel",req:false},{label:"Specialization",key:"specialization",type:"text",req:false}].map(({label,key,type,req})=>(
                <div key={key}>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">{label}{req?" *":""}</label>
                  <input type={type} required={req} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                    value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Department</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Designation</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.designation} onChange={e=>setForm(f=>({...f,designation:e.target.value}))}>
                  <option value="">Select…</option>
                  {DESIGNATIONS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setError("");}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Adding…" : "Add Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
