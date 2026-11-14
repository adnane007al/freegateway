// Built to build/preload-popover.cjs. Exposes the minimal IPC surface the
// popover UI needs — no Node access in the renderer.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('freegateway', {
  snapshot: () => ipcRenderer.invoke('freegateway:snapshot'),
  openDashboard: () => ipcRenderer.invoke('freegateway:open-dashboard'),
  copyBaseUrl: () => ipcRenderer.invoke('freegateway:copy-base-url'),
  copyApiKey: () => ipcRenderer.invoke('freegateway:copy-api-key'),
  setLoginItem: (open: boolean) => ipcRenderer.invoke('freegateway:set-login-item', open),
  quit: () => ipcRenderer.invoke('freegateway:quit'),
  onRefresh: (cb: () => void) => ipcRenderer.on('freegateway:refresh', cb),
});
