import React from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { Appbar, Button } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import CsvPreviewTable from '../components/CsvPreviewTable'
import useTheme from '../hooks/useTheme'
import WaveLoading from '@src/components/WaveLoading'
import { useCsvImport } from '../hooks/useCsvImport'

export default function ImportCsvScreen() {
  const { schemeColors, globalStyle, importCsvStyle } = useTheme()
  const navigation = useNavigation()

  const {
    headers,
    rows,
    mappings,
    setMappings,
    isLoading,
    isPreviewLoading,
    progress,
    pickCsv,
    onImport
  } = useCsvImport();

  if (isLoading) {
    return <WaveLoading progress={progress} message="Importing transactions..." />
  }

  return (
    <View style={[globalStyle.container, importCsvStyle.container]}>
      <Appbar.Header style={importCsvStyle.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
        <Appbar.Content title="Import from CSV" titleStyle={importCsvStyle.headerTitle} />
        <Appbar.Action icon="import" onPress={onImport} color={schemeColors.success} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={importCsvStyle.scrollContent}>
        {headers.length === 0 ? (
          <View style={importCsvStyle.emptyState}>
            <Button
              mode="contained"
              onPress={pickCsv}
              buttonColor={schemeColors.primary}
              style={importCsvStyle.selectFileButton}
              disabled={isPreviewLoading}
            >
              Select CSV File
            </Button>
            {isPreviewLoading ? (
              <View style={{ marginTop: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={schemeColors.primary} />
                <Text style={{ marginTop: 10, color: schemeColors.muted }}>Reading file...</Text>
              </View>
            ) : (
              <Text style={importCsvStyle.emptyStateText}>
                Select a CSV file to map columns and import transactions.
              </Text>
            )}
          </View>
        ) : (
          <>
            <View style={importCsvStyle.previewHeader}>
              <Text style={importCsvStyle.previewTitle}>Preview & Map Columns</Text>
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
              style={importCsvStyle.confirmButton}
              labelStyle={importCsvStyle.confirmButtonLabel}
            >
              Confirm Import
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  )
}
