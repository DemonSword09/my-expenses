// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { expenseListStyles } from '../styles/expenseListStyles';
import { getThemeColors } from '../styles/theme';
import { addExpenseStyles } from '@src/styles/addExpenseStyles';
import { csvPreviewStyles } from '../styles/csvPreviewStyles';
import { templateStyles } from '../styles/templateStyles';
import { chatStyles } from '../styles/chatStyles';
import { columnMapperStyles } from '../styles/columnMapperStyles';
import { chatScreenStyles } from '../styles/chatScreenStyles';
import { categoryListItemStyles } from '../styles/categoryListItemStyles';
import { importCsvStyles } from '../styles/importCsvStyles';
import { distributionStyles } from '../styles/distributionStyles';
import { recurrenceStyles } from '../styles/recurrenceStyles';
import { loadingStyles } from '../styles/loadingStyles';
import { pickerModalStyles } from '../styles/pickerModalStyles';
import { actionModalStyles } from '../styles/actionModalStyles';
import { menuStyles } from '../styles/menuStyles';
import { errorStyles } from '../styles/errorStyles';

export default function useTheme() {
  const scheme = useColorScheme();
  const schemeColors = getThemeColors(scheme);
  const globalStyle = globalStyles(scheme);
  const expenseListStyle = expenseListStyles(scheme);
  const addExpenseStyle = addExpenseStyles(scheme);
  const csvPreviewStyle = csvPreviewStyles(scheme);
  const templateStyle = templateStyles(scheme);
  const chatStyle = chatStyles(scheme);
  const columnMapperStyle = columnMapperStyles(scheme);
  const chatScreenStyle = chatScreenStyles(scheme);
  const categoryListItemStyle = categoryListItemStyles(scheme);
  const importCsvStyle = importCsvStyles(scheme);
  const distributionStyle = distributionStyles(scheme);
  const recurrenceStyle = recurrenceStyles(scheme);
  const loadingStyle = loadingStyles(scheme);
  const pickerModalStyle = pickerModalStyles(scheme);
  const actionModalStyle = actionModalStyles(scheme);
  const menuStyle = menuStyles(scheme);
  const errorStyle = errorStyles(scheme);

  return {
    scheme,
    schemeColors,
    globalStyle,
    expenseListStyle,
    addExpenseStyle,
    csvPreviewStyle,
    templateStyle,
    chatStyle,
    columnMapperStyle,
    chatScreenStyle,
    categoryListItemStyle,
    importCsvStyle,
    distributionStyle,
    recurrenceStyle,
    loadingStyle,
    pickerModalStyle,
    actionModalStyle,
    menuStyle,
    errorStyle,
  };
}
