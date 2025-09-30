import React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.PropsWithChildren<{ title?: string; className?: string }>;

export function Card({ title, children, className }: CardProps) {
    return (
        <div className={cn('rounded-lg border border-zinc-200 bg-white text-zinc-900 shadow-sm p-6', className)}>
            {title && <h3 className="text-lg font-semibold mb-4 text-zinc-900">{title}</h3>}
            {children}
        </div>
    );
}
