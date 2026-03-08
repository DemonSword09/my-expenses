import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const LOG_DIR = new Directory(Paths.document, 'logs');
const CURRENT_LOG_FILE = new File(LOG_DIR, 'app.log');
const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024;

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class LoggerService {
    private initPromise: Promise<void> | null = null;

    private async ensureInitialized(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.initialize();
        return this.initPromise;
    }

    private async initialize(): Promise<void> {
        try {
            if (!LOG_DIR.exists) {
                await LOG_DIR.create();
            }
        } catch (error) {
            console.error('Logger initialization failed:', error);
            throw error;
        }
    }

    async log(level: LogLevel, message: string, data?: any): Promise<void> {
        const timestamp = new Date().toISOString();
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';
        const logEntry = `[${timestamp}] [${level}] ${message}${dataStr}\n`;

        if (__DEV__) {
            console.log(logEntry.trim());
        }

        try {
            await this.ensureInitialized();

            let content = '';
            if (CURRENT_LOG_FILE.exists) {
                content = await CURRENT_LOG_FILE.text();

                if (content.length > MAX_LOG_SIZE_BYTES) {
                    content = content.slice(-MAX_LOG_SIZE_BYTES / 2);
                }
            }

            content += logEntry;
            await CURRENT_LOG_FILE.write(content);
        } catch (error) {
            if (__DEV__) {
                console.error('Failed to write log:', error);
            }
        }
    }

    info(message: string, data?: any): void {
        this.log('INFO', message, data);
    }

    warn(message: string, data?: any): void {
        this.log('WARN', message, data);
    }

    error(message: string, data?: any): void {
        this.log('ERROR', message, data);
    }

    async getLogContent(): Promise<string> {
        try {
            if (!CURRENT_LOG_FILE.exists) return '';
            return await CURRENT_LOG_FILE.text();
        } catch {
            return '';
        }
    }

    async clearLogs(): Promise<void> {
        try {
            if (CURRENT_LOG_FILE.exists) {
                await CURRENT_LOG_FILE.delete();
            }
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }

    async shareLogs(): Promise<void> {
        try {
            if (!CURRENT_LOG_FILE.exists) {
                console.warn('No log file to share');
                return;
            }

            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                console.warn('Sharing is not available on this platform');
                return;
            }

            await Sharing.shareAsync(CURRENT_LOG_FILE.uri, {
                dialogTitle: 'App Logs',
                mimeType: 'text/plain',
                UTI: 'public.plain-text',
            });
        } catch (error) {
            console.error('Failed to share logs:', error);
        }
    }
}

export const Logger = new LoggerService();
