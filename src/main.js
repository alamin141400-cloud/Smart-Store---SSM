// ================= 2️⃣ main.js (STRICT NODE ONLY) =================
const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("path");

const DOMAIN = "https://arman.ahrtechdiv.com";

let win;
let views = [];
let activeIndex = -1;

function createView(url = DOMAIN) {
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  view.webContents.loadURL(url);
  views.push(view);

  view.webContents.once("did-finish-load", () => {
    setActiveView(views.length - 1);
  });
}

function setActiveView(index) {
  if (!win || !views[index]) return;

  try {
    const current = win.getBrowserView();
    if (current) win.removeBrowserView(current);
  } catch {}

  activeIndex = index;
  const view = views[index];

  win.setBrowserView(view);

  const bounds = win.getContentBounds();
  view.setBounds({
    x: 0,
    y: 100,
    width: bounds.width,
    height: bounds.height - 100
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1300,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");

  win.webContents.once("did-finish-load", () => {
    createView();
  });

  win.on("resize", () => {
    if (activeIndex >= 0) setActiveView(activeIndex);
  });
}

app.whenReady().then(createWindow);

// ================= IPC =================
ipcMain.handle("nav:back", () => {
  const v = views[activeIndex];
  if (v && v.webContents.canGoBack()) v.webContents.goBack();
});

ipcMain.handle("nav:forward", () => {
  const v = views[activeIndex];
  if (v && v.webContents.canGoForward()) v.webContents.goForward();
});

ipcMain.handle("nav:reload", () => {
  const v = views[activeIndex];
  if (v) v.webContents.reload();
});

ipcMain.handle("tab:new", () => createView());
ipcMain.handle("tab:switch", (_, i) => setActiveView(i));

// ================= 3️⃣ preload.js =================
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  back: () => ipcRenderer.invoke("nav:back"),
  forward: () => ipcRenderer.invoke("nav:forward"),
  reload: () => ipcRenderer.invoke("nav:reload"),
  newTab: () => ipcRenderer.invoke("tab:new"),
  switchTab: (i) => ipcRenderer.invoke("tab:switch", i)
});
