"use client";
import { useEffect, useState, useCallback } from "react";
import ExamScheduleTab from "@/components/ExamScheduleTab";
import MarksTab from "@/components/MarksTab";
import CoursesTab from "@/components/CoursesTab";

type Exam   = { id: string; exam_type: string; scheduled_at: string; room?: string; duration_minutes?: number; total_marks?: number; status?: string; courses?: { name: string; code: string; faculty?: { full_name: string } } };
type Course = { id: string; code: string; name: string; credits?: number; faculty?: { full_name: string }; programs?: { name: string; code: string }; room?: string; schedule_day?: string; schedule_time?: string };
type Faculty = { id: string; full_name: string; department?: string };
type Program = { id: string; name: string; code: string; degree_type: string };

type Tab = "exams" | "marks" | "courses";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "exams",     label: "Exam Schedule", icon: "fact_check"  },
  { key: "marks",     label: "Marks Entry",   icon: "scoreboard"  },
  { key: "courses",   label: "Courses",       icon: "menu_book"   },
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];

export default function AcademicOperations() {
  const [tab, setTab]       = useState<Tab>("exams");
  const [exams, setExams]   = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [exR, coR, facR, proR] = await Promise.all([
      fetch("/api/exams"),
      fetch("/api/courses"),
      fetch("/api/faculty?limit=100"),
      fetch("/api/programs"),
    ]);
    if (exR.ok)  { const j = await exR.json();  setExams(j.data   || []); }
    if (coR.ok)  { const j = await coR.json();  setCourses(j.data || []); }
    if (facR.ok) { const j = await facR.json(); setFaculty(j.data || []); }
    if (proR.ok) { const j = await proR.json(); setPrograms(j.data|| []); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // KPIs
  const upcomingExams   = exams.filter(e => new Date(e.scheduled_at) > new Date());
  const todaysExams     = exams.filter(e => new Date(e.scheduled_at).toDateString() === new Date().toDateString());
  const completedExams  = exams.filter(e => e.status === "Completed");

  return (
    <main className="flex-1 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-white/10">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Academic Operations</h1>
          <p className="text-sm text-white/40">Manage courses, schedule exams, and enter assessment marks.</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Courses",    value: courses.length,       icon: "menu_book",    color: "indigo"  },
            { label: "Upcoming Exams",   value: upcomingExams.length, icon: "fact_check",   color: "violet"  },
            { label: "Today's Exams",    value: todaysExams.length,   icon: "today",        color: "amber"   },
            { label: "Completed",        value: completedExams.length,icon: "check_circle", color: "emerald" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[18px] text-${color}-300`}>{icon}</span>
              </div>
              <div>
                <div className="text-xl font-bold text-white leading-none">{value}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
              <span className="material-symbols-outlined text-[16px]">{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 lg:p-8">
        {tab === "exams"     && <ExamScheduleTab exams={exams} courses={courses} loading={loading} onRefresh={fetchAll} />}
        {tab === "marks"     && <MarksTab courses={courses} />}
        {tab === "courses"   && <CoursesTab courses={courses} faculty={faculty} programs={programs} loading={loading} onRefresh={fetchAll} />}
      </div>
    </main>
  );
}
