// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { expenseListStyles } from '../styles/expenseListStyles';
import { getThemeColors } from '../styles/theme';
import { addExpenseStyles } from '@src/styles/addExpenseStyles';
import { csvPreviewStyles } from '../styles/csvPreviewStyles';
import { templateStyles } from '../styles/templateStyles';

export default function useTheme() {
  const scheme = useColorScheme();
  const schemeColors = getThemeColors(scheme);
  const globalStyle = globalStyles(scheme);
  const expenseListStyle = expenseListStyles(scheme);
  const addExpenseStyle = addExpenseStyles(scheme);
  const csvPreviewStyle = csvPreviewStyles(scheme);
  const templateStyle = templateStyles(scheme);

  return {
    scheme,
    schemeColors,
    globalStyle,
    expenseListStyle,
    addExpenseStyle,
    csvPreviewStyle,
    templateStyle
  };
}
