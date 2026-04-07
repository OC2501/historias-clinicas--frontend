import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Column } from '@/types/table';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    className?: string;
}

export function DataTable<T extends { id: string | number }>({
    columns,
    data,
    isLoading,
    onRowClick,
    className
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className={cn("rounded-md border bg-card", className)}>
                {/* Desktop Skeleton */}
                <div className="hidden sm:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col, i) => (
                                    <TableHead key={i}>{col.header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {/* Mobile Skeleton */}
                <div className="sm:hidden p-4 space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="rounded-xl border p-4 space-y-3">
                            {Array(3).fill(0).map((_, j) => (
                                <div key={j} className="flex justify-between gap-4">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("relative w-full", className)}>
            {/* Desktop View */}
            <div className="hidden sm:block rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableHead key={i} className={col.className}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className={cn(
                                        onRowClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
                                    )}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((col, j) => (
                                        <TableCell key={j} className={col.className}>
                                            {typeof col.accessorKey === 'function'
                                                ? col.accessorKey(item)
                                                : (item[col.accessorKey as keyof T] as React.ReactNode)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View - Vertical Cards */}
            <div className="sm:hidden space-y-4">
                {data.length > 0 ? (
                    data.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onRowClick?.(item)}
                            className={cn(
                                "group rounded-xl border bg-card p-4 shadow-sm active:scale-[0.98] transition-all",
                                onRowClick ? "cursor-pointer hover:border-primary/50" : ""
                            )}
                        >
                            <div className="space-y-3">
                                {columns.map((col, i) => {
                                    // Don't show "Acciones" in the main vertical list if it's the last one
                                    // or handle it specially. For now, show all.
                                    const value = typeof col.accessorKey === 'function'
                                        ? col.accessorKey(item)
                                        : (item[col.accessorKey as keyof T] as React.ReactNode);

                                    return (
                                        <div key={i} className="flex justify-between items-start gap-4">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-1">
                                                {col.header}
                                            </span>
                                            <div className="text-sm font-medium text-right">
                                                {value}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-muted/20">
                        No se encontraron resultados.
                    </div>
                )}
            </div>
        </div>
    );
}
