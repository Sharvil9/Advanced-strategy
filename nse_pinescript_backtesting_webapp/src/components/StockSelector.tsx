import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface StockSelectorProps {
  selectedStock: string;
  onStockSelect: (symbol: string) => void;
}

export function StockSelector({ selectedStock, onStockSelect }: StockSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const searchResults = useQuery(api.stocks.searchStocks, { query: searchQuery });
  
  const selectedStockData = searchResults?.find(stock => stock.symbol === selectedStock);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.stock-selector')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 stock-selector">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Stock</h3>
      
      <div className="relative">
        <input
          type="text"
          placeholder="Search stocks..."
          value={isOpen ? searchQuery : selectedStockData?.symbol || selectedStock}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        
        {isOpen && searchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
            {searchResults.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => {
                  onStockSelect(stock.symbol);
                  setSearchQuery("");
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-800">{stock.symbol}</div>
                <div className="text-sm text-gray-600">{stock.name}</div>
                <div className="text-xs text-gray-500">{stock.sector}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedStockData && !isOpen && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium text-gray-800">{selectedStockData.name}</div>
          <div className="text-sm text-gray-600">{selectedStockData.sector}</div>
        </div>
      )}
    </div>
  );
}
