enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDevelopment = import.meta.env.MODE === 'development';

  private createLogEntry(level: LogLevel, message: string, data?: any, stack?: string): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      stack,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.sendToServer(entry);
  }

  private sendToServer(entry: LogEntry) {
    if (!this.isDevelopment) {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {});
    }
  }

  debug(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
    this.addLog(entry);
    if (this.isDevelopment) console.debug(`[${LogLevel.DEBUG}] ${message}`, data);
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.INFO, message, data);
    this.addLog(entry);
    if (this.isDevelopment) console.info(`[${LogLevel.INFO}] ${message}`, data);
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry(LogLevel.WARN, message, data);
    this.addLog(entry);
    console.warn(`[${LogLevel.WARN}] ${message}`, data);
  }

  error(message: string, error?: Error | any) {
    const stack = error instanceof Error ? error.stack : undefined;
    const entry = this.createLogEntry(LogLevel.ERROR, message, error, stack);
    this.addLog(entry);
    console.error(`[${LogLevel.ERROR}] ${message}`, error);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
