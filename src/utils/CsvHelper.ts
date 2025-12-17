import Papa from 'papaparse'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export class CsvHelper {
  static parseCsv(fileContent: string): Promise<{
    headers: string[]
    rows: Record<string, string>[]
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          resolve({
            headers: result.meta.fields || [],
            rows: result.data as Record<string, string>[],
          })
        },
        error: reject,
      })
    })
  }

  static detectDateFormat(sample: string): string | null {
    const formats = [
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'DD-MM-YYYY',
      'MMM DD, YYYY',
    ]

    for (const format of formats) {
      if (dayjs(sample, format, true).isValid()) {
        return format
      }
    }
    return null
  }

  static normalizeDate(
    value: string,
    format: string
  ): string | null {
    const parsed = dayjs(value, format, true)
    return parsed.isValid() ? parsed.toISOString() : null
  }

  static normalizeAmount(value: string): number {
    return Number(
      value
        .replace(/[^\d.-]/g, '')
        .trim()
    )
  }

  static autoMapColumns(headers: string[]): import('../db/models').ColumnMapping[] {
    const mappings: import('../db/models').ColumnMapping[] = []

    const keywords: Record<string, import('../db/models').AppField> = {
      date: 'date',
      time: 'date',
      day: 'date',
      amount: 'amount',
      cost: 'amount',
      price: 'amount',
      value: 'amount',
      payee: 'payee',
      merchant: 'payee',
      party: 'payee',
      description: 'payee',
      desc: 'payee',
      category: 'category',
      subcategory: 'subcategory',
      note: 'notes',
      comment: 'notes',
      memo: 'notes',
      remarks: 'notes',
    }

    headers.forEach((header) => {
      const lower = header.toLowerCase()
      let mappedField: import('../db/models').AppField = 'ignore' // default

      // Exact or partial match check
      for (const [key, field] of Object.entries(keywords)) {
        if (lower.includes(key)) {
          mappedField = field
          break
        }
      }

      mappings.push({
        csvColumn: header,
        appField: mappedField,
      })
    })

    return mappings
  }

  static splitCategory(
    value: string
  ): { category: string; subcategory?: string } {
    // Support >, :, / as separators
    const parts = value.split(/[:/>]/).map((v) => v.trim())
    return {
      category: parts[0],
      subcategory: parts[1],
    }
  }

  static normalizePayee(value: string): string {
    return value.trim().toLowerCase()
  }
}
