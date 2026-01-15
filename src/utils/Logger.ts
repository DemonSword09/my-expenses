import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const LOG_DIR = new Directory(Paths.document, 'logs');
const CURRENT_LOG_FILE = new File(LOG_DIR, 'app.log');

class LoggerService {
    private initialized = false;

    async init() {
        if (this.initialized) return;

        try {
            if (!LOG_DIR.exists) {
                await LOG_DIR.create();
            }
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize logger', error);
        }
    }

    async log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message} ${data ? JSON.stringify(data) : ''}\n`;

        // Always log to console in dev
        if (__DEV__) {
            console.log(logEntry.trim());
        }

        if (!this.initialized) await this.init();
        console.log('Logger initialized');
        try {
            // Append logic: Read existing -> Append -> Write
            // (Optimize this later if a direct append method is discovered in the new API)
            let content = '';
            if (CURRENT_LOG_FILE.exists) {
                content = await CURRENT_LOG_FILE.text();
            }
            content += logEntry;
            await CURRENT_LOG_FILE.write(content);
        } catch (error) {
            console.error('Failed to write log', error);
        }
    }

    info(message: string, data?: any) {
        this.log('INFO', message, data);
    }

    warn(message: string, data?: any) {
        this.log('WARN', message, data);
    }

    error(message: string, data?: any) {
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

    async clearLogs() {
        try {
            if (CURRENT_LOG_FILE.exists) {
                await CURRENT_LOG_FILE.delete();
            }
        } catch (error) {
            console.error('Failed to clear logs', error);
        }
    }

    async shareLogs() {
        try {
            if (!CURRENT_LOG_FILE.exists) {
                return;
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(CURRENT_LOG_FILE.uri, {
                    dialogTitle: 'App Logs',
                    mimeType: 'text/plain',
                    UTI: 'public.plain-text'
                });
            } else {
                console.warn('Sharing is not available on this platform');
            }
        } catch (error) {
            console.error('Failed to share logs', error);
        }
    }
}

export const Logger = new LoggerService();
