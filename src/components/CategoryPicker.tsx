// src/components/CategoryPicker.tsx
import React from 'react';
import { Modal, TouchableOpacity, View, Text, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../hooks/useTheme';
import type { Category } from '../db/models';
import { formatColorValue } from '../utils/colors';
import { addExpenseStyles } from '../styles/addExpenseStyles';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  stackParents: Array<{ id: string | null; label?: string }>;
  categories: Category[];
  onBackStack: () => void;
  onCategoryPress: (c: Category) => void; // parent decides to navigate or select
};

export default function CategoryPicker({
  visible,
  onRequestClose,
  stackParents,
  categories,
  onBackStack,
  onCategoryPress,
}: Props) {
  const { scheme, schemeColors, globalStyle } = useTheme();
  const s = addExpenseStyles(scheme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {/* overlay closes when tapping outside */}
      <TouchableOpacity style={globalStyle.modalOverlay} onPress={onRequestClose}>
        {/* SafeAreaView ensures content is below status bar and respects safe-area */}
        <SafeAreaView
          style={{ maxHeight: '100%' }}
          // prevent overlay press propagation when tapping inside the sheet
          onStartShouldSetResponder={() => true}
        >
          <View style={globalStyle.modalSheet}>
            <View style={s.categoryModalHeader}>
              <TouchableOpacity onPress={onBackStack}>
                <Text style={{ color: schemeColors.muted }}>
                  {stackParents.length > 1 ? 'Back' : 'Close'}
                </Text>
              </TouchableOpacity>

              <Text style={s.categoryModalTitle}>
                {stackParents[stackParents.length - 1]?.label ?? 'Categories'}
              </Text>

              <View style={{ width: 48 }} />
            </View>

            <FlatList
              data={categories}
              keyExtractor={(c) => c.id}
              ItemSeparatorComponent={() => <View style={s.categorySeparator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onCategoryPress(item)}
                  style={s.categoryRow}
                  activeOpacity={0.7}
                >
                  <View style={s.categoryRowInner}>
                    {item.icon ? (
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={20}
                        color={formatColorValue(item.color, schemeColors.primary)}
                        style={{ marginRight: 12 }}
                      />
                    ) : null}
                    <Text style={s.categoryRowText}>{item.label}</Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={schemeColors.muted}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
}
