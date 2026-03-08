import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Text, Button, Divider, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import useTheme from '../hooks/useTheme';
import { SPACING, RADIUS } from '../styles/theme';
import type { Category } from '../db/models';

export interface FilterState {
    dataset: 'all' | 'week' | 'month' | 'custom';
    startDate?: number;
    endDate?: number;
    categoryId?: string;
    payeeId?: string;
}

interface Props {
    visible: boolean;
    onDismiss: () => void;
    onApply: (filters: FilterState) => void;
    currentFilters: FilterState;
    onRequestsCategoryPick: () => void; // Parent handles opening the separate picker
    onRequestPayeePick: () => void;
    selectedCategoryLabel?: string;
    selectedPayeeName?: string;
}

export default function FilterModal({
    visible,
    onDismiss,
    onApply,
    currentFilters,
    onRequestsCategoryPick,
    onRequestPayeePick,
    selectedCategoryLabel,
    selectedPayeeName
}: Props) {
    const { schemeColors, globalStyle, actionModalStyle } = useTheme();

    // Local State
    const [dataset, setDataset] = useState<'all' | 'week' | 'month' | 'custom'>('all');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());

    // Sync state on open
    useEffect(() => {
        if (visible) {
            setDataset(currentFilters.dataset);
            if (currentFilters.startDate) setStartDate(new Date(currentFilters.startDate));
            if (currentFilters.endDate) setEndDate(new Date(currentFilters.endDate));
            else setEndDate(new Date());
        }
    }, [visible, currentFilters]);

    // Date Pickers
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const onStartChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) setStartDate(selectedDate);
    };

    const onEndChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) setEndDate(selectedDate);
    };

    const handleApply = () => {
        const result: FilterState = {
            dataset,
            categoryId: currentFilters.categoryId,
            payeeId: currentFilters.payeeId,
        };

        if (dataset === 'custom') {
            result.startDate = startDate.getTime();
            result.endDate = endDate.getTime();
        }

        onApply(result);
    };

    const handleClear = () => {
        setDataset('all');
        onApply({ dataset: 'all', categoryId: undefined, payeeId: undefined });
    };

    const styles = actionModalStyle;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onDismiss}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
                <View style={[styles.modalContainer, styles.card, { backgroundColor: schemeColors.surface }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Filters</Text>
                        <TouchableOpacity onPress={handleClear}>
                            <Text style={{ color: schemeColors.primary }}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>

                        {/* Time Range */}
                        <Text style={styles.sectionTitle}>Time Range</Text>
                        <View style={styles.chipRow}>
                            {['all', 'week', 'month', 'custom'].map((d: any) => (
                                <Chip
                                    key={d}
                                    selected={dataset === d}
                                    onPress={() => setDataset(d)}
                                    style={[styles.chip]}
                                    textStyle={{
                                        color: dataset === d ? schemeColors.primary : schemeColors.text,
                                        fontWeight: dataset === d ? '700' : '400'
                                    }}
                                    selectedColor={schemeColors.primary}
                                    showSelectedOverlay
                                >
                                    {d === 'all' ? 'All Time' : d === 'week' ? 'Last 7 Days' : d === 'month' ? 'Last 30 Days' : 'Custom'}
                                </Chip>
                            ))}
                        </View>

                        {/* Custom Date Pickers */}
                        {dataset === 'custom' && (
                            <View style={styles.dateRow}>
                                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
                                    <Text style={styles.label}>From</Text>
                                    <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                                <Ionicons name="arrow-forward" size={16} color={schemeColors.textMuted} style={{ marginTop: 18 }} />
                                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
                                    <Text style={styles.label}>To</Text>
                                    <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(showStartPicker) && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={onStartChange}
                                maximumDate={new Date()}
                            />
                        )}
                        {(showEndPicker) && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                onChange={onEndChange}
                                maximumDate={new Date()}
                            />
                        )}

                        <Divider style={styles.divider} />

                        {/* Category */}
                        <Text style={styles.sectionTitle}>Detailed Filters</Text>

                        <TouchableOpacity style={styles.selectorRow} onPress={onRequestsCategoryPick}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="pricetag-outline" size={20} color={schemeColors.textMuted} />
                                <Text style={styles.selectorLabel}>Category</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={currentFilters.categoryId ? styles.valueActive : styles.valuePlaceholder}>
                                    {currentFilters.categoryId ? (selectedCategoryLabel || 'Selected') : 'Any'}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={schemeColors.textMuted} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.selectorRow} onPress={onRequestPayeePick}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="person-outline" size={20} color={schemeColors.textMuted} />
                                <Text style={styles.selectorLabel}>Payee</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={currentFilters.payeeId ? styles.valueActive : styles.valuePlaceholder}>
                                    {currentFilters.payeeId ? (selectedPayeeName || 'Selected') : 'Any'}
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={schemeColors.textMuted} />
                            </View>
                        </TouchableOpacity>

                    </ScrollView>

                    <Button mode="contained" onPress={handleApply} style={styles.applyBtn} buttonColor={schemeColors.primary}>
                        Show Results
                    </Button>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}
