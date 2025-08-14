import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface StrategyEditorProps {
  selectedStrategy: any;
  onStrategySelect: (strategy: any) => void;
}

export function StrategyEditor({ selectedStrategy, onStrategySelect }: StrategyEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [pineScript, setPineScript] = useState("");
  const [showSamples, setShowSamples] = useState(false);
  
  const strategies = useQuery(api.strategies.getStrategies);
  const sampleStrategies = useQuery(api.strategies.getSampleStrategies);
  const createStrategy = useMutation(api.strategies.createStrategy);
  
  useEffect(() => {
    if (selectedStrategy) {
      setStrategyName(selectedStrategy.name);
      setPineScript(selectedStrategy.pineScript);
    }
  }, [selectedStrategy]);
  
  const handleSaveStrategy = async () => {
    if (!strategyName.trim() || !pineScript.trim()) {
      toast.error("Please provide both strategy name and Pine Script code");
      return;
    }
    
    try {
      const strategyId = await createStrategy({
        name: strategyName,
        pineScript: pineScript,
        description: `Custom strategy: ${strategyName}`,
        isPublic: false,
      });
      
      const newStrategy = {
        _id: strategyId,
        name: strategyName,
        pineScript: pineScript,
        description: `Custom strategy: ${strategyName}`,
        isPublic: false,
      };
      
      onStrategySelect(newStrategy);
      setIsEditing(false);
      toast.success("Strategy saved successfully!");
    } catch (error) {
      console.error("Failed to save strategy:", error);
      toast.error("Failed to save strategy");
    }
  };
  
  const handleUseSample = (sample: any) => {
    setStrategyName(sample.name);
    setPineScript(sample.pineScript);
    onStrategySelect({
      _id: `sample_${sample.name.replace(/\s+/g, '_').toLowerCase()}`,
      name: sample.name,
      pineScript: sample.pineScript,
      description: sample.description,
      isPublic: true,
    });
    setShowSamples(false);
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Strategy</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSamples(!showSamples)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Samples
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isEditing ? "Cancel" : "New"}
          </button>
        </div>
      </div>
      
      {showSamples && sampleStrategies && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Sample Strategies</h4>
          <div className="space-y-2">
            {sampleStrategies.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleUseSample(sample)}
                className="w-full text-left p-2 bg-white rounded border hover:bg-gray-50"
              >
                <div className="font-medium text-sm">{sample.name}</div>
                <div className="text-xs text-gray-600">{sample.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {!isEditing && !selectedStrategy && (
        <div className="text-center py-8 text-gray-500">
          <p>Select a sample strategy or create a new one</p>
        </div>
      )}
      
      {!isEditing && selectedStrategy && (
        <div className="space-y-3">
          <div>
            <div className="font-medium text-gray-800">{selectedStrategy.name}</div>
            {selectedStrategy.description && (
              <div className="text-sm text-gray-600">{selectedStrategy.description}</div>
            )}
          </div>
          <div className="bg-gray-50 rounded p-3">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {selectedStrategy.pineScript.substring(0, 200)}
              {selectedStrategy.pineScript.length > 200 && "..."}
            </pre>
          </div>
        </div>
      )}
      
      {isEditing && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Strategy Name"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          
          <textarea
            placeholder="Enter your Pine Script code here..."
            value={pineScript}
            onChange={(e) => setPineScript(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
          />
          
          <button
            onClick={handleSaveStrategy}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Save Strategy
          </button>
        </div>
      )}
      
      {strategies && strategies.length > 0 && !isEditing && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Your Strategies</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {strategies.map((strategy) => (
              <button
                key={strategy._id}
                onClick={() => onStrategySelect(strategy)}
                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                  selectedStrategy?._id === strategy._id
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-gray-50"
                }`}
              >
                {strategy.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
