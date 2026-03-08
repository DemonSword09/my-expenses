// src/screens/DistributionScreen.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, FlatList } from 'react-native';
import { Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDistributionLogic, CategoryNode } from '../hooks/useDistributionLogic';
import { SHADOWS, RADIUS, SPACING } from '../styles/theme';
import { DonutChart } from '../components/common/DonutChart';
import useTheme from '../hooks/useTheme';



// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

// Accordion Item Component
const DistributionItem = ({
    item,
    color,
    schemeColors,
    isSelected,
    isExpanded,
    onToggleExpand,
    onSelect,
    styles
}: {
    item: CategoryNode,
    color: string,
    schemeColors: any,
    isSelected: boolean,
    isExpanded: boolean,
    onToggleExpand: () => void,
    onSelect: () => void,
    styles: any
}) => {
    const hasChildren = item.children && item.children.length > 0;

    return (
        <View style={[
            styles.itemContainer,
            { borderBottomColor: schemeColors.border, borderBottomWidth: 1 },
            isSelected && { backgroundColor: schemeColors.bgMid + '40', borderRadius: 8, marginVertical: 4, borderBottomWidth: 0 }
        ]}>
            {/* Parent Row */}
            <TouchableOpacity
                onPress={() => {
                    onSelect();
                    onToggleExpand();
                }}
                activeOpacity={0.7}
                style={[styles.itemHeader, isSelected && { paddingHorizontal: 8 }]}
            >
                <View style={[styles.colorDot, { backgroundColor: color }]} />

                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.itemName, { color: schemeColors.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.itemPercent, { color: schemeColors.muted }]} numberOfLines={1}>
                        {item.percentage.toFixed(1)}%
                    </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.itemAmount, { color: schemeColors.text }]}>
                        {formatCurrency(item.amount)}
                    </Text>
                    {hasChildren && (
                        <MaterialCommunityIcons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={schemeColors.muted}
                        />
                    )}
                </View>
            </TouchableOpacity>

            {/* Children List */}
            {isExpanded && hasChildren && (
                <View style={[styles.childrenContainer, { backgroundColor: schemeColors.bgMid }]}>
                    {item.children.map((child: any) => (
                        <ChildRow
                            key={child.id}
                            item={child}
                            schemeColors={schemeColors}
                            isSelected={false}
                            onPress={() => { }} // Children selection not implemented in parent logic yet heavily
                            styles={styles}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

// Extracted Child Row
const ChildRow = ({ item, schemeColors, isSelected, onPress, styles }: any) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.childRow,
            isSelected && { backgroundColor: schemeColors.highlight, borderRadius: 6, marginVertical: 2 }
        ]}
    >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.childDot, { backgroundColor: schemeColors.muted }]} />
            <Text style={[styles.childName, { color: schemeColors.text }]} numberOfLines={1}>
                {item.name}
            </Text>
        </View>
        <Text style={[styles.childAmount, { color: schemeColors.text }]}>
            {formatCurrency(item.amount)}
        </Text>
    </TouchableOpacity>
);

export default function DistributionScreen() {
    const {
        schemeColors,
        globalStyle,
        navigation,
        filter,
        setFilter,
        chartData: topLevelChartData,
        listData,
        totalExpense
    } = useDistributionLogic();

    const { distributionStyle } = useTheme();
    const styles = distributionStyle;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Derived Chart Data: If expanded, show children. Else show Top Level.
    const activeChartData = useMemo(() => {
        if (expandedId) {
            const parent = listData.find(n => n.id === expandedId);
            if (parent && parent.children.length > 0) {
                // Map children to chart data format
                const totalChildren = parent.children.reduce((acc, c) => acc + c.amount, 0);

                // Palette for subcategories
                const SUB_PALETTE = [
                    '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C',
                    '#2EC4B6', '#E71D36', '#7209B7', '#3B8EA5', '#F49D37'
                ];

                return parent.children.map((child, index) => ({
                    id: child.id,
                    name: child.name,
                    amount: child.amount,
                    color: SUB_PALETTE[index % SUB_PALETTE.length], // distinct color
                    percentage: (child.amount / totalChildren) * 100
                })).sort((a, b) => b.amount - a.amount);
            }
        }
        return topLevelChartData;
    }, [expandedId, listData, topLevelChartData, schemeColors]);

    // Derived Center Value
    const activeTotal = useMemo(() => {
        if (expandedId) {
            const parent = listData.find(n => n.id === expandedId);
            return parent ? parent.amount : 0;
        }
        return totalExpense;
    }, [expandedId, listData, totalExpense]);

    const activeLabel = expandedId ? (listData.find(n => n.id === expandedId)?.name || 'Category') : 'Total Spent';

    // Handle Selection (Chart Tap)
    const handleChartSelect = (id: string | null) => {
        setSelectedId(id);
    };

    // Handle Expand Toggle
    const handleToggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedId === id) {
            setExpandedId(null); // Collapse
        } else {
            setExpandedId(id); // Expand (and auto-collapse others)
            setSelectedId(null); // Reset selection when switching context
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
            {/* Fixed Top Section */}
            <View style={{ backgroundColor: schemeColors.background, zIndex: 10 }}>
                <Appbar.Header style={{ backgroundColor: schemeColors.surface, elevation: 0 }}>
                    <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
                    <Appbar.Content title="Analysis" titleStyle={{ color: schemeColors.text, fontWeight: 'bold' }} />
                </Appbar.Header>

                {/* Filters */}
                <View style={[globalStyle.filtersRow, { paddingTop: 8, paddingBottom: 16 }]}>
                    {(['all', 'week', 'month'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter((prev) => ({ ...prev, dataset: f }))}
                            style={[
                                globalStyle.filterPill,
                                filter.dataset === f ? globalStyle.filterPillActive : undefined,
                            ]}
                        >
                            <Text
                                style={[
                                    globalStyle.filterText,
                                    filter.dataset === f ? globalStyle.filterTextActive : undefined,
                                ]}
                            >
                                {f === 'all' ? 'All' : f === 'week' ? '7 Days' : '30 Days'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Donut Chart Area */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                        {/* Dynamic Total Label */}
                        <Text style={[styles.totalLabel, { color: schemeColors.muted }]}>{activeLabel}</Text>
                        <Text style={[styles.totalValue, { color: schemeColors.text, fontSize: 24 }]}>
                            {formatCurrency(activeTotal)}
                        </Text>
                    </View>

                    {activeChartData.length > 0 ? (
                        <DonutChart
                            data={activeChartData}
                            radius={90}
                            innerRadius={60}
                            selectedId={selectedId}
                            onSelect={handleChartSelect}
                            schemeColors={schemeColors}
                        />
                    ) : (
                        <View style={{ height: 180, justifyContent: 'center' }}>
                            <Text style={{ color: schemeColors.muted }}>No Data</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Scrollable List Section */}
            <View style={[styles.listContainer, { backgroundColor: schemeColors.surface, flex: 1 }]}>
                <Text style={[styles.listTitle, { color: schemeColors.muted, marginTop: 24 }]}>
                    {expandedId ? 'Breakdown' : 'Top Categories'}
                </Text>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {listData.map((item) => {
                        const isExpanded = expandedId === item.id;
                        return (
                            <View key={item.id} style={[
                                styles.itemContainer,
                                { borderBottomColor: schemeColors.border, borderBottomWidth: 1 },
                                (selectedId === item.id && !isExpanded) && { backgroundColor: schemeColors.bgMid + '60', borderRadius: 8, marginVertical: 4, borderBottomWidth: 0 }
                            ]}>
                                {/* Parent Header */}
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedId(item.id);
                                        handleToggleExpand(item.id);
                                    }}
                                    activeOpacity={0.7}
                                    style={[styles.itemHeader, (selectedId === item.id && !isExpanded) && { paddingHorizontal: 8 }]}
                                >
                                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={[styles.itemName, { color: schemeColors.text }]} numberOfLines={1}>{item.name}</Text>
                                        <Text style={[styles.itemPercent, { color: schemeColors.muted }]}>{item.percentage.toFixed(1)}%</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.itemAmount, { color: schemeColors.text }]}>{formatCurrency(item.amount)}</Text>
                                        {item.children && item.children.length > 0 && (
                                            <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={schemeColors.muted} />
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {/* Children */}
                                {isExpanded && item.children && (
                                    <View style={[styles.childrenContainer, { backgroundColor: schemeColors.bgMid }]}>
                                        {item.children.map(child => (
                                            <ChildRow
                                                key={child.id}
                                                item={child}
                                                schemeColors={schemeColors}
                                                isSelected={selectedId === child.id}
                                                onPress={() => {
                                                    setSelectedId(child.id);
                                                }}
                                                styles={styles}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );
}
