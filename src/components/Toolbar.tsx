import React, { useState } from 'react';
import {
  MousePointer2,
  Hand,
  Pen,
  Highlighter,
  ArrowRight,
  ArrowUpRight,
  Square,
  Circle,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Image as ImageIcon,
  LayoutTemplate,
  X,
  ZoomIn,
  ZoomOut,
  Group,
  Ungroup,
  Shapes,
  Scan
} from 'lucide-react';
import { ToolType } from '../types';
import { cn } from '../utils';
import { TEMPLATES } from '../templates';

interface ToolbarProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTemplate: (src: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onToggleShapeLibrary?: () => void;
  isShapeLibraryOpen?: boolean;
  onDetectObjects?: () => void;
  canDetectObjects?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canGroup?: boolean;
  canUngroup?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onSelectTool,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onImageUpload,
  onAddTemplate,
  onZoomIn,
  onZoomOut,
  onGroup,
  onUngroup,
  onToggleShapeLibrary,
  isShapeLibraryOpen = false,
  onDetectObjects,
  canDetectObjects = false,
  canUndo,
  canRedo,
  canGroup = false,
  canUngroup = false
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  
  const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select (Box)' },
    { id: 'pan', icon: <Hand size={20} />, label: 'Pan' },
    { id: 'pen', icon: <Pen size={20} />, label: 'Pen' },
    { id: 'marker', icon: <Highlighter size={20} />, label: 'Marker' },
    { id: 'arrow', icon: <ArrowRight size={20} />, label: 'Arrow' },
    { id: 'smart-arrow', icon: <ArrowUpRight size={20} />, label: 'Smart Arrow (Connect)' },
    { id: 'rect', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
  ];

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 flex gap-2 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex flex-col gap-4 max-h-[90vh] overflow-y-auto overflow-x-hidden hide-scrollbar">
        <div className="flex flex-col gap-2 border-b border-gray-100 pb-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                onSelectTool(tool.id);
                setShowTemplates(false);
              }}
              className={cn(
                "p-2.5 rounded-lg transition-all duration-200 group relative flex items-center justify-center",
                selectedTool === tool.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-gray-600 hover:bg-gray-100"
              )}
              title={tool.label}
            >
              {tool.icon}
              <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-100 pb-4">
           {/* Zoom Controls */}
           <button
            onClick={onZoomIn}
            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={onZoomOut}
            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
        </div>

        {/* Group/Ungroup Controls */}
        <div className="flex flex-col gap-2 border-b border-gray-100 pb-4">
          <button
            onClick={onGroup}
            disabled={!canGroup}
            className={cn(
              "p-2.5 rounded-lg transition-colors group relative flex items-center justify-center",
              canGroup
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-300 cursor-not-allowed"
            )}
            title="Group Selected (Ctrl+G)"
          >
            <Group size={20} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Group Selected (Ctrl+G)
            </span>
          </button>
          <button
            onClick={onUngroup}
            disabled={!canUngroup}
            className={cn(
              "p-2.5 rounded-lg transition-colors group relative flex items-center justify-center",
              canUngroup
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-300 cursor-not-allowed"
            )}
            title="Ungroup (Ctrl+Shift+G)"
          >
            <Ungroup size={20} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Ungroup (Ctrl+Shift+G)
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
            {/* Detect Objects Button */}
            <button
              onClick={onDetectObjects}
              disabled={!canDetectObjects}
              className={cn(
                "p-2.5 rounded-lg transition-colors group relative flex items-center justify-center",
                canDetectObjects
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-gray-300 cursor-not-allowed"
              )}
              title="Detect UI Objects"
            >
              <Scan size={20} />
              <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Detect UI Objects
              </span>
            </button>

            {/* Shape Library Button */}
           <button
            onClick={onToggleShapeLibrary}
            className={cn(
              "p-2.5 rounded-lg transition-all duration-200 group relative flex items-center justify-center",
              isShapeLibraryOpen ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
            )}
            title="Shape Library"
          >
            <Shapes size={20} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Shape Library
            </span>
          </button>

            {/* Templates Button */}
           <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={cn(
              "p-2.5 rounded-lg transition-all duration-200 group relative flex items-center justify-center",
              showTemplates ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
            )}
            title="Templates"
          >
            <LayoutTemplate size={20} />
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Wireframe Templates
            </span>
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={20} />
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
           <label className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors relative group flex items-center justify-center">
              <ImageIcon size={20} />
              <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
               <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Import Image
              </span>
          </label>

          <button
            onClick={onClear}
            className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>

          <button
            onClick={onExport}
            className="p-2.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Export PNG"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Templates Submenu */}
      {showTemplates && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 flex flex-col gap-3 w-48 animate-in fade-in slide-in-from-left-4 duration-200 h-fit max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-1">
             <span className="text-sm font-semibold text-gray-700">Templates</span>
             <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600">
               <X size={16} />
             </button>
          </div>
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onAddTemplate(template.src);
                setShowTemplates(false);
              }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700 transition-colors"
            >
              <div className="w-8 h-8 rounded border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img src={template.src} alt={template.name} className="w-full h-full object-contain opacity-80" />
              </div>
              {template.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
