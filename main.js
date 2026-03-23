const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#f5f0e6',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
};

const dataPath = () => path.join(app.getPath('userData'), 'catalog.json');

const defaultData = () => ({
  drawers: [
    {
      id: 'drawer-1',
      name: 'EE — English Poetry',
      cards: []
    }
  ]
});

const readData = () => {
  const filePath = dataPath();
  try {
    if (!fs.existsSync(filePath)) {
      return defaultData();
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read catalog', error);
    return defaultData();
  }
};

const writeData = (payload) => {
  const filePath = dataPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
};

app.whenReady().then(() => {
  ipcMain.handle('catalog:load', () => readData());
  ipcMain.handle('catalog:save', (_event, payload) => writeData(payload));
  ipcMain.handle('catalog:openFile', (_event, targetPath) => shell.openPath(targetPath));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
