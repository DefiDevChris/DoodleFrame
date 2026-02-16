# Object Locking Feature

## Overview

DoodleFrame includes a comprehensive object locking feature that prevents locked objects from being moved or deleted until they are explicitly unlocked.

## Implementation Details

### 1. Type Definition

The `locked` property is defined in the `BaseShape` interface (`src/types.ts:20`):

```typescript
export interface BaseShape {
  id: string;
  parentId?: string;
  tool: ToolType;
  x: number;
  y: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
  locked?: boolean;  // Lock state
  layer?: 'background' | 'drawing';
  compositeOperation?: 'source-over' | 'destination-out';
}
```

### 2. User Interface

The lock/unlock button is displayed in the Properties Panel (`src/components/PropertiesPanel.tsx:231-248`) when objects are selected:

- **Lock Button**: Shows a Lock icon with red background when object is locked
- **Unlock Button**: Shows an Unlock icon with gray background when object is unlocked
- **Toggle Action**: Clicking the button toggles the lock state for all selected objects

### 3. Lock Toggle Handler

The `handleToggleLock` function in `App.tsx:659-670` handles toggling the lock state:

```typescript
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
```

### 4. Movement Prevention

Locked objects cannot be moved because the `draggable` property is set to `false` when an object is locked:

**In CanvasBoard.tsx:134** (Individual shapes):
```typescript
draggable: tool === 'select' && !shape.locked
```

**In CanvasBoard.tsx:302** (Container shapes):
```typescript
draggable: tool === 'select' && !shape.locked
```

### 5. Deletion Prevention

Locked objects are protected from deletion in multiple places:

**Clear/Delete Handler** (`App.tsx:105-128`):
```typescript
const handleClear = () => {
    if (selectedIds.length > 0) {
        const shapesToDelete = shapes.filter(s => selectedIds.includes(s.id));
        const lockedIds = shapesToDelete.filter(s => s.locked).map(s => s.id);

        // Only delete unlocked items
        const newShapes = shapes.filter(s => !selectedIds.includes(s.id) || s.locked);

        if (newShapes.length !== shapes.length) {
            setShapes(newShapes);
            addToHistory(newShapes);
            setSelectedIds(lockedIds); // Keep locked items selected
        }
        return;
    }

    // Confirm clear all if no selection
    if (window.confirm("Are you sure you want to clear the canvas?")) {
        setShapes([]);
        setImage(null);
        addToHistory([]);
    }
};
```

**Keyboard Delete Handler** (`App.tsx:862-878`):
```typescript
if (e.key === 'Delete' || e.key === 'Backspace') {
    if (document.activeElement?.tagName === 'TEXTAREA') return;

    if (selectedIds.length > 0) {
        const shapesToDelete = shapes.filter(s => selectedIds.includes(s.id));
        const lockedIds = shapesToDelete.filter(s => s.locked).map(s => s.id);

        if (lockedIds.length < selectedIds.length) {
            const newShapes = shapes.filter(s => !selectedIds.includes(s.id) || s.locked);
            setShapes(newShapes);
            addToHistory(newShapes);
            setSelectedIds(lockedIds); // Keep locked items selected
        }
    }
}
```

**Menu Delete Handler** (`App.tsx:951-960`):
```typescript
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
```

## Usage

1. **Select an object** using the Select tool
2. **Open the Properties Panel** (appears automatically on the left side)
3. **Click the Lock/Unlock button** to toggle the lock state
4. **Locked objects:**
   - Cannot be moved or dragged
   - Cannot be deleted (via Delete key, Backspace, or menu)
   - Remain selected when deletion is attempted, allowing easy unlocking
5. **Unlock objects** by selecting them and clicking the Unlock button

## Testing

Tests for the locking functionality are available in `src/test/App.locking.test.tsx`. These tests verify:

- Lock/Unlock UI visibility
- Lock property existence in BaseShape interface
- Movement prevention for locked shapes
- Deletion prevention for locked shapes

## Benefits

- **Protect important objects** from accidental modification
- **Layer management** by locking background elements
- **Template protection** when working with templates
- **Workflow efficiency** by preventing accidental changes to key elements

## Future Enhancements

Potential improvements for the locking feature:

- Visual indicator on locked objects (lock icon overlay)
- Bulk lock/unlock operations
- Layer-based locking
- Lock templates for common locking patterns
