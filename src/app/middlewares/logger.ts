import fs from 'fs';
import path from 'path';

export interface Logger {
    logRequest(method: string, endpoint: string, statusCode: number, responseTime: number): void;
    logError(endpoint: string, errorMessage: string, stack?: string): void;
    logDatabaseQuery(query: string, executionTime: number): void;
}

export function createSystemLogger(logFile: string = 'system.log'): Logger {
    function log(level: string, message: string): void {
        const timestamp: string = new Date().toISOString(); 
        const logMessage: string = `${timestamp} - ${level} - ${message}\n`;
        
        console.log(logMessage.trim()); 
        try {
            const dir = path.dirname(logFile);
            if (dir && dir !== '.' && !fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.appendFileSync(logFile, logMessage); 
        } catch (err) {
            console.error(`Failed to write to log file (${logFile}):`, err);
        }
    }

    return {
        logRequest: function(method: string, endpoint: string, statusCode: number, responseTime: number): void {
            log('INFO', 
                `REQUEST: ${method} ${endpoint} - Status: ${statusCode} - Time: ${responseTime}ms`
            );
        },

        logError: function(endpoint: string, errorMessage: string, stack?: string): void {
            const stackInfo = stack ? ` | Stack: ${stack}` : '';
            log('ERROR',
                `ERROR: ${endpoint} - ${errorMessage}${stackInfo}`
            );
        },

        logDatabaseQuery: function(query: string, executionTime: number): void {
            log('INFO',
                `DB_QUERY: ${query} - Execution Time: ${executionTime}ms`
            );
        }
    };
}

export const systemLogger = createSystemLogger();
export default createSystemLogger;