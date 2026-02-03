import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Konva from 'konva';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { GlobalToolsBar } from './components/GlobalToolsBar';
import { CanvasBoard } from './components/CanvasBoard';
import { ShapeLibrary } from './components/ShapeLibrary';
import { LibraryItem } from './shapeLibrary';
import { ToolType, ShapeObject, ImageShape, GroupShape, SmartArrowShape, AnchorPosition, ProjectData } from './types';
import { DEFAULT_STROKE, DEFAULT_STROKE_WIDTH, COLORS } from './constants';
import { 
  downloadURI, 
  generateId, 
  getGlobalPosition, 
  calculateBounds,
  getDirectChildren,
  globalToLocal,
  isAncestor,
  calculateBestAnchors,
  calculateStraightArrowPath,
  calculateElbowArrowPath,
  updateConnectedSmartArrows,
  getShapeAnchorPoint,
  findClosestAnchor
} from './utils';
import { detectUIObjects, cropImage, isOpenCVReady } from './opencv-utils';
import { Image as ImageIcon } from 'lucide-react';
import { handleError } from './error-handler';
import { DetectionModal } from './components/DetectionModal';
import { WelcomeModal } from './components/WelcomeModal';

const App: React.FC = () => {
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>(DEFAULT_STROKE);
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [strokeWidth, setStrokeWidth] = useState<number>(DEFAULT_STROKE_WIDTH);
  const [shapes, setShapes] = useState<ShapeObject[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<ShapeObject[][]>([[]]);
  const [historyStep, setHistoryStep] = useState<number>(0);
  
  // New State for Multi-select and Zoom
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scale, setScale] = useState<number>(1);
  const [stagePos, setStagePos] = useState<{x: number, y: number}>({ x: 0, y: 0 });

  // Cut Mode State
  const [cutMode, setCutMode] = useState<'copy' | 'cut'>('copy');

  // Grid State
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(20);

  // Auto Switch to Select Tool State
  const [autoSwitchToSelect, setAutoSwitchToSelect] = useState<boolean>(true);

  // Detection State
  const [detectionSensitivity, setDetectionSensitivity] = useState<number>(65);
  const [showDetectionModal, setShowDetectionModal] = useState<boolean>(false);
  const [detectedObjectCount, setDetectedObjectCount] = useState<number>(0);

  // Welcome Modal State
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    return !localStorage.getItem('doodleframe-welcome-shown');
  });

  // File State
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Shape Library State
  const [showShapeLibrary, setShowShapeLibrary] = useState<boolean>(false);

  // OpenCV Ready State
  const [opencvReady, setOpencvReady] = useState<boolean>(false);

  // Smart Arrow Creation State
  const [smartArrowFrom, setSmartArrowFrom] = useState<{ shapeId: string; anchor: AnchorPosition } | null>(null);
  const [smartArrowPreview, setSmartArrowPreview] = useState<{ x: number; y: number } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);

  // Undo/Redo logic
  const handleUndo = () => {
    if (historyStep === 0) return;
    const previous = history[historyStep - 1];
    setHistoryStep(historyStep - 1);
    setShapes(previous);
  };

  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const next = history[historyStep + 1];
    setHistoryStep(historyStep + 1);
    setShapes(next);
  };

  const addToHistory = (newShapes: ShapeObject[]) => {
    const truncatedHistory = history.slice(0, historyStep + 1);
    const newHistory = [...truncatedHistory, newShapes];
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    setIsDirty(true);
  };

  const handleClear = () => {
      // If items are selected, delete them first
      if (selectedIds.length > 0) {
          const shapesToDelete = shapes.filter(s => selectedIds.includes(s.id));
          // Check for locks
          const lockedIds = shapesToDelete.filter(s => s.locked).map(s => s.id);
          
          const newShapes = shapes.filter(s => !selectedIds.includes(s.id) || s.locked);
          
          if (newShapes.length !== shapes.length) {
              setShapes(newShapes);
              addToHistory(newShapes);
              setSelectedIds(lockedIds);
          }
          return;
      }

      // Otherwise, confirm clear all
      if (window.confirm("Are you sure you want to clear the canvas?")) {
        setShapes([]);
        setImage(null);
        addToHistory([]);
      }
  };

  const handleExport = () => {
    if (stageRef.current) {
      setSelectedIds([]);
      
      const prevScale = stageRef.current.scaleX();
      const prevPos = stageRef.current.position();

      setTimeout(() => {
          const uri = stageRef.current!.toDataURL({ pixelRatio: 2 });
          downloadURI(uri, 'doodleframe-export.png');
      }, 100);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const id = generateId();
          const centerX = (-stagePos.x + window.innerWidth / 2) / scale;
          const centerY = (-stagePos.y + window.innerHeight / 2) / scale;
          
          const newShape: ImageShape = {
            id,
            tool: 'image',
            x: centerX - img.width / 2,
            y: centerY - img.height / 2,
            width: img.width,
            height: img.height,
            rotation: 0,
            stroke: 'transparent',
            strokeWidth: 0,
            src: event.target?.result as string,
            locked: false,
          };
          const updatedShapes = [...shapes, newShape];
          setShapes(updatedShapes);
          addToHistory(updatedShapes);
          setTool('select');
          setSelectedIds([id]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Paste image from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    if (!window.electronAPI) {
      // Fallback for browser - try native clipboard API
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
            const blob = await item.getType(item.types.find(t => t.startsWith('image/'))!);
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              const id = generateId();
              const centerX = (-stagePos.x + window.innerWidth / 2) / scale;
              const centerY = (-stagePos.y + window.innerHeight / 2) / scale;
              
              const newShape: ImageShape = {
                id,
                tool: 'image',
                x: centerX - img.width / 2,
                y: centerY - img.height / 2,
                width: img.width,
                height: img.height,
                rotation: 0,
                stroke: 'transparent',
                strokeWidth: 0,
                src: url,
                locked: false,
              };
              const updatedShapes = [...shapes, newShape];
              setShapes(updatedShapes);
              addToHistory(updatedShapes);
              setTool('select');
              setSelectedIds([id]);
            };
            img.src = url;
            return;
          }
        }
      } catch (err) {
        handleError('Clipboard access denied', err);
      }
      return;
    }

    // Electron clipboard API
    const hasImage = await window.electronAPI.clipboardHasImage();
    if (!hasImage) {
      return;
    }

    const result = await window.electronAPI.clipboardReadImage();
    if (!result.success || !result.dataUrl) {
      handleError('Failed to read clipboard', result.error || 'Unknown error');
      return;
    }

    const img = new Image();
    img.onload = () => {
      const id = generateId();
      // Center on current view
      const centerX = (-stagePos.x + window.innerWidth / 2) / scale;
      const centerY = (-stagePos.y + window.innerHeight / 2) / scale;
      
      const newShape: ImageShape = {
        id,
        tool: 'image',
        x: centerX - img.width / 2,
        y: centerY - img.height / 2,
        width: img.width,
        height: img.height,
        rotation: 0,
        stroke: 'transparent',
        strokeWidth: 0,
        src: result.dataUrl!,
        locked: false,
      };
      const updatedShapes = [...shapes, newShape];
      setShapes(updatedShapes);
      addToHistory(updatedShapes);
      setTool('select');
      setSelectedIds([id]);
    };
    img.src = result.dataUrl;
  }, [shapes, stagePos, scale]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // Save/Load Functions
  // ═══════════════════════════════════════════════════════════════════════════════

  const createProjectData = (): ProjectData => ({
    version: '1.0',
    shapes: shapes,
    settings: {
      gridSize,
      showGrid,
      snapToGrid,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      title: currentFilePath ? undefined : 'Untitled',
    },
  });

  const handleSave = useCallback(async () => {
    if (!window.electronAPI) {
      // Browser fallback - save to localStorage
      const project = createProjectData();
      localStorage.setItem('doodleframe-autosave', JSON.stringify(project));
      setIsDirty(false);
      return;
    }

    let filePath = currentFilePath;
    
    if (!filePath) {
      // Save As - no current file path
      const result = await window.electronAPI.showSaveDialog({
        defaultPath: 'untitled.doodleframe',
        filters: [
          { name: 'DoodleFrame Project', extensions: ['doodleframe'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      
      if (result.canceled || !result.filePath) return;
      filePath = result.filePath;
    }

    const project = createProjectData();
    const result = await window.electronAPI.writeProjectFile(filePath, project);
    
    if (result.success) {
      setCurrentFilePath(filePath);
      setIsDirty(false);
    } else {
      handleError('Failed to save file', result.error || 'Unknown error');
    }
  }, [shapes, gridSize, showGrid, snapToGrid, currentFilePath]);

  const handleSaveAs = useCallback(async () => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.showSaveDialog({
      defaultPath: currentFilePath || 'untitled.doodleframe',
      filters: [
        { name: 'DoodleFrame Project', extensions: ['doodleframe'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    
    if (result.canceled || !result.filePath) return;

    const project = createProjectData();
    const writeResult = await window.electronAPI.writeProjectFile(result.filePath, project);
    
    if (writeResult.success) {
      setCurrentFilePath(result.filePath);
      setIsDirty(false);
    } else {
      handleError('Failed to save file', writeResult.error || 'Unknown error');
    }
  }, [shapes, gridSize, showGrid, snapToGrid, currentFilePath]);

  const handleOpen = useCallback(async () => {
    if (!window.electronAPI) {
      // Browser fallback - load from localStorage
      const saved = localStorage.getItem('doodleframe-autosave');
      if (saved) {
        try {
          const project: ProjectData = JSON.parse(saved);
          setShapes(project.shapes);
          setGridSize(project.settings.gridSize);
          setShowGrid(project.settings.showGrid);
          setSnapToGrid(project.settings.snapToGrid);
          setHistory([project.shapes]);
          setHistoryStep(0);
          setCurrentFilePath(null);
          setIsDirty(false);
        } catch (e) {
          handleError('Failed to load from localStorage', e);
        }
      } else {
        alert('No saved project found in browser storage.');
      }
      return;
    }

    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'DoodleFrame Project', extensions: ['doodleframe'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) return;

      const filePath = result.filePaths[0];
      const readResult = await window.electronAPI.readProjectFile(filePath);
      
      if (readResult.success && readResult.project) {
        const project = readResult.project;
        setShapes(project.shapes);
        if (project.settings) {
          setGridSize(project.settings.gridSize ?? 20);
          setShowGrid(project.settings.showGrid ?? false);
          setSnapToGrid(project.settings.snapToGrid ?? false);
        }
        setHistory([project.shapes]);
        setHistoryStep(0);
        setCurrentFilePath(filePath);
        setIsDirty(false);
      } else {
        handleError('Failed to open file', readResult.error || 'Unknown error');
      }
    } catch (error) {
      handleError('Error opening file', error);
    }
  }, []);

  const handleNew = useCallback(() => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Create new file anyway?')) {
        return;
      }
    }
    setShapes([]);
    setImage(null);
    setHistory([[]]);
    setHistoryStep(0);
    setCurrentFilePath(null);
    setIsDirty(false);
    setSelectedIds([]);
  }, [isDirty]);

  const handleAddLibraryShape = useCallback((item: LibraryItem) => {
    const shapeOrShapes = item.createShape();
    const newShapes = Array.isArray(shapeOrShapes) ? shapeOrShapes : [shapeOrShapes];
    
    // Center shapes on current view
    const centerX = (-stagePos.x + window.innerWidth / 2) / scale;
    const centerY = (-stagePos.y + window.innerHeight / 2) / scale;
    
    // Calculate bounding box of new shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    newShapes.forEach(s => {
      if ('width' in s && 'height' in s) {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width);
        maxY = Math.max(maxY, s.y + s.height);
      } else if ('radius' in s) {
        minX = Math.min(minX, s.x - s.radius);
        minY = Math.min(minY, s.y - s.radius);
        maxX = Math.max(maxX, s.x + s.radius);
        maxY = Math.max(maxY, s.y + s.radius);
      } else if (s.tool === 'text') {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + (s.width || 100));
        maxY = Math.max(maxY, s.y + (s.fontSize || 20) * 1.2);
      }
    });
    
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    const offsetX = centerX - (minX + bboxWidth / 2);
    const offsetY = centerY - (minY + bboxHeight / 2);
    
    // Reposition shapes to center
    const repositionedShapes = newShapes.map(s => ({
      ...s,
      x: s.x + offsetX,
      y: s.y + offsetY,
    }));
    
    const updatedShapes = [...shapes, ...repositionedShapes];
    setShapes(updatedShapes);
    addToHistory(updatedShapes);
    setTool('select');
    setSelectedIds(repositionedShapes.map(s => s.id));
  }, [shapes, stagePos, scale]);

  const handleAddTemplate = (src: string) => {
    const id = generateId();
    const img = new Image();
    img.onload = () => {
        // Center template on current view
        const centerX = (-stagePos.x + window.innerWidth / 2) / scale;
        const centerY = (-stagePos.y + window.innerHeight / 2) / scale;
        
        const newShape: ImageShape = {
            id,
            tool: 'image',
            x: centerX - img.width / 2,
            y: centerY - img.height / 2,
            width: img.width,
            height: img.height,
            rotation: 0,
            stroke: 'transparent',
            strokeWidth: 0,
            src: src,
            locked: false,
            isTemplate: true, // Mark as template so it renders on top
            isContainer: true, // Templates can contain child shapes
            children: []
        };
        const updatedShapes = [...shapes, newShape];
        setShapes(updatedShapes);
        addToHistory(updatedShapes);
        setTool('select');
        setSelectedIds([id]);
    };
    img.src = src;
  };

  // Detect UI objects from the current image
  const handleDetectObjects = useCallback(async () => {
    // Check if OpenCV is ready
    if (!isOpenCVReady()) {
      alert('OpenCV is still loading. Please wait a few seconds and try again.');
      return;
    }
    
    // Find an image shape to detect objects from
    const imageShape = shapes.find(s => s.tool === 'image' && !(s as ImageShape).isTemplate);
    if (!imageShape) {
      alert('Please import an image first to detect objects');
      return;
    }

    try {
      const src = (imageShape as ImageShape).src;
      const result = await detectUIObjects(src, detectionSensitivity);

      if (result.objects.length === 0) {
        alert('No objects detected. Try adjusting the sensitivity slider or importing a screenshot with clearer UI elements.');
        return;
      }

      // Create background shape (inpainted - objects removed)
      const bgId = generateId();
      const bgShape: ImageShape = {
        id: bgId,
        tool: 'image',
        x: imageShape.x,
        y: imageShape.y,
        width: (imageShape as ImageShape).width,
        height: (imageShape as ImageShape).height,
        rotation: 0,
        stroke: 'transparent',
        strokeWidth: 0,
        src: result.backgroundInpainted,
        locked: true,
        isTemplate: false,
        isContainer: false,
        children: []
      };

      // Create new image shapes for each detected object
      const newShapes: ImageShape[] = [bgShape];
      const newIds: string[] = [];

      for (const obj of result.objects) {
        const croppedSrc = await cropImage(src, obj);
        const id = generateId();
        
        // Position relative to original image position
        const newShape: ImageShape = {
          id,
          tool: 'image',
          x: imageShape.x + obj.x,
          y: imageShape.y + obj.y,
          width: obj.width,
          height: obj.height,
          rotation: 0,
          stroke: 'transparent',
          strokeWidth: 0,
          src: croppedSrc,
          locked: false,
          isTemplate: false,
          isContainer: false,
          children: []
        };
        newShapes.push(newShape);
        newIds.push(id);
      }

      // Remove the original image and add background + detected objects
      const updatedShapes = shapes.filter(s => s.id !== imageShape.id);
      const finalShapes = [...updatedShapes, ...newShapes];
      
      setShapes(finalShapes);
      addToHistory(finalShapes);
      setSelectedIds(newIds);

      // Show success modal
      setDetectedObjectCount(result.objects.length);
      setShowDetectionModal(true);
    } catch (error) {
      handleError('Failed to detect objects', error);
    }
  }, [shapes, addToHistory]);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // Smart Arrow Functions
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleSmartArrowStart = useCallback((shapeId: string, anchor: AnchorPosition) => {
    setSmartArrowFrom({ shapeId, anchor });
  }, []);

  const handleSmartArrowMove = useCallback((x: number, y: number) => {
    if (smartArrowFrom) {
      setSmartArrowPreview({ x, y });
    }
  }, [smartArrowFrom]);

  const handleSmartArrowEnd = useCallback((toShapeId: string, toAnchor: AnchorPosition) => {
    if (!smartArrowFrom || smartArrowFrom.shapeId === toShapeId) {
      setSmartArrowFrom(null);
      setSmartArrowPreview(null);
      return;
    }

    const fromShape = shapes.find(s => s.id === smartArrowFrom.shapeId);
    const toShape = shapes.find(s => s.id === toShapeId);
    
    if (!fromShape || !toShape) {
      setSmartArrowFrom(null);
      setSmartArrowPreview(null);
      return;
    }

    // Calculate the arrow path
    const points = calculateStraightArrowPath(
      fromShape, 
      toShape, 
      shapes, 
      smartArrowFrom.anchor, 
      toAnchor
    );

    const newArrow: SmartArrowShape = {
      id: generateId(),
      tool: 'smart-arrow',
      x: 0,
      y: 0,
      rotation: 0,
      stroke: color,
      strokeWidth: strokeWidth,
      fromShapeId: smartArrowFrom.shapeId,
      toShapeId: toShapeId,
      fromAnchor: smartArrowFrom.anchor,
      toAnchor: toAnchor,
      points: points,
      style: 'straight'
    };

    const updatedShapes = [...shapes, newArrow];
    setShapes(updatedShapes);
    addToHistory(updatedShapes);
    setSmartArrowFrom(null);
    setSmartArrowPreview(null);
    setTool('select');
  }, [smartArrowFrom, shapes, color, strokeWidth]);

  const cancelSmartArrow = useCallback(() => {
    setSmartArrowFrom(null);
    setSmartArrowPreview(null);
  }, []);

  // Update smart arrows when shapes move
  const updateSmartArrows = useCallback((movedShapeId: string) => {
    setShapes(prevShapes => updateConnectedSmartArrows(movedShapeId, prevShapes));
  }, []);

  const handleToggleLock = () => {
      if (selectedIds.length === 0) return;
      
      const updatedShapes = shapes.map(shape => {
          if (selectedIds.includes(shape.id)) {
              return { ...shape, locked: !shape.locked };
          }
          return shape;
      });
      setShapes(updatedShapes);
      addToHistory(updatedShapes);
  };
  
  const handleZoomIn = () => {
      setScale(prev => Math.min(prev * 1.2, 5));
  };
  
  const handleZoomOut = () => {
      setScale(prev => Math.max(prev / 1.2, 0.1));
  };
  
  const handleToolFinished = () => {
      if (autoSwitchToSelect) {
          setTool('select');
      }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // Group/Ungroup Functions
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const canGroup = useMemo(() => {
    // Need at least 2 selected shapes that are not already in a group together
    if (selectedIds.length < 2) return false;
    
    // Check if any selected shape is already inside another selected shape
    // (can't group a parent with its child)
    for (const id of selectedIds) {
      for (const otherId of selectedIds) {
        if (id !== otherId) {
          if (isAncestor(id, otherId, shapes)) return false;
        }
      }
    }
    
    return true;
  }, [selectedIds, shapes]);

  const canUngroup = useMemo(() => {
    // Need at least 1 group selected
    return selectedIds.some(id => {
      const shape = shapes.find(s => s.id === id);
      return shape?.tool === 'group';
    });
  }, [selectedIds, shapes]);

  const handleGroup = useCallback(() => {
    if (!canGroup) return;
    
    const groupId = generateId();
    
    // Calculate bounds of all selected shapes
    const bounds = calculateBounds(selectedIds, shapes);
    if (!bounds) return;
    
    // Add padding to the group bounds
    const padding = 10;
    const groupX = bounds.x - padding;
    const groupY = bounds.y - padding;
    const groupWidth = bounds.width + padding * 2;
    const groupHeight = bounds.height + padding * 2;
    
    // Create new group shape
    const newGroup: GroupShape = {
      id: groupId,
      tool: 'group',
      x: groupX,
      y: groupY,
      width: groupWidth,
      height: groupHeight,
      rotation: 0,
      stroke: '#3b82f6',
      strokeWidth: 1,
      children: selectedIds,
      isContainer: true
    };
    
    // Update selected shapes to be children of the new group
    // Convert their positions from global to local (relative to group)
    const updatedShapes = shapes.map(s => {
      if (selectedIds.includes(s.id)) {
        const globalPos = getGlobalPosition(s, shapes);
        return {
          ...s,
          parentId: groupId,
          x: globalPos.x - groupX,
          y: globalPos.y - groupY
        };
      }
      return s;
    });
    
    // Add the new group to the shapes
    const finalShapes = [...updatedShapes, newGroup];
    
    setShapes(finalShapes);
    addToHistory(finalShapes);
    setSelectedIds([groupId]);
  }, [canGroup, selectedIds, shapes]);

  const handleUngroup = useCallback(() => {
    if (!canUngroup) return;
    
    const groupIds = selectedIds.filter(id => {
      const shape = shapes.find(s => s.id === id);
      return shape?.tool === 'group';
    });
    
    let updatedShapes = [...shapes];
    const ungroupedShapeIds: string[] = [];
    
    groupIds.forEach(groupId => {
      const group = updatedShapes.find(s => s.id === groupId) as GroupShape;
      if (!group) return;
      
      const children = getDirectChildren(groupId, updatedShapes);
      
      // Convert children's positions from local to global
      updatedShapes = updatedShapes.map(s => {
        if (s.parentId === groupId) {
          const globalPos = getGlobalPosition(s, updatedShapes);
          ungroupedShapeIds.push(s.id);
          return {
            ...s,
            parentId: undefined,
            x: globalPos.x,
            y: globalPos.y
          };
        }
        return s;
      });
      
      // Remove the group
      updatedShapes = updatedShapes.filter(s => s.id !== groupId);
    });
    
    setShapes(updatedShapes);
    addToHistory(updatedShapes);
    setSelectedIds(ungroupedShapeIds);
  }, [canUngroup, selectedIds, shapes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Group: Ctrl+G
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        handleGroup();
        return;
      }
      
      // Ungroup: Ctrl+Shift+G
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        handleUngroup();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      // GNOME HIG: Ctrl+Y for Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      // Paste image from clipboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Only handle if not typing in an input
        if (document.activeElement?.tagName !== 'TEXTAREA' && 
            document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          handlePasteFromClipboard();
        }
      }
      // File operations
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNew();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAs();
        } else {
          handleSave();
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
          // If editing text, don't delete shape
          if (document.activeElement?.tagName === 'TEXTAREA') return;

          if (selectedIds.length > 0) {
              const shapesToDelete = shapes.filter(s => selectedIds.includes(s.id));
              // Only delete unlocked items
              const lockedIds = shapesToDelete.filter(s => s.locked).map(s => s.id);
              
              if (lockedIds.length < selectedIds.length) {
                   const newShapes = shapes.filter(s => !selectedIds.includes(s.id) || s.locked);
                   setShapes(newShapes);
                   addToHistory(newShapes);
                   setSelectedIds(lockedIds); // Keep locked items selected
              }
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history, selectedIds, shapes, handleGroup, handleUngroup, handlePasteFromClipboard, handleNew, handleOpen, handleSave, handleSaveAs]);


  // Determine lock state for UI (if any selected is unlocked, show as unlocked)
  const isSelectionLocked = selectedIds.length > 0 && selectedIds.every(id => {
      const s = shapes.find(shape => shape.id === id);
      return s?.locked;
  });

  // Get selected shape info for PropertiesPanel
  const selectedShape = selectedIds.length === 1 
    ? shapes.find(s => s.id === selectedIds[0]) 
    : null;
  
  const selectedParentName = useMemo(() => {
    if (!selectedShape?.parentId) return null;
    const parent = shapes.find(s => s.id === selectedShape.parentId);
    if (!parent) return null;
    if (parent.tool === 'group') return 'Group';
    if (parent.tool === 'image') {
      return (parent as ImageShape).isTemplate ? 'Template' : 'Image';
    }
    return 'Container';
  }, [selectedShape, shapes]);

  // Check if a template is selected (to allow adding shapes to it)
  const selectedTemplate = selectedIds.length === 1
    ? shapes.find(s => s.id === selectedIds[0] && s.tool === 'image' && (s as ImageShape).isTemplate)
    : null;

  // Sync dirty state with main process
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setDocumentDirty(isDirty);
    }
  }, [isDirty]);

  // Check OpenCV loading status
  useEffect(() => {
    const checkOpencv = () => {
      if (isOpenCVReady()) {
        setOpencvReady(true);
      } else {
        setOpencvReady(false);
      }
    };
    
    // Check immediately and then periodically
    checkOpencv();
    const interval = setInterval(checkOpencv, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Menu event listeners (IPC from main process)
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMenuExport(() => {
        handleExport();
      });
      window.electronAPI.onMenuClear(() => {
        handleClear();
      });
      window.electronAPI.onMenuUndo(() => {
        handleUndo();
      });
      window.electronAPI.onMenuRedo(() => {
        handleRedo();
      });
      window.electronAPI.onMenuDelete(() => {
        if (selectedIds.length > 0) {
          const newShapes = shapes.filter(s => !selectedIds.includes(s.id) || s.locked);
          if (newShapes.length !== shapes.length) {
            setShapes(newShapes);
            addToHistory(newShapes);
            setSelectedIds([]);
          }
        }
      });
      window.electronAPI.onMenuPaste(() => {
        handlePasteFromClipboard();
      });
      window.electronAPI.onMenuNew(() => {
        handleNew();
      });
      window.electronAPI.onMenuOpen(() => {
        handleOpen();
      });
      window.electronAPI.onMenuSave(() => {
        handleSave();
      });
      window.electronAPI.onMenuSaveAs(() => {
        handleSaveAs();
      });
      window.electronAPI.onMenuSaveAndClose(async () => {
        // Save and then signal main to close
        await handleSave();
        // Check if save was successful (isDirty should be false)
        if (!isDirty && window.electronAPI) {
          window.electronAPI.saveCompleted();
        } else {
          // Save was cancelled or failed
          window.electronAPI?.saveCancelled();
        }
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu-export');
        window.electronAPI.removeAllListeners('menu-clear');
        window.electronAPI.removeAllListeners('menu-undo');
        window.electronAPI.removeAllListeners('menu-redo');
        window.electronAPI.removeAllListeners('menu-delete');
        window.electronAPI.removeAllListeners('menu-paste');
        window.electronAPI.removeAllListeners('menu-new');
        window.electronAPI.removeAllListeners('menu-open');
        window.electronAPI.removeAllListeners('menu-save');
        window.electronAPI.removeAllListeners('menu-save-as');
        window.electronAPI.removeAllListeners('menu-save-and-close');
      }
    };
  }, [shapes, selectedIds, isDirty, handleExport, handleClear, handleUndo, handleRedo, handlePasteFromClipboard, handleNew, handleOpen, handleSave, handleSaveAs]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-50 flex">
        {!image && shapes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="text-center text-gray-400">
                    <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">Start Drawing</h2>
                    <p>Drag & drop an image or use the toolbar to upload</p>
                </div>
            </div>
        )}

      <Toolbar
        selectedTool={tool}
        onSelectTool={(t) => {
            setTool(t);
            setSelectedIds([]);
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        onImageUpload={handleImageUpload}
        onAddTemplate={handleAddTemplate}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onToggleShapeLibrary={() => setShowShapeLibrary(!showShapeLibrary)}
        isShapeLibraryOpen={showShapeLibrary}
        onDetectObjects={handleDetectObjects}
        canDetectObjects={opencvReady && shapes.some(s => s.tool === 'image' && !(s as ImageShape).isTemplate)}
        canUndo={historyStep > 0}
        canRedo={historyStep < history.length - 1}
        canGroup={canGroup}
        canUngroup={canUngroup}
      />

      {showShapeLibrary && (
        <ShapeLibrary
          onAddShape={handleAddLibraryShape}
          onClose={() => setShowShapeLibrary(false)}
        />
      )}

      <GlobalToolsBar
        autoSwitchToSelect={autoSwitchToSelect}
        setAutoSwitchToSelect={setAutoSwitchToSelect}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        gridSize={gridSize}
        setGridSize={setGridSize}
      />

      <PropertiesPanel
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        fillColor={fillColor}
        setFillColor={setFillColor}
        tool={tool}
        isLocked={isSelectionLocked}
        onToggleLock={handleToggleLock}
        hasSelection={selectedIds.length > 0}
        cutMode={cutMode}
        setCutMode={setCutMode}
        selectedShape={selectedShape}
        parentName={selectedParentName}
        canGroup={canGroup}
        canUngroup={canUngroup}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        detectionSensitivity={detectionSensitivity}
        setDetectionSensitivity={setDetectionSensitivity}
        canDetectObjects={opencvReady && shapes.some(s => s.tool === 'image' && !(s as ImageShape).isTemplate)}
      />

      <div className="flex-1 relative cursor-crosshair">
        <CanvasBoard
          tool={tool}
          color={color}
          fillColor={fillColor}
          strokeWidth={strokeWidth}
          image={image}
          stageRef={stageRef}
          shapes={shapes}
          setShapes={setShapes}
          addToHistory={addToHistory}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          scale={scale}
          setScale={setScale}
          stagePos={stagePos}
          setStagePos={setStagePos}
          cutMode={cutMode}
          onToolFinished={handleToolFinished}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          activeTemplateId={selectedTemplate?.id}
          smartArrowFrom={smartArrowFrom}
          smartArrowPreview={smartArrowPreview}
          onSmartArrowStart={handleSmartArrowStart}
          onSmartArrowMove={handleSmartArrowMove}
          onSmartArrowEnd={handleSmartArrowEnd}
          onSmartArrowCancel={cancelSmartArrow}
          updateSmartArrows={updateSmartArrows}
        />
      </div>

      {/* Detection Result Modal */}
      <DetectionModal
        isOpen={showDetectionModal}
        objectCount={detectedObjectCount}
        onClose={() => setShowDetectionModal(false)}
      />

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          localStorage.setItem('doodleframe-welcome-shown', 'true');
        }}
      />
    </div>
  );
};

export default App;
