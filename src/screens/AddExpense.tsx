// src/screens/AddExpense.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import useTheme from '../hooks/useTheme';
import { Appbar } from 'react-native-paper';
import AddExpenseForm from '@src/components/Expenses/AddExpenseForm';

/**
 * Thin screen wiring into useAddExpense + CategoryPicker.
 * UI styling via globalStyles (g) and addExpenseStyles (s).
 */
export default function AddExpenseScreen() {
  const { scheme, schemeColors, globalStyle } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params: any = (route as any).params ?? {};
  const editId: string | undefined = params.id;

  return (
    <SafeAreaView style={globalStyle.container}>
      <AddExpenseForm />
    </SafeAreaView>
  );
}
