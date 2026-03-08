// src/components/CategoryPicker.tsx
import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, View, Text, FlatList, StyleSheet, LayoutAnimation, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import type { Category } from '../../db/models';
import { formatColorValue } from '../../utils/colors';
import { CategoryIcon } from './CategoryIcon';

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
  const { schemeColors, pickerModalStyle } = useTheme();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const lowerQuery = searchQuery.toLowerCase();
    
    return categories.map(parent => {
      const parentMatch = parent.label.toLowerCase().includes(lowerQuery);
      const filteredChildren = (parent.children || []).filter(child => 
        child.label.toLowerCase().includes(lowerQuery)
      );
      
      if (parentMatch || filteredChildren.length > 0) {
        return {
          ...parent,
          children: parentMatch ? parent.children : filteredChildren
        };
      }
      return null;
    }).filter(Boolean) as CategoryNode[];
  }, [categories, searchQuery]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const styles = pickerModalStyle; // Convenient alias

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onRequestClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: schemeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: schemeColors.border }]}>
          <TouchableOpacity onPress={onRequestClose} style={styles.headerButton}>
            <Text style={{ color: schemeColors.primary, fontSize: 17 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: schemeColors.text }]}>Select Category</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8 }}>
          <TextInput
            style={{
              backgroundColor: schemeColors.bgMid,
              color: schemeColors.text,
              padding: 12,
              borderRadius: 8,
              fontSize: 16,
            }}
            placeholder="Search categories..."
            placeholderTextColor={schemeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* List */}
        <FlatList
          data={filteredCategories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isSearching = !!searchQuery.trim();
            const isExpanded = isSearching || expandedIds.has(item.id);
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
                    <CategoryIcon
                      categoryLabel={item.label}
                      categoryIcon={item.icon}
                      size={24}
                      color={schemeColors.primary}
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
                    {children.map((child: any) => (
                      <TouchableOpacity
                        key={child.id}
                        style={[styles.childRow, { borderTopColor: schemeColors.border }]}
                        onPress={() => onCategoryPress(child)}
                      >
                        <View style={[styles.childTreeLine, { backgroundColor: schemeColors.border }]} />
                        <View style={[styles.miniIcon, { backgroundColor: child.color ? formatColorValue(child.color, schemeColors.muted) + '20' : schemeColors.bgMid }]}>
                          <CategoryIcon
                            categoryLabel={child.label}
                            parentLabel={item.label}
                            categoryIcon={child.icon}
                            size={14}
                            color={schemeColors.primary}
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
      </SafeAreaView>
    </Modal>
  );
}
