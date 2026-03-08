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
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { RecurrencePreset, presetToCron, computeNextFromPreset } from '../../utils/cronPresets';
import CategoryPicker from '../Category/CategoryPicker';
import ExpenseFormFields from '../Expenses/ExpenseFormFields';
import useAddExpense from '../../hooks/useAddExpense';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  onSave: (payload: {
    id?: string;
    name: string;
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
  const { globalStyle, schemeColors, scheme, templateStyle } = useTheme();
  const isDark = scheme === 'dark';

  const [name, setName] = useState(initial?.name ?? '');

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
    categories,
    onCategoryPress,
    showPicker,
    onDateChange,
    payees,
    onMerchantSelect,
    reset,
    transactionType,
    setTransactionType,
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
      if (initial) {
        setName(initial.name ?? '');
        setIsRecurring(!!initial.is_recurring);
        setPreset(initial.preset ?? 'monthly');
        setTimeOfDay(initial.timeOfDay ?? '09:00');
        setWeekday(initial.weekday ?? 1);
        setDayOfMonth(initial.dayOfMonth ?? 1);
        setTz(initial.tz ?? 'UTC');
      } else {
        // Reset local state
        setName('');
        setIsRecurring(false);
        setPreset('monthly');
        setTimeOfDay('09:00');
        setWeekday(1);
        setDayOfMonth(1);
        setTz('UTC');

        // Reset hook state
        reset();
      }
    }
  }, [visible, initial]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please give the template a name.');
      return;
    }
    // Apply sign based on type
    const parsedAmount = Number(amount);
    const finalAmount = transactionType === 'EXPENSE' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    const tpl: any = {
      amount: finalAmount,
      merchant,
      payeeId: initial?.template?.payeeId,
      comment: notes,
      categoryId: selectedCategory?.id,
      transaction_type: transactionType,
    };

    // ensure numeric amount
    if (typeof tpl.amount === 'string') tpl.amount = Number(tpl.amount as any);

    const payload: any = {
      id: initial?.id,
      name: name.trim(),
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
      <SafeAreaView style={{ flex: 1, backgroundColor: schemeColors.background }} edges={['top', 'left', 'right']}>
        <View style={[templateStyle.editorContainer, { backgroundColor: schemeColors.background, flex: 1 }]}>
          {/* Header */}
          <View style={templateStyle.editorModalHeader}>
            <TouchableOpacity onPress={onRequestClose} style={templateStyle.headerButton}>
              <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[templateStyle.editorTitle, { color: schemeColors.text }]}>
              {initial ? 'Edit Template' : 'New Template'}
            </Text>
            <TouchableOpacity onPress={save} disabled={loading} style={templateStyle.headerButton}>
              {loading ? (
                <ActivityIndicator size="small" color={schemeColors.primary} />
              ) : (
                <Text style={{ color: schemeColors.primary, fontSize: 17, fontWeight: '600' }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 50}
          >
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

              {/* Template Info Section */}
              <View style={globalStyle.formSection}>
                <View style={[globalStyle.row, { borderBottomWidth: 0 }]}>
                  <Text style={globalStyle.rowLabel}>Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Monthly Rent"
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
                  transactionType={transactionType}
                  setTransactionType={setTransactionType}
                />
              </View>

              <Text style={globalStyle.sectionHeader}>AUTOMATION</Text>
              <View style={globalStyle.formSection}>
                <View style={[globalStyle.row, { justifyContent: 'space-between', borderBottomWidth: isRecurring ? StyleSheet.hairlineWidth : 0 }]}>
                  <Text style={globalStyle.rowLabel}>Recurring</Text>
                  <TouchableOpacity
                    onPress={() => setIsRecurring(!isRecurring)}
                    style={[
                      templateStyle.toggle,
                      { backgroundColor: isRecurring ? schemeColors.primary : schemeColors.border }
                    ]}
                  >
                    <View style={[templateStyle.toggleKnob, { transform: [{ translateX: isRecurring ? 18 : 2 }] }]} />
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
                            templateStyle.chip,
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
                        style={[templateStyle.smallInput, { color: schemeColors.text, backgroundColor: schemeColors.background }]}
                      />
                    </View>

                    {preset === 'weekly' && (
                      <View style={[globalStyle.row, { marginTop: 0, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0 }]}>
                        <Text style={{ color: schemeColors.text, flex: 1 }}>Weekday (0=Sun)</Text>
                        <TextInput
                          value={String(weekday)}
                          onChangeText={(t) => setWeekday(Number(t) || 0)}
                          keyboardType="numeric"
                          style={[templateStyle.smallInput, { color: schemeColors.text, backgroundColor: schemeColors.background }]}
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
                          style={[templateStyle.smallInput, { color: schemeColors.text, backgroundColor: schemeColors.background }]}
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
            categories={categories}
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
      </SafeAreaView>
    </Modal>
  );
}
