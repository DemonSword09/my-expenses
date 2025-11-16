// src/screens/ExpenseList.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import type { Transaction, Category } from '../db/models';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import useTheme from '../hooks/useTheme';
import ExpenseListItem from '../components/ExpenseListItem';
import ActionSheet from '@src/components/ActionSheet';
import ConfirmDeleteModal from '@src/components/ConfirmDeleteModal';
import useExpenses from '@src/hooks/useExpenses';

type FilterMode = 'all' | 'week' | 'month';

export default function ExpenseListScreen() {
  const { schemeColors, globalStyle, expenseListStyle } = useTheme();
  const navigation = useNavigation();
  // action modal state for item options (edit/delete/clone)
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const {
    load,
    filter,
    filteredTransactions,
    loadLookups,
    payeesMap,
    resolveCategory,
    query,
    refresh,
    refreshing,
    resolveCategoryHeading,
    setFilter,
    setQuery,
  } = useExpenses();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await loadLookups();
        await load();
      })();
    }, [load, loadLookups]),
  );

  const onRefresh = useCallback(async () => {
    refresh();
  }, [load, loadLookups]);

  // PREPARE transactions with resolved metadata once (performance)
  const preparedTransactions = useMemo(() => {
    return filteredTransactions.map((t) => {
      const category = resolveCategory(t.categoryId);
      const heading = resolveCategoryHeading(t.categoryId);
      const payeeName = t.payeeId ? (payeesMap[t.payeeId] ?? '') : '';
      // Attach lightweight metadata that ExpenseListItem expects
      return {
        ...t,
        __category: category,
        __heading: heading,
        __payeeName: payeeName,
      } as Transaction & {
        __category?: Category | null;
        __heading?: string;
        __payeeName?: string;
      };
    });
  }, [filteredTransactions, resolveCategory, resolveCategoryHeading, payeesMap]);

  const onOpenActions = (t: Transaction) => {
    setActiveTransaction(t);
    setActionModalVisible(true);
  };

  const renderItem = ({ item }: { item: Transaction & any }) => {
    // item already has __category/__heading/__payeeName attached
    return <ExpenseListItem item={item} onPress={() => onOpenActions(item)} />;
  };

  return (
    <View style={expenseListStyle.container}>
      <View style={globalStyle.headerRow}>
        <Text style={globalStyle.headerTitle}>Expenses</Text>
        <TouchableOpacity
          style={globalStyle.addButton}
          onPress={() => (navigation as any).navigate('AddExpense')}
        >
          <Text style={globalStyle.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search + filters */}
      <View style={globalStyle.searchBlock}>
        <TextInput
          placeholder="Search payee, category, notes"
          placeholderTextColor={schemeColors.muted}
          value={query}
          onChangeText={setQuery}
          style={globalStyle.searchInput}
        />

        <View style={globalStyle.filtersRow}>
          {(['all', 'week', 'month'] as FilterMode[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                globalStyle.filterPill,
                filter === f ? globalStyle.filterPillActive : undefined,
              ]}
            >
              <Text
                style={[
                  globalStyle.filterText,
                  filter === f ? globalStyle.filterTextActive : undefined,
                ]}
              >
                {f === 'all' ? 'All' : f === 'week' ? 'Last 7d' : 'Last 30d'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={preparedTransactions}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text style={globalStyle.textMuted}>No transactions yet. Tap + to add one.</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={globalStyle.fab}
        onPress={() => (navigation as any).navigate('AddExpense')}
      >
        <Text style={globalStyle.fabText}>+</Text>
      </TouchableOpacity>

      <ActionSheet
        onRefresh={onRefresh}
        setActionModalVisible={setActionModalVisible}
        setConfirmModalVisible={setConfirmModalVisible}
        visible={actionModalVisible}
        activeTransaction={activeTransaction}
      />

      {/* Confirm delete / mark-void modal */}
      <ConfirmDeleteModal
        onRefresh={onRefresh}
        activeTransaction={activeTransaction}
        setActiveTransaction={setActiveTransaction}
        setActionModalVisible={setActionModalVisible}
        setConfirmModalVisible={setConfirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        visible={confirmModalVisible}
      />
    </View>
  );
}
