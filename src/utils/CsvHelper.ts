import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';
import { AppField, ColumnMapping } from '../db/models';
import { normalizeAmount, capitalizeFirstLetter } from './format-utils';
import { DATE_FORMATS } from '../constants';

export class CsvHelper {
  static parseCsv(fileContent: string): Promise<{
    headers: string[];
    rows: Record<string, string>[];
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        fastMode: true,
        complete: (result) => {
          resolve({
            headers: result.meta.fields || [],
            rows: result.data as Record<string, string>[],
          });
        },
        error: reject,
      });
    });
  }

  /**
   * Fast preview - reads ONLY first N rows without scanning entire file
   * Uses Papa's preview option to stop parsing early
   * Target: <300ms for any file size
   */
  static parseCsvPreview(
    fileContent: string,
    previewRows: number
  ): Promise<{
    headers: string[];
    rows: Record<string, string>[];
  }> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        preview: previewRows, // CRITICAL: stops after N rows
        fastMode: true,
        complete: (result) => {
          resolve({
            headers: result.meta.fields || [],
            rows: result.data as Record<string, string>[],
          });
        },
        error: reject,
      });
    });
  }

  /**
   * Streaming CSV parser for large files
   * Processes in chunks to prevent UI freezing
   * Automatically yields to event loop between chunks
   */
  static streamCsv(
    fileContent: string,
    fileSize: number,
    onChunk: (rows: Record<string, string>[], headers: string[]) => void | Promise<void>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{
    headers: string[];
    totalRows: number;
  }> {
    return new Promise((resolve, reject) => {
      let headers: string[] = [];
      let totalRows = 0;
      const chunkSize = 100; // Process 100 rows at a time
      let buffer: Record<string, string>[] = [];

      let previousCursor = 0;

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        fastMode: true,
        chunk: async (results: Papa.ParseResult<Record<string, string>>, parser: Papa.Parser) => {
          // Pause parsing during processing
          parser.pause();

          try {
            // Get headers from first chunk
            if (!headers.length && results.meta.fields) {
              headers = results.meta.fields;
            }

            const rows = results.data as Record<string, string>[];
            const chunkTotal = rows.length;

            // Push rows to buffer
            buffer.push(...rows);

            // Prepare for interpolation
            const currentCursor = results.meta.cursor || 0;
            const cursorDiff = currentCursor - previousCursor;
            let processedInThisChunk = 0;

            // Process fully filled chunks
            while (buffer.length >= chunkSize) {
              const batch = buffer.splice(0, chunkSize);
              await onChunk(batch, headers);

              totalRows += batch.length;
              processedInThisChunk += batch.length;

              // Interpolate progress!
              if (onProgress && chunkTotal > 0) {
                const fraction = Math.min(processedInThisChunk / chunkTotal, 1);
                const interpolatedCursor = previousCursor + (cursorDiff * fraction);

                onProgress(interpolatedCursor, fileSize);
              }

              // Yield to event loop
              await new Promise((r) => requestAnimationFrame(r));
            }

            previousCursor = currentCursor;

            // Resume parsing for next chunk
            parser.resume();
          } catch (error) {
            console.error('Stream processing error:', error);
            parser.abort();
            reject(error);
          }
        },
        complete: async () => {
          try {
            if (buffer.length > 0) {
              await onChunk(buffer, headers);
              totalRows += buffer.length;
            }

            resolve({ headers, totalRows });
          } catch (error) {
            console.error('Stream complete error:', error);
            reject(error);
          }
        },
        error: (error: Error) => {
          console.error('Papa parse error:', error);
          reject(error);
        },
      });
    });
  }

  static detectDateFormat(sample: string): string | null {
    if (!sample || typeof sample !== 'string') return null;

    // Strip quotes and trim
    const normalized = sample
      .replace(/^["']|["']$/g, '')
      .trim()
      .replace(/\b([a-zA-Z]{3})\b/g, (match) =>
        capitalizeFirstLetter(match)
      );

    for (const format of DATE_FORMATS) {
      const parsed = parse(normalized, format, new Date());
      if (isValid(parsed)) return format;
    }

    return null;
  }

  static normalizeDate(value: string, format: string): string | null {
    if (!value || !format) return null;

    const cleaned = value
      .trim()
      .replace(/\b([a-zA-Z]{3})\b/g, (match) =>
        capitalizeFirstLetter(match)
      );

    const parsed = parse(cleaned, format, new Date());
    return isValid(parsed) ? parsed.toISOString() : null;
  }

  static normalizeAmount(value: string): number {
    return normalizeAmount(value);
  }

  static autoMapColumns(headers: string[]): ColumnMapping[] {
    const keywords: Record<string, AppField> = {
      date: 'date',
      time: 'date',
      amount: 'amount',
      price: 'amount',
      payee: 'payee',
      merchant: 'payee',
      description: 'payee',
      category: 'category',
      note: 'notes',
      memo: 'notes',
    };

    return headers.map((header) => {
      const lower = header.toLowerCase();
      let appField: AppField = 'ignore';

      for (const [keyword, field] of Object.entries(keywords)) {
        if (lower.includes(keyword)) {
          appField = field;
          break;
        }
      }

      return {
        csvColumn: header,
        appField,
      };
    });
  }

  static splitCategory(value: string): {
    category: string;
    subcategory: string | undefined;
  } {
    if (!value) return { category: '', subcategory: undefined };

    // Improved regex: handles optional spaces around : / or >
    const parts = value.split(/\s*[:/>]+\s*/).map((part) => part.trim());
    return {
      category: parts[0] || '',
      subcategory: parts[1], // undefined if not present, which is correct
    };
  }

  static generateCsv(
    data: Record<string, any>[],
    options?: { delimiter?: string }
  ): string {
    return Papa.unparse(data, {
      delimiter: options?.delimiter || ',',
      header: true,
      skipEmptyLines: true,
    });
  }
}
