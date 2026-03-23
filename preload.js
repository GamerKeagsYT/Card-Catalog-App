const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catalog', {
  loadData: () => ipcRenderer.invoke('catalog:load'),
  saveData: (payload) => ipcRenderer.invoke('catalog:save', payload),
  openFile: (targetPath) => ipcRenderer.invoke('catalog:openFile', targetPath)
});
