"use client";
import { useState } from "react";

type Exam = {
  id: string; exam_type: string; scheduled_at: string; room?: string; duration_minutes?: number;
  total_marks?: number; status?: string;
  courses?: { name: string; code: string; faculty?: { full_name: string } };
};
type Course = { id: string; code: string; name: string; faculty?: { full_name: string }; programs?: { name: string } };

const EXAM_TYPES = ["Mid-Term", "End-Term", "Quiz", "Assignment", "Practical", "Viva"];
const EXAM_STATUS_STYLES: Record<string, string> = {
  Scheduled: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  Ongoing:   "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
};

type Props = {
  exams: Exam[];
  courses: Course[];
  loading: boolean;
  onRefresh: () => void;
};

export default function ExamScheduleTab({ exams, courses, loading, onRefresh }: Props) {
  const [showAdd, setShowAdd]   = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState({ course_id: "", exam_type: "Mid-Term", scheduled_at: "", room: "", duration_minutes: 180, total_marks: 100 });
  const [saving, setSaving]     = useState(false);
  const [filterType, setFilterType] = useState("");

  const filtered = filterType ? exams.filter(e => e.exam_type === filterType) : exams;

  const submitExam = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editId) {
      await fetch(`/api/exams/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "Scheduled" }) });
    }
    setSaving(false); setShowAdd(false); setEditId(null);
    setForm({ course_id: "", exam_type: "Mid-Term", scheduled_at: "", room: "", duration_minutes: 180, total_marks: 100 });
    onRefresh();
  };

  const openEdit = (ex: Exam) => {
    setEditId(ex.id);
    setForm({
      course_id: "", exam_type: ex.exam_type,
      scheduled_at: ex.scheduled_at ? ex.scheduled_at.slice(0, 16) : "",
      room: ex.room || "", duration_minutes: ex.duration_minutes || 180, total_marks: ex.total_marks || 100,
    });
    setShowAdd(true);
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/exams/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    onRefresh();
  };

  return (
    <>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-xs text-white/30">{filtered.length} exams</span>
          </div>
          <button onClick={() => { setEditId(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-violet-500/20">
            <span className="material-symbols-outlined text-[16px]">add</span> Schedule Exam
          </button>
        </div>

        {/* Exam List */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">event_busy</span>
            <span className="text-sm">No exams scheduled</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(ex => {
              const dt = new Date(ex.scheduled_at);
              const isPast = dt < new Date();
              return (
                <div key={ex.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.03] transition-colors group">
                  {/* Date block */}
                  <div className="shrink-0 w-14 text-center">
                    <div className="text-xs text-white/30 uppercase">{dt.toLocaleString("en-IN", { month: "short" })}</div>
                    <div className="text-2xl font-bold text-white leading-none">{dt.getDate()}</div>
                    <div className="text-[10px] text-white/30">{dt.getFullYear()}</div>
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-white">{ex.courses?.name}</span>
                      <span className="text-[10px] font-mono bg-white/10 text-white/50 px-1.5 py-0.5 rounded">{ex.courses?.code}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${EXAM_STATUS_STYLES[ex.status || "Scheduled"]}`}>{ex.status || "Scheduled"}</span>
                    </div>
                    <div className="text-[11px] text-white/40 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span>{dt.toLocaleTimeString("en-IN", { timeStyle: "short" })}</span>
                      {ex.room && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">meeting_room</span>{ex.room}</span>}
                      {ex.duration_minutes && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">timer</span>{ex.duration_minutes}min</span>}
                      {ex.total_marks && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">scoreboard</span>{ex.total_marks} marks</span>}
                      {ex.courses?.faculty?.full_name && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span>{ex.courses.faculty.full_name}</span>}
                    </div>
                    <div className="text-xs font-semibold text-violet-300 mt-0.5">{ex.exam_type}</div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/60 outline-none" value={ex.status || "Scheduled"} onChange={e => updateStatus(ex.id, e.target.value)}>
                      {["Scheduled","Ongoing","Completed","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => openEdit(ex)} className="w-7 h-7 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/40 hover:text-indigo-300" title="Edit">
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </button>
                    <button onClick={() => deleteExam(ex.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-300" title="Delete">
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
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
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editId ? "Edit Exam" : "Schedule New Exam"}</h2>
              <button onClick={() => { setShowAdd(false); setEditId(null); }} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <form onSubmit={submitExam} className="space-y-3">
              {!editId && (
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Course *</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))} required>
                    <option value="">Select course…</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Type</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.exam_type} onChange={e => setForm(f => ({ ...f, exam_type: e.target.value }))}>
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Room</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="Hall A" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Date & Time *</label>
                <input type="datetime-local" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Duration (min)</label>
                  <input type="number" min={30} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 uppercase tracking-wider mb-1">Total Marks</label>
                  <input type="number" min={1} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.total_marks} onChange={e => setForm(f => ({ ...f, total_marks: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : editId ? "Update" : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
