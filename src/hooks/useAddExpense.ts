// src/hooks/useAddExpense.ts
import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { TransactionDAO } from '../db/dao/TransactionDAO';
import { TransactionService } from '../services/TransactionService';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import type { Category, Payee, Transaction } from '../db/models';
import { useAppData } from '../context/AppDataProvider';

import { CategoryRepo } from '../db/repositories/CategoryRepo';

type CategoryNode = Category & { children: Category[] };

type UseAddExpenseReturn = {
  merchant: string;
  setMerchant: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  transactionType: 'EXPENSE' | 'INCOME';
  setTransactionType: (v: 'EXPENSE' | 'INCOME') => void;

  dateMs: number;
  showPicker: boolean;
  openDatePicker: () => void;
  onDateChange: (ev: any, d?: Date) => void;

  catModalVisible: boolean;
  openCategoryPicker: () => Promise<void>;
  closeCategoryPicker: () => void;
  categories: CategoryNode[];
  selectedCategory: Category | null;
  onCategoryPress: (c: Category) => void; // Sync wrapper or just async passed as void
  onCategorySelect: (c: Category) => void;

  loading: boolean;

  handleSave: () => Promise<boolean>;
  payees: Payee[];
  onMerchantSelect: (p: Payee) => void;
  reset: () => void;
};

export default function useAddExpense(editId?: string, duplicateFromId?: string, initialData?: any): UseAddExpenseReturn {
  const { categories: allCategories, payees: allPayees, refreshData } = useAppData();

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [accountId, setAccountId] = useState<string | null>(null);

  const [catModalVisible, setCatModalVisible] = useState(false);

  const [pickerCategories, setPickerCategories] = useState<CategoryNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [dateMs, setDateMs] = useState<number>(Date.now());
  const [showPicker, setShowPicker] = useState(false);

  const [loading, setLoading] = useState(false);

  // load hierarchy
  const loadPickerHierarchy = useCallback(async () => {
    try {
      const rows = await CategoryRepo.listHierarchy();
      setPickerCategories(rows);
    } catch (err) {
      console.error('useAddExpense: failed loading hierarchy', err);
      setPickerCategories([]);
    }
  }, []);

  const loadTransaction = useCallback(async (id: string, isDuplicate: boolean = false) => {
    try {
      const t = await TransactionRepo.findById(id);
      if (!t) return;

      let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
      if (t.transaction_type === 'INCOME') type = 'INCOME';
      else if (t.amount > 0 && t.transaction_type !== 'EXPENSE') {
        // inference logic remains
      }

      setTransactionType(type);
      setAmount(String(Math.abs(t.amount)));
      setNotes(t.comment ?? '');
      // If duplicating, use current time, else use transaction time
      setDateMs(isDuplicate ? Date.now() : (t.createdAt ?? Date.now()));
      setAccountId(t.accountId);

      if (t.categoryId) {
        const cat = allCategories.find(c => c.id === t.categoryId);
        if (cat) setSelectedCategory(cat);
      }
      if (t.payeeId) {
        const p = allPayees.find(py => py.id === t.payeeId);
        if (p) setMerchant(p.name);
      } else if (t.payeeId === null && merchant) {
        // keep merchant if set
      }
    } catch (err) {
      console.error('useAddExpense: failed loading transaction', err);
    }
  }, [allCategories, allPayees]);

  useEffect(() => {
    loadPickerHierarchy();
  }, [loadPickerHierarchy]);

  useEffect(() => {
    if (editId) {
      (async () => {
        await loadTransaction(editId);
      })();
    } else if (duplicateFromId) {
      (async () => {
        await loadTransaction(duplicateFromId, true);
      })();
    } else if (initialData) {
      // initialize from passed data (e.g. template)
      if (initialData.amount) setAmount(String(initialData.amount));
      if (initialData.comment) setNotes(initialData.comment);
      if (initialData.merchant) setMerchant(initialData.merchant);

      if (initialData.categoryId) {
        const cat = allCategories.find(c => c.id === initialData.categoryId);
        if (cat) setSelectedCategory(cat);
      }

      if (initialData.merchant) setMerchant(initialData.merchant);

      if (initialData.transaction_type) {
        setTransactionType(initialData.transaction_type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      } else if (initialData.amount) {
        const amt = Number(initialData.amount);
        if (amt < 0) {
          setTransactionType('EXPENSE');
          setAmount(String(Math.abs(amt)));
        } else {
          setTransactionType('INCOME');
          setAmount(String(amt));
        }
      }
    } else {
      setAmount('');
      setMerchant('');
      setNotes('');
      setSelectedCategory(null);
      setDateMs(Date.now());
      setTransactionType('EXPENSE');
      setAccountId(null);
    }
  }, [editId, duplicateFromId, loadTransaction, initialData, allCategories]);

  const openCategoryPicker = useCallback(async () => {
    setCatModalVisible(true);
    // ensure hierarchy is loaded
    if (pickerCategories.length === 0) {
      loadPickerHierarchy();
    }
  }, [pickerCategories, loadPickerHierarchy]);

  const closeCategoryPicker = useCallback(() => {
    setCatModalVisible(false);
  }, []);

  const onCategoryPress = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setCatModalVisible(false);
  }, []);

  const onCategorySelect = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setCatModalVisible(false);
  }, []);

  const onMerchantSelect = useCallback(async (payee: Payee) => {
    setMerchant(payee.name);
    if (!editId) {
      try {
        const lastTxn = await TransactionDAO.findLastByPayee(payee.id);
        if (lastTxn) {
          setAmount(String(lastTxn.amount));
          if (lastTxn.comment) setNotes(lastTxn.comment);

          if (lastTxn.categoryId) {
            const cat = allCategories.find(c => c.id === lastTxn.categoryId);
            if (cat) setSelectedCategory(cat);
          }
        }
      } catch (err) {
        console.error('useAddExpense: failed auto-populating from merchant', err);
      }
    }
  }, [editId, allCategories]);

  const openDatePicker = useCallback(() => setShowPicker(true), []);
  const onDateChange = useCallback((ev: any, d?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (d) setDateMs(d.getTime());
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      if (!amount) return false;

      const parsed = parseFloat(String(amount).replace(/,/g, ''));
      if (Number.isNaN(parsed) || parsed <= 0) return false;

      const finalAmount = Math.abs(parsed);

      let payeeId: string | null = null;
      if (merchant.trim()) {
        const p = await TransactionService.addPayee({ name: merchant.trim() });
        payeeId = p.id;
      }

      const payload: Partial<Transaction> = {
        amount: finalAmount,
        comment: notes || null,
        categoryId: selectedCategory ? selectedCategory.id : null,
        payeeId,
        createdAt: dateMs,
        transaction_type: transactionType,
      };

      if (accountId) {
        payload.accountId = accountId;
      }

      if (editId) {
        if ((TransactionDAO as any).update) {
          await (TransactionDAO as any).update(editId, {
            ...payload,
            updatedAt: Date.now(),
          });
        }
      } else {
        await TransactionService.createTransaction(payload);
      }

      // Refresh global data (especially for new payees)
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('useAddExpense: save failed', err);
      Alert.alert(err?.message ? err.message : 'Save failed', 'Unable to save transaction.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [amount, notes, selectedCategory, dateMs, editId, merchant, transactionType, accountId, refreshData]);

  return {
    merchant,
    setMerchant,
    amount,
    setAmount,
    notes,
    setNotes,
    transactionType,
    setTransactionType,

    dateMs,
    showPicker,
    openDatePicker,
    onDateChange,

    catModalVisible,
    openCategoryPicker,
    closeCategoryPicker,
    categories: pickerCategories,
    selectedCategory,
    onCategoryPress,
    onCategorySelect,

    loading,
    payees: allPayees,
    onMerchantSelect,

    handleSave,
    reset: () => {
      setAmount('');
      setMerchant('');
      setNotes('');
      setSelectedCategory(null);
      setDateMs(Date.now());
      setTransactionType('EXPENSE');
      setAccountId(null);
    }
  } as UseAddExpenseReturn & { payees: Payee[], onMerchantSelect: (p: Payee) => void, reset: () => void };
}
