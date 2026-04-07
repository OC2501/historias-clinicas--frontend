import { useState } from 'react';
import type { PaginationParams } from '@/types';

interface UsePaginationReturn extends PaginationParams {
    page: number;
    limit: number;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    resetPage: () => void;
}

export function usePagination(
    initialPage = 1,
    initialLimit = 10
): UsePaginationReturn {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);

    const nextPage = () => setPage((prev) => prev + 1);
    const prevPage = () => setPage((prev) => Math.max(1, prev - 1));
    const resetPage = () => setPage(1);

    return {
        page,
        limit,
        setPage,
        setLimit,
        nextPage,
        prevPage,
        resetPage,
    };
}
