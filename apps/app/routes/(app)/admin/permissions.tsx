import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { api } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/(app)/admin/permissions")({
  component: PermissionsPage,
});

const ROLES = ["owner", "manager", "cashier", "waiter", "kitchen"] as const;
type StaffRole = (typeof ROLES)[number];

const ACTION_LABELS: Record<string, string> = {
  "order.create": "Create Orders",
  "order.view": "View Orders",
  "order.void": "Void Orders",
  "order.cancel": "Cancel Orders",
  "discount.apply": "Apply Discounts",
  "refund.issue": "Issue Refunds",
  "payment.process": "Process Payments",
  "menu.manage": "Manage Menu",
  "staff.manage": "Manage Staff",
  "report.view": "View Reports",
  "table.manage": "Manage Tables",
  "floorplan.edit": "Edit Floor Plan",
  "zreport.generate": "Generate Z-Report",
  "kds.view": "View KDS",
};

type PermEntry = {
  role: StaffRole;
  action: string;
  allowed: boolean;
  requiresPin: boolean;
};

function PermissionsPage() {
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Map<string, PermEntry>>(
    () => new Map(),
  );

  const matrix = useQuery(api.permission.getMatrix.queryOptions());

  const bulkUpdate = useMutation({
    ...api.permission.bulkUpdate.mutationOptions(),
    onSuccess: () => {
      setPendingChanges(new Map());
      queryClient.invalidateQueries({ queryKey: ["permission", "matrix"] });
    },
  });

  const resetDefaults = useMutation({
    ...api.permission.resetDefaults.mutationOptions(),
    onSuccess: () => {
      setPendingChanges(new Map());
      queryClient.invalidateQueries({ queryKey: ["permission", "matrix"] });
    },
  });

  // Build lookup: action+role → permission
  const permLookup = new Map<
    string,
    { allowed: boolean; requiresPin: boolean }
  >();
  for (const perm of matrix.data ?? []) {
    const key = `${perm.action}:${perm.role}`;
    const pending = pendingChanges.get(key);
    permLookup.set(
      key,
      pending ?? { allowed: perm.allowed, requiresPin: perm.requiresPin },
    );
  }

  const getCell = (action: string, role: StaffRole) => {
    const key = `${action}:${role}`;
    return permLookup.get(key) ?? { allowed: false, requiresPin: false };
  };

  const updateCell = (
    action: string,
    role: StaffRole,
    field: "allowed" | "requiresPin",
    value: boolean,
  ) => {
    const key = `${action}:${role}`;
    const current = getCell(action, role);
    const updated = { ...current, [field]: value };
    // If disabling allowed, also disable requiresPin
    if (field === "allowed" && !value) {
      updated.requiresPin = false;
    }
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(key, { role, action, ...updated });
      return next;
    });
  };

  const handleSave = () => {
    const updates = Array.from(pendingChanges.values());
    if (updates.length > 0) {
      bulkUpdate.mutate({ updates });
    }
  };

  const actions = Object.keys(ACTION_LABELS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permission Matrix</h1>
          <p className="text-muted-foreground">
            Configure what each role can do across your organization
          </p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all permissions to the default matrix. Any
                  customizations will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetDefaults.mutate()}>
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={handleSave}
            disabled={pendingChanges.size === 0 || bulkUpdate.isPending}
          >
            {bulkUpdate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save ({pendingChanges.size})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Check = allowed, PIN toggle = requires Manager PIN approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matrix.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                // eslint-disable-next-line @eslint-react/no-array-index-key -- static skeleton placeholders
                <Skeleton key={`perm-skeleton-${i}`} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Action</TableHead>
                  {ROLES.map((role) => (
                    <TableHead
                      key={role}
                      className="text-center capitalize w-28"
                    >
                      {role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action}>
                    <TableCell className="font-medium">
                      {ACTION_LABELS[action]}
                    </TableCell>
                    {ROLES.map((role) => {
                      const cell = getCell(action, role);
                      return (
                        <TableCell key={role} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Checkbox
                              checked={cell.allowed}
                              onCheckedChange={(v) =>
                                updateCell(action, role, "allowed", !!v)
                              }
                            />
                            {cell.allowed && (
                              <div
                                className="flex items-center gap-1"
                                title="Requires PIN"
                              >
                                <span className="text-xs text-muted-foreground">
                                  PIN
                                </span>
                                <Switch
                                  checked={cell.requiresPin}
                                  onCheckedChange={(v) =>
                                    updateCell(action, role, "requiresPin", v)
                                  }
                                  className="scale-75"
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
