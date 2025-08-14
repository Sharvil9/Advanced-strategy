import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  indices: defineTable({
    symbol: v.string(), // NIFTY50, SENSEX
    name: v.string(),
    exchange: v.string(),
    lastPrice: v.optional(v.number()),
    change: v.optional(v.number()),
    changePercent: v.optional(v.number()),
    lastUpdated: v.number(),
  }).index("by_symbol", ["symbol"]),

  indexData: defineTable({
    symbol: v.string(),
    timestamp: v.number(),
    open: v.number(),
    high: v.number(),
    low: v.number(),
    close: v.number(),
    volume: v.number(),
    date: v.string(), // YYYY-MM-DD format
    source: v.string(), // "alphavantage" or "sample"
  })
    .index("by_symbol_and_timestamp", ["symbol", "timestamp"])
    .index("by_symbol_and_date", ["symbol", "date"]),

  strategies: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    pythonCode: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    strategyType: v.string(), // "backtrader" or "custom"
  }).index("by_user", ["userId"]),

  backtests: defineTable({
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
      calmarRatio: v.optional(v.number()),
      volatility: v.optional(v.number()),
      beta: v.optional(v.number()),
    }),
    trades: v.array(v.object({
      timestamp: v.number(),
      type: v.union(v.literal("buy"), v.literal("sell")),
      price: v.number(),
      quantity: v.number(),
      pnl: v.optional(v.number()),
      commission: v.optional(v.number()),
    })),
    signals: v.array(v.object({
      timestamp: v.number(),
      type: v.string(),
      value: v.number(),
      color: v.optional(v.string()),
    })),
    indicators: v.array(v.object({
      timestamp: v.number(),
      name: v.string(),
      value: v.number(),
      color: v.optional(v.string()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_strategy", ["strategyId"]),

  realTimeData: defineTable({
    symbol: v.string(),
    price: v.number(),
    change: v.number(),
    changePercent: v.number(),
    volume: v.optional(v.number()),
    timestamp: v.number(),
    source: v.string(),
  }).index("by_symbol", ["symbol"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
