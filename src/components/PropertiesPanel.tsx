import React from 'react';
import { COLORS, STROKE_WIDTHS } from '../constants';
import { cn } from '../utils';
import { Lock, Unlock, Scissors, Copy, Grid3X3, Magnet, Group, Ungroup, FolderOpen } from 'lucide-react';
import { ShapeObject } from '../types';

interface PropertiesPanelProps {
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  tool: string;
  isLocked: boolean;
  onToggleLock: () => void;
  hasSelection: boolean;
  cutMode: 'copy' | 'cut';
  setCutMode: (mode: 'copy' | 'cut') => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  // Grouping-related props
  selectedShape?: ShapeObject | null;
  parentName?: string | null;
  canGroup?: boolean;
  canUngroup?: boolean;
  onGroup?: () => void;
  onUngroup?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  fillColor,
  setFillColor,
  tool,
  isLocked,
  onToggleLock,
  hasSelection,
  cutMode,
  setCutMode,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  gridSize,
  setGridSize,
  selectedShape,
  parentName,
  canGroup = false,
  canUngroup = false,
  onGroup,
  onUngroup
}) => {
  // Hide if tool is select/pan/cut AND we don't have a selection. 
  // EXCEPTION: If tool is CUT, we always want to show the mode toggle even without selection.
  const showCutControls = tool === 'cut';
  
  // Eraser is NOW ALLOWED to show properties (for size).
  if (!showCutControls && !hasSelection && (tool === 'select' || tool === 'pan')) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex items-center gap-6 z-50 px-6">
      
      {/* Cut Tool Mode Toggle */}
      {showCutControls && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mode</span>
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                <button
                    onClick={() => setCutMode('copy')}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        cutMode === 'copy' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                    title="Copy Area (Keep Original)"
                >
                    <Copy size={14} />
                    Copy
                </button>
                <button
                    onClick={() => setCutMode('cut')}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        cutMode === 'cut' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                    title="Cut Out Area (Remove Original)"
                >
                    <Scissors size={14} />
                    Cut Out
                </button>
            </div>
          </div>
      )}

      {/* Group/Ungroup Controls (Only when shapes selected) */}
      {hasSelection && (
        <div className={cn("flex items-center gap-2", showCutControls ? "border-l border-gray-200 pl-4" : "")}>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Group</span>
          <div className="flex items-center gap-1">
            <button
              onClick={onGroup}
              disabled={!canGroup}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                canGroup
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              )}
              title="Group Selected (Ctrl+G)"
            >
              <Group size={14} />
              Group
            </button>
            <button
              onClick={onUngroup}
              disabled={!canUngroup}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                canUngroup
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              )}
              title="Ungroup (Ctrl+Shift+G)"
            >
              <Ungroup size={14} />
              Ungroup
            </button>
          </div>
        </div>
      )}

      {/* Parent Info (when child is selected) */}
      {parentName && (
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <FolderOpen size={16} className="text-indigo-500" />
          <span className="text-sm text-gray-600">
            Inside: <span className="font-medium text-gray-800">{parentName}</span>
          </span>
        </div>
      )}

      {/* Lock Control (Only when selected) */}
      {hasSelection && (
        <div className={cn("flex items-center gap-2 pr-4", showCutControls || parentName ? "border-l border-gray-200 pl-4" : "border-r border-gray-200")}>
           <button
            onClick={onToggleLock}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isLocked 
                ? "bg-red-50 text-red-600 hover:bg-red-100" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            title={isLocked ? "Unlock Object(s)" : "Lock Object(s)"}
           >
             {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
             {isLocked ? "Locked" : "Unlocked"}
           </button>
        </div>
      )}

      {/* Standard Drawing Properties (Show if we are drawing OR editing a shape that supports these) */}
      {/* We allow Eraser to see Size controls, but not Color */}
      {/* Hide standard controls for Cut tool unless we have a selection that needs them (not the case usually for cut tool itself) */}
      {!showCutControls && (!hasSelection || !isLocked) && (
        <>
            {/* Stroke Color - Hide for Eraser */}
            {tool !== 'eraser' && (
              <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stroke</span>
                  <div className="flex gap-1.5">
                  {COLORS.map((c) => (
                      <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                          "w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110",
                          color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : ""
                      )}
                      style={{ backgroundColor: c }}
                      title={c}
                      />
                  ))}
                  </div>
              </div>
            )}

            {tool !== 'eraser' && <div className="w-px h-8 bg-gray-200"></div>}

            {/* Stroke Width - Show for Eraser too */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</span>
                <div className="flex items-center gap-2">
                {STROKE_WIDTHS.map((width) => (
                    <button
                    key={width}
                    onClick={() => setStrokeWidth(width)}
                    className={cn(
                        "rounded-full bg-gray-800 transition-all",
                        strokeWidth === width ? "bg-indigo-600" : "bg-gray-300 hover:bg-gray-400"
                    )}
                    style={{ width: Math.max(8, width * 1.5), height: Math.max(8, width * 1.5) }}
                    title={`${width}px`}
                    />
                ))}
                </div>
            </div>

            {/* Fill Color (Only for shapes) */}
            {(tool === 'rect' || tool === 'circle') && (
                <>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fill</span>
                    <div className="flex gap-1.5">
                    <button
                        onClick={() => setFillColor('transparent')}
                        className={cn(
                            "w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center transition-transform hover:scale-110 bg-white",
                            fillColor === 'transparent' ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : ""
                        )}
                        title="Transparent"
                    >
                        <div className="w-full h-px bg-red-500 rotate-45 transform scale-125" />
                    </button>
                    {COLORS.map((c) => (
                        <button
                        key={c}
                        onClick={() => setFillColor(c)}
                        className={cn(
                            "w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-110",
                            fillColor === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : ""
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                        />
                    ))}
                    </div>
                </div>
                </>
            )}
        </>
      )}

      {/* Grid Controls */}
      <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grid</span>
        
        {/* Show Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            showGrid 
              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          title="Toggle Grid Visibility"
        >
          <Grid3X3 size={16} />
          {showGrid ? "On" : "Off"}
        </button>

        {/* Snap Toggle */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            snapToGrid 
              ? "bg-green-50 text-green-600 hover:bg-green-100" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          title="Toggle Snap to Grid"
        >
          <Magnet size={16} />
          {snapToGrid ? "Snap" : "Free"}
        </button>

        {/* Grid Size Selector */}
        {showGrid && (
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="ml-2 px-2 py-1 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
