import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import useTheme from '../hooks/useTheme';
import useTemplates from '../hooks/useTemplates';
import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { format } from 'date-fns';

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
  const { schemeColors } = useTheme();
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

            await TransactionRepo.create(payload);
            await loadSchedule();
        } else if (action === 'reset') {
            if (selectedItem.transactionId) {
                await TransactionRepo.delete(selectedItem.transactionId);
                await loadSchedule();
            }
        }
    } catch (err) {
        console.error('Action failed', err);
        Alert.alert('Error', 'Operation failed');
    }
  };

  const renderItem = ({ item }: { item: ScheduleItem }) => {
    let icon = 'dots-horizontal';
    let iconColor = schemeColors.muted;
    
    if (item.status === 'executed') {
      icon = 'check-circle';
      iconColor = schemeColors.success ?? '#4caf50';
    } else if(item.status === 'missed') {
      icon = 'close-circle';
      iconColor = schemeColors.danger ?? '#f44336';
    } else if(item.status === 'pending') {
      icon = 'clock-outline';
      iconColor = schemeColors.primary;
    }

    return (
      <TouchableOpacity 
        style={[styles.itemRow, { borderBottomColor: schemeColors.border }]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.dateCol}>
          <Text style={[styles.dateText, { color: schemeColors.text }]}>
            {format(item.date, 'MMM dd')}
          </Text>
          <Text style={[styles.weekdayText, { color: schemeColors.muted }]}>
            {format(item.date, 'EEE')}
          </Text>
        </View>
        <View style={styles.detailsCol}>
          <Text style={[styles.tplName, { color: schemeColors.text }]} numberOfLines={1}>
            {item.templateName}
          </Text>
          <Text style={[styles.amount, { color: schemeColors.text }]}>
            {item.amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statusCol}>
          <IconButton icon={icon} iconColor={iconColor} size={20} onPress={() => handleItemPress(item)} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: schemeColors.text }]}>Recurring Schedule</Text>
          <IconButton icon="close" onPress={onClose} iconColor={schemeColors.text} />
        </View>
        <Text style={[styles.subtitle, { color: schemeColors.muted }]}>
            Last 7 days and future 7 days. Tap item for actions.
        </Text>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={schemeColors.primary} />
          </View>
        ) : (
          <FlatList
            data={schedule}
            keyExtractor={(item, index) => `${item.templateId}_${item.date.getTime()}_${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ color: schemeColors.muted }}>No recurring transactions in range.</Text>
              </View>
            }
          />
        )}
        
        {/* Action Sheet Modal */}
        {selectedItem && (
          <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setActionModalVisible(false)}
            >
              <View style={[styles.actionSheet, { backgroundColor: schemeColors.surface }]}>
                <Text style={[styles.actionTitle, { color: schemeColors.text }]}>
                  {selectedItem.templateName} ({format(selectedItem.date, 'MMM dd')})
                </Text>
                
                {selectedItem.status === 'executed' ? (
                   <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('reset')}>
                     <Text style={{ color: schemeColors.danger, fontSize: 17 }}>Reset (Delete)</Text>
                   </TouchableOpacity>
                ) : (
                   <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('apply_save')}>
                     <Text style={{ color: schemeColors.primary, fontSize: 17, fontWeight: '600' }}>Apply and Save</Text>
                   </TouchableOpacity>
                )}
                
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
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 32,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  dateCol: {
    width: 60,
    alignItems: 'center',
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  weekdayText: {
    fontSize: 12,
  },
  detailsCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tplName: {
    fontSize: 16,
    fontWeight: '500',
  },
  amount: {
    fontSize: 14,
    marginTop: 2,
  },
  statusCol: {
    width: 40,
    alignItems: 'center',
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
