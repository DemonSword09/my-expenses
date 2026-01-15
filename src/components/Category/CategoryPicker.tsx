// src/components/CategoryPicker.tsx
import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, View, Text, FlatList, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import type { Category } from '../../db/models';
import { formatColorValue } from '../../utils/colors';

// Ensure LayoutAnimation works on Android
// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

type CategoryNode = Category & { children: Category[] };

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  categories: CategoryNode[];
  onCategoryPress: (c: Category) => void;
};

export default function CategoryPicker({
  visible,
  onRequestClose,
  categories,
  onCategoryPress,
}: Props) {
  const { schemeColors, globalStyle } = useTheme();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };



  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onRequestClose}>
      <View style={[styles.container, { backgroundColor: schemeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: schemeColors.border }]}>
          <TouchableOpacity onPress={onRequestClose} style={styles.headerButton}>
            <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: schemeColors.text }]}>Select Category</Text>
          <View style={styles.headerButton} />
        </View>

        {/* List */}
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isExpanded = expandedIds.has(item.id);
            const children = item.children || [];
            const hasChildren = children.length > 0;

            return (
              <View style={[styles.card, { backgroundColor: item.color ? item.color + '10' : schemeColors.surface, marginBottom: 8 }]}>
                {/* Main Row - Single Interaction */}
                <TouchableOpacity
                  style={styles.mainSelectArea}
                  onPress={() => {
                    if (hasChildren) toggleExpand(item.id);
                    else onCategoryPress(item);
                  }}
                  onLongPress={() => onCategoryPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color ? item.color + '20' : schemeColors.bgMid }]}>
                    <MaterialCommunityIcons
                      name={(item.icon as any) || 'folder'}
                      size={24}
                      color={formatColorValue(item.color, schemeColors.primary)}
                    />
                  </View>
                  <Text style={[styles.mainLabel, { color: schemeColors.text, flex: 1 }]}>{item.label}</Text>

                  {hasChildren && (
                    <MaterialCommunityIcons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={schemeColors.textMuted}
                    />
                  )}
                </TouchableOpacity>

                {/* Children */}
                {isExpanded && (
                  <View style={styles.childrenContainer}>
                    {children.map(child => (
                      <TouchableOpacity
                        key={child.id}
                        style={[styles.childRow, { borderTopColor: schemeColors.border }]}
                        onPress={() => onCategoryPress(child)}
                      >
                        <View style={[styles.childTreeLine, { backgroundColor: schemeColors.border }]} />
                        <View style={[styles.miniIcon, { backgroundColor: child.color ? formatColorValue(child.color, schemeColors.muted) + '20' : schemeColors.bgMid }]}>
                          <MaterialCommunityIcons
                            name={(child.icon as any) || 'circle-small'}
                            size={14}
                            color={child.color ? formatColorValue(child.color, schemeColors.primary) : schemeColors.textMuted}
                          />
                        </View>
                        <Text style={[styles.childLabel, { color: schemeColors.text }]}>{child.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
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
  // Card style from CategoryListScreen
  // Card style from CategoryListScreen - Tinted
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mainSelectArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // Compact
  },
  iconBox: {
    width: 36, // Compact
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mainLabel: {
    fontSize: 15, // Slightly smaller
    fontWeight: '600',
    marginRight: 8,
  },
  childrenContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingBottom: 4,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Compact
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  childTreeLine: {
    width: 1,
    height: '150%',
    position: 'absolute',
    left: 29, // Adjusted for new icon size/padding (12 pad + 36/2 center ~= 30)
    top: -18,
  },
  miniIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 36, // Indent
    marginRight: 10,
  },
  childLabel: {
    fontSize: 14,
  }
});
