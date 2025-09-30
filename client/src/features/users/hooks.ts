import { useQuery, useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { CreateUserRequest, User } from './types';

const client = axios.create({ baseURL: '' }); // vite proxy handles /api

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await client.get<{ success: boolean; count: number; data: User[] }>('/api/users');
            return res.data;
        },
    });
}

export function useCreateUser(options?: UseMutationOptions<any, unknown, CreateUserRequest>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateUserRequest) => {
            const res = await client.post('/api/users', payload);
            return res.data;
        },
        onMutate: async (newUser) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['users'] });

            // Snapshot the previous value
            const previousUsers = queryClient.getQueryData<{ data: User[] }>(['users']);

            // Optimistically update to the new value
            if (previousUsers) {
                queryClient.setQueryData(['users'], {
                    ...previousUsers,
                    data: [
                        ...previousUsers.data,
                        {
                            id: `temp-${Date.now()}`, // temporary ID
                            name: newUser.name,
                            zipCode: newUser.zipCode,
                            latitude: undefined,
                            longitude: undefined,
                            timezone: undefined,
                            timezoneOffset: 'Loading...',
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        } as User
                    ],
                    count: previousUsers.data.length + 1,
                });
            }

            return { previousUsers };
        },
        onError: (err, newUser, context: any) => {
            // Rollback on error
            if (context?.previousUsers) {
                queryClient.setQueryData(['users'], context.previousUsers);
            }
        },
        onSettled: () => {
            // Always refetch after error or success to sync with server
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        ...options,
    });
}

export function useUpdateUser(options?: UseMutationOptions<any, unknown, { id: string; updates: Partial<CreateUserRequest> }>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const res = await client.put(`/api/users/${id}`, updates);
            return res.data;
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['users'] });

            const previousUsers = queryClient.getQueryData<{ data: User[] }>(['users']);

            if (previousUsers) {
                queryClient.setQueryData(['users'], {
                    ...previousUsers,
                    data: previousUsers.data.map(user =>
                        user.id === id
                            ? {
                                ...user,
                                ...updates,
                                // If zip code changed, show loading state for location data
                                ...(updates.zipCode && updates.zipCode !== user.zipCode ? {
                                    latitude: undefined,
                                    longitude: undefined,
                                    timezoneOffset: 'Loading...'
                                } : {}),
                                updatedAt: Date.now()
                            }
                            : user
                    ),
                });
            }

            return { previousUsers };
        },
        onError: (err, variables, context: any) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(['users'], context.previousUsers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        ...options,
    });
}

export function useDeleteUser(options?: UseMutationOptions<any, unknown, string>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await client.delete(`/api/users/${id}`);
            return res.data;
        },
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: ['users'] });

            const previousUsers = queryClient.getQueryData<{ data: User[] }>(['users']);

            if (previousUsers) {
                queryClient.setQueryData(['users'], {
                    ...previousUsers,
                    data: previousUsers.data.filter(user => user.id !== deletedId),
                    count: previousUsers.data.length - 1,
                });
            }

            return { previousUsers };
        },
        onError: (err, deletedId, context: any) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(['users'], context.previousUsers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        ...options,
    });
}

export function useDeleteUsers(options?: UseMutationOptions<any, unknown, string[]>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            // Delete users in parallel
            const results = await Promise.allSettled(
                ids.map(id => client.delete(`/api/users/${id}`))
            );
            return results;
        },
        onMutate: async (deletedIds) => {
            await queryClient.cancelQueries({ queryKey: ['users'] });

            const previousUsers = queryClient.getQueryData<{ data: User[] }>(['users']);

            if (previousUsers) {
                queryClient.setQueryData(['users'], {
                    ...previousUsers,
                    data: previousUsers.data.filter(user => !deletedIds.includes(user.id)),
                    count: previousUsers.data.length - deletedIds.length,
                });
            }

            return { previousUsers };
        },
        onError: (err, deletedIds, context: any) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(['users'], context.previousUsers);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        ...options,
    });
}
