import type { ReactNode } from 'react';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((item: T) => ReactNode);
    className?: string; // Optional for desktop specific styling
}
