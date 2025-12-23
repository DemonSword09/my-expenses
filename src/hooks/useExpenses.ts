// src/hooks/useExpenses.ts
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { all } from '../db/sqlite';
import type { Transaction, Category, TransactionDetail } from '../db/models';
import { useRef } from 'react';

export type FilterMode = 'all' | 'week' | 'month';

export default function useExpenses() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});
  const [payeesMap, setPayeesMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const mounted = useRef(true);
  // load lookups
  const loadLookups = useCallback(async () => {
    try {
      const cats = await CategoryRepo.listAll();
      const cmap: Record<string, Category> = {};
      for (const c of cats) cmap[c.id] = c;
      if (mounted.current) setCategoriesMap(cmap);
    } catch (err) {
      console.error('useExpenses: failed loading categories', err);
      if (mounted.current) setCategoriesMap({});
    }

    try {
      const rows = await all<{ id: string; name: string }>('SELECT id, name FROM payees');
      const pmap: Record<string, string> = {};
      (rows || []).forEach((r) => {
        if (r && r.id) pmap[r.id] = r.name;
      });
      if (mounted.current) setPayeesMap(pmap);
    } catch (err) {
      console.error('useExpenses: failed loading payees', err);
      if (mounted.current) setPayeesMap({});
    }
  }, []);

  const load = useCallback(async () => {
    try {
      // Optimized: use JOINs instead of client-side lookups for list
      const rows = await TransactionRepo.listWithDetails();
      if (mounted.current) setTransactions(rows);
    } catch (err) {
      console.error('useExpenses: failed to load transactions', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      (async () => {
        await loadLookups();
        await load();
      })();

      return () => {
        mounted.current = false;
      };
    }, [load, loadLookups]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadLookups();
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load, loadLookups]);

  const resolveCategoryHeading = useCallback(
    (categoryId?: string | null) => {
      // Keep this for external consumers or fallback
      if (!categoryId) return 'Uncategorized';
      const cat = categoriesMap[categoryId];
      if (!cat) return 'Category';
      const parentId = (cat as any).parentId as string | undefined;
      const label = (cat as any).label ?? (cat as any).name ?? 'Category';
      if (parentId) {
        const parent = categoriesMap[parentId];
        if (parent) {
          const parentLabel = (parent as any).label ?? (parent as any).name ?? 'Category';
          return `${parentLabel} > ${label}`;
        }
        return label;
      }
      return label;
    },
    [categoriesMap],
  );

  const resolveCategory = useCallback(
    (categoryId?: string | null) => {
      if (!categoryId) return null;
      return categoriesMap[categoryId] ?? null;
    },
    [categoriesMap],
  );

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return transactions.filter((t) => {
      // time filters (client-side)
      if (filter === 'week' && !(t.createdAt >= now - 1000 * 60 * 60 * 24 * 7)) return false;
      if (filter === 'month' && !(t.createdAt >= now - 1000 * 60 * 60 * 24 * 30)) return false;

      if (!q) return true;

      // Search using pre-joined fields first, fallback to maps
      const payee = (t.payee_name ?? payeesMap[t.payeeId ?? ''] ?? '').toLowerCase();
      
      let cat = '';
      if (t.category_label) {
         cat = t.category_parent_label 
            ? `${t.category_parent_label} > ${t.category_label}` 
            : t.category_label;
      } else {
         cat = resolveCategoryHeading(t.categoryId); // fallback
      }
      cat = cat.toLowerCase();

      const comment = (t.comment ?? '').toLowerCase();
      return payee.includes(q) || cat.includes(q) || comment.includes(q);
    });
  }, [transactions, filter, query, payeesMap, resolveCategoryHeading]);

  return {
    // state
    transactions,
    filteredTransactions,
    categoriesMap,
    payeesMap,
    refreshing,
    query,
    setQuery,
    filter,
    setFilter,

    // actions
    load,
    refresh,
    loadLookups,
    resolveCategoryHeading,
    resolveCategory,
  } as const;
}
