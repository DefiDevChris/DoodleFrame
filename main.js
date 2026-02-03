import { app, BrowserWindow, ipcMain, dialog, Menu, clipboard, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference of the window object
let mainWindow;

const isDev = process.argv.includes('--dev');

// Track if document has unsaved changes
let isDocumentDirty = false;
let isQuitting = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
    show: false,
    titleBarStyle: 'default',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window close request - check for unsaved changes
  mainWindow.on('close', async (event) => {
    if (isDev) return; // Skip in dev mode
    
    if (isDocumentDirty && !isQuitting) {
      event.preventDefault();
      
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Save', 'Don\'t Save', 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        title: 'Unsaved Changes',
        message: 'Do you want to save changes to your project?',
        detail: 'Your changes will be lost if you don\'t save them.'
      });

      if (result.response === 0) {
        // Save - trigger save and wait for it to complete
        mainWindow.webContents.send('menu-save-and-close');
      } else if (result.response === 1) {
        // Don't Save - close without saving
        isQuitting = true;
        mainWindow.close();
      }
      // Cancel - do nothing, window stays open
    }
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new');
          }
        },
        { type: 'separator' },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open');
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-save-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Export as PNG',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow.webContents.send('menu-export');
          }
        },
        { type: 'separator' },
        {
          label: 'Clear Canvas',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            mainWindow.webContents.send('menu-clear');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow.webContents.send('menu-undo');
          }
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          click: () => {
            mainWindow.webContents.send('menu-redo');
          }
        },
        {
          label: 'Redo (Alt)',
          accelerator: 'CmdOrCtrl+Shift+Z',
          visible: false,
          click: () => {
            mainWindow.webContents.send('menu-redo');
          }
        },
        { type: 'separator' },
        {
          label: 'Paste Image',
          accelerator: 'CmdOrCtrl+V',
          click: () => {
            mainWindow.webContents.send('menu-paste');
          }
        },
        { type: 'separator' },
        {
          label: 'Delete Selected',
          accelerator: 'Delete',
          click: () => {
            mainWindow.webContents.send('menu-delete');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About DoodleFrame',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DoodleFrame',
              message: 'DoodleFrame',
              detail: 'A simple drawing and wireframing tool for Linux.\n\nVersion: 1.0.0\n\nDraw, sketch, and annotate images with ease.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('save-file', async (event, filePath, data) => {
  try {
    // Security: Validate file path to prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const homeDir = app.getPath('home');
    const documentsDir = app.getPath('documents');

    if (!resolvedPath ||
        (!resolvedPath.startsWith(homeDir) && !resolvedPath.startsWith(documentsDir))) {
      return { success: false, error: 'File access not permitted outside user directory' };
    }

    // Security: Check file size limit (50MB for images)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (data.length > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds 50MB limit' };
    }

    // Remove data URL prefix if present
    const base64Data = data.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(resolvedPath, Buffer.from(base64Data, 'base64'));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Clipboard: Check if image available
ipcMain.handle('clipboard-has-image', async () => {
  return clipboard.availableFormats().includes('image/png') || 
         clipboard.availableFormats().includes('image/jpeg') ||
         clipboard.availableFormats().includes('image/bmp');
});

// Clipboard: Read image as data URL
ipcMain.handle('clipboard-read-image', async () => {
  try {
    const image = clipboard.readImage();
    if (image.isEmpty()) {
      return { success: false, error: 'No image in clipboard' };
    }
    const dataUrl = image.toDataURL();
    return { success: true, dataUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// JSON File: Read project file
ipcMain.handle('read-project-file', async (event, filePath) => {
  try {
    // Security: Validate file path
    const resolvedPath = path.resolve(filePath);
    const homeDir = app.getPath('home');
    const documentsDir = app.getPath('documents');

    if (!resolvedPath ||
        (!resolvedPath.startsWith(homeDir) && !resolvedPath.startsWith(documentsDir))) {
      return { success: false, error: 'File access not permitted outside user directory' };
    }

    // Security: Validate file extension
    if (!resolvedPath.endsWith('.doodleframe') && !resolvedPath.endsWith('.json')) {
      return { success: false, error: 'Invalid file type. Expected .doodleframe or .json' };
    }

    // Security: Check file size limit (10MB for project files)
    const MAX_PROJECT_SIZE = 10 * 1024 * 1024;
    const stats = fs.statSync(resolvedPath);
    if (stats.size > MAX_PROJECT_SIZE) {
      return { success: false, error: 'Project file exceeds 10MB limit' };
    }

    const data = fs.readFileSync(resolvedPath, 'utf-8');
    const project = JSON.parse(data);

    // Security: Basic schema validation
    if (!project || typeof project !== 'object') {
      return { success: false, error: 'Invalid project file format' };
    }
    if (!Array.isArray(project.shapes)) {
      return { success: false, error: 'Invalid project file: missing shapes array' };
    }

    return { success: true, project };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// JSON File: Write project file
ipcMain.handle('write-project-file', async (event, filePath, project) => {
  try {
    // Security: Validate file path
    const resolvedPath = path.resolve(filePath);
    const homeDir = app.getPath('home');
    const documentsDir = app.getPath('documents');

    if (!resolvedPath ||
        (!resolvedPath.startsWith(homeDir) && !resolvedPath.startsWith(documentsDir))) {
      return { success: false, error: 'File access not permitted outside user directory' };
    }

    // Security: Validate file extension
    if (!resolvedPath.endsWith('.doodleframe') && !resolvedPath.endsWith('.json')) {
      return { success: false, error: 'Invalid file type. Expected .doodleframe or .json' };
    }

    // Security: Basic schema validation
    if (!project || typeof project !== 'object') {
      return { success: false, error: 'Invalid project data' };
    }
    if (!Array.isArray(project.shapes)) {
      return { success: false, error: 'Invalid project data: missing shapes array' };
    }

    const data = JSON.stringify(project, null, 2);

    // Security: Check data size limit (10MB)
    const MAX_PROJECT_SIZE = 10 * 1024 * 1024;
    if (data.length > MAX_PROJECT_SIZE) {
      return { success: false, error: 'Project data exceeds 10MB limit' };
    }

    fs.writeFileSync(resolvedPath, data, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set document dirty state from renderer
ipcMain.handle('set-document-dirty', (event, dirty) => {
  isDocumentDirty = dirty;
  // Update window title to show dirty state
  if (mainWindow) {
    const title = mainWindow.getTitle();
    const baseTitle = title.replace(/ \*$/, '');
    mainWindow.setTitle(dirty ? baseTitle + ' *' : baseTitle);
  }
});

// Confirm save completed and close window
ipcMain.handle('save-completed', () => {
  isQuitting = true;
  isDocumentDirty = false;
  if (mainWindow) {
    mainWindow.close();
  }
});

// Confirm save cancelled (dialog cancelled)
ipcMain.handle('save-cancelled', () => {
  // User cancelled save dialog, window stays open
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
