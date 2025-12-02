// src/components/CategoryPicker.tsx
import React from 'react';
import { Modal, TouchableOpacity, View, Text, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../hooks/useTheme';
import type { Category } from '../db/models';
import { formatColorValue } from '../utils/colors';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  stackParents: Array<{ id: string | null; label?: string }>;
  categories: Category[];
  onBackStack: () => void;
  onCategoryPress: (c: Category) => void;
};

export default function CategoryPicker({
  visible,
  onRequestClose,
  stackParents,
  categories,
  onBackStack,
  onCategoryPress,
}: Props) {
  const { schemeColors, globalStyle } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onRequestClose}>
      <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: schemeColors.border }]}>
          <TouchableOpacity onPress={stackParents.length > 1 ? onBackStack : onRequestClose} style={styles.headerButton}>
            <Text style={{ color: schemeColors.primary, fontSize: 17 }}>
              {stackParents.length > 1 ? 'Back' : 'Cancel'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: schemeColors.text }]}>
            {stackParents[stackParents.length - 1]?.label ?? 'Categories'}
          </Text>
          
          <View style={styles.headerButton} /> 
        </View>

        {/* List */}
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onCategoryPress(item)}
              style={[globalStyle.row, { marginBottom: 0, borderBottomWidth: 1, borderBottomColor: schemeColors.border }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {item.icon ? (
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color={formatColorValue(item.color, schemeColors.primary)}
                    style={{ marginRight: 12 }}
                  />
                ) : null}
                <Text style={[globalStyle.rowLabel, { flex: 1 }]}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={schemeColors.muted} />
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
