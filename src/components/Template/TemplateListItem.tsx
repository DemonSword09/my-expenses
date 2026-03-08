import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import type { Template } from '../../db/models';
import { format } from 'date-fns';
import RecurrenceCalendarModal from '../Recurrence/RecurrenceCalendarModal';

type Props = {
  item: Template;
  onPress?: () => void;
  onInstantiate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  categoryLabel?: string;
};

export default function TemplateListItem({
  item,
  onPress,
  onInstantiate,
  onEdit,
  onDelete,
  categoryLabel,
}: Props) {
  const { schemeColors, templateStyle } = useTheme();
  const styles = templateStyle;
  const tpl: any = item;
  const isRec = tpl.is_recurring === 1 || tpl.is_recurring === true;

  const tryParse = (json: string) => {
    try { return JSON.parse(json); } catch (e) { return {}; }
  };

  // Parse template JSON to get details
  const obj = tryParse(tpl.template_json);
  const amount = obj.amount || 0;
  const notes = obj.comment || '';
  const payeeName = obj.merchant || '';
  const categoryId = obj.categoryId || null;
  const type = obj.transaction_type;

  // Determine if income based on parsed type or amount sign
  // If type is present, use it. Else fall back to amount > 0
  const isIncome = type ? type === 'INCOME' : amount > 0;

  // If we want to show absolute amount with color:
  const displayAmount = Math.abs(amount);

  const [calendarVisible, setCalendarVisible] = React.useState(false);

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={onEdit} style={styles.itemContent}>
        <View style={styles.itemIconContainer}>
          <MaterialCommunityIcons
            name={isRec ? "calendar-sync" : "file-document-outline"}
            size={24}
            color={schemeColors.primary}
          />
        </View>

        <View style={styles.itemInfo}>
          <View style={styles.itemHeaderRow}>
            <Text style={styles.itemTitle}>
              {tpl.name} {isRec && tpl.human_readable ? `(${tpl.human_readable})` : ''}
            </Text>
            <Text style={isIncome ? styles.itemAmountIncome : styles.itemAmountExpense}>
              {amount !== 0 ? `${isIncome ? '+' : '-'}₹${displayAmount}` : ''}
            </Text>
          </View>

          <Text style={styles.itemDetails} numberOfLines={1}>
            {[
              categoryLabel,
              notes,
              payeeName
            ].filter(Boolean).join(' / ')}
          </Text>

          {isRec && (
            <Text style={styles.itemMeta}>
              Next: {tpl.next_date ? format(new Date(tpl.next_date), 'MMM d') : '—'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={schemeColors.danger} />
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        {isRec ? (
          <TouchableOpacity onPress={() => setCalendarVisible(true)} style={[styles.actionButton, { flex: 2 }]}>
            <Text style={styles.actionText}>Recurrences</Text>
            <MaterialCommunityIcons name="calendar-month" size={16} color={schemeColors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onInstantiate} style={[styles.actionButton, { flex: 2 }]}>
            <Text style={styles.actionText}>Use Template</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={schemeColors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}
      </View>

      {calendarVisible && (
        <RecurrenceCalendarModal
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          template={item}
          onUpdate={() => {
            // Optional: refresh list if needed
          }}
        />
      )}
    </View>
  );
}
