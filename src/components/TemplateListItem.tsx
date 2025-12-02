import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import type { Template } from '../db/models';
import { format } from 'date-fns';

type Props = {
  item: Template;
  onPress?: () => void;
  onInstantiate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function TemplateListItem({
  item,
  onPress,
  onInstantiate,
  onEdit,
  onDelete,
}: Props) {
  const { schemeColors } = useTheme();
  const tpl: any = item;
  const isRec = tpl.is_recurring === 1 || tpl.is_recurring === true;

  // Parse template JSON to get amount
  let amount = 0;
  try {
    const obj = JSON.parse(tpl.template_json);
    amount = obj.amount || 0;
  } catch (e) {
    // ignore
  }

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
            <Text style={[styles.title, { color: schemeColors.text }]}>{tpl.name}</Text>
            <Text style={[styles.amount, { color: schemeColors.text }]}>
              {amount > 0 ? `₹${amount}` : ''}
            </Text>
          </View>
          
          {tpl.description ? (
            <Text style={[styles.description, { color: schemeColors.muted }]} numberOfLines={1}>
              {tpl.description}
            </Text>
          ) : null}
          
          <Text style={[styles.meta, { color: schemeColors.muted }]}>
            {isRec
              ? `Next: ${tpl.next_date ? format(new Date(tpl.next_date), 'MMM d') : '—'}`
              : 'One-time template'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={[styles.actions, { borderTopColor: schemeColors.border }]}>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={schemeColors.danger} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: schemeColors.border }]} />
        
        <TouchableOpacity onPress={onInstantiate} style={[styles.actionButton, { flex: 2 }]}>
          <Text style={[styles.actionText, { color: schemeColors.primary }]}>Use Template</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={schemeColors.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
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
