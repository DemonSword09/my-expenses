import { useState, useCallback, useEffect } from 'react';
import { LayoutAnimation, Alert, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import type { Category } from '../db/models';
import { useAppData } from '../context/AppDataProvider';


export type CategoryNode = Category & { children: Category[] };

export function useCategoryListLogic() {
    const navigation = useNavigation();
    const { refreshData } = useAppData();

    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Edit Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNode, setEditingNode] = useState<Category | null>(null);
    const [parentForNew, setParentForNew] = useState<Category | null>(null); // If adding subcategory
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const loadCategories = useCallback(async () => {
        try {
            const hierarchy = await CategoryRepo.listHierarchy();
            setCategories(hierarchy);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const toggleExpand = useCallback((id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const openCreate = useCallback((parent: Category | null = null) => {
        setEditingNode(null);
        setParentForNew(parent);
        setModalMode('create');
        setModalVisible(true);
    }, []);

    const openEdit = useCallback((cat: Category) => {
        setEditingNode(cat);
        setParentForNew(null);
        setModalMode('edit');
        setModalVisible(true);
    }, []);

    const handleSave = useCallback(async (label: string, icon: string, color: string) => {
        try {
            if (modalMode === 'create') {
                await CategoryRepo.create({
                    label,
                    icon,
                    color,
                    parentId: parentForNew?.id || null
                });
            } else if (editingNode) {
                await CategoryRepo.update(editingNode.id, {
                    label,
                    icon,
                    color
                });
            }
            await loadCategories();
            await refreshData();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to save category');
        }
    }, [modalMode, editingNode, parentForNew, loadCategories, refreshData]);

    const handleDelete = useCallback((cat: Category) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${cat.label}"? All transactions will be unlinked.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await CategoryRepo.delete(cat.id);
                            await loadCategories();
                            await refreshData();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete category');
                        }
                    }
                }
            ]
        );
    }, [loadCategories, refreshData]);

    return {
        navigation,
        categories,
        expandedIds,
        toggleExpand,
        modalVisible,
        setModalVisible,
        editingNode,
        parentForNew,
        modalMode,
        openCreate,
        openEdit,
        handleSave,
        handleDelete,
        loadCategories
    };
}
