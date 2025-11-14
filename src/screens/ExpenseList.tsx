// src/screens/ExpenseList.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { format } from 'date-fns';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { all } from '../db/sqlite';
import type { Transaction } from '../db/models';
import type { Category } from '../db/models';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

function formatCurrency(amount: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function ExpenseListScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});
  const [payeesMap, setPayeesMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

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
      // quick fetch of payees table
      const rows = await all<{ id: string; name: string }>('SELECT id, name FROM payees');
      const pmap: Record<string, string> = {};
      (rows || []).forEach((r) => {
        if (r && r.id) pmap[r.id] = r.name;
      });
      setPayeesMap(pmap);
    } catch (err) {
      // no payees yet - that's fine
      setPayeesMap({});
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const rows = await TransactionRepo.listAll();
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
  // console.log(payeesMap);

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
    // icon field may be a MaterialCommunityIcons name
    return cat ?? null;
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const createdAtMs =
      typeof item.createdAt === 'number' ? item.createdAt : Number(item.createdAt);
    const date = new Date(createdAtMs);
    const heading = resolveCategoryHeading(item.categoryId);
    const cat = resolveCategory(item.categoryId);
    const payeeName = item.payeeId ? (payeesMap[item.payeeId] ?? '') : '';
    const notes = item.comment ?? '';
    // console.log(item.payeeId);

    const subHeading =
      notes && payeeName ? `${notes} / ${payeeName}` : notes ? notes : payeeName ? payeeName : '';

    return (
      <TouchableOpacity
        onPress={() => {
          // navigate to detail later
          // navigation.navigate('TransactionDetail', { id: item.id });
        }}
        style={styles.itemContainer}
        activeOpacity={0.75}
      >
        {/* Left: small circle placeholder (keeps visual balance) */}
        <View style={styles.categoryRight}>
          {cat?.icon ? (
            <MaterialCommunityIcons
              name={cat.icon as any}
              size={24}
              color={cat.color ? '#' + cat.color : '#2563EB'}
            />
          ) : (
            <View style={styles.catFallback}>
              <Text style={styles.catFallbackText}>
                {heading ? heading.charAt(0).toUpperCase() : 'C'}
              </Text>
            </View>
          )}
        </View>

        {/* Body: heading + subheading */}
        <View style={styles.itemBody}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {heading}
          </Text>
          <Text style={styles.itemSubtitle} numberOfLines={1}>
            {subHeading || '—'}
          </Text>
        </View>

        {/* Right: date (top) and amount (below), and category symbol to the far right */}
        <View style={styles.itemRight}>
          <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.itemDate}>{format(date, 'PP')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent={false}
        backgroundColor="#F7F7FA"
        hidden={false}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense' as never)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions yet. Tap + to add one.</Text>
          </View>
        }
      />
      <TouchableOpacity
        onPress={() => {
          // navigation.navigate('QuickAdd');
          navigation.navigate('AddExpense');
        }}
        style={styles.fab}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FA' },
  header: {
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
  itemDate: { fontSize: 13, color: '#6B7280' },
  itemAmount: { fontSize: 16, fontWeight: '800', marginBottom: 6 },

  categoryRight: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catFallback: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catFallbackText: { fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 48 },
  emptyText: { color: '#9CA3AF' },

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
});
