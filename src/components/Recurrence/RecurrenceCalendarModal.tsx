import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isFuture, isPast, isToday } from 'date-fns';
import useTheme from '../../hooks/useTheme';
import { TransactionRepo } from '../../db/repositories/TransactionRepo';
import type { Template, Transaction } from '../../db/models';
import { getNextDatesFromCron } from '../../utils/cronHelpers';

type Props = {
  visible: boolean;
  onClose: () => void;
  template: Template;
  onUpdate?: () => void; // callback to refresh list if needed
};

export default function RecurrenceCalendarModal({ visible, onClose, template, onUpdate }: Props) {
  const { schemeColors, recurrenceStyle } = useTheme();
  // ... rest of logic
  // WAIT, I need to keep the logic. I am replacing the FULL file or parts. 
  // I should replacing the styles usage and removing the StyleSheet creation.
  // Replacing everything with logic is risky if I miss something.
  // I'll try to keep the logic intact by just replacing "styles.x" with "recurrenceStyle.x" etc.

  // Re-reading logic to ensure.
  // I will output the FULL component structure again to be safe.

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
    const txn = executedTxns.find(t => isSameDay(new Date(t.createdAt), date));
    if (txn) return { status: 'EXECUTED', txn };

    if (template.created_at && date.getTime() < template.created_at && !isSameDay(date, new Date(template.created_at))) {
      return { status: 'DISABLED' };
    }

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
        await TransactionRepo.delete(txn.id);
        await loadExecuted();
        if (onUpdate) onUpdate();
      } else if (action === 'apply_save') {
        const tplJson = JSON.parse(template.template_json);

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

        await TransactionRepo.create(payload);
        await loadExecuted();
        if (onUpdate) onUpdate();
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
      <View style={recurrenceStyle.calendarGrid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <Text key={d} style={[recurrenceStyle.dayHeader, { color: schemeColors.muted }]}>{d}</Text>
        ))}

        {[...padding, ...days].map((date, i) => {
          if (!date) return <View key={`pad-${i}`} style={recurrenceStyle.dayCell} />;

          const isRecurrence = recurrenceDates.some(d => isSameDay(d, date));

          if (!isRecurrence) {
            return (
              <View key={date.toISOString()} style={recurrenceStyle.dayCell}>
                <Text style={{ color: schemeColors.muted, opacity: 0.3 }}>{date.getDate()}</Text>
              </View>
            );
          }

          const { status, txn } = getStatus(date);
          let bgColor = schemeColors.surface;
          let textColor = schemeColors.text;

          if (status === 'EXECUTED') {
            bgColor = schemeColors.success + '40'; // transparent green
          } else if (status === 'PENDING') {
            bgColor = schemeColors.danger; // transparent red
          } else if (status === 'DISABLED') {
            bgColor = schemeColors.surface;
            textColor = schemeColors.muted + '40'; // very faint
          } else {
            // Upcoming
            bgColor = schemeColors.primary + '20';
          }

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[recurrenceStyle.dayCell, { backgroundColor: bgColor, borderRadius: 8 }]}
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
      <SafeAreaView style={{ flex: 1, backgroundColor: schemeColors.background }} edges={['top', 'left', 'right']}>
        <View style={[recurrenceStyle.container, { backgroundColor: schemeColors.background }]}>
          <View style={recurrenceStyle.header}>
            <TouchableOpacity onPress={onClose} style={recurrenceStyle.closeBtn}>
              <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Close</Text>
            </TouchableOpacity>
            <Text style={[recurrenceStyle.title, { color: schemeColors.text }]}>Recurrences</Text>
            <View style={recurrenceStyle.closeBtn} />
          </View>

          <View style={recurrenceStyle.monthNav}>
            <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <MaterialCommunityIcons name="chevron-left" size={30} color={schemeColors.primary} />
            </TouchableOpacity>
            <Text style={[recurrenceStyle.monthTitle, { color: schemeColors.text }]}>
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
                style={recurrenceStyle.modalOverlay}
                activeOpacity={1}
                onPress={() => setActionModalVisible(false)}
              >
                <View style={[recurrenceStyle.actionSheet, { backgroundColor: schemeColors.surface }]}>
                  <Text style={[recurrenceStyle.actionTitle, { color: schemeColors.text }]}>
                    {format(selectedDate, 'PPPP')}
                  </Text>

                  {(() => {
                    const { status } = getStatus(selectedDate);
                    if (status === 'EXECUTED') {
                      return (
                        <>
                          <TouchableOpacity style={recurrenceStyle.actionBtn} onPress={() => handleAction('reset')}>
                            <Text style={{ color: schemeColors.danger, fontSize: 17 }}>Reset (Delete)</Text>
                          </TouchableOpacity>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <TouchableOpacity style={recurrenceStyle.actionBtn} onPress={() => handleAction('apply_save')}>
                            <Text style={{ color: schemeColors.primary, fontSize: 17, fontWeight: '600' }}>Apply and Save</Text>
                          </TouchableOpacity>
                        </>
                      );
                    }
                  })()}

                  <TouchableOpacity style={[recurrenceStyle.actionBtn, { borderBottomWidth: 0 }]} onPress={() => setActionModalVisible(false)}>
                    <Text style={{ color: schemeColors.text, fontSize: 17 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
