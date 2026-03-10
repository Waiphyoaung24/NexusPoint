import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useBranchAutoSelect } from "@/lib/hooks/use-branch-auto-select";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Centralized branch auto-selection — runs once at layout level
  useBranchAutoSelect();

  return (
    <div className="h-screen flex bg-background">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          isSidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
