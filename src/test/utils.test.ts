import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  cn,
  downloadURI,
  snapToGrid,
  snapPointToGrid,
  getGlobalPosition,
  globalToLocal,
  localToGlobal,
  buildShapeTree,
  getDirectChildren,
  getAllDescendants,
  getParent,
  isAncestor,
  calculateBounds,
  getRootShapes,
  sortShapesByHierarchy,
  getShapeAnchorPoint,
  calculateBestAnchors,
  calculateStraightArrowPath,
  calculateElbowArrowPath,
  updateConnectedSmartArrows,
  getConnectedSmartArrows,
  isNearAnchor,
  findClosestAnchor
} from '../utils';
import { ShapeObject, GroupShape, ImageShape, CircleShape, ArrowShape, LineShape } from '../types';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toHaveLength(9);
      expect(id2).toHaveLength(9);
    });
  });

  describe('cn (class name merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
      expect(cn('class1', ['class2', 'class3'])).toBe('class1 class2 class3');
    });

    it('should handle tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('snapToGrid', () => {
    it('should snap values to grid correctly', () => {
      expect(snapToGrid(15, 10)).toBe(20);
      expect(snapToGrid(14, 10)).toBe(10);
      expect(snapToGrid(25, 10)).toBe(30);
      expect(snapToGrid(100, 50)).toBe(100);
    });

    it('should return original value if gridSize is 0 or negative', () => {
      expect(snapToGrid(15, 0)).toBe(15);
      expect(snapToGrid(15, -5)).toBe(15);
    });
  });

  describe('snapPointToGrid', () => {
    it('should snap points to grid correctly', () => {
      expect(snapPointToGrid(15, 25, 10)).toEqual({ x: 20, y: 30 });
      expect(snapPointToGrid(100, 150, 50)).toEqual({ x: 100, y: 150 });
    });
  });
});

describe('Container/Grouping System', () => {
  // Test fixtures
  const createRect = (id: string, x: number, y: number, parentId?: string): ShapeObject => ({
    id,
    tool: 'rect',
    x,
    y,
    width: 100,
    height: 100,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 2,
    fill: 'transparent',
    parentId
  });

  const createGroup = (id: string, x: number, y: number, children?: string[]): GroupShape => ({
    id,
    tool: 'group',
    x,
    y,
    width: 200,
    height: 200,
    rotation: 0,
    stroke: '#3b82f6',
    strokeWidth: 1,
    isContainer: true,
    children
  });

  const createImage = (id: string, x: number, y: number, isContainer = false, parentId?: string): ImageShape => ({
    id,
    tool: 'image',
    x,
    y,
    width: 300,
    height: 300,
    rotation: 0,
    stroke: 'transparent',
    strokeWidth: 0,
    src: '/test.png',
    isContainer,
    children: isContainer ? [] : undefined,
    parentId
  });

  describe('getGlobalPosition', () => {
    it('should return local position for root shapes', () => {
      const shape = createRect('rect1', 50, 100);
      const shapes: ShapeObject[] = [shape];
      
      expect(getGlobalPosition(shape, shapes)).toEqual({ x: 50, y: 100 });
    });

    it('should calculate global position for nested shapes', () => {
      const group = createGroup('group1', 100, 100);
      const child = createRect('rect1', 50, 50, 'group1');
      const shapes: ShapeObject[] = [group, child];
      
      expect(getGlobalPosition(child, shapes)).toEqual({ x: 150, y: 150 });
    });

    it('should handle deeply nested shapes', () => {
      const group1 = createGroup('group1', 10, 10);
      const group2 = createGroup('group2', 20, 20, ['rect1']);
      (group2 as any).parentId = 'group1';
      const rect = createRect('rect1', 30, 30, 'group2');
      const shapes: ShapeObject[] = [group1, group2, rect];
      
      expect(getGlobalPosition(rect, shapes)).toEqual({ x: 60, y: 60 });
    });
  });

  describe('globalToLocal', () => {
    it('should convert global to local coordinates', () => {
      const group = createGroup('group1', 100, 100);
      const shapes: ShapeObject[] = [group];
      
      expect(globalToLocal(150, 150, 'group1', shapes)).toEqual({ x: 50, y: 50 });
    });
  });

  describe('localToGlobal', () => {
    it('should convert local to global coordinates', () => {
      const group = createGroup('group1', 100, 100);
      const shapes: ShapeObject[] = [group];
      
      expect(localToGlobal(50, 50, group, shapes)).toEqual({ x: 150, y: 150 });
    });
  });

  describe('buildShapeTree', () => {
    it('should separate root shapes from children', () => {
      const root1 = createRect('root1', 0, 0);
      const root2 = createRect('root2', 0, 0);
      const child1 = createRect('child1', 0, 0, 'root1');
      const child2 = createRect('child2', 0, 0, 'root1');
      
      const shapes: ShapeObject[] = [root1, root2, child1, child2];
      const { rootShapes, childrenMap } = buildShapeTree(shapes);
      
      expect(rootShapes).toHaveLength(2);
      expect(rootShapes.map(s => s.id)).toContain('root1');
      expect(rootShapes.map(s => s.id)).toContain('root2');
      
      expect(childrenMap['root1']).toHaveLength(2);
      expect(childrenMap['root2']).toBeUndefined();
    });
  });

  describe('getDirectChildren', () => {
    it('should return only direct children', () => {
      const group = createGroup('group1', 0, 0);
      const child1 = createRect('child1', 0, 0, 'group1');
      const child2 = createRect('child2', 0, 0, 'group1');
      const notAChild = createRect('notAChild', 0, 0);
      
      const shapes: ShapeObject[] = [group, child1, child2, notAChild];
      const children = getDirectChildren('group1', shapes);
      
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toContain('child1');
      expect(children.map(c => c.id)).toContain('child2');
      expect(children.map(c => c.id)).not.toContain('notAChild');
    });
  });

  describe('getAllDescendants', () => {
    it('should return all descendants recursively', () => {
      const group1 = createGroup('group1', 0, 0);
      const group2 = createGroup('group2', 0, 0);
      (group2 as any).parentId = 'group1';
      const rect1 = createRect('rect1', 0, 0, 'group2');
      const rect2 = createRect('rect2', 0, 0, 'group1');
      
      const shapes: ShapeObject[] = [group1, group2, rect1, rect2];
      const descendants = getAllDescendants('group1', shapes);
      
      expect(descendants).toHaveLength(3);
      expect(descendants.map(d => d.id)).toContain('group2');
      expect(descendants.map(d => d.id)).toContain('rect1');
      expect(descendants.map(d => d.id)).toContain('rect2');
    });
  });

  describe('getParent', () => {
    it('should return parent shape', () => {
      const group = createGroup('group1', 0, 0);
      const child = createRect('child1', 0, 0, 'group1');
      const shapes: ShapeObject[] = [group, child];
      
      expect(getParent(child, shapes)?.id).toBe('group1');
    });

    it('should return undefined for root shapes', () => {
      const shape = createRect('shape1', 0, 0);
      const shapes: ShapeObject[] = [shape];
      
      expect(getParent(shape, shapes)).toBeUndefined();
    });
  });

  describe('isAncestor', () => {
    it('should detect direct parent as ancestor', () => {
      const group = createGroup('group1', 0, 0);
      const child = createRect('child1', 0, 0, 'group1');
      const shapes: ShapeObject[] = [group, child];
      
      expect(isAncestor('group1', 'child1', shapes)).toBe(true);
    });

    it('should detect grandparent as ancestor', () => {
      const grandparent = createGroup('gp1', 0, 0);
      const parent = createGroup('parent1', 0, 0);
      (parent as any).parentId = 'gp1';
      const child = createRect('child1', 0, 0, 'parent1');
      
      const shapes: ShapeObject[] = [grandparent, parent, child];
      
      expect(isAncestor('gp1', 'child1', shapes)).toBe(true);
    });

    it('should return false for non-ancestors', () => {
      const group1 = createGroup('group1', 0, 0);
      const group2 = createGroup('group2', 0, 0);
      const child = createRect('child1', 0, 0, 'group1');
      
      const shapes: ShapeObject[] = [group1, group2, child];
      
      expect(isAncestor('group2', 'child1', shapes)).toBe(false);
    });
  });

  describe('calculateBounds', () => {
    it('should calculate bounds for rectangles', () => {
      const rect1 = createRect('rect1', 0, 0);
      const rect2 = createRect('rect2', 50, 50);
      const shapes: ShapeObject[] = [rect1, rect2];
      
      const bounds = calculateBounds(['rect1', 'rect2'], shapes);
      
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 150,
        height: 150
      });
    });

    it('should return null for empty array', () => {
      expect(calculateBounds([], [])).toBeNull();
    });
  });

  describe('getRootShapes', () => {
    it('should return only shapes without parentId', () => {
      const root = createRect('root', 0, 0);
      const child = createRect('child', 0, 0, 'root');
      const shapes: ShapeObject[] = [root, child];
      
      const roots = getRootShapes(shapes);
      
      expect(roots).toHaveLength(1);
      expect(roots[0].id).toBe('root');
    });
  });

  describe('sortShapesByHierarchy', () => {
    it('should sort parents before children', () => {
      const child = createRect('child', 0, 0, 'parent');
      const parent = createGroup('parent', 0, 0);
      
      const shapes: ShapeObject[] = [child, parent];
      const sorted = sortShapesByHierarchy(shapes);
      
      expect(sorted[0].id).toBe('parent');
      expect(sorted[1].id).toBe('child');
    });
  });
});

describe('Download Utility', () => {
  let mockLink: any;

  beforeEach(() => {
    mockLink = {
      download: '',
      href: '',
      click: vi.fn()
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockReturnValue(mockLink as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create download link and trigger download', () => {
    downloadURI('data:image/png;base64,test', 'test-image.png');
    
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.download).toBe('test-image.png');
    expect(mockLink.href).toBe('data:image/png;base64,test');
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});

describe('Smart Arrow Utilities', () => {
  const createRect = (id: string, x: number, y: number, width = 100, height = 100): ShapeObject => ({
    id,
    tool: 'rect',
    x,
    y,
    width,
    height,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 2,
    fill: 'transparent'
  });

  const createCircle = (id: string, x: number, y: number, radius = 50): CircleShape => ({
    id,
    tool: 'circle',
    x,
    y,
    radius,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 2
  });

  const createSmartArrow = (id: string, fromId: string, toId: string, points: number[]): ShapeObject => ({
    id,
    tool: 'smart-arrow',
    x: 0,
    y: 0,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 2,
    fromShapeId: fromId,
    toShapeId: toId,
    fromAnchor: 'center',
    toAnchor: 'center',
    points,
    style: 'straight'
  });

  describe('getShapeAnchorPoint', () => {
    it('should return center for rect at center anchor', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = getShapeAnchorPoint(rect, shapes, 'center');
      expect(result).toEqual({ x: 150, y: 150 });
    });

    it('should return top anchor for rect', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = getShapeAnchorPoint(rect, shapes, 'top');
      expect(result).toEqual({ x: 150, y: 100 });
    });

    it('should return bottom anchor for rect', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = getShapeAnchorPoint(rect, shapes, 'bottom');
      expect(result).toEqual({ x: 150, y: 200 });
    });

    it('should return left anchor for rect', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = getShapeAnchorPoint(rect, shapes, 'left');
      expect(result).toEqual({ x: 100, y: 150 });
    });

    it('should return right anchor for rect', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = getShapeAnchorPoint(rect, shapes, 'right');
      expect(result).toEqual({ x: 200, y: 150 });
    });

    it('should return correct anchor for circle', () => {
      const circle = createCircle('circle1', 100, 100, 50);
      const shapes: ShapeObject[] = [circle];
      
      expect(getShapeAnchorPoint(circle, shapes, 'center')).toEqual({ x: 150, y: 150 });
      expect(getShapeAnchorPoint(circle, shapes, 'top')).toEqual({ x: 150, y: 100 });
      expect(getShapeAnchorPoint(circle, shapes, 'bottom')).toEqual({ x: 150, y: 200 });
      expect(getShapeAnchorPoint(circle, shapes, 'left')).toEqual({ x: 100, y: 150 });
      expect(getShapeAnchorPoint(circle, shapes, 'right')).toEqual({ x: 200, y: 150 });
    });
  });

  describe('calculateBestAnchors', () => {
    it('should return right-to-left anchors when toShape is to the right', () => {
      const fromShape = createRect('from', 0, 100);
      const toShape = createRect('to', 300, 100);
      const shapes: ShapeObject[] = [fromShape, toShape];
      
      const result = calculateBestAnchors(fromShape, toShape, shapes);
      expect(result).toEqual({ from: 'right', to: 'left' });
    });

    it('should return left-to-right anchors when toShape is to the left', () => {
      const fromShape = createRect('from', 300, 100);
      const toShape = createRect('to', 0, 100);
      const shapes: ShapeObject[] = [fromShape, toShape];
      
      const result = calculateBestAnchors(fromShape, toShape, shapes);
      expect(result).toEqual({ from: 'left', to: 'right' });
    });

    it('should return bottom-to-top anchors when toShape is below', () => {
      const fromShape = createRect('from', 100, 0);
      const toShape = createRect('to', 100, 300);
      const shapes: ShapeObject[] = [fromShape, toShape];
      
      const result = calculateBestAnchors(fromShape, toShape, shapes);
      expect(result).toEqual({ from: 'bottom', to: 'top' });
    });

    it('should return top-to-bottom anchors when toShape is above', () => {
      const fromShape = createRect('from', 100, 300);
      const toShape = createRect('to', 100, 0);
      const shapes: ShapeObject[] = [fromShape, toShape];
      
      const result = calculateBestAnchors(fromShape, toShape, shapes);
      expect(result).toEqual({ from: 'top', to: 'bottom' });
    });
  });

  describe('calculateStraightArrowPath', () => {
    it('should return straight line between two anchors', () => {
      const fromShape = createRect('from', 0, 0);
      const toShape = createRect('to', 200, 0);
      const shapes: ShapeObject[] = [fromShape, toShape];
      
      const result = calculateStraightArrowPath(fromShape, toShape, shapes, 'center', 'center');
      expect(result).toEqual([50, 50, 250, 50]);
    });
  });

  describe('calculateElbowArrowPath', () => {
    it('should return horizontal elbow for same horizontal anchors', () => {
      const fromShape = createRect('from', 0, 0);
      const toShape = createRect('to', 200, 100);
      const shapes: ShapeObject[] = [fromShape, toShape];
      
      const result = calculateElbowArrowPath(fromShape, toShape, shapes, 'right', 'left');
      expect(result.length).toBe(8);
      expect(result[0]).toBe(100);
      expect(result[1]).toBe(50);
    });

    it('should return vertical elbow for same vertical anchors', () => {
      const fromShape = createRect('from', 0, 0);
      const toShape = createRect('to', 100, 200);
      const shapes: ShapeObject[] = [fromShape, toShape];
      
      const result = calculateElbowArrowPath(fromShape, toShape, shapes, 'bottom', 'top');
      expect(result.length).toBe(8);
      expect(result[0]).toBe(50);
      expect(result[1]).toBe(100);
    });
  });

  describe('updateConnectedSmartArrows', () => {
    it('should update arrow points when connected shape moves', () => {
      const fromShape = createRect('from', 0, 0);
      const toShape = createRect('to', 200, 0);
      const arrow = createSmartArrow('arrow', 'from', 'to', [50, 50, 250, 50]);
      const shapes: ShapeObject[] = [fromShape, toShape, arrow];
      
      const result = updateConnectedSmartArrows('from', shapes);
      const updatedArrow = result.find(s => s.id === 'arrow') as any;
      
      expect(updatedArrow.points).toEqual([50, 50, 250, 50]);
    });

    it('should remove arrow when connected shape is deleted', () => {
      const fromShape = createRect('from', 0, 0);
      const arrow = createSmartArrow('arrow', 'from', 'deleted', [50, 50, 100, 100]);
      const shapes: ShapeObject[] = [fromShape, arrow];
      
      const result = updateConnectedSmartArrows('from', shapes);
      expect(result.find(s => s.id === 'arrow')).toBeUndefined();
    });
  });

  describe('getConnectedSmartArrows', () => {
    it('should return all arrows connected to a shape', () => {
      const shape = createRect('shape1', 0, 0);
      const arrow1 = createSmartArrow('arrow1', 'shape1', 'shape2', [50, 50, 150, 50]);
      const arrow2 = createSmartArrow('arrow2', 'shape3', 'shape1', [250, 50, 350, 50]);
      const shapes: ShapeObject[] = [shape, arrow1, arrow2];
      
      const result = getConnectedSmartArrows('shape1', shapes);
      expect(result).toHaveLength(2);
    });
  });

  describe('isNearAnchor', () => {
    it('should return true when point is within threshold', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = isNearAnchor({ x: 155, y: 155 }, rect, shapes, 'center', 20);
      expect(result).toBe(true);
    });

    it('should return false when point is outside threshold', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = isNearAnchor({ x: 150, y: 150 }, rect, shapes, 'top', 5);
      expect(result).toBe(false);
    });
  });

  describe('findClosestAnchor', () => {
    it('should return the closest anchor', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = findClosestAnchor({ x: 90, y: 150 }, rect, shapes);
      expect(result.anchor).toBe('left');
      expect(result.distance).toBe(10);
    });

    it('should return center for equal distances', () => {
      const rect = createRect('rect1', 100, 100);
      const shapes: ShapeObject[] = [rect];
      
      const result = findClosestAnchor({ x: 150, y: 150 }, rect, shapes);
      expect(result.anchor).toBe('center');
    });
  });
});

describe('CalculateBounds Extended', () => {
  const createRect = (id: string, x: number, y: number, width = 100, height = 100): ShapeObject => ({
    id,
    tool: 'rect',
    x,
    y,
    width,
    height,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 2,
    fill: 'transparent'
  });

  const createCircle = (id: string, x: number, y: number, radius = 50): CircleShape => ({
    id,
    tool: 'circle',
    x,
    y,
    radius,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 2
  });

  const createText = (id: string, x: number, y: number, text = 'Hello', fontSize = 20): ShapeObject => ({
    id,
    tool: 'text',
    x,
    y,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 1,
    text,
    fontSize,
    fill: '#000'
  });

  const createPen = (id: string, points: number[]): LineShape => ({
    id,
    tool: 'pen',
    x: 0,
    y: 0,
    rotation: 0,
    stroke: '#000',
    strokeWidth: 2,
    points
  });

  it('should calculate bounds for circle shapes', () => {
    const circle = createCircle('circle1', 100, 100, 50);
    const shapes: ShapeObject[] = [circle];
    
    const bounds = calculateBounds(['circle1'], shapes);
    
    expect(bounds).toEqual({
      x: 100,
      y: 100,
      width: 100,
      height: 100
    });
  });

  it('should calculate bounds for text shapes', () => {
    const text = createText('text1', 100, 100, 'Hello', 20);
    const shapes: ShapeObject[] = [text];
    
    const bounds = calculateBounds(['text1'], shapes);
    
    expect(bounds).toEqual({
      x: 100,
      y: 100,
      width: 60,
      height: 24
    });
  });

  it('should calculate bounds for pen strokes', () => {
    const pen = createPen('pen1', [0, 0, 50, 100, 100, 50]);
    const shapes: ShapeObject[] = [pen];
    
    const bounds = calculateBounds(['pen1'], shapes);
    
    expect(bounds).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
  });

  it('should return null for non-existent shape IDs', () => {
    const rect = createRect('rect1', 0, 0);
    const shapes: ShapeObject[] = [rect];
    
    const bounds = calculateBounds(['nonexistent'], shapes);
    expect(bounds).toBeNull();
  });

  it('should calculate bounds for mixed shape types', () => {
    const rect = createRect('rect1', 0, 0, 100, 100);
    const circle = createCircle('circle1', 200, 200, 50);
    const shapes: ShapeObject[] = [rect, circle];
    
    const bounds = calculateBounds(['rect1', 'circle1'], shapes);
    
    expect(bounds).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 300
    });
  });
});
