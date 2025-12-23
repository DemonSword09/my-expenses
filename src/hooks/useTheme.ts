// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { expenseListStyles } from '../styles/expenseListStyles';
import { getThemeColors } from '../styles/theme';
import { addExpenseStyles } from '@src/styles/addExpenseStyles';

export default function useTheme() {
  const scheme = useColorScheme();
  const schemeColors = getThemeColors(scheme);
  const globalStyle = globalStyles(scheme);
  const expenseListStyle = expenseListStyles(scheme);
  const addExpenseStyle = addExpenseStyles(scheme);
  return { scheme, schemeColors, globalStyle, expenseListStyle, addExpenseStyle };
}
