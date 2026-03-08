// src/hooks/useExpenses.ts
import { useCallback, useMemo, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import type { TransactionDetail, Category } from '../db/models';
import { useAppData } from '../context/AppDataProvider';

import { FilterState } from '../components/FilterModal';
export type { FilterState };

export default function useExpenses() {
  const {
    categories,
    categoriesMap: globalCatMap,
    payeesMap: globalPayeeMap,
    refreshData: refreshLookups,
    getCategoryLabel
  } = useAppData();

  // State
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterState>({ dataset: 'all' });
  const [query, setQuery] = useState('');

  const mounted = useRef(true);

  // Alias for compatibility, though consuming components should rely on context implicitly if possible.
  // But calling this ensures fresh data if needed.
  const loadLookups = useCallback(async () => {
    await refreshLookups();
  }, [refreshLookups]);

  const load = useCallback(async () => {
    try {
      const rows = await TransactionRepo.findWithFiltersDetails({
        ...filter,
        query // Pass text query to SQL
      });
      if (mounted.current) setTransactions(rows);
    } catch (err) {
      console.error('useExpenses: failed to load transactions', err);
    }
  }, [filter, query]); // Reload when filters change

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      load();
      // We don't necessarily force refresh lookups every time, 
      // but if we want to ensure sync after returning from Add/Edit screens:
      // refreshLookups(); 
      // The context loads once. If AddExpense updates context, we are good.
      // Current AddExpense uses useAddExpense which might not update context.
      // We'll address that later. For now, let's allow manual refresh via pull-to-refresh.

      return () => {
        mounted.current = false;
      };
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLookups();
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshLookups]);

  const resolveCategoryHeading = useCallback(
    (categoryId?: string | null) => {
      return getCategoryLabel(categoryId);
    },
    [getCategoryLabel]
  );

  const resolveCategory = useCallback(
    (categoryId?: string | null) => {
      if (!categoryId) return null;
      return categories.find(c => c.id === categoryId) ?? null;
    },
    [categories]
  );

  // FilteredTransactions is now just 'transactions' because we filter in DB.
  // However, we might keep it as alias to avoid breaking UI that expects 'filteredTransactions'
  const filteredTransactions = transactions;

  return {
    // state
    transactions,
    filteredTransactions,
    categoriesMap: globalCatMap, // Exposing id->label map (Note: previously was id->Object, checking usage...)
    // CAUTION: Previous categoriesMap was Record<string, Category>. globalCatMap is Record<string, string>.
    // I need to check usage in ExpenseList.tsx.
    // If ExpenseList uses categoriesMap to look up objects, I need to compute id->Object map.
    // Let's verify usage in ExpenseList.tsx.

    payeesMap: globalPayeeMap,
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
  };
}
