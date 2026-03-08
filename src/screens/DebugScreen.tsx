import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View, Button } from 'react-native';

import { useDebugLogic } from '../hooks/useDebugLogic';
import useTheme from '../hooks/useTheme';

export default function DebugScreen() {
  const { schemeColors, globalStyle } = useTheme();
  const {
    rules,
    uncategorized,
    loading,
    loadData,
    deleteRule,
    handleRecalculate,
    recalculateRuleNextDate,
  } = useDebugLogic();

  return (
    <SafeAreaView style={globalStyle.container}>
      <ScrollView>
        <Text style={globalStyle.headerTitle}>Debug Screen</Text>
        <Button title="Refresh" onPress={loadData} />
        <View style={globalStyle.sectionHeader} />
        <Button title="Recalculate Recurring" onPress={handleRecalculate} />

        <Text style={globalStyle.sectionHeader}>
          Recurring Rules ({rules.length})
        </Text>
        {rules.map((rule) => (
          <View key={rule.id} style={globalStyle.formSection}>
            <Text style={{ color: schemeColors.text }}>ID: {rule.id}</Text>
            <Text style={{ color: schemeColors.text }}>
              Cron: {rule.cron_expression}
            </Text>
            <Text style={{ color: schemeColors.text }}>
              Template: {rule.template_json}
            </Text>
            <Text style={{ color: schemeColors.text }}>
              Next: {new Date(rule.next_date).toISOString()}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Button
                title="Recalculate Next"
                onPress={() => recalculateRuleNextDate(rule)}
              />
              <Button
                title="Delete"
                color={schemeColors.danger}
                onPress={() => deleteRule(rule.id)}
              />
            </View>
          </View>
        ))}

        <Text style={globalStyle.sectionHeader}>
          Uncategorized Transactions ({uncategorized.length})
        </Text>
        {uncategorized.map((transaction) => (
          <View key={transaction.id} style={globalStyle.formSection}>
            <Text style={{ color: schemeColors.text }}>ID: {transaction.id}</Text>
            <Text style={{ color: schemeColors.text }}>
              Amount: {transaction.amount}
            </Text>
            <Text style={{ color: schemeColors.text }}>
              Desc: {transaction.comment}
            </Text>
            <Text style={{ color: schemeColors.text }}>
              Date: {new Date(transaction.createdAt).toISOString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
