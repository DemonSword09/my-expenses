import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { AppField, ColumnMapping } from '../db/models';
import useTheme from '../hooks/useTheme';

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
];

export default function ColumnMapper({
  headers,
  mappings,
  onChange,
}: {
  headers: string[];
  mappings: ColumnMapping[];
  onChange: (m: ColumnMapping[]) => void;
}) {
  const { columnMapperStyle } = useTheme();

  const updateMapping = (csvColumn: string, appField: AppField) => {
    const updated = mappings.filter((m) => m.csvColumn !== csvColumn);
    updated.push({ csvColumn, appField });
    onChange(updated);
  };

  return (
    <View style={columnMapperStyle.container}>
      <Text style={columnMapperStyle.title}>Map Columns</Text>

      {headers.map((header) => (
        <View key={header} style={columnMapperStyle.mappingRow}>
          <Text style={columnMapperStyle.columnLabel}>{header}</Text>
          <View style={columnMapperStyle.pickerContainer}>
            <Picker
              selectedValue={
                mappings.find((m) => m.csvColumn === header)?.appField || 'ignore'
              }
              onValueChange={(value) => updateMapping(header, value)}
              style={columnMapperStyle.picker}
            >
              {fields.map((field) => (
                <Picker.Item key={field} label={field} value={field} />
              ))}
            </Picker>
          </View>
        </View>
      ))}
    </View>
  );
}
