import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { AppField, ColumnMapping } from '../db/models'

const fields: AppField[] = [
    'date',
    'amount',
    'type',
    'category',
    'subcategory',
    'payee',
    'notes',
    'account',
    'ignore',
]

import useTheme from '../hooks/useTheme'

export default function CsvPreviewTable({
    headers,
    rows,
    mappings,
    onMappingChange,
}: {
    headers: string[]
    rows: any[]
    mappings: ColumnMapping[]
    onMappingChange: (m: ColumnMapping[]) => void
}) {
    const { schemeColors, csvPreviewStyle } = useTheme()
    const styles = csvPreviewStyle

    const updateMapping = (csvColumn: string, appField: AppField) => {
        const updated = mappings.filter(m => m.csvColumn !== csvColumn)
        updated.push({ csvColumn, appField })
        onMappingChange(updated)
    }

    return (
        <ScrollView horizontal style={styles.container}>
            <View>
                <View style={styles.headerRow}>
                    {headers.map(h => (
                        <View key={h} style={styles.headerCell}>
                            <Text
                                style={styles.headerText}
                                numberOfLines={1}
                            >
                                {h}
                            </Text>
                            <Picker
                                selectedValue={
                                    mappings.find(m => m.csvColumn === h)?.appField || 'ignore'
                                }
                                onValueChange={(value) =>
                                    updateMapping(h, value)
                                }
                                style={styles.picker}
                                dropdownIconColor={schemeColors.text}
                                dropdownIconRippleColor={schemeColors.border}
                            >
                                {fields.map(f => (
                                    <Picker.Item key={f} label={f} value={f}
                                        style={styles.pickerItem} />
                                ))}
                            </Picker>
                        </View>
                    ))}
                </View>

                {rows.map((row, index) => (
                    <View key={index} style={styles.row}>
                        {headers.map(h => (
                            <Text key={h} style={styles.cellText} numberOfLines={1}>
                                {row[h]}
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}
