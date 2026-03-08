import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { FilterState } from '../../components/FilterModal';
import type { TransactionDetail } from '../../db/models';

interface Props {
    selectionMode: boolean;
    selectedCount: number;
    totalBalance: number;
    query: string;
    setQuery: (txt: string) => void;
    filter: FilterState;
    setFilter: (f: FilterState) => void;
    schemeColors: any;
    globalStyle: any;
    styles: any;
    onClearSelection: () => void;
    onSelectAll: () => void;
    onOpenCategoryPicker: () => void;
    onOpenPayeePicker: () => void;
    onConfirmBulkDelete: () => void;
    onOpenMenu: () => void;
    onOpenFilters: () => void;
}

const ExpenseListHeader = ({
    selectionMode,
    selectedCount,
    totalBalance,
    query,
    setQuery,
    filter,
    setFilter,
    schemeColors,
    globalStyle,
    styles,
    onClearSelection,
    onSelectAll,
    onOpenCategoryPicker,
    onOpenPayeePicker,
    onConfirmBulkDelete,
    onOpenMenu,
    onOpenFilters,
}: Props) => {
    const navigation = useNavigation();

    return (
        <>
            <Appbar.Header style={styles.header}>
                {selectionMode ? (
                    <>
                        <Appbar.Action icon="close" onPress={onClearSelection} color={schemeColors.text} />
                        <Appbar.Content
                            title={`${selectedCount} selected`}
                            titleStyle={styles.headerTitleSelected}
                        />
                        <Appbar.Action icon="checkbox-multiple-marked-outline" onPress={onSelectAll} color={schemeColors.primary} />
                        <Appbar.Action icon="tag-multiple" onPress={onOpenCategoryPicker} color={schemeColors.primary} />
                        <Appbar.Action icon="account-multiple" onPress={onOpenPayeePicker} color={schemeColors.primary} />
                        <Appbar.Action icon="trash-can-outline" onPress={onConfirmBulkDelete} color={schemeColors.danger} />
                    </>
                ) : (
                    <>
                        <Appbar.Action icon="menu" color={schemeColors.primary} onPress={() => { }} />
                        <Appbar.Content
                            title={
                                <View>
                                    <Text style={styles.headerTitleText}>
                                        Expenses
                                    </Text>
                                    <Text
                                        style={[styles.headerBalanceText, { color: totalBalance < 0 ? schemeColors.danger : schemeColors.success }]}
                                    >
                                        {' '}
                                        ₹{totalBalance.toFixed(2)}
                                    </Text>
                                </View>
                            }
                        />
                        <Appbar.Action
                            color={schemeColors.primary}
                            icon="bookmark-multiple"
                            onPress={() => navigation.navigate('Templates' as never)}
                        />
                        <Appbar.Action color={schemeColors.primary} icon="dots-vertical" onPress={onOpenMenu} />
                    </>
                )}
            </Appbar.Header>

            <View style={globalStyle.searchBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                        placeholder="Search payee, category, notes"
                        placeholderTextColor={schemeColors.muted}
                        value={query}
                        onChangeText={setQuery}
                        style={[globalStyle.searchInput, { flex: 1, marginRight: 8 }]}
                    />
                    <TouchableOpacity
                        onPress={onOpenFilters}
                        style={{
                            width: 44,
                            height: 44,
                            backgroundColor: (filter.dataset !== 'all' || filter.categoryId || filter.payeeId) ? schemeColors.primary : schemeColors.surface,
                            borderRadius: 22,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 10, // Match searchInput margin
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2
                        }}
                    >
                        <Appbar.Action icon="filter-variant" size={20} color={(filter.dataset !== 'all' || filter.categoryId || filter.payeeId) ? '#fff' : schemeColors.primary} style={{ margin: 0 }} onPress={onOpenFilters} />
                    </TouchableOpacity>
                </View>

                <View style={globalStyle.filtersRow}>
                    {/* Quick Filters - Map to dataset presets */}
                    {(['all', 'week', 'month'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter({ ...filter, dataset: f })}
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
                                {f === 'all' ? 'All' : f === 'week' ? 'Last 7d' : 'Last 30d'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </>
    );
};

export default React.memo(ExpenseListHeader);
