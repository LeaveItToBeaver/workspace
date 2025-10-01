import React from "react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useDeleteUsers,
} from "@/features/users/hooks";
import { CreateUserForm } from "@/features/users/components/CreateUserForm";
import { UsersTable } from "@/features/users/components/UsersTable";
import { Card } from "@/components/Card";

export function UsersPage() {
  const { data, isLoading, refetch } = useUsers();
  const createUser = useCreateUser({ onSuccess: () => refetch() });
  const updateUser = useUpdateUser({ onSuccess: () => refetch() });
  const deleteUser = useDeleteUser({ onSuccess: () => refetch() });
  const deleteUsers = useDeleteUsers({ onSuccess: () => refetch() });

  const handleUpdate = async (
    id: string,
    updates: Partial<{ name: string; zipCode: string }>
  ) => {
    return new Promise<void>((resolve, reject) => {
      updateUser.mutate(
        { id, updates },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        }
      );
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">
          User Management
        </h1>

        <Card title="Create User" className="mb-8">
          <CreateUserForm
            onCreate={(payload) => createUser.mutate(payload)}
            isSubmitting={createUser.isPending}
            error={createUser.error}
          />
        </Card>

        <Card title="Users" className="">
          {isLoading ? (
            <p className="text-sm text-zinc-600">Loading...</p>
          ) : (
            <UsersTable
              users={data?.data ?? []}
              onDelete={(id: string) => deleteUser.mutate(id)}
              onBulkDelete={(ids: string[]) => {
                deleteUsers.mutate(ids, {
                  onSuccess: (data) => {
                    if (data.failed > 0) {
                      alert(
                        `Warning: ${data.failed} of ${data.total} deletions failed`
                      );
                    }
                  },
                });
              }}
              onUpdate={handleUpdate}
              isUpdating={updateUser.isPending}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
