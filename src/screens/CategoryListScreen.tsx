// src/screens/CategoryListScreen.tsx
import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import useTheme from '../hooks/useTheme';
import EditCategoryModal from '../components/Category/EditCategoryModal';
import CategoryListItem from '../components/Category/CategoryListItem';
import { useCategoryListLogic, CategoryNode } from '../hooks/useCategoryListLogic';

export default function CategoryListScreen() {
    const { schemeColors, globalStyle } = useTheme();
    const {
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
    } = useCategoryListLogic();

    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [loadCategories])
    );

    const renderItem = useCallback(({ item }: { item: CategoryNode }) => {
        return (
            <CategoryListItem
                item={item}
                isExpanded={expandedIds.has(item.id)}
                schemeColors={schemeColors}
                onToggleExpand={toggleExpand}
                onEdit={openEdit}
                onDelete={handleDelete}
                onCreateSub={openCreate}
            />
        );
    }, [expandedIds, schemeColors, toggleExpand, openEdit, handleDelete, openCreate]);

    return (
        <View style={globalStyle.container}>
            <Appbar.Header style={{ backgroundColor: schemeColors.surface, elevation: 0 }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
                <Appbar.Content title="Categories" titleStyle={{ color: schemeColors.text, fontWeight: '700' }} />
                <Appbar.Action icon="plus" onPress={() => openCreate(null)} color={schemeColors.primary} />
            </Appbar.Header>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />

            <EditCategoryModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSave}
                mode={modalMode}
                initialLabel={editingNode?.label}
                initialIcon={editingNode?.icon ?? undefined}
                initialColor={(editingNode?.color as unknown as string) ?? undefined}
                parentLabel={parentForNew?.label}
            />
        </View>
    );
}

