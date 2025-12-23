import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, RefreshControl, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import useTheme from '../hooks/useTheme';
import useTemplates from '../hooks/useTemplates';
import TemplateListItem from '../components/TemplateListItem';
import TemplateEditor from '../components/TemplateEditor';
import RecurringScheduleModal from '../components/RecurringScheduleModal';
import { parseCronToPreset } from '../utils/cronPresets';
import { CategoryRepo } from '../db/repositories/CategoryRepo';

export default function TemplatesScreen({ navigation }: any) {
  const { globalStyle, schemeColors } = useTheme();
  const {
    templates,
    loading,
    load,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate,
  } = useTemplates();

  const [editorVisible, setEditorVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      load();
      // Pre-fetch categories to avoid N+1 queries in list items
      (async () => {
        try {
          const cats = await CategoryRepo.listAll();
          const map: Record<string, string> = {};
          // First pass: ID -> Label
          cats.forEach(c => { map[c.id] = c.label; });
          // Second pass: Handle hierarchy (Parent > Child)
          const fullMap: Record<string, string> = {};
          cats.forEach(c => {
            if (c.parentId && map[c.parentId]) {
              fullMap[c.id] = `${map[c.parentId]} > ${c.label}`;
            } else {
              fullMap[c.id] = c.label;
            }
          });
          setCategoryMap(fullMap);
        } catch (e) {
          console.error('Failed to load categories', e);
        }
      })();
    }, [load])
  );

  const onAdd = () => {
    setEditing(null);
    setEditorVisible(true);
  };

  const onEdit = (tpl: any) => {
    // build the initial object for editor (convert template_json -> object; populate recurrence if present)
    const initialTemplate = tpl.template_json ? JSON.parse(tpl.template_json) : {};

    // Parse cron expression to get preset values
    let preset = 'monthly';
    let timeOfDay = '09:00';
    let weekday = 1;
    let dayOfMonth = 1;

    if (tpl.cron_expression) {
      const parsed = parseCronToPreset(tpl.cron_expression);
      preset = parsed.preset;
      timeOfDay = parsed.timeOfDay;
      weekday = parsed.weekday ?? 1;
      dayOfMonth = parsed.dayOfMonth ?? 1;
    }

    const initial = {
      id: tpl.id,
      name: tpl.name,
      template: initialTemplate,
      is_recurring: tpl.is_recurring === 1,
      preset,
      timeOfDay,
      weekday,
      dayOfMonth,
      tz: tpl.timezone ?? 'UTC',
      recurring_rule: tpl.recurring_rule_id
        ? {
          cronExpression: tpl.cron_expression,
          timezone: tpl.timezone,
          nextDate: tpl.next_date,
        }
        : null,
    };
    setEditing(initial);
    setEditorVisible(true);
  };

  const onDelete = (tpl: any) => {
    Alert.alert('Delete template', 'Are you sure you want to delete this template?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTemplate(tpl.id);
        },
      },
    ]);
  };

  const onInstantiate = async (tpl: any) => {
    try {
      await instantiateTemplate(tpl.id);
      Alert.alert('Success', 'Transaction created from template.');
    } catch (err) {
      console.error('instantiate error', err);
      Alert.alert('Error', 'Unable to create transaction from template.');
    }
  };

  const onSave = async (payload: any) => {
    // payload: { id?, name, description, template, is_recurring?, recurring_rule? }
    if (!payload.id) {
      // create
      try {
        await createTemplate({
          name: payload.name,
          template: payload.template,
          is_recurring: payload.is_recurring ?? false,
          recurring_rule: payload.recurring_rule ?? null,
        } as any);
      } catch (err) {
        console.error('createTemplate error', err);
        Alert.alert('Error', 'Unable to create template.');
      }
    } else {
      // update - updateTemplate signature expects id and a patch object in useTemplates earlier
      try {
        await updateTemplate(payload.id, {
          name: payload.name,
          template_json: JSON.stringify(payload.template),
          is_recurring: payload.is_recurring ? 1 : 0,
          recurring_rule_patch: payload.recurring_rule
            ? {
              cron_expression: payload.recurring_rule.cronExpression,
              timezone: payload.recurring_rule.timezone,
              next_date: payload.recurring_rule.nextDate,
            }
            : undefined,
        } as any);
      } catch (err) {
        console.error('updateTemplate error', err);
        Alert.alert('Error', 'Unable to update template.');
      }
    }

    setEditorVisible(false);
    await load();
  };

  // Optimize: Pre-calculate derived state (parsed JSON + Category Label)
  // This avoids parsing JSON in the render loop.
  const viewData = React.useMemo(() => {
    return templates.map((t: any) => {
      let catLabel: string | undefined;
      try {
        const obj = JSON.parse(t.template_json);
        if (obj.categoryId) catLabel = categoryMap[obj.categoryId];
      } catch {
        // ignore
      }
      return { ...t, _catLabel: catLabel };
    });
  }, [templates, categoryMap]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TemplateListItem
      item={item}
      onInstantiate={() => onInstantiate(item)}
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(item)}
      categoryLabel={item._catLabel}
    />
  ), [onInstantiate, onEdit, onDelete]);

  return (
    <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
      <Appbar.Header style={{ backgroundColor: schemeColors.background, elevation: 0 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
        <Appbar.Content title="Templates" titleStyle={{ fontWeight: '700', color: schemeColors.text }} />
        <Appbar.Action icon="calendar-clock" onPress={() => setScheduleVisible(true)} color={schemeColors.text} />
        <Appbar.Action icon="bug" onPress={() => navigation.navigate('Debug')} color={schemeColors.text} />
        <Appbar.Action icon="plus" onPress={onAdd} color={schemeColors.primary} />
      </Appbar.Header>

      <FlatList
        data={viewData}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: schemeColors.muted }]}>
              No templates yet. Tap + to create one.
            </Text>
          </View>
        }
      />

      <TemplateEditor
        visible={editorVisible}
        onRequestClose={() => setEditorVisible(false)}
        onSave={onSave}
        initial={editing}
      />

      <RecurringScheduleModal
        visible={scheduleVisible}
        onClose={() => setScheduleVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
