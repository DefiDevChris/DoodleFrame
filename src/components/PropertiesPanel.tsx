import React, { useState } from 'react';
import { COLORS, STROKE_WIDTHS } from '../constants';
import { cn } from '../utils';
import { 
  Lock, Unlock, Scissors, Copy, Grid3X3, Magnet, Group, Ungroup, 
  FolderOpen, Scan, ChevronRight, ChevronLeft, MousePointer2 
} from 'lucide-react';
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
  // Detection-related props
  detectionSensitivity?: number;
  setDetectionSensitivity?: (sensitivity: number) => void;
  canDetectObjects?: boolean;
  // Auto tool switch toggle
  autoSwitchToSelect: boolean;
  setAutoSwitchToSelect: (enabled: boolean) => void;
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
  onUngroup,
  detectionSensitivity = 65,
  setDetectionSensitivity,
  canDetectObjects = false,
  autoSwitchToSelect,
  setAutoSwitchToSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Show cut controls
  const showCutControls = tool === 'cut';
  
  // Determine if we should show the panel content
  const shouldShowContent = showCutControls || hasSelection || (tool !== 'select' && tool !== 'pan');

  return (
    <div className={cn(
      "fixed top-1/2 -translate-y-1/2 z-40 flex items-start transition-all duration-300",
      isExpanded ? "left-[80px]" : "left-[72px]"
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center justify-center w-6 h-12 bg-white border border-gray-200 shadow-md rounded-r-lg -ml-1 hover:bg-gray-50 transition-colors",
          isExpanded ? "rounded-l-none" : "rounded-l-lg"
        )}
        title={isExpanded ? "Collapse properties" : "Expand properties"}
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Panel Content */}
      <div className={cn(
        "bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col transition-all duration-300 overflow-hidden",
        isExpanded ? "w-64 max-h-[80vh] opacity-100" : "w-0 opacity-0 overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Properties</h3>
          <span className="text-xs text-gray-400 capitalize">{tool}</span>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* Auto Switch to Select Toggle */}
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
            <div className="flex items-center gap-2">
              <MousePointer2 size={16} className="text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Auto-select</span>
            </div>
            <button
              onClick={() => setAutoSwitchToSelect(!autoSwitchToSelect)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                autoSwitchToSelect ? "bg-indigo-600" : "bg-gray-300"
              )}
            >
              <span className={cn(
                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                autoSwitchToSelect ? "left-5" : "left-0.5"
              )} />
            </button>
          </div>
          <p className="text-xs text-gray-500 -mt-2 ml-1">
            {autoSwitchToSelect ? "Switch to select tool after drawing" : "Stay on current tool after drawing"}
          </p>

          {/* Cut Tool Mode Toggle */}
          {showCutControls && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cut Mode</span>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setCutMode('copy')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    cutMode === 'copy' 
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Copy size={14} />
                  Copy Area
                </button>
                <button
                  onClick={() => setCutMode('cut')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    cutMode === 'cut' 
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Scissors size={14} />
                  Cut Out
                </button>
              </div>
            </div>
          )}

          {/* Group/Ungroup Controls */}
          {hasSelection && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Group</span>
              <div className="flex gap-2">
                <button
                  onClick={onGroup}
                  disabled={!canGroup}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    canGroup
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-300 cursor-not-allowed"
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
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    canUngroup
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-300 cursor-not-allowed"
                  )}
                  title="Ungroup (Ctrl+Shift+G)"
                >
                  <Ungroup size={14} />
                  Ungroup
                </button>
              </div>
            </div>
          )}

          {/* Parent Info */}
          {parentName && (
            <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
              <FolderOpen size={16} className="text-indigo-500" />
              <span className="text-sm text-gray-600">
                Inside: <span className="font-medium text-gray-800">{parentName}</span>
              </span>
            </div>
          )}

          {/* Lock Control */}
          {hasSelection && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lock</span>
              <button
                onClick={onToggleLock}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isLocked 
                    ? "bg-red-50 text-red-600 hover:bg-red-100" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                {isLocked ? "Locked" : "Unlocked"}
              </button>
            </div>
          )}

          {/* Standard Drawing Properties */}
          {!showCutControls && (!hasSelection || !isLocked) && (
            <>
              {/* Stroke Color - Hide for Eraser */}
              {tool !== 'eraser' && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stroke Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-7 h-7 rounded-full border border-gray-200 transition-transform hover:scale-110",
                          color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : ""
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stroke Width */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stroke Width</span>
                <div className="flex items-center gap-3">
                  {STROKE_WIDTHS.map((width) => (
                    <button
                      key={width}
                      onClick={() => setStrokeWidth(width)}
                      className={cn(
                        "rounded-full transition-all",
                        strokeWidth === width ? "bg-indigo-600" : "bg-gray-300 hover:bg-gray-400"
                      )}
                      style={{ width: Math.max(12, width * 2), height: Math.max(12, width * 2) }}
                      title={`${width}px`}
                    />
                  ))}
                </div>
              </div>

              {/* Fill Color (Only for shapes) */}
              {(tool === 'rect' || tool === 'circle') && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fill Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setFillColor('transparent')}
                      className={cn(
                        "w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center transition-transform hover:scale-110 bg-white",
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
                          "w-7 h-7 rounded-full border border-gray-200 transition-transform hover:scale-110",
                          fillColor === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : ""
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Grid Controls */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grid</span>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    showGrid 
                      ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Grid3X3 size={14} />
                  {showGrid ? "On" : "Off"}
                </button>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    snapToGrid 
                      ? "bg-green-50 text-green-600 hover:bg-green-100" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Magnet size={14} />
                  {snapToGrid ? "Snap" : "Free"}
                </button>
              </div>
              {showGrid && (
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10px grid</option>
                  <option value={20}>20px grid</option>
                  <option value={50}>50px grid</option>
                  <option value={100}>100px grid</option>
                </select>
              )}
            </div>
          </div>

          {/* Object Detection Sensitivity */}
          {canDetectObjects && setDetectionSensitivity && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Scan size={16} className="text-purple-600" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detection</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Sensitivity</span>
                  <span className="font-medium">{detectionSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={detectionSensitivity}
                  onChange={(e) => setDetectionSensitivity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Less</span>
                  <span>More</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
