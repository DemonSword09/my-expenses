import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TransactionDetail } from '../../db/models';
import { format } from 'date-fns';
import useTheme from '../../hooks/useTheme';
import { formatColorValue } from '../../utils/colors';

export interface ExpenseListItemProps {
  item: TransactionDetail;
  onPress?: (item: TransactionDetail, measurement?: { x: number; y: number; width: number; height: number }) => void;
  onLongPress?: (item: TransactionDetail, measurement?: { x: number; y: number; width: number; height: number }) => void;
  isCompact?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
}

const ExpenseListItem = React.memo(({
  item,
  onPress,
  onLongPress,
  isCompact = false,
  selectionMode = false,
  isSelected = false,
}: ExpenseListItemProps) => {
  const { schemeColors, expenseListStyle } = useTheme();
  const itemRef = React.useRef<View>(null);

  // Logic extracted from item properties safely
  const categoryLabel = item.category_label ?? 'Uncategorized';
  const parentLabel = item.category_parent_label;
  const heading = parentLabel ? `${parentLabel} > ${categoryLabel}` : categoryLabel;

  const payeeName = item.payee_name ?? '';
  const date = new Date(item.createdAt);
  const notes = item.comment ?? '';

  // Construct subheading
  const subHeading = notes && payeeName
    ? `${notes} / ${payeeName}`
    : (notes || payeeName || '');

  const isIncome = (item.transaction_type ?? '').toUpperCase() === 'INCOME';
  const amountSign = isIncome ? '+' : '-';
  const amountColor = isIncome ? schemeColors.success : schemeColors.danger;

  const handlePress = () => {
    if (onPress && itemRef.current) {
      itemRef.current.measureInWindow((x, y, width, height) => {
        onPress(item, { x, y, width, height });
      });
    } else {
      onPress?.(item);
    }
  };

  const handleLongPress = () => {
    if (onLongPress && itemRef.current) {
      itemRef.current.measureInWindow((x, y, width, height) => {
        onLongPress(item, { x, y, width, height });
      });
    } else {
      onLongPress?.(item);
    }
  };

  return (
    <View ref={itemRef} collapsable={false}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
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
          {item.category_icon ? (
            <MaterialCommunityIcons
              name={item.category_icon as any}
              size={24}
              color={formatColorValue(item.category_color, schemeColors.primary)}
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
            {`${amountSign}${formatCurrency(Math.abs(item.amount))}`}
          </Text>
          <Text style={expenseListStyle.itemDate}>{format(date, 'PP')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
});

export default ExpenseListItem;

/* Local helper kept small so component is self-contained */
const CURRENCY_FORMATTER = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' });
function formatCurrency(amount: number) {
  try {
    return CURRENCY_FORMATTER.format(amount);
  } catch {
    return `${amount.toFixed(2)} INR`;
  }
}
