"use client";
import { useEffect, useState, useCallback } from "react";

type Ev = { id: string; title: string; description?: string; event_type?: string; scheduled_at: string; venue?: string; status: string };

const EV_TYPES = ["Seminar","Workshop","Cultural","Sports","Placement","Other"];
const EV_STATUS_STYLE: Record<string,string> = {
  Upcoming:  "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  Ongoing:   "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  Completed: "bg-white/5 text-white/40 border-white/10",
  Cancelled: "bg-red-500/10 text-red-300 border-red-500/20",
};
const TYPE_ICON: Record<string,string> = {
  Seminar:"mic", Workshop:"hardware", Cultural:"celebration", Sports:"sports_soccer", Placement:"work", Other:"event",
};

export default function EventsTab() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editEv, setEditEv] = useState<Ev|null>(null);
  const [form, setForm] = useState({ title:"", description:"", event_type:"Seminar", scheduled_at:"", venue:"", status:"Upcoming" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/events");
    if (r.ok) { const j = await r.json(); setEvents(j.data||[]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = events.filter(e =>
    (!typeFilter || e.event_type === typeFilter) &&
    (!statusFilter || e.status === statusFilter)
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editEv) {
      await fetch(`/api/events/${editEv.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    } else {
      await fetch("/api/events", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    }
    setSaving(false); setShowAdd(false); setEditEv(null);
    setForm({ title:"", description:"", event_type:"Seminar", scheduled_at:"", venue:"", status:"Upcoming" });
    load();
  };

  const openEdit = (ev: Ev) => {
    setEditEv(ev);
    setForm({ title:ev.title, description:ev.description||"", event_type:ev.event_type||"Seminar", scheduled_at:ev.scheduled_at?.slice(0,16)||"", venue:ev.venue||"", status:ev.status });
    setShowAdd(true);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events/${id}`, { method:"DELETE" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/events/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    load();
  };

  const exportCSV = () => {
    const rows = [["Title","Type","Date","Venue","Status"],
      ...filtered.map(e=>[e.title, e.event_type||"", new Date(e.scheduled_at).toLocaleDateString(), e.venue||"", e.status])];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="events.csv"; a.click();
  };

  return (
    <>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
          <div className="flex gap-3 flex-wrap items-center">
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {EV_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {["Upcoming","Ongoing","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-white/30">{filtered.length} events</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={()=>{ setEditEv(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-violet-500/20">
              <span className="material-symbols-outlined text-[16px]">add</span> New Event
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">event_busy</span>
            <span className="text-sm">No events found</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(ev=>{
              const dt = new Date(ev.scheduled_at);
              const icon = TYPE_ICON[ev.event_type||"Other"]||"event";
              return (
                <div key={ev.id} className="flex items-start gap-4 p-4 hover:bg-white/[0.03] transition-colors group">
                  <div className="shrink-0 w-12 text-center">
                    <div className="text-[10px] text-white/30 uppercase">{dt.toLocaleString("en-IN",{month:"short"})}</div>
                    <div className="text-xl font-bold text-white leading-none">{dt.getDate()}</div>
                    <div className="text-[10px] text-white/30">{dt.toLocaleTimeString("en-IN",{timeStyle:"short"})}</div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-violet-300 text-[18px]">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-white">{ev.title}</span>
                      {ev.event_type && <span className="text-[10px] font-mono bg-white/10 text-white/40 px-1.5 py-0.5 rounded">{ev.event_type}</span>}
                    </div>
                    {ev.description && <p className="text-[11px] text-white/40 line-clamp-1 mb-0.5">{ev.description}</p>}
                    {ev.venue && <div className="text-[11px] text-white/30 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span>{ev.venue}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select className={`text-[10px] px-2 py-1 rounded border outline-none font-mono ${EV_STATUS_STYLE[ev.status]||"bg-white/10 text-white/40 border-white/10"}`} value={ev.status} onChange={e=>updateStatus(ev.id, e.target.value)}>
                      {["Upcoming","Ongoing","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>openEdit(ev)} className="w-7 h-7 rounded hover:bg-indigo-500/20 flex items-center justify-center text-white/30 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </button>
                    <button onClick={()=>del(ev.id)} className="w-7 h-7 rounded hover:bg-red-500/20 flex items-center justify-center text-white/30 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <h2 className="text-base font-semibold text-white">{editEv?"Edit Event":"New Event"}</h2>
              <button onClick={()=>{setShowAdd(false);setEditEv(null);}} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="block text-[11px] text-white/40 mb-1">Title *</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
              <div><label className="block text-[11px] text-white/40 mb-1">Description</label>
                <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Type</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.event_type} onChange={e=>setForm(f=>({...f,event_type:e.target.value}))}>
                    {EV_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Venue</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] text-white/40 mb-1">Date & Time *</label>
                  <input type="datetime-local" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))} /></div>
                <div><label className="block text-[11px] text-white/40 mb-1">Status</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {["Upcoming","Ongoing","Completed","Cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAdd(false);setEditEv(null);}} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving?"Saving…":editEv?"Update":"Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
