import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Appbar, Button } from 'react-native-paper'
import { useNavigation } from '@react-navigation/native'
import CsvPreviewTable from '../components/CsvPreviewTable'
import useTheme from '../hooks/useTheme'
import WaveLoading from '@src/components/WaveLoading'
import { useCsvImport } from '../hooks/useCsvImport'

export default function ImportCsvScreen() {
  const { schemeColors, globalStyle } = useTheme()
  const navigation = useNavigation()

  const {
    headers,
    rows,
    mappings,
    setMappings,
    isLoading,
    progress,
    pickCsv,
    onImport
  } = useCsvImport();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: schemeColors.background,
    },
    header: {
      backgroundColor: schemeColors.background,
    },
    headerTitle: {
      color: schemeColors.text,
      fontWeight: 'bold',
    },
    scrollContent: {
      padding: 16,
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 50,
    },
    selectFileButton: {
      marginTop: 20,
    },
    emptyStateText: {
      marginTop: 16,
      color: schemeColors.muted,
      textAlign: 'center',
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    previewTitle: {
      fontSize: 16,
      color: schemeColors.text,
      fontWeight: 'bold',
    },
    confirmButton: {
      marginTop: 24,
      paddingVertical: 6,
    },
    confirmButtonLabel: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  }), [schemeColors]);

  if (isLoading) {
    return <WaveLoading progress={progress} message={`Importing ${rows.length} transactions...`} />
  }

  return (
    <View style={[globalStyle.container, styles.container]}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color={schemeColors.text} />
        <Appbar.Content title="Import from CSV" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="import" onPress={onImport} color={schemeColors.success} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {headers.length === 0 ? (
          <View style={styles.emptyState}>
            <Button
              mode="contained"
              onPress={pickCsv}
              buttonColor={schemeColors.primary}
              style={styles.selectFileButton}
            >
              Select CSV File
            </Button>
            <Text style={styles.emptyStateText}>
              Select a CSV file to map columns and import transactions.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Preview & Map Columns</Text>
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
              style={styles.confirmButton}
              labelStyle={styles.confirmButtonLabel}
            >
              Confirm Import
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  )
}
