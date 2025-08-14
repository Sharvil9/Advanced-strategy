import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const runBacktest = action({
  args: {
    strategyId: v.id("strategies"),
    symbol: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    initialCapital: v.number(),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    
    // Get strategy
    const strategy = await ctx.runQuery(api.strategies.getStrategy, {
      strategyId: args.strategyId,
    });
    
    if (!strategy) {
      throw new Error("Strategy not found");
    }
    
    // Get stock data
    const stockData = await ctx.runQuery(api.stocks.getStockData, {
      symbol: args.symbol,
      startDate: args.startDate,
      endDate: args.endDate,
    });
    
    if (stockData.length === 0) {
      throw new Error("No stock data found for the specified period");
    }
    
    // Run backtest simulation
    const backtestResults = await simulateStrategy(strategy.pineScript, stockData, args.initialCapital);
    
    // Save backtest results
    const backtestId: any = await ctx.runMutation(api.backtesting.saveBacktestResults, {
      userId: userId || undefined,
      strategyId: args.strategyId,
      symbol: args.symbol,
      startDate: args.startDate,
      endDate: args.endDate,
      initialCapital: args.initialCapital,
      results: backtestResults.results,
      trades: backtestResults.trades,
      signals: backtestResults.signals,
    });
    
    return { backtestId, ...backtestResults };
  },
});

export const saveBacktestResults = mutation({
  args: {
    userId: v.optional(v.id("users")),
    strategyId: v.id("strategies"),
    symbol: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    initialCapital: v.number(),
    results: v.object({
      totalTrades: v.number(),
      winningTrades: v.number(),
      losingTrades: v.number(),
      totalReturn: v.number(),
      maxDrawdown: v.number(),
      sharpeRatio: v.number(),
      winRate: v.number(),
      profitFactor: v.number(),
    }),
    trades: v.array(v.object({
      timestamp: v.number(),
      type: v.union(v.literal("buy"), v.literal("sell")),
      price: v.number(),
      quantity: v.number(),
      pnl: v.optional(v.number()),
    })),
    signals: v.array(v.object({
      timestamp: v.number(),
      type: v.string(),
      value: v.number(),
      color: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("backtests", {
      userId: args.userId,
      strategyId: args.strategyId,
      symbol: args.symbol,
      startDate: args.startDate,
      endDate: args.endDate,
      initialCapital: args.initialCapital,
      results: args.results,
      trades: args.trades,
      signals: args.signals,
    });
  },
});

// Simplified Pine Script interpreter for demo purposes
async function simulateStrategy(pineScript: string, stockData: any[], initialCapital: number) {
  const trades: any[] = [];
  const signals: any[] = [];
  let position = 0;
  let capital = initialCapital;
  let maxCapital = initialCapital;
  let maxDrawdown = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  
  // Simple pattern matching for common strategies
  const isMAStrategy = pineScript.includes("ta.sma") && pineScript.includes("crossover");
  const isRSIStrategy = pineScript.includes("ta.rsi");
  const isBBStrategy = pineScript.includes("ta.stdev") && pineScript.includes("Bollinger");
  
  for (let i = 20; i < stockData.length; i++) { // Start from index 20 to have enough data for indicators
    const current = stockData[i];
    const prev = stockData[i - 1];
    
    let shouldBuy = false;
    let shouldSell = false;
    
    if (isMAStrategy) {
      // Simple MA crossover logic
      const fastMA = calculateSMA(stockData.slice(i - 9, i + 1), 10);
      const slowMA = calculateSMA(stockData.slice(i - 19, i + 1), 20);
      const prevFastMA = calculateSMA(stockData.slice(i - 10, i), 10);
      const prevSlowMA = calculateSMA(stockData.slice(i - 20, i), 20);
      
      shouldBuy = position === 0 && prevFastMA <= prevSlowMA && fastMA > slowMA;
      shouldSell = position > 0 && prevFastMA >= prevSlowMA && fastMA < slowMA;
      
      // Add MA signals
      signals.push({
        timestamp: current.timestamp,
        type: "fast_ma",
        value: fastMA,
        color: "blue",
      });
      signals.push({
        timestamp: current.timestamp,
        type: "slow_ma",
        value: slowMA,
        color: "red",
      });
    } else if (isRSIStrategy) {
      // RSI strategy logic
      const rsi = calculateRSI(stockData.slice(Math.max(0, i - 14), i + 1));
      
      shouldBuy = position === 0 && rsi < 30;
      shouldSell = position > 0 && rsi > 70;
      
      // Add RSI signal
      signals.push({
        timestamp: current.timestamp,
        type: "rsi",
        value: rsi,
        color: "purple",
      });
    } else if (isBBStrategy) {
      // Bollinger Bands strategy
      const prices = stockData.slice(i - 19, i + 1).map(d => d.close);
      const sma = prices.reduce((a, b) => a + b) / prices.length;
      const variance = prices.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const upperBand = sma + (2 * stdDev);
      const lowerBand = sma - (2 * stdDev);
      
      shouldBuy = position === 0 && current.close <= lowerBand;
      shouldSell = position > 0 && current.close >= upperBand;
      
      // Add BB signals
      signals.push({
        timestamp: current.timestamp,
        type: "bb_upper",
        value: upperBand,
        color: "red",
      });
      signals.push({
        timestamp: current.timestamp,
        type: "bb_lower",
        value: lowerBand,
        color: "green",
      });
      signals.push({
        timestamp: current.timestamp,
        type: "bb_middle",
        value: sma,
        color: "orange",
      });
    }
    
    // Execute trades
    if (shouldBuy && position === 0) {
      const quantity = Math.floor(capital / current.close);
      if (quantity > 0) {
        position = quantity;
        capital -= quantity * current.close;
        trades.push({
          timestamp: current.timestamp,
          type: "buy" as const,
          price: current.close,
          quantity,
        });
      }
    } else if (shouldSell && position > 0) {
      const sellValue = position * current.close;
      const buyValue = trades[trades.length - 1]?.price * position || 0;
      const pnl = sellValue - buyValue;
      
      capital += sellValue;
      
      if (pnl > 0) {
        winningTrades++;
        totalProfit += pnl;
      } else {
        losingTrades++;
        totalLoss += Math.abs(pnl);
      }
      
      trades.push({
        timestamp: current.timestamp,
        type: "sell" as const,
        price: current.close,
        quantity: position,
        pnl,
      });
      
      position = 0;
    }
    
    // Update max capital and drawdown
    const currentValue = capital + (position * current.close);
    if (currentValue > maxCapital) {
      maxCapital = currentValue;
    }
    const drawdown = (maxCapital - currentValue) / maxCapital;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Calculate final metrics
  const finalValue = capital + (position * stockData[stockData.length - 1].close);
  const totalReturn = (finalValue - initialCapital) / initialCapital;
  const totalTrades = winningTrades + losingTrades;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
  
  // Simple Sharpe ratio calculation (assuming 0% risk-free rate)
  const returns = [];
  for (let i = 1; i < stockData.length; i++) {
    const prevValue = initialCapital; // Simplified
    const currentValue = finalValue; // Simplified
    returns.push((currentValue - prevValue) / prevValue);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const returnStdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;
  
  return {
    results: {
      totalTrades,
      winningTrades,
      losingTrades,
      totalReturn: Math.round(totalReturn * 10000) / 100, // Percentage
      maxDrawdown: Math.round(maxDrawdown * 10000) / 100, // Percentage
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      winRate: Math.round(winRate * 10000) / 100, // Percentage
      profitFactor: Math.round(profitFactor * 100) / 100,
    },
    trades,
    signals,
  };
}

// Helper functions for technical indicators
function calculateSMA(data: any[], period: number) {
  const prices = data.slice(-period).map(d => d.close);
  return prices.reduce((a, b) => a + b) / prices.length;
}

function calculateRSI(data: any[], period: number = 14) {
  if (data.length < period + 1) return 50; // Default RSI
  
  const prices = data.map(d => d.close);
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}
