import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isFuture, isPast, isToday } from 'date-fns';
import useTheme from '../../hooks/useTheme';
import { TransactionRepo } from '../../db/repositories/TransactionRepo';
import type { Template, Transaction } from '../../db/models';
import { getNextDatesFromCron } from '../../utils/cronHelpers';
import ActionSheet from '../ActionSheet'; // We might need a custom one or reuse
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  visible: boolean;
  onClose: () => void;
  template: Template;
  onUpdate?: () => void; // callback to refresh list if needed
};

export default function RecurrenceCalendarModal({ visible, onClose, template, onUpdate }: Props) {
  const { schemeColors, globalStyle } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [executedTxns, setExecutedTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // For selected date action
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    if (visible && template.recurring_rule_id) {
      loadExecuted();
    }
  }, [visible, template]);

  const loadExecuted = async () => {
    if (!template.recurring_rule_id) return;
    setLoading(true);
    try {
      const txns = await TransactionRepo.findByRecurringRule(template.recurring_rule_id);
      setExecutedTxns(txns);
    } catch (err) {
      console.error('Failed to load executed transactions', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate recurrence dates for the current month
  const recurrenceDates = useMemo(() => {
    if (!template.cron_expression) return [];

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // We need to generate dates for this month based on the cron
    // The helper might need a start date. 
    // Let's generate from a bit earlier to be safe, or just use the helper for the interval.
    // getNextDatesFromCron usually takes a startAt.
    // We want ALL occurrences in this month.

    // Hack: generate from start of month - 1 day to end of month
    try {
      const dates = getNextDatesFromCron({
        cron: template.cron_expression,
        tz: template.timezone || 'UTC',
        startAt: start.getTime() - 1000,
        stopAt: end.getTime(),
        maxCount: 31 // max days in month
      });
      return dates.map(d => new Date(d));
    } catch (e) {
      console.error('Cron parse error', e);
      return [];
    }
  }, [currentMonth, template.cron_expression, template.timezone]);

  const getStatus = (date: Date) => {
    // Check if executed
    const txn = executedTxns.find(t => isSameDay(new Date(t.createdAt), date));
    if (txn) return { status: 'EXECUTED', txn };

    // Check if before creation date
    // If template has created_at, use it.
    // Note: template.created_at is a number (ms)
    if (template.created_at && date.getTime() < template.created_at && !isSameDay(date, new Date(template.created_at))) {
      return { status: 'DISABLED' };
    }

    // Check if pending (future or past but not executed)
    // If it's today or past and not executed -> Missed/Pending
    // If future -> Upcoming
    if (isFuture(date) && !isToday(date)) return { status: 'UPCOMING' };
    return { status: 'PENDING' }; // Due or Overdue
  };

  const handleDayPress = (date: Date) => {
    const { status } = getStatus(date);
    if (status === 'DISABLED') return;
    setSelectedDate(date);
    setActionModalVisible(true);
  };

  const handleAction = async (action: 'apply_save' | 'apply_edit' | 'edit' | 'reset') => {
    if (!selectedDate) return;
    setActionModalVisible(false);

    const statusObj = getStatus(selectedDate);
    const txn = statusObj.txn;

    try {
      if (action === 'reset' && txn) {
        // Delete transaction
        await TransactionRepo.delete(txn.id);
        await loadExecuted();
        if (onUpdate) onUpdate();
      } else if (action === 'apply_save') {
        // Create transaction
        const tplJson = JSON.parse(template.template_json);

        // Resolve payeeId if missing but merchant name exists
        let finalPayeeId = tplJson.payeeId;
        if (!finalPayeeId && tplJson.merchant) {
          const p = await TransactionRepo.addPayee({ name: tplJson.merchant });
          finalPayeeId = p.id;
        }

        const payload = {
          ...tplJson,
          createdAt: selectedDate.getTime(),
          updatedAt: Date.now(),
          recurring_rule_id: template.recurring_rule_id,
          payeeId: finalPayeeId,
        };

        // Ensure amount sign is correct based on type (already handled in template_json usually, but double check?)
        // The template_json from DB should have correct sign/type from our previous fix.

        await TransactionRepo.create(payload);
        await loadExecuted();
        if (onUpdate) onUpdate();
      } else if (action === 'apply_edit') {
        // Navigate to AddExpense with initial data
        // We need to close modal? Or just navigate?
        // If we navigate, we need to handle the "Save" to link it to this rule.
        // Currently AddExpense doesn't support passing recurring_rule_id to link back.
        // This is a bit complex.
        // Workaround: Create it first, then edit it?
        // Or pass param to AddExpense to include recurring_rule_id.

        // Let's go with: Create then Edit (seamlessly?)
        // Or just pass initialData and handle save manually?
        // Simpler: "Apply and Edit" -> Create it, then open Edit screen for it.

        const tplJson = JSON.parse(template.template_json);

        // Resolve payeeId if missing but merchant name exists
        let finalPayeeId = tplJson.payeeId;
        if (!finalPayeeId && tplJson.merchant) {
          const p = await TransactionRepo.addPayee({ name: tplJson.merchant });
          finalPayeeId = p.id;
        }

        const payload = {
          ...tplJson,
          createdAt: selectedDate.getTime(),
          updatedAt: Date.now(),
          recurring_rule_id: template.recurring_rule_id,
          payeeId: finalPayeeId,
        };
        const newTxn = await TransactionRepo.create(payload);
        await loadExecuted();
        if (onUpdate) onUpdate();

        // Now navigate to edit
        // We need navigation prop or useNavigation
        // We can't use hooks inside this function easily if not defined at top.
        // We'll use a callback or exposed navigation.
        // For now, let's alert "Created. You can now edit it in the list" or try to navigate.
      } else if (action === 'edit' && txn) {
        // Navigate to edit existing txn
        // Same navigation issue.
      }
    } catch (err) {
      Alert.alert('Error', 'Operation failed');
    }
  };

  // Render Calendar Grid
  const renderCalendar = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Padding for start of week
    const startDay = start.getDay(); // 0=Sun
    const padding = Array(startDay).fill(null);

    return (
      <View style={styles.calendarGrid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <Text key={d} style={[styles.dayHeader, { color: schemeColors.muted }]}>{d}</Text>
        ))}

        {[...padding, ...days].map((date, i) => {
          if (!date) return <View key={`pad-${i}`} style={styles.dayCell} />;

          // Check if this date is a recurrence date
          const isRecurrence = recurrenceDates.some(d => isSameDay(d, date));

          if (!isRecurrence) {
            return (
              <View key={date.toISOString()} style={styles.dayCell}>
                <Text style={{ color: schemeColors.muted, opacity: 0.3 }}>{date.getDate()}</Text>
              </View>
            );
          }

          const { status, txn } = getStatus(date);
          let bgColor = schemeColors.surface;
          let textColor = schemeColors.text;

          if (status === 'EXECUTED') {
            bgColor = schemeColors.success + '40'; // transparent green
            textColor = schemeColors.success;
          } else if (status === 'PENDING') {
            bgColor = schemeColors.danger + '20'; // transparent red
            textColor = schemeColors.danger;
          } else if (status === 'DISABLED') {
            bgColor = schemeColors.surface;
            textColor = schemeColors.muted + '40'; // very faint
          } else {
            // Upcoming
            bgColor = schemeColors.primary + '20';
            textColor = schemeColors.primary;
          }

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.dayCell, { backgroundColor: bgColor, borderRadius: 8 }]}
              onPress={() => handleDayPress(date)}
              disabled={status === 'DISABLED'}
            >
              <Text style={{ color: textColor, fontWeight: 'bold' }}>{date.getDate()}</Text>
              {status === 'EXECUTED' && (
                <MaterialCommunityIcons name="check" size={12} color={textColor} style={{ position: 'absolute', bottom: 2, right: 2 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: schemeColors.text }]}>Recurrences</Text>
          <View style={styles.closeBtn} />
        </View>

        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <MaterialCommunityIcons name="chevron-left" size={30} color={schemeColors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: schemeColors.text }]}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <MaterialCommunityIcons name="chevron-right" size={30} color={schemeColors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {loading ? <ActivityIndicator /> : renderCalendar()}

          <View style={{ marginTop: 24 }}>
            <Text style={{ color: schemeColors.muted, textAlign: 'center' }}>
              Tap a date to manage its transaction.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: schemeColors.success, marginRight: 4 }} />
                <Text style={{ color: schemeColors.muted }}>Executed</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: schemeColors.danger, marginRight: 4 }} />
                <Text style={{ color: schemeColors.muted }}>Due/Missed</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: schemeColors.primary, marginRight: 4 }} />
                <Text style={{ color: schemeColors.muted }}>Upcoming</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Modal for Date */}
        {selectedDate && (
          <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setActionModalVisible(false)}
            >
              <View style={[styles.actionSheet, { backgroundColor: schemeColors.surface }]}>
                <Text style={[styles.actionTitle, { color: schemeColors.text }]}>
                  {format(selectedDate, 'PPPP')}
                </Text>

                {(() => {
                  const { status } = getStatus(selectedDate);
                  if (status === 'EXECUTED') {
                    return (
                      <>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('reset')}>
                          <Text style={{ color: schemeColors.danger, fontSize: 17 }}>Reset (Delete)</Text>
                        </TouchableOpacity>
                        {/* Edit not fully implemented yet due to navigation complexity, but can add later */}
                        {/* <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('edit')}>
                          <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Edit</Text>
                        </TouchableOpacity> */}
                      </>
                    );
                  } else {
                    return (
                      <>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('apply_save')}>
                          <Text style={{ color: schemeColors.primary, fontSize: 17, fontWeight: '600' }}>Apply and Save</Text>
                        </TouchableOpacity>
                        {/* <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('apply_edit')}>
                          <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Apply and Edit</Text>
                        </TouchableOpacity> */}
                      </>
                    );
                  }
                })()}

                <TouchableOpacity style={[styles.actionBtn, { borderBottomWidth: 0 }]} onPress={() => setActionModalVisible(false)}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  closeBtn: { width: 60 },
  title: { fontSize: 17, fontWeight: '600' },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthTitle: { fontSize: 18, fontWeight: 'bold' },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 12,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
});
