"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Edit2,
  Tag,
  Loader2,
  Trash,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loader from "@/components/custom/Loader";
import { toast } from "sonner";
import { isAxiosError } from "axios";

interface Category {
  id: string;
  name: string;
  type: "GENERAL" | "SPECIFIC";
  parentId: string | null;
  status: "ACTIVE" | "PENDING" | "REJECTED";
  parent?: {
    id: string;
    name: string;
    type: "GENERAL" | "SPECIFIC";
  } | null;
}

export default function CategoryManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingCategories, setPendingCategories] = useState<Category[]>([]);
  const [rejectedCategories, setRejectedCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [editedName, setEditedName] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] =
    useState<Category | null>(null);
  const [generalCategories, setGeneralCategories] = useState<Category[]>([]);
  const [loadingGeneralCategories, setLoadingGeneralCategories] =
    useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        toast.info("You do not have permission to view this page.");
        router.push("/dashboard");
      } else {
        // Fetch both pending and rejected categories when page loads
        fetchCategories();
      }
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchPendingCategories(), fetchRejectedCategories()]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCategories = async () => {
    try {
      const response = await axiosInstance.get("/talent_categories", {
        params: { status: "PENDING" },
      });

      setPendingCategories(response.data);
    } catch (error) {
      // Handle database connection errors
      if (
        isAxiosError(error) &&
        (error.response?.status === 500 ||
          error.message.includes("network error"))
      ) {
        console.error("Database connection error:", error);
        setPendingCategories([]); // Set empty array to avoid breaking the UI

        // Show a more user-friendly error
        toast.error(
          "Could not connect to the database. The server might be temporarily unavailable.",
          {
            duration: 5000,
            action: {
              label: "Retry",
              onClick: () => fetchPendingCategories(),
            },
          }
        );
      } else {
        const errorMessage = isAxiosError(error)
          ? error.response?.data?.message?.message
          : error;
        console.error("Error fetching pending categories:", errorMessage);
        toast.error(
          typeof errorMessage === "string"
            ? errorMessage
            : "Failed to fetch pending categories."
        );
      }
    }
  };

  const fetchRejectedCategories = async () => {
    try {
      const response = await axiosInstance.get("/talent_categories", {
        params: { status: "REJECTED" },
      });

      setRejectedCategories(response.data || []);
    } catch (error) {
      // Check specifically for 404 errors - these aren't really errors in this context,
      // it just means there are no rejected categories
      if (isAxiosError(error) && error.response?.status === 404) {
        // Just set an empty array and don't show an error
        setRejectedCategories([]);
      }
      // Handle database connection errors
      else if (
        isAxiosError(error) &&
        (error.response?.status === 500 ||
          error.message.includes("network error"))
      ) {
        console.error("Database connection error:", error);
        setRejectedCategories([]); // Set empty array to avoid breaking the UI

        // Show a more user-friendly error
        toast.error(
          "Could not connect to the database. The server might be temporarily unavailable.",
          {
            duration: 5000,
            action: {
              label: "Retry",
              onClick: () => fetchRejectedCategories(),
            },
          }
        );
      } else {
        const errorMessage = isAxiosError(error)
          ? error.response?.data?.message
          : error;
        console.error("Error fetching rejected categories:", errorMessage);
        toast.error(
          typeof errorMessage === "string"
            ? errorMessage
            : "Failed to fetch rejected categories."
        );
      }
    }
  };

  const fetchGeneralCategories = async () => {
    try {
      setLoadingGeneralCategories(true);
      const response = await axiosInstance.get("/talent_categories", {
        params: {
          type: "GENERAL",
          status: "ACTIVE",
        },
      });
      setGeneralCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching general categories:", error);
    } finally {
      setLoadingGeneralCategories(false);
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setEditedName(category.name);

    // For parent categorization, we need to convert the parent object to a full Category
    // The parent object in our interface only has {id, name, type} but we need a full Category
    if (category.parent) {
      // Create a valid Category object from the parent
      const parentCategory: Category = {
        id: category.parent.id,
        name: category.parent.name,
        type: category.parent.type,
        parentId: null, // General categories don't have parents
        status: "ACTIVE", // We know it's active since it's being used as a parent
      };
      setSelectedParentCategory(parentCategory);
    } else {
      setSelectedParentCategory(null);
    }

    // If this is a specific category, fetch general categories for the dropdown
    if (category.type === "SPECIFIC") {
      fetchGeneralCategories();
    }

    setEditModalOpen(true);
  };

  const openDeleteConfirmModal = (category: Category) => {
    setSelectedCategory(category);
    setConfirmDeleteModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCategory) return;

    try {
      setProcessing(selectedCategory.id);

      // Create a payload based on whether we have a new parent category
      let parentIdUpdate = {};
      if (selectedCategory.type === "SPECIFIC") {
        parentIdUpdate = {
          parentId: selectedParentCategory?.id || null,
        };
      }

      await axiosInstance.put(
        `/talent_categories/${selectedCategory.id}/approve`,
        {
          status: "ACTIVE",
          name: editedName,
          ...parentIdUpdate,
        }
      );

      // Remove from the current list based on active tab
      if (activeTab === "pending") {
        setPendingCategories((prev) =>
          prev.filter((cat) => cat.id !== selectedCategory.id)
        );
      } else if (activeTab === "rejected") {
        setRejectedCategories((prev) =>
          prev.filter((cat) => cat.id !== selectedCategory.id)
        );
      }

      setEditModalOpen(false);
      toast.success("Category approved successfully");
    } catch (error) {
      console.error("Error saving category edit:", error);
      toast.error("Failed to save category changes.");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveCategory = async (categoryId: string, name?: string) => {
    try {
      setProcessing(categoryId);

      await axiosInstance.put(`/talent_categories/${categoryId}/approve`, {
        status: "ACTIVE",
        ...(name ? { name } : {}),
      });

      // Remove from the current list based on active tab
      if (activeTab === "pending") {
        setPendingCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryId)
        );
      } else if (activeTab === "rejected") {
        setRejectedCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryId)
        );
      }

      toast.success("Category activated successfully");
    } catch (error) {
      console.error("Error approving category:", error);
      toast.error("Failed to activate category");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectCategory = async (categoryId: string) => {
    try {
      setProcessing(categoryId);
      await axiosInstance.put(`/talent_categories/${categoryId}/approve`, {
        status: "REJECTED",
      });

      // Remove from the pending list
      setPendingCategories((prev) =>
        prev.filter((cat) => cat.id !== categoryId)
      );

      // Fetch rejected categories to update the list
      await fetchRejectedCategories();

      toast.success("Category rejected successfully");
    } catch (error) {
      console.error("Error rejecting category:", error);
      toast.error("Failed to reject category");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      setProcessing(selectedCategory.id);
      await axiosInstance.delete(`/talent_categories/${selectedCategory.id}`);

      // Remove from the rejected list
      setRejectedCategories((prev) =>
        prev.filter((cat) => cat.id !== selectedCategory.id)
      );

      setConfirmDeleteModalOpen(false);
      toast.success("Category permanently deleted");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setProcessing(null);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Only show the main loader when authentication status is loading
  if (status === "loading") {
    return <Loader />;
  }

  if (!session || session.user?.role !== "ADMIN") {
    return <Loader />; // This will be redirected by the useEffect
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-3">Category Management</h1>
          <p className="text-muted-foreground">
            Manage category suggestions and rejected categories.
          </p>
        </div>
        <Button
          onClick={fetchCategories}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Categories</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : pendingCategories.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-lg">
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500 opacity-70" />
              </div>
              <p className="text-xl text-muted-foreground mb-2">
                No pending categories to review.
              </p>
              <p className="text-sm text-muted-foreground">
                All category suggestions have been processed.
              </p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pending Categories</CardTitle>
                <CardDescription>
                  {pendingCategories.length} categories awaiting review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Parent Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              category.type === "GENERAL"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {category.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {category.parent ? (
                            <span className="flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              {category.parent.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(category)}
                            disabled={!!processing}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApproveCategory(category.id)}
                            disabled={processing === category.id}
                          >
                            {processing === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRejectCategory(category.id)}
                            disabled={processing === category.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : rejectedCategories.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-lg">
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500 opacity-70" />
              </div>
              <p className="text-xl text-muted-foreground mb-2">
                No rejected categories to review.
              </p>
              <p className="text-sm text-muted-foreground">
                All rejected categories have been processed.
              </p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Rejected Categories</CardTitle>
                <CardDescription>
                  {rejectedCategories.length} rejected categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Parent Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{category.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {category.parent ? (
                            <span className="flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              {category.parent.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApproveCategory(category.id)}
                            disabled={processing === category.id}
                            title="Reinstate as active"
                          >
                            {processing === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(category)}
                            disabled={!!processing}
                            title="Edit before reinstating"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteConfirmModal(category)}
                            disabled={processing === category.id}
                            title="Permanently delete"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category before approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedCategory?.type === "GENERAL"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedCategory?.type}
                  </Badge>
                </div>
              </div>

              {selectedCategory?.type === "SPECIFIC" && (
                <div className="col-span-2 mt-2">
                  <Label htmlFor="parentCategory">Parent Category</Label>
                  <div className="mt-1">
                    {loadingGeneralCategories ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading general categories...
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        {generalCategories.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No general categories available
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              {selectedParentCategory ? (
                                <span>
                                  Current parent:{" "}
                                  <Badge className="ml-1">
                                    {selectedParentCategory.name}
                                  </Badge>
                                </span>
                              ) : (
                                <span>No parent category selected</span>
                              )}
                            </div>
                            <select
                              className="w-full p-2 border rounded-md"
                              value={selectedParentCategory?.id || ""}
                              onChange={(e) => {
                                const id = e.target.value;
                                if (id === "") {
                                  setSelectedParentCategory(null);
                                } else {
                                  const selected = generalCategories.find(
                                    (c) => c.id === id
                                  );
                                  if (selected)
                                    setSelectedParentCategory(selected);
                                }
                              }}
                            >
                              <option value="">
                                -- Select a parent category --
                              </option>
                              {generalCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={processing === selectedCategory?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={processing === selectedCategory?.id}
            >
              {processing === selectedCategory?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={confirmDeleteModalOpen}
        onOpenChange={setConfirmDeleteModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              category.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Warning</p>
              <p className="text-sm text-red-700">
                You are about to permanently delete the category:
                <span className="font-semibold block mt-1">
                  {selectedCategory?.name}
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteModalOpen(false)}
              disabled={processing === selectedCategory?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={processing === selectedCategory?.id}
            >
              {processing === selectedCategory?.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
