import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, className, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-2">
                {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                        className,
                    )}
                    {...props}
                />
            </div>
        );
    }
);

Input.displayName = 'Input';
