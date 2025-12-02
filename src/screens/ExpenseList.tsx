// src/screens/ExpenseList.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import type { Transaction, Category } from '../db/models';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import useTheme from '../hooks/useTheme';
import ExpenseListItem from '../components/ExpenseListItem';
import ActionSheet from '@src/components/ActionSheet';
import ConfirmDeleteModal from '@src/components/ConfirmDeleteModal';
import useExpenses from '@src/hooks/useExpenses';
import { Appbar } from 'react-native-paper';
import { exec, first, run } from '@src/db/sqlite';
import { TransactionRepo } from '@src/db/repositories/TransactionRepo';
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

  // selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    // exit selection mode on refresh
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  }, [load, loadLookups, selectionMode]);

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

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      if (next.size === 0) {
        setSelectionMode(false);
      }
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const onLongPressItem = (t: Transaction) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([t.id]));
    } else {
      toggleSelection(t.id);
    }
  };

  const onPressItem = (t: Transaction) => {
    if (selectionMode) {
      toggleSelection(t.id);
    } else {
      onOpenActions(t);
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const confirmBulkDelete = () => {
    Alert.alert(
      'Delete Transactions',
      `Are you sure you want to delete ${selectedIds.size} transactions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TransactionRepo.deleteMultiple(Array.from(selectedIds));
              await load();
              exitSelectionMode();
            } catch (err) {
              console.error('Bulk delete failed', err);
              Alert.alert('Error', 'Failed to delete transactions.');
            }
          },
        },
      ]
    );
  };

  let totalBalance = 0;
  preparedTransactions.forEach((t) => {
    if (t.transaction_type == 'EXPENSE') totalBalance -= t.amount;
    else totalBalance += t.amount;
  });

  const renderItem = ({ item }: { item: Transaction & any }) => {
    // item already has __category/__heading/__payeeName attached
    return (
      <ExpenseListItem
        item={item}
        onPress={() => onPressItem(item)}
        onLongPress={() => onLongPressItem(item)}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(item.id)}
      />
    );
  };

  return (
    <View style={expenseListStyle.container}>
      <Appbar.Header style={{ backgroundColor: schemeColors.background }}>
        {selectionMode ? (
          <>
            <Appbar.Action icon="close" onPress={exitSelectionMode} color={schemeColors.text} />
            <Appbar.Content
              title={`${selectedIds.size} selected`}
              titleStyle={{ fontWeight: 'bold', color: schemeColors.text }}
            />
            <Appbar.Action icon="trash-can-outline" onPress={confirmBulkDelete} color={schemeColors.danger} />
          </>
        ) : (
          <>
            <Appbar.Action icon="menu" color={schemeColors.primary} onPress={() => {}} />
            <Appbar.Content
              title={
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, color: schemeColors.text }}>
                    Expenses
                  </Text>
                  <Text
                    style={{
                      color: totalBalance < 0 ? schemeColors.danger : schemeColors.success,
                      fontSize: 14,
                    }}
                  >
                    {' '}
                    ₹{totalBalance}
                  </Text>
                </View>
              }
            />
            <Appbar.Action
              color={schemeColors.primary}
              icon="bookmark-multiple"
              onPress={() => navigation.navigate('Templates')}
            />
            <Appbar.Action color={schemeColors.primary} icon="dots-vertical" onPress={() => {}} />
          </>
        )}
      </Appbar.Header>
      
      {/* Search + filters - hide in selection mode? or keep? Keeping for now but maybe disable input */}
      {!selectionMode && (
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
      )}

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

      {!selectionMode && (
        <TouchableOpacity
          style={globalStyle.fab}
          onPress={() => (navigation as any).navigate('AddExpense')}
        >
          <Text style={globalStyle.fabText}>+</Text>
        </TouchableOpacity>
      )}

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
