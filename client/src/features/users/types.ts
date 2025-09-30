export type User = {
    id: string;
    name: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    timezone?: number | string;
    timezoneOffset?: string;
    createdAt?: number | string;
    updatedAt?: number | string;
};

export type CreateUserRequest = {
    name: string;
    zipCode: string;
};

export type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
};

export type PaginatedUsersResponse = {
    success: boolean;
    data: User[];
    pagination: PaginationInfo;
};

export type UsersResponse = {
    success: boolean;
    count: number;
    data: User[];
};
