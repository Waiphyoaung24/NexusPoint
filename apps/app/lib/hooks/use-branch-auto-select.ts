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

    const needsAutoSelect =
      !currentBranch ||
      currentBranch.organizationId !== activeOrgId ||
      !branches.some((b) => b.id === currentBranch.id);

    if (needsAutoSelect) {
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
