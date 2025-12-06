/**
 * Structured logging utility
 * Follows coding-standards.md for structured JSON logging
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
declare class Logger {
    private level;
    constructor(level?: LogLevel);
    private shouldLog;
    private log;
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, context?: Record<string, any>): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map