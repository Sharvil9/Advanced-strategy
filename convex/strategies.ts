import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createStrategy = mutation({
  args: {
    name: v.string(),
    pineScript: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    return await ctx.db.insert("strategies", {
      userId: userId || undefined,
      name: args.name,
      pineScript: args.pineScript,
      description: args.description,
      isPublic: args.isPublic,
    });
  },
});

export const getStrategies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    if (userId) {
      // Get user's strategies and public strategies
      const userStrategies = await ctx.db
        .query("strategies")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      const publicStrategies = await ctx.db
        .query("strategies")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();
      
      return [...userStrategies, ...publicStrategies.filter(s => s.userId !== userId)];
    } else {
      // Only public strategies for unauthenticated users
      return await ctx.db
        .query("strategies")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();
    }
  },
});

export const getStrategy = query({
  args: { strategyId: v.id("strategies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.strategyId);
  },
});

export const updateStrategy = mutation({
  args: {
    strategyId: v.id("strategies"),
    name: v.optional(v.string()),
    pineScript: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const strategy = await ctx.db.get(args.strategyId);
    
    if (!strategy || strategy.userId !== userId) {
      throw new Error("Strategy not found or access denied");
    }
    
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.pineScript !== undefined) updates.pineScript = args.pineScript;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    
    await ctx.db.patch(args.strategyId, updates);
    return args.strategyId;
  },
});

export const deleteStrategy = mutation({
  args: { strategyId: v.id("strategies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const strategy = await ctx.db.get(args.strategyId);
    
    if (!strategy || strategy.userId !== userId) {
      throw new Error("Strategy not found or access denied");
    }
    
    await ctx.db.delete(args.strategyId);
    return true;
  },
});

// Sample strategies for demo
export const getSampleStrategies = query({
  args: {},
  handler: async () => {
    return [
      {
        name: "Simple Moving Average Crossover",
        description: "Buy when fast MA crosses above slow MA, sell when it crosses below",
        pineScript: `//@version=5
strategy("SMA Crossover", overlay=true)

// Input parameters
fast_length = input.int(10, title="Fast MA Length")
slow_length = input.int(20, title="Slow MA Length")

// Calculate moving averages
fast_ma = ta.sma(close, fast_length)
slow_ma = ta.sma(close, slow_length)

// Plot moving averages
plot(fast_ma, color=color.blue, title="Fast MA")
plot(slow_ma, color=color.red, title="Slow MA")

// Strategy logic
if ta.crossover(fast_ma, slow_ma)
    strategy.entry("Long", strategy.long)

if ta.crossunder(fast_ma, slow_ma)
    strategy.close("Long")`,
      },
      {
        name: "RSI Oversold/Overbought",
        description: "Buy when RSI is oversold (below 30), sell when overbought (above 70)",
        pineScript: `//@version=5
strategy("RSI Strategy", overlay=false)

// Input parameters
rsi_length = input.int(14, title="RSI Length")
oversold = input.int(30, title="Oversold Level")
overbought = input.int(70, title="Overbought Level")

// Calculate RSI
rsi = ta.rsi(close, rsi_length)

// Plot RSI
plot(rsi, color=color.purple, title="RSI")
hline(oversold, "Oversold", color=color.green)
hline(overbought, "Overbought", color=color.red)

// Strategy logic
if rsi < oversold
    strategy.entry("Long", strategy.long)

if rsi > overbought
    strategy.close("Long")`,
      },
      {
        name: "Bollinger Bands Mean Reversion",
        description: "Buy when price touches lower band, sell when it touches upper band",
        pineScript: `//@version=5
strategy("Bollinger Bands", overlay=true)

// Input parameters
length = input.int(20, title="BB Length")
mult = input.float(2.0, title="BB Multiplier")

// Calculate Bollinger Bands
basis = ta.sma(close, length)
dev = mult * ta.stdev(close, length)
upper = basis + dev
lower = basis - dev

// Plot Bollinger Bands
plot(basis, color=color.orange, title="Middle Band")
plot(upper, color=color.red, title="Upper Band")
plot(lower, color=color.green, title="Lower Band")

// Strategy logic
if close <= lower
    strategy.entry("Long", strategy.long)

if close >= upper
    strategy.close("Long")`,
      }
    ];
  },
});
