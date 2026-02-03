import React, { useState } from 'react';
import { 
  Layout, 
  ToggleLeft, 
  Menu, 
  GitBranch, 
  MessageSquare,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import { SHAPE_LIBRARY, LibraryCategory, LibraryItem } from '../shapeLibrary';

interface ShapeLibraryProps {
  onAddShape: (shapeData: LibraryItem) => void;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Layout: <Layout size={16} />,
  ToggleLeft: <ToggleLeft size={16} />,
  Menu: <Menu size={16} />,
  GitBranch: <GitBranch size={16} />,
  MessageSquare: <MessageSquare size={16} />,
};

export const ShapeLibrary: React.FC<ShapeLibraryProps> = ({ onAddShape, onClose }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['ui-basic']) // Default expand first category
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleItemClick = (item: LibraryItem) => {
    onAddShape(item);
  };

  // Render a simple visual preview of the shape
  const renderShapePreview = (item: LibraryItem) => {
    const shapeOrShapes = item.createShape();
    const shapes = Array.isArray(shapeOrShapes) ? shapeOrShapes : [shapeOrShapes];
    
    return (
      <svg 
        viewBox="-5 -5 50 50" 
        className="w-10 h-10"
        style={{ overflow: 'visible' }}
      >
        {shapes.map((shape) => {
          if (shape.tool === 'rect') {
            const width = Math.min(shape.width || 40, 40);
            const height = Math.min(shape.height || 40, 40);
            return (
              <rect
                key={shape.id}
                x={shape.rotation ? 20 - width/2 : 0}
                y={shape.rotation ? 20 - height/2 : 0}
                width={width}
                height={height}
                fill={shape.fill || 'transparent'}
                stroke={shape.stroke}
                strokeWidth={1}
                transform={shape.rotation ? `rotate(${shape.rotation} 20 20)` : undefined}
                rx={shape.width && shape.width > shape.height * 2 ? shape.height / 2 : 0}
              />
            );
          }
          if (shape.tool === 'circle') {
            const r = Math.min(shape.radius || 20, 20);
            return (
              <circle
                key={shape.id}
                cx={20}
                cy={20}
                r={r}
                fill={shape.fill || 'transparent'}
                stroke={shape.stroke}
                strokeWidth={1}
              />
            );
          }
          return null;
        })}
      </svg>
    );
  };

  return (
    <div className="absolute left-16 top-4 bottom-4 w-64 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 text-sm">Shape Library</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          <X size={16} />
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-2">
        {SHAPE_LIBRARY.map((category) => (
          <div key={category.id} className="mb-1">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left"
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
              <span className="text-gray-500">
                {iconMap[category.icon] || <Layout size={16} />}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {category.name}
              </span>
            </button>

            {/* Category Items */}
            {expandedCategories.has(category.id) && (
              <div className="px-3 py-2 grid grid-cols-2 gap-2">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="flex flex-col items-center gap-1 p-2 rounded hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors"
                    title={item.name}
                  >
                    {renderShapePreview(item)}
                    <span className="text-xs text-gray-600 truncate w-full text-center">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Tip */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 rounded-b-lg">
        Click to add shape to canvas
      </div>
    </div>
  );
};
