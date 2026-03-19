import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { Loader2, Plus, Shield, ShieldOff, UserCog } from "lucide-react";
import { api } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/(app)/admin/staff")({
  component: StaffPage,
});

const ROLES = ["owner", "manager", "cashier", "waiter", "kitchen"] as const;
type StaffRole = (typeof ROLES)[number];

function StaffPage() {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinTargetId, setPinTargetId] = useState<string | null>(null);

  // Fetch branches
  const branches = useQuery(api.branch.list.queryOptions());

  // Fetch staff for selected branch
  const staff = useQuery({
    ...api.staff.list.queryOptions({ branchId: selectedBranchId }),
    enabled: !!selectedBranchId,
  });

  // Auto-select first branch
  if (branches.data?.length && !selectedBranchId) {
    setSelectedBranchId(branches.data[0].id);
  }

  const updateMutation = useMutation({
    ...api.staff.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff", "list", selectedBranchId],
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Assign roles and manage PINs per branch
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedBranchId}>
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddStaffDialog
              branchId={selectedBranchId}
              onSuccess={() => {
                setAddDialogOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["staff", "list", selectedBranchId],
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Branch Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.data?.map((b: { id: string; name: string }) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            {staff.data?.length ?? 0} members at this branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                // eslint-disable-next-line @eslint-react/no-array-index-key -- static skeleton placeholders
                <Skeleton key={`skeleton-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.data?.map(
                  (member: {
                    id: string;
                    userId: string;
                    staffRole: StaffRole;
                    managerPinHash: string | null;
                    isActive: boolean;
                  }) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.userId}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.staffRole}
                          onValueChange={(role: string) =>
                            updateMutation.mutate({
                              id: member.id,
                              staffRole: role as StaffRole,
                            })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {member.staffRole === "owner" ||
                        member.staffRole === "manager" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPinTargetId(member.id);
                              setPinDialogOpen(true);
                            }}
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            {member.managerPinHash ? "Reset PIN" : "Set PIN"}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            N/A
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            member.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              id: member.id,
                              isActive: !member.isActive,
                            })
                          }
                        >
                          {member.isActive ? (
                            <>
                              <ShieldOff className="mr-1 h-3 w-3" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCog className="mr-1 h-3 w-3" /> Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
                {staff.data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No staff assigned to this branch
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent>
          {pinTargetId && (
            <PinSetDialog
              memberId={pinTargetId}
              onSuccess={() => {
                setPinDialogOpen(false);
                setPinTargetId(null);
                queryClient.invalidateQueries({
                  queryKey: ["staff", "list", selectedBranchId],
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Add Staff Dialog ─────────────────────────────────────────────────────────

function AddStaffDialog({
  branchId,
  onSuccess,
}: {
  branchId: string;
  onSuccess: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<StaffRole>("cashier");

  const createMutation = useMutation({
    ...api.staff.create.mutationOptions(),
    onSuccess,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Staff to Branch</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>User ID</Label>
          <Input
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(v: string) => setRole(v as StaffRole)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() =>
            createMutation.mutate({ userId, branchId, staffRole: role })
          }
          disabled={!userId || createMutation.isPending}
        >
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Add Staff
        </Button>
      </DialogFooter>
    </>
  );
}

// ── PIN Set Dialog ───────────────────────────────────────────────────────────

function PinSetDialog({
  memberId,
  onSuccess,
}: {
  memberId: string;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const setPinMutation = useMutation({
    ...api.staff.setPin.mutationOptions(),
    onSuccess,
  });

  const removePinMutation = useMutation({
    ...api.staff.removePin.mutationOptions(),
    onSuccess,
  });

  const handleSubmit = () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    setError("");
    setPinMutation.mutate({ id: memberId, pin });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Set Manager PIN</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Enter 4-digit PIN</Label>
          <Input
            type="password"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Confirm PIN</Label>
          <Input
            type="password"
            maxLength={4}
            placeholder="••••"
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button
          variant="outline"
          onClick={() => removePinMutation.mutate({ id: memberId })}
        >
          Remove PIN
        </Button>
        <Button onClick={handleSubmit} disabled={setPinMutation.isPending}>
          {setPinMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save PIN
        </Button>
      </DialogFooter>
    </>
  );
}
