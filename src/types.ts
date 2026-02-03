export type ToolType = 'select' | 'pan' | 'pen' | 'marker' | 'arrow' | 'rect' | 'circle' | 'text' | 'eraser' | 'cut' | 'image' | 'group' | 'smart-arrow';

export type AnchorPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface Point {
  x: number;
  y: number;
}

export interface BaseShape {
  id: string;
  parentId?: string;  // Reference to container/group parent
  tool: ToolType;
  x: number;  // Relative to parent if parentId exists, otherwise global
  y: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
  locked?: boolean;
  layer?: 'background' | 'drawing';
  compositeOperation?: 'source-over' | 'destination-out';
}

export interface LineShape extends BaseShape {
  tool: 'pen' | 'marker' | 'eraser';
  points: number[];
}

export interface ArrowShape extends BaseShape {
  tool: 'arrow';
  points: number[];
}

// Smart arrow that connects to shapes and auto-updates
export interface SmartArrowShape extends BaseShape {
  tool: 'smart-arrow';
  fromShapeId: string;  // Source shape ID
  toShapeId: string;    // Target shape ID
  fromAnchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  toAnchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  points: number[];     // Calculated path points
  style: 'straight' | 'elbow';
}

export interface RectShape extends BaseShape {
  tool: 'rect';
  width: number;
  height: number;
  fill?: string;
}

export interface CircleShape extends BaseShape {
  tool: 'circle';
  radius: number;
  fill?: string;
}

export interface TextShape extends BaseShape {
  tool: 'text';
  text: string;
  fontSize: number;
  fill: string; // Text color is fill in Konva
  width?: number;
}

export interface ImageShape extends BaseShape {
  tool: 'image';
  src: string;
  width: number;
  height: number;
  isTemplate?: boolean; // Templates render on top layer
  isContainer?: boolean; // Can contain child shapes
  children?: string[];   // IDs of child shapes
}

// Group shape for grouping multiple shapes together
export interface GroupShape extends BaseShape {
  tool: 'group';
  width: number;
  height: number;
  children?: string[];   // IDs of child shapes
  isContainer: true;
}

export type ShapeObject = LineShape | ArrowShape | SmartArrowShape | RectShape | CircleShape | TextShape | ImageShape | GroupShape;

export interface AppState {
  shapes: ShapeObject[];
  history: ShapeObject[][];
  historyStep: number;
}

// Helper type for container shapes
export type ContainerShape = ImageShape | GroupShape;

// Check if a shape is a container
export const isContainer = (shape: ShapeObject): shape is ContainerShape => {
  return shape.tool === 'group' || (shape.tool === 'image' && !!(shape as ImageShape).isContainer);
};

// Check if a shape can be a container (for templates/images)
export const canBeContainer = (shape: ShapeObject): boolean => {
  return shape.tool === 'image' || shape.tool === 'group';
};

// ═══════════════════════════════════════════════════════════════════════════════
// Electron IPC API Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface ElectronAPI {
  // Dialogs
  showSaveDialog: (options: any) => Promise<{ filePath?: string; canceled: boolean }>;
  showOpenDialog: (options: any) => Promise<{ filePaths?: string[]; canceled: boolean }>;
  // File operations
  saveFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
  readProjectFile: (filePath: string) => Promise<{ success: boolean; project?: ProjectData; error?: string }>;
  writeProjectFile: (filePath: string, project: ProjectData) => Promise<{ success: boolean; error?: string }>;
  // Clipboard operations
  clipboardHasImage: () => Promise<boolean>;
  clipboardReadImage: () => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  // Document state
  setDocumentDirty: (dirty: boolean) => Promise<void>;
  saveCompleted: () => Promise<void>;
  saveCancelled: () => Promise<void>;
  // Menu event listeners
  onMenuNew: (callback: () => void) => void;
  onMenuOpen: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuSaveAs: (callback: () => void) => void;
  onMenuSaveAndClose: (callback: () => void) => void;
  onMenuExport: (callback: () => void) => void;
  onMenuClear: (callback: () => void) => void;
  onMenuUndo: (callback: () => void) => void;
  onMenuRedo: (callback: () => void) => void;
  onMenuDelete: (callback: () => void) => void;
  onMenuPaste: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Project file format for save/load
export interface ProjectData {
  version: string;
  shapes: ShapeObject[];
  settings: {
    gridSize: number;
    showGrid: boolean;
    snapToGrid: boolean;
  };
  metadata?: {
    createdAt: string;
    modifiedAt: string;
    title?: string;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    cv?: any;
    cvReady?: boolean;
  }
}
