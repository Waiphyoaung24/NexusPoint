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

  // Only fetch branches if an organization is active
  const activeOrgId = session?.session?.activeOrganizationId;

  // Fetch branches from API
  const { data: branches, isLoading } = useQuery(
    api.branch.list.queryOptions(undefined, {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      enabled: !!activeOrgId,
    }),
  );

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
