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
                          onClick={() => openEdit(group as ModifierGroup)}
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
