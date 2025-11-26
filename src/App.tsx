import { useEffect } from 'react';
import { streamEngine } from './core/StreamEngine';
import { useMarketStore } from './store/useMarketStore';

function App() {
  const { tickerConnected, klineConnected, tickers, activeCandle } = useMarketStore();

  useEffect(() => {
    // Start the stream engine
    streamEngine.start();

    // Set a default symbol for kline streaming
    streamEngine.setActiveSymbol('btcusdt');

    // Cleanup on unmount
    return () => {
      streamEngine.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-orion-bg p-8 text-white">
      <h1 className="mb-4 text-2xl font-bold text-orion-neon-cyan">
        Project ORION - Core Engine
      </h1>

      <div className="mb-4 space-y-2">
        <p>
          Ticker Stream:{' '}
          <span className={tickerConnected ? 'text-orion-neon-green' : 'text-orion-neon-red'}>
            {tickerConnected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
        <p>
          Kline Stream:{' '}
          <span className={klineConnected ? 'text-orion-neon-green' : 'text-orion-neon-red'}>
            {klineConnected ? 'Connected' : 'Disconnected'}
          </span>
        </p>
        <p>Total Tickers: {tickers.size}</p>
      </div>

      {activeCandle && (
        <div className="rounded border border-orion-neon-cyan p-4">
          <h2 className="mb-2 text-lg font-semibold text-orion-neon-cyan">
            Active Candle: {activeCandle.symbol.toUpperCase()}
          </h2>
          <p>Open: ${activeCandle.open.toFixed(2)}</p>
          <p>High: ${activeCandle.high.toFixed(2)}</p>
          <p>Low: ${activeCandle.low.toFixed(2)}</p>
          <p>Close: ${activeCandle.close.toFixed(2)}</p>
          <p>Volume: {activeCandle.volume.toFixed(4)}</p>
        </div>
      )}

      <p className="mt-8 text-sm text-gray-500">
        Open the browser console to see real-time Binance data logs.
      </p>
    </div>
  );
}

export default App;
