// App.tsx
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ExpensesListScreen from './src/screens/ExpenseList';
import AddExpenseScreen from './src/screens/AddExpense';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from './src/db/migrations';
import useTheme from './src/hooks/useTheme';
const Stack = createStackNavigator();

export default function App() {
  const { schemeColors, scheme, globalStyle } = useTheme();
  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        console.log('DB migrations applied');
      } catch (err) {
        console.error('Migration failed', err);
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
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}
