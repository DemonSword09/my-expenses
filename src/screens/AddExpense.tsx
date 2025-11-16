// src/screens/AddExpense.tsx
import React from 'react';
import { StatusBar, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import useTheme from '../hooks/useTheme';
import useAddExpense from '../hooks/useAddExpense';
import CategoryPicker from '../components/CategoryPicker';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Thin screen wiring into useAddExpense + CategoryPicker.
 * UI styling via globalStyles (g) and addExpenseStyles (s).
 */
export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params: any = (route as any).params ?? {};
  const editId: string | undefined = params.id;

  const { scheme, schemeColors, globalStyle } = useTheme();
  const s = require('../styles/addExpenseStyles').addExpenseStyles(scheme);

  // hook containing logic; pass editId for edit mode
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
  } = useAddExpense(editId);

  return (
    <SafeAreaView style={globalStyle.container}>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      <View style={globalStyle.headerRow}>
        <Text style={globalStyle.headerTitle}>{editId ? 'Edit expense' : 'Add expense'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: schemeColors.muted }}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={s.formInner}>
        <Text style={s.label}>Merchant</Text>
        <TextInput
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Starbucks"
          placeholderTextColor={schemeColors.muted}
          style={[globalStyle.searchInput, { marginBottom: 12 }]}
        />

        <Text style={s.label}>Amount</Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={schemeColors.muted}
          style={[globalStyle.searchInput, { marginBottom: 12 }]}
        />

        <Text style={s.label}>Date</Text>
        <TouchableOpacity onPress={openDatePicker} style={[globalStyle.searchInput, s.dateButton]}>
          <Text style={{ color: schemeColors.muted }}>{format(new Date(dateMs), 'PP')}</Text>
        </TouchableOpacity>

        <Text style={s.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          placeholderTextColor={schemeColors.muted}
          style={[globalStyle.searchInput, { marginBottom: 12 }]}
        />

        <Text style={s.label}>Category</Text>
        <TouchableOpacity
          onPress={openCategoryPicker}
          style={[
            globalStyle.searchInput,
            {
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          ]}
        >
          <Text style={{ color: schemeColors.muted }}>
            {selectedCategory ? selectedCategory.label : 'Select category'}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={schemeColors.muted} />
        </TouchableOpacity>
        <View style={s.actionsRow}>
          <TouchableOpacity
            onPress={async () => {
              try {
                await handleSave();
                setTimeout(() => {}, 1000);
                // go back to the list after successful save
                navigation.goBack();
              } catch (err) {
                // handleSave already alerts on error; swallow here to avoid unhandled rejection
              }
            }}
            style={[globalStyle.addButton, s.saveButton, loading ? { opacity: 0.6 } : undefined]}
            disabled={loading}
          >
            <Text style={globalStyle.addButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    </SafeAreaView>
  );
}
