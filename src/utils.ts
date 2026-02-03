import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ShapeObject, Point, SmartArrowShape, AnchorPosition } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

export const downloadURI = (uri: string, name: string) => {
  const link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Snap a value to the nearest grid point
export const snapToGrid = (value: number, gridSize: number): number => {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
};

// Snap a point (x, y) to grid
export const snapPointToGrid = (
  x: number, 
  y: number, 
  gridSize: number
): { x: number; y: number } => {
  if (gridSize <= 0) return { x, y };
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Coordinate System Helpers for Container/Grouping System
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the global (absolute) position of a shape
 * If shape has a parent, calculates absolute position by traversing up the hierarchy
 */
export const getGlobalPosition = (
  shape: ShapeObject,
  allShapes: ShapeObject[]
): { x: number; y: number } => {
  let x = shape.x;
  let y = shape.y;
  
  let currentId = shape.parentId;
  while (currentId) {
    const parent = allShapes.find(s => s.id === currentId);
    if (!parent) break;
    x += parent.x;
    y += parent.y;
    currentId = parent.parentId;
  }
  
  return { x, y };
};

/**
 * Convert global coordinates to local coordinates relative to a parent
 */
export const globalToLocal = (
  globalX: number,
  globalY: number,
  parentId: string | undefined,
  allShapes: ShapeObject[]
): { x: number; y: number } => {
  if (!parentId) return { x: globalX, y: globalY };

  const parent = allShapes.find(s => s.id === parentId);
  if (!parent) {
    return { x: globalX, y: globalY };
  }

  const parentGlobal = getGlobalPosition(parent, allShapes);

  return {
    x: globalX - parentGlobal.x,
    y: globalY - parentGlobal.y
  };
};

/**
 * Convert local coordinates to global coordinates
 */
export const localToGlobal = (
  localX: number,
  localY: number,
  shape: ShapeObject,
  allShapes: ShapeObject[]
): { x: number; y: number } => {
  const globalPos = getGlobalPosition(shape, allShapes);
  return {
    x: localX + globalPos.x,
    y: localY + globalPos.y
  };
};

/**
 * Get parent shape of a child shape
 */
export const getParent = (shape: ShapeObject, allShapes: ShapeObject[]): ShapeObject | undefined => {
  if (!shape.parentId) return undefined;
  return allShapes.find(s => s.id === shape.parentId);
};

/**
 * Get all descendants of a shape (recursive)
 */
export const getAllDescendants = (shapeId: string, allShapes: ShapeObject[]): ShapeObject[] => {
  const descendants: ShapeObject[] = [];
  
  const findChildren = (parentId: string) => {
    const children = allShapes.filter(s => s.parentId === parentId);
    for (const child of children) {
      descendants.push(child);
      findChildren(child.id);
    }
  };
  
  findChildren(shapeId);
  return descendants;
};

/**
 * Check if shape A is an ancestor of shape B (is A somewhere in B's parent chain?)
 */
export const isAncestor = (
  potentialAncestorId: string,
  shapeId: string,
  allShapes: ShapeObject[]
): boolean => {
  const shape = allShapes.find(s => s.id === shapeId);
  if (!shape || !shape.parentId) return false;
  if (shape.parentId === potentialAncestorId) return true;
  return isAncestor(potentialAncestorId, shape.parentId, allShapes);
};

/**
 * Get direct children of a container shape
 */
export const getDirectChildren = (
  containerId: string,
  allShapes: ShapeObject[]
): ShapeObject[] => {
  return allShapes.filter(s => s.parentId === containerId);
};

/**
 * Calculate bounds of multiple shapes
 */
export const calculateBounds = (
  shapeIds: string[],
  allShapes: ShapeObject[]
): { x: number; y: number; width: number; height: number } | null => {
  if (shapeIds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapeIds.forEach(id => {
    const shape = allShapes.find(s => s.id === id);
    if (!shape) return;

    const globalPos = getGlobalPosition(shape, allShapes);
    let width = 0;
    let height = 0;

    if (shape.tool === 'rect') {
      width = (shape as any).width || 0;
      height = (shape as any).height || 0;
    } else if (shape.tool === 'circle') {
      width = (shape as any).radius * 2 || 0;
      height = (shape as any).radius * 2 || 0;
    } else if (shape.tool === 'image' || shape.tool === 'group') {
      width = (shape as any).width || 0;
      height = (shape as any).height || 0;
    } else if (shape.tool === 'text') {
      // Approximate text bounds
      const text = (shape as any).text || '';
      const fontSize = (shape as any).fontSize || 20;
      width = (shape as any).width || text.length * fontSize * 0.6;
      height = fontSize * 1.2;
    } else if (shape.tool === 'pen' || shape.tool === 'marker' || shape.tool === 'eraser' || shape.tool === 'arrow') {
      const points = (shape as any).points || [];
      for (let i = 0; i < points.length; i += 2) {
        minX = Math.min(minX, globalPos.x + points[i]);
        maxX = Math.max(maxX, globalPos.x + points[i]);
        minY = Math.min(minY, globalPos.y + points[i + 1]);
        maxY = Math.max(maxY, globalPos.y + points[i + 1]);
      }
      return; // Skip the normal bounds calculation
    }

    minX = Math.min(minX, globalPos.x);
    minY = Math.min(minY, globalPos.y);
    maxX = Math.max(maxX, globalPos.x + width);
    maxY = Math.max(maxY, globalPos.y + height);
  });

  if (minX === Infinity) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Get all root-level shapes (not inside any container)
 */
export const getRootShapes = (shapes: ShapeObject[]): ShapeObject[] => {
  return shapes.filter(s => !s.parentId);
};

/**
 * Build a shape tree - separate root shapes from children
 */
export const buildShapeTree = (shapes: ShapeObject[]): { rootShapes: ShapeObject[]; childrenMap: Record<string, ShapeObject[]> } => {
  const rootShapes: ShapeObject[] = [];
  const childrenMap: Record<string, ShapeObject[]> = {};
  
  for (const shape of shapes) {
    if (shape.parentId) {
      if (!childrenMap[shape.parentId]) {
        childrenMap[shape.parentId] = [];
      }
      childrenMap[shape.parentId].push(shape);
    } else {
      rootShapes.push(shape);
    }
  }
  
  return { rootShapes, childrenMap };
};

/**
 * Sort shapes so children come after their parents
 * This ensures proper rendering order
 */
export const sortShapesByHierarchy = (shapes: ShapeObject[]): ShapeObject[] => {
  const result: ShapeObject[] = [];
  const added = new Set<string>();

  const addShape = (shape: ShapeObject) => {
    if (added.has(shape.id)) return;
    
    // First add parent if exists
    if (shape.parentId && !added.has(shape.parentId)) {
      const parent = shapes.find(s => s.id === shape.parentId);
      if (parent) {
        addShape(parent);
      }
    }
    
    result.push(shape);
    added.add(shape.id);
  };

  shapes.forEach(addShape);
  return result;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Smart Arrow Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the anchor point on a shape based on anchor position
 */
export const getShapeAnchorPoint = (
  shape: ShapeObject,
  allShapes: ShapeObject[],
  anchor: AnchorPosition
): { x: number; y: number } => {
  const globalPos = getGlobalPosition(shape, allShapes);
  
  let width = 0;
  let height = 0;
  
  if (shape.tool === 'rect' || shape.tool === 'image' || shape.tool === 'group') {
    width = (shape as any).width || 0;
    height = (shape as any).height || 0;
  } else if (shape.tool === 'circle') {
    const radius = (shape as any).radius || 0;
    width = radius * 2;
    height = radius * 2;
  } else if (shape.tool === 'text') {
    const text = (shape as any).text || '';
    const fontSize = (shape as any).fontSize || 20;
    width = (shape as any).width || text.length * fontSize * 0.6;
    height = fontSize * 1.2;
  }

  switch (anchor) {
    case 'top':
      return { x: globalPos.x + width / 2, y: globalPos.y };
    case 'bottom':
      return { x: globalPos.x + width / 2, y: globalPos.y + height };
    case 'left':
      return { x: globalPos.x, y: globalPos.y + height / 2 };
    case 'right':
      return { x: globalPos.x + width, y: globalPos.y + height / 2 };
    case 'center':
    default:
      return { x: globalPos.x + width / 2, y: globalPos.y + height / 2 };
  }
};

/**
 * Calculate the best anchor point for connecting two shapes
 * Returns the closest pair of anchor points
 */
export const calculateBestAnchors = (
  fromShape: ShapeObject,
  toShape: ShapeObject,
  allShapes: ShapeObject[]
): { from: AnchorPosition; to: AnchorPosition } => {
  const fromPos = getGlobalPosition(fromShape, allShapes);
  const toPos = getGlobalPosition(toShape, allShapes);
  
  // Get centers
  let fromWidth = 0, fromHeight = 0, toWidth = 0, toHeight = 0;
  
  if (fromShape.tool === 'rect' || fromShape.tool === 'image' || fromShape.tool === 'group') {
    fromWidth = (fromShape as any).width || 0;
    fromHeight = (fromShape as any).height || 0;
  } else if (fromShape.tool === 'circle') {
    fromWidth = (fromShape as any).radius * 2 || 0;
    fromHeight = (fromShape as any).radius * 2 || 0;
  }
  
  if (toShape.tool === 'rect' || toShape.tool === 'image' || toShape.tool === 'group') {
    toWidth = (toShape as any).width || 0;
    toHeight = (toShape as any).height || 0;
  } else if (toShape.tool === 'circle') {
    toWidth = (toShape as any).radius * 2 || 0;
    toHeight = (toShape as any).radius * 2 || 0;
  }
  
  const fromCenter = { x: fromPos.x + fromWidth / 2, y: fromPos.y + fromHeight / 2 };
  const toCenter = { x: toPos.x + toWidth / 2, y: toPos.y + toHeight / 2 };
  
  // Determine relative position
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  // Choose anchors based on relative position
  if (absDx > absDy) {
    // More horizontal than vertical
    return dx > 0 
      ? { from: 'right', to: 'left' }
      : { from: 'left', to: 'right' };
  } else {
    // More vertical than horizontal
    return dy > 0
      ? { from: 'bottom', to: 'top' }
      : { from: 'top', to: 'bottom' };
  }
};

/**
 * Calculate straight line path between two anchor points
 */
export const calculateStraightArrowPath = (
  fromShape: ShapeObject,
  toShape: ShapeObject,
  allShapes: ShapeObject[],
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): number[] => {
  const fromPoint = getShapeAnchorPoint(fromShape, allShapes, fromAnchor);
  const toPoint = getShapeAnchorPoint(toShape, allShapes, toAnchor);
  
  return [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y];
};

/**
 * Calculate elbow (right-angle) path between two anchor points
 */
export const calculateElbowArrowPath = (
  fromShape: ShapeObject,
  toShape: ShapeObject,
  allShapes: ShapeObject[],
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): number[] => {
  const fromPoint = getShapeAnchorPoint(fromShape, allShapes, fromAnchor);
  const toPoint = getShapeAnchorPoint(toShape, allShapes, toAnchor);
  
  // Calculate midpoints for elbow
  const midX = (fromPoint.x + toPoint.x) / 2;
  const midY = (fromPoint.y + toPoint.y) / 2;
  
  // Create elbow path based on anchor directions
  if ((fromAnchor === 'left' || fromAnchor === 'right') && 
      (toAnchor === 'left' || toAnchor === 'right')) {
    // Both horizontal - use vertical elbow
    return [
      fromPoint.x, fromPoint.y,
      midX, fromPoint.y,
      midX, toPoint.y,
      toPoint.x, toPoint.y
    ];
  } else if ((fromAnchor === 'top' || fromAnchor === 'bottom') && 
             (toAnchor === 'top' || toAnchor === 'bottom')) {
    // Both vertical - use horizontal elbow
    return [
      fromPoint.x, fromPoint.y,
      fromPoint.x, midY,
      toPoint.x, midY,
      toPoint.x, toPoint.y
    ];
  } else {
    // Mixed - use simple two-segment path
    if (fromAnchor === 'left' || fromAnchor === 'right') {
      return [
        fromPoint.x, fromPoint.y,
        midX, fromPoint.y,
        midX, toPoint.y,
        toPoint.x, toPoint.y
      ];
    } else {
      return [
        fromPoint.x, fromPoint.y,
        fromPoint.x, midY,
        toPoint.x, midY,
        toPoint.x, toPoint.y
      ];
    }
  }
};

/**
 * Update all smart arrows connected to a shape that moved
 * Call this when a shape's position changes
 */
export const updateConnectedSmartArrows = (
  movedShapeId: string,
  allShapes: ShapeObject[]
): ShapeObject[] => {
  return allShapes.map(shape => {
    if (shape.tool !== 'smart-arrow') return shape;
    
    const arrow = shape as SmartArrowShape;
    
    // Check if this arrow is connected to the moved shape
    if (arrow.fromShapeId !== movedShapeId && arrow.toShapeId !== movedShapeId) {
      return shape;
    }
    
    // Find connected shapes
    const fromShape = allShapes.find(s => s.id === arrow.fromShapeId);
    const toShape = allShapes.find(s => s.id === arrow.toShapeId);
    
    if (!fromShape || !toShape) {
      // Connected shape was deleted - delete this arrow too
      return null;
    }
    
    // Recalculate path
    const newPoints = arrow.style === 'elbow'
      ? calculateElbowArrowPath(fromShape, toShape, allShapes, arrow.fromAnchor, arrow.toAnchor)
      : calculateStraightArrowPath(fromShape, toShape, allShapes, arrow.fromAnchor, arrow.toAnchor);
    
    return {
      ...arrow,
      points: newPoints
    };
  }).filter((s): s is ShapeObject => s !== null);
};

/**
 * Get all smart arrows connected to a shape
 */
export const getConnectedSmartArrows = (
  shapeId: string,
  allShapes: ShapeObject[]
): SmartArrowShape[] => {
  return allShapes.filter(s => 
    s.tool === 'smart-arrow' && 
    ((s as SmartArrowShape).fromShapeId === shapeId || 
     (s as SmartArrowShape).toShapeId === shapeId)
  ) as SmartArrowShape[];
};

/**
 * Check if a point is near an anchor point (for hover detection)
 */
export const isNearAnchor = (
  point: Point,
  shape: ShapeObject,
  allShapes: ShapeObject[],
  anchor: AnchorPosition,
  threshold: number = 10
): boolean => {
  const anchorPoint = getShapeAnchorPoint(shape, allShapes, anchor);
  const dx = point.x - anchorPoint.x;
  const dy = point.y - anchorPoint.y;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
};

/**
 * Find the closest anchor point on a shape to a given point
 */
export const findClosestAnchor = (
  point: Point,
  shape: ShapeObject,
  allShapes: ShapeObject[]
): { anchor: AnchorPosition; distance: number } => {
  const anchors: AnchorPosition[] = ['top', 'bottom', 'left', 'right', 'center'];
  let closest: AnchorPosition = 'center';
  let minDistance = Infinity;
  
  for (const anchor of anchors) {
    const anchorPoint = getShapeAnchorPoint(shape, allShapes, anchor);
    const dx = point.x - anchorPoint.x;
    const dy = point.y - anchorPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      closest = anchor;
    }
  }
  
  return { anchor: closest, distance: minDistance };
};
