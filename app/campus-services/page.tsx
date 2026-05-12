"use client";
import { useEffect, useState, useCallback } from "react";
import HostelTab from "@/components/HostelTab";
import { TransportTab, LibraryTab } from "@/components/CampusTabs";

type Tab = "hostel" | "transport" | "library" | "maintenance";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "hostel",      label: "Hostel",       icon: "bed"             },
  { key: "transport",   label: "Transport",    icon: "directions_bus"  },
  { key: "library",     label: "Library",      icon: "menu_book"       },
  { key: "maintenance", label: "Maintenance",  icon: "build"           },
];

const TICKET_PRIORITY: Record<string, string> = {
  High:   "bg-red-500/20 text-red-300 border-red-500/30",
  Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Low:    "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};
const TICKET_STATUS_STYLE: Record<string, string> = {
  Open:        "bg-red-500/10 text-red-300 border-red-500/20",
  "In Progress":"bg-amber-500/10 text-amber-300 border-amber-500/20",
  Resolved:    "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Closed:      "bg-white/5 text-white/40 border-white/10",
};

type Ticket = { id: string; title: string; description?: string; location?: string; priority: string; status: string; created_at: string };

export default function CampusServices() {
  const [tab, setTab] = useState<Tab>("hostel");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingT, setLoadingT] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", location: "", priority: "Medium" });
  const [savingT, setSavingT] = useState(false);

  // Maintenance tickets stored in localStorage (no DB table) — persists across refreshes
  const LS_KEY = "campus_tickets";

  const loadTickets = useCallback(() => {
    setLoadingT(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      setTickets(raw ? JSON.parse(raw) : []);
    } catch { setTickets([]); }
    setLoadingT(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const saveTickets = (list: Ticket[]) => {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
    setTickets(list);
  };

  const addTicket = (e: React.FormEvent) => {
    e.preventDefault(); setSavingT(true);
    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      ...ticketForm,
      status: "Open",
      created_at: new Date().toISOString(),
    };
    saveTickets([newTicket, ...tickets]);
    setTicketForm({ title: "", description: "", location: "", priority: "Medium" });
    setShowTicketModal(false); setSavingT(false);
  };

  const updateTicketStatus = (id: string, status: string) => {
    saveTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTicket = (id: string) => {
    if (!confirm("Delete this ticket?")) return;
    saveTickets(tickets.filter(t => t.id !== id));
  };

  const exportTickets = () => {
    const rows = [["Title","Location","Priority","Status","Created"],
      ...tickets.map(t=>[t.title, t.location||"", t.priority, t.status, new Date(t.created_at).toLocaleDateString()])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="maintenance_tickets.csv"; a.click();
  };

  const openCount = tickets.filter(t => t.status === "Open").length;
  const inProgressCount = tickets.filter(t => t.status === "In Progress").length;

  return (
    <>
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Campus Services</h1>
              <p className="text-sm text-white/40">Manage hostel, transport, library, and maintenance operations.</p>
            </div>
            {tab === "maintenance" && (
              <button onClick={() => setShowTicketModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-orange-500/20">
                <span className="material-symbols-outlined text-[16px]">add</span> New Ticket
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
            {TABS.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>{label}
                {key === "maintenance" && openCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{openCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 lg:p-8">
          {tab === "hostel"      && <HostelTab />}
          {tab === "transport"   && <TransportTab />}
          {tab === "library"     && <LibraryTab />}
          {tab === "maintenance" && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {label:"Total Tickets",    val:tickets.length,  color:"indigo"},
                  {label:"Open",             val:openCount,        color:"red"},
                  {label:"In Progress",      val:inProgressCount,  color:"amber"},
                  {label:"Resolved/Closed",  val:tickets.filter(t=>["Resolved","Closed"].includes(t.status)).length, color:"emerald"},
                ].map(({label,val,color})=>(
                  <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
                    <div className={`text-xl font-bold text-${color}-300 font-mono`}>{val}</div>
                    <div className={`text-[11px] text-${color}-300/60 mt-0.5`}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-white/[0.02]">
                  <span className="text-xs text-white/30">{tickets.length} tickets</span>
                  <div className="flex gap-2">
                    <button onClick={exportTickets} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
                      <span className="material-symbols-outlined text-[15px]">download</span> Export
                    </button>
                    <button onClick={() => setShowTicketModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-semibold hover:opacity-90">
                      <span className="material-symbols-outlined text-[16px]">add</span> New Ticket
                    </button>
                  </div>
                </div>

                {loadingT ? (
                  <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
                    <span className="material-symbols-outlined text-4xl">build</span>
                    <span className="text-sm">No maintenance tickets</span>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {tickets.map(t => (
                      <div key={t.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.03] transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-orange-300 text-[18px]">build</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-sm font-semibold text-white">{t.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TICKET_PRIORITY[t.priority]}`}>{t.priority}</span>
                          </div>
                          {t.description && <p className="text-[11px] text-white/40 mb-0.5 line-clamp-1">{t.description}</p>}
                          <div className="text-[10px] text-white/30 flex gap-3">
                            {t.location && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">location_on</span>{t.location}</span>}
                            <span>{new Date(t.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            className={`text-[10px] px-2 py-1 rounded border outline-none font-mono ${TICKET_STATUS_STYLE[t.status]||"bg-white/10 text-white/40 border-white/10"}`}
                            value={t.status}
                            onChange={e => updateTicketStatus(t.id, e.target.value)}
                          >
                            {["Open","In Progress","Resolved","Closed"].map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={()=>deleteTicket(t.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">New Maintenance Ticket</h2>
              <button onClick={() => setShowTicketModal(false)} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <form onSubmit={addTicket} className="space-y-3">
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Issue Title *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50" value={ticketForm.title} onChange={e=>setTicketForm(f=>({...f,title:e.target.value}))} placeholder="e.g. HVAC failure in Hall 4" />
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Description</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50 resize-none" value={ticketForm.description} onChange={e=>setTicketForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Location</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={ticketForm.location} onChange={e=>setTicketForm(f=>({...f,location:e.target.value}))} placeholder="Building / Room" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Priority</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={ticketForm.priority} onChange={e=>setTicketForm(f=>({...f,priority:e.target.value}))}>
                    {["High","Medium","Low"].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowTicketModal(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={savingT} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {savingT?"Submitting…":"Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
