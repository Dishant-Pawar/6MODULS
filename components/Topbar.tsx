"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ── static mock notifications (replace with DB fetch as needed) ── */
const MOCK_NOTIFS = [
  { id:"1", icon:"report",         color:"red",    title:"New grievance filed",        sub:"GRV-042 · Academic",         time:"2m ago",  read:false },
  { id:"2", icon:"event",          color:"violet", title:"Event scheduled",            sub:"Tech Symposium · Tomorrow",   time:"15m ago", read:false },
  { id:"3", icon:"payments",       color:"emerald",title:"Payment received",           sub:"₹45,000 · Rahul Mehta",       time:"1h ago",  read:false },
  { id:"4", icon:"campaign",       color:"pink",   title:"Announcement posted",        sub:"Exam schedule update",        time:"3h ago",  read:true  },
  { id:"5", icon:"person_add",     color:"indigo", title:"New admission application",  sub:"Priya Sharma · CSE",          time:"5h ago",  read:true  },
  { id:"6", icon:"build",          color:"amber",  title:"Maintenance ticket resolved",sub:"TKT-8891 · Hostel Block",     time:"1d ago",  read:true  },
];

type Notif = typeof MOCK_NOTIFS[0];

export default function Topbar() {
  const router = useRouter();
  const [isDark, setIsDark]         = useState(true);
  const [notifs, setNotifs]         = useState<Notif[]>(MOCK_NOTIFS);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch]         = useState("");
  const [searchResults, setSearchResults] = useState<{label:string;path:string;icon:string}[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n=>!n.read).length;

  /* ── Dark mode ── */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  /* ── Close panels on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Global search ── */
  const PAGES = [
    {label:"Dashboard",           path:"/",                       icon:"dashboard"},
    {label:"People Management",   path:"/people-management",      icon:"groups"},
    {label:"Admissions & Finance",path:"/admissions-finance",     icon:"payments"},
    {label:"Academic Operations", path:"/academic-operations",    icon:"school"},
    {label:"Campus Services",     path:"/campus-services",        icon:"apartment"},
    {label:"Engagement & Support",path:"/engagement-support",     icon:"campaign"},
    {label:"Placements & Reports",path:"/placements-analytics",   icon:"analytics"},
  ];
  const doSearch = useCallback((q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const r = PAGES.filter(p=>p.label.toLowerCase().includes(q.toLowerCase()));
    setSearchResults(r); setShowSearch(true);
  }, []);

  const markAllRead = () => setNotifs(n=>n.map(x=>({...x,read:true})));
  const markRead    = (id: string) => setNotifs(n=>n.map(x=>x.id===id?{...x,read:true}:x));

  return (
    <>
      <header className="bg-[#0a0c12]/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center h-16 px-6 w-full sticky top-0 z-50">
        {/* Left: Search */}
        <div className="flex-1 flex items-center max-w-md relative">
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors text-[18px]">search</span>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
              placeholder="Search pages, students, courses…"
              value={search}
              onChange={e=>doSearch(e.target.value)}
              onFocus={()=>search&&setShowSearch(true)}
            />
          </div>
          {/* Search dropdown */}
          {showSearch && searchResults.length>0 && (
            <div className="absolute top-full mt-2 left-0 w-full bg-[#0e1018] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              {searchResults.map(r=>(
                <button key={r.path} onClick={()=>{router.push(r.path);setShowSearch(false);setSearch("");}}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                  <span className="material-symbols-outlined text-indigo-400 text-[16px]">{r.icon}</span>
                  <span className="text-sm text-white">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-4">

          {/* ── Notifications ── */}
          <div ref={notifRef} className="relative">
            <button onClick={()=>{setShowNotifs(v=>!v);setShowProfile(false);}}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unread>0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0a0c12]"/>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#0e1018] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {unread>0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>}
                  </div>
                  {unread>0 && <button onClick={markAllRead} className="text-[11px] text-indigo-400 hover:text-indigo-300">Mark all read</button>}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {notifs.map(n=>(
                    <button key={n.id} onClick={()=>markRead(n.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors ${!n.read?"bg-indigo-500/5":""}`}>
                      <div className={`w-8 h-8 rounded-lg bg-${n.color}-500/20 flex items-center justify-center shrink-0 mt-0.5`}>
                        <span className={`material-symbols-outlined text-${n.color}-300 text-[15px]`}>{n.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] font-medium ${n.read?"text-white/60":"text-white"}`}>{n.title}</div>
                        <div className="text-[11px] text-white/30 truncate">{n.sub}</div>
                        <div className="text-[10px] text-white/25 mt-0.5 font-mono">{n.time}</div>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"/>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Dark/Light Toggle ── */}
          <button onClick={()=>setIsDark(v=>!v)}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title={isDark?"Switch to Light Mode":"Switch to Dark Mode"}>
            <span className="material-symbols-outlined text-[20px]">{isDark?"light_mode":"dark_mode"}</span>
          </button>

          {/* ── Settings ── */}
          <button onClick={()=>setShowSettings(true)}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>

          {/* ── Profile ── */}
          <div ref={profileRef} className="relative ml-1">
            <button onClick={()=>{setShowProfile(v=>!v);setShowNotifs(false);}}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-indigo-500/50 transition-all">
              A
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-[#0e1018] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">A</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Admin User</div>
                      <div className="text-[11px] text-white/40">admin@scholarsphere.edu</div>
                      <div className="text-[10px] text-indigo-300 font-mono mt-0.5">Super Admin</div>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  {[
                    {icon:"person",   label:"My Profile"},
                    {icon:"settings", label:"Settings", action:()=>{setShowProfile(false);setShowSettings(true);}},
                    {icon:"help",     label:"Help & Support"},
                  ].map(({icon,label,action})=>(
                    <button key={label} onClick={action||undefined}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                      <span className="material-symbols-outlined text-white/40 text-[16px]">{icon}</span>
                      <span className="text-sm text-white/70">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/10 py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left">
                    <span className="material-symbols-outlined text-red-400 text-[16px]">logout</span>
                    <span className="text-sm text-red-400">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Settings Modal ── */}
      {showSettings && <SettingsModal onClose={()=>setShowSettings(false)} isDark={isDark} setIsDark={setIsDark} onClearNotifs={()=>setNotifs([])} />}
    </>
  );
}

/* ════════════════ SETTINGS MODAL ════════════════ */
function SettingsModal({ onClose, isDark, setIsDark, onClearNotifs }: { onClose: ()=>void; isDark: boolean; setIsDark: (v:boolean)=>void; onClearNotifs: ()=>void }) {
  const [activeSection, setActiveSection] = useState("appearance");
  const [accent, setAccent]       = useState("indigo");
  const [fontSize, setFontSize]   = useState("medium");
  const [density, setDensity]     = useState("comfortable");
  const [notifEmail, setNEmail]   = useState(true);
  const [notifGriev, setNGriev]   = useState(true);
  const [notifEvent, setNEvent]   = useState(true);
  const [notifPay, setNPay]       = useState(false);
  const [saved, setSaved]         = useState(false);
  // Data Lifecycle state
  const [keepDays, setKeepDays]         = useState(30);
  const [archiveDays, setArchiveDays]   = useState(90);
  const [autoPurge, setAutoPurge]       = useState(false);
  const [purgeTargets, setPurgeTargets] = useState({ logs:true, tickets:true, notices:true, feedback:true, orders:false });
  const [purging, setPurging]           = useState(false);
  const [purgeMsg, setPurgeMsg]         = useState("");
  const [resetting, setResetting]       = useState(false);
  const [resetMsg, setResetMsg]         = useState("");
  const [resetKeep, setResetKeep]       = useState(1);
  const [confirmReset, setConfirmReset] = useState(false);

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };

  const SECTIONS = [
    {key:"appearance",   label:"Appearance",     icon:"palette"},
    {key:"notifications",label:"Notifications",   icon:"notifications"},
    {key:"account",      label:"Account",         icon:"person"},
    {key:"data",         label:"Data Lifecycle",  icon:"auto_delete"},
    {key:"system",       label:"System",          icon:"settings"},
  ];

  const ACCENTS = [
    {key:"indigo", color:"bg-indigo-500"},
    {key:"violet", color:"bg-violet-500"},
    {key:"teal",   color:"bg-teal-500"},
    {key:"emerald",color:"bg-emerald-500"},
    {key:"rose",   color:"bg-rose-500"},
    {key:"amber",  color:"bg-amber-500"},
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1018] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{maxHeight:"85vh"}}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02] shrink-0">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[18px]">settings</span>Settings
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar nav */}
          <div className="w-44 border-r border-white/10 bg-white/[0.01] p-2 shrink-0">
            {SECTIONS.map(s=>(
              <button key={s.key} onClick={()=>setActiveSection(s.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${activeSection===s.key?"bg-indigo-500/20 text-indigo-300":"text-white/50 hover:text-white hover:bg-white/5"}`}>
                <span className="material-symbols-outlined text-[16px]">{s.icon}</span>{s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">

            {/* ── Appearance ── */}
            {activeSection==="appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {label:"Dark", icon:"dark_mode", val:true},
                      {label:"Light", icon:"light_mode", val:false},
                    ].map(({label,icon,val})=>(
                      <button key={label} onClick={()=>setIsDark(val)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isDark===val?"border-indigo-500 bg-indigo-500/10":"border-white/10 bg-white/5 hover:border-white/20"}`}>
                        <span className={`material-symbols-outlined text-[28px] ${isDark===val?"text-indigo-300":"text-white/50"}`}>{icon}</span>
                        <span className={`text-sm font-medium ${isDark===val?"text-white":"text-white/50"}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Accent Color</h3>
                  <div className="flex gap-3 flex-wrap">
                    {ACCENTS.map(a=>(
                      <button key={a.key} onClick={()=>setAccent(a.key)}
                        className={`w-8 h-8 rounded-full ${a.color} transition-all ${accent===a.key?"ring-2 ring-offset-2 ring-offset-[#0e1018] ring-white scale-110":""}`}
                        title={a.key} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Font Size</h3>
                  <div className="flex gap-2">
                    {["small","medium","large"].map(f=>(
                      <button key={f} onClick={()=>setFontSize(f)}
                        className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-all ${fontSize===f?"border-indigo-500 bg-indigo-500/10 text-indigo-300":"border-white/10 text-white/50 hover:border-white/20 hover:text-white"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Display Density</h3>
                  <div className="flex gap-2">
                    {["compact","comfortable","spacious"].map(d=>(
                      <button key={d} onClick={()=>setDensity(d)}
                        className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-all ${density===d?"border-indigo-500 bg-indigo-500/10 text-indigo-300":"border-white/10 text-white/50 hover:border-white/20 hover:text-white"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeSection==="notifications" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white mb-3">Email Notifications</h3>
                {[
                  {label:"Email digests",       sub:"Daily summary of activity",         val:notifEmail, set:setNEmail},
                  {label:"Grievance alerts",    sub:"When a new grievance is filed",     val:notifGriev, set:setNGriev},
                  {label:"Event reminders",     sub:"24h before scheduled events",       val:notifEvent, set:setNEvent},
                  {label:"Payment alerts",      sub:"On transaction completion",         val:notifPay,   set:setNPay},
                ].map(({label,sub,val,set})=>(
                  <div key={label} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                    <div>
                      <div className="text-sm text-white">{label}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{sub}</div>
                    </div>
                    <button onClick={()=>set(!val)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${val?"bg-indigo-500":"bg-white/10"}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${val?"left-6":"left-1"}`}/>
                    </button>
                  </div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-400">delete_sweep</span> Inbox Management
                  </h3>
                  <button onClick={()=>{onClearNotifs(); save();}} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-semibold">
                    <span className="material-symbols-outlined text-[18px]">delete_forever</span> Delete All Notifications
                  </button>
                  <p className="text-[10px] text-white/30 text-center mt-2">This will permanently clear your notification tray.</p>
                </div>
              </div>
            )}

            {/* ── Account ── */}
            {activeSection==="account" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl">A</div>
                  <div>
                    <div className="text-base font-semibold text-white">Admin User</div>
                    <div className="text-sm text-white/40">admin@scholarsphere.edu</div>
                    <div className="text-xs text-indigo-300 font-mono mt-0.5">Super Admin · Full Access</div>
                  </div>
                </div>
                {[
                  {label:"Full Name",     val:"Admin User",                type:"text"},
                  {label:"Email",         val:"admin@scholarsphere.edu",   type:"email"},
                  {label:"Phone",         val:"+91 98765 43210",           type:"tel"},
                  {label:"Department",    val:"Administration",            type:"text"},
                ].map(({label,val,type})=>(
                  <div key={label}>
                    <label className="block text-[11px] text-white/40 mb-1">{label}</label>
                    <input type={type} defaultValue={val} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">New Password</label>
                  <input type="password" placeholder="Leave blank to keep current" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" />
                </div>
              </div>
            )}

            {/* ── Data Lifecycle ── */}
            {activeSection==="data" && (
              <div className="space-y-5">
                {purgeMsg && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${purgeMsg.startsWith("✓")?"bg-emerald-500/10 border border-emerald-500/20 text-emerald-300":"bg-red-500/10 border border-red-500/20 text-red-300"}`}>
                    <span className="material-symbols-outlined text-[16px]">{purgeMsg.startsWith("✓")?"check_circle":"error"}</span>{purgeMsg}
                  </div>
                )}
                {/* Retention Policies */}
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-300 text-[16px]">schedule</span>Retention Policies
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Active Data Retention (days)</label>
                      <input type="number" min={1} max={365} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={keepDays} onChange={e=>setKeepDays(parseInt(e.target.value)||1)} />
                      <div className="text-[10px] text-white/25 mt-1">Records older than this are eligible for purge</div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Archive After (days)</label>
                      <input type="number" min={1} max={730} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" value={archiveDays} onChange={e=>setArchiveDays(parseInt(e.target.value)||1)} />
                      <div className="text-[10px] text-white/25 mt-1">Move to cold storage instead of deleting</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <div className="text-sm text-white">Automated Purge Schedule</div>
                      <div className="text-[11px] text-white/40 mt-0.5">Run purge automatically every 30 days</div>
                    </div>
                    <button onClick={()=>setAutoPurge(v=>!v)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${autoPurge?"bg-indigo-500":"bg-white/10"}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${autoPurge?"left-6":"left-1"}`}/>
                    </button>
                  </div>
                </div>
                {/* Purge Targets */}
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-300 text-[16px]">filter_list</span>Data Categories to Purge
                  </h3>
                  {(Object.entries(purgeTargets) as [keyof typeof purgeTargets, boolean][]).map(([key,val])=>(
                    <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-white/30 text-[14px]">
                          {key==="logs"?"receipt_long":key==="tickets"?"build":key==="notices"?"campaign":key==="feedback"?"chat":"shopping_cart"}
                        </span>
                        <span className="text-sm text-white/70 capitalize">{key}</span>
                      </div>
                      <button onClick={()=>setPurgeTargets(t=>({...t,[key]:!val}))}
                        className={`relative w-9 h-5 rounded-full transition-colors ${val?"bg-orange-500":"bg-white/10"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${val?"left-4":"left-0.5"}`}/>
                      </button>
                    </div>
                  ))}
                </div>
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button disabled={purging}
                    onClick={async()=>{
                      setPurging(true); setPurgeMsg("");
                      await new Promise(r=>setTimeout(r,1800));
                      const targets = Object.entries(purgeTargets).filter(([,v])=>v).map(([k])=>k);
                      setPurgeMsg(`✓ Purge complete — cleared ${targets.join(", ")} older than ${keepDays} day${keepDays!==1?"s":""}`);
                      setPurging(false);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-500/30 text-orange-300 hover:bg-orange-500/10 text-sm font-semibold transition-all disabled:opacity-50">
                    {purging
                      ? <><div className="w-4 h-4 border-2 border-orange-300/30 border-t-orange-300 rounded-full animate-spin"/><span>Purging…</span></>
                      : <><span className="material-symbols-outlined text-[16px]">auto_delete</span><span>Execute Purge Now</span></>}
                  </button>
                  <button onClick={()=>{ setPurgeMsg("✓ Policies applied successfully"); save(); }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-all">
                    <span className="material-symbols-outlined text-[16px]">save</span>Apply Policies
                  </button>
                </div>
                {/* Full System Reset */}
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">warning</span>Advanced Actions
                  </h3>
                  <p className="text-[11px] text-red-300/60">Powerful tools to reset system state. Use with caution.</p>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-xs text-white/50 shrink-0">Keep:</span>
                    <input type="number" min={1} max={365} className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none text-center font-mono" value={resetKeep} onChange={e=>setResetKeep(parseInt(e.target.value)||1)} />
                    <span className="text-xs text-white/50">days of data</span>
                  </div>
                  {resetMsg && (
                    <div className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 ${resetMsg.startsWith("✓")?"bg-emerald-500/10 text-emerald-300":"bg-red-500/10 text-red-300"}`}>
                      {resetMsg}
                    </div>
                  )}
                  {!confirmReset ? (
                    <button onClick={()=>setConfirmReset(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-500/40 text-red-300 hover:bg-red-500/10 text-sm font-semibold transition-all">
                      <span className="material-symbols-outlined text-[16px]">delete_forever</span>Full System Reset
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] text-red-300/80 text-center bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                        This will clear all logs, tickets, orders, feedback, and notices.<br/>
                        <span className="text-red-300/50">User accounts and authentication data will not be affected.</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>setConfirmReset(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 text-xs">Cancel</button>
                        <button disabled={resetting}
                          onClick={async()=>{
                            setResetting(true); setResetMsg("");
                            await new Promise(r=>setTimeout(r,2200));
                            setResetMsg(`✓ Reset complete. Kept last ${resetKeep} day${resetKeep!==1?"s":""} of data.`);
                            setResetting(false); setConfirmReset(false);
                          }}
                          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                          {resetting
                            ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Resetting…</span></>
                            : <><span className="material-symbols-outlined text-[13px]">delete_forever</span><span>Confirm Reset</span></>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── System ── */}
            {activeSection==="system" && (
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-white">System Information</h3>
                  {[
                    {label:"Version",        val:"ScholarSphere ERP v2.0"},
                    {label:"Database",       val:"Supabase PostgreSQL"},
                    {label:"Environment",    val:"Production"},
                    {label:"Next.js",        val:"v16.2.6 (Turbopack)"},
                    {label:"Last Updated",   val:new Date().toLocaleDateString("en-IN",{dateStyle:"long"})},
                  ].map(({label,val})=>(
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white/50">{label}</span>
                      <span className="text-sm text-white font-mono">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-300 text-[18px] mt-0.5">warning</span>
                    <div>
                      <div className="text-sm font-semibold text-amber-300 mb-0.5">Danger Zone</div>
                      <div className="text-[11px] text-amber-300/60 mb-3">These actions are irreversible. Proceed with caution.</div>
                      <button className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors">
                        Clear All Cache
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.01] shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
          <button onClick={save} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${saved?"bg-emerald-600 text-white":"bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"}`}>
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
