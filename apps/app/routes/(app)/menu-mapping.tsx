import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import { api } from "../../lib/trpc";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/(app)/menu-mapping")({
  component: MenuMapping,
});

function MenuMapping() {
  const queryClient = useQueryClient();
  const { data: items, isLoading: isLoadingItems } = useQuery(
    api.menu.listItems.queryOptions({}),
  );
  const { data: mappings, isLoading: isLoadingMappings } = useQuery(
    api.menu.listMappings.queryOptions({}),
  );

  const upsertMutation = useMutation(
    api.menu.upsertMapping.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(api.menu.listMappings.queryOptions({}));
      },
    }),
  );

  const getMapping = (
    itemId: string,
    platform: "grab" | "wongnai" | "lineman",
  ) => {
    return (
      mappings?.find((m) => m.menuItemId === itemId && m.platform === platform)
        ?.externalId || ""
    );
  };

  const handleUpdate = (
    itemId: string,
    platform: "grab" | "wongnai" | "lineman",
    value: string,
  ) => {
    if (!value) return;
    upsertMutation.mutate({
      menuItemId: itemId,
      platform,
      externalId: value,
    });
  };

  if (isLoadingItems || isLoadingMappings) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Mapping</h1>
        <p className="text-muted-foreground">
          Map your internal menu items to external platform IDs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Mappings</CardTitle>
          <CardDescription>
            Enter the external ID for each platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grab ID</TableHead>
                <TableHead>Wongnai ID</TableHead>
                <TableHead>Lineman ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.sku}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.nameTh}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MappingInput
                      itemId={item.id}
                      platform="grab"
                      initialValue={getMapping(item.id, "grab")}
                      onSave={handleUpdate}
                    />
                  </TableCell>
                  <TableCell>
                    <MappingInput
                      itemId={item.id}
                      platform="wongnai"
                      initialValue={getMapping(item.id, "wongnai")}
                      onSave={handleUpdate}
                    />
                  </TableCell>
                  <TableCell>
                    <MappingInput
                      itemId={item.id}
                      platform="lineman"
                      initialValue={getMapping(item.id, "lineman")}
                      onSave={handleUpdate}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MappingInput({
  itemId,
  platform,
  initialValue,
  onSave,
}: {
  itemId: string;
  platform: "grab" | "wongnai" | "lineman";
  initialValue: string;
  onSave: (
    itemId: string,
    platform: "grab" | "wongnai" | "lineman",
    value: string,
  ) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const prevInitialValueRef = useRef(initialValue);

  // Update value when initialValue changes from server
  if (prevInitialValueRef.current !== initialValue) {
    prevInitialValueRef.current = initialValue;
    setValue(initialValue);
  }

  return (
    <Input
      className="h-8 w-32"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) {
          onSave(itemId, platform, value);
        }
      }}
      placeholder={`${platform} ID`}
    />
  );
}
