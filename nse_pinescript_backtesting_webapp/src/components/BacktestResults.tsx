interface BacktestResultsProps {
  results: any;
}

export function BacktestResults({ results }: BacktestResultsProps) {
  if (!results) return null;
  
  const { results: metrics, trades } = results;
  
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toFixed(2);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Backtest Results</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Total Return</div>
          <div className={`text-lg font-semibold ${
            metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(metrics.totalReturn)}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Win Rate</div>
          <div className="text-lg font-semibold text-gray-800">
            {formatPercent(metrics.winRate)}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Max Drawdown</div>
          <div className="text-lg font-semibold text-red-600">
            {formatPercent(-Math.abs(metrics.maxDrawdown))}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Profit Factor</div>
          <div className="text-lg font-semibold text-gray-800">
            {formatNumber(metrics.profitFactor)}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Trades:</span>
          <span className="font-medium">{metrics.totalTrades}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Winning Trades:</span>
          <span className="font-medium text-green-600">{metrics.winningTrades}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Losing Trades:</span>
          <span className="font-medium text-red-600">{metrics.losingTrades}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sharpe Ratio:</span>
          <span className="font-medium">{formatNumber(metrics.sharpeRatio)}</span>
        </div>
      </div>
      
      {trades && trades.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Recent Trades</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {trades.slice(-5).map((trade: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-white ${
                    trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {trade.type.toUpperCase()}
                  </span>
                  <span>₹{trade.price.toFixed(2)}</span>
                </div>
                <div className="text-gray-600">
                  {new Date(trade.timestamp).toLocaleDateString()}
                </div>
                {trade.pnl !== undefined && (
                  <div className={`font-medium ${
                    trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
