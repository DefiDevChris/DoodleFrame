import { describe, it, expect } from 'vitest';
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
  sortShapesByHierarchy
} from '../utils';
import { ShapeObject, GroupShape, ImageShape } from '../types';

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
