import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutGrid, SlidersHorizontal, TableProperties } from "lucide-react";

export const Route = createFileRoute("/(app)/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex flex-col h-full">
      {/* Section header + tab nav */}
      <div className="border-b bg-card px-6 pt-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
          <span className="text-sm text-muted-foreground ml-1">
            — Manage your restaurant setup
          </span>
        </div>
        <nav className="flex gap-1 -mb-px">
          <Link
            to="/admin/modifiers"
            className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{
              className:
                "flex items-center gap-2 px-4 py-2 border-b-2 border-primary text-sm font-medium text-foreground",
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Modifier Groups
          </Link>
          <Link
            to="/admin/floor-plan"
            className="flex items-center gap-2 px-4 py-2 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{
              className:
                "flex items-center gap-2 px-4 py-2 border-b-2 border-primary text-sm font-medium text-foreground",
            }}
          >
            <TableProperties className="h-4 w-4" />
            Floor Plan
          </Link>
        </nav>
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
