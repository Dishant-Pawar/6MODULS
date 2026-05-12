"use client";
import { useState, useEffect, useCallback } from "react";

type Mark = {
  id: string; student_id: string; course_id: string; exam_type: string;
  theory_marks?: number; practical_marks?: number;
  theory_max: number; practical_max: number;
  grade?: string;
  students?: { full_name: string; student_id: string };
};
type Course = { id: string; code: string; name: string };

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-emerald-300", A: "text-emerald-400", B: "text-teal-300",
  C: "text-amber-300", D: "text-orange-300", F: "text-red-300",
};

function calcGrade(pct: number) {
  if (pct >= 90) return "A+"; if (pct >= 80) return "A";
  if (pct >= 70) return "B";  if (pct >= 60) return "C";
  if (pct >= 50) return "D";  return "F";
}

type Props = { courses: Course[] };

export default function MarksTab({ courses }: Props) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || "");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [edits, setEdits] = useState<Record<string, { theory: string; practical: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const fetchMarks = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    const params = new URLSearchParams({ course_id: selectedCourse });
    if (examTypeFilter) params.set("exam_type", examTypeFilter);
    const r = await fetch(`/api/marks?${params}`);
    if (r.ok) {
      const j = await r.json();
      setMarks(j.data || []);
      const initEdits: Record<string, { theory: string; practical: string }> = {};
      (j.data || []).forEach((m: Mark) => {
        initEdits[m.id] = {
          theory: m.theory_marks !== undefined ? String(m.theory_marks) : "",
          practical: m.practical_marks !== undefined ? String(m.practical_marks) : "",
        };
      });
      setEdits(initEdits);
    }
    setLoading(false);
  }, [selectedCourse, examTypeFilter]);

  useEffect(() => { fetchMarks(); setSavedIds(new Set()); }, [fetchMarks]);

  const saveMark = async (m: Mark) => {
    setSaving(m.id);
    const edit = edits[m.id] || {};
    await fetch("/api/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: m.student_id, course_id: m.course_id,
        exam_type: m.exam_type,
        theory_marks: edit.theory !== "" ? parseFloat(edit.theory) : null,
        practical_marks: edit.practical !== "" ? parseFloat(edit.practical) : null,
        theory_max: m.theory_max, practical_max: m.practical_max,
      }),
    });
    setSaving(null);
    setSavedIds(prev => new Set([...prev, m.id]));
    fetchMarks();
  };

  const saveAll = async () => {
    for (const m of marks) { await saveMark(m); }
  };

  const exportCSV = () => {
    const rows = [["Student ID","Name","Exam Type","Theory","Practical","Total","Grade"],
      ...marks.map(m => {
        const e = edits[m.id] || {};
        const th = parseFloat(e.theory||"0")||0;
        const pr = parseFloat(e.practical||"0")||0;
        const tot = th+pr; const max = m.theory_max+m.practical_max;
        return [m.students?.student_id||"", m.students?.full_name||"", m.exam_type, th, pr, tot, calcGrade(max>0?tot/max*100:0)];
      })];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="marks.csv"; a.click();
  };

  const examTypes = [...new Set(marks.map(m => m.exam_type))];
  const avg = marks.length > 0 ? marks.reduce((s, m) => {
    const e = edits[m.id]||{}; const th=parseFloat(e.theory||"0")||0; const pr=parseFloat(e.practical||"0")||0;
    return s + (th+pr)/((m.theory_max+m.practical_max)||100)*100;
  }, 0)/marks.length : 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] text-white/30 mb-1">Course</label>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-white/30 mb-1">Exam Type</label>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={examTypeFilter} onChange={e => setExamTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {marks.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
              <div className="text-[10px] text-white/30">Class Avg</div>
              <div className={`text-base font-bold ${avg>=60?"text-emerald-300":avg>=40?"text-amber-300":"text-red-300"}`}>{avg.toFixed(1)}%</div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
            <span className="material-symbols-outlined text-[15px]">download</span> Export
          </button>
          <button onClick={saveAll} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-emerald-500/20">
            <span className="material-symbols-outlined text-[15px]">save</span> Save All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
        ) : marks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">assignment</span>
            <span className="text-sm">No marks entries for this course</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Roll No</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Student</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider">Exam</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider text-right">Theory</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider text-right">Practical</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider text-right">Total</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider text-center">Grade</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider text-center">Pct</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-white/30 uppercase tracking-wider text-center">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {marks.map(m => {
                  const e = edits[m.id] || { theory: "", practical: "" };
                  const th = parseFloat(e.theory) || 0;
                  const pr = parseFloat(e.practical) || 0;
                  const tot = th + pr;
                  const max = m.theory_max + m.practical_max;
                  const pct = max > 0 ? (tot / max) * 100 : 0;
                  const grade = calcGrade(pct);
                  const isDirty = e.theory !== String(m.theory_marks ?? "") || e.practical !== String(m.practical_marks ?? "");
                  const isSaved = savedIds.has(m.id);

                  return (
                    <tr key={m.id} className={`transition-colors hover:bg-white/[0.03] ${isDirty ? "bg-amber-500/[0.03]" : ""}`}>
                      <td className="py-3 px-4 font-mono text-[11px] text-white/50">{m.students?.student_id}</td>
                      <td className="py-3 px-4 text-sm text-white">{m.students?.full_name}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono">{m.exam_type}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number" min={0} max={m.theory_max} step={0.5}
                            className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-right outline-none focus:border-violet-500/50 transition-colors"
                            value={e.theory}
                            onChange={ev => setEdits(p => ({ ...p, [m.id]: { ...p[m.id], theory: ev.target.value } }))}
                          />
                          <span className="text-[10px] text-white/30">/{m.theory_max}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number" min={0} max={m.practical_max} step={0.5}
                            className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-right outline-none focus:border-violet-500/50 transition-colors"
                            value={e.practical}
                            onChange={ev => setEdits(p => ({ ...p, [m.id]: { ...p[m.id], practical: ev.target.value } }))}
                          />
                          <span className="text-[10px] text-white/30">/{m.practical_max}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-white font-semibold">{tot > 0 ? tot : "—"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-sm font-bold ${GRADE_COLOR[grade] || "text-white/40"}`}>{tot > 0 ? grade : "—"}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {tot > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct>=60?"bg-emerald-400":pct>=40?"bg-amber-400":"bg-red-400"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-white/40">{pct.toFixed(0)}%</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {saving === m.id ? (
                          <div className="w-4 h-4 border border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                        ) : isSaved && !isDirty ? (
                          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                        ) : (
                          <button
                            onClick={() => saveMark(m)}
                            disabled={!isDirty}
                            className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${isDirty ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30" : "text-white/20 cursor-not-allowed"}`}
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
