import { describe, it, expect } from 'vitest';
import { 
  isContainer, 
  canBeContainer,
  ShapeObject,
  GroupShape,
  ImageShape,
  RectShape
} from '../types';

describe('Type Guards', () => {
  describe('isContainer', () => {
    it('should return true for GroupShape', () => {
      const group: GroupShape = {
        id: 'group1',
        tool: 'group',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        stroke: '#000',
        strokeWidth: 1,
        isContainer: true
      };
      
      expect(isContainer(group)).toBe(true);
    });

    it('should return true for ImageShape with isContainer=true', () => {
      const image: ImageShape = {
        id: 'img1',
        tool: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        stroke: 'transparent',
        strokeWidth: 0,
        src: '/test.png',
        isContainer: true,
        children: []
      };
      
      expect(isContainer(image)).toBe(true);
    });

    it('should return false for regular ImageShape', () => {
      const image: ImageShape = {
        id: 'img1',
        tool: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        stroke: 'transparent',
        strokeWidth: 0,
        src: '/test.png'
      };
      
      expect(isContainer(image)).toBe(false);
    });

    it('should return false for non-container shapes', () => {
      const rect: RectShape = {
        id: 'rect1',
        tool: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        stroke: '#000',
        strokeWidth: 2,
        fill: 'transparent'
      };
      
      expect(isContainer(rect)).toBe(false);
    });
  });

  describe('canBeContainer', () => {
    it('should return true for image shapes', () => {
      const image: ImageShape = {
        id: 'img1',
        tool: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        stroke: 'transparent',
        strokeWidth: 0,
        src: '/test.png'
      };
      
      expect(canBeContainer(image)).toBe(true);
    });

    it('should return true for group shapes', () => {
      const group: GroupShape = {
        id: 'group1',
        tool: 'group',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        stroke: '#000',
        strokeWidth: 1,
        isContainer: true
      };
      
      expect(canBeContainer(group)).toBe(true);
    });

    it('should return false for other shapes', () => {
      const rect: RectShape = {
        id: 'rect1',
        tool: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        stroke: '#000',
        strokeWidth: 2,
        fill: 'transparent'
      };
      
      expect(canBeContainer(rect)).toBe(false);
    });
  });
});

describe('ShapeObject Types', () => {
  it('should support parentId field on all shapes', () => {
    const rectWithParent: ShapeObject = {
      id: 'rect1',
      tool: 'rect',
      x: 10,
      y: 20,
      width: 100,
      height: 100,
      rotation: 0,
      stroke: '#000',
      strokeWidth: 2,
      fill: 'transparent',
      parentId: 'group1'
    };
    
    expect(rectWithParent.parentId).toBe('group1');
  });

  it('should support optional parentId', () => {
    const rectWithoutParent: ShapeObject = {
      id: 'rect1',
      tool: 'rect',
      x: 10,
      y: 20,
      width: 100,
      height: 100,
      rotation: 0,
      stroke: '#000',
      strokeWidth: 2,
      fill: 'transparent'
    };
    
    expect(rectWithoutParent.parentId).toBeUndefined();
  });

  it('should support children array on ImageShape', () => {
    const imageWithChildren: ImageShape = {
      id: 'img1',
      tool: 'image',
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      rotation: 0,
      stroke: 'transparent',
      strokeWidth: 0,
      src: '/template.png',
      isContainer: true,
      children: ['shape1', 'shape2']
    };
    
    expect(imageWithChildren.children).toEqual(['shape1', 'shape2']);
  });

  it('should support children array on GroupShape', () => {
    const group: GroupShape = {
      id: 'group1',
      tool: 'group',
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      rotation: 0,
      stroke: '#3b82f6',
      strokeWidth: 1,
      isContainer: true,
      children: ['shape1', 'shape2', 'shape3']
    };
    
    expect(group.children).toEqual(['shape1', 'shape2', 'shape3']);
  });
});
