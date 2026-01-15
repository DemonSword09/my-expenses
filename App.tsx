// App.tsx
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ExpensesListScreen from './src/screens/ExpenseList';
import AddExpenseScreen from './src/screens/AddExpense';
import TemplatesScreen from './src/screens/TemplatesScreen';
import DebugScreen from './src/screens/DebugScreen';
import ImportCsvScreen from './src/screens/ImportCsvScreen';
import DistributionScreen from './src/screens/DistributionScreen';
import MerchantListScreen from './src/screens/MerchantListScreen';
import CategoryListScreen from './src/screens/CategoryListScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from './src/db/migrations';
import useTheme from './src/hooks/useTheme';
import { generateDueFromRecurringRules } from './src/services/RecurrenceEngine';
import { View, ActivityIndicator } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AppDataProvider } from './src/context/AppDataProvider';

const Stack = createStackNavigator();

export default function App() {
  const { schemeColors, scheme, globalStyle } = useTheme();
  const [isReady, setIsReady] = useState(false);

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
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  if (!isReady) {
    return (
      <SafeAreaView style={[globalStyle.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar
          style={scheme === 'dark' ? 'light' : 'dark'}
          translucent
          backgroundColor={schemeColors.background}
        />
        <ActivityIndicator size="large" color={schemeColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <AppDataProvider>
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
              <Stack.Screen name="Debug" component={DebugScreen} />
              <Stack.Screen name="ImportCsv" component={ImportCsvScreen} />
              <Stack.Screen name="Distribution" component={DistributionScreen} />
              <Stack.Screen name="MerchantList" component={MerchantListScreen} />
              <Stack.Screen name="CategoryList" component={CategoryListScreen} />
              <Stack.Screen name="ChatAgent" component={require('./src/screens/ChatScreen').default} />
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </AppDataProvider>
    </ErrorBoundary>
  );
}
