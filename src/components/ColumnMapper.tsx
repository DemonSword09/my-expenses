import React from 'react'
import { View, Text } from 'react-native'
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

export default function ColumnMapper({
  headers,
  mappings,
  onChange,
}: {
  headers: string[]
  mappings: ColumnMapping[]
  onChange: (m: ColumnMapping[]) => void
}) {
  const updateMapping = (csvColumn: string, appField: AppField) => {
    const updated = mappings.filter(m => m.csvColumn !== csvColumn)
    updated.push({ csvColumn, appField })
    onChange(updated)
  }

  return (
    <View>
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>
        Map Columns
      </Text>

      {headers.map(header => (
        <View key={header} style={{ 
          marginVertical: 8, 
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
          paddingBottom: 8
        }}>
          <Text style={{ flex: 1, fontWeight: '500' }}>{header}</Text>
          <View style={{ flex: 1 }}>
            <Picker
              selectedValue={
                mappings.find(m => m.csvColumn === header)?.appField || 'ignore'
              }
              onValueChange={(value) =>
                updateMapping(header, value)
              }
              style={{ width: '100%' }}
            >
              {fields.map(f => (
                <Picker.Item key={f} label={f} value={f} />
              ))}
            </Picker>
          </View>
        </View>
      ))}
    </View>
  )
}
