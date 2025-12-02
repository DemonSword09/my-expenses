// src/components/TemplateEditor.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';
import { RecurrencePreset, presetToCron, computeNextFromPreset } from '../utils/cronPresets';
import CategoryPicker from './CategoryPicker';
import ExpenseFormFields from './ExpenseFormFields';
import useAddExpense from '../hooks/useAddExpense';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onSave: (payload: {
    id?: string;
    name: string;
    description?: string | null;
    template: Record<string, any>;
    is_recurring?: boolean;
    recurring_rule?: {
      cronExpression: string;
      timezone?: string;
      nextDate?: number | null;
      humanReadable?: string | null;
    } | null;
  }) => Promise<void>;
  initial?: any | null;
};

export default function TemplateEditor({ visible, onRequestClose, onSave, initial }: Props) {
  const { globalStyle, schemeColors, scheme } = useTheme();
  const isDark = scheme === 'dark';

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  const {
    merchant,
    setMerchant,
    amount,
    setAmount,
    notes,
    setNotes,
    dateMs,
    openDatePicker,
    selectedCategory,
    openCategoryPicker,
    catModalVisible,
    closeCategoryPicker,
    stackParents,
    categories,
    onBackStack,
    onCategoryPress,
    showPicker,
    onDateChange,
    payees,
    onMerchantSelect,
  } = useAddExpense(undefined, initial?.template);

  const [isRecurring, setIsRecurring] = useState<boolean>(!!initial?.is_recurring);
  const [preset, setPreset] = useState<RecurrencePreset>('monthly');
  const [timeOfDay, setTimeOfDay] = useState<string>('09:00');
  const [weekday, setWeekday] = useState<number>(1); // Mon
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [tz, setTz] = useState<string>('UTC');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setIsRecurring(!!initial?.is_recurring);
      
      // If editing existing recurring rule, try to reverse engineer preset?
      // For now, just default to what was passed or defaults
      setPreset(initial?.preset ?? 'monthly');
      setTimeOfDay(initial?.timeOfDay ?? '09:00');
      setWeekday(initial?.weekday ?? 1);
      setDayOfMonth(initial?.dayOfMonth ?? 1);
      setTz(initial?.tz ?? 'UTC');
    }
  }, [visible, initial]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please give the template a name.');
      return;
    }
    const tpl = {
      amount: Number(amount),
      merchant,
      comment: notes,
      categoryId: selectedCategory?.id,
      transaction_type: 'EXPENSE',
    };

    // ensure numeric amount
    if (typeof tpl.amount === 'string') tpl.amount = Number(tpl.amount as any);

    const payload: any = {
      id: initial?.id,
      name: name.trim(),
      description: description ? description.trim() : null,
      template: tpl,
      is_recurring: isRecurring,
      recurring_rule: null,
    };

    if (isRecurring) {
      const cron = presetToCron(preset, timeOfDay, { weekday, dayOfMonth });
      if (!cron) {
        Alert.alert('Invalid recurrence', 'Unable to build cron for the selected options.');
        return;
      }
      const next =
        computeNextFromPreset(preset, timeOfDay, { weekday, dayOfMonth, tz }) ?? Date.now();
      payload.recurring_rule = {
        cronExpression: cron,
        timezone: tz,
        nextDate: next,
        humanReadable: `${preset} @ ${timeOfDay}`,
      };
    }

    setLoading(true);
    try {
      await onSave(payload);
    } catch (err) {
      console.error('Template save failed', err);
      Alert.alert('Save failed', 'Unable to save template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onRequestClose}>
      <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: schemeColors.border }]}>
          <TouchableOpacity onPress={onRequestClose} style={styles.headerButton}>
            <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: schemeColors.text }]}>
            {initial ? 'Edit Template' : 'New Template'}
          </Text>
          <TouchableOpacity onPress={save} disabled={loading} style={styles.headerButton}>
            {loading ? (
              <ActivityIndicator size="small" color={schemeColors.primary} />
            ) : (
              <Text style={{ color: schemeColors.primary, fontSize: 17, fontWeight: '600' }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            
            {/* Template Info Section */}
            <View style={globalStyle.formSection}>
              <View style={globalStyle.row}>
                <Text style={globalStyle.rowLabel}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Monthly Rent"
                  placeholderTextColor={schemeColors.muted}
                  style={globalStyle.rowInput}
                />
              </View>
              <View style={[globalStyle.row, { borderBottomWidth: 0 }]}>
                <Text style={globalStyle.rowLabel}>Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional"
                  placeholderTextColor={schemeColors.muted}
                  style={globalStyle.rowInput}
                />
              </View>
            </View>

            <Text style={globalStyle.sectionHeader}>TRANSACTION DETAILS</Text>
            <View style={[globalStyle.formSection, { paddingVertical: 0, paddingHorizontal: 0 }]}>
              <ExpenseFormFields
                amount={amount}
                setAmount={setAmount}
                merchant={merchant}
                setMerchant={setMerchant}
                notes={notes}
                setNotes={setNotes}
                dateMs={dateMs}
                openDatePicker={openDatePicker}
                selectedCategory={selectedCategory}
                openCategoryPicker={openCategoryPicker}
                variant="list"
                payees={payees}
                onMerchantSelect={onMerchantSelect}
              />
            </View>

            <Text style={globalStyle.sectionHeader}>AUTOMATION</Text>
            <View style={globalStyle.formSection}>
              <View style={[globalStyle.row, { justifyContent: 'space-between', borderBottomWidth: isRecurring ? StyleSheet.hairlineWidth : 0 }]}>
                <Text style={globalStyle.rowLabel}>Recurring</Text>
                <TouchableOpacity 
                  onPress={() => setIsRecurring(!isRecurring)}
                  style={[
                    styles.toggle, 
                    { backgroundColor: isRecurring ? schemeColors.primary : schemeColors.border }
                  ]}
                >
                  <View style={[styles.toggleKnob, { transform: [{ translateX: isRecurring ? 18 : 2 }] }]} />
                </TouchableOpacity>
              </View>

              {isRecurring && (
                <View style={{ padding: 16, paddingTop: 0 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 12 }}>
                    {(['daily', 'weekdays', 'weekly', 'monthly'] as RecurrencePreset[]).map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setPreset(p)}
                        style={[
                          styles.chip,
                          { 
                            backgroundColor: preset === p ? schemeColors.primary : schemeColors.background,
                            borderColor: preset === p ? schemeColors.primary : schemeColors.border,
                          }
                        ]}
                      >
                        <Text style={{ color: preset === p ? '#fff' : schemeColors.text, textTransform: 'capitalize' }}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={[globalStyle.row, { borderBottomWidth: 0 }]}>
                    <Text style={{ color: schemeColors.text, flex: 1 }}>Time</Text>
                    <TextInput
                      value={timeOfDay}
                      onChangeText={setTimeOfDay}
                      placeholder="09:00"
                      placeholderTextColor={schemeColors.muted}
                      style={[styles.smallInput, { color: schemeColors.text, backgroundColor: schemeColors.background }]}
                    />
                  </View>

                  {preset === 'weekly' && (
                    <View style={[globalStyle.row, { marginTop: 0, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0 }]}>
                      <Text style={{ color: schemeColors.text, flex: 1 }}>Weekday (0=Sun)</Text>
                      <TextInput
                        value={String(weekday)}
                        onChangeText={(t) => setWeekday(Number(t) || 0)}
                        keyboardType="numeric"
                        style={[styles.smallInput, { color: schemeColors.text, backgroundColor: schemeColors.background }]}
                      />
                    </View>
                  )}

                  {preset === 'monthly' && (
                    <View style={[globalStyle.row, { marginTop: 0, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0 }]}>
                      <Text style={{ color: schemeColors.text, flex: 1 }}>Day of Month</Text>
                      <TextInput
                        value={String(dayOfMonth)}
                        onChangeText={(t) => setDayOfMonth(Math.max(1, Math.min(31, Number(t) || 1)))}
                        keyboardType="numeric"
                        style={[styles.smallInput, { color: schemeColors.text, backgroundColor: schemeColors.background }]}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        <CategoryPicker
          visible={catModalVisible}
          onRequestClose={closeCategoryPicker}
          stackParents={stackParents}
          categories={categories}
          onBackStack={onBackStack}
          onCategoryPress={onCategoryPress}
        />

        {showPicker && (
          <DateTimePicker
            value={new Date(dateMs)}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  smallInput: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 80,
    textAlign: 'right',
  },
});
