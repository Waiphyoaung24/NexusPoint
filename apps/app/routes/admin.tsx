import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@repo/ui";
import {
  Building2,
  LayoutDashboard,
  FileBarChart,
  Plus,
  Store,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/trpc";
import { getCachedSession, sessionQueryOptions } from "@/lib/queries/session";

const ADMIN_EMAIL = "nexuslab.dev.mm@gmail.com";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context }) => {
    let session = getCachedSession(context.queryClient);

    if (session === undefined) {
      session = await context.queryClient.fetchQuery(sessionQueryOptions());
    }

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      throw redirect({
        to: "/login",
      });
    }
    return { user: session.user };
  },
  component: AdminPanel,
});

function AdminPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Form states
  const [orgForm, setOrgForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [branchForm, setBranchForm] = useState({ name: "", address: "" });
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as "admin" | "member",
  });

  // Fetch all organizations
  const { data: organizations, isLoading: isLoadingOrgs } = useQuery(
    api.organization.list.queryOptions(),
  );

  // Mutations
  const createOrgMutation = useMutation(
    api.organization.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(api.organization.list.queryOptions());
        setIsOrgDialogOpen(false);
        setOrgForm({ name: "", slug: "", description: "" });
      },
    }),
  );

  const createBranchMutation = useMutation(
    api.branch.create.mutationOptions({
      onSuccess: () => {
        setIsBranchDialogOpen(false);
        setBranchForm({ name: "", address: "" });
        // Normally we'd invalidate branch list, but since we are in a global view,
        // we might just show a success toast or update the UI.
      },
    }),
  );

  const inviteMemberMutation = useMutation(
    api.organization.invite.mutationOptions({
      onSuccess: () => {
        setIsInviteDialogOpen(false);
        setInviteForm({ email: "", role: "member" });
      },
    }),
  );

  const setActiveOrgMutation = useMutation(
    api.organization.setActive.mutationOptions(),
  );

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    createOrgMutation.mutate(orgForm);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) return;

    // We need to set the active organization temporarily or pass it to the mutation
    // The current branch.create expects activeOrganizationId from session.
    // Let's first set the active org, then create.
    setActiveOrgMutation.mutate(
      { organizationId: selectedOrgId },
      {
        onSuccess: () => {
          createBranchMutation.mutate(branchForm);
        },
      },
    );
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) return;

    inviteMemberMutation.mutate({
      organizationId: selectedOrgId,
      email: inviteForm.email,
      role: inviteForm.role,
    });
  };

  const handleEnterControlRoom = (orgId: string) => {
    setActiveOrgMutation.mutate(
      { organizationId: orgId },
      {
        onSuccess: () => {
          router.navigate({ to: "/" });
        },
      },
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Admin Control Center</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Logged in as:{" "}
          <span className="font-medium text-foreground">{ADMIN_EMAIL}</span>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Actions Bar */}
        <div className="flex justify-end gap-3">
          <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateOrg}>
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Register a new business entity in the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={orgForm.name}
                      onChange={(e) =>
                        setOrgForm({ ...orgForm, name: e.target.value })
                      }
                      placeholder="e.g. Nexus Lab"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={orgForm.slug}
                      onChange={(e) =>
                        setOrgForm({
                          ...orgForm,
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, "-"),
                        })
                      }
                      placeholder="e.g. nexus-lab"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={orgForm.description}
                      onChange={(e) =>
                        setOrgForm({ ...orgForm, description: e.target.value })
                      }
                      placeholder="Optional business details"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createOrgMutation.isPending}>
                    {createOrgMutation.isPending
                      ? "Creating..."
                      : "Create Organization"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizations?.length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Status
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                Operational
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Onboarding Mode
              </CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Ready for multi-branch setup
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Management */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Management</CardTitle>
            <CardDescription>
              View and manage all active organizations in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOrgs ? (
              <div className="py-10 text-center text-muted-foreground">
                Loading organizations...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations?.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {org.slug}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary uppercase">
                          {org.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setSelectedOrgId(org.id);
                              setIsInviteDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-3 w-3" />
                            Invite
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setSelectedOrgId(org.id);
                              setIsBranchDialogOpen(true);
                            }}
                          >
                            <Store className="h-3 w-3" />
                            Add Branch
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnterControlRoom(org.id)}
                            disabled={setActiveOrgMutation.isPending}
                          >
                            {setActiveOrgMutation.isPending &&
                            selectedOrgId === org.id
                              ? "Entering..."
                              : "Control Room"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!organizations || organizations.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No organizations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Branch Creation Dialog */}
        <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
          <DialogContent>
            <form onSubmit={handleCreateBranch}>
              <DialogHeader>
                <DialogTitle>Add New Branch</DialogTitle>
                <DialogDescription>
                  Setup a new physical or virtual branch for this organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={branchForm.name}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, name: e.target.value })
                    }
                    placeholder="e.g. Main Branch, Sukhumvit"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address / Location</Label>
                  <Input
                    id="address"
                    value={branchForm.address}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, address: e.target.value })
                    }
                    placeholder="Full address or GPS coordinates"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    createBranchMutation.isPending ||
                    setActiveOrgMutation.isPending
                  }
                >
                  {createBranchMutation.isPending
                    ? "Adding..."
                    : "Register Branch"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* User Invitation Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <form onSubmit={handleInviteMember}>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    placeholder="user@company.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(val: "admin" | "member") =>
                      setInviteForm({ ...inviteForm, role: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={inviteMemberMutation.isPending}>
                  {inviteMemberMutation.isPending
                    ? "Sending..."
                    : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Global Control Room Section */}
        <Card>
          <CardHeader>
            <CardTitle>Global Control Room</CardTitle>
            <CardDescription>
              Aggregated reports and live status from all branches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Branch Reports Engine</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                This section monitors branch-level activities and generates
                consolidated reports. The onboarding system ensures all new
                branches are automatically tracked here.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
