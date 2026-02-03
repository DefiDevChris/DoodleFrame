import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Show dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Save file
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  
  // Project file operations
  readProjectFile: (filePath) => ipcRenderer.invoke('read-project-file', filePath),
  writeProjectFile: (filePath, project) => ipcRenderer.invoke('write-project-file', filePath, project),
  
  // Clipboard operations
  clipboardHasImage: () => ipcRenderer.invoke('clipboard-has-image'),
  clipboardReadImage: () => ipcRenderer.invoke('clipboard-read-image'),
  
  // Document dirty state
  setDocumentDirty: (dirty) => ipcRenderer.invoke('set-document-dirty', dirty),
  saveCompleted: () => ipcRenderer.invoke('save-completed'),
  saveCancelled: () => ipcRenderer.invoke('save-cancelled'),
  
  // Menu event listeners
  onMenuNew: (callback) => ipcRenderer.on('menu-new', callback),
  onMenuOpen: (callback) => ipcRenderer.on('menu-open', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu-save-as', callback),
  onMenuSaveAndClose: (callback) => ipcRenderer.on('menu-save-and-close', callback),
  onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
  onMenuClear: (callback) => ipcRenderer.on('menu-clear', callback),
  onMenuUndo: (callback) => ipcRenderer.on('menu-undo', callback),
  onMenuRedo: (callback) => ipcRenderer.on('menu-redo', callback),
  onMenuDelete: (callback) => ipcRenderer.on('menu-delete', callback),
  onMenuPaste: (callback) => ipcRenderer.on('menu-paste', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
