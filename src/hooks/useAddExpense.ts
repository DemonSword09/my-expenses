// src/hooks/useAddExpense.ts
import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import type { Category, Payee, Transaction } from '../db/models';
import { first, all } from '../db/sqlite';
import { useNavigation } from '@react-navigation/native';

type UseAddExpenseReturn = {
  merchant: string;
  setMerchant: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;

  dateMs: number;
  showPicker: boolean;
  openDatePicker: () => void;
  onDateChange: (ev: any, d?: Date) => void;

  catModalVisible: boolean;
  openCategoryPicker: () => Promise<void>;
  closeCategoryPicker: () => void;
  stackParents: Array<{ id: string | null; label?: string }>;
  categories: Category[];
  selectedCategory: Category | null;
  onCategoryPress: (c: Category) => Promise<void>;
  onCategorySelect: (c: Category) => void;
  onBackStack: () => Promise<void>;

  loading: boolean;

  handleSave: () => Promise<void>;
  payees: Payee[];
  onMerchantSelect: (p: Payee) => void;
};

export default function useAddExpense(editId?: string | undefined, initialData?: any): UseAddExpenseReturn {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [stackParents, setStackParents] = useState<Array<{ id: string | null; label?: string }>>([
    { id: null, label: 'Categories' },
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [dateMs, setDateMs] = useState<number>(Date.now());
  const [showPicker, setShowPicker] = useState(false);

  const [loading, setLoading] = useState(false);

  // load categories for a parent
  const loadCategories = useCallback(async (parentId: string | null) => {
    try {
      const rows = await CategoryRepo.listByParent(parentId);
      setCategories(rows);
    } catch (err) {
      console.error('useAddExpense: failed loading categories', err);
      setCategories([]);
    }
  }, []);

  const loadTransaction = useCallback(async (id: string) => {
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
        const r: Payee | null = await first('SELECT name FROM payees WHERE id = ? LIMIT 1', [
          t.payeeId,
        ]);
        if (r) setMerchant(r.name);
      }
    } catch (err) {
      console.error('useAddExpense: failed loading transaction', err);
    }
  }, []);

  useEffect(() => {
    // initial load of root categories
    (async () => {
      await loadCategories(null);
    })();
  }, [loadCategories]);

  useEffect(() => {
    if (editId) {
      (async () => {
        await loadTransaction(editId);
      })();
    } else if (initialData) {
      // initialize from passed data (e.g. template)
      if (initialData.amount) setAmount(String(initialData.amount));
      if (initialData.comment) setNotes(initialData.comment);
      if (initialData.merchant) setMerchant(initialData.merchant); // if template has merchant field?
      // Template might store merchant in 'payee' or similar?
      // The user said "template json form".
      // Let's assume the template object structure matches what we need or we map it.
      // In TemplateEditor, initial.template is passed.
      
      // If initialData has categoryId, we might need to load it?
      // But we can just set selectedCategory if we have the full object, or load it if we only have ID.
      // TemplateEditor passes `template` which might have `categoryId`.
      if (initialData.categoryId) {
         // we need to load the category object to set selectedCategory
         (async () => {
            const cat = await CategoryRepo.findById(initialData.categoryId);
            if (cat) setSelectedCategory(cat);
         })();
      }
      
      // For merchant, if it's just a string in template, use it.
      // If it's a payeeId, we might need to load it.
      // But templates usually store the raw values for simplicity?
      // Let's assume 'merchant' property exists or we check 'payee_name' etc.
      if (initialData.merchant) setMerchant(initialData.merchant);
    } else {
      // reset to defaults if no editId and no initialData (e.g. creating new)
      setAmount('');
      setMerchant('');
      setNotes('');
      setSelectedCategory(null);
      setDateMs(Date.now());
    }
  }, [editId, loadTransaction, initialData]);

  const openCategoryPicker = useCallback(async () => {
    setStackParents([{ id: null, label: 'Categories' }]);
    await loadCategories(null);
    setCatModalVisible(true);
  }, [loadCategories]);

  const closeCategoryPicker = useCallback(() => {
    setCatModalVisible(false);
  }, []);

  // THIS is the key change:
  // when a category row is tapped, decide whether to navigate into children or select it.
  const onCategoryPress = useCallback(async (cat: Category) => {
    try {
      // check for children
      const children = await CategoryRepo.listByParent(cat.id);
      if (children && children.length > 0) {
        // navigate into children
        setStackParents((p) => [...p, { id: cat.id, label: cat.label }]);
        setCategories(children);
      } else {
        // no children -> select immediately
        setSelectedCategory(cat);
        setCatModalVisible(false);
      }
    } catch (err) {
      console.error('useAddExpense: failed resolving children', err);
      // fallback: select the category to avoid blocking the user
      setSelectedCategory(cat);
      setCatModalVisible(false);
    }
  }, []);

  const onCategorySelect = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setCatModalVisible(false);
  }, []);

  const onMerchantSelect = useCallback(async (payee: Payee) => {
    setMerchant(payee.name);
    
    // Auto-populate from last transaction for this payee
    if (!editId) {
      try {
        const lastTxn = await TransactionRepo.getLastByPayee(payee.id);
        if (lastTxn) {
          setAmount(String(lastTxn.amount));
          if (lastTxn.comment) setNotes(lastTxn.comment);
          
          if (lastTxn.categoryId) {
             const cat = await CategoryRepo.findById(lastTxn.categoryId);
             if (cat) setSelectedCategory(cat);
          }
        }
      } catch (err) {
        console.error('useAddExpense: failed auto-populating from merchant', err);
      }
    }
  }, [editId]);

  const onBackStack = useCallback(async () => {
    setStackParents((prev) => {
      if (prev.length <= 1) {
        setCatModalVisible(false);
        return prev;
      }
      const next = prev.slice(0, prev.length - 1);
      const parentId = next[next.length - 1].id ?? null;
      // load categories for the parent we just navigated back to
      loadCategories(parentId);
      return next;
    });
  }, [loadCategories]);

  const openDatePicker = useCallback(() => setShowPicker(true), []);
  const onDateChange = useCallback((ev: any, d?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (d) setDateMs(d.getTime());
  }, []);
  
  const [payees, setPayees] = useState<Payee[]>([]);

  // load payees for autocomplete
  useEffect(() => {
    (async () => {
      try {
        const rows = await all<Payee>('SELECT * FROM payees ORDER BY name COLLATE NOCASE ASC');
        setPayees(rows || []);
      } catch (err) {
        console.error('useAddExpense: failed loading payees', err);
      }
    })();
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const parsed = parseFloat(String(amount).replace(/,/g, ''));
      if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error('Invalid amount');
      }

      let payeeId: string | null = null;
      if (merchant.trim()) {
        const p = await TransactionRepo.addPayee({ name: merchant.trim() });
        payeeId = p.id;
      }

      const payload: Partial<Transaction> = {
        amount: parsed,
        comment: notes || null,
        categoryId: selectedCategory ? selectedCategory.id : null,
        payeeId,
        createdAt: dateMs,
        transaction_type: 'EXPENSE',
      };

      if (editId) {
        if ((TransactionRepo as any).update) {
          await (TransactionRepo as any).update(editId, {
            amount: parsed,
            comment: notes || null,
            categoryId: selectedCategory ? selectedCategory.id : null,
            createdAt: dateMs,
            updatedAt: Date.now(),
          });
        } else {
          await TransactionRepo.create({ ...payload, id: editId });
        }
      } else {
        await TransactionRepo.create(payload);
      }
    } catch (err: any) {
      console.error('useAddExpense: save failed', err);
      Alert.alert(err?.message ? err.message : 'Save failed', 'Unable to save transaction.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [amount, notes, selectedCategory, dateMs, editId, merchant]);

  return {
    merchant,
    setMerchant,
    amount,
    setAmount,
    notes,
    setNotes,

    dateMs,
    showPicker,
    openDatePicker,
    onDateChange,

    catModalVisible,
    openCategoryPicker,
    closeCategoryPicker,
    stackParents,
    categories,
    selectedCategory,
    onCategoryPress,
    onCategorySelect,
    onBackStack,

    loading,
    payees,
    onMerchantSelect,

    handleSave,
  } as UseAddExpenseReturn & { payees: Payee[], onMerchantSelect: (p: Payee) => void };
}
