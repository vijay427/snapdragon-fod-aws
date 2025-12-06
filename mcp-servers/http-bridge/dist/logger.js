/**
 * Structured logging utility
 * Follows coding-standards.md for structured JSON logging
 */
class Logger {
    constructor(level = 'info') {
        this.level = level;
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
    log(level, message, context) {
        if (!this.shouldLog(level))
            return;
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message,
            ...context
        };
        const output = JSON.stringify(logEntry);
        if (level === 'error') {
            console.error(output);
        }
        else if (level === 'warn') {
            console.warn(output);
        }
        else {
            console.log(output);
        }
    }
    debug(message, context) {
        this.log('debug', message, context);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context) {
        this.log('warn', message, context);
    }
    error(message, context) {
        this.log('error', message, context);
    }
}
export const logger = new Logger(process.env.LOG_LEVEL || 'info');
//# sourceMappingURL=logger.js.map