import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Sync status types
export type SyncStatus = "synced" | "syncing" | "error";

// Sync status atoms
export const syncStatusAtom = atom<SyncStatus>("synced");
export const syncStatusPopoverOpenAtom = atom(false);

// Branch context atoms (FR-WEB-01)
export interface BranchContext {
  id: string;
  name: string;
  organizationId: string;
}

export const currentBranchAtom = atomWithStorage<BranchContext | null>(
  "currentBranch",
  null,
);

export const branchListAtom = atom<BranchContext[]>([]);

// Language preference (persisted)
export const languageAtom = atomWithStorage<"en" | "th">("language", "en");
