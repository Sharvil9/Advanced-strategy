import { useEffect, useRef, useState } from "react";

interface ChartVisualizationProps {
  symbol: string;
  stockData: any[] | undefined;
  backtestResults: any;
}

export function ChartVisualization({ symbol, stockData, backtestResults }: ChartVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth - 32, // Account for padding
          height: 400,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  useEffect(() => {
    if (!stockData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (stockData.length === 0) return;
    
    // Calculate price range
    const prices = stockData.map(d => [d.high, d.low]).flat();
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Chart dimensions
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    
    // Helper functions
    const xScale = (index: number) => margin.left + (index / (stockData.length - 1)) * chartWidth;
    const yScale = (price: number) => margin.top + ((maxPrice - price) / priceRange) * chartHeight;
    
    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (i / 5) * priceRange;
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), margin.left - 10, y + 4);
    }
    
    // Vertical grid lines
    const timeStep = Math.max(1, Math.floor(stockData.length / 8));
    for (let i = 0; i < stockData.length; i += timeStep) {
      const x = xScale(i);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartHeight);
      ctx.stroke();
      
      // Date labels
      const date = new Date(stockData[i].timestamp);
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x,
        canvas.height - 10
      );
    }
    
    // Draw candlesticks
    const candleWidth = Math.max(1, chartWidth / stockData.length * 0.8);
    
    stockData.forEach((data, index) => {
      const x = xScale(index);
      const openY = yScale(data.open);
      const closeY = yScale(data.close);
      const highY = yScale(data.high);
      const lowY = yScale(data.low);
      
      const isGreen = data.close > data.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, Math.max(1, bodyHeight));
    });
    
    // Draw signals from backtest results
    if (backtestResults?.signals) {
      const signalsByType = backtestResults.signals.reduce((acc: any, signal: any) => {
        if (!acc[signal.type]) acc[signal.type] = [];
        acc[signal.type].push(signal);
        return acc;
      }, {});
      
      // Draw moving averages and other indicators
      Object.entries(signalsByType).forEach(([type, signals]: [string, any]) => {
        if (type.includes('ma') || type.includes('bb')) {
          ctx.strokeStyle = signals[0]?.color || '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          signals.forEach((signal: any, index: number) => {
            const dataIndex = stockData.findIndex(d => d.timestamp === signal.timestamp);
            if (dataIndex >= 0) {
              const x = xScale(dataIndex);
              const y = yScale(signal.value);
              
              if (index === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          
          ctx.stroke();
        }
      });
    }
    
    // Draw trade signals
    if (backtestResults?.trades) {
      backtestResults.trades.forEach((trade: any) => {
        const dataIndex = stockData.findIndex(d => d.timestamp === trade.timestamp);
        if (dataIndex >= 0) {
          const x = xScale(dataIndex);
          const y = yScale(trade.price);
          
          ctx.fillStyle = trade.type === 'buy' ? '#10b981' : '#ef4444';
          ctx.beginPath();
          
          if (trade.type === 'buy') {
            // Draw up arrow
            ctx.moveTo(x, y + 10);
            ctx.lineTo(x - 5, y + 20);
            ctx.lineTo(x + 5, y + 20);
          } else {
            // Draw down arrow
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x - 5, y - 20);
            ctx.lineTo(x + 5, y - 20);
          }
          
          ctx.closePath();
          ctx.fill();
        }
      });
    }
    
    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${symbol} - Stock Chart`, margin.left, 16);
    
  }, [stockData, backtestResults, dimensions, symbol]);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Chart Visualization</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Buy Signal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Sell Signal</span>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ display: 'block' }}
        />
      </div>
      
      {!stockData && (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Loading chart data...</p>
          </div>
        </div>
      )}
      
      {stockData && stockData.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data available for the selected stock</p>
        </div>
      )}
    </div>
  );
}
