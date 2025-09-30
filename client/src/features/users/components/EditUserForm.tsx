import React, { useState } from 'react';
import type { User, CreateUserRequest } from '../types';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

type Props = {
    user: User;
    onUpdate: (id: string, updates: Partial<CreateUserRequest>) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
};

export function EditUserForm({ user, onUpdate, onCancel, isSubmitting }: Props) {
    const [name, setName] = useState(user.name);
    const [zipCode, setZipCode] = useState(user.zipCode);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const updates: Partial<CreateUserRequest> = {};
        if (name !== user.name) updates.name = name;
        if (zipCode !== user.zipCode) updates.zipCode = zipCode;

        // Only submit if there are actual changes
        if (Object.keys(updates).length > 0) {
            onUpdate(user.id, updates);
        } else {
            onCancel();
        }
    };

    const hasChanges = name !== user.name || zipCode !== user.zipCode;

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="John Doe"
                required
            />
            <Input
                label="Zip Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.currentTarget.value)}
                placeholder="10001"
                required
                title={zipCode !== user.zipCode ? "Changing zip code will refresh location data" : ""}
            />
            <div className="flex gap-2">
                <Button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    size="sm"
                >
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    size="sm"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
