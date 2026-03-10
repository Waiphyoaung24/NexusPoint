import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Grab } from "lucide-react";

export const Route = createFileRoute("/(app)/live-orders")({
  component: LiveOrders,
});

type OrderStatus = "pending" | "accepted" | "completed";

type Order = {
  id: string;
  customer: string;
  items: string[];
  status: OrderStatus;
};

function LiveOrders() {
  const { t } = useTranslation();
  const orders: Order[] = [];

  const columns: { status: OrderStatus; labelKey: string }[] = [
    { status: "pending", labelKey: "liveOrders.pending" },
    { status: "accepted", labelKey: "liveOrders.accepted" },
    { status: "completed", labelKey: "liveOrders.completed" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("liveOrders.title")}</h1>
      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => (
          <Card key={col.status}>
            <CardHeader>
              <CardTitle>{t(col.labelKey)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders
                .filter((order) => order.status === col.status)
                .map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">#{order.id}</span>
                        <Grab className="h-4 w-4" />
                      </div>
                      <p className="text-sm">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.join(", ")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
