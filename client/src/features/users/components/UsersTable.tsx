import React, { useState } from 'react';
import type { User } from '../types';
import { Button } from '@/components/Button';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { EditableCell } from '@/components/EditableCell';

type Props = {
    users: User[];
    onDelete: (id: string) => void;
    onBulkDelete: (ids: string[]) => void;
    onUpdate: (id: string, updates: Partial<{ name: string; zipCode: string }>) => Promise<void>;
    isUpdating?: boolean;
};

export function UsersTable({ users, onDelete, onBulkDelete, onUpdate, isUpdating }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingField(null);
    };

    const handleEdit = (userId: string) => {
        setEditingId(userId);
        setEditingField(null); // Start in selection mode
    };

    const handleFieldClick = (userId: string, fieldName: string) => {
        if (editingId === userId) {
            // If already editing this user, switch to the new field
            setEditingField(fieldName);
        } else if (editingId === null) {
            // If not editing anyone, start editing this user and field
            setEditingId(userId);
            setEditingField(fieldName);
        }
        // If editing a different user, do nothing (user must cancel first)
    };

    const handleFieldUpdate = async (id: string, field: string, value: string) => {
        const updates: Partial<{ name: string; zipCode: string }> = {};
        if (field === 'name') updates.name = value;
        if (field === 'zipCode') updates.zipCode = value;

        await onUpdate(id, updates);
        setEditingId(null);
        setEditingField(null);
    };

    const handleFieldCancel = () => {
        setEditingField(null);
        // Keep editingId so user can click other fields
    };

    // Remove the validation functions since API handles this now
    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            searchable: true,
            cell: (value, user) => {
                if (editingId === user.id && editingField === 'name') {
                    return (
                        <EditableCell
                            value={String(value)}
                            onSave={(newValue) => handleFieldUpdate(user.id, 'name', newValue)}
                            onCancel={handleFieldCancel}
                            onFieldSwitch={handleFieldCancel}
                            placeholder="John Doe"
                            className="min-w-32"
                        />
                    );
                }
                return (
                    <button
                        className="editable-field-button text-left hover:bg-zinc-100 rounded px-1 py-1 -mx-1 -my-1 w-full"
                        onClick={() => handleFieldClick(user.id, 'name')}
                        disabled={editingId !== null && editingId !== user.id}
                    >
                        {String(value)}
                    </button>
                );
            },
        },
        {
            accessorKey: 'zipCode',
            header: 'Zip Code',
            searchable: true,
            cell: (value, user) => {
                if (editingId === user.id && editingField === 'zipCode') {
                    return (
                        <EditableCell
                            value={String(value)}
                            onSave={(newValue) => handleFieldUpdate(user.id, 'zipCode', newValue)}
                            onCancel={handleFieldCancel}
                            onFieldSwitch={handleFieldCancel}
                            placeholder="10001"
                            className="min-w-24"
                        />
                    );
                }
                return (
                    <button
                        className="editable-field-button text-left hover:bg-zinc-100 rounded px-1 py-1 -mx-1 -my-1 w-full"
                        onClick={() => handleFieldClick(user.id, 'zipCode')}
                        disabled={editingId !== null && editingId !== user.id}
                        title={editingId === user.id ? "Click to edit zip code (will refresh location data)" : ""}
                    >
                        {String(value)}
                    </button>
                );
            },
        },
        {
            accessorKey: 'latitude',
            header: 'Latitude',
            cell: (value) => value ? Number(value).toFixed(4) : '-',
            searchable: false,
        },
        {
            accessorKey: 'longitude',
            header: 'Longitude',
            cell: (value) => value ? Number(value).toFixed(4) : '-',
            searchable: false,
        },
        {
            accessorKey: 'timezoneOffset',
            header: 'Timezone',
            searchable: true,
        },
        {
            accessorKey: 'id',
            header: 'Actions',
            searchable: false,
            cell: (_, user) => {
                if (editingId === user.id) {
                    return (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>
                        </div>
                    );
                }

                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user.id)}
                            disabled={editingId !== null}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(user.id)}
                            disabled={editingId !== null}
                        >
                            Delete
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            {editingId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        <strong>Edit Mode:</strong> Click on Name or Zip Code fields to edit them directly.
                        Press Enter to save, Escape to cancel current field.
                        {editingField === null && " Click Cancel to exit edit mode completely."}
                    </p>
                </div>
            )}

            <DataTable
                data={users}
                columns={columns}
                emptyMessage="No users yet. Create one above!"
                enableSearch={true}
                enableSelection={true}
                onSelectionChange={() => { }} // handled by DataTable internally
                onBulkDelete={onBulkDelete}
            />
        </div>
    );
}
