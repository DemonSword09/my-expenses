// src/components/Expenses/AddExpenseForm.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import useTheme from '../../hooks/useTheme';
import useAddExpense from '../../hooks/useAddExpense';
import CategoryPicker from '../Category/CategoryPicker';
import ExpenseFormFields from './ExpenseFormFields';

const AddExpenseForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params: any = (route as any).params ?? {};
  // Support both 'id' and 'expenseId' for backwards compatibility
  const expenseId: string | undefined = params.id || params.expenseId;
  const mode = params.mode;

  const isDuplicate = mode === 'duplicate';
  const realEditId = isDuplicate ? undefined : expenseId;
  const duplicateId = isDuplicate ? expenseId : undefined;

  const { schemeColors, globalStyle, addExpenseStyle } = useTheme();

  const {
    merchant,
    setMerchant,
    amount,
    setAmount,
    notes,
    setNotes,
    dateMs,
    showPicker,
    openDatePicker,
    onDateChange,
    catModalVisible,
    openCategoryPicker,
    closeCategoryPicker,
    categories,
    selectedCategory,
    onCategoryPress,
    loading,
    handleSave,
    payees,
    onMerchantSelect,
    transactionType,
    setTransactionType,
  } = useAddExpense(realEditId, duplicateId);

  const [formErrors, setFormErrors] = React.useState<{ amount?: string }>({});

  // Auto-hide errors after 2 seconds
  React.useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      const timer = setTimeout(() => {
        setFormErrors({});
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formErrors]);

  const onSave = async () => {
    // Validate locally
    if (!amount) {
      setFormErrors({ amount: 'Amount is required' });
      return;
    }
    const parsed = parseFloat(String(amount).replace(/,/g, ''));
    if (Number.isNaN(parsed) || parsed <= 0) {
      setFormErrors({ amount: 'Invalid amount' });
      return;
    }

    setFormErrors({});

    try {
      // Hook handles the DB save
      const success = await handleSave();
      if (success) {
        navigation.goBack();
      }
    } catch (err: any) {
      console.error('Save error', err);
    }
  };

  return (
    <View style={globalStyle.container}>
      {/* Custom Header matching TemplateEditor */}
      <View style={addExpenseStyle.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={addExpenseStyle.headerButton}>
          <Text style={addExpenseStyle.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={addExpenseStyle.headerTitle}>
          {realEditId ? 'Edit Transaction' : 'New Transaction'}
        </Text>
        <TouchableOpacity onPress={onSave} disabled={loading} style={addExpenseStyle.headerButton}>
          {loading ? (
            <ActivityIndicator size="small" color={schemeColors.primary} />
          ) : (
            <Text style={addExpenseStyle.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={globalStyle.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={globalStyle.sectionHeader}>DETAILS</Text>
          <View style={globalStyle.formSection}>
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
              errors={formErrors}
            />
          </View>

          <TouchableOpacity
            onPress={onSave}
            disabled={loading}
            style={[globalStyle.glassBase, addExpenseStyle.glassSaveButton, addExpenseStyle.bottomSaveButton, { opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={addExpenseStyle.glassSaveButtonText}>Save Transaction</Text>
            )}
          </TouchableOpacity>
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
  );
};

export default AddExpenseForm;
