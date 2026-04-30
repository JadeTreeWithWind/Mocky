"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
const utils = require("@electron-toolkit/utils");
const node_crypto = require("node:crypto");
const zod = require("zod");
const Fastify = require("fastify");
const net = require("net");
const fastifySwagger = require("@fastify/swagger");
const fastifySwaggerUi = require("@fastify/swagger-ui");
const fastifyCors = require("@fastify/cors");
require("uuid");
const icon = path.join(__dirname, "../../resources/icon.png");
const PROJECT_STATUS = {
  STOPPED: "stopped",
  RUNNING: "running"
};
const HTTP_METHODS = zod.z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]);
const ProjectSchema = zod.z.object({
  id: zod.z.string().uuid(),
  name: zod.z.string(),
  description: zod.z.string().optional(),
  port: zod.z.number().int().min(1).max(65535),
  createdAt: zod.z.string(),
  updatedAt: zod.z.string(),
  version: zod.z.string().default("1.0.0"),
  status: zod.z.enum([PROJECT_STATUS.STOPPED, PROJECT_STATUS.RUNNING]).default(PROJECT_STATUS.STOPPED)
});
const RouteParameterSchema = zod.z.object({
  id: zod.z.string().uuid(),
  name: zod.z.string(),
  in: zod.z.enum(["query", "path", "header", "cookie"]),
  type: zod.z.enum(["string", "number", "integer", "boolean", "array", "object"]),
  required: zod.z.boolean().default(false),
  description: zod.z.string().optional(),
  default: zod.z.string().optional()
});
const RouteSchema = zod.z.object({
  id: zod.z.string().uuid(),
  projectId: zod.z.string().uuid(),
  method: HTTP_METHODS,
  path: zod.z.string().startsWith("/"),
  description: zod.z.string().optional(),
  isActive: zod.z.boolean().default(true),
  response: zod.z.object({
    statusCode: zod.z.number().int(),
    body: zod.z.string(),
    delay: zod.z.number().int().default(0)
  }),
  tags: zod.z.array(zod.z.string()).default([]),
  parameters: zod.z.array(RouteParameterSchema).default([]),
  requestBody: zod.z.object({
    required: zod.z.boolean().default(false),
    description: zod.z.string().optional(),
    schema: zod.z.string().default("{}")
  }).optional()
});
zod.z.object({
  projects: zod.z.array(ProjectSchema),
  routes: zod.z.array(RouteSchema)
});
const DB_FILE_NAME = "db.json";
const DEFAULT_DATA = { projects: [], routes: [] };
class DBService {
  db = null;
  dbPath = "";
  constructor() {
  }
  /**
   * 初始化資料庫連接與遷移
   * @throws {Error} 當無法載入 lowdb 或寫入檔案時
   */
  async init() {
    if (this.db) return;
    if (!this.dbPath) {
      this.dbPath = path.join(electron.app.getPath("userData"), DB_FILE_NAME);
    }
    try {
      const { JSONFilePreset } = await import("lowdb/node");
      this.db = await JSONFilePreset(this.dbPath, DEFAULT_DATA);
      if (!this.db.data.routes) {
        this.db.data.routes = [];
        await this.db.write();
        console.log("[DB] Migrated: Added missing routes array");
      }
      console.log("[DB] Initialized at:", this.dbPath);
    } catch (error) {
      console.error("[DB] Failed to init DB:", error);
      throw error;
    }
  }
  /**
   * 獲取所有專案列表
   * @returns {Promise<Project[]>}
   */
  async getProjects() {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    await this.db.read();
    return this.db.data.projects ?? [];
  }
  /**
   * 新增專案
   * @param project - 專案基礎資料
   */
  async addProject(project) {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newProject = {
      ...project,
      id: node_crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: PROJECT_STATUS.STOPPED
    };
    ProjectSchema.parse(newProject);
    await this.db.update(({ projects }) => projects.push(newProject));
    return newProject;
  }
  /**
   * 更新專案資料
   * @param project - 更新後的專案資料
   */
  async updateProject(project) {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let updatedProject = null;
    ProjectSchema.partial().parse(project);
    await this.db.update((data) => {
      const index = data.projects.findIndex((p) => p.id === project.id);
      if (index !== -1) {
        data.projects[index] = {
          ...data.projects[index],
          ...project,
          updatedAt: now
        };
        updatedProject = data.projects[index];
      }
    });
    if (!updatedProject) {
      throw new Error(`Project with id ${project.id} not found`);
    }
    return updatedProject;
  }
  /**
   * 刪除專案及其關聯的所有路由
   * @param id - 專案 ID
   * @returns {Promise<boolean>} 是否刪除成功
   */
  async deleteProject(id) {
    await this.init();
    if (!this.db || !id) return false;
    const initialLength = this.db.data.projects.length;
    await this.db.update((data) => {
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return;
      data.projects.splice(index, 1);
      data.routes = data.routes?.filter((r) => r.projectId !== id) ?? [];
    });
    return this.db.data.projects.length < initialLength;
  }
  /**
   * 根據專案 ID 獲取路由
   * @param projectId - 專案 ID
   */
  async getRoutesByProjectId(projectId) {
    await this.init();
    if (!this.db || !projectId) return [];
    await this.db.read();
    const routes = this.db.data.routes ?? [];
    return routes.filter((r) => r.projectId === projectId);
  }
  /**
   * 新增路由
   * @param route - 路由資料 (不含 ID)
   */
  async addRoute(route) {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    const newRoute = {
      ...route,
      id: node_crypto.randomUUID()
    };
    RouteSchema.parse(newRoute);
    if (!this.db.data.routes) {
      this.db.data.routes = [];
    }
    await this.db.update(({ routes }) => routes.push(newRoute));
    return newRoute;
  }
  /**
   * 刪除指定路由
   * @param id - 路由 ID
   * @returns {Promise<boolean>}
   */
  async deleteRoute(id) {
    await this.init();
    if (!this.db || !id) return false;
    const initialLength = this.db.data.routes?.length ?? 0;
    await this.db.update((data) => {
      if (!data.routes) return;
      const index = data.routes.findIndex((r) => r.id === id);
      if (index !== -1) {
        data.routes.splice(index, 1);
      }
    });
    const currentLength = this.db.data.routes?.length ?? 0;
    return currentLength < initialLength;
  }
  /**
   * 重新排序專案路由
   * @param projectId - 專案 ID
   * @param routes - 排序後且完整的路由列表 (for this project)
   */
  async reorderRoutes(projectId, routes) {
    await this.init();
    if (!this.db) return false;
    await this.db.update((data) => {
      if (!data.routes) return;
      const otherRoutes = data.routes.filter((r) => r.projectId !== projectId);
      const validNewRoutes = routes.filter((r) => r.projectId === projectId);
      data.routes = [...otherRoutes, ...validNewRoutes];
    });
    return true;
  }
  /**
   * 更新路由
   * @param route - 更新後的路由資料
   * @returns {Promise<Route | null>} 更新後的路由，若找不到則回傳 null
   */
  async updateRoute(route) {
    await this.init();
    if (!this.db) throw new Error("DB not initialized");
    let updatedRoute = null;
    RouteSchema.parse(route);
    await this.db.update((data) => {
      if (!data.routes) return;
      const index = data.routes.findIndex((r) => r.id === route.id);
      if (index !== -1) {
        data.routes[index] = { ...data.routes[index], ...route };
        updatedRoute = data.routes[index];
      }
    });
    return updatedRoute;
  }
}
const dbService = new DBService();
const toOpenApi = (project, routes) => {
  const paths = {};
  routes.forEach((route) => {
    if (!route.isActive) return;
    const pathParams = [];
    const openApiPath = route.path.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      pathParams.push(paramName);
      return `{${paramName}}`;
    });
    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }
    const operation = {
      summary: route.description || route.path,
      tags: route.tags,
      responses: {
        [route.response.statusCode.toString()]: {
          description: "Mock response",
          content: {
            "application/json": {
              example: parseBody(route.response.body)
            }
          }
        }
      }
    };
    const userParams = (route.parameters ?? []).map((p) => ({
      name: p.name,
      in: p.in,
      required: p.required,
      ...p.description ? { description: p.description } : {},
      schema: {
        type: p.type,
        ...p.default !== void 0 && p.default !== "" ? { default: p.default } : {}
      }
    }));
    const userPathParamNames = new Set(
      userParams.filter((p) => p.in === "path").map((p) => p.name)
    );
    const autoPathParams = pathParams.filter((name) => !userPathParamNames.has(name)).map((name) => ({
      name,
      in: "path",
      required: true,
      schema: { type: "string" }
    }));
    const allParams = [...autoPathParams, ...userParams];
    if (allParams.length > 0) {
      operation.parameters = allParams;
    }
    const BODY_METHODS = ["post", "put", "patch", "delete"];
    const method = route.method.toLowerCase();
    if (route.requestBody && BODY_METHODS.includes(method)) {
      operation.requestBody = {
        ...route.requestBody.description ? { description: route.requestBody.description } : {},
        required: route.requestBody.required,
        content: {
          "application/json": {
            schema: parseBody(route.requestBody.schema)
          }
        }
      };
    }
    paths[openApiPath][method] = operation;
  });
  const sortedTags = Array.from(
    new Set(routes.filter((r) => r.isActive).flatMap((r) => r.tags))
  ).sort();
  const doc = {
    openapi: "3.0.0",
    info: {
      title: project.name,
      description: project.description,
      version: "version" in project && project.version ? project.version : "1.0.0"
    },
    tags: sortedTags.map((name) => ({ name })),
    paths
  };
  if ("serverUrl" in project && project.serverUrl) {
    doc.servers = [{ url: project.serverUrl }];
  }
  return doc;
};
function parseBody(body) {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}
const MAX_PORT_ATTEMPTS = 100;
const DEFAULT_HOST = "127.0.0.1";
class ServerManager {
  servers = /* @__PURE__ */ new Map();
  _queues = /* @__PURE__ */ new Map();
  /**
   * Serialize operations per project to avoid race conditions
   */
  _enqueue(projectId, task) {
    const prev = this._queues.get(projectId) || Promise.resolve();
    const next = prev.then(task);
    const nextSignal = next.catch(() => {
    });
    this._queues.set(projectId, nextSignal);
    return next;
  }
  /**
   * 檢查 Port 是否可用
   * @param port - 欲檢查的 Port
   */
  checkPort(port) {
    return new Promise((resolve) => {
      const s = net.createServer();
      s.once("error", () => resolve(false));
      s.once("listening", () => {
        s.close(() => resolve(true));
      });
      s.listen(port, DEFAULT_HOST);
    });
  }
  /**
   * 尋找下一個可用 Port
   * @param startPort - 起始 Port
   */
  async findAvailablePort(startPort) {
    let port = startPort;
    const maxPort = 65535;
    let attempts = 0;
    while (attempts < MAX_PORT_ATTEMPTS) {
      const isAvailable = await this.checkPort(port);
      if (isAvailable) {
        return port;
      }
      port++;
      attempts++;
      if (port > maxPort) {
        throw new Error("No available ports found within range");
      }
    }
    throw new Error("Unable to find an available port after multiple attempts");
  }
  /**
   * 啟動 Mock 伺服器
   * @param projectId - 專案 ID
   * @param port - 預期 Port
   * @param routes - 路由表
   * @param projectInfo - 專案資訊 (用於產生 Swagger 文件)
   * @returns 實際運行的 Port
   */
  async start(projectId, port, routes, projectInfo = { name: "Mock API" }) {
    return this._enqueue(projectId, async () => {
      if (this.servers.has(projectId)) {
        await this._stopInternal(projectId);
      }
      await new Promise((r) => setTimeout(r, 100));
      const actualPort = await this.findAvailablePort(port);
      console.log(`[Server] Requested port ${port}, using available port ${actualPort}`);
      const server = Fastify({
        logger: true,
        forceCloseConnections: true
      });
      await server.register(fastifyCors, {
        origin: "*"
        // Allow all origins for dev/testing
      });
      const openApiDocument = toOpenApi(
        {
          ...projectInfo,
          serverUrl: `http://localhost:${actualPort}`
        },
        routes
      );
      await server.register(fastifySwagger, {
        mode: "static",
        specification: {
          document: openApiDocument
        }
      });
      await server.register(fastifySwaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
          docExpansion: "list",
          deepLinking: false
        }
      });
      console.log(`[Server] Project ${projectId} mounting ${routes.length} routes...`);
      routes.forEach((route) => {
        if (!route.isActive) return;
        try {
          server.route({
            method: route.method,
            url: route.path,
            handler: async (_request, reply) => {
              if (route.response.delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, route.response.delay));
              }
              reply.code(route.response.statusCode);
              try {
                const jsonBody = JSON.parse(route.response.body);
                return jsonBody;
              } catch {
                return route.response.body;
              }
            }
          });
          console.log(`[Server] Mounted ${route.method} ${route.path}`);
        } catch (err) {
          console.error(`[Server] Failed to mount route ${route.method} ${route.path}:`, err);
        }
      });
      try {
        const address = await server.listen({ port: actualPort, host: DEFAULT_HOST });
        console.log(
          `[Server] Project ${projectId} listening on ${address}, actual port: ${actualPort}`
        );
        this.servers.set(projectId, server);
        return actualPort;
      } catch (err) {
        server.log.error(err);
        throw err;
      }
    });
  }
  /**
   * 停止 Mock 伺服器
   * @param projectId - 專案 ID
   */
  async stop(projectId) {
    return this._enqueue(projectId, () => this._stopInternal(projectId));
  }
  /**
   * 內部停止邏輯 (不經過 Queue，供 Start 內部呼叫)
   */
  async _stopInternal(projectId) {
    const server = this.servers.get(projectId);
    if (!server) return false;
    try {
      const closePromise = server.close();
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Close timeout")), 2e3)
      );
      await Promise.race([closePromise, timeoutPromise]).catch((err) => {
        console.warn(`[Server] Close warning for ${projectId}:`, err);
      });
      this.servers.delete(projectId);
      console.log(`[Server] Project ${projectId} stopped`);
      return true;
    } catch (err) {
      console.error(`[Server] Failed to stop project ${projectId}:`, err);
      this.servers.delete(projectId);
      return false;
    }
  }
  /**
   * 檢查專案是否正在運行
   */
  isRunning(projectId) {
    return this.servers.has(projectId);
  }
}
const serverManager = new ServerManager();
const IPC_CHANNELS = {
  WINDOW: {
    MINIMIZE: "window:minimize",
    MAXIMIZE: "window:maximize",
    CLOSE: "window:close"
  },
  DB: {
    GET_PROJECTS: "db:getProjects",
    ADD_PROJECT: "db:addProject",
    DELETE_PROJECT: "db:deleteProject",
    UPDATE_PROJECT: "db:updateProject",
    GET_ROUTES: "db:getRoutesByProjectId",
    ADD_ROUTE: "db:addRoute",
    UPDATE_ROUTE: "db:updateRoute",
    DELETE_ROUTE: "db:deleteRoute",
    REORDER_ROUTES: "db:reorderRoutes"
  },
  SERVER: {
    START: "server:start",
    STOP: "server:stop"
  },
  PROJECT: {
    EXPORT: "project:export",
    EXPORT_HTML: "project:exportHtml",
    IMPORT: "project:import"
    // Placeholder for future
  }
};
const generateRedocHtml = (spec, title, redocScript) => {
  const specJson = JSON.stringify(spec);
  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title} | Mocky Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      :root {
        --header-height: 60px;
        --bg-color: #ffffff; /* Clean White Background for professionalism */
        --header-bg: #1f2937; /* Dark Gray Header */
        --text-color: #111827; /* Near Black */
        --border-color: #e5e7eb;
        --primary-brand: #3b82f6; /* Trustworthy Blue */
      }
      body {
        margin: 0;
        margin-top: var(--header-height);
        padding: 0;
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      /* Professional Solid Header */
      .mocky-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: var(--header-height);
        background-color: var(--header-bg);
        border-bottom: 1px solid #374151;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        z-index: 100;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .mocky-logo {
        font-weight: 700;
        font-size: 18px;
        color: #f3f4f6; /* Light Gray Text */
        letter-spacing: -0.25px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        -webkit-text-fill-color: initial;
      }

      .separator {
        width: 1px;
        height: 16px;
        background-color: #4b5563; /* Header Separator */
      }

      .doc-title {
        font-size: 14px;
        font-weight: 500;
        color: #d1d5db; /* Gray 300 */
      }

      .header-right {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    </style>
  </head>
  <body>
    <header class="mocky-header">
      <div class="header-left">
        <span class="mocky-logo">Mocky</span>
        <div class="separator"></div>
        <span class="doc-title">${title}</span>
      </div>
      <div class="header-right">
        Powered by Mocky
      </div>
    </header>

    <div id="redoc-container"></div>

    <script>
      ${redocScript}
    <\/script>
    <script>
      const spec = ${specJson};
      const options = {
        scrollYOffset: 60,
        hideDownloadButton: true,
        expandResponses: '200,201',
        theme: {
          colors: {
            primary: {
              main: '#3b82f6' // Standard Blue
            },
            success: {
              main: '#10b981' // Emerald
            },
            http: {
              get: '#0ea5e9', // Sky
              post: '#10b981', // Emerald
              put: '#f59e0b', // Amber
              delete: '#ef4444' // Red
            }
          },
          sidebar: {
            backgroundColor: '#f8fafc', // Slate 50 (Very light gray)
            width: '260px',
            textColor: '#334155', // Slate 700
            activeTextColor: '#3b82f6', // Primary Blue
            groupItems: {
              textTransform: 'uppercase',
              fontWeight: '600',
              textColor: '#64748b' // Slate 500
            }
          },
          rightPanel: {
            backgroundColor: '#1e293b', // Slate 800 (Dark panel for contrast)
            width: '40%',
            textColor: '#f1f5f9' // Slate 100
          },
          typography: {
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            headings: {
              fontFamily: '"Inter", sans-serif',
              fontWeight: '700',
              lineHeight: '1.3',
              color: '#111827' // Gray 900
            },
            code: {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px'
            }
          },
          logo: {
            maxHeight: '0px'
          }
        }
      };
      Redoc.init(spec, options, document.getElementById('redoc-container'));
    <\/script>
  </body>
</html>`;
};
const APP_USER_MODEL_ID = "com.electron.app";
const getWindowFromEvent = (sender) => {
  return electron.BrowserWindow.fromWebContents(sender);
};
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    // 隱藏原生標題列
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function registerIpcHandlers() {
  electron.ipcMain.on(IPC_CHANNELS.WINDOW.MINIMIZE, (event) => {
    const win = getWindowFromEvent(event.sender);
    win?.minimize();
  });
  electron.ipcMain.on(IPC_CHANNELS.WINDOW.MAXIMIZE, (event) => {
    const win = getWindowFromEvent(event.sender);
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  electron.ipcMain.on(IPC_CHANNELS.WINDOW.CLOSE, (event) => {
    const win = getWindowFromEvent(event.sender);
    win?.close();
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.GET_PROJECTS, async () => {
    try {
      return await dbService.getProjects();
    } catch (error) {
      console.error("[IPC] Failed to get projects:", error);
      return [];
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.ADD_PROJECT, async (_, project) => {
    try {
      if (!project) throw new Error("Missing project data");
      return await dbService.addProject(project);
    } catch (error) {
      console.error("[IPC] Failed to add project:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.UPDATE_PROJECT, async (_, project) => {
    try {
      if (!project || !project.id) throw new Error("Missing project data");
      return await dbService.updateProject(project);
    } catch (error) {
      console.error("[IPC] Failed to update project:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.DELETE_PROJECT, async (_, id) => {
    try {
      if (!id) return false;
      return await dbService.deleteProject(id);
    } catch (error) {
      console.error("[IPC] Failed to delete project:", error);
      return false;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.GET_ROUTES, async (_, projectId) => {
    try {
      if (!projectId) return [];
      return await dbService.getRoutesByProjectId(projectId);
    } catch (error) {
      console.error("[IPC] Failed to get routes:", error);
      return [];
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.ADD_ROUTE, async (_, route) => {
    try {
      if (!route || !route.projectId) throw new Error("Missing route data");
      return await dbService.addRoute(route);
    } catch (error) {
      console.error("[IPC] Failed to add route:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.UPDATE_ROUTE, async (_, route) => {
    try {
      if (!route || !route.id) throw new Error("Missing route data");
      return await dbService.updateRoute(route);
    } catch (error) {
      console.error("[IPC] Failed to update route:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.REORDER_ROUTES, async (_, projectId, routes) => {
    try {
      if (!projectId || !routes) return false;
      return await dbService.reorderRoutes(projectId, routes);
    } catch (error) {
      console.error("[IPC] Failed to reorder routes:", error);
      return false;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.DB.DELETE_ROUTE, async (_, id) => {
    try {
      if (!id) return false;
      return await dbService.deleteRoute(id);
    } catch (error) {
      console.error("[IPC] Failed to delete route:", error);
      return false;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.SERVER.START, async (_, payload) => {
    try {
      if (!payload || !payload.projectId) throw new Error("Missing server payload");
      return await serverManager.start(
        payload.projectId,
        payload.port || 8e3,
        payload.routes || [],
        payload.projectInfo || { name: "Unknown Project" }
      );
    } catch (error) {
      console.error("[IPC] Failed to start server:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start server";
      throw new Error(errorMessage);
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.SERVER.STOP, async (_, projectId) => {
    try {
      if (!projectId) return false;
      return await serverManager.stop(projectId);
    } catch (error) {
      console.error("[IPC] Failed to stop server:", error);
      return false;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.PROJECT.EXPORT, async (event, { content, filename }) => {
    try {
      const win = getWindowFromEvent(event.sender);
      if (!win) return false;
      const { canceled, filePath } = await electron.dialog.showSaveDialog(win, {
        title: "Export Project",
        defaultPath: filename || "project.json",
        filters: [{ name: "JSON Files", extensions: ["json"] }]
      });
      if (canceled || !filePath) return false;
      await promises.writeFile(filePath, content, "utf-8");
      return true;
    } catch (error) {
      console.error("[IPC] Failed to export project:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.PROJECT.IMPORT, async (event) => {
    try {
      const win = getWindowFromEvent(event.sender);
      if (!win) return null;
      const { canceled, filePaths } = await electron.dialog.showOpenDialog(win, {
        title: "Import OpenAPI/Swagger File",
        properties: ["openFile"],
        filters: [{ name: "JSON Files", extensions: ["json"] }]
      });
      if (canceled || filePaths.length === 0) return null;
      const content = await promises.readFile(filePaths[0], "utf-8");
      try {
        const json = JSON.parse(content);
        if (!json.openapi && !json.swagger) {
          throw new Error("Invalid OpenAPI/Swagger file format");
        }
      } catch {
        throw new Error("Invalid JSON file");
      }
      return content;
    } catch (error) {
      console.error("[IPC] Failed to import project:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(IPC_CHANNELS.PROJECT.EXPORT_HTML, async (event, { project, routes }) => {
    try {
      const win = getWindowFromEvent(event.sender);
      if (!win) return false;
      const spec = toOpenApi(project, routes);
      let redocScript = "";
      try {
        const scriptPath = utils.is.dev ? path.join(__dirname, "../../src/shared/redoc.standalone.js") : path.join(process.resourcesPath, "src/shared/redoc.standalone.js");
        redocScript = await promises.readFile(scriptPath, "utf-8");
      } catch (e) {
        console.warn("[Export HTML] Failed to load local Redoc script, falling back to CDN", e);
      }
      const html = generateRedocHtml(spec, project.name, redocScript);
      const { canceled, filePath } = await electron.dialog.showSaveDialog(win, {
        title: "Export Documentation",
        defaultPath: `${project.name}-docs.html`,
        filters: [{ name: "HTML Files", extensions: ["html"] }]
      });
      if (canceled || !filePath) return false;
      await promises.writeFile(filePath, html, "utf-8");
      return true;
    } catch (error) {
      console.error("[IPC] Failed to export HTML:", error);
      throw error;
    }
  });
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId(APP_USER_MODEL_ID);
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  registerIpcHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
