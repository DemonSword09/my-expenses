// src/components/ExpenseListItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Transaction, Category } from '../db/models';
import { format } from 'date-fns';
import useTheme from '../hooks/useTheme';
import { formatColorValue } from '../utils/colors';

export interface ExpenseListItemProps {
  item: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
  isCompact?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
}

/**
 * ExpenseListItem - small, theme-aware row component for an expense.
 * Uses useTheme() so colors/spacings are centralized.
 */
export default function ExpenseListItem({
  item,
  onPress,
  onLongPress,
  isCompact = false,
  selectionMode = false,
  isSelected = false,
}: ExpenseListItemProps) {
  const { schemeColors, expenseListStyle } = useTheme();

  // Attempt to resolve category info if available in item.category (some codebases attach resolved)
  const category = (item as any).__category as Category | undefined | null; // optional attached prop
  const heading =
    ((item as any).__heading as string | undefined) ??
    (category ? (category.label ?? (category as any).name) : 'Uncategorized');
  const payeeName = ((item as any).__payeeName as string | undefined) ?? '';

  const date = new Date(item.createdAt);
  const notes = item.comment ?? '';
  const subHeading =
    notes && payeeName ? `${notes} / ${payeeName}` : notes ? notes : payeeName ? payeeName : '';

  const isIncome = (item.transaction_type ?? '').toUpperCase() === 'INCOME';
  const amountSign = isIncome ? '+' : '-';
  const amountColor = isIncome ? schemeColors.success : schemeColors.danger;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[
        expenseListStyle.itemContainer,
        item.deleted ? { opacity: 0.6 } : { opacity: 1 },
        isCompact ? { paddingVertical: 8 } : undefined,
      ]}
    >
      {item.deleted ? <View style={expenseListStyle.deletedLine} /> : null}

      {/* Selection Checkbox */}
      {selectionMode && (
        <View style={{ marginRight: 12, justifyContent: 'center' }}>
          <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={isSelected ? schemeColors.primary : schemeColors.muted}
          />
        </View>
      )}

      <View style={expenseListStyle.categoryRight}>
        {category?.icon ? (
          <MaterialCommunityIcons
            name={category.icon as any}
            size={22}
            color={formatColorValue(category.color, schemeColors.primary)}
          />
        ) : (
          <View style={expenseListStyle.catFallback}>
            <Text style={expenseListStyle.catFallbackText}>
              {heading ? heading.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
        )}
      </View>

      <View style={expenseListStyle.itemBody}>
        <Text style={expenseListStyle.itemTitle} numberOfLines={1}>
          {heading}
        </Text>
        <Text style={expenseListStyle.itemSubtitle} numberOfLines={1}>
          {subHeading || '—'}
        </Text>
      </View>

      <View style={expenseListStyle.itemRight}>
        <Text style={[expenseListStyle.itemAmount, { color: amountColor }]}>
          {`${amountSign}${formatCurrency(item.amount)}`}
        </Text>
        <Text style={expenseListStyle.itemDate}>{format(date, 'PP')}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* Local helper kept small so component is self-contained */
function formatCurrency(amount: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
