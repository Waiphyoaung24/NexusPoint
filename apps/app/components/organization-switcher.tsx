import { useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { api } from "@/lib/trpc";
import { useSessionQuery, invalidateSession } from "@/lib/queries/session";
import { currentBranchAtom } from "@/lib/store";

export function OrganizationSwitcher() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery();
  const setCurrentBranch = useSetAtom(currentBranchAtom);
  const activeOrgId = session?.session?.activeOrganizationId;
  const autoSelectDoneRef = useRef(false);

  const { data: organizations, isLoading } = useQuery(
    api.organization.list.queryOptions(),
  );

  const setActiveMutation = useMutation(
    api.organization.setActive.mutationOptions({
      onSuccess: () => {
        // Clear branch selection from previous organization
        setCurrentBranch(null);

        // Invalidate session to fetch new activeOrganizationId
        invalidateSession(queryClient);

        // Invalidate branch cache to clear old organization's branches
        queryClient.invalidateQueries({
          queryKey: [["branch", "list"]],
        });
      },
    }),
  );

  // Auto-select first organization when none is active
  useEffect(() => {
    if (autoSelectDoneRef.current) return;
    if (!activeOrgId && organizations?.length && !setActiveMutation.isPending) {
      autoSelectDoneRef.current = true;
      setActiveMutation.mutate({ organizationId: organizations[0].id });
    }
  }, [activeOrgId, organizations, setActiveMutation.isPending]);

  const handleOrgChange = (orgId: string) => {
    setActiveMutation.mutate({ organizationId: orgId });
  };

  return (
    <Select
      value={activeOrgId ?? ""}
      onValueChange={handleOrgChange}
      disabled={isLoading || !organizations?.length}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={t("header.selectOrganization")} />
      </SelectTrigger>
      <SelectContent>
        {organizations?.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
