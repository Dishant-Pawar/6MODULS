"use client";
import { useEffect, useState, useCallback } from "react";
import EventsTab from "@/components/EventsTab";
import { AnnouncementsTab, GrievancesTab } from "@/components/EngagementTabs";

type Tab = "events" | "announcements" | "grievances";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "events",        label: "Events",         icon: "event"       },
  { key: "announcements", label: "Announcements",  icon: "campaign"    },
  { key: "grievances",    label: "Grievances",     icon: "report"      },
];

export default function EngagementSupport() {
  const [tab, setTab] = useState<Tab>("events");
  const [students, setStudents] = useState<{ id: string; full_name: string; student_id: string }[]>([]);
  const [kpis, setKpis] = useState({ events: 0, announcements: 0, openGrievances: 0, resolved: 0 });

  const loadKpis = useCallback(async () => {
    const [evR, annR, grvR, stuR] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/announcements"),
      fetch("/api/grievances"),
      fetch("/api/students?limit=200"),
    ]);
    if (evR.ok)  { const j = await evR.json();  setKpis(k => ({ ...k, events: (j.data||[]).filter((e:any)=>e.status==="Upcoming").length })); }
    if (annR.ok) { const j = await annR.json(); setKpis(k => ({ ...k, announcements: (j.data||[]).length })); }
    if (grvR.ok) { const j = await grvR.json();
      setKpis(k => ({
        ...k,
        openGrievances: (j.data||[]).filter((g:any)=>g.status==="Open").length,
        resolved: (j.data||[]).filter((g:any)=>g.status==="Resolved").length,
      }));
    }
    if (stuR.ok) { const j = await stuR.json(); setStudents(j.data||[]); }
  }, []);

  useEffect(() => { loadKpis(); }, [loadKpis]);

  return (
    <main className="flex-1 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-white/10">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Engagement & Support</h1>
          <p className="text-sm text-white/40">Manage campus events, publish announcements, and resolve student grievances.</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Upcoming Events",   value: kpis.events,         icon: "event",        color: "violet"  },
            { label: "Announcements",     value: kpis.announcements,  icon: "campaign",     color: "pink"    },
            { label: "Open Grievances",   value: kpis.openGrievances, icon: "report",       color: "red"     },
            { label: "Resolved",          value: kpis.resolved,       icon: "check_circle", color: "emerald" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-lg bg-${color}-500/20 flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-[18px] text-${color}-300`}>{icon}</span>
              </div>
              <div>
                <div className="text-xl font-bold text-white leading-none">{value}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              {label}
              {key === "grievances" && kpis.openGrievances > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{kpis.openGrievances}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-8">
        {tab === "events"        && <EventsTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "grievances"    && <GrievancesTab students={students} />}
      </div>
    </main>
  );
}
