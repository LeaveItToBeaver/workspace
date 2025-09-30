
import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export type ColumnDef<T> = {
    accessorKey: keyof T;
    header: string;
    cell?: (value: any, row: T) => React.ReactNode;
    searchable?: boolean; // defaults to true
};

type DataTableProps<T> = {
    data: T[];
    columns: ColumnDef<T>[];
    className?: string;
    emptyMessage?: string;
    enableSearch?: boolean;
    enableSelection?: boolean;
    onSelectionChange?: (selectedIds: string[]) => void;
    onBulkDelete?: (selectedIds: string[]) => void;
    pageSizeOptions?: number[]; // optional page size options
    initialPageSize?: number;   // default 10
};

export function DataTable<T extends { id: string }>({
    data,
    columns,
    className,
    emptyMessage = 'No data available',
    enableSearch = true,
    enableSelection = false,
    onSelectionChange,
    onBulkDelete,
    pageSizeOptions = [10, 20, 50],
    initialPageSize = 10,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pageSize, setPageSize] = useState<number>(initialPageSize);
    const [currentPage, setCurrentPage] = useState<number>(1); // 1-indexed

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const q = searchTerm.toLowerCase();
        return data.filter((row) =>
            columns.some((column) => {
                // Only search columns that are searchable (default true)
                if (column.searchable === false) return false;
                const value = row[column.accessorKey];
                if (value == null) return false;
                return String(value).toLowerCase().includes(q);
            })
        );
    }, [data, searchTerm, columns]);

    // Reset to page 1 when filters/data change or page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, data, pageSize]);

    const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    const pageRows = filteredData.slice(startIndex, endIndex);

    const allPageIds = useMemo(() => pageRows.map((r) => r.id), [pageRows]);
    const allFilteredIds = useMemo(() => filteredData.map((r) => r.id), [filteredData]);

    const handleToggleSelectAllOnPage = () => {
        const allSelectedOnPage = allPageIds.every((id) => selectedIds.includes(id));
        let newSelected: string[];
        if (allSelectedOnPage) {
            newSelected = selectedIds.filter((id) => !allPageIds.includes(id));
        } else {
            const merged = new Set([...selectedIds, ...allPageIds]);
            newSelected = Array.from(merged);
        }
        setSelectedIds(newSelected);
        onSelectionChange?.(newSelected);
    };

    const handleSelectRow = (id: string) => {
        const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter((selectedId) => selectedId !== id)
            : [...selectedIds, id];
        setSelectedIds(newSelectedIds);
        onSelectionChange?.(newSelectedIds);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length > 0 && onBulkDelete) {
            onBulkDelete(selectedIds);
            setSelectedIds([]);
            onSelectionChange?.([]);
        }
    };

    if (!data.length) {
        return (
            <div className={cn('text-center py-8 text-sm text-zinc-600', className)}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Search and bulk actions */}
            <div className="flex items-center justify-between gap-4">
                {enableSearch ? (
                    <div className="flex-1 max-w-sm">
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                ) : <div />}

                <div className="flex items-center gap-2">
                    {enableSelection && onBulkDelete && (
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={selectedIds.length === 0}
                            onClick={handleBulkDelete}
                        >
                            Delete selected ({selectedIds.length})
                        </Button>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600">Rows per page</span>
                        <select
                            className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-md overflow-hidden">
                    <thead>
                        <tr className="bg-zinc-100 text-left text-zinc-700">
                            {enableSelection && (
                                <th className="p-3 align-middle w-10">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all on page"
                                        className="h-4 w-4"
                                        onChange={handleToggleSelectAllOnPage}
                                        checked={allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id))}
                                        ref={(el) => {
                                            if (!el) return;
                                            const someSelected = allPageIds.some((id) => selectedIds.includes(id));
                                            const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
                                            el.indeterminate = someSelected && !allSelected;
                                        }}
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th key={String(col.accessorKey)} className="p-3 text-sm font-medium">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length ? (
                            pageRows.map((row) => (
                                <tr key={row.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                                    {enableSelection && (
                                        <td className="p-3 align-middle">
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${row.id}`}
                                                className="h-4 w-4"
                                                checked={selectedIds.includes(row.id)}
                                                onChange={() => handleSelectRow(row.id)}
                                            />
                                        </td>
                                    )}
                                    {columns.map((col) => {
                                        const value = row[col.accessorKey];
                                        return (
                                            <td key={String(col.accessorKey)} className="p-3 text-sm text-zinc-900 align-middle">
                                                {col.cell ? col.cell(value, row) : String(value ?? '')}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={(enableSelection ? 1 : 0) + columns.length}
                                    className="p-6 text-center text-sm text-zinc-600"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer: results info + pagination controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="text-xs text-zinc-600">
                    {filteredData.length !== data.length && enableSearch ? (
                        <span>
                            Showing {filteredData.length} filtered of {data.length} total
                        </span>
                    ) : (
                        <span>Total: {data.length}</span>
                    )}
                    {filteredData.length > 0 && (
                        <span className="ml-2">• Rows {filteredData.length === 0 ? 0 : startIndex + 1}–{endIndex} of {filteredData.length}</span>
                    )}
                    {enableSelection && selectedIds.length > 0 && (
                        <span className="ml-2">• Selected {selectedIds.length} of {allFilteredIds.length}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">Page {currentPage} of {pageCount}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                        disabled={currentPage >= pageCount}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}