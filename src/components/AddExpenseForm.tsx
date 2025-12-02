// src/components/AddExpenseForm.tsx
import React, { useEffect } from 'react';
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

  const { schemeColors, globalStyle } = useTheme();

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
  } = useAddExpense(editId);

  const onSave = async () => {
    try {
      await handleSave();
      // handleSave usually handles navigation or alerts, but if we need to force goBack:
      if (!editId) {
         // for new expense, maybe we want to go back? 
         // useAddExpense might not auto-navigate.
         navigation.goBack();
      } else {
         navigation.goBack();
      }
    } catch (err) {
      // ignore
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
            />
          </View>

          <TouchableOpacity
            onPress={onSave}
            disabled={loading}
            style={[globalStyle.primaryButton, { marginTop: 24 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={globalStyle.primaryButtonText}>Save Transaction</Text>
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
