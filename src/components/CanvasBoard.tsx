import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Arrow, Rect, Circle, Text, Image as KonvaImage, Transformer, Group as KonvaGroup } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { 
  ToolType, 
  ShapeObject, 
  Point, 
  ImageShape, 
  RectShape, 
  TextShape, 
  GroupShape,
  ContainerShape,
  SmartArrowShape,
  AnchorPosition
} from '../types';
import { 
  generateId, 
  downloadURI, 
  snapPointToGrid, 
  buildShapeTree, 
  getGlobalPosition,
  globalToLocal,
  getDirectChildren,
  isAncestor,
  calculateBounds,
  getShapeAnchorPoint,
  findClosestAnchor,
  updateConnectedSmartArrows
} from '../utils';
import { MARKER_OPACITY } from '../constants';

interface CanvasBoardProps {
  tool: ToolType;
  color: string;
  fillColor: string;
  strokeWidth: number;
  image: HTMLImageElement | null;
  stageRef: React.RefObject<Konva.Stage>;
  shapes: ShapeObject[];
  setShapes: React.Dispatch<React.SetStateAction<ShapeObject[]>>;
  addToHistory: (newShapes: ShapeObject[]) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  scale: number;
  setScale: (scale: number) => void;
  stagePos: { x: number, y: number };
  setStagePos: (pos: { x: number, y: number }) => void;
  cutMode: 'copy' | 'cut';
  onToolFinished: () => void;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  activeTemplateId?: string; // Currently selected template for adding shapes
  // Smart arrow props
  smartArrowFrom?: { shapeId: string; anchor: AnchorPosition } | null;
  smartArrowPreview?: { x: number; y: number } | null;
  onSmartArrowStart?: (shapeId: string, anchor: AnchorPosition) => void;
  onSmartArrowMove?: (x: number, y: number) => void;
  onSmartArrowEnd?: (toShapeId: string, toAnchor: AnchorPosition) => void;
  onSmartArrowCancel?: () => void;
  updateSmartArrows?: (movedShapeId: string) => void;
}

// Background Image Component
const URLImage = ({ image, stageWidth, stageHeight }: { image: HTMLImageElement | null, stageWidth: number, stageHeight: number }) => {
  if (!image) return null;
  
  const aspectRatio = image.width / image.height;
  let width = image.width;
  let height = image.height;

  if (width > stageWidth || height > stageHeight) {
    if (stageWidth / stageHeight > aspectRatio) {
        height = stageHeight * 0.9;
        width = height * aspectRatio;
    } else {
        width = stageWidth * 0.9;
        height = width / aspectRatio;
    }
  }

  return (
    <KonvaImage
      image={image}
      width={width}
      height={height}
      x={(stageWidth - width) / 2}
      y={(stageHeight - height) / 2}
      listening={false}
    />
  );
};

// Shape Image Component (Stamps, Cutouts, Templates)
const ShapeImage = ({ shape, commonProps }: { shape: ImageShape, commonProps: any }) => {
  const [img] = useImage(shape.src);
  return (
    <KonvaImage
      {...commonProps}
      image={img}
      width={shape.width}
      height={shape.height}
      draggable={commonProps.draggable}
    />
  );
};

// Individual Shape Component
const ShapeComponent = ({
  shape,
  tool,
  isSelected,
  isEditing,
  onClick,
  onDragEnd,
  onTransformEnd,
  onDblClick
}: {
  shape: ShapeObject;
  tool: ToolType;
  isSelected: boolean;
  isEditing: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  onDblClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}) => {
  const commonProps = {
    id: shape.id,
    draggable: tool === 'select' && !shape.locked,
    onClick,
    onTap: onClick as any,
    onDragEnd,
    onTransformEnd,
    rotation: shape.rotation,
    x: shape.x,
    y: shape.y,
    opacity: shape.opacity,
    name: 'selectable-shape'
  };

  if (shape.tool === 'pen' || shape.tool === 'marker' || shape.tool === 'eraser') {
    return (
      <Line
        key={shape.id}
        {...commonProps}
        points={(shape as any).points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={
          shape.tool === 'eraser' ? 'destination-out' : 'source-over'
        }
      />
    );
  }
  if (shape.tool === 'arrow') {
    return (
      <Arrow 
        key={shape.id}
        {...commonProps}
        points={(shape as any).points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.stroke}
      />
    );
  }
  if (shape.tool === 'smart-arrow') {
    const smartArrow = shape as SmartArrowShape;
    return (
      <Arrow 
        key={shape.id}
        {...commonProps}
        points={smartArrow.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.stroke}
        pointerLength={10}
        pointerWidth={10}
      />
    );
  }
  if (shape.tool === 'rect') {
    if (shape.compositeOperation === 'destination-out') {
      return (
        <Rect
          key={shape.id}
          {...commonProps}
          width={(shape as RectShape).width}
          height={(shape as RectShape).height}
          fill="black"
          globalCompositeOperation="destination-out"
          listening={false}
        />
      );
    }
    return (
      <Rect
        key={shape.id}
        {...commonProps}
        width={(shape as any).width}
        height={(shape as any).height}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={(shape as any).fill}
      />
    );
  }
  if (shape.tool === 'circle') {
    return (
      <Circle
        key={shape.id}
        {...commonProps}
        radius={(shape as any).radius}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={(shape as any).fill}
      />
    );
  }
  if (shape.tool === 'text') {
    if (isEditing) return null;
    return (
      <Text 
        key={shape.id}
        {...commonProps}
        text={(shape as any).text}
        fontSize={(shape as any).fontSize}
        fill={shape.fill}
        fontFamily="Inter, sans-serif"
        width={(shape as TextShape).width}
        wrap={(shape as TextShape).width ? 'word' : 'none'}
        onDblClick={onDblClick}
      />
    );
  }
  if (shape.tool === 'image') {
    return <ShapeImage key={shape.id} shape={shape as ImageShape} commonProps={commonProps} />;
  }
  return null;
};

// Container/Group Component with Children
const ContainerComponent = ({
  shape,
  children,
  tool,
  selectedIds,
  editingTextId,
  onShapeClick,
  onShapeDragEnd,
  onShapeTransformEnd,
  onShapeDblClick,
  onGroupDragEnd,
  stageRef
}: {
  shape: ContainerShape;
  children: ShapeObject[];
  tool: ToolType;
  selectedIds: string[];
  editingTextId: string | null;
  onShapeClick: (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onShapeDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onShapeTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  onShapeDblClick: (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onGroupDragEnd: (e: Konva.KonvaEventObject<DragEvent>, groupId: string) => void;
  stageRef: React.RefObject<Konva.Stage>;
}) => {
  const isSelected = selectedIds.includes(shape.id);
  const isGroup = shape.tool === 'group';
  
  // Calculate bounds for selection indicator
  const selectionBounds = useMemo(() => {
    if (!isSelected || children.length === 0) return null;
    const childIds = children.map(c => c.id);
    return calculateBounds(childIds, [shape, ...children]);
  }, [isSelected, children, shape]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onGroupDragEnd(e, shape.id);
  };

  return (
    <KonvaGroup
      id={shape.id}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      draggable={tool === 'select' && !shape.locked}
      onClick={(e) => onShapeClick(shape.id, e)}
      onTap={(e) => onShapeClick(shape.id, e as any)}
      onDragEnd={handleDragEnd}
      name="selectable-shape"
    >
      {/* Render container visual */}
      {shape.tool === 'image' && (
        <ShapeImage shape={shape as ImageShape} commonProps={{ draggable: false }} />
      )}
      
      {/* For groups, render a visual boundary */}
      {isGroup && (
        <Rect
          width={shape.width}
          height={shape.height}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth / 100} // Thin border
          dash={[5, 5]}
          fill="transparent"
          listening={false}
        />
      )}

      {/* Render children in local coordinates */}
      {children.map(child => (
        <ShapeComponent
          key={child.id}
          shape={child}
          tool={tool}
          isSelected={selectedIds.includes(child.id)}
          isEditing={editingTextId === child.id}
          onClick={(e) => {
            e.cancelBubble = true; // Don't propagate to parent group
            onShapeClick(child.id, e);
          }}
          onDragEnd={onShapeDragEnd}
          onTransformEnd={onShapeTransformEnd}
          onDblClick={(e) => onShapeDblClick(child.id, e)}
        />
      ))}

      {/* Selection indicator for group */}
      {isSelected && selectionBounds && (
        <Rect
          x={selectionBounds.x - shape.x - 5}
          y={selectionBounds.y - shape.y - 5}
          width={selectionBounds.width + 10}
          height={selectionBounds.height + 10}
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[5, 5]}
          fill="transparent"
          listening={false}
        />
      )}
    </KonvaGroup>
  );
};

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  tool,
  color,
  fillColor,
  strokeWidth,
  image,
  stageRef,
  shapes,
  setShapes,
  addToHistory,
  selectedIds,
  setSelectedIds,
  scale,
  setScale,
  stagePos,
  setStagePos,
  cutMode,
  onToolFinished,
  showGrid,
  snapToGrid,
  gridSize,
  activeTemplateId,
  smartArrowFrom,
  smartArrowPreview,
  onSmartArrowStart,
  onSmartArrowMove,
  onSmartArrowEnd,
  onSmartArrowCancel,
  updateSmartArrows
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShapeId, setCurrentShapeId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const startPosRef = useRef<Point | null>(null);

  // Clear selection rect when tool changes away from cut
  useEffect(() => {
    if (tool !== 'cut' && selectionRect) {
      setSelectionRect(null);
      startPosRef.current = null;
    }
  }, [tool, selectionRect]);

  const transformerRef = useRef<Konva.Transformer>(null);
  
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const dragStartPositions = useRef<Record<string, Point>>({});
  const [selectionBounds, setSelectionBounds] = useState<{x: number, y: number, width: number, height: number} | null>(null);

  // Build shape hierarchy
  const { rootShapes, childrenMap } = useMemo(() => buildShapeTree(shapes), [shapes]);

  // Separate shapes into layers
  const templateShapes = rootShapes.filter(s => s.tool === 'image' && (s as ImageShape).isTemplate);
  const backgroundShapes = rootShapes.filter(s => s.tool === 'image' && !(s as ImageShape).isTemplate);
  const drawingShapes = rootShapes.filter(s => s.tool !== 'image' && (s.layer !== 'background'));

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea logic
  useEffect(() => {
    const ta = textareaRef.current;
    if (editingTextId && ta) {
        const shape = shapes.find(s => s.id === editingTextId) as TextShape;
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        
        if (shape && shape.width && shape.width > 0) {
           ta.style.width = (shape.width * scale) + 'px';
        } else {
           ta.style.width = 'auto';
           ta.style.width = (ta.scrollWidth + 10) + 'px';
        }
    }
  }, [shapes, editingTextId, scale]);

  // Update selection bounds when selection changes
  useEffect(() => {
    if (selectedIds.length > 0 && stageRef.current) {
        const nodes = selectedIds.map(id => stageRef.current?.findOne('#' + id)).filter(Boolean) as Konva.Node[];
        
        if (nodes.length > 0) {
             const calculateBounds = () => {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                nodes.forEach(node => {
                    const rect = node.getClientRect({ relativeTo: node.getLayer() });
                    minX = Math.min(minX, rect.x);
                    minY = Math.min(minY, rect.y);
                    maxX = Math.max(maxX, rect.x + rect.width);
                    maxY = Math.max(maxY, rect.y + rect.height);
                });
                
                if (minX !== Infinity) {
                    setSelectionBounds({
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                    });
                }
             };
             requestAnimationFrame(calculateBounds);
        } else {
            setSelectionBounds(null);
        }
    } else {
        setSelectionBounds(null);
    }
  }, [selectedIds, shapes, stageRef]);

  // Update transformer selection for multiple nodes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
        // Only attach transformer to root-level shapes (not children inside groups)
        const rootSelectedIds = selectedIds.filter(id => {
          const shape = shapes.find(s => s.id === id);
          return shape && !shape.parentId;
        });
        const nodes = rootSelectedIds.map(id => stageRef.current?.findOne('#' + id)).filter(Boolean);
        transformerRef.current.nodes(nodes as Konva.Node[]);
        transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, shapes, stageRef]);

  const getRelativePointerPosition = (node: Konva.Stage) => {
    const transform = node.getAbsoluteTransform().copy();
    transform.invert();
    const pos = node.getPointerPosition();
    if (pos) {
        return transform.point(pos);
    }
    return null;
  };

  const getSnappedPointerPosition = (node: Konva.Stage) => {
    const pos = getRelativePointerPosition(node);
    if (!pos) return null;
    if (snapToGrid && gridSize > 0) {
      return snapPointToGrid(pos.x, pos.y, gridSize);
    }
    return pos;
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (editingTextId) return;

    if (e.target.name() === 'selection-overlay') {
        e.cancelBubble = true;
        return;
    }

    if (tool === 'pan') {
        setSelectedIds([]);
        return;
    }

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getSnappedPointerPosition(stage);
    if (!pos) return;

    if (tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      
      if (clickedOnEmpty) {
        setSelectedIds([]); 
        transformerRef.current?.nodes([]);
        
        setIsDrawing(true);
        startPosRef.current = pos;
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      }
      return;
    }

    // Text Tool Special Handling
    if (tool === 'text') {
        if (e.target !== stage) {
             const shapeId = e.target.id();
             const existingShape = shapes.find(s => s.id === shapeId);
             if (existingShape && existingShape.tool === 'text') {
                 setEditingTextId(shapeId);
                 setSelectedIds([shapeId]);
                 return;
             }
        }
    }

    // Drawing Logic
    setIsDrawing(true);
    startPosRef.current = pos;

    if (tool === 'cut') {
      setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      setSelectedIds([]);
      transformerRef.current?.nodes([]);
      return;
    }

    const id = generateId();
    setCurrentShapeId(id);
    setSelectedIds([]); 
    transformerRef.current?.nodes([]);

    let newShape: ShapeObject;

    // Check if we're drawing inside a template (activeTemplateId)
    const parentId = activeTemplateId;

    if (tool === 'text') {
        let localX = pos.x;
        let localY = pos.y;
        
        // If drawing inside a template, convert to local coordinates
        if (parentId) {
          const local = globalToLocal(pos.x, pos.y, parentId, shapes);
          localX = local.x;
          localY = local.y;
        }

        newShape = {
            id,
            parentId,
            tool: 'text',
            x: localX,
            y: localY,
            text: "",
            fontSize: Math.max(20, strokeWidth * 5),
            fill: color,
            stroke: color,
            strokeWidth: 0,
            rotation: 0
        };
        setShapes([...shapes, newShape]);
        return;
    }

    if (tool === 'pen' || tool === 'marker' || tool === 'eraser') {
      let localPoints = [pos.x, pos.y];
      
      // For lines, points are relative, so we need to handle parent differently
      if (parentId) {
        const local = globalToLocal(pos.x, pos.y, parentId, shapes);
        localPoints = [local.x, local.y];
      }
      
      newShape = {
        id,
        parentId,
        tool,
        points: localPoints,
        stroke: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth: tool === 'marker' ? strokeWidth * 4 : strokeWidth,
        opacity: tool === 'marker' ? MARKER_OPACITY : 1,
        rotation: 0,
        x: 0,
        y: 0
      } as any;
    } else if (tool === 'arrow') {
      let localPoints = [pos.x, pos.y, pos.x, pos.y];
      
      if (parentId) {
        const local = globalToLocal(pos.x, pos.y, parentId, shapes);
        localPoints = [local.x, local.y, local.x, local.y];
      }
      
      newShape = {
        id,
        parentId,
        tool: 'arrow',
        points: localPoints,
        stroke: color,
        strokeWidth,
        rotation: 0,
        x: 0,
        y: 0
      };
    } else if (tool === 'rect') {
      let localX = pos.x;
      let localY = pos.y;
      
      if (parentId) {
        const local = globalToLocal(pos.x, pos.y, parentId, shapes);
        localX = local.x;
        localY = local.y;
      }

      newShape = {
        id,
        parentId,
        tool: 'rect',
        x: localX,
        y: localY,
        width: 0,
        height: 0,
        stroke: color,
        strokeWidth,
        fill: fillColor,
        rotation: 0
      };
    } else if (tool === 'circle') {
      let localX = pos.x;
      let localY = pos.y;
      
      if (parentId) {
        const local = globalToLocal(pos.x, pos.y, parentId, shapes);
        localX = local.x;
        localY = local.y;
      }

      newShape = {
        id,
        parentId,
        tool: 'circle',
        x: localX,
        y: localY,
        radius: 0,
        stroke: color,
        strokeWidth,
        fill: fillColor,
        rotation: 0
      };
    } else {
        return;
    }

    setShapes([...shapes, newShape]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getSnappedPointerPosition(stage);
    if (!pos) return;

    // Update smart arrow preview
    if (smartArrowFrom && onSmartArrowMove) {
        onSmartArrowMove(pos.x, pos.y);
        return;
    }

    if (!isDrawing) return;

    if ((tool === 'cut' || tool === 'select') && startPosRef.current) {
        setSelectionRect({
            x: Math.min(startPosRef.current.x, pos.x),
            y: Math.min(startPosRef.current.y, pos.y),
            width: Math.abs(pos.x - startPosRef.current.x),
            height: Math.abs(pos.y - startPosRef.current.y)
        });
        return;
    }

    if (!currentShapeId) return;

    setShapes((prevShapes) =>
      prevShapes.map((shape) => {
        if (shape.id === currentShapeId) {
          // Get the parent to calculate local coordinates
          if (shape.tool === 'pen' || shape.tool === 'marker' || shape.tool === 'eraser') {
            const points = (shape as any).points;
            let localX = pos.x;
            let localY = pos.y;

            if (shape.parentId) {
              const local = globalToLocal(pos.x, pos.y, shape.parentId, prevShapes);
              localX = local.x;
              localY = local.y;
            }
            
            return {
              ...shape,
              points: [...points, localX, localY],
            };
          } else if (shape.tool === 'arrow') {
              const points = (shape as any).points;
              let localEndX = pos.x;
              let localEndY = pos.y;

              if (shape.parentId) {
                const local = globalToLocal(pos.x, pos.y, shape.parentId, prevShapes);
                localEndX = local.x;
                localEndY = local.y;
              }
              
              return {
                  ...shape,
                  points: [points[0], points[1], localEndX, localEndY]
              };
          } else if (shape.tool === 'rect') {
            let localX = shape.x;
            let localWidth = pos.x;
            let localY = shape.y;
            let localHeight = pos.y;

            if (shape.parentId) {
              const globalStart = getGlobalPosition(shape, prevShapes);
              const localEnd = globalToLocal(pos.x, pos.y, shape.parentId, prevShapes);
              localWidth = localEnd.x - localX;
              localHeight = localEnd.y - localY;
            } else {
              localWidth = pos.x - shape.x;
              localHeight = pos.y - shape.y;
            }
            
            return {
              ...shape,
              width: localWidth,
              height: localHeight,
            };
          } else if (shape.tool === 'circle') {
            let dx, dy;

            if (shape.parentId) {
              const globalCenter = getGlobalPosition(shape, prevShapes);
              dx = pos.x - globalCenter.x;
              dy = pos.y - globalCenter.y;
            } else {
              dx = pos.x - shape.x;
              dy = pos.y - shape.y;
            }
            
            const radius = Math.sqrt(dx * dx + dy * dy);
            return {
              ...shape,
              radius,
            };
          } else if (shape.tool === 'text') {
              if (startPosRef.current) {
                  const parent = shape.parentId ? prevShapes.find(s => s.id === shape.parentId) : null;
                  let width = pos.x - startPosRef.current.x;
                  
                  if (parent) {
                    const globalPos = getGlobalPosition(shape, prevShapes);
                    width = pos.x - globalPos.x;
                  }
                  
                  if (width < 0) {
                      // Need to adjust x when dragging left
                      let newX = shape.x + width;
                      return { ...shape, x: newX, width: Math.abs(width) };
                  } else {
                      return { ...shape, x: shape.x, width: Math.max(1, width) };
                  }
              }
          }
        }
        return shape;
      })
    );
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'select' && selectionRect && stageRef.current) {
        const box = selectionRect;
        // Selection should only work on root-level shapes
        const shapesToSelect = rootShapes.filter((shape) => {
             const node = stageRef.current?.findOne('#' + shape.id);
             if (node) {
                 const nodeRect = node.getClientRect({ relativeTo: stageRef.current });
                 return Konva.Util.haveIntersection(box, nodeRect);
             }
             return false;
        });
        
        setSelectedIds(shapesToSelect.map(s => s.id));
        setSelectionRect(null);
        startPosRef.current = null;
        return;
    }

    if (tool === 'cut' && selectionRect && stageRef.current) {
        // Immediately clear the selection overlay to prevent visual artifacts
        const currentSelectionRect = selectionRect;
        setSelectionRect(null);
        startPosRef.current = null;
        
        if (currentSelectionRect.width > 5 && currentSelectionRect.height > 5) {
            const stage = stageRef.current;
            const transform = stage.getAbsoluteTransform();
            const topLeft = transform.point({ x: currentSelectionRect.x, y: currentSelectionRect.y });
            const bottomRight = transform.point({ 
                x: currentSelectionRect.x + currentSelectionRect.width, 
                y: currentSelectionRect.y + currentSelectionRect.height 
            });
            
            const dataURL = stage.toDataURL({
                x: topLeft.x,
                y: topLeft.y,
                width: bottomRight.x - topLeft.x,
                height: bottomRight.y - topLeft.y,
                pixelRatio: 2
            });

            const newShape: ImageShape = {
                id: generateId(),
                tool: 'image',
                x: currentSelectionRect.x,
                y: currentSelectionRect.y,
                width: currentSelectionRect.width,
                height: currentSelectionRect.height,
                rotation: 0,
                stroke: 'transparent',
                strokeWidth: 0,
                src: dataURL
            };

            const shapesToAdd: ShapeObject[] = [newShape];

            // When in 'cut' mode, we don't add hole rectangles - we leave a void/gap
            // The cutout image captures the content, and the area behind becomes empty
            // showing the canvas background. This creates a true "cut out" effect.

            const updatedShapes = [...shapes, ...shapesToAdd];
            setShapes(updatedShapes);
            addToHistory(updatedShapes);
        }
        
        // Signal tool completion
        onToolFinished(); 
        return;
    }

    if (currentShapeId) {
        const shape = shapes.find(s => s.id === currentShapeId);
        
        if (shape && shape.tool === 'text') {
            if (shape.width && shape.width < 10) {
                 const correctedShape = { ...shape, width: undefined };
                 setShapes(shapes.map(s => s.id === shape.id ? correctedShape : s));
            }
            
            setEditingTextId(shape.id);
            setCurrentShapeId(null);
            return;
        }

        addToHistory(shapes); 
        setCurrentShapeId(null);
        onToolFinished(); 
    }
  };

  const handleShapeClick = (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (tool === 'select') {
      const isMulti = e.evt.ctrlKey || e.evt.shiftKey;
      
      // If clicking a child, only select the child (not the parent)
      const clickedShape = shapes.find(s => s.id === id);
      
      if (isMulti) {
          if (selectedIds.includes(id)) {
              setSelectedIds(selectedIds.filter(sid => sid !== id));
          } else {
              setSelectedIds([...selectedIds, id]);
          }
      } else {
          if (!selectedIds.includes(id)) {
            setSelectedIds([id]);
          }
      }
    }
  };
  
  const handleShapeDblClick = (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const shape = shapes.find(s => s.id === id);
      if (shape && shape.tool === 'text') {
          setEditingTextId(id);
          setSelectedIds([id]);
      }
  };

  const handleOverlayDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
      const startPos: Record<string, Point> = {};
      selectedIds.forEach(id => {
          const node = stageRef.current?.findOne('#' + id);
          if (node) {
              startPos[id] = { x: node.x(), y: node.y() };
          }
      });
      startPos['overlay'] = { x: e.target.x(), y: e.target.y() };
      dragStartPositions.current = startPos;
  };

  const handleOverlayDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
      const overlayStart = dragStartPositions.current['overlay'];
      if (!overlayStart) return;

      const dx = e.target.x() - overlayStart.x;
      const dy = e.target.y() - overlayStart.y;

      selectedIds.forEach(id => {
          const node = stageRef.current?.findOne('#' + id);
          const start = dragStartPositions.current[id];
          if (node && start) {
              node.x(start.x + dx);
              node.y(start.y + dy);
          }
      });
  };

  const handleOverlayDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      const updatedShapes = shapes.map(s => {
          const node = stageRef.current?.findOne('#' + s.id);
          if (selectedIds.includes(s.id) && node) {
              return { ...s, x: node.x(), y: node.y() };
          }
          return s;
      });
      setShapes(updatedShapes);
      addToHistory(updatedShapes);
  };
  
  // Handle drag end for individual shapes
  const handleShapeDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      const id = e.target.id();
      const node = e.target;
      
      // Get the shape
      const shape = shapes.find(s => s.id === id);
      if (!shape) return;
      
      let newX = node.x();
      let newY = node.y();
      
      // Snap to grid if enabled
      if (snapToGrid && gridSize > 0) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
          node.x(newX);
          node.y(newY);
      }

      const updatedShapes = shapes.map(s => {
          if (s.id === id) {
              return { ...s, x: newX, y: newY };
          }
          return s;
      });
      
      // Update connected smart arrows
      const shapesWithUpdatedArrows = updateConnectedSmartArrows(id, updatedShapes);
      
      setShapes(shapesWithUpdatedArrows);
      addToHistory(shapesWithUpdatedArrows);
  };

  // Handle drag end for groups - update both group and children's stored positions
  const handleGroupDragEnd = (e: Konva.KonvaEventObject<DragEvent>, groupId: string) => {
      const group = shapes.find(s => s.id === groupId);
      if (!group) return;
      
      const node = e.target;
      let newX = node.x();
      let newY = node.y();
      
      // Snap to grid if enabled
      if (snapToGrid && gridSize > 0) {
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
          node.x(newX);
          node.y(newY);
      }
      
      const dx = newX - group.x;
      const dy = newY - group.y;

      // Update the group and all its children
      const updatedShapes = shapes.map(s => {
          if (s.id === groupId) {
              return { ...s, x: newX, y: newY };
          }
          // Children stay at their local coordinates - they don't need to change
          // because Konva Group handles the transformation
          return s;
      });
      
      setShapes(updatedShapes);
      addToHistory(updatedShapes);
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const updatedShapes = shapes.map(s => {
        if (selectedIds.includes(s.id)) {
            const node = stageRef.current?.findOne('#' + s.id);
            if (node) {
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                
                node.scaleX(1);
                node.scaleY(1);
                
                let newX = node.x();
                let newY = node.y();
                
                if (snapToGrid && gridSize > 0) {
                    newX = Math.round(newX / gridSize) * gridSize;
                    newY = Math.round(newY / gridSize) * gridSize;
                    node.x(newX);
                    node.y(newY);
                }
                
                const newShape = { 
                    ...s, 
                    x: newX, 
                    y: newY, 
                    rotation: node.rotation() 
                };

                if (s.tool === 'rect') {
                    return { ...newShape, width: s.width * scaleX, height: s.height * scaleY };
                }
                if (s.tool === 'circle') {
                     return { ...newShape, radius: s.radius * Math.max(scaleX, scaleY) };
                }
                if (s.tool === 'text') {
                     return { ...newShape, fontSize: s.fontSize * scaleX };
                }
                if (s.tool === 'image') {
                    return { ...newShape, width: s.width * scaleX, height: s.height * scaleY };
                }
                if (s.tool === 'group') {
                    return { ...newShape, width: s.width * scaleX, height: s.height * scaleY };
                }
                return newShape;
            }
        }
        return s;
    });

    setShapes(updatedShapes);
    addToHistory(updatedShapes);
  };
  
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      
      const scaleBy = 1.1;
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      newScale = Math.max(0.1, Math.min(newScale, 5));

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      setScale(newScale);
      setStagePos(newPos);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (editingTextId) {
          setShapes(shapes.map(s => 
              s.id === editingTextId ? { ...s, text: e.target.value } as TextShape : s
          ));
      }
  };

  const handleTextFinish = () => {
      if (editingTextId) {
          const shape = shapes.find(s => s.id === editingTextId) as TextShape;
          if (!shape || !shape.text.trim()) {
              setShapes(shapes.filter(s => s.id !== editingTextId));
          } else {
              addToHistory(shapes);
              setSelectedIds([editingTextId]); 
          }
          setEditingTextId(null);
          onToolFinished(); 
      }
  };

  const handleKeyDownTextArea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey) {
          handleTextFinish();
      }
  };

  const editingShape = editingTextId ? shapes.find(s => s.id === editingTextId) as TextShape : null;

  // Get absolute position for textarea
  const getTextAreaPosition = (shape: TextShape) => {
    const globalPos = getGlobalPosition(shape, shapes);
    return {
      x: stagePos.x + globalPos.x * scale,
      y: stagePos.y + globalPos.y * scale
    };
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid || gridSize <= 0) return [];
    
    const lines = [];
    const width = 5000;
    const height = 5000;
    
    for (let x = 0; x <= width; x += gridSize) {
      lines.push({ points: [x, 0, x, height], key: `v-${x}` });
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      lines.push({ points: [0, y, width, y], key: `h-${y}` });
    }
    
    return lines;
  }, [showGrid, gridSize]);

  // Render shapes - either as containers or individual shapes
  const renderShape = (shape: ShapeObject) => {
    const isSelected = selectedIds.includes(shape.id);
    
    // If it's a container with children, render as a Group
    if ((shape.tool === 'group' || (shape.tool === 'image' && (shape as ImageShape).isContainer)) 
        && childrenMap[shape.id]?.length > 0) {
      return (
        <ContainerComponent
          key={shape.id}
          shape={shape as ContainerShape}
          children={childrenMap[shape.id]}
          tool={tool}
          selectedIds={selectedIds}
          editingTextId={editingTextId}
          onShapeClick={handleShapeClick}
          onShapeDragEnd={handleShapeDragEnd}
          onShapeTransformEnd={handleTransformEnd}
          onShapeDblClick={handleShapeDblClick}
          onGroupDragEnd={handleGroupDragEnd}
          stageRef={stageRef}
        />
      );
    }
    
    // Otherwise render as individual shape
    return (
      <ShapeComponent
        key={shape.id}
        shape={shape}
        tool={tool}
        isSelected={isSelected}
        isEditing={editingTextId === shape.id}
        onClick={(e) => handleShapeClick(shape.id, e)}
        onDragEnd={handleShapeDragEnd}
        onTransformEnd={handleTransformEnd}
        onDblClick={(e) => handleShapeDblClick(shape.id, e)}
      />
    );
  };

  return (
    <div className="relative w-full h-full">
        <Stage
            width={windowSize.width}
            height={windowSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onKeyDown={(e) => {
                if (e.key === 'Escape' && smartArrowFrom) {
                    onSmartArrowCancel?.();
                }
            }}
            tabIndex={0}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
            ref={stageRef}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            draggable={tool === 'pan'}
            onDragEnd={(e) => {
                if (e.target === e.target.getStage()) {
                    setStagePos({ x: e.target.x(), y: e.target.y() });
                }
            }}
            className={
                tool === 'pan' ? 'cursor-grab active:cursor-grabbing' :
                tool === 'text' ? 'cursor-text' : 
                tool === 'select' ? 'cursor-default' : 
                tool === 'cut' ? 'cursor-crosshair' :
                'cursor-crosshair'
            }
            >
            {/* Grid Layer */}
            {showGrid && (
                <Layer listening={false}>
                    {gridLines.map(line => (
                        <Line
                            key={line.key}
                            points={line.points}
                            stroke="#e5e7eb"
                            strokeWidth={1 / scale}
                            listening={false}
                        />
                    ))}
                </Layer>
            )}

            {/* Background Images Layer */}
            <Layer>
                <URLImage image={image} stageWidth={windowSize.width} stageHeight={windowSize.height} />
                {backgroundShapes.map(renderShape)}
            </Layer>

            {/* Drawing Layer */}
            <Layer>
                {drawingShapes.map(renderShape)}

                {selectionBounds && tool === 'select' && (
                    <Rect
                        name="selection-overlay"
                        x={selectionBounds.x}
                        y={selectionBounds.y}
                        width={selectionBounds.width}
                        height={selectionBounds.height}
                        fill="transparent"
                        draggable={true}
                        onDragStart={handleOverlayDragStart}
                        onDragMove={handleOverlayDragMove}
                        onDragEnd={handleOverlayDragEnd}
                    />
                )}

                {/* Cut tool selection overlay - only visible when actively cutting */}
                {selectionRect && tool === 'cut' && (
                    <Rect 
                        key="cut-selection-overlay"
                        x={selectionRect.x}
                        y={selectionRect.y}
                        width={selectionRect.width}
                        height={selectionRect.height}
                        stroke="#4f46e5"
                        strokeWidth={1}
                        dash={[5, 5]}
                        fill="rgba(79, 70, 229, 0.1)"
                        listening={false}
                    />
                )}
                
                {selectedIds.length > 0 && (
                    <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => {
                            if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                            }
                            return newBox;
                        }}
                    />
                )}
            </Layer>

            {/* Template Layer - Always on top */}
            <Layer>
                {templateShapes.map(renderShape)}
            </Layer>

            {/* Smart Arrow Layer - Anchor Points and Preview */}
            {(tool === 'smart-arrow' || smartArrowFrom) && (
                <Layer listening={true}>
                    {/* Anchor Points on Shapes */}
                    {shapes.filter(s => s.tool !== 'smart-arrow' && s.tool !== 'pen' && s.tool !== 'marker' && s.tool !== 'eraser').map(shape => {
                        const pos = getGlobalPosition(shape, shapes);
                        let width = 0, height = 0;
                        
                        if (shape.tool === 'rect' || shape.tool === 'image' || shape.tool === 'group') {
                            width = (shape as any).width || 0;
                            height = (shape as any).height || 0;
                        } else if (shape.tool === 'circle') {
                            width = (shape as any).radius * 2 || 0;
                            height = (shape as any).radius * 2 || 0;
                        } else if (shape.tool === 'text') {
                            const text = (shape as any).text || '';
                            const fontSize = (shape as any).fontSize || 20;
                            width = (shape as any).width || text.length * fontSize * 0.6;
                            height = fontSize * 1.2;
                        } else if (shape.tool === 'arrow') {
                            const points = (shape as any).points || [0,0,0,0];
                            width = Math.abs(points[2] - points[0]) || 20;
                            height = Math.abs(points[3] - points[1]) || 20;
                        }

                        const anchors = [
                            { x: pos.x + width / 2, y: pos.y, name: 'top' as const },
                            { x: pos.x + width / 2, y: pos.y + height, name: 'bottom' as const },
                            { x: pos.x, y: pos.y + height / 2, name: 'left' as const },
                            { x: pos.x + width, y: pos.y + height / 2, name: 'right' as const },
                        ];

                        const isFromShape = smartArrowFrom?.shapeId === shape.id;

                        return anchors.map(anchor => (
                            <Circle
                                key={`${shape.id}-${anchor.name}`}
                                x={anchor.x}
                                y={anchor.y}
                                radius={isFromShape && smartArrowFrom?.anchor === anchor.name ? 8 : 5}
                                fill={isFromShape && smartArrowFrom?.anchor === anchor.name ? '#3b82f6' : 'white'}
                                stroke="#3b82f6"
                                strokeWidth={2}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'crosshair';
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onClick={() => {
                                    if (!smartArrowFrom) {
                                        onSmartArrowStart?.(shape.id, anchor.name);
                                    } else if (shape.id !== smartArrowFrom.shapeId) {
                                        onSmartArrowEnd?.(shape.id, anchor.name);
                                    }
                                }}
                            />
                        ));
                    })}

                    {/* Smart Arrow Preview Line */}
                    {smartArrowFrom && smartArrowPreview && (
                        (() => {
                            const fromShape = shapes.find(s => s.id === smartArrowFrom.shapeId);
                            if (!fromShape) return null;
                            
                            const fromPoint = getShapeAnchorPoint(fromShape, shapes, smartArrowFrom.anchor);
                            
                            return (
                                <Arrow
                                    points={[fromPoint.x, fromPoint.y, smartArrowPreview.x, smartArrowPreview.y]}
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="#3b82f6"
                                    dash={[5, 5]}
                                    pointerLength={10}
                                    pointerWidth={10}
                                />
                            );
                        })()
                    )}
                </Layer>
            )}
        </Stage>

        {editingShape && (
            <textarea
                ref={textareaRef}
                value={editingShape.text}
                onChange={handleTextAreaChange}
                onBlur={handleTextFinish}
                onKeyDown={handleKeyDownTextArea}
                autoFocus
                placeholder="Type here..."
                style={{
                    position: 'absolute',
                    top: getTextAreaPosition(editingShape).y,
                    left: getTextAreaPosition(editingShape).x,
                    fontSize: `${editingShape.fontSize * scale}px`,
                    color: editingShape.fill,
                    lineHeight: 1.2,
                    fontFamily: 'Inter, sans-serif',
                    background: 'transparent',
                    border: 'none',
                    outline: '2px solid #818cf8',
                    outlineOffset: '4px',
                    borderRadius: '4px',
                    padding: 0,
                    margin: 0,
                    resize: 'none',
                    overflow: 'hidden',
                    whiteSpace: editingShape.width ? 'pre-wrap' : 'pre',
                    zIndex: 100,
                    transformOrigin: 'top left',
                }}
            />
        )}
    </div>
  );
};
