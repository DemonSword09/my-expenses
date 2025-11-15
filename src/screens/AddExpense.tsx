// src/screens/AddExpense.tsx

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';

import { formatColorValue } from '../utils/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import type { Category, Payee, Transaction } from '../db/models';
import { format } from 'date-fns';
import { first, run } from '@src/db/sqlite';

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // detect edit mode if route.params.id is present
  const params: any = (route as any).params ?? {};
  const editId: string | undefined = params.id;

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [stackParents, setStackParents] = useState<Array<{ id: string | null; label?: string }>>([
    { id: null, label: 'Categories' },
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // date picker
  const [dateMs, setDateMs] = useState<number>(Date.now());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadCategories(null);
    if (editId) loadTransaction(editId);
  }, [editId]);

  const loadCategories = async (parentId: string | null) => {
    try {
      const rows = await CategoryRepo.listByParent(parentId);
      setCategories(rows);
    } catch (err) {
      console.error('failed loading categories', err);
      setCategories([]);
    }
  };

  const loadTransaction = async (id: string) => {
    try {
      const t = await TransactionRepo.findById(id);
      if (!t) return;
      setAmount(String(t.amount));
      setNotes(t.comment ?? '');
      setDateMs(t.createdAt ?? Date.now());
      if (t.categoryId) {
        const cat = await CategoryRepo.findById(t.categoryId);
        if (cat) setSelectedCategory(cat);
      }
      if (t.payeeId) {
        // fetch payee name if you want to prefill merchant (optional)
        const r: Payee | null = await first('SELECT name FROM payees WHERE id = ? LIMIT 1', [
          t.payeeId,
        ]);
        if (r) setMerchant(r.name);
        // if earlier pattern not useful, keep merchant empty (payee handling is optional)
      }
    } catch (err) {
      console.error('failed loading transaction', err);
    }
  };

  const openModal = async () => {
    setStackParents([{ id: null, label: 'Categories' }]);
    await loadCategories(null);
    setCatModalVisible(true);
  };

  const onPressCategory = async (item: Category) => {
    try {
      const children = await CategoryRepo.listByParent(item.id);
      if (children.length > 0) {
        setStackParents((s) => [...s, { id: item.id, label: item.label }]);
        setCategories(children);
      } else {
        setSelectedCategory(item);
        setCatModalVisible(false);
      }
    } catch (err) {
      console.error('error checking children', err);
      setSelectedCategory(item);
      setCatModalVisible(false);
    }
  };

  const onModalBack = async () => {
    if (stackParents.length <= 1) {
      setCatModalVisible(false);
      return;
    }
    const newStack = stackParents.slice(0, -1);
    const parentEntry = newStack[newStack.length - 1];
    setStackParents(newStack);
    await loadCategories(parentEntry.id ?? null);
  };

  const onChangeDate = (event: any, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) {
      setDateMs(selected.getTime());
    } else if (event?.timestamp) {
      setDateMs(event.timestamp);
    }
  };

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Missing amount', 'Please enter an amount.');
      return;
    }
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed)) {
      Alert.alert('Invalid amount', 'Please enter a valid number for amount.');
      return;
    }

    try {
      // ensure payee exists (normalize)
      let payeeId: string | undefined = undefined;
      const name = merchant.trim();
      if (name) {
        const p = await TransactionRepo.addPayee({ name });
        payeeId = p.id;
      }

      if (editId) {
        // update existing
        const a = await TransactionRepo.update(editId, {
          amount: parsed,
          comment: notes ?? null,
          categoryId: selectedCategory?.id ?? null,
          payeeId: payeeId ?? null,
          createdAt: dateMs,
        });
        // console.log(a);
      } else {
        const a = await TransactionRepo.create({
          amount: parsed,
          comment: notes ?? null,
          categoryId: selectedCategory?.id ?? null,
          payeeId: payeeId ?? null,
          transaction_type: 'EXPENSE',
          createdAt: dateMs,
        });
        // console.log(a);
      }
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save transaction', err);
      Alert.alert('Save failed', 'Unable to save transaction.');
    }
  };

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0b1226' : '#F7F7FA'}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark ? styles.textDark : undefined]}>
          {editId ? 'Edit Expense' : 'Add Expense'}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, isDark ? styles.textDark : undefined]}>Merchant / Payee</Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : undefined]}
          placeholder="e.g. Starbucks"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={merchant}
          onChangeText={setMerchant}
        />

        <Text style={[styles.label, isDark ? styles.textDark : undefined]}>Amount</Text>
        <TextInput
          style={[styles.input, isDark ? styles.inputDark : undefined]}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={[styles.label, isDark ? styles.textDark : undefined]}>Date</Text>
        <TouchableOpacity
          style={[styles.input, styles.pickerTrigger]}
          onPress={() => setShowPicker(true)}
        >
          <Text>{format(new Date(dateMs), 'PP')}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={new Date(dateMs)}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date(2100, 0, 1)}
          />
        )}

        <Text style={[styles.label, isDark ? styles.textDark : undefined]}>Category</Text>
        <TouchableOpacity onPress={openModal} style={[styles.input, styles.pickerTrigger]}>
          {selectedCategory ? (
            <Text>{selectedCategory.label}</Text>
          ) : (
            <Text style={{ color: '#6B7280' }}>Select a category</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.label, isDark ? styles.textDark : undefined]}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline, isDark ? styles.inputDark : undefined]}
          placeholder="Optional notes..."
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Category modal - drilldown UI */}
      <Modal visible={catModalVisible} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.headerRow}>
              <TouchableOpacity onPress={onModalBack} style={modalStyles.backButton}>
                <Text style={{ fontSize: 16 }}>
                  {stackParents.length > 1 ? '◀ Back' : '✕ Close'}
                </Text>
              </TouchableOpacity>
              <Text style={modalStyles.headerTitle}>
                {stackParents[stackParents.length - 1]?.label ?? 'Categories'}
              </Text>
              <View style={{ width: 64 }} />
            </View>

            <FlatList
              data={categories}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onPressCategory(item)} style={modalStyles.row}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={modalStyles.iconPlaceholder}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={22}
                        color={formatColorValue(item.color, '#2563EB')}
                      />
                    </View>
                    <Text style={modalStyles.rowText}>{item.label}</Text>
                  </View>
                  <Text style={{ color: '#9CA3AF' }}>{'›'}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: '#EEF2FF' }} />
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FA' },
  containerDark: { flex: 1, backgroundColor: '#0b1226' },
  header: { padding: 16, paddingTop: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700' },

  form: { paddingHorizontal: 16, paddingTop: 8 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    elevation: 1,
  },
  inputDark: { backgroundColor: '#111827', color: '#fff' },
  pickerTrigger: { justifyContent: 'center', height: 48 },
  multiline: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveText: { color: '#FFF', fontWeight: '700' },
  textDark: { color: '#fff' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  container: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '85%', overflow: 'hidden' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  backButton: { paddingHorizontal: 8, paddingVertical: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  row: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { fontSize: 16 },
});
