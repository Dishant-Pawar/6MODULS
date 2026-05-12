"use client";
import { useState } from "react";

type Application = {
  id: string; application_id: string; applicant_name: string;
  email: string; phone?: string; status: string;
  documents_verified: number; documents_total: number;
  applied_at: string; programs?: { name: string; code: string };
};

const COLS = ["Applied", "Screening", "Pending Deposit", "Admitted", "Rejected"] as const;
type Col = typeof COLS[number];

const COL_CONFIG: Record<Col, { color: string; bg: string; border: string; icon: string }> = {
  Applied:          { color: "text-indigo-300",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  icon: "description" },
  Screening:        { color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: "manage_search" },
  "Pending Deposit":{ color: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  icon: "payments" },
  Admitted:         { color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "check_circle" },
  Rejected:         { color: "text-red-300",     bg: "bg-red-500/10",     border: "border-red-500/20",     icon: "cancel" },
};

type Props = {
  applications: Application[];
  loading: boolean;
  onMove: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onDocsUpdate: (id: string, verified: number) => void;
};

export default function KanbanPipeline({ applications, loading, onMove, onDelete, onDocsUpdate }: Props) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const byStatus = (col: Col) => applications.filter(a => a.status === col);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Admission Pipeline</h3>
          <p className="text-xs text-white/40 mt-0.5">Click a card to expand · Hover for quick actions</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live — {applications.length} total
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3" style={{ minHeight: 320 }}>
          {COLS.map(col => {
            const cfg = COL_CONFIG[col];
            const cards = byStatus(col);
            return (
              <div key={col} className="flex flex-col min-w-[230px] w-[230px]">
                {/* Column Header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-2 ${cfg.bg} border ${cfg.border}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[14px] ${cfg.color}`}>{cfg.icon}</span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>{col}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cards.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {cards.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-lg text-white/20 text-[11px] font-mono py-6">Empty</div>
                  ) : cards.map(app => {
                    const isExpanded = expandedCard === app.id;
                    const docPct = app.documents_total > 0 ? (app.documents_verified / app.documents_total) * 100 : 0;
                    const nextCols = COLS.filter(c => c !== col);

                    return (
                      <div
                        key={app.id}
                        className={`bg-white/5 border rounded-lg transition-all ${isExpanded ? `${cfg.border} border` : "border-white/10 hover:border-white/20"}`}
                      >
                        {/* Card Header */}
                        <div className="p-3 cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : app.id)}>
                          <div className="flex items-start justify-between mb-1.5">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{app.application_id}</span>
                            <span className="material-symbols-outlined text-[14px] text-white/30">{isExpanded ? "expand_less" : "expand_more"}</span>
                          </div>
                          <p className="text-[13px] font-medium text-white leading-snug">{app.applicant_name}</p>
                          <p className="text-[11px] text-white/40 mt-0.5 truncate">{app.programs?.name || "—"}</p>
                          {col === "Screening" && (
                            <div className="mt-2">
                              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 transition-all" style={{ width: `${docPct}%` }} />
                              </div>
                              <div className="flex justify-between mt-0.5">
                                <span className="text-[10px] text-white/30">Docs</span>
                                <span className="text-[10px] text-amber-300">{app.documents_verified}/{app.documents_total}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-white/10 p-3 space-y-3">
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between"><span className="text-white/40">Email</span><span className="text-white truncate max-w-[120px]">{app.email}</span></div>
                              {app.phone && <div className="flex justify-between"><span className="text-white/40">Phone</span><span className="text-white">{app.phone}</span></div>}
                              <div className="flex justify-between"><span className="text-white/40">Applied</span><span className="text-white">{new Date(app.applied_at).toLocaleDateString("en-IN")}</span></div>
                            </div>

                            {/* Doc verification stepper */}
                            {(col === "Screening" || col === "Pending Deposit") && (
                              <div>
                                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Document Verification</p>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: app.documents_total }).map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={() => onDocsUpdate(app.id, i < app.documents_verified ? i : i + 1)}
                                      className={`flex-1 h-5 rounded transition-colors ${i < app.documents_verified ? "bg-amber-400" : "bg-white/10 hover:bg-white/20"}`}
                                      title={`Doc ${i + 1}: ${i < app.documents_verified ? "Verified" : "Pending"}`}
                                    />
                                  ))}
                                </div>
                                <p className="text-[10px] text-white/30 mt-1">{app.documents_verified}/{app.documents_total} verified</p>
                              </div>
                            )}

                            {/* Move to stage */}
                            <div>
                              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Move to Stage</p>
                              <div className="flex flex-wrap gap-1">
                                {nextCols.map(nc => {
                                  const ncfg = COL_CONFIG[nc];
                                  return (
                                    <button
                                      key={nc}
                                      onClick={() => { onMove(app.id, nc); setExpandedCard(null); }}
                                      className={`text-[10px] px-2 py-1 rounded border transition-all ${ncfg.bg} ${ncfg.color} ${ncfg.border} hover:opacity-80`}
                                    >
                                      → {nc}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => { onDelete(app.id); setExpandedCard(null); }}
                              className="w-full text-[11px] py-1.5 rounded border border-red-500/20 text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[13px]">delete</span> Remove Application
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
