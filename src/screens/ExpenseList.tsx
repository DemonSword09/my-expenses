// src/screens/ExpenseList.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import type { Transaction, Category } from '../db/models';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import useTheme from '../hooks/useTheme';
import ExpenseListItem from '../components/ExpenseListItem';
import ActionSheet from '@src/components/ActionSheet';
import ConfirmDeleteModal from '@src/components/ConfirmDeleteModal';
import useExpenses from '@src/hooks/useExpenses';
import { Appbar } from 'react-native-paper';
import { TransactionRepo } from '@src/db/repositories/TransactionRepo';
import CategoryPicker from '@src/components/CategoryPicker';
import PayeePicker from '@src/components/PayeePicker';
import { CategoryRepo } from '@src/db/repositories/CategoryRepo';

import { CsvHelper } from '@src/utils/CsvHelper';


type FilterMode = 'all' | 'week' | 'month';

export default function ExpenseListScreen() {
  const { schemeColors, globalStyle, expenseListStyle } = useTheme();
  const navigation = useNavigation();
  // action modal state for item options (edit/delete/clone)
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleExport = async () => {
    closeMenu();
  };

  const handleImport = async () => {
    closeMenu();
    navigation.navigate('ImportCsv');
  };
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
    categoriesMap,
  } = useExpenses();

  // selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // bulk edit state
  // bulk edit state
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [payeePickerVisible, setPayeePickerVisible] = useState(false);

  // Hierarchical picker state
  const [pickerCategories, setPickerCategories] = useState<Category[]>([]);
  const [pickerStackParents, setPickerStackParents] = useState<Array<{ id: string | null; label?: string }>>([
    { id: null, label: 'Categories' },
  ]);

  const handleBulkCategory = async (c: Category) => {
    try {
      await TransactionRepo.updateCategoryForMultiple(Array.from(selectedIds), c.id);
      setCategoryPickerVisible(false);
      exitSelectionMode();
      refresh();
    } catch (err) {
      console.error('Bulk category update failed', err);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleBulkPayee = async (p: { id: string }) => {
    try {
      await TransactionRepo.updatePayeeForMultiple(Array.from(selectedIds), p.id);
      setPayeePickerVisible(false);
      exitSelectionMode();
      refresh();
    } catch (err) {
      console.error('Bulk payee update failed', err);
      Alert.alert('Error', 'Failed to update payee');
    }
  };

  const loadPickerCategories = useCallback(async (parentId: string | null) => {
    try {
      const rows = await CategoryRepo.listByParent(parentId);
      setPickerCategories(rows);
    } catch (err) {
      console.error('ExpenseList: failed loading picker categories', err);
      setPickerCategories([]);
    }
  }, []);

  const openCategoryPicker = useCallback(() => {
    setPickerStackParents([{ id: null, label: 'Categories' }]);
    loadPickerCategories(null);
    setCategoryPickerVisible(true);
  }, [loadPickerCategories]);

  const onPickerCategoryPress = useCallback(async (cat: Category) => {
    try {
      const children = await CategoryRepo.listByParent(cat.id);
      if (children && children.length > 0) {
        setPickerStackParents((p) => [...p, { id: cat.id, label: cat.label }]);
        setPickerCategories(children);
      } else {
        handleBulkCategory(cat);
      }
    } catch (err) {
      console.error('ExpenseList: failed resolving children', err);
      handleBulkCategory(cat);
    }
  }, [handleBulkCategory]);

  const onPickerBackStack = useCallback(() => {
    setPickerStackParents((prev) => {
      if (prev.length <= 1) {
        setCategoryPickerVisible(false);
        return prev;
      }
      const next = prev.slice(0, prev.length - 1);
      const parentId = next[next.length - 1].id ?? null;
      loadPickerCategories(parentId);
      return next;
    });
  }, [loadPickerCategories]);

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
    return filteredTransactions.map((t: any) => {
      // Use pre-joined SQL fields if available, otherwise fallback to map lookups

      // 1. Resolve Category Object (for icon/color)
      let category: any = null;
      if (t.category_label) {
        // Construct standard category object from joined fields
        category = {
          id: t.categoryId,
          label: t.category_label,
          icon: t.category_icon,
          color: t.category_color,
        };
      } else {
        category = resolveCategory(t.categoryId);
      }

      // 2. Resolve Heading (Parent > Child)
      let heading = '';
      if (t.category_label) {
        heading = t.category_parent_label
          ? `${t.category_parent_label} > ${t.category_label}`
          : t.category_label;
      } else {
        heading = resolveCategoryHeading(t.categoryId);
      }

      // 3. Resolve Payee Name
      const payeeName = t.payee_name || (t.payeeId ? (payeesMap[t.payeeId] ?? '') : '');

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

  const selectAll = () => {
    const allIds = preparedTransactions.map(t => t.id)
    setSelectedIds(new Set(allIds))
  }

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

  const renderItem = useCallback(({ item }: { item: Transaction & any }) => {
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
  }, [selectionMode, selectedIds, onPressItem, onLongPressItem]);

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
            <Appbar.Action icon="checkbox-multiple-marked-outline" onPress={selectAll} color={schemeColors.primary} />
            <Appbar.Action icon="tag-multiple" onPress={openCategoryPicker} color={schemeColors.primary} />
            <Appbar.Action icon="account-multiple" onPress={() => setPayeePickerVisible(true)} color={schemeColors.primary} />
            <Appbar.Action icon="trash-can-outline" onPress={confirmBulkDelete} color={schemeColors.danger} />
          </>
        ) : (
          <>
            <Appbar.Action icon="menu" color={schemeColors.primary} onPress={() => { }} />
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
                    ₹{totalBalance.toFixed(2)}
                  </Text>
                </View>
              }
            />
            <Appbar.Action
              color={schemeColors.primary}
              icon="bookmark-multiple"
              onPress={() => navigation.navigate('Templates' as never)}
            />
            <Appbar.Action color={schemeColors.primary} icon="dots-vertical" onPress={openMenu} />

            <Modal
              transparent
              visible={menuVisible}
              animationType="fade"
              onRequestClose={closeMenu}
            >
              <TouchableOpacity style={expenseListStyle.modalOverlay} activeOpacity={1} onPress={closeMenu}>
                <View style={[expenseListStyle.menuContainer, { backgroundColor: schemeColors.surface }]}>
                  <TouchableOpacity style={expenseListStyle.menuItem} onPress={handleExport}>
                    <Text style={[expenseListStyle.menuText, { color: schemeColors.text }]}>Export CSV</Text>
                  </TouchableOpacity>
                  <View style={{ height: 1, backgroundColor: schemeColors.border }} />
                  <TouchableOpacity style={expenseListStyle.menuItem} onPress={handleImport}>
                    <Text style={[expenseListStyle.menuText, { color: schemeColors.text }]}>Import CSV</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </>
        )}
      </Appbar.Header>

      {/* Search + filters  */}
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

      <ConfirmDeleteModal
        onRefresh={onRefresh}
        activeTransaction={activeTransaction}
        setActiveTransaction={setActiveTransaction}
        setActionModalVisible={setActionModalVisible}
        setConfirmModalVisible={setConfirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        visible={confirmModalVisible}
      />

      <CategoryPicker
        visible={categoryPickerVisible}
        onRequestClose={() => setCategoryPickerVisible(false)}
        categories={pickerCategories}
        stackParents={pickerStackParents}
        onBackStack={onPickerBackStack}
        onCategoryPress={onPickerCategoryPress}
      />

      <PayeePicker
        visible={payeePickerVisible}
        onRequestClose={() => setPayeePickerVisible(false)}
        payees={Object.values(payeesMap).map((name, idx) => ({ id: Object.keys(payeesMap)[idx], name: name as string }))}
        onPayeePress={handleBulkPayee}
      />
    </View>
  );
}
