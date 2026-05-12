"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "People", href: "/people-management", icon: "groups" },
    { name: "Admissions & Finance", href: "/admissions-finance", icon: "payments" },
    { name: "Academic Ops", href: "/academic-operations", icon: "school" },
    { name: "Campus Services", href: "/campus-services", icon: "apartment" },
    { name: "Engagement", href: "/engagement-support", icon: "campaign" },
    { name: "Placements & Reports", href: "/placements-analytics", icon: "analytics" },
  ];

  return (
    <nav className="bg-surface/80 dark:bg-on-background/90 backdrop-blur-2xl docked left-0 h-screen w-[280px] border-r border-white/20 dark:border-white/10 shadow-xl flex flex-col fixed left-0 top-0 py-6 z-40 hidden md:flex">
      {/* Header */}
      <div className="px-6 mb-stack-lg flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-container to-primary flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-white text-[20px]">account_balance</span>
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface dark:text-surface-bright leading-tight">Imperial College</h1>
          <p className="font-body-sm text-body-sm text-outline">Admin Portal</p>
        </div>
      </div>
      
      {/* Main Tabs */}
      <div className="flex-1 px-4 flex flex-col gap-base overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 active:scale-95 transition-transform border-l-4 ${
                isActive
                  ? "bg-primary-container/20 text-primary dark:text-primary-fixed-dim border-primary hover:bg-primary-container/10"
                  : "text-on-surface-variant dark:text-outline border-transparent hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-primary-container/10"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-body-sm text-body-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Footer Tabs */}
      <div className="px-4 mt-auto pt-6 flex flex-col gap-base border-t border-white/5">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed-dim border-l-4 border-transparent hover:bg-primary-container/10 transition-colors duration-200 active:scale-95 transition-transform w-full text-left">
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="font-body-sm text-body-sm">Support</span>
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem("erp_admin_auth_ok");
            window.dispatchEvent(new Event("erp-auth"));
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant dark:text-outline hover:text-primary dark:hover:text-primary-fixed-dim border-l-4 border-transparent hover:bg-primary-container/10 transition-colors duration-200 active:scale-95 transition-transform w-full text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-body-sm text-body-sm">Logout</span>
        </button>
      </div>
    </nav>
  );
}
