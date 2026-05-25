const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const min = levels[process.env.LOG_LEVEL?.toLowerCase()] ?? levels.info;

function format(level, args) {
  const ts = new Date().toISOString();
  const tag = level.toUpperCase().padEnd(5);
  return [`${ts} ${tag}`, ...args];
}

export const logger = {
  debug: (...a) => levels.debug >= min && console.log(...format('debug', a)),
  info:  (...a) => levels.info  >= min && console.log(...format('info', a)),
  warn:  (...a) => levels.warn  >= min && console.warn(...format('warn', a)),
  error: (...a) => levels.error >= min && console.error(...format('error', a)),
};
