import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatColorValue } from '../../utils/colors';
import type { Category } from '../../db/models';
import type { CategoryNode } from '../../hooks/useCategoryListLogic';

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
    const hasChildren = item.children.length > 0;

    return (
        <View style={[styles.card, { backgroundColor: schemeColors.surface }]}>
            {/* Main Row */}
            <TouchableOpacity
                style={styles.mainRow}
                onPress={() => onToggleExpand(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.leftContent}>
                    <View style={[styles.iconBox, { backgroundColor: item.color ? item.color + '20' : schemeColors.bgMid }]}>
                        <MaterialCommunityIcons
                            name={(item.icon as any) || 'folder'}
                            size={24}
                            color={formatColorValue(item.color, schemeColors.primary)}
                        />
                    </View>
                    <Text style={[styles.mainLabel, { color: schemeColors.text }]}>{item.label}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
                        <MaterialCommunityIcons name="pencil" size={20} color={schemeColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color={schemeColors.danger} />
                    </TouchableOpacity>
                    <View style={{ width: 32, alignItems: 'center' }}>
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
                <View style={styles.childrenContainer}>
                    {item.children.map(child => (
                        <View key={child.id} style={[styles.childRow, { borderTopColor: schemeColors.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <View style={[styles.childTreeLine, { backgroundColor: schemeColors.border }]} />
                                <View style={[styles.miniIcon, { backgroundColor: child.color ? formatColorValue(child.color, schemeColors.muted) + '20' : schemeColors.bgMid }]}>
                                    <MaterialCommunityIcons
                                        name={(child.icon as any) || 'circle-small'}
                                        size={14}
                                        color={child.color ? formatColorValue(child.color, schemeColors.primary) : schemeColors.textMuted}
                                    />
                                </View>
                                <Text style={[styles.childLabel, { color: schemeColors.text }]}>{child.label}</Text>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => onEdit(child)} style={styles.actionBtn}>
                                    <MaterialCommunityIcons name="pencil" size={18} color={schemeColors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onDelete(child)} style={styles.actionBtn}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={schemeColors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {/* Add Subcategory Button */}
                    <TouchableOpacity
                        style={[styles.addChildBtn, { borderTopColor: schemeColors.border }]}
                        onPress={() => onCreateSub(item)}
                    >
                        <View style={[styles.childTreeLine, { backgroundColor: schemeColors.border, height: 20 }]} />
                        <MaterialCommunityIcons name="plus" size={20} color={schemeColors.primary} />
                        <Text style={[styles.addChildText, { color: schemeColors.primary }]}>Add Subcategory</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        // Shadow for "Pro" feel
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mainLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 8,
    },
    childrenContainer: {
        backgroundColor: 'rgba(0,0,0,0.02)', // Very subtle child background
        paddingBottom: 8,
    },
    childRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1, // Separator
    },
    childTreeLine: {
        width: 1,
        height: '100%',
        position: 'absolute',
        left: 36, // Align with parent icon center approximately
        top: -20, // Connect up
    },
    miniIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 42, // Indent
        marginRight: 12,
    },
    childLabel: {
        fontSize: 15,
    },
    addChildBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        marginLeft: 42,
    },
    addChildText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    }
});

export default React.memo(CategoryListItem);
