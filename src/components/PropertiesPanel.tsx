import React, { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, STROKE_WIDTHS } from '../constants';
import { cn } from '../utils';
import { 
  Lock, Unlock, Scissors, Copy, Group, Ungroup, 
  FolderOpen, Scan, ChevronLeft
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
  selectedShape,
  parentName,
  canGroup = false,
  canUngroup = false,
  onGroup,
  onUngroup,
  detectionSensitivity = 65,
  setDetectionSensitivity,
  canDetectObjects = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const showTimeRef = useRef<number>(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverExitTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Show cut controls
  const showCutControls = tool === 'cut';
  
  // Determine if we should show the panel content
  const shouldShowContent = showCutControls || hasSelection || (tool !== 'select' && tool !== 'pan');

  // Reset visibility when tool changes or selection changes
  useEffect(() => {
    if (shouldShowContent) {
      setIsVisible(true);
      showTimeRef.current = Date.now();
      
      // Clear any existing timers
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      if (hoverExitTimerRef.current) {
        clearTimeout(hoverExitTimerRef.current);
      }
      
      // Start auto-hide timer (10 seconds)
      hideTimerRef.current = setTimeout(() => {
        if (!isHovered) {
          setIsVisible(false);
        }
      }, 10000);
    }
    
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [tool, hasSelection, shouldShowContent, isHovered]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Clear auto-hide timer when hovering
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    // Clear hover exit timer
    if (hoverExitTimerRef.current) {
      clearTimeout(hoverExitTimerRef.current);
      hoverExitTimerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    const timeSinceShown = Date.now() - showTimeRef.current;
    
    // If it's been more than 10 seconds since shown, hide immediately
    if (timeSinceShown >= 10000) {
      setIsVisible(false);
    } else {
      // Otherwise, start the remaining time timer
      const remainingTime = 10000 - timeSinceShown;
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, remainingTime);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (hoverExitTimerRef.current) clearTimeout(hoverExitTimerRef.current);
    };
  }, []);

  if (!shouldShowContent) return null;

  return (
    <>
      {/* Collapsed state - show expand button */}
      {!isVisible && (
        <div className="fixed top-1/2 -translate-y-1/2 left-[90px] z-40">
          <button
            onClick={() => {
              setIsVisible(true);
              showTimeRef.current = Date.now();
              // Restart auto-hide timer
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              hideTimerRef.current = setTimeout(() => {
                if (!isHovered) setIsVisible(false);
              }, 10000);
            }}
            className="bg-white rounded-r-lg shadow-lg border border-l-0 border-gray-200 p-2 hover:bg-gray-50 transition-colors"
            title="Show tool options"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
        </div>
      )}

      {/* Expanded panel */}
      {isVisible && (
        <div 
          className="fixed top-1/2 -translate-y-1/2 left-[90px] z-40"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-56 max-h-[80vh] overflow-y-auto relative">
            {/* Hide button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
              title="Hide (auto-hides in 10s)"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white pr-10">
              <h3 className="font-semibold text-gray-800 text-sm">Tool Options</h3>
              <span className="text-xs text-gray-400 capitalize">{tool}</span>
            </div>

            <div className="p-4 space-y-4">
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
      )}
    </>
  );
};
