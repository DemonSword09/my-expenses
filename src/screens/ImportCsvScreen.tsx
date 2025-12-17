import React, { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { File as ExpoFile } from 'expo-file-system'
import { Appbar, Button } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import { CsvHelper } from '../utils/CsvHelper'
import { ColumnMapping, Transaction } from '../db/models'
import CsvPreviewTable from '../components/CsvPreviewTable'
import useTheme from '../hooks/useTheme'

export default function ImportCsvScreen() {
  const { schemeColors, globalStyle } = useTheme()
  const navigation = useNavigation()
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  const pickCsv = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/*',
    })

    if (result.assets?.[0]) {
      const file = result.assets[0]
      const fileObj = new ExpoFile(file.uri)
      const content = await fileObj.text()

      const parsed = await CsvHelper.parseCsv(content)
      setHeaders(parsed.headers)
      setRows(parsed.rows.slice(0, 20)) // preview only

      const autoMapped = CsvHelper.autoMapColumns(parsed.headers)
      setMappings(autoMapped)
    }
  }

  const onImport = () => {
    // map the rows to updated column mappings
    const mappedRows = rows.map((row) => {
      const mappedRow: Record<string, any> = {}

      mappings.forEach((mapping) => {
        if (mapping.appField === 'ignore') return
        mappedRow[mapping.appField] = row[mapping.csvColumn]
      })
      const { category, subcategory } = CsvHelper.splitCategory(mappedRow.category)
      mappedRow.category = category
      mappedRow.subcategory = subcategory
      return mappedRow
    })

    console.log('Mapped Rows:', mappedRows)
    //validate and save to DB


  }

  return (
    <View style={[globalStyle.container, { backgroundColor: schemeColors.background }]}>
      <Appbar.Header style={{ backgroundColor: schemeColors.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
        <Appbar.Content title="Import from CSV" titleStyle={{ color: schemeColors.text, fontWeight: 'bold' }} />
        <Appbar.Action icon="import" onPress={onImport} color={schemeColors.success} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {headers.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Button
              mode="contained"
              onPress={pickCsv}
              buttonColor={schemeColors.primary}
              style={{ marginTop: 20 }}
            >
              Select CSV File
            </Button>
            <Text style={{ marginTop: 16, color: schemeColors.muted, textAlign: 'center' }}>
              Select a CSV file to map columns and import transactions.
            </Text>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, color: schemeColors.text, fontWeight: 'bold' }}>Preview & Map Columns</Text>
              <Button mode="outlined" onPress={pickCsv} textColor={schemeColors.primary}>
                Change File
              </Button>
            </View>

            <CsvPreviewTable
              headers={headers}
              rows={rows}
              mappings={mappings}
              onMappingChange={setMappings}
            />

            <Button
              mode="contained"
              onPress={onImport}
              buttonColor={schemeColors.success}
              style={{ marginTop: 24, paddingVertical: 6 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              Confirm Import
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  )
}
