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
    const { schemeColors } = useTheme()

    const updateMapping = (csvColumn: string, appField: AppField) => {
        const updated = mappings.filter(m => m.csvColumn !== csvColumn)
        updated.push({ csvColumn, appField })
        onMappingChange(updated)
    }

    return (
        <ScrollView horizontal style={{ marginTop: 16 }}>
            <View>
                <View style={{ flexDirection: 'row' }}>
                    {headers.map(h => (
                        <View key={h} style={{ width: 120, marginRight: 8 }}>
                            <Text
                                style={{
                                    fontWeight: 'bold',
                                    fontSize: 12,
                                    color: schemeColors.text
                                }}
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
                                style={{ backgroundColor: schemeColors.background }}
                                dropdownIconColor={schemeColors.text}
                                dropdownIconRippleColor={schemeColors.border}
                            >
                                {fields.map(f => (
                                    <Picker.Item key={f} label={f} value={f}
                                        style={{ fontSize: 13, color: schemeColors.text, backgroundColor: schemeColors.background }} />
                                ))}
                            </Picker>
                        </View>
                    ))}
                </View>

                {rows.map((row, index) => (
                    <View key={index} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: schemeColors.border, paddingVertical: 8 }}>
                        {headers.map(h => (
                            <Text key={h} style={{ width: 120, marginRight: 8, fontSize: 13, color: schemeColors.text }} numberOfLines={1}>
                                {row[h]}
                            </Text>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}
