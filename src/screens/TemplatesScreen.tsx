import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Alert, RefreshControl, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import useTheme from '../hooks/useTheme';
import useTemplates from '../hooks/useTemplates';
import TemplateListItem from '../components/Template/TemplateListItem';
import TemplateEditor from '../components/Template/TemplateEditor';
import RecurringScheduleModal from '../components/Recurrence/RecurringScheduleModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAppData } from '../context/AppDataProvider';
import { parseCronToPreset } from '../utils/cronPresets';

/* ... */
// (Assuming import React part is same, just targeting the function body and styles)

export default function TemplatesScreen({ navigation }: any) {
  const { globalStyle, schemeColors, templateStyle } = useTheme();

  const {
    templates,
    loading,
    load,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate,
  } = useTemplates();
  const { getCategoryLabel } = useAppData();

  const [editorVisible, setEditorVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  // New State for confirmation
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
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
    setItemToDelete(tpl);
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteTemplate(itemToDelete.id);
      setItemToDelete(null);
      setConfirmDeleteVisible(false);
    }
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
        if (obj.categoryId) catLabel = getCategoryLabel(obj.categoryId);
      } catch {
        // ignore
      }
      return { ...t, _catLabel: catLabel };
    });
  }, [templates, getCategoryLabel]);

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
    <View style={templateStyle.container}>
      <Appbar.Header style={templateStyle.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
        <Appbar.Content title="Templates" titleStyle={templateStyle.headerTitle} />
        <Appbar.Action icon="calendar-clock" onPress={() => setScheduleVisible(true)} color={schemeColors.text} />
        {/* <Appbar.Action icon="bug" onPress={() => navigation.navigate('Debug')} color={schemeColors.text} /> */}
        <Appbar.Action icon="plus" onPress={onAdd} color={schemeColors.primary} />
      </Appbar.Header>

      <FlatList
        data={viewData}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        contentContainerStyle={templateStyle.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <View style={templateStyle.emptyState}>
            <Text style={templateStyle.emptyText}>
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

      <ConfirmationModal
        visible={confirmDeleteVisible}
        onCancel={() => {
          setConfirmDeleteVisible(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete template"
        message="Are you sure you want to delete this template?"
        confirmLabel="Delete"
        isDestructive={true}
      />
    </View>
  );
}
