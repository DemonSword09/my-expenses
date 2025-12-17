import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import { all, run, first } from '../db/sqlite';
import { generateDueFromRecurringRules } from '../services/RecurrenceEngine';
import { getNextDatesFromCron } from '../utils/cronHelpers';
import { TemplateRepo } from '../db/repositories/TemplateRepo';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DebugScreen() {
  const [rules, setRules] = useState<any[]>([]);
  const [uncategorized, setUncategorized] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await all('SELECT * FROM recurring_rules');
      setRules(r || []);

      const u = await all('SELECT * FROM transactions WHERE categoryId IS NULL');
      setUncategorized(u || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      // Delete associated template first (if any)
      await run('DELETE FROM templates WHERE recurring_rule_id = ?', [ruleId]);
      // Delete the rule
      await run('DELETE FROM recurring_rules WHERE id = ?', [ruleId]);
      // Refresh
      loadData();
    } catch (e) {
      console.error('Failed to delete rule', e);
    }
  };

  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const count = await generateDueFromRecurringRules();
      console.log(`Generated ${count} transactions`);
      await loadData();
    } catch (e) {
      console.error('Failed to recalculate', e);
    } finally {
      setLoading(false);
    }
  };

  const recalculateRuleNextDate = async (rule: any) => {
    try {
      // Find the last transaction created by this rule
      const lastTxn: { createdAt: number } | null = await first(
        'SELECT MAX(createdAt) as createdAt FROM transactions WHERE recurring_rule_id = ?',
        [rule.id]
      );

      const computedStartAt = lastTxn?.createdAt ? lastTxn.createdAt : rule.created_at;
      // We want the NEXT occurrence after the computed start.
      // If we use last transaction date, we want the next one.
      // If we use created_at (and no txns), we typically want the first one >= created_at.
      // cron-parser from startAt usually returns startAt if it matches, or next.
      // To be safe, if we have a last transaction, we add 1ms to ensure we get the *next* one.
      
      const startAt = lastTxn?.createdAt ? lastTxn.createdAt + 1000 : rule.created_at;

      console.log(`Recalculating rule ${rule.id}. LastTxn=${lastTxn?.createdAt}, CreatedAt=${rule.created_at}, StartAt=${startAt}`);

      const future = getNextDatesFromCron({
        cron: rule.cron_expression,
        tz: rule.timezone ?? 'UTC',
        startAt: startAt,
        maxCount: 1,
      });

      if (future.length > 0) {
        console.log(`New Next Date: ${new Date(future[0]).toISOString()}`);
        await TemplateRepo.updateRecurringRuleNextDate(rule.id, future[0]);
        loadData();
      } else {
        console.warn('No future date found for rule', rule.id);
      }
    } catch (e) {
      console.error('Failed to recalculate rule next date', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Debug Screen</Text>
        <Button title="Refresh" onPress={loadData} />
        <View style={{ height: 10 }} />
        <Button title="Recalculate Recurring" onPress={handleRecalculate} />
        
        <Text style={styles.section}>Recurring Rules ({rules.length})</Text>
        {rules.map((r) => (
          <View key={r.id} style={styles.card}>
            <Text>ID: {r.id}</Text>
            <Text>Cron: {r.cron_expression}</Text>
            <Text>Template: {r.template_json}</Text>
            <Text>Next: {new Date(r.next_date).toISOString()}</Text>
            <View style={styles.buttonRow}>
                <Button title="Recalculate Next" onPress={() => recalculateRuleNextDate(r)} />
                <Button title="Delete" color="red" onPress={() => deleteRule(r.id)} />
            </View>
          </View>
        ))}

        <Text style={styles.section}>Uncategorized Transactions ({uncategorized.length})</Text>
        {uncategorized.map((t) => (
          <View key={t.id} style={styles.card}>
            <Text>ID: {t.id}</Text>
            <Text>Amount: {t.amount}</Text>
            <Text>Desc: {t.comment}</Text>
            <Text>Date: {new Date(t.createdAt).toISOString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', padding: 10 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  section: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: 'white', padding: 10, marginBottom: 10, borderRadius: 5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
});
