import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  DollarSign,
  ShoppingCart,
  Users,
  BarChart,
  RefreshCw,
  Link,
  AlertTriangle,
  PauseCircle,
  Grab,
  History,
} from "lucide-react";
import { currentBranchAtom } from "@/lib/store";
import { api } from "@/lib/trpc";

export const Route = createFileRoute("/(app)/")({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const currentBranch = useAtomValue(currentBranchAtom);

  // Fetch dashboard stats from API
  const { data: statsData, isLoading } = useQuery(
    api.dashboard.getStats.queryOptions(
      currentBranch ? { branchId: currentBranch.id } : undefined,
      {
        staleTime: 30_000, // Cache for 30 seconds
      },
    ),
  );

  const stats = [
    {
      titleKey: "dashboard.revenue",
      value: isLoading
        ? "..."
        : `฿${Number(statsData?.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
    },
    {
      titleKey: "dashboard.totalOrders",
      value: isLoading
        ? "..."
        : statsData?.totalOrders?.toLocaleString() || "0",
      icon: ShoppingCart,
    },
    {
      titleKey: "dashboard.activeItems",
      value: isLoading
        ? "..."
        : statsData?.activeItems?.toLocaleString() || "0",
      icon: BarChart,
    },
    {
      titleKey: "users.totalUsers",
      value: isLoading ? "..." : statsData?.totalUsers?.toLocaleString() || "0",
      icon: Users,
    },
  ];

  const activities = [
    {
      icon: Grab,
      text: "New Order #88A1 from Grab injected into Wongnai.",
      time: "2 minutes ago",
    },
    {
      icon: History,
      text: "'Chicken Rice' marked SOLD OUT. Disabled on Grab Merchant.",
      time: "10 minutes ago",
    },
    {
      icon: AlertTriangle,
      text: "Failed to update price for 'Coke Zero' on Grab. Check API keys.",
      time: "1 hour ago",
    },
  ];

  const quickActions = [
    {
      titleKey: "dashboard.forceSync",
      icon: RefreshCw,
    },
    {
      titleKey: "dashboard.mapItems",
      icon: Link,
    },
    {
      titleKey: "dashboard.viewErrors",
      icon: AlertTriangle,
    },
    {
      titleKey: "dashboard.pauseIntegrations",
      icon: PauseCircle,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.titleKey)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.liveSyncActivity")}</CardTitle>
            <CardDescription>{t("dashboard.latestEvents")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={`${activity.time}-${activity.text}`}
                  className="flex items-center gap-4"
                >
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted">
                    <activity.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            <CardDescription>{t("dashboard.commonTasks")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.titleKey}
                  variant="outline"
                  className="flex items-center justify-start gap-2 p-4 h-auto"
                >
                  <action.icon className="h-5 w-5" />
                  <p className="text-sm font-medium">{t(action.titleKey)}</p>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
