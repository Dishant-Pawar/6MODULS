"use client";
import { useEffect, useState, useCallback } from "react";

type Room = { id: string; block: string; room_number: string; capacity: number; status: string; room_type?: string; hostel_allocations?: any[] };

const STATUS_STYLE: Record<string, string> = {
  Available: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Occupied:  "bg-red-500/20 text-red-300 border-red-500/30",
  Maintenance: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Reserved:  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};

export default function HostelTab() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockFilter, setBlockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({ block: "", room_number: "", capacity: 2, status: "Available", room_type: "Double" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/hostel");
    if (r.ok) { const j = await r.json(); setRooms(j.data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const blocks = [...new Set(rooms.map(r => r.block))].sort();
  const filtered = rooms.filter(r => (!blockFilter || r.block === blockFilter) && (!statusFilter || r.status === statusFilter));

  const stats = {
    total: rooms.length,
    occupied: rooms.filter(r => r.status === "Occupied").length,
    available: rooms.filter(r => r.status === "Available").length,
    maintenance: rooms.filter(r => r.status === "Maintenance").length,
  };
  const occupancy = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (editRoom) {
      await fetch(`/api/hostel/${editRoom.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/hostel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false); setShowAdd(false); setEditRoom(null);
    setForm({ block: "", room_number: "", capacity: 2, status: "Available", room_type: "Double" });
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/hostel/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this room?")) return;
    await fetch(`/api/hostel/${id}`, { method: "DELETE" });
    load();
  };

  const openEdit = (r: Room) => {
    setEditRoom(r);
    setForm({ block: r.block, room_number: r.room_number, capacity: r.capacity, status: r.status, room_type: r.room_type || "Double" });
    setShowAdd(true);
  };

  const exportCSV = () => {
    const rows = [["Block","Room","Type","Capacity","Status"], ...filtered.map(r => [r.block, r.room_number, r.room_type||"", r.capacity, r.status])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "hostel_rooms.csv"; a.click();
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Rooms", val: stats.total, color: "indigo" },
          { label: "Occupied", val: stats.occupied, color: "red" },
          { label: "Available", val: stats.available, color: "emerald" },
          { label: "Maintenance", val: stats.maintenance, color: "amber" },
        ].map(({ label, val, color }) => (
          <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4`}>
            <div className={`text-xl font-bold text-${color}-300 font-mono`}>{val}</div>
            <div className={`text-[11px] text-${color}-300/60 mt-0.5`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>Overall Occupancy</span><span className="text-white font-mono font-bold">{occupancy}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${occupancy > 90 ? "bg-red-400" : occupancy > 70 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${occupancy}%` }} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
          <div className="flex gap-3 flex-wrap">
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
              <option value="">All Blocks</option>
              {blocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {["Available","Occupied","Maintenance","Reserved"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="self-center text-xs text-white/30">{filtered.length} rooms</span>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">
              <span className="material-symbols-outlined text-[15px]">download</span> Export
            </button>
            <button onClick={() => { setEditRoom(null); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Room
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-2">
            <span className="material-symbols-outlined text-4xl">bed</span>
            <span className="text-sm">No rooms found</span>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(r => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all group relative">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[10px] text-white/30 font-mono">{r.block}</div>
                    <div className="text-base font-bold text-white">{r.room_number}</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(r)} className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-indigo-300">
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                    </button>
                    <button onClick={() => del(r.id)} className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-red-300">
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-white/40 mb-2">{r.room_type} · {r.capacity} beds</div>
                <select
                  className={`w-full text-[10px] px-2 py-1 rounded border outline-none font-mono ${STATUS_STYLE[r.status] || "bg-white/10 text-white/40 border-white/10"}`}
                  value={r.status}
                  onChange={e => updateStatus(r.id, e.target.value)}
                >
                  {["Available","Occupied","Maintenance","Reserved"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {r.hostel_allocations && r.hostel_allocations.length > 0 && (
                  <div className="mt-2 text-[10px] text-white/30 truncate">
                    {r.hostel_allocations[0]?.students?.full_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1018] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-white">{editRoom ? "Edit Room" : "Add Room"}</h2>
              <button onClick={() => { setShowAdd(false); setEditRoom(null); }} className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white"><span className="material-symbols-outlined text-[16px]">close</span></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Block *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))} placeholder="North A" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Room No *</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="101" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Type</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
                    {["Single","Double","Triple","Quad"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 mb-1">Capacity</label>
                  <input type="number" min={1} max={8} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-white/40 mb-1">Status</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {["Available","Occupied","Maintenance","Reserved"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditRoom(null); }} className="flex-1 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : editRoom ? "Update" : "Add Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
