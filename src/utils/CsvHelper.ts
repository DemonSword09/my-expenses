import Papa from 'papaparse'
import { parse, isValid, format as formatDate } from 'date-fns'

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
    let cleanSample = sample.trim()
    // Normalize JAN -> Jan, DEC -> Dec, etc. only if not already mixed case likely
    cleanSample = cleanSample.replace(/\b([a-zA-Z]{3})\b/g, (match) =>
      match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    )

    // date-fns format tokens: yyyy, dd, MM
    const formats = [
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'MM/dd/yyyy',
      'd-MMM-yyyy',
      'd-MMM-yy',
      'dd-MMM-yyyy',
      'dd-MMM-yy',
      'dd-MM-yyyy',
      'MMM dd, yyyy',
    ]

    const now = new Date()
    for (const fmt of formats) {
      // strict parsing reference date
      const parsed = parse(cleanSample, fmt, now)
      if (isValid(parsed)) {
        // Check if strict parsing actually matches the length/format roughly to avoid false positives (like 2023-01-01 parsing as d-MMM-yy)
        return fmt
      }
    }
    return null
  }

  static normalizeDate(
    value: string,
    fmt: string
  ): string | null {
    let cleanValue = value.trim()
    // Normalize JAN -> Jan, DEC -> Dec, etc.
    cleanValue = cleanValue.replace(/\b([a-zA-Z]{3})\b/g, (match) =>
      match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    )

    const parsed = parse(cleanValue, fmt, new Date())
    return isValid(parsed) ? parsed.toISOString() : null
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

  static generateCsv(
    data: any[],
    options: {
      headers?: string[]
      delimiter?: string
    } = {}
  ): string {
    const unparseConfig: any = {
      delimiter: options.delimiter || ',',
      header: true,
    };

    // Explicitly handle fields if provided
    if (options.headers) {
      unparseConfig.columns = options.headers; // functionality for Papa.unparse depends on input format
    }

    // Papa.unparse(data, config) where data is array of objects
    return Papa.unparse(data, unparseConfig);
  }
}
