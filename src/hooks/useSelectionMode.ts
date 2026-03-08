import { useState, useCallback } from 'react';

export function useSelectionMode<T extends { id: string }>() {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback((items: T[]) => {
        const ids = items.map(i => i.id);
        setSelectedIds(new Set(ids));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setSelectionMode(false);
    }, []);

    const startSelection = useCallback((initialId?: string) => {
        setSelectionMode(true);
        if (initialId) {
            setSelectedIds(new Set([initialId]));
        }
    }, []);

    return {
        selectionMode,
        selectedIds,
        toggleSelection,
        selectAll,
        clearSelection,
        startSelection,
        setSelectionMode, // lower level access if needed
    };
}
