import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Indian market indices
const INDIAN_INDICES = [
  { symbol: "NIFTY50", name: "NIFTY 50", exchange: "NSE", description: "Top 50 companies by market cap" },
  { symbol: "SENSEX", name: "BSE SENSEX", exchange: "BSE", description: "Top 30 companies on BSE" },
];

export const getIndices = query({
  args: {},
  handler: async () => {
    return INDIAN_INDICES;
  },
});

export const getIndexData = query({
  args: { 
    symbol: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("indexData")
      .withIndex("by_symbol_and_timestamp", (q) => q.eq("symbol", args.symbol))
      .order("asc")
      .collect();

    if (data.length === 0) {
      // Generate sample data if none exists
      return generateSampleIndexData(args.symbol);
    }

    return data;
  },
});

export const initializeSampleData = mutation({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    // Check if data already exists
    const existing = await ctx.db
      .query("stockData")
      .withIndex("by_symbol_and_timestamp", (q) => q.eq("symbol", args.symbol))
      .first();

    if (existing) {
      return { message: "Data already exists" };
    }

    // Generate and store sample data
    const sampleData = generateSampleData(args.symbol);
    
    for (const dataPoint of sampleData) {
      await ctx.db.insert("stockData", {
        symbol: args.symbol,
        timestamp: dataPoint.timestamp,
        open: dataPoint.open,
        high: dataPoint.high,
        low: dataPoint.low,
        close: dataPoint.close,
        volume: dataPoint.volume,
        date: new Date(dataPoint.timestamp).toISOString().split('T')[0],
      });
    }

    return { message: `Generated ${sampleData.length} data points for ${args.symbol}` };
  },
});

// Generate realistic sample stock data
function generateSampleData(symbol: string) {
  const data = [];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // 1 year of data
  
  let currentPrice = Math.random() * 1000 + 100; // Random starting price between 100-1100
  
  for (let i = 0; i < 252; i++) { // ~252 trading days in a year
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // Generate OHLC data with some volatility
    const volatility = 0.02; // 2% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    
    const open = currentPrice;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      timestamp: date.getTime(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    
    currentPrice = close;
  }
  
  return data;
}

export const getRealTimePrice = action({
  args: { symbol: v.string() },
  handler: async (ctx, args): Promise<any> => {
    // In production, this would call the actual NSE API
    // For demo, we'll simulate real-time price updates
    const lastData: any = await ctx.runQuery(api.stocks.getStockData, {
      symbol: args.symbol
    });
    
    const lastDataPoint: any = lastData && lastData.length > 0 ? lastData[lastData.length - 1] : null;
    
    if (!lastDataPoint) {
      return null;
    }
    
    // Simulate small price movement
    const change = (Math.random() - 0.5) * 0.01; // ±0.5% change
    const newPrice: number = lastDataPoint.close * (1 + change);
    
    return {
      symbol: args.symbol,
      price: Math.round(newPrice * 100) / 100,
      change: Math.round((newPrice - lastDataPoint.close) * 100) / 100,
      changePercent: Math.round(change * 10000) / 100,
      timestamp: Date.now(),
    };
  },
});
