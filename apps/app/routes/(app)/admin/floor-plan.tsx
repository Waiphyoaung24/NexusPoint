import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { api } from "@/lib/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { currentBranchAtom } from "@/lib/store";
import {
  Button,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

export const Route = createFileRoute("/(app)/admin/floor-plan")({
  component: FloorPlanAdminRoute,
});

// Grid: 24 columns × 16 rows
const GRID_COLS = 24;
const GRID_ROWS = 16;
const CELL_W = 48; // px per column
const CELL_H = 40; // px per row
const CANVAS_W = GRID_COLS * CELL_W; // 1152px
const CANVAS_H = GRID_ROWS * CELL_H; // 640px

type TableData = {
  id: string;
  number: number;
  seats: number;
  shape: "rectangle" | "round" | "bar_stool";
  label?: string | null;
  positionX: number;
  positionY: number;
  status: string;
};

// ─── Draggable Table Card ──────────────────────────────────────────────────────
function DraggableTable({
  table,
  isSelected,
  onClick,
}: {
  table: TableData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: table.id });

  const style = {
    position: "absolute" as const,
    left: table.positionX * CELL_W,
    top: table.positionY * CELL_H,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const isRound = table.shape === "round";
  const statusColors = {
    available: "border-2 border-green-500 bg-white",
    occupied: "bg-blue-800 text-white",
    reserved: "border-2 border-amber-400 bg-amber-50",
    cleaning: "border border-slate-300 bg-slate-50",
  } as Record<string, string>;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={[
        "w-[80px] h-[64px] flex flex-col items-center justify-center text-sm select-none",
        isRound ? "rounded-full" : "rounded-xl",
        statusColors[table.status] ?? "border border-slate-200 bg-white",
        isSelected ? "ring-2 ring-blue-400 ring-offset-2" : "",
        "shadow-sm transition-shadow",
      ].join(" ")}
    >
      <span className="font-bold text-base font-poppins">T-{table.number}</span>
      <span className="text-xs opacity-70">{table.seats} seats</span>
    </div>
  );
}

// ─── Editor Canvas ─────────────────────────────────────────────────────────────
function EditorCanvas({
  tables,
  selectedId,
  onSelect,
  onDragEnd,
}: {
  tables: TableData[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDragEnd: (id: string, col: number, row: number) => void;
}) {
  const { setNodeRef } = useDroppable({ id: "canvas" });

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const table = tables.find((t) => t.id === active.id);
    if (!table) return;

    const newX = Math.round((table.positionX * CELL_W + delta.x) / CELL_W);
    const newY = Math.round((table.positionY * CELL_H + delta.y) / CELL_H);

    // Clamp to grid bounds
    const col = Math.max(0, Math.min(GRID_COLS - 2, newX));
    const row = Math.max(0, Math.min(GRID_ROWS - 2, newY));

    onDragEnd(active.id as string, col, row);
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        ref={setNodeRef}
        style={{ width: CANVAS_W, height: CANVAS_H }}
        className="relative border border-slate-200 rounded-xl bg-slate-50 overflow-hidden"
        onClick={() => onSelect(null)}
      >
        {/* Grid lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CANVAS_W}
          height={CANVAS_H}
        >
          {Array.from({ length: GRID_COLS + 1 }).map((_, i) => {
            const key = `v-${String(i)}`;
            return (
              <line
                key={key}
                x1={i * CELL_W}
                y1={0}
                x2={i * CELL_W}
                y2={CANVAS_H}
                stroke="#E2E8F0"
                strokeWidth={0.5}
              />
            );
          })}
          {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => {
            const key = `h-${String(i)}`;
            return (
              <line
                key={key}
                x1={0}
                y1={i * CELL_H}
                x2={CANVAS_W}
                y2={i * CELL_H}
                stroke="#E2E8F0"
                strokeWidth={0.5}
              />
            );
          })}
        </svg>
        {/* Tables */}
        {tables.map((table) => (
          <DraggableTable
            key={table.id}
            table={table}
            isSelected={selectedId === table.id}
            onClick={() => onSelect(table.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}

// ─── Main Route Component ──────────────────────────────────────────────────────
function FloorPlanAdminRoute() {
  const currentBranch = useAtomValue(currentBranchAtom);
  const branchId = currentBranch?.id ?? "";

  const { data: remoteTables = [] } = useQuery({
    ...api.table.list.queryOptions({ branchId }),
    enabled: !!branchId,
  });

  // Local state for editor — mutations staged until Save
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync remote → local on first load (legitimate one-time sync from server query)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (remoteTables.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect -- one-time sync from query
      setTables(
        remoteTables.map((t) => ({
          ...t,
          positionX: Number(t.positionX),
          positionY: Number(t.positionY),
        })),
      );
    }
  }, [remoteTables]);

  const batchUpdatePositions = useMutation(
    api.table.batchUpdatePositions.mutationOptions(),
  );

  const updateTable = useMutation(api.table.update.mutationOptions());
  const createTable = useMutation(api.table.create.mutationOptions());
  const deleteTable = useMutation(api.table.delete.mutationOptions());

  const selectedTable = tables.find((t) => t.id === selectedId) ?? null;

  // Find next available table number
  const nextTableNumber = () => {
    const nums = new Set(tables.map((t) => t.number));
    for (let i = 1; i <= 99; i++) {
      if (!nums.has(i)) return i;
    }
    return tables.length + 1;
  };

  // Find first empty grid cell
  const nextEmptyCell = (): [number, number] => {
    const occupied = new Set(
      tables.map((t) => `${t.positionX},${t.positionY}`),
    );
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (!occupied.has(`${col},${row}`)) return [col, row];
      }
    }
    return [0, 0];
  };

  function handleDragEnd(id: string, col: number, row: number) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, positionX: col, positionY: row } : t,
      ),
    );
    setIsDirty(true);
  }

  async function handleSave() {
    await batchUpdatePositions.mutateAsync({
      updates: tables.map((t) => ({
        id: t.id,
        positionX: t.positionX,
        positionY: t.positionY,
      })),
    });
    setIsDirty(false);
  }

  async function handleAddTable() {
    const number = nextTableNumber();
    const [col, row] = nextEmptyCell();
    const newTable = await createTable.mutateAsync({
      branchId,
      number,
      seats: 4,
      shape: "rectangle",
      positionX: col,
      positionY: row,
    });
    setTables((prev) => [
      ...prev,
      { ...newTable, positionX: col, positionY: row },
    ]);
  }

  async function handleDeleteSelected() {
    if (!selectedId) return;
    await deleteTable.mutateAsync({ id: selectedId });
    setTables((prev) => prev.filter((t) => t.id !== selectedId));
    setSelectedId(null);
  }

  async function handleUpdateSelected(
    field: keyof TableData,
    value: string | number,
  ) {
    if (!selectedId) return;
    setTables((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, [field]: value } : t)),
    );
    await updateTable.mutateAsync({ id: selectedId, [field]: value });
  }

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-slate-400">
          Select a branch from the header to manage floor plan tables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold font-poppins text-slate-900">
            Floor Plan
          </h1>
          {isDirty && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-400"
            >
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleAddTable}>
            + Add Table
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || batchUpdatePositions.isPending}
            className="bg-blue-800 hover:bg-blue-900"
          >
            {batchUpdatePositions.isPending ? "Saving…" : "Save Layout"}
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Config panel */}
        <div className="w-56 border-r border-slate-200 bg-white p-4 flex flex-col gap-4">
          {selectedTable ? (
            <>
              <p className="text-sm font-semibold text-slate-700 font-poppins">
                Table {selectedTable.number}
              </p>
              <div>
                <Label className="text-xs text-slate-500">Seats</Label>
                <Select
                  value={String(selectedTable.seats)}
                  onValueChange={(v) =>
                    handleUpdateSelected("seats", Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 4, 6, 8, 10, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Shape</Label>
                <Select
                  value={selectedTable.shape}
                  onValueChange={(v) => handleUpdateSelected("shape", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="round">Round</SelectItem>
                    <SelectItem value="bar_stool">Bar Stool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500">
                  Label (optional)
                </Label>
                <Input
                  value={selectedTable.label ?? ""}
                  onChange={(e) =>
                    handleUpdateSelected("label", e.target.value)
                  }
                  placeholder="e.g. VIP, Patio"
                  maxLength={20}
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="mt-auto"
              >
                Delete Table
              </Button>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center mt-8">
              Click a table to configure it
            </p>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          <EditorCanvas
            tables={tables}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>
    </div>
  );
}
