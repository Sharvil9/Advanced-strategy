import { useState } from "react";
import { StockSelector } from "./StockSelector";
import { StrategyEditor } from "./StrategyEditor";
import { ChartVisualization } from "./ChartVisualization";
import { BacktestResults } from "./BacktestResults";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function TradingDashboard() {
  const [selectedStock, setSelectedStock] = useState<string>("RELIANCE");
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  
  const runBacktest = useAction(api.backtesting.runBacktest);
  const initializeSampleData = useMutation(api.stocks.initializeSampleData);
  const createStrategy = useMutation(api.strategies.createStrategy);
  
  const stockData = useQuery(api.stocks.getStockData, { symbol: selectedStock });
  
  const handleRunBacktest = async () => {
    if (!selectedStrategy) {
      toast.error("Please select a strategy first");
      return;
    }
    
    setIsBacktesting(true);
    try {
      // Initialize sample data if needed
      await initializeSampleData({ symbol: selectedStock });
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Handle sample strategies differently
      let results;
      if (selectedStrategy._id.startsWith('sample_')) {
        // For sample strategies, we need to create a temporary strategy or handle it differently
        // For now, let's create the strategy first if it's a sample
        const strategyId = await createStrategy({
          name: selectedStrategy.name,
          pineScript: selectedStrategy.pineScript,
          description: selectedStrategy.description || `Sample strategy: ${selectedStrategy.name}`,
          isPublic: false,
        });
        
        results = await runBacktest({
          strategyId,
          symbol: selectedStock,
          startDate,
          endDate,
          initialCapital: 100000,
        });
      } else {
        results = await runBacktest({
          strategyId: selectedStrategy._id,
          symbol: selectedStock,
          startDate,
          endDate,
          initialCapital: 100000,
        });
      }
      
      setBacktestResults(results);
      toast.success("Backtest completed successfully!");
    } catch (error) {
      console.error("Backtest failed:", error);
      toast.error("Backtest failed. Please try again.");
    } finally {
      setIsBacktesting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          <StockSelector
            selectedStock={selectedStock}
            onStockSelect={setSelectedStock}
          />
          
          <StrategyEditor
            selectedStrategy={selectedStrategy}
            onStrategySelect={setSelectedStrategy}
          />
          
          <button
            onClick={handleRunBacktest}
            disabled={isBacktesting || !selectedStrategy}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBacktesting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Backtest...
              </div>
            ) : (
              "Run Backtest"
            )}
          </button>
          
          {backtestResults && (
            <BacktestResults results={backtestResults} />
          )}
        </div>
        
        {/* Right Panel - Chart */}
        <div className="lg:col-span-2">
          <ChartVisualization
            symbol={selectedStock}
            stockData={stockData}
            backtestResults={backtestResults}
          />
        </div>
      </div>
    </div>
  );
}
