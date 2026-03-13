import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "../../lib/trpc";

export const Route = createFileRoute("/(app)/live-orders")({
  component: LiveOrders,
});

const statusColumns = [
  { status: "pending", label: "Pending" },
  { status: "accepted", label: "Accepted" },
  { status: "completed", label: "Completed" },
] as const;

const orderTypeBadgeStyles: Record<string, string> = {
  dine_in: "bg-blue-100 text-blue-800",
  takeaway: "bg-amber-100 text-amber-800",
  delivery: "bg-green-100 text-green-800",
};

const orderTypeLabels: Record<string, string> = {
  dine_in: "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

function OrderTypeBadge({ orderType }: { orderType?: string | null }) {
  if (!orderType) return null;
  const style = orderTypeBadgeStyles[orderType] ?? "bg-gray-100 text-gray-800";
  const label = orderTypeLabels[orderType] ?? orderType;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function LiveOrders() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["order", "list"],
    queryFn: () => trpcClient.order.list.query(),
  });
  const orders = data ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("liveOrders.title")}</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {statusColumns.map((col) => {
            const filtered = orders.filter(
              (o: (typeof orders)[number]) => o.status === col.status,
            );
            return (
              <Card key={col.status}>
                <CardHeader>
                  <CardTitle>
                    {col.label}{" "}
                    <span className="text-muted-foreground text-sm font-normal">
                      ({filtered.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filtered.map((order: (typeof orders)[number]) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            #{order.externalOrderId ?? order.id.slice(0, 8)}
                          </span>
                          <OrderTypeBadge orderType={order.orderType} />
                        </div>
                        {order.customerName && (
                          <p className="text-sm">{order.customerName}</p>
                        )}
                        {Array.isArray(order.items) &&
                          order.items.some(
                            (i: { menuItemId?: string }) => !i.menuItemId,
                          ) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Has Open Items
                            </span>
                          )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium">
                            ฿{order.total}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {order.source}
                            {order.vatAmount && ` · VAT ฿${order.vatAmount}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No {col.label.toLowerCase()} orders
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
