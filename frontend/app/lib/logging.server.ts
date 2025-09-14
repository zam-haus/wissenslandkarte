import winston, { createLogger, format, transports } from "winston";

import "winston-daily-rotate-file";
import { environment } from "./environment.server";

const levelsWithFatal = { ...winston.config.npm.levels, fatal: -1 };
winston.addColors({ fatal: "bold red" });

declare module "winston" {
  interface Logger {
    fatal: LeveledLogMethod;
  }
  interface LoggerWithTag extends Logger {
    withTag: (tag: string) => Logger;
  }
}

declare module "logform" {
  interface TransformableInfo {
    tag: string;
    childTag?: string;
    timestamp: string;
  }
}

const commonLogRotateOptions = {
  dirname: "logs",
  frequency: `${7 * 24}h`,
  zippedArchive: true,
  createSymlink: true,
};
export const baseLogger = createLogger({
  level: "info",
  levels: levelsWithFatal,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { tag: "wlk" },
  transports: [
    new transports.DailyRotateFile({
      ...commonLogRotateOptions,
      level: "warn",
      filename: "errors-and-warnings-%DATE%.log",
      maxFiles: "365d",
      symlinkName: "logs/errors-and-warnings.log",
    }),
    new transports.DailyRotateFile({
      ...commonLogRotateOptions,
      filename: "complete-%DATE%.log",
      maxFiles: "900d",
      symlinkName: "complete.log",
    }),
  ],
  exitOnError: false,
  handleExceptions: true,
  handleRejections: true,
}) as winston.LoggerWithTag;

baseLogger.withTag = (tag: string) =>
  baseLogger.child({
    childTag: `wlk-${tag}`, // cannot simply override https://github.com/winstonjs/winston/issues/2029
  });

export const logger = (tag: string) => baseLogger.withTag(tag);

if (process.env.NODE_ENV === "development") {
  const myFormat = format.printf(({ level, message, timestamp, tag, childTag, ...meta }) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${timestamp} [${childTag ?? tag}] ${level}: ${message} (${JSON.stringify(meta)})`;
  });

  if (environment.DEBUG) {
    baseLogger.level = "debug";
  }

  baseLogger.add(
    new transports.Console({
      format: format.combine(format.colorize(), myFormat),
    }),
  );
}
