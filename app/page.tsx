"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type KPIs = {
  totalStudents: number; activeFaculty: number; onLeaveStudents: number;
  totalPrograms: number; totalRevenue: number; pendingRevenue: number;
  upcomingExamsCount: number; totalApplications: number; admittedApps: number;
};
type DashData = {
  kpis: KPIs;
  upcomingExams: any[]; announcements: any[]; liveFeed: any[];
  upcomingEvents: any[]; upcomingDrives: any[]; attendanceTrend: { day: string; pct: number }[];
};

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: "bg-red-500/20 text-red-300 border-red-500/30",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Normal: "bg-white/10 text-white/60 border-white/10",
};
const FEED_COLOR: Record<string, string> = {
  primary: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
  secondary: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
  tertiary: "bg-amber-500/20 border-amber-500/30 text-amber-300",
  error: "bg-red-500/20 border-red-500/30 text-red-300",
};

function KPICard({ label, value, icon, sub, subColor, accent }: {
  label: string; value: string | number; icon: string;
  sub: string; subColor?: string; accent?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-5 flex flex-col justify-between h-[136px] relative overflow-hidden group hover:border-white/20 transition-all">
      <div className="flex justify-between items-start">
        <span className="font-body-sm text-body-sm text-outline">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent || "bg-white/5"}`}>
          <span className="material-symbols-outlined text-[18px] text-white/70">{icon}</span>
        </div>
      </div>
      <div>
        <div className="font-headline-lg text-headline-lg text-white mb-0.5">{value}</div>
        <div className={`font-mono-label text-[11px] flex items-center gap-1 ${subColor || "text-outline"}`}>{sub}</div>
      </div>
    </div>
  );
}

function MiniBar({ pct, day, isToday }: { pct: number; day: string; isToday: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className={`font-mono-label text-[10px] mb-1 ${pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-amber-400" : "text-red-400"}`}>{pct}%</span>
      <div className="w-full bg-white/5 rounded-full overflow-hidden relative" style={{ height: 72 }}>
        <div
          className={`absolute bottom-0 w-full rounded-full transition-all duration-700 ${pct >= 90 ? "bg-emerald-500/60" : pct >= 75 ? "bg-amber-500/60" : "bg-red-500/60"}`}
          style={{ height: `${pct}%` }}
        />
        {isToday && <div className="absolute inset-0 rounded-full ring-1 ring-white/30" />}
      </div>
      <span className={`font-mono-label text-[10px] ${isToday ? "text-white" : "text-outline"}`}>{day}</span>
    </div>
  );
}

export default function MasterDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuick, setShowQuick] = useState(false);
  const [activeTab, setActiveTab] = useState<"exams" | "events" | "drives">("exams");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/dashboard");
      const j = await r.json();
      setData(j);
      setLastRefresh(new Date());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    const rows = [
      ["Metric", "Value"],
      ["Total Students", data?.kpis.totalStudents ?? 0],
      ["Active Faculty", data?.kpis.activeFaculty ?? 0],
      ["Total Revenue", `$${data?.kpis.totalRevenue ?? 0}`],
      ["Pending Revenue", `$${data?.kpis.pendingRevenue ?? 0}`],
      ["Total Applications", data?.kpis.totalApplications ?? 0],
      ["Admitted", data?.kpis.admittedApps ?? 0],
      ["Upcoming Exams", data?.kpis.upcomingExamsCount ?? 0],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `dashboard-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const quickLinks = [
    { label: "Add Student", icon: "person_add", href: "/people-management", color: "from-indigo-600 to-indigo-500" },
    { label: "New Application", icon: "assignment_add", href: "/admissions-finance", color: "from-violet-600 to-violet-500" },
    { label: "New Announcement", icon: "campaign", href: "/engagement-support", color: "from-amber-600 to-amber-500" },
    { label: "Schedule Exam", icon: "event", href: "/academic-operations", color: "from-emerald-600 to-emerald-500" },
    { label: "New Drive", icon: "business_center", href: "/placements-analytics", color: "from-sky-600 to-sky-500" },
    { label: "View People", icon: "groups", href: "/people-management", color: "from-pink-600 to-pink-500" },
  ];

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 pb-12 flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display-xl text-display-xl text-white tracking-tight">Master Dashboard</h1>
            <p className="font-body-sm text-body-sm text-outline mt-1">
              Live · Auto-refreshes every 30s · Last updated: <span suppressHydrationWarning>{lastRefresh.toLocaleTimeString()}</span>
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="px-4 py-2 rounded-lg glass-card font-body-sm text-sm text-white flex items-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">{exporting ? "hourglass_empty" : "download"}</span>
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
            <button
              onClick={() => setShowQuick(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 font-body-sm text-sm text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span> Quick Action
            </button>
          </div>
        </div>

        {/* ── AI Insight Banner ── */}
        <div className="rounded-xl p-px bg-gradient-to-r from-indigo-500/40 via-violet-500/20 to-transparent">
          <div className="rounded-xl bg-[#0e1018]/90 backdrop-blur p-4 flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-indigo-300 text-[18px]">auto_awesome</span>
            </div>
            <div className="flex-1">
              <p className="font-mono-label text-[10px] text-indigo-400 uppercase tracking-widest mb-1">System Intelligence</p>
              {loading ? (
                <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
              ) : (
                <p className="font-body-md text-sm text-white/90 leading-relaxed">
                  {data?.kpis.totalStudents} active students across {data?.kpis.totalPrograms} programs.{" "}
                  <span className="text-emerald-400">${((data?.kpis.totalRevenue ?? 0)/1000).toFixed(1)}K collected</span> this cycle,{" "}
                  <span className="text-amber-400">${((data?.kpis.pendingRevenue ?? 0)/1000).toFixed(1)}K pending.</span>{" "}
                  {data?.kpis.upcomingExamsCount! > 0 && <span className="text-violet-300">{data?.kpis.upcomingExamsCount} exams upcoming.</span>}
                </p>
              )}
            </div>
            <button onClick={load} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-outline hover:text-white transition-colors shrink-0" title="Refresh">
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Students" value={loading ? "—" : (data?.kpis.totalStudents ?? 0)} icon="groups" sub="Active enrollment" subColor="text-emerald-400" accent="bg-indigo-500/20" />
          <KPICard label="Active Faculty" value={loading ? "—" : (data?.kpis.activeFaculty ?? 0)} icon="school" sub={`${data?.kpis.onLeaveStudents ?? 0} students on leave`} accent="bg-violet-500/20" />
          <KPICard label="Fee Collection" value={loading ? "—" : `$${((data?.kpis.totalRevenue ?? 0)/1000).toFixed(1)}K`} icon="account_balance_wallet" sub={`$${((data?.kpis.pendingRevenue ?? 0)/1000).toFixed(1)}K pending`} subColor="text-amber-400" accent="bg-emerald-500/20" />
          <KPICard label="Applications" value={loading ? "—" : (data?.kpis.totalApplications ?? 0)} icon="assignment_ind" sub={`${data?.kpis.admittedApps ?? 0} admitted`} subColor="text-emerald-400" accent="bg-amber-500/20" />
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left col — Attendance + Schedule tabs */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Attendance Trend */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-white font-semibold">Weekly Attendance Trend</h3>
                  <p className="font-body-sm text-[12px] text-outline mt-0.5">Campus-wide attendance rate (Mon–Sun)</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono-label">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> ≥90%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ≥75%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;75%</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-[100px]">
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-white/5 rounded animate-pulse" style={{ height: `${50 + i * 5}%` }} />
                  ))
                ) : (data?.attendanceTrend ?? []).map((d, i) => (
                  <MiniBar key={d.day} pct={d.pct} day={d.day} isToday={i === todayIdx} />
                ))}
              </div>
            </div>

            {/* Tabbed Schedule Panel */}
            <div className="glass-card rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                  {(["exams", "events", "drives"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 rounded-md font-mono-label text-[11px] uppercase tracking-wider transition-all ${activeTab === t ? "bg-white/10 text-white" : "text-outline hover:text-white"}`}
                    >
                      {t === "exams" ? "Exams" : t === "events" ? "Events" : "Placements"}
                    </button>
                  ))}
                </div>
                <span className="font-mono-label text-[11px] text-outline">
                  {activeTab === "exams" ? data?.upcomingExams.length : activeTab === "events" ? data?.upcomingEvents.length : data?.upcomingDrives.length} upcoming
                </span>
              </div>
              <div className="flex-1 divide-y divide-white/5 min-h-[200px]">
                {loading ? (
                  <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
                ) : activeTab === "exams" ? (
                  data?.upcomingExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-outline gap-2">
                      <span className="material-symbols-outlined text-3xl">event_available</span>
                      <span className="font-body-sm text-sm">No upcoming exams</span>
                    </div>
                  ) : data?.upcomingExams.map((ex: any) => (
                    <div key={ex.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-violet-300 text-[18px]">fact_check</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body-sm text-sm text-white font-medium truncate">{ex.courses?.name} — <span className="text-violet-300">{ex.exam_type}</span></div>
                        <div className="font-mono-label text-[11px] text-outline">{new Date(ex.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                      </div>
                      <span className="text-[10px] font-mono-label bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded shrink-0">{ex.courses?.code}</span>
                    </div>
                  ))
                ) : activeTab === "events" ? (
                  data?.upcomingEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-outline gap-2">
                      <span className="material-symbols-outlined text-3xl">calendar_today</span>
                      <span className="font-body-sm text-sm">No upcoming events</span>
                    </div>
                  ) : data?.upcomingEvents.map((ev: any) => (
                    <div key={ev.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-300 text-[18px]">event</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body-sm text-sm text-white font-medium truncate">{ev.title}</div>
                        <div className="font-mono-label text-[11px] text-outline">{ev.venue && `${ev.venue} · `}{new Date(ev.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                      </div>
                      <span className="text-[10px] font-mono-label bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">{ev.event_type}</span>
                    </div>
                  ))
                ) : (
                  data?.upcomingDrives.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-outline gap-2">
                      <span className="material-symbols-outlined text-3xl">business_center</span>
                      <span className="font-body-sm text-sm">No placement drives</span>
                    </div>
                  ) : data?.upcomingDrives.map((dr: any) => (
                    <div key={dr.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-sky-300 text-[18px]">business_center</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body-sm text-sm text-white font-medium truncate">{dr.job_title}</div>
                        <div className="font-mono-label text-[11px] text-outline">{dr.companies?.name}</div>
                      </div>
                      <span className={`text-[10px] font-mono-label px-2 py-0.5 rounded border shrink-0 ${dr.status === "Ongoing" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-sky-500/10 text-sky-300 border-sky-500/20"}`}>{dr.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right col — Live Feed + Announcements */}
          <div className="flex flex-col gap-6">

            {/* Live Activity Feed */}
            <div className="glass-card rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-headline-sm text-sm text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Activity
                </h3>
                <button onClick={load} className="text-outline hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              </div>
              <div className="flex flex-col divide-y divide-white/5 overflow-y-auto max-h-[320px]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                        <div className="h-2.5 bg-white/5 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))
                ) : data?.liveFeed.length === 0 ? (
                  <div className="py-10 text-center text-outline font-body-sm text-sm">No recent activity</div>
                ) : data?.liveFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-white/5 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${FEED_COLOR[item.color] || FEED_COLOR.primary}`}>
                      <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-sm text-[12px] text-white font-medium leading-snug truncate">{item.title}</p>
                      <p className="font-mono-label text-[10px] text-outline mt-0.5">{item.subtitle}</p>
                      <p className="font-mono-label text-[10px] text-white/30 mt-0.5">{new Date(item.time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div className="glass-card rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-headline-sm text-sm text-white font-semibold">Announcements</h3>
                <span className="font-mono-label text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white">{data?.announcements.length ?? 0}</span>
              </div>
              <div className="flex flex-col divide-y divide-white/5 overflow-y-auto max-h-[280px]">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
                ) : data?.announcements.length === 0 ? (
                  <div className="py-8 text-center text-outline text-sm">No announcements</div>
                ) : data?.announcements.map((ann: any) => (
                  <div key={ann.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-body-sm text-[13px] text-white font-medium leading-snug">{ann.title}</p>
                      <span className={`text-[9px] font-mono-label px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_COLOR[ann.priority]}`}>{ann.priority}</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-outline line-clamp-2">{ann.content}</p>
                    <p className="font-mono-label text-[10px] text-white/30 mt-1">{ann.target_audience} · {new Date(ann.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Module Quick Nav ── */}
        <div>
          <p className="font-mono-label text-[11px] text-outline uppercase tracking-widest mb-3">Jump to Module</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "People", icon: "groups", href: "/people-management" },
              { label: "Admissions", icon: "assignment_ind", href: "/admissions-finance" },
              { label: "Academic", icon: "school", href: "/academic-operations" },
              { label: "Campus", icon: "apartment", href: "/campus-services" },
              { label: "Engagement", icon: "campaign", href: "/engagement-support" },
              { label: "Placements", icon: "analytics", href: "/placements-analytics" },
            ].map((m) => (
              <button
                key={m.href}
                onClick={() => router.push(m.href)}
                className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <span className="material-symbols-outlined text-[22px] text-outline group-hover:text-white transition-colors">{m.icon}</span>
                <span className="font-mono-label text-[11px] text-outline group-hover:text-white transition-colors">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* ── Quick Action Modal ── */}
      {showQuick && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQuick(false)}>
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-headline-sm text-headline-sm text-white font-semibold">Quick Actions</h2>
              <button onClick={() => setShowQuick(false)} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-outline hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((q) => (
                <button
                  key={q.href + q.label}
                  onClick={() => { setShowQuick(false); router.push(q.href); }}
                  className={`bg-gradient-to-br ${q.color} text-white rounded-xl p-4 flex flex-col items-start gap-2 hover:opacity-90 transition-opacity text-left`}
                >
                  <span className="material-symbols-outlined text-[20px]">{q.icon}</span>
                  <span className="font-body-sm text-[12px] font-semibold">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
