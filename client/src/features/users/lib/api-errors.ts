// API error handling utilities for user features

export type ApiError = {
    success: false;
    error: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
};

export function extractErrorMessage(error: unknown): string {
    if (!error) return 'An unknown error occurred';

    // Handle axios error format
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data) {
            const data = axiosError.response.data as ApiError;

            // If there are field-specific validation errors, format them nicely
            if (data.details && Array.isArray(data.details)) {
                return data.details.map(d => d.message).join(', ');
            }

            // Otherwise use the general message
            return data.message || data.error || 'Request failed';
        }
    }

    // Handle Error objects
    if (error instanceof Error) {
        return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
}

export function isNetworkError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const axiosError = error as any;
        return axiosError.code === 'NETWORK_ERROR' || axiosError.code === 'ECONNREFUSED';
    }
    return false;
}
