import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type: 'trade' | 'signal' | 'system';
}

const SAMPLE_LOGS = [
  { msg: 'Long BTC @ $97,450 - RSI divergence on 15m', type: 'trade' as const },
  { msg: 'Signal: MACD crossover bullish ETH', type: 'signal' as const },
  { msg: 'Exit SOL short @ $185.20 +2.3%', type: 'trade' as const },
  { msg: 'System: Order book analysis complete', type: 'system' as const },
  { msg: 'Signal: Volume spike 340% BNB', type: 'signal' as const },
  { msg: 'Long ETH @ $3,420 - Golden cross', type: 'trade' as const },
  { msg: 'Risk: Position size -15%', type: 'system' as const },
  { msg: 'Signal: Support test $96,800 BTC', type: 'signal' as const },
];

function highlightMessage(message: string): React.ReactNode {
  const keywords = ['Long', 'Short', 'Exit', 'Signal', 'System', 'Risk', 'BTC', 'ETH', 'SOL', 'BNB'];
  const parts = message.split(/(\s+)/);
  return parts.map((part, idx) => {
    const isPositive = part.includes('+');
    const isNegative = part.includes('-') && part.match(/-\d/);
    const isKeyword = keywords.some(kw => part.includes(kw));
    if (isPositive) return <span key={idx} className="text-orion-neon-green">{part}</span>;
    if (isNegative) return <span key={idx} className="text-orion-neon-red">{part}</span>;
    if (isKeyword) return <span key={idx} className="text-orion-neon-cyan">{part}</span>;
    return <span key={idx}>{part}</span>;
  });
}

export function BotActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const initialLogs: LogEntry[] = SAMPLE_LOGS.slice(0, 4).map((log, idx) => ({
      id: idx,
      timestamp: new Date(Date.now() - (4 - idx) * 3000),
      message: log.msg,
      type: log.type,
    }));
    setLogs(initialLogs);

    let logId = 4;
    const interval = setInterval(() => {
      const randomLog = SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];
      setLogs(prev => [{
        id: logId++,
        timestamp: new Date(),
        message: randomLog.msg,
        type: randomLog.type,
      }, ...prev].slice(0, 12));
    }, 2000 + Math.random() * 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col rounded border border-white/5 bg-orion-panel overflow-hidden">
      <div className="h-8 flex-shrink-0 flex items-center gap-2 border-b border-white/5 px-3 bg-[#0B0E11]">
        <Terminal className="h-3.5 w-3.5 text-orion-neon-green" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">System Terminal</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 font-mono">
        {logs.map((log, idx) => (
          <div key={log.id} className={`px-2 py-0.5 text-[10px] leading-relaxed ${idx === 0 ? 'bg-white/5 border-l-2 border-orion-neon-green' : 'border-l-2 border-transparent'}`}>
            <span className="tabular-nums text-slate-500 mr-2">
              {log.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-slate-300">{highlightMessage(log.message)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
