import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Button,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Switch,
  Textarea,
} from "@repo/ui";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  PackageOpen,
  Loader2,
} from "lucide-react";
import { api } from "../../lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/(app)/menu")({
  component: Menu,
});

function Menu() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // API hooks
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery(
    api.menu.listItems.queryOptions({}),
  );

  type MenuItemResponse = NonNullable<typeof items>[number];
  const [editingItem, setEditingItem] = useState<MenuItemResponse | null>(null);

  const createMutation = useMutation(
    api.menu.createItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(api.menu.listItems.queryOptions({}));
        setIsDialogOpen(false);
        resetForm();
      },
    }),
  );

  const updateMutation = useMutation(
    api.menu.updateItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(api.menu.listItems.queryOptions({}));
        setIsDialogOpen(false);
        resetForm();
      },
    }),
  );

  const deleteMutation = useMutation(
    api.menu.deleteItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(api.menu.listItems.queryOptions({}));
      },
    }),
  );

  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    nameTh: "",
    description: "",
    price: "",
    category: "",
    isAvailable: true,
  });

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      nameTh: "",
      description: "",
      price: "",
      category: "",
      isAvailable: true,
    });
    setEditingItem(null);
  };

  const handleEdit = (item: NonNullable<typeof items>[number]) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      nameTh: item.nameTh || "",
      description: item.description || "",
      price: item.price,
      category: item.category || "",
      isAvailable: item.isAvailable,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        ...formData,
        sortOrder: editingItem.sortOrder,
      });
    } else {
      createMutation.mutate({
        ...formData,
        sortOrder: 0,
      });
    }
  };

  const filteredItems =
    items?.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Manage your master menu items</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add Menu Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update item details."
                  : "Create a new item for your menu."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="e.g. F001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name (English)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Pad Thai"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameTh">Name (Thai)</Label>
                <Input
                  id="nameTh"
                  value={formData.nameTh}
                  onChange={(e) =>
                    setFormData({ ...formData, nameTh: e.target.value })
                  }
                  placeholder="e.g. ผัดไทย"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g. Main Course"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Item description..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isAvailable: checked })
                  }
                />
                <Label htmlFor="isAvailable">Available</Label>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingItem ? "Update Item" : "Create Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menu Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>
                A list of all items in your master menu
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No items found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by adding your first menu item"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-mono text-sm">
                      {item.sku}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium leading-none">{item.name}</p>
                        {item.nameTh && (
                          <p className="text-sm text-muted-foreground">
                            {item.nameTh}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          item.isAvailable
                            ? "bg-green-50 text-green-700 ring-green-600/20"
                            : "bg-red-50 text-red-700 ring-red-600/20"
                        }`}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
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
