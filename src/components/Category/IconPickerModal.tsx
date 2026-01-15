import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, FlatList, SectionList, Platform, KeyboardAvoidingView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { ICON_CATEGORIES } from '../../data/iconCategories';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSelect: (icon: string) => void;
    currentIcon?: string;
};

export default function IconPickerModal({ visible, onClose, onSelect, currentIcon }: Props) {
    const { schemeColors, globalStyle } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    // Attempt to get all icons. Fallback to empty if not found.
    const allIcons = useMemo(() => {
        const glyphMap = (MaterialCommunityIcons as any).glyphMap;
        if (glyphMap) {
            return Object.keys(glyphMap);
        }
        return [];
    }, []);

    const filteredIcons = useMemo(() => {
        if (!searchQuery) return [];
        const lower = searchQuery.toLowerCase();
        return allIcons.filter(icon => icon.toLowerCase().includes(lower));
    }, [searchQuery, allIcons]);

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: schemeColors.text }]}>Select Icon</Text>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="close" size={24} color={schemeColors.muted} />
                </TouchableOpacity>
            </View>
            <View style={[styles.searchContainer, { backgroundColor: schemeColors.bgMid }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={schemeColors.muted} style={{ marginLeft: 8 }} />
                <TextInput
                    style={[styles.input, { color: schemeColors.text }]}
                    placeholder="Search icons..."
                    placeholderTextColor={schemeColors.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle" size={16} color={schemeColors.muted} style={{ marginRight: 8 }} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderIconItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.iconItem,
                { backgroundColor: currentIcon === item ? schemeColors.primary : schemeColors.bgMid }
            ]}
            onPress={() => onSelect(item)}
        >
            <MaterialCommunityIcons
                name={item as any}
                size={32}
                color={currentIcon === item ? '#fff' : schemeColors.text}
            />
            <Text
                numberOfLines={1}
                style={[
                    styles.iconText,
                    { color: currentIcon === item ? schemeColors.textStrong : schemeColors.textMuted }
                ]}
            >
                {item}
            </Text>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <View style={[styles.sectionHeader, { backgroundColor: schemeColors.surface }]}>
            <Text style={[styles.sectionTitle, { color: schemeColors.muted }]}>{title}</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: schemeColors.surface }]}>
                {renderHeader()}

                {searchQuery ? (
                    <FlatList
                        data={filteredIcons}
                        renderItem={renderIconItem}
                        keyExtractor={item => item}
                        numColumns={4}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnWrapper}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: schemeColors.muted }}>No icons found</Text>
                            </View>
                        }
                    />
                ) : (
                    <SectionList
                        sections={ICON_CATEGORIES}
                        renderItem={({ item, index, section }) => {
                            // We want a grid layout within the section
                            // But SectionList renders items one by one.
                            // To make a grid, we need to group data or use a specific layout.
                            // Simpler: Just render items inline? 
                            // Actually, let's keep it simple: Render a flex wrap view for the section?
                            // Standard SectionList renders row by row.
                            // We can use a custom renderItem that renders nothing, and renderSectionFooter?
                            // No. 

                            // Let's restructure ICON_CATEGORIES to be SectionList friendly?
                            // Current structure: { title, data: [icon1, icon2...] }
                            // SectionList renders 'item' for each string in data.
                            // If we want a grid, we can't easily do it with standard SectionList unless we pre-chunk the data.
                            // Alternative: Render a custom component for each Section which is a View with flex-wrap.
                            // But SectionList expects 'data' to be array of items.

                            // Let's just use RenderItem. 
                            // But standard renderItem will stack them vertically.
                            // Fix: Use data as [[icon1, icon2...]] (array of arrays)? No.

                            // Better approach for Categories view:
                            // Just a ScrollView with mapped categories. We don't need virtualization for the curated list as it's small (~100 icons).
                            return null;
                        }}
                    // Wait, reusing SectionList for grid is tricky.
                    // I'll swap to a ScrollView for the categories view since it's small enough.
                    />
                )}

                {!searchQuery && (
                    <FlatList
                        data={ICON_CATEGORIES}
                        keyExtractor={item => item.title}
                        renderItem={({ item }) => (
                            <View style={styles.categorySection}>
                                <Text style={[styles.sectionTitle, { color: schemeColors.muted }]}>{item.title}</Text>
                                <View style={styles.gridContainer}>
                                    {item.data.map(icon => (
                                        <TouchableOpacity
                                            key={icon}
                                            style={[
                                                styles.iconItem,
                                                { backgroundColor: currentIcon === icon ? schemeColors.primary : schemeColors.bgMid }
                                            ]}
                                            onPress={() => onSelect(icon)}
                                        >
                                            <MaterialCommunityIcons
                                                name={icon as any}
                                                size={32}
                                                color={currentIcon === icon ? '#fff' : schemeColors.text}
                                            />
                                            <Text
                                                numberOfLines={1}
                                                style={[
                                                    styles.iconText,
                                                    { color: currentIcon === icon ? '#fff' : schemeColors.textMuted }
                                                ]}
                                            >
                                                {icon}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 16 : 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 8,
    },
    input: {
        flex: 1,
        height: '100%',
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    categorySection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    columnWrapper: {
        gap: 8,
        marginBottom: 8,
    },
    iconItem: {
        width: '23%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    iconText: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    sectionHeader: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
});
