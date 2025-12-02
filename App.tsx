// App.tsx
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ExpensesListScreen from './src/screens/ExpenseList';
import AddExpenseScreen from './src/screens/AddExpense';
import TemplatesScreen from './src/screens/TemplatesScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from './src/db/migrations';
import useTheme from './src/hooks/useTheme';
import { generateDueFromRecurringRules } from './src/services/RecurrenceEngine';

const Stack = createStackNavigator();

export default function App() {
  const { schemeColors, scheme, globalStyle } = useTheme();
  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        console.log('DB migrations applied');
        
        // Process recurring rules
        const count = await generateDueFromRecurringRules();
        if (count > 0) console.log(`Generated ${count} recurring transactions`);
      } catch (err) {
        console.error('Migration/Recurrence failed', err);
      }
    })();
  }, []);
  return (
    <NavigationContainer>
      <SafeAreaView style={globalStyle.container}>
        <StatusBar
          style={scheme === 'dark' ? 'light' : 'dark'}
          translucent
          backgroundColor={schemeColors.background}
        />
        <Stack.Navigator initialRouteName="Expenses" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Expenses" component={ExpensesListScreen} />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{ title: 'Add Expense' }}
          />
          <Stack.Screen name="Templates" component={TemplatesScreen} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}
