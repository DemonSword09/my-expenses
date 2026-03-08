import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useTheme from './useTheme';
import useExpenses from './useExpenses';
import { useSelectionMode } from './useSelectionMode';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { TransactionDetail, Category } from '../db/models';

import { useCsvExport } from './useCsvExport';

export function useExpenseListLogic() {
    const navigation = useNavigation();
    const { schemeColors, globalStyle, expenseListStyle } = useTheme();

    const {
        load,
        filter,
        filteredTransactions,
        loadLookups,
        payeesMap,
        transactions, // Needed for export (full list or filtered?) User likely wants filtered or all? Usually "Export" implies what's visible or all. Let's use filteredTransactions to respect user context.
        refresh,
        refreshing,
        setFilter,
        query,
        setQuery,
    } = useExpenses();

    const {
        selectionMode,
        selectedIds,
        toggleSelection,
        selectAll,
        clearSelection,
        startSelection,
        setSelectionMode,
    } = useSelectionMode<TransactionDetail>();

    const { exportToCsv, isExporting } = useCsvExport();

    // Local State
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [activeTransaction, setActiveTransaction] = useState<TransactionDetail | null>(null);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    // Bulk Edit State
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [payeePickerVisible, setPayeePickerVisible] = useState(false);
    const [pickerCategories, setPickerCategories] = useState<(Category & { children: Category[] })[]>([]);

    // Distinguish between picking for Bulk Edit or Filter
    const [pickerContext, setPickerContext] = useState<'bulk' | 'filter'>('bulk');

    // Handlers
    const openMenu = useCallback(() => setMenuVisible(true), []);
    const closeMenu = useCallback(() => setMenuVisible(false), []);

    const handleExport = useCallback(async () => {
        closeMenu();
        setExportModalVisible(true);
    }, [closeMenu]);

    const onExportConfirm = useCallback(async (delimiter: string, dateFormat: string) => {
        setExportModalVisible(false);
        // Export currently filtered transactions
        await exportToCsv(filteredTransactions, delimiter, dateFormat);
    }, [exportToCsv, filteredTransactions]);

    const handleImport = useCallback(async () => {
        closeMenu();
        navigation.navigate('ImportCsv' as never);
    }, [closeMenu, navigation]);

    const handleBulkCategory = useCallback(async (c: Category) => {
        try {
            await TransactionRepo.updateCategoryForMultiple(Array.from(selectedIds), c.id);
            setCategoryPickerVisible(false);
            clearSelection();
            refresh();
        } catch (err) {
            console.error('Bulk category update failed', err);
            Alert.alert('Error', 'Failed to update category');
        }
    }, [selectedIds, clearSelection, refresh]);

    const handleBulkPayee = useCallback(async (p: { id: string }) => {
        try {
            await TransactionRepo.updatePayeeForMultiple(Array.from(selectedIds), p.id);
            setPayeePickerVisible(false);
            clearSelection();
            refresh();
        } catch (err) {
            console.error('Bulk payee update failed', err);
            Alert.alert('Error', 'Failed to update payee');
        }
    }, [selectedIds, clearSelection, refresh]);

    const confirmBulkDelete = useCallback(() => {
        setBulkDeleteModalVisible(true);
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        try {
            await TransactionRepo.deleteMultiple(Array.from(selectedIds));
            await load();
            clearSelection();
            setBulkDeleteModalVisible(false);
        } catch (err) {
            console.error('Bulk delete failed', err);
            Alert.alert('Error', 'Failed to delete transactions.');
        }
    }, [selectedIds, load, clearSelection]);

    const loadPickerCategories = useCallback(async () => {
        try {
            const rows = await CategoryRepo.listHierarchy();
            setPickerCategories(rows);
        } catch (err) {
            console.error('ExpenseList: failed loading picker categories', err);
            setPickerCategories([]);
        }
    }, []);

    const openCategoryPicker = useCallback((context: 'bulk' | 'filter' = 'bulk') => {
        setPickerContext(context);
        loadPickerCategories();
        setCategoryPickerVisible(true);
    }, [loadPickerCategories]);

    const openPayeePicker = useCallback((context: 'bulk' | 'filter' = 'bulk') => {
        setPickerContext(context);
        setPayeePickerVisible(true);
    }, []);

    const onPickerCategoryPress = useCallback(async (cat: Category) => {
        if (pickerContext === 'filter') {
            setFilter({ ...filter, categoryId: cat.id });
            setCategoryPickerVisible(false);
            setFilterModalVisible(true); // Re-show filter modal if it was hidden or under? 
            // Note: If FilterModal is visible, CategoryPicker is on top.
        } else {
            handleBulkCategory(cat);
        }
    }, [pickerContext, filter, handleBulkCategory, setFilter]);

    const onPickerPayeePress = useCallback(async (payee: { id: string }) => {
        if (pickerContext === 'filter') {
            setFilter({ ...filter, payeeId: payee.id });
            setPayeePickerVisible(false);
            setFilterModalVisible(true);
        } else {
            handleBulkPayee(payee);
        }
    }, [pickerContext, filter, handleBulkPayee, setFilter]);

    const onRefresh = useCallback(async () => {
        refresh();
        if (selectionMode) {
            clearSelection();
        }
    }, [refresh, selectionMode, clearSelection]);

    const onOpenActions = useCallback((t: TransactionDetail) => {
        setActiveTransaction(t);
        setActionModalVisible(true);
    }, []);

    const handlePressItem = useCallback((t: TransactionDetail) => {
        if (selectionMode) {
            toggleSelection(t.id);
        } else {
            onOpenActions(t);
        }
    }, [selectionMode, toggleSelection, onOpenActions]);

    const handleLongPressItem = useCallback((t: TransactionDetail) => {
        if (!selectionMode) {
            startSelection(t.id);
        } else {
            toggleSelection(t.id);
        }
    }, [selectionMode, startSelection, toggleSelection]);

    const totalBalance = useMemo(() => {
        let bal = 0;
        filteredTransactions.forEach((t) => {
            const type = (t.transaction_type || 'EXPENSE').toUpperCase();
            if (type === 'EXPENSE') bal -= t.amount;
            else bal += t.amount;
        });
        return bal;
    }, [filteredTransactions]);

    const onDeleteOrVoid = useCallback(async (markVoid?: boolean) => {
        if (!activeTransaction) return;
        try {
            if (markVoid) {
                await TransactionRepo.update(activeTransaction.id, { deleted: 1 });
            } else {
                await TransactionRepo.delete(activeTransaction.id);
            }

            setConfirmModalVisible(false);
            setActionModalVisible(false);
            setActiveTransaction(null);
            onRefresh();
        } catch (err) {
            console.error('Delete/void failed', err);
            Alert.alert('Operation failed', 'Unable to delete/mark void the transaction.');
        }
    }, [activeTransaction, onRefresh]);

    return {
        navigation,
        schemeColors,
        globalStyle,
        expenseListStyle,
        load,
        loadLookups,
        filter,
        setFilter,
        query,
        setQuery,
        filteredTransactions,
        payeesMap,
        refreshing,
        onRefresh,
        selectionMode,
        selectedIds,
        toggleSelection,
        selectAll,
        clearSelection,
        startSelection,
        actionModalVisible,
        setActionModalVisible,
        activeTransaction,
        setActiveTransaction,
        confirmModalVisible,
        setConfirmModalVisible,
        bulkDeleteModalVisible,
        setBulkDeleteModalVisible,
        menuVisible,
        openMenu,
        closeMenu,
        handleExport,
        handleImport,
        exportModalVisible,
        setExportModalVisible,
        onExportConfirm,
        isExporting,
        categoryPickerVisible,
        setCategoryPickerVisible,
        payeePickerVisible,
        setPayeePickerVisible,
        pickerCategories,
        openCategoryPicker,
        openPayeePicker,
        onPickerCategoryPress,
        onPickerPayeePress,
        handleBulkPayee,
        confirmBulkDelete,
        handleBulkDeleteConfirm,
        handlePressItem,
        handleLongPressItem,
        totalBalance,
        onDeleteOrVoid,
        filterModalVisible,
        setFilterModalVisible
    };
}
