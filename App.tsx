// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ExpensesListScreen from './src/screens/ExpenseList';
import AddExpenseScreen from './src/screens/AddExpense';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from './src/db/migrations';
const Stack = createStackNavigator();

export default function App() {
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
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="dark" translucent backgroundColor={'#2564eb91'} />
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
    </SafeAreaProvider>
  );
}
