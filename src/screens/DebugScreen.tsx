import { useDebugLogic } from '../hooks/useDebugLogic';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../hooks/useTheme';
import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Button, StyleSheet } from 'react-native';

export default function DebugScreen() {
  const { schemeColors, globalStyle } = useTheme();
  const {
    rules,
    uncategorized,
    loading,
    loadData,
    deleteRule,
    handleRecalculate,
    recalculateRuleNextDate
  } = useDebugLogic();

  return (
    <SafeAreaView style={globalStyle.container}>
      <ScrollView>
        <Text style={[styles.header, { color: schemeColors.text }]}>Debug Screen</Text>
        <Button title="Refresh" onPress={loadData} />
        <View style={{ height: 10 }} />
        <Button title="Recalculate Recurring" onPress={handleRecalculate} />

        <Text style={[styles.section, { color: schemeColors.text }]}>Recurring Rules ({rules.length})</Text>
        {rules.map((r) => (
          <View key={r.id} style={{ backgroundColor: schemeColors.surface, padding: 10, marginBottom: 10, borderRadius: 5 }}>
            <Text style={{ color: schemeColors.text }}>ID: {r.id}</Text>
            <Text style={{ color: schemeColors.text }}>Cron: {r.cron_expression}</Text>
            <Text style={{ color: schemeColors.text }}>Template: {r.template_json}</Text>
            <Text style={{ color: schemeColors.text }}>Next: {new Date(r.next_date).toISOString()}</Text>
            <View style={styles.buttonRow}>
              <Button title="Recalculate Next" onPress={() => recalculateRuleNextDate(r)} />
              <Button title="Delete" color="red" onPress={() => deleteRule(r.id)} />
            </View>
          </View>
        ))}

        <Text style={styles.section}>Uncategorized Transactions ({uncategorized.length})</Text>
        {uncategorized.map((t) => (
          <View key={t.id} style={{ backgroundColor: schemeColors.surface, padding: 10, marginBottom: 10, borderRadius: 5 }}>
            <Text style={{ color: schemeColors.text }}>ID: {t.id}</Text>
            <Text style={{ color: schemeColors.text }}>Amount: {t.amount}</Text>
            <Text style={{ color: schemeColors.text }}>Desc: {t.comment}</Text>
            <Text style={{ color: schemeColors.text }}>Date: {new Date(t.createdAt).toISOString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  section: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  // card style usually needs colors, so we might need to inline it or keep it here if we pass colors?
  // Actually easier to just use inline styles for dynamic colors or just rely on globalStyle if possible.
  // Let's keep structure but remove color references here and move them to inline/scheme usage.
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
});
