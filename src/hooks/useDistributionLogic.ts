import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import useTheme from './useTheme';
import useExpenses from './useExpenses';
import { formatColorValue } from '../utils/colors';

// High contrast palette for top categories
const CHART_PALETTE = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#1A535C', // Dark Teal
    '#FF9F1C', // Orange
    '#2EC4B6', // Cyan
    '#E71D36', // Dark Red
    '#7209B7', // Purple
];

export interface CategoryNode {
    id: string;
    name: string;
    amount: number;
    color: string;
    percentage: number;
    children: CategoryNode[];
    isOther?: boolean;
}

export function useDistributionLogic() {
    const { schemeColors, globalStyle } = useTheme();
    const navigation = useNavigation();
    const { filteredTransactions, filter, setFilter } = useExpenses();

    // 1. Process Data: Hierarchy & Aggregation
    const { chartData, listData, totalExpense } = useMemo(() => {
        const parentMap = new Map<string, CategoryNode>();
        let total = 0;

        // Grouping
        filteredTransactions.forEach((t) => {
            if (t.transaction_type !== 'EXPENSE') return;

            const amt = Math.abs(t.amount || 0);
            if (isNaN(amt) || amt <= 0.01) return;

            total += amt;

            // Determine Parent
            const parentId = t.category_parent_id ?? t.categoryId ?? 'uncategorized';
            const parentLabel = t.category_parent_label ?? t.category_label ?? 'Uncategorized';
            // Use parent color if available, else random from palette later? 
            // Better to rely on Palette for Chart, but List can use category color.
            // Let's store category color for list.
            const catColor = t.category_color ? formatColorValue(t.category_color, schemeColors.primary) : schemeColors.muted;

            if (!parentMap.has(parentId)) {
                parentMap.set(parentId, {
                    id: parentId,
                    name: parentLabel,
                    amount: 0,
                    color: catColor, // Initial placeholder
                    percentage: 0,
                    children: []
                });
            }

            const parentNode = parentMap.get(parentId)!;
            parentNode.amount += amt;

            // Determine Child (if strictly a child)
            if (t.category_parent_id) { // It has a parent, so t.categoryId is the child
                const childId = t.categoryId ?? 'unknown';
                const childLabel = t.category_label ?? 'Unknown';

                let childNode = parentNode.children.find(c => c.id === childId);
                if (!childNode) {
                    childNode = {
                        id: childId,
                        name: childLabel,
                        amount: 0,
                        color: catColor,
                        percentage: 0,
                        children: []
                    };
                    parentNode.children.push(childNode);
                }
                childNode.amount += amt;
            }
        });

        // Convert Map to Array & Calc Percentages
        let allCategories = Array.from(parentMap.values()).map(node => {
            node.percentage = total > 0 ? (node.amount / total) * 100 : 0;
            // Sort children by amount desc
            node.children.sort((a, b) => b.amount - a.amount);
            return node;
        });

        // Sort Parents by amount desc
        allCategories.sort((a, b) => b.amount - a.amount);

        // --- Chart Data Preparation (Top 5 + Others) ---
        const TOP_N = 5;
        const topCategories = allCategories.slice(0, TOP_N);
        const otherCategories = allCategories.slice(TOP_N);

        const finalChartData = topCategories.map((node, index) => ({
            ...node,
            color: CHART_PALETTE[index % CHART_PALETTE.length], // Assign distinct palette color
            legendFontColor: schemeColors.text,
            legendFontSize: 12,
            population: node.amount // for chart kit
        }));

        if (otherCategories.length > 0) {
            const otherTotal = otherCategories.reduce((sum, n) => sum + n.amount, 0);
            const otherPercent = total > 0 ? (otherTotal / total) * 100 : 0;

            finalChartData.push({
                id: 'others',
                name: 'Others',
                amount: otherTotal,
                color: schemeColors.muted, // Grey for others
                percentage: otherPercent,
                children: otherCategories, // Others contains the rest as children? No, structure mismatch.
                // Actually 'Others' in chart shouldn't be expandable in the same way, or maybe it expands to show the list?
                // For the LIST below, user wants full breakdown. 
                // The CHART "Others" is just visual.
                isOther: true,
                legendFontColor: schemeColors.text,
                legendFontSize: 12,
                population: otherTotal,
            } as any);
        }

        // --- List Data ---
        // The list should show ALL categories (parents), sorted.
        // We will Apply the same colors as the chart to the Top 5, and others get their natural color or a fallback?
        // To match the chart, Top 5 should probably use the palette color in the list too.

        const finalListData = allCategories.map((node, index) => {
            if (index < TOP_N) {
                return { ...node, color: CHART_PALETTE[index % CHART_PALETTE.length] };
            }
            return node; // Keep original color for items in "Others" zone or give them uniform?
            // User said "Reuse colors only after grouping small categories."
            // Let's keep original category colors for those not in Top 5, or use a neutral.
        });

        return {
            chartData: finalChartData,
            listData: finalListData,
            totalExpense: total
        };

    }, [filteredTransactions, schemeColors]);

    return {
        schemeColors,
        globalStyle,
        navigation,
        filter,
        setFilter,
        chartData,
        listData,
        totalExpense
    };
}
