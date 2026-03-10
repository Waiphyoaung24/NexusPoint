# Fix Branch Auto-Selection (currentBranch null) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the race condition where `currentBranch` stays null in localStorage after selecting an organization, causing floor plan (and other branch-dependent pages) to show empty state.

**Architecture:** Extract branch auto-selection logic from `header.tsx` into a dedicated `useBranchAutoSelect()` hook. Place the hook at the `Layout` level so it runs once for all protected routes, regardless of which page is mounted. The hook reacts to `activeOrgId` + `branches` query data and sets `currentBranchAtom` when needed. The Header becomes a pure display/manual-select component.

**Tech Stack:** Jotai (`atomWithStorage`, `useAtom`), TanStack Query (`useQuery`, dependent queries), React 19

---

### Task 1: Create `useBranchAutoSelect` hook

**Files:**

- Create: `apps/app/lib/hooks/use-branch-auto-select.ts`

**Step 1: Write the failing test**

Create `apps/app/lib/hooks/__tests__/use-branch-auto-select.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

describe("useBranchAutoSelect", () => {
  it("should be importable", async () => {
    const mod = await import("../use-branch-auto-select");
    expect(mod.useBranchAutoSelect).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun --filter @repo/app test -- use-branch-auto-select`
Expected: FAIL — module not found

**Step 3: Create the hook with auto-select logic**

Create `apps/app/lib/hooks/use-branch-auto-select.ts`:

```typescript
import { useEffect } from "react";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { currentBranchAtom } from "@/lib/store";
import { api } from "@/lib/trpc";
import { useSessionQuery } from "@/lib/queries/session";

/**
 * Centralized branch auto-selection hook.
 * Ensures currentBranch is always set when an organization is active.
 *
 * Handles three scenarios:
 * 1. First login / fresh session — auto-selects first branch
 * 2. Organization switch — clears stale branch, selects first of new org
 * 3. Page refresh — revalidates stored branch against fetched branches
 */
export function useBranchAutoSelect() {
  const [currentBranch, setCurrentBranch] = useAtom(currentBranchAtom);
  const { data: session } = useSessionQuery();
  const activeOrgId = session?.session?.activeOrganizationId;

  const { data: branches } = useQuery(
    api.branch.list.queryOptions(undefined, {
      staleTime: 5 * 60 * 1000,
      enabled: !!activeOrgId,
    }),
  );

  useEffect(() => {
    if (!activeOrgId || !branches?.length) return;

    // Scenario 1 & 3: No branch selected at all
    if (!currentBranch) {
      const first = branches[0];
      setCurrentBranch({
        id: first.id,
        name: first.name,
        organizationId: first.organizationId,
      });
      return;
    }

    // Scenario 2: Branch belongs to a different org
    if (currentBranch.organizationId !== activeOrgId) {
      const first = branches[0];
      setCurrentBranch({
        id: first.id,
        name: first.name,
        organizationId: first.organizationId,
      });
      return;
    }

    // Scenario 3 (edge): Stored branch no longer exists in this org's branches
    const stillExists = branches.some((b) => b.id === currentBranch.id);
    if (!stillExists) {
      const first = branches[0];
      setCurrentBranch({
        id: first.id,
        name: first.name,
        organizationId: first.organizationId,
      });
    }
  }, [activeOrgId, branches, currentBranch, setCurrentBranch]);

  return { currentBranch, branches, activeOrgId };
}
```

**Step 4: Run test to verify it passes**

Run: `bun --filter @repo/app test -- use-branch-auto-select`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/app/lib/hooks/use-branch-auto-select.ts apps/app/lib/hooks/__tests__/use-branch-auto-select.test.ts
git commit -m "feat: add useBranchAutoSelect hook for centralized branch selection"
```

---

### Task 2: Wire hook into Layout component

**Files:**

- Modify: `apps/app/components/layout/index.tsx`

**Step 1: Add hook call to Layout**

In `apps/app/components/layout/index.tsx`, import and call the hook at the top of the `Layout` component:

```typescript
import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useBranchAutoSelect } from "@/lib/hooks/use-branch-auto-select";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Centralized branch auto-selection — runs once at layout level
  useBranchAutoSelect();

  return (
    <div className="h-screen flex bg-background">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          isSidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Run dev server and verify**

Run: `bun app:dev`
Expected: App starts without errors, hook runs at layout mount

**Step 3: Commit**

```bash
git add apps/app/components/layout/index.tsx
git commit -m "feat: wire useBranchAutoSelect into Layout for all protected routes"
```

---

### Task 3: Remove duplicate auto-select logic from Header

**Files:**

- Modify: `apps/app/components/layout/header.tsx`

**Step 1: Remove the useEffect and branch query from Header**

The Header should only handle manual branch selection display. Remove:

- The `useEffect` auto-select block (lines 43-55)
- The `useSessionQuery` import and `activeOrgId` derivation (only if solely used for auto-select)
- Keep the branch query for populating the dropdown, but use the atom's `organizationId` for the `enabled` check

Updated `header.tsx`:

```typescript
import { useEffect } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { CheckCircle, Menu, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { LanguageSwitcher } from "../language-switcher";
import { TabBarItem } from "../tab-bar-item";
import { OrganizationSwitcher } from "../organization-switcher";
import { currentBranchAtom } from "@/lib/store";
import { api } from "@/lib/trpc";
import { useSessionQuery } from "@/lib/queries/session";

interface HeaderProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isSidebarOpen, onMenuToggle }: HeaderProps) {
  const { t } = useTranslation();
  const [currentBranch, setCurrentBranch] = useAtom(currentBranchAtom);
  const { data: session } = useSessionQuery();
  const activeOrgId = session?.session?.activeOrganizationId;

  const { data: branches, isLoading } = useQuery(
    api.branch.list.queryOptions(undefined, {
      staleTime: 5 * 60 * 1000,
      enabled: !!activeOrgId,
    }),
  );

  // NOTE: Auto-select logic removed — handled by useBranchAutoSelect in Layout

  const handleBranchChange = (branchId: string) => {
    const selected = branches?.find((branch) => branch.id === branchId);
    if (selected) {
      setCurrentBranch({
        id: selected.id,
        name: selected.name,
        organizationId: selected.organizationId,
      });
    }
  };

  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="shrink-0"
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-4">
        <OrganizationSwitcher />

        <Select
          value={currentBranch?.id ?? ""}
          onValueChange={handleBranchChange}
          disabled={isLoading || !branches?.length || !activeOrgId}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue
              placeholder={
                !activeOrgId
                  ? t("header.noOrganization")
                  : t("header.selectBranch")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {branches?.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">{t("platforms.wongnai")}</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium">{t("platforms.grab")}</span>
        </div>
        <TabBarItem />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
```

**Step 2: Run existing tests**

Run: `bun --filter @repo/app test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add apps/app/components/layout/header.tsx
git commit -m "refactor: remove duplicate branch auto-select from Header"
```

---

### Task 4: Manual verification of all three scenarios

**Step 1: Clear localStorage and test fresh login**

1. Open DevTools → Application → Local Storage → delete `currentBranch`
2. Log out and log back in
3. Select an organization from the dropdown
4. Expected: Branch auto-selects within ~1s, floor plan loads tables

**Step 2: Test organization switching**

1. With a branch selected, switch to a different organization
2. Expected: Branch dropdown updates to first branch of new org, floor plan re-renders

**Step 3: Test page refresh**

1. With branch selected, hard refresh (Cmd+Shift+R)
2. Expected: Branch persists from localStorage, floor plan loads immediately
3. Also test: Delete the branch from DB, refresh — hook should auto-select next available branch

**Step 4: Commit (if any fixes needed)**

```bash
git commit -m "fix: address edge cases found during manual verification"
```

---

## Summary of Changes

| File                                                          | Action | Purpose                                               |
| ------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| `apps/app/lib/hooks/use-branch-auto-select.ts`                | Create | Centralized hook handling all 3 auto-select scenarios |
| `apps/app/lib/hooks/__tests__/use-branch-auto-select.test.ts` | Create | Basic test for hook                                   |
| `apps/app/components/layout/index.tsx`                        | Modify | Call hook at layout level                             |
| `apps/app/components/layout/header.tsx`                       | Modify | Remove duplicate auto-select useEffect                |

**Why this fixes all three scenarios:**

- **Fresh login:** Hook runs in Layout (mounted after auth guard passes), waits for branches query, sets first branch
- **Org switch:** `OrganizationSwitcher.onSuccess` clears branch to null + invalidates branch query → hook detects null branch → re-selects
- **Page refresh:** `atomWithStorage` with `getOnInit: true` hydrates from localStorage immediately → hook validates stored branch still exists in fetched branches
