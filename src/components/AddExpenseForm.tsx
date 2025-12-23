// src/components/AddExpenseForm.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import useTheme from '../hooks/useTheme';
import useAddExpense from '../hooks/useAddExpense';
import CategoryPicker from '../components/CategoryPicker';
import ExpenseFormFields from './ExpenseFormFields';

const AddExpenseForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params: any = (route as any).params ?? {};
  const editId: string | undefined = params.id;

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
    stackParents,
    categories,
    selectedCategory,
    onCategoryPress,
    onBackStack,
    loading,
    handleSave,
    payees,
    onMerchantSelect,
    transactionType,
    setTransactionType,
  } = useAddExpense(editId);

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
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 64,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: schemeColors.border,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: schemeColors.text }}>
          {editId ? 'Edit Transaction' : 'New Transaction'}
        </Text>
        <TouchableOpacity onPress={onSave} disabled={loading} style={{ padding: 4 }}>
          {loading ? (
            <ActivityIndicator size="small" color={schemeColors.primary} />
          ) : (
            <Text style={{ color: schemeColors.primary, fontSize: 17, fontWeight: '600' }}>Save</Text>
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
            style={[globalStyle.glassBase, addExpenseStyle.glassSaveButton, { marginTop: 24, opacity: loading ? 0.7 : 1 }]}
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
  );
};

export default AddExpenseForm;
