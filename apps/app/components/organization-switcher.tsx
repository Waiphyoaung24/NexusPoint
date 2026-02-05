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

  const { data: organizations, isLoading } = useQuery(
    api.organization.list.queryOptions(),
  );

  const setActiveMutation = useMutation(
    api.organization.setActive.mutationOptions({
      onSuccess: () => {
        setCurrentBranch(null);
        invalidateSession(queryClient);
      },
    }),
  );

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
