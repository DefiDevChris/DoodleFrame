import React from 'react';
import { Grid3X3, Magnet, MousePointer2 } from 'lucide-react';
import { cn } from '../utils';

interface GlobalToolsBarProps {
  // Auto-select toggle
  autoSwitchToSelect: boolean;
  setAutoSwitchToSelect: (enabled: boolean) => void;
  // Grid controls
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
}

export const GlobalToolsBar: React.FC<GlobalToolsBarProps> = ({
  autoSwitchToSelect,
  setAutoSwitchToSelect,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  gridSize,
  setGridSize
}) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-2 py-1.5 flex items-center gap-1">
        {/* Auto-select Toggle */}
        <div className="flex items-center gap-2 px-2 py-1 border-r border-gray-200">
          <MousePointer2 size={16} className="text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">Auto</span>
          <button
            onClick={() => setAutoSwitchToSelect(!autoSwitchToSelect)}
            className={cn(
              "relative w-9 h-5 rounded-full transition-colors",
              autoSwitchToSelect ? "bg-indigo-600" : "bg-gray-300"
            )}
            title={autoSwitchToSelect ? "Auto-switch to select tool enabled" : "Stay on current tool after drawing"}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
              autoSwitchToSelect ? "left-[18px]" : "left-0.5"
            )} />
          </button>
        </div>

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors",
            showGrid 
              ? "bg-indigo-50 text-indigo-600" 
              : "text-gray-600 hover:bg-gray-100"
          )}
          title="Toggle Grid"
        >
          <Grid3X3 size={16} />
          <span className="hidden sm:inline">Grid</span>
        </button>

        {/* Snap Toggle */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors",
            snapToGrid 
              ? "bg-green-50 text-green-600" 
              : "text-gray-600 hover:bg-gray-100"
          )}
          title="Snap to Grid"
        >
          <Magnet size={16} />
          <span className="hidden sm:inline">{snapToGrid ? 'Snap' : 'Free'}</span>
        </button>

        {/* Grid Size Dropdown - only when grid is on */}
        {showGrid && (
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="ml-1 px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Grid Size"
          >
            <option value={10}>10px</option>
            <option value={20}>20px</option>
            <option value={50}>50px</option>
            <option value={100}>100px</option>
          </select>
        )}
      </div>
    </div>
  );
};
