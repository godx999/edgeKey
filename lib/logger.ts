import { AppError, getErrorMessage, toAppError } from "./app-error";
import { getRequestContext } from "./request-context";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;
type LogInput = string | Error;

type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
};

function serializeError(error: Error): SerializedError {
  const serialized: SerializedError = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error instanceof AppError) {
    serialized.code = error.code;
    serialized.statusCode = error.statusCode;
    serialized.details = error.details;
    return serialized;
  }

  const appError = toAppError(error);
  serialized.code = appError.code;
  serialized.statusCode = appError.statusCode;
  serialized.details = appError.details;
  return serialized;
}

function buildLogEntry(level: LogLevel, input: LogInput, context?: LogContext) {
  const requestContext = getRequestContext();
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    ...requestContext,
    ...context,
  };

  if (input instanceof Error) {
    entry.message = getErrorMessage(input);
    entry.error = serializeError(input);
  } else {
    entry.message = input;
  }

  return entry;
}

function write(level: LogLevel, input: LogInput, context?: LogContext) {
  const entry = buildLogEntry(level, input, context);
  const method = level === "debug" ? console.debug : level === "info" ? console.info : level === "warn" ? console.warn : console.error;
  method(entry);
}

function createLogger(defaultContext?: LogContext) {
  const mergeContext = (context?: LogContext) => ({
    ...defaultContext,
    ...context,
  });

  return {
    debug(input: LogInput, context?: LogContext) {
      write("debug", input, mergeContext(context));
    },
    info(input: LogInput, context?: LogContext) {
      write("info", input, mergeContext(context));
    },
    warn(input: LogInput, context?: LogContext) {
      write("warn", input, mergeContext(context));
    },
    error(input: LogInput, context?: LogContext) {
      write("error", input, mergeContext(context));
    },
    child(context: LogContext) {
      return createLogger(mergeContext(context));
    },
  };
}

export const logger = createLogger();
