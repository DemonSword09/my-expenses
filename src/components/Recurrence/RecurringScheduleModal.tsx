import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import useTheme from '../../hooks/useTheme';
import useTemplates from '../../hooks/useTemplates';
import { TransactionRepo } from '../../db/repositories/TransactionRepo';
import { format } from 'date-fns';
import SkeletonItem from './RecurringScheduleSkeleton';

interface RecurringScheduleModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ScheduleItem {
  date: Date;
  templateName: string;
  amount: number;
  status: 'executed' | 'missed' | 'pending';
  templateId: string;
  transactionId?: string;
  recurringRuleId?: string;
  templateJson?: string;
}

export default function RecurringScheduleModal({ visible, onClose }: RecurringScheduleModalProps) {
  const { schemeColors, recurrenceStyle } = useTheme();
  const { getRecurringSchedule } = useTemplates();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Action state
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSchedule();
    }
  }, [visible]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 7);

      const end = new Date(now);
      end.setDate(end.getDate() + 7);

      const data = await getRecurringSchedule(start, end);
      setSchedule(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: ScheduleItem) => {
    setSelectedItem(item);
    setActionModalVisible(true);
  };

  const handleAction = async (action: 'apply_save' | 'reset') => {
    if (!selectedItem) return;
    setActionModalVisible(false);

    // Optimistic Update Helpers
    const updateStatus = (newStatus: 'executed' | 'missed' | 'pending', txnId?: string) => {
      setSchedule(prev => prev.map(item => {
        // Match by templateId and date (composite key)
        if (item.templateId === selectedItem.templateId && item.date.getTime() === selectedItem.date.getTime()) {
          return { ...item, status: newStatus, transactionId: txnId };
        }
        return item;
      }));
    };

    try {
      if (action === 'apply_save') {
        if (!selectedItem.templateJson) return;
        const tplJson = JSON.parse(selectedItem.templateJson);

        // Resolve payee
        let finalPayeeId = tplJson.payeeId;
        if (!finalPayeeId && tplJson.merchant) {
          const p = await TransactionRepo.addPayee({ name: tplJson.merchant });
          finalPayeeId = p.id;
        }

        const payload = {
          ...tplJson,
          createdAt: selectedItem.date.getTime(),
          updatedAt: Date.now(),
          recurring_rule_id: selectedItem.recurringRuleId,
          payeeId: finalPayeeId,
        };

        const newTxn = await TransactionRepo.create(payload);
        // Optimistic update: set to executed
        updateStatus('executed', newTxn.id);

      } else if (action === 'reset') {
        if (selectedItem.transactionId) {
          await TransactionRepo.delete(selectedItem.transactionId);
          // Optimistic update: revert to missed or pending
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const isPast = selectedItem.date < todayStart;
          updateStatus(isPast ? 'missed' : 'pending', undefined);
        }
      }
    } catch (err) {
      console.error('Action failed', err);
      Alert.alert('Error', 'Operation failed');
      // reload on error to ensure consistency
      loadSchedule();
    }
  };

  const renderItem = React.useCallback(({ item }: { item: ScheduleItem }) => {
    return <ScheduleItemRow item={item} onPress={handleItemPress} schemeColors={schemeColors} recurrenceStyle={recurrenceStyle} />;
  }, [handleItemPress, schemeColors, recurrenceStyle]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[recurrenceStyle.container, { backgroundColor: schemeColors.background }]}>
        <View style={recurrenceStyle.header}>
          <Text style={[recurrenceStyle.title, { color: schemeColors.text }]}>Recurring Schedule</Text>
          <IconButton icon="close" onPress={onClose} iconColor={schemeColors.text} />
        </View>
        <Text style={[recurrenceStyle.subtitle, { color: schemeColors.muted }]}>
          Last 7 days and future 7 days. Tap item for actions.
        </Text>

        {loading ? (
          <View style={recurrenceStyle.listContent}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
              <SkeletonItem key={i} schemeColors={schemeColors} />
            ))}
          </View>
        ) : (
          <FlatList
            data={schedule}
            keyExtractor={(item, index) => `${item.templateId}_${item.date.getTime()}_${index}`}
            renderItem={renderItem}
            contentContainerStyle={recurrenceStyle.listContent}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            ListEmptyComponent={
              <View style={recurrenceStyle.center}>
                <Text style={{ color: schemeColors.muted }}>No recurring transactions in range.</Text>
              </View>
            }
          />
        )}

        {/* Action Sheet Modal */}
        {selectedItem && (
          <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
            <TouchableOpacity
              style={recurrenceStyle.modalOverlay}
              activeOpacity={1}
              onPress={() => setActionModalVisible(false)}
            >
              <View style={[recurrenceStyle.actionSheet, { backgroundColor: schemeColors.surface }]}>
                <Text style={[recurrenceStyle.actionTitle, { color: schemeColors.text }]}>
                  {selectedItem.templateName} ({format(selectedItem.date, 'MMM dd')})
                </Text>

                {selectedItem.status === 'executed' ? (
                  <TouchableOpacity style={recurrenceStyle.actionBtn} onPress={() => handleAction('reset')}>
                    <Text style={{ color: schemeColors.danger, fontSize: 17 }}>Reset (Delete)</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={recurrenceStyle.actionBtn} onPress={() => handleAction('apply_save')}>
                    <Text style={{ color: schemeColors.primary, fontSize: 17, fontWeight: '600' }}>Apply and Save</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={[recurrenceStyle.actionBtn, { borderBottomWidth: 0 }]} onPress={() => setActionModalVisible(false)}>
                  <Text style={{ color: schemeColors.text, fontSize: 17 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const ScheduleItemRow = React.memo(({ item, onPress, schemeColors, recurrenceStyle }: { item: ScheduleItem, onPress: (i: ScheduleItem) => void, schemeColors: any, recurrenceStyle: any }) => {
  let icon = 'dots-horizontal';
  let iconColor = schemeColors.muted;

  if (item.status === 'executed') {
    icon = 'check-circle';
    iconColor = schemeColors.success ?? '#4caf50';
  } else if (item.status === 'missed') {
    icon = 'close-circle';
    iconColor = schemeColors.danger ?? '#f44336';
  } else if (item.status === 'pending') {
    icon = 'clock-outline';
    iconColor = schemeColors.primary;
  }

  return (
    <TouchableOpacity
      style={[recurrenceStyle.itemRow, { borderBottomColor: schemeColors.border }]}
      onPress={() => onPress(item)}
    >
      <View style={recurrenceStyle.dateCol}>
        <Text style={[recurrenceStyle.dateText, { color: schemeColors.text }]}>
          {format(item.date, 'MMM dd')}
        </Text>
        <Text style={[recurrenceStyle.weekdayText, { color: schemeColors.muted }]}>
          {format(item.date, 'EEE')}
        </Text>
      </View>
      <View style={recurrenceStyle.detailsCol}>
        <Text style={[recurrenceStyle.tplName, { color: schemeColors.text }]} numberOfLines={1}>
          {item.templateName}
        </Text>
        <Text style={[recurrenceStyle.amount, { color: schemeColors.text }]}>
          {item.amount.toFixed(2)}
        </Text>
      </View>
      <View style={recurrenceStyle.statusCol}>
        <IconButton icon={icon} iconColor={iconColor} size={20} onPress={() => onPress(item)} />
      </View>
    </TouchableOpacity>
  );
});
