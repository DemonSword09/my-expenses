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
import { TransactionRepo } from '@src/db/repositories/TransactionRepo'
import { exec, first, run, all } from '@src/db/sqlite'
import { uuidSync } from '../utils/uuid'
import { CategoryRepo } from '@src/db/repositories/CategoryRepo'
import WaveLoading from '@src/components/WaveLoading'
import dayjs from 'dayjs'

export default function ImportCsvScreen() {
  const { schemeColors, globalStyle } = useTheme()
  const navigation = useNavigation()
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

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
      setRows(parsed.rows)

      const autoMapped = CsvHelper.autoMapColumns(parsed.headers)
      setMappings(autoMapped)
    }
  }

  const onImport = async () => {
    // map the rows to updated column mappings
    const categories = await CategoryRepo.listAll()
    const payees = await all<any>('SELECT * FROM payees')

    // Detect valid date format from the first non-empty date row
    let dateFormat: string | null = null
    const dateMapping = mappings.find(m => m.appField === 'date')
    if (dateMapping) {
      const sampleRow = rows.find(r => r[dateMapping.csvColumn])
      if (sampleRow) {
        dateFormat = CsvHelper.detectDateFormat(sampleRow[dateMapping.csvColumn])
      }
    }

    // map the rows to updated column mappings
    const transactions: Transaction[] = []

    setIsLoading(true)
    setProgress(0)

    try {
      await exec('BEGIN TRANSACTION')

      const total = rows.length
      let processed = 0

      for (const row of rows) {
        // UI update throttling
        processed++
        if (processed % 20 === 0) {
          setProgress(processed / total)
          // yield to event loop so animation frame can fire
          await new Promise(r => setTimeout(r, 0))
        }

        const mappedRow: Record<string, any> = {}

        mappings.forEach((mapping) => {
          if (mapping.appField === 'ignore') return
          mappedRow[mapping.appField] = row[mapping.csvColumn]
        })
        const { category, subcategory } = CsvHelper.splitCategory(mappedRow.category)
        mappedRow.category = category
        mappedRow.subcategory = subcategory

        //normalize amount
        mappedRow.amount = CsvHelper.normalizeAmount(mappedRow.amount)

        // Lookup Category
        const matchedCategory = categories.find(c => c.label.toLowerCase() === (mappedRow.category || '').toLowerCase())
        const categoryId = matchedCategory ? matchedCategory.id : null

        // Lookup Payee
        const matchedPayee = payees.find((p: any) => p.name.toLowerCase() === (mappedRow.payee || '').toLowerCase())
        let payeeId = null;
        const payeeName = (mappedRow.payee || '').trim();

        if (!matchedPayee && payeeName) {
          const payee = await TransactionRepo.addPayee({ name: payeeName })
          payeeId = payee.id
        } else if (matchedPayee) {
          payeeId = matchedPayee.id
        } else {
          // Fallback if no name provided
          payeeId = '1'
        }

        // Parse Date
        let createdAt = Date.now()
        if (mappedRow.date) {
          let normalized: string | null = null

          if (dateFormat) {
            normalized = CsvHelper.normalizeDate(mappedRow.date, dateFormat)
          }

          // Fallback: Try per-row detection if global failed
          if (!normalized) {
            const rowFormat = CsvHelper.detectDateFormat(mappedRow.date)
            if (rowFormat) {
              normalized = CsvHelper.normalizeDate(mappedRow.date, rowFormat)
            }
          }

          if (normalized) {
            createdAt = new Date(normalized).getTime()
          } else {
            // Last resort: Strict parse
            const direct = new Date(mappedRow.date).getTime()
            if (!isNaN(direct)) createdAt = direct
          }
        }
        //account id
        let accountId = null
        const r = await first<any>('SELECT id FROM accounts LIMIT 1');
        if (r && r.id) accountId = r.id;

        // Construct Transaction
        const transaction: Transaction = {
          id: uuidSync(),
          amount: parseFloat(mappedRow.amount || '0'),
          comment: mappedRow.notes || null,
          accountId: accountId,
          payeeId: payeeId,
          categoryId: categoryId,
          status: 'cleared',
          createdAt: createdAt,
          deleted: 0
        }
        transactions.push(transaction)
        await TransactionRepo.create(transaction)
      }
      await exec('COMMIT')

      // finish up animation
      setProgress(1)
      await new Promise(r => setTimeout(r, 500))

      setIsLoading(false)
      console.log(transactions.length + " Transactions imported")
      navigation.goBack()

    } catch (err) {
      console.error('Import failed', err)
      await exec('ROLLBACK')
      alert('Import failed. See console for details.')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <WaveLoading progress={progress} message={`Importing ${rows.length} transactions...`} />
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
              rows={rows.slice(0, 50)}
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
