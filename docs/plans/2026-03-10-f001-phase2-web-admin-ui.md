# F-001 Phase 2: Web Admin UI — Modifier Groups

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the web admin UI for managing modifier groups, options, and menu item modifier assignment, under a new `/(app)/admin/` route group.

**Architecture:** New `routes/(app)/admin/route.tsx` layout with horizontal tab nav + `Outlet`. Modifier management at `/admin/modifiers` (single file, Dialog-based CRUD). Menu item modifier assignment added inline to existing `menu.tsx` edit dialog. `routeTree.gen.ts` updated manually (no dev server required). Sidebar gets a new "Configuration" section.

**Tech Stack:** TanStack Router (file-based), React 19, TanStack Query, tRPC proxy (`api.*`), shadcn/ui from `@repo/ui`, Tailwind CSS v4, Lucide icons.

**Available `@repo/ui` components:** `Button`, `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`, `Checkbox`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`, `Input`, `Label`, `Separator`, `Switch`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`, `Skeleton`

---

## Task 1: Admin route layout

**Files:**

- Create: `apps/app/routes/(app)/admin/route.tsx`

### Step 1: Create the directory and file

```tsx
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutGrid, SlidersHorizontal } from "lucide-react";

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
          {/* Future tabs: Floor Plan, Pricing Schedules, Combos */}
        </nav>
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
```

### Step 2: Verify file is valid TypeScript (no build needed)

```bash
cd apps/app && bunx tsc --noEmit --skipLibCheck 2>&1 | grep -i "admin" | head -10
```

Expected: path errors about routeTree only (routeTree not updated yet — expected at this stage)

---

## Task 2: Modifiers list + group form + option management

**Files:**

- Create: `apps/app/routes/(app)/admin/modifiers.tsx`

Covers T-001-07 (list), T-001-08 (group form dialog), T-001-09 (inline option management).

### Step 1: Write the full modifiers page

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Separator,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { Edit2, Loader2, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { api } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/(app)/admin/modifiers")({
  component: ModifiersPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

type ModifierOption = {
  id: string;
  name: string;
  nameTh: string | null;
  priceAdjustment: string;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
};

type ModifierGroup = {
  id: string;
  name: string;
  nameTh: string | null;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isActive: boolean;
  options: ModifierOption[];
};

// ── Default form state ─────────────────────────────────────────────────────────

const defaultGroupForm = {
  name: "",
  nameTh: "",
  isRequired: false,
  minSelections: 0,
  maxSelections: 1,
  sortOrder: 0,
};

const defaultOptionForm = {
  name: "",
  nameTh: "",
  priceAdjustment: "0",
  isDefault: false,
  sortOrder: 0,
};

// ── Page component ─────────────────────────────────────────────────────────────

function ModifiersPage() {
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [groupForm, setGroupForm] = useState(defaultGroupForm);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [optionForm, setOptionForm] = useState(defaultOptionForm);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: groups, isLoading } = useQuery(
    api.modifier.list.queryOptions({}),
  );

  const invalidate = () =>
    queryClient.invalidateQueries(api.modifier.list.queryOptions({}));

  // ── Group mutations ────────────────────────────────────────────────────────

  const createGroup = useMutation(
    api.modifier.create.mutationOptions({
      onSuccess: () => {
        invalidate();
        closeDialog();
      },
    }),
  );

  const updateGroup = useMutation(
    api.modifier.update.mutationOptions({ onSuccess: invalidate }),
  );

  const deleteGroup = useMutation(
    api.modifier.delete.mutationOptions({ onSuccess: invalidate }),
  );

  // ── Option mutations ───────────────────────────────────────────────────────

  const addOption = useMutation(
    api.modifier.addOption.mutationOptions({
      onSuccess: () => {
        invalidate();
        setIsAddingOption(false);
        setOptionForm(defaultOptionForm);
      },
    }),
  );

  const deleteOption = useMutation(
    api.modifier.deleteOption.mutationOptions({ onSuccess: invalidate }),
  );

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  function openCreate() {
    setEditingGroup(null);
    setGroupForm(defaultGroupForm);
    setIsAddingOption(false);
    setIsDialogOpen(true);
  }

  function openEdit(g: ModifierGroup) {
    setEditingGroup(g);
    setGroupForm({
      name: g.name,
      nameTh: g.nameTh ?? "",
      isRequired: g.isRequired,
      minSelections: g.minSelections,
      maxSelections: g.maxSelections,
      sortOrder: g.sortOrder,
    });
    setIsAddingOption(false);
    setOptionForm(defaultOptionForm);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditingGroup(null);
    setGroupForm(defaultGroupForm);
    setIsAddingOption(false);
    setOptionForm(defaultOptionForm);
  }

  function handleGroupSubmit() {
    if (editingGroup) {
      updateGroup.mutate({ id: editingGroup.id, ...groupForm });
    } else {
      createGroup.mutate(groupForm);
    }
  }

  function handleAddOption() {
    if (!editingGroup) return;
    addOption.mutate({ modifierGroupId: editingGroup.id, ...optionForm });
  }

  // Reflect live option data (mutations → invalidate → fresh list → liveGroup)
  const liveGroup = editingGroup
    ? (groups?.find((g) => g.id === editingGroup.id) ?? editingGroup)
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Modifier Groups</h2>
          <p className="text-sm text-muted-foreground">
            Add-ons and customisation options for menu items (e.g. Size,
            Temperature, Spice Level)
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Modifier Group" : "New Modifier Group"}
              </DialogTitle>
            </DialogHeader>

            {/* ── Group fields ── */}
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="grpName">Name (EN)</Label>
                  <Input
                    id="grpName"
                    value={groupForm.name}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, name: e.target.value })
                    }
                    placeholder="e.g. Size"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="grpNameTh">Name (TH)</Label>
                  <Input
                    id="grpNameTh"
                    value={groupForm.nameTh}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, nameTh: e.target.value })
                    }
                    placeholder="e.g. ขนาด"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minSel">Min picks</Label>
                  <Input
                    id="minSel"
                    type="number"
                    min={0}
                    value={groupForm.minSelections}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        minSelections: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxSel">Max picks</Label>
                  <Input
                    id="maxSel"
                    type="number"
                    min={1}
                    value={groupForm.maxSelections}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        maxSelections: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="grpSort">Sort order</Label>
                  <Input
                    id="grpSort"
                    type="number"
                    value={groupForm.sortOrder}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        sortOrder: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="isRequired"
                  checked={groupForm.isRequired}
                  onCheckedChange={(v) =>
                    setGroupForm({ ...groupForm, isRequired: v })
                  }
                />
                <Label htmlFor="isRequired">
                  Required — customer must choose at least one
                </Label>
              </div>

              <Button
                onClick={handleGroupSubmit}
                disabled={
                  !groupForm.name ||
                  createGroup.isPending ||
                  updateGroup.isPending
                }
              >
                {(createGroup.isPending || updateGroup.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingGroup ? "Save Changes" : "Create Group"}
              </Button>
            </div>

            {/* ── Options (edit mode only) ── */}
            {editingGroup && (
              <>
                <Separator className="my-2" />
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Options</p>
                    {!isAddingOption && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingOption(true)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Option
                      </Button>
                    )}
                  </div>

                  {liveGroup?.options.length === 0 && !isAddingOption && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No options yet.
                    </p>
                  )}

                  {liveGroup?.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {opt.name}
                        </p>
                        {opt.nameTh && (
                          <p className="text-xs text-muted-foreground">
                            {opt.nameTh}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                        {opt.priceAdjustment === "0"
                          ? "Free"
                          : `+฿${opt.priceAdjustment}`}
                      </span>
                      {opt.isDefault && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Default
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => deleteOption.mutate({ id: opt.id })}
                        disabled={deleteOption.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}

                  {/* Inline add-option form */}
                  {isAddingOption && (
                    <div className="rounded-md border p-3 grid gap-3 bg-muted/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Name (EN)</Label>
                          <Input
                            className="h-8 text-sm"
                            value={optionForm.name}
                            onChange={(e) =>
                              setOptionForm({
                                ...optionForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. Large"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Name (TH)</Label>
                          <Input
                            className="h-8 text-sm"
                            value={optionForm.nameTh}
                            onChange={(e) =>
                              setOptionForm({
                                ...optionForm,
                                nameTh: e.target.value,
                              })
                            }
                            placeholder="e.g. ใหญ่"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Price adj. (฿)</Label>
                          <Input
                            className="h-8 text-sm font-mono"
                            value={optionForm.priceAdjustment}
                            onChange={(e) =>
                              setOptionForm({
                                ...optionForm,
                                priceAdjustment: e.target.value,
                              })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Sort order</Label>
                          <Input
                            className="h-8 text-sm"
                            type="number"
                            value={optionForm.sortOrder}
                            onChange={(e) =>
                              setOptionForm({
                                ...optionForm,
                                sortOrder: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="optDefault"
                          checked={optionForm.isDefault}
                          onCheckedChange={(v) =>
                            setOptionForm({ ...optionForm, isDefault: v })
                          }
                        />
                        <Label htmlFor="optDefault" className="text-sm">
                          Default selection
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddOption}
                          disabled={!optionForm.name || addOption.isPending}
                        >
                          {addOption.isPending && (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          )}
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingOption(false);
                            setOptionForm(defaultOptionForm);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups table */}
      <Card>
        <CardHeader>
          <CardTitle>All Modifier Groups</CardTitle>
          <CardDescription>
            Assign these to menu items from the Menu page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !groups?.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <SlidersHorizontal className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                No modifier groups yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first group above.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Picks</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <p className="font-medium leading-none">{group.name}</p>
                      {group.nameTh && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {group.nameTh}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          group.isRequired
                            ? "bg-orange-50 text-orange-700 ring-orange-600/20"
                            : "bg-muted text-muted-foreground ring-muted-foreground/20"
                        }`}
                      >
                        {group.isRequired ? "Required" : "Optional"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-muted-foreground">
                        {group.minSelections}–{group.maxSelections}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {group.options.length} option
                        {group.options.length !== 1 ? "s" : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(group)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteGroup.isPending}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete "${group.name}"? It will be hidden from the POS.`,
                              )
                            )
                              deleteGroup.mutate({ id: group.id });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
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
```

### Step 2: Verify file saved correctly

```bash
wc -l apps/app/routes/\(app\)/admin/modifiers.tsx
```

Expected: ~280+ lines

---

## Task 3: Menu item modifier assignment (T-001-10)

**Files:**

- Modify: `apps/app/routes/(app)/menu.tsx`

Add a "Modifier Groups" checkbox section inside the existing edit Dialog.

### Step 1: Add new imports

```tsx
// Add Checkbox, Separator to @repo/ui import:
import { ..., Checkbox, Separator } from "@repo/ui";

// Add SlidersHorizontal to lucide-react import:
import { ..., SlidersHorizontal } from "lucide-react";
```

### Step 2: Add modifier queries inside the Menu component (after existing queries)

```tsx
const { data: allModifierGroups } = useQuery(
  api.modifier.list.queryOptions({}),
);

const { data: itemModifierGroups, refetch: refetchItemModifiers } = useQuery({
  ...api.modifier.listForItem.queryOptions({
    menuItemId: editingItem?.id ?? "",
  }),
  enabled: !!editingItem?.id,
});

const assignModifier = useMutation(
  api.modifier.assignToItem.mutationOptions({
    onSuccess: () => refetchItemModifiers(),
  }),
);

const unassignModifier = useMutation(
  api.modifier.unassignFromItem.mutationOptions({
    onSuccess: () => refetchItemModifiers(),
  }),
);
```

### Step 3: Add modifier section inside DialogContent

Place this block after the `isAvailable` Switch and before the Save button:

```tsx
{
  /* Modifier Groups (edit mode only) */
}
{
  editingItem && (
    <>
      <Separator />
      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Modifier Groups</Label>
        </div>
        {!allModifierGroups?.length ? (
          <p className="text-xs text-muted-foreground">
            No modifier groups yet — create them in{" "}
            <span className="font-medium">Configuration → Modifier Groups</span>
            .
          </p>
        ) : (
          <div className="grid gap-2 max-h-44 overflow-y-auto pr-1">
            {allModifierGroups.map((group) => {
              const isAssigned = itemModifierGroups?.some(
                (ig) => ig.modifierGroupId === group.id,
              );
              return (
                <div key={group.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`mg-${group.id}`}
                    checked={isAssigned ?? false}
                    onCheckedChange={(checked) => {
                      if (!editingItem) return;
                      if (checked) {
                        assignModifier.mutate({
                          menuItemId: editingItem.id,
                          modifierGroupId: group.id,
                          sortOrder: 0,
                        });
                      } else {
                        unassignModifier.mutate({
                          menuItemId: editingItem.id,
                          modifierGroupId: group.id,
                        });
                      }
                    }}
                  />
                  <Label
                    htmlFor={`mg-${group.id}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    {group.name}
                    {group.isRequired && (
                      <span className="text-xs text-orange-600 font-medium">
                        Required
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ({group.options.length} options)
                    </span>
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
```

---

## Task 4: Update routeTree.gen.ts

**Files:**

- Modify: `apps/app/lib/routeTree.gen.ts`

### Step 1: Add two imports after the last existing import (line ~34)

```ts
import { Route as appAdminRouteImport } from "./../routes/(app)/admin/route";
import { Route as appAdminModifiersRouteImport } from "./../routes/(app)/admin/modifiers";
```

### Step 2: Add route definitions after `appAboutRoute` definition (line ~129)

```ts
const appAdminRoute = appAdminRouteImport.update({
  id: "/(app)/admin",
  path: "/admin",
  getParentRoute: () => appRouteRoute,
} as any);

const appAdminModifiersRoute = appAdminModifiersRouteImport.update({
  id: "/(app)/admin/modifiers",
  path: "/modifiers",
  getParentRoute: () => appAdminRoute,
} as any);
```

### Step 3: Update `FileRoutesByFullPath` interface — add two entries

```ts
'/admin': typeof appAdminRouteWithChildren
'/admin/modifiers': typeof appAdminModifiersRoute
```

### Step 4: Update `FileRoutesByTo` interface — add one entry

```ts
'/admin/modifiers': typeof appAdminModifiersRoute
```

### Step 5: Update `FileRoutesById` interface — add two entries

```ts
'/(app)/admin': typeof appAdminRouteWithChildren
'/(app)/admin/modifiers': typeof appAdminModifiersRoute
```

### Step 6: Update `FileRouteTypes` — extend the three union types

```ts
// fullPaths: add
| '/admin'
| '/admin/modifiers'

// to: add
| '/admin/modifiers'

// id: add
| '/(app)/admin'
| '/(app)/admin/modifiers'
```

### Step 7: Update `FileRoutesByPath` module declaration — add two blocks

```ts
'/(app)/admin': {
  id: '/(app)/admin'
  path: '/admin'
  fullPath: '/admin'
  preLoaderRoute: typeof appAdminRouteImport
  parentRoute: typeof appRouteRoute
}
'/(app)/admin/modifiers': {
  id: '/(app)/admin/modifiers'
  path: '/modifiers'
  fullPath: '/admin/modifiers'
  preLoaderRoute: typeof appAdminModifiersRouteImport
  parentRoute: typeof appAdminRoute
}
```

### Step 8: Add admin children interface + const + withChildren (after `appReportsRouteWithChildren`)

```ts
interface appAdminRouteChildren {
  appAdminModifiersRoute: typeof appAdminModifiersRoute;
}

const appAdminRouteChildren: appAdminRouteChildren = {
  appAdminModifiersRoute: appAdminModifiersRoute,
};

const appAdminRouteWithChildren = appAdminRoute._addFileChildren(
  appAdminRouteChildren,
);
```

### Step 9: Add `appAdminRoute` to `appRouteRouteChildren` interface and const

```ts
// In interface:
appAdminRoute: typeof appAdminRouteWithChildren

// In const:
appAdminRoute: appAdminRouteWithChildren,
```

---

## Task 5: Sidebar navigation

**Files:**

- Modify: `apps/app/components/layout/constants.ts`

### Step 1: Add `SlidersHorizontal` to the import

```ts
import {
  ListOrdered,
  Link,
  Plug,
  Settings,
  Book,
  FileText,
  Home,
  Utensils,
  SlidersHorizontal, // ← add
} from "lucide-react";
```

### Step 2: Add a new "Configuration" section to `sidebarSections`

```ts
{
  titleKey: "nav.configuration",
  items: [
    {
      icon: SlidersHorizontal,
      labelKey: "nav.modifiers",
      to: "/admin/modifiers",
    },
  ],
},
```

Add this as the third section (after "Management").

---

## Task 6: Verify everything

### Step 1: Typecheck app

```bash
bun --filter @repo/app typecheck 2>&1
```

Expected: exit 0 (no errors)

### Step 2: Run API tests (ensure nothing broken)

```bash
bun --filter @repo/api test 2>&1
```

Expected: 30 passed

### Step 3: Update tasks.md — mark T-001-07 through T-001-10 complete

File: `/Users/waiphyoaung/Desktop/NexusPoint/.specify/specs/001-menu-modifiers/tasks.md`

Mark `[ ]` → `[x]` for T-001-07, T-001-08, T-001-09, T-001-10.

### Step 4: Update SPEC-KIT-NEXUSPOINT.md

File: `/Users/waiphyoaung/Desktop/NexusPoint/.specify/SPEC-KIT-NEXUSPOINT.md`

Update Phase 1 progress row to reflect Phase 2 partial completion.

---

## Security Notes

**[Security]** All modifier mutations are guarded server-side by `requireManagerRole` (owner/admin only). The frontend checkboxes and buttons are convenience — the API enforces authz independently. No client-side secrets. `deleteOption` uses soft-delete, so historical order data referencing deleted options remains intact.
