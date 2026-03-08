import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatColorValue } from '../../utils/colors';
import type { Category } from '../../db/models';
import type { CategoryNode } from '../../hooks/useCategoryListLogic';
import useTheme from '../../hooks/useTheme';
import { CategoryIcon } from './CategoryIcon';

interface Props {
    item: CategoryNode;
    isExpanded: boolean;
    schemeColors: any;
    onToggleExpand: (id: string) => void;
    onEdit: (cat: Category) => void;
    onDelete: (cat: Category) => void;
    onCreateSub: (parent: Category) => void;
}

const CategoryListItem = ({
    item,
    isExpanded,
    schemeColors,
    onToggleExpand,
    onEdit,
    onDelete,
    onCreateSub,
}: Props) => {
    const { categoryListItemStyle } = useTheme();
    const hasChildren = item.children.length > 0;

    return (
        <View style={categoryListItemStyle.card}>
            {/* Main Row */}
            <TouchableOpacity
                style={categoryListItemStyle.mainRow}
                onPress={() => onToggleExpand(item.id)}
                activeOpacity={0.7}
            >
                <View style={categoryListItemStyle.leftContent}>
                    <View style={[categoryListItemStyle.iconBox, { backgroundColor: item.color ? item.color + '20' : schemeColors.bgMid }]}>
                        <CategoryIcon
                            categoryLabel={item.label}
                            categoryIcon={item.icon}
                            size={24}
                            color={schemeColors.primary}
                        />
                    </View>
                    <Text style={categoryListItemStyle.mainLabel}>{item.label}</Text>
                </View>
                <View style={categoryListItemStyle.actions}>
                    <TouchableOpacity onPress={() => onEdit(item)} style={categoryListItemStyle.actionBtn}>
                        <MaterialCommunityIcons name="pencil" size={20} color={schemeColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item)} style={categoryListItemStyle.actionBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={schemeColors.danger} />
                    </TouchableOpacity>
                    <View style={categoryListItemStyle.expandIconContainer}>
                        {hasChildren && (
                            <MaterialCommunityIcons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={24}
                                color={schemeColors.textMuted}
                            />
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            {/* Expanded Content (Children) */}
            {isExpanded && (
                <View style={categoryListItemStyle.childrenContainer}>
                    {item.children.map(child => (
                        <View key={child.id} style={categoryListItemStyle.childRow}>
                            <View style={categoryListItemStyle.childContentWrapper}>
                                <View style={categoryListItemStyle.childTreeLine} />
                                <View style={[categoryListItemStyle.miniIcon, { backgroundColor: child.color ? formatColorValue(child.color, schemeColors.muted) + '20' : schemeColors.bgMid }]}>
                                    <CategoryIcon
                                        categoryLabel={child.label}
                                        parentLabel={item.label}
                                        categoryIcon={child.icon}
                                        size={14}
                                        color={schemeColors.primary}
                                    />
                                </View>
                                <Text style={categoryListItemStyle.childLabel}>{child.label}</Text>
                            </View>
                            <View style={categoryListItemStyle.actions}>
                                <TouchableOpacity onPress={() => onEdit(child)} style={categoryListItemStyle.actionBtn}>
                                    <MaterialCommunityIcons name="pencil" size={18} color={schemeColors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onDelete(child)} style={categoryListItemStyle.actionBtn}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={schemeColors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {/* Add Subcategory Button */}
                    <TouchableOpacity
                        style={categoryListItemStyle.addChildBtn}
                        onPress={() => onCreateSub(item)}
                    >
                        <View style={[categoryListItemStyle.childTreeLine, { height: 20 }]} />
                        <MaterialCommunityIcons name="plus" size={20} color={schemeColors.primary} />
                        <Text style={categoryListItemStyle.addChildText}>Add Subcategory</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// Memo export remains same, but without generic prop pass-through for styles usually
export default React.memo(CategoryListItem);
