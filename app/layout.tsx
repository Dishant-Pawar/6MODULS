import type { Metadata } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "ScholarSphere Enterprise ERP",
  description: "AcademiaPro ERP System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${geist.variable} ${jetbrainsMono.variable} antialiased overflow-hidden selection:bg-primary/30 selection:text-primary-fixed-dim`}>
        <div className="flex h-screen w-full relative">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary-container/5 blur-[100px]"></div>
          </div>
          
          <Sidebar />
          
          <div className="flex-1 flex flex-col h-full ml-0 md:ml-[280px] z-10 relative">
            <Topbar />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
