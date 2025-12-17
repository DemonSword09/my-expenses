import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import type { Template } from '../db/models';
import { format } from 'date-fns';
import RecurrenceCalendarModal from './RecurrenceCalendarModal';

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
  const { schemeColors } = useTheme();
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
  // const [categoryLabel, setCategoryLabel] = React.useState(''); // Removed internal state

  // Removed useEffect for fetching category

  return (
    <View style={[styles.container, { backgroundColor: schemeColors.surface }]}>
      <TouchableOpacity onPress={onEdit} style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: schemeColors.background }]}>
          <MaterialCommunityIcons 
            name={isRec ? "calendar-sync" : "file-document-outline"} 
            size={24} 
            color={schemeColors.primary} 
          />
        </View>
        
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: schemeColors.text }]}>
              {tpl.name} {isRec && tpl.human_readable ? `(${tpl.human_readable})` : ''}
            </Text>
            <Text style={[styles.amount, { color: isIncome ? schemeColors.success : schemeColors.danger }]}>
              {amount !== 0 ? `${isIncome ? '+' : '-'}₹${displayAmount}` : ''}
            </Text>
          </View>
          
          <Text style={[styles.details, { color: schemeColors.muted }]} numberOfLines={1}>
            {[
              categoryLabel,
              notes,
              payeeName
            ].filter(Boolean).join(' / ')}
          </Text>
          
          {isRec && (
            <Text style={[styles.meta, { color: schemeColors.muted }]}>
              Next: {tpl.next_date ? format(new Date(tpl.next_date), 'MMM d') : '—'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={[styles.actions, { borderTopColor: schemeColors.border }]}>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={schemeColors.danger} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: schemeColors.border }]} />
        
        {isRec ? (
          <TouchableOpacity onPress={() => setCalendarVisible(true)} style={[styles.actionButton, { flex: 2 }]}>
            <Text style={[styles.actionText, { color: schemeColors.primary }]}>Recurrences</Text>
            <MaterialCommunityIcons name="calendar-month" size={16} color={schemeColors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onInstantiate} style={[styles.actionButton, { flex: 2 }]}>
            <Text style={[styles.actionText, { color: schemeColors.primary }]}>Use Template</Text>
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
             // Optional: refresh list if needed, but maybe not strictly required if we only care about transactions list
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    fontSize: 14,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: '100%',
  },
});
