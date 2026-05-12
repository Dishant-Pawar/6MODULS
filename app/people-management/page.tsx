"use client";
import { useEffect, useState, useCallback } from "react";
import StudentsTab from "@/components/StudentsTab";
import FacultyTab from "@/components/FacultyTab";
import type { Program } from "@/lib/supabase";

type Tab = "Students" | "Faculty" | "Security";

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "Students", icon: "school", label: "Students" },
  { key: "Faculty", icon: "badge", label: "Faculty" },
  { key: "Security", icon: "shield", label: "Security Logs" },
];

export default function PeopleManagement() {
  const [tab, setTab] = useState<Tab>("Students");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [stats, setStats] = useState({ students: 0, faculty: 0, active: 0, onLeave: 0 });

  const loadStats = useCallback(async () => {
    const [studRes, facRes, leaveRes] = await Promise.all([
      fetch("/api/students?limit=1"),
      fetch("/api/faculty?limit=1"),
      fetch("/api/students?limit=1&status=On Leave"),
    ]);
    const [s, f, l] = await Promise.all([studRes.json(), facRes.json(), leaveRes.json()]);
    const activeRes = await fetch("/api/students?limit=1&status=Active");
    const a = await activeRes.json();
    setStats({ students: s.count || 0, faculty: f.count || 0, active: a.count || 0, onLeave: l.count || 0 });
  }, []);

  const loadPrograms = useCallback(async () => {
    const r = await fetch("/api/programs");
    if (r.ok) { const j = await r.json(); setPrograms(j.data || []); }
  }, []);

  useEffect(() => { loadStats(); loadPrograms(); }, [loadStats, loadPrograms]);

  return (
    <main className="flex-1 overflow-y-auto flex flex-col">
      {/* Page Header */}
      <div className="px-8 pt-8 pb-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">People Management</h1>
            <p className="text-sm text-white/40">Manage students, faculty members, and access controls.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Students", value: stats.students, icon: "school", color: "indigo" },
            { label: "Active Students", value: stats.active, icon: "check_circle", color: "emerald" },
            { label: "On Leave", value: stats.onLeave, icon: "bedtime", color: "amber" },
            { label: "Faculty Members", value: stats.faculty, icon: "badge", color: "violet" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${color}-500/20`}>
                <span className={`material-symbols-outlined text-[18px] text-${color}-300`}>{icon}</span>
              </div>
              <div>
                <div className="text-lg font-bold text-white leading-none">{value}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mt-5 bg-white/5 p-1 rounded-xl w-fit">
          {TABS.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}
            >
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === "Students" && <StudentsTab programs={programs} />}
        {tab === "Faculty" && <FacultyTab />}
        {tab === "Security" && <SecurityLogs />}
      </div>
    </main>
  );
}

function SecurityLogs() {
  const logs = [
    { id: 1, action: "Student record updated", user: "Admin", time: new Date().toISOString(), type: "edit" },
    { id: 2, action: "Faculty member added", user: "Admin", time: new Date(Date.now() - 3600000).toISOString(), type: "create" },
    { id: 3, action: "Student deleted", user: "Admin", time: new Date(Date.now() - 7200000).toISOString(), type: "delete" },
    { id: 4, action: "Bulk export performed", user: "Admin", time: new Date(Date.now() - 86400000).toISOString(), type: "export" },
  ];
  const colors: Record<string, string> = {
    edit: "bg-indigo-500/20 text-indigo-300",
    create: "bg-emerald-500/20 text-emerald-300",
    delete: "bg-red-500/20 text-red-300",
    export: "bg-amber-500/20 text-amber-300",
  };
  const icons: Record<string, string> = { edit: "edit", create: "add_circle", delete: "delete", export: "download" };

  return (
    <div className="flex-1 p-8">
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Audit Log</h3>
          <span className="text-xs text-white/30">{logs.length} recent events</span>
        </div>
        <div className="divide-y divide-white/5">
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[log.type]}`}>
                <span className="material-symbols-outlined text-[16px]">{icons[log.type]}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-white">{log.action}</div>
                <div className="text-xs text-white/30">by {log.user}</div>
              </div>
              <div className="text-xs text-white/30">{new Date(log.time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
