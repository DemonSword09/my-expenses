// src/screens/ExpenseList.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  useColorScheme,
} from 'react-native';
import { format } from 'date-fns';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { all } from '../db/sqlite';
import type { Transaction, Category } from '../db/models';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { formatColorValue } from '../utils/colors';

type FilterMode = 'all' | 'week' | 'month';

// Small utility for formatting currency (locale/currency should come from settings in real app)
const formatCurrency = (amount: number, currency = 'INR') => {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
};
export default function ExpenseListScreen() {
  const scheme = useColorScheme();

  const isDark = scheme === 'dark';
  const navigation = useNavigation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});
  const [payeesMap, setPayeesMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  // action modal state for item options (edit/delete/clone)
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<Transaction | null>(null);

  const loadLookups = useCallback(async () => {
    try {
      const cats = await CategoryRepo.listAll();
      const cmap: Record<string, Category> = {};
      for (const c of cats) cmap[c.id] = c;
      setCategoriesMap(cmap);
    } catch (err) {
      console.error('Failed loading categories', err);
      setCategoriesMap({});
    }

    try {
      const rows = await all<{ id: string; name: string }>('SELECT id, name FROM payees');
      const pmap: Record<string, string> = {};
      (rows || []).forEach((r) => {
        if (r && r.id) pmap[r.id] = r.name;
      });
      setPayeesMap(pmap);
    } catch (err) {
      setPayeesMap({});
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const rows = await TransactionRepo.listAll();
      // rows.forEach((r) => console.log(r.comment, r.deleted, r.amount));

      setTransactions(rows);
    } catch (err) {
      console.error('Failed to load transactions', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await loadLookups();
        await load();
      })();
    }, [load, loadLookups]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadLookups();
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load, loadLookups]);

  const resolveCategoryHeading = (categoryId?: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categoriesMap[categoryId];
    if (!cat) return 'Category';
    if (cat.parentId) {
      const parent = categoriesMap[cat.parentId];
      if (parent) return `${parent.label} > ${cat.label}`;
      return cat.label;
    }
    return cat.label;
  };

  const resolveCategory = (categoryId?: string | null) => {
    if (!categoryId) return null;
    const cat = categoriesMap[categoryId];
    return cat ?? null;
  };

  // filtering + search client-side (small datasets)
  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return transactions.filter((t) => {
      // filter by time
      if (filter === 'week' && !(t.createdAt >= now - 1000 * 60 * 60 * 24 * 7)) return false;
      if (filter === 'month' && !(t.createdAt >= now - 1000 * 60 * 60 * 24 * 30)) return false;
      // search by payee, category, comment
      if (!q) return true;
      const payee = t.payeeId ? (payeesMap[t.payeeId] ?? '').toLowerCase() : '';
      const cat = resolveCategoryHeading(t.categoryId).toLowerCase();
      const comment = (t.comment ?? '').toLowerCase();
      return payee.includes(q) || cat.includes(q) || comment.includes(q);
    });
  }, [transactions, filter, query, payeesMap, categoriesMap]);

  const onOpenActions = (t: Transaction) => {
    setActiveTransaction(t);
    setActionModalVisible(true);
  };

  const onEdit = () => {
    if (!activeTransaction) return;
    setActionModalVisible(false);
    navigation.navigate('AddExpense' as never, { id: activeTransaction.id } as never);
  };

  const onDelete = async () => {
    if (!activeTransaction) return;
    try {
      await TransactionRepo.delete(activeTransaction.id);
      setActionModalVisible(false);
      await load();
    } catch (err) {
      console.error('Delete failed', err);
      Alert.alert('Delete failed', 'Unable to delete the transaction.');
    }
  };

  const onClone = async () => {
    if (!activeTransaction) return;
    try {
      await TransactionRepo.clone(activeTransaction.id);
      setActionModalVisible(false);
      await load();
    } catch (err) {
      console.error('Clone failed', err);
      Alert.alert('Clone failed', 'Unable to clone the transaction.');
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const date = new Date(item.createdAt);
    const heading = resolveCategoryHeading(item.categoryId);
    const cat = resolveCategory(item.categoryId);
    const payeeName = item.payeeId ? (payeesMap[item.payeeId] ?? '') : '';
    const notes = item.comment ?? '';
    const subHeading =
      notes && payeeName ? `${notes} / ${payeeName}` : notes ? notes : payeeName ? payeeName : '';
    const isIncome = (item.transaction_type ?? '').toUpperCase() === 'INCOME';
    const amountSign = isIncome ? '+' : '-';
    const amountColor = isIncome ? '#10B981' : '#EF4444'; // green / red

    return (
      <TouchableOpacity
        onPress={() => onOpenActions(item)}
        style={[
          isDark ? styles.itemContainerDark : styles.itemContainer,
          item.deleted ? { opacity: 0.6 } : { opacity: 1 },
        ]}
        activeOpacity={0.8}
      >
        {item.deleted ? <View style={item.deleted ? styles.deletedLine : null} /> : null}
        <View style={styles.categoryRight}>
          {cat?.icon ? (
            <MaterialCommunityIcons
              name={cat.icon as any}
              size={22}
              color={formatColorValue(cat.color, '#2563EB')}
            />
          ) : (
            <View style={styles.catFallback}>
              <Text style={styles.catFallbackText}>
                {heading ? heading.charAt(0).toUpperCase() : 'C'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.itemBody}>
          <Text style={[styles.itemTitle, isDark ? styles.textDark : undefined]} numberOfLines={1}>
            {heading}
          </Text>
          <Text
            style={[styles.itemSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
            numberOfLines={1}
          >
            {subHeading || '—'}
          </Text>
        </View>

        <View style={styles.itemRight}>
          <Text
            style={[styles.itemAmount, { color: amountColor }]}
          >{`${amountSign}${formatCurrency(item.amount)}`}</Text>
          <Text style={[styles.itemDate, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {format(date, 'PP')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent={false}
        hidden={false}
        backgroundColor={isDark ? '#111827' : '#F7F7FA'}
      />

      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, isDark ? styles.textDark : undefined]}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense' as never)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search + filters */}
      <View style={styles.searchBlock}>
        <TextInput
          placeholder="Search payee, category, notes"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, isDark ? styles.searchInputDark : undefined]}
        />

        <View style={styles.filtersRow}>
          {(['all', 'week', 'month'] as FilterMode[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f ? styles.filterPillActive : undefined]}
            >
              <Text style={[styles.filterText, filter === f ? styles.filterTextActive : undefined]}>
                {f === 'all' ? 'All' : f === 'week' ? 'Last 7d' : 'Last 30d'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}>
              No transactions yet. Tap + to add one.
            </Text>
          </View>
        }
      />

      {/* Floating action */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense' as never)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Action modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={modalStyles.overlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={modalStyles.sheet}>
            <TouchableOpacity onPress={onEdit} style={modalStyles.row}>
              <Text style={modalStyles.rowText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClone} style={modalStyles.row}>
              <Text style={modalStyles.rowText}>Clone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Delete transaction', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: onDelete },
                ]);
              }}
              style={modalStyles.row}
            >
              <Text style={[modalStyles.rowText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActionModalVisible(false)} style={modalStyles.row}>
              <Text style={modalStyles.rowText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const baseStyles = {
  container: { flex: 1, backgroundColor: '#F7F7FA' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FA' },
  containerDark: { flex: 1, backgroundColor: '#0b1220' },
  deletedLine: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'red',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  addButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#FFF', fontWeight: '700' },

  searchBlock: { paddingHorizontal: 16, marginBottom: 16 },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInputDark: { backgroundColor: '#111827', color: '#fff' },
  filtersRow: { flexDirection: 'row' },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterPillActive: { backgroundColor: '#2563EB' },
  filterText: { color: '#374151', fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF' },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemContainerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b2236ff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  leftPlaceholder: { marginRight: 12 },
  leftCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftCircleText: { fontSize: 16, fontWeight: '700' },

  itemBody: { flex: 1, paddingRight: 8 },
  itemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  itemSubtitle: { fontSize: 13, color: '#6B7280' },

  itemRight: { alignItems: 'flex-end', marginRight: 12 },
  itemDate: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  itemAmount: { fontSize: 16, fontWeight: '600' },

  categoryRight: { width: 36, alignItems: 'center', marginRight: 8, justifyContent: 'center' },
  catFallback: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catFallbackText: { fontWeight: '700' },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    elevation: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, lineHeight: 28 },

  textDark: { color: '#fff' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  row: { paddingVertical: 12 },
  rowText: { fontSize: 16 },
});
