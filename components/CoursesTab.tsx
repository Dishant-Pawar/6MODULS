"use client";
import { useState } from "react";

type Course = {
  id: string; code: string; name: string; credits?: number;
  faculty?: { full_name: string }; programs?: { name: string; code: string };
  room?: string; schedule_day?: string; schedule_time?: string;
};
type Faculty = { id: string; full_name: string; department?: string };
type Program = { id: string; name: string; code: string; degree_type: string };

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

type Props = {
  courses: Course[];
  faculty: Faculty[];
  programs: Program[];
  loading: boolean;
  onRefresh: () => void;
};

export default function CoursesTab({ courses, faculty, programs, loading, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ code: "", name: "", credits: 3, faculty_id: "", program_id: "", room: "", schedule_day: "", schedule_time: "" });
  const [saving, setSaving] = useState(false);

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.faculty?.full_name||"").toLowerCase().includes(q);
  });

  const submitCourse = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editCourse) {
      await fetch(`/api/courses/${editCourse.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false); setShowAdd(false); setEditCourse(null);
    setForm({ code: "", name: "", credits: 3, faculty_id: "", program_id: "", room: "", schedule_day: "", schedule_time: "" });
    onRefresh();
  };

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setForm({ code: c.code, name: c.name, credits: c.credits || 3, faculty_id: "", program_id: "", room: c.room || "", schedule_day: c.schedule_day || "", schedule_time: c.schedule_time || "" });
    setShowAdd(true);
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const exportCSV = () => {
    const rows = [["Code","Name","Credits","Faculty","Program","Room"],
      ...courses.map(c=>[c.code, c.name, c.credits||"", c.faculty?.full_name||"", c.programs?.name||"", c.room||""])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="courses.csv"; a.click();
  };

  return (
    <>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3 justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-[220px]">
            <span className="material-symbols-outlined text-white/30 text-[16px]">search</span>
            <input className="bg-transparent outline-none text-white text-sm placeholder-white/30 w-full" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={() => { setEditCourse(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-indigo-500/20">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Course
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">menu_book</span>
            <span className="text-sm">No courses found</span>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">{c.code}</span>
                      {c.credits && <span className="text-[10px] text-white/30">{c.credits} cr</span>}
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">{c.name}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="w-6 h-6 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/40 hover:text-indigo-300">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                    <button onClick={() => deleteCourse(c.id)} className="w-6 h-6 rounded hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-300">
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-[11px] text-white/40">
                  {c.faculty?.full_name && (
                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[13px]">person</span>{c.faculty.full_name}</div>
                  )}
                  {c.programs?.name && (
                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[13px]">school</span>{c.programs.name}</div>
                  )}
                  {c.room && (
                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[13px]">meeting_room</span>{c.room}</div>
                  )}
                  {c.schedule_day && c.schedule_time && (
                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[13px]">schedule</span>{c.schedule_day} · {c.schedule_time}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editCourse ? "Edit Course" : "Add New Course"}</h2>
              <button onClick={() => { setShowAdd(false); setEditCourse(null); }} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <form onSubmit={submitCourse} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Code *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="CS101" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Credits</label>
                  <input type="number" min={1} max={6} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Course Name *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Faculty</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.faculty_id} onChange={e => setForm(f => ({ ...f, faculty_id: e.target.value }))}>
                    <option value="">Select…</option>
                    {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Program</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.program_id} onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))}>
                    <option value="">Select…</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.degree_type} {p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Room</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="A101" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Day</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.schedule_day} onChange={e => setForm(f => ({ ...f, schedule_day: e.target.value }))}>
                    <option value="">—</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Time</label>
                  <input type="time" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.schedule_time} onChange={e => setForm(f => ({ ...f, schedule_time: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditCourse(null); }} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : editCourse ? "Update Course" : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
