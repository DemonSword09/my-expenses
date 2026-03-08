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
    const { schemeColors, globalStyle, pickerModalStyle } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const styles = pickerModalStyle; // Alias

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
        <View style={styles.pickerHeader}>
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
                    <FlatList
                        data={ICON_CATEGORIES}
                        keyExtractor={item => item.title}
                        renderItem={({ item }: any) => (
                            <View style={styles.categorySection}>
                                <Text style={[styles.sectionTitle, { color: schemeColors.muted }]}>{item.title}</Text>
                                <View style={styles.gridContainer}>
                                    {item.data.map((icon: string) => (
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
