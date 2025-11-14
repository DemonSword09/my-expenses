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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import type { Category } from '../db/models';

export default function AddExpenseScreen() {
  const navigation = useNavigation();

  const [merchant, setMerchant] = useState(''); // still available if you want to store payee
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Category modal drilldown state
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [stackParents, setStackParents] = useState<Array<{ id: string | null; label?: string }>>([
    { id: null, label: 'Categories' },
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    // load top-level categories initially
    loadCategories(null);
  }, []);

  const loadCategories = async (parentId: string | null) => {
    try {
      const rows = await CategoryRepo.listByParent(parentId);
      setCategories(rows);
    } catch (err) {
      console.error('failed loading categories', err);
      setCategories([]);
    }
  };

  const openModal = async () => {
    setStackParents([{ id: null, label: 'Categories' }]);
    await loadCategories(null);
    setCatModalVisible(true);
  };

  const onPressCategory = async (item: Category, fetch: boolean = true) => {
    // check if this item has children
    try {
      let children: Category[];
      if (fetch) {
        children = await CategoryRepo.listByParent(item.id);
      } else {
        children = [];
      }
      if (children.length > 0) {
        // drill down
        setStackParents((s) => [...s, { id: item.id, label: item.label }]);
        setCategories(children);
      } else {
        // select leaf category
        setSelectedCategory(item);
        setCatModalVisible(false);
      }
    } catch (err) {
      console.error('error checking children', err);
      // fallback: select anyway
      setSelectedCategory(item);
      setCatModalVisible(false);
    }
  };

  const onModalBack = async () => {
    if (stackParents.length <= 1) {
      // top level: close
      setCatModalVisible(false);
      return;
    }
    const newStack = stackParents.slice(0, -1);
    const parentEntry = newStack[newStack.length - 1];
    setStackParents(newStack);
    await loadCategories(parentEntry.id ?? null);
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
      const payee = await TransactionRepo.addPayee({ name: merchant });
      const created = await TransactionRepo.create({
        amount: parsed,
        comment: notes ?? null,
        categoryId: selectedCategory?.id,
        transaction_type: 'EXPENSE',
        payeeId: payee.id,
        // accountId omitted - TransactionRepo ensures a default account exists
      });

      console.log('Created transaction', created);
      console.log('Created Payee', payee);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to create transaction', err);
      Alert.alert('Save failed', 'Unable to save transaction.');
    }
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
        <Text style={styles.headerTitle}>Add Expense</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Merchant / Payee</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Starbucks"
          value={merchant}
          onChangeText={setMerchant}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity onPress={openModal} style={[styles.input, styles.pickerTrigger]}>
          {selectedCategory ? (
            <Text>{selectedCategory.label}</Text>
          ) : (
            <Text style={{ color: '#6B7280' }}>Select a category</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Optional notes..."
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
                <TouchableOpacity
                  onPress={() => onPressCategory(item)}
                  onLongPress={() => onPressCategory(item, false)}
                  style={modalStyles.row}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={24}
                      color={item.color ? '#' + item.color.toString() : '#777c84ff'}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={modalStyles.rowText}>{item.label}</Text>
                  </View>

                  {/* arrow indicates there might be children; we optimistically show it when item might have children later */}
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
