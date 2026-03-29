/**
 * 彩色终端日志工具
 * 为每个模块提供带图标和颜色的日志输出
 */

import chalk from 'chalk';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug' | 'step';

const LEVEL_CONFIG: Record<LogLevel, { icon: string; color: (s: string) => string }> = {
  info:    { icon: '💡', color: chalk.cyan },
  success: { icon: '✅', color: chalk.green },
  warn:    { icon: '⚠️ ', color: chalk.yellow },
  error:   { icon: '❌', color: chalk.red },
  debug:   { icon: '🔍', color: chalk.gray },
  step:    { icon: '▶️ ', color: chalk.magenta },
};

const MODULE_COLORS: Record<string, (s: string) => string> = {
  'STT':      chalk.hex('#4ECDC4'),
  'LLM':      chalk.hex('#45B7D1'),
  'TTS':      chalk.hex('#96CEB4'),
  'Pipeline': chalk.hex('#FFEAA7'),
  'Config':   chalk.hex('#DDA0DD'),
  'Audio':    chalk.hex('#FF6B6B'),
  'Record':   chalk.hex('#FF9F43'),
};

function getTimestamp(): string {
  return chalk.gray(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
}

function formatModule(module: string): string {
  const colorFn = MODULE_COLORS[module] || chalk.white;
  return colorFn(`[${module}]`);
}

/**
 * 创建模块专用的日志器
 *
 * @example
 * const log = createLogger('STT');
 * log.info('开始转写...');
 * log.success('转写完成', { duration: '3.2s' });
 */
export function createLogger(module: string) {
  function log(level: LogLevel, message: string, data?: unknown) {
    const { icon, color } = LEVEL_CONFIG[level];
    const parts = [
      getTimestamp(),
      formatModule(module),
      icon,
      color(message),
    ];

    console.log(parts.join(' '));

    if (data !== undefined) {
      if (typeof data === 'string') {
        // 文本数据缩进显示
        const lines = data.split('\n');
        const maxPreview = 10;
        const preview = lines.slice(0, maxPreview);
        console.log(chalk.gray('   ┌─────────────────────────────'));
        preview.forEach(line => console.log(chalk.gray('   │ ') + line));
        if (lines.length > maxPreview) {
          console.log(chalk.gray(`   │ ... 省略 ${lines.length - maxPreview} 行`));
        }
        console.log(chalk.gray('   └─────────────────────────────'));
      } else {
        console.log(chalk.gray('   '), data);
      }
    }
  }

  return {
    info:    (msg: string, data?: unknown) => log('info', msg, data),
    success: (msg: string, data?: unknown) => log('success', msg, data),
    warn:    (msg: string, data?: unknown) => log('warn', msg, data),
    error:   (msg: string, data?: unknown) => log('error', msg, data),
    debug:   (msg: string, data?: unknown) => log('debug', msg, data),
    step:    (msg: string, data?: unknown) => log('step', msg, data),

    /** 显示分隔线 */
    divider: (title?: string) => {
      if (title) {
        console.log(chalk.gray(`\n${'─'.repeat(20)} ${chalk.white(title)} ${'─'.repeat(20)}\n`));
      } else {
        console.log(chalk.gray(`\n${'─'.repeat(60)}\n`));
      }
    },

    /** 显示关键指标 */
    metric: (label: string, value: string | number, unit?: string) => {
      const unitStr = unit ? chalk.gray(` ${unit}`) : '';
      console.log(`   ${chalk.gray('•')} ${label}: ${chalk.bold.white(String(value))}${unitStr}`);
    },
  };
}
