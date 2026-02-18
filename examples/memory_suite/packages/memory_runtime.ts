/* METADATA
{
  "name": "memory_runtime",
  "display_name": {
    "zh": "记忆运行时",
    "en": "Memory Runtime"
  },
  "description": {
    "zh": "memory_suite 运行时：SQL 记忆存储、检索、向量重建与设置管理。",
    "en": "memory_suite runtime: SQL memory store, retrieval, embedding rebuild, and settings."
  },
  "enabledByDefault": true,
  "tools": [
    {
      "name": "attachment_select_scope",
      "description": {
        "zh": "记忆附着入口。",
        "en": "Memory attachment entry."
      },
      "parameters": []
    },
    {
      "name": "chatbar_open_memory_settings",
      "description": {
        "zh": "从聊天设置栏打开记忆设置。",
        "en": "Open memory settings from chat setting bar."
      },
      "parameters": []
    },
    {
      "name": "chatbar_run_memory_summary",
      "description": {
        "zh": "从聊天设置栏触发记忆总结页面。",
        "en": "Open memory summary page from chat setting bar."
      },
      "parameters": []
    },
    {
      "name": "hooks_after_reply",
      "description": {
        "zh": "聊天 after_assistant_reply hook。",
        "en": "after_assistant_reply chat hook."
      },
      "parameters": [
        {
          "name": "event_payload",
          "description": {
            "zh": "宿主透传的事件负载 JSON 字符串。",
            "en": "JSON string of host-passed event payload."
          },
          "type": "string",
          "required": false
        }
      ]
    },
    {
      "name": "memory_bootstrap",
      "description": {
        "zh": "初始化记忆 runtime 并返回仪表盘数据。",
        "en": "Initialize memory runtime and return dashboard payload."
      },
      "parameters": [
        {
          "name": "query",
          "description": {
            "zh": "查询关键词，用于过滤记忆节点。",
            "en": "Search keywords used to filter memory nodes."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "folder_path",
          "description": {
            "zh": "目标文件夹路径，留空表示全库。",
            "en": "Target folder path; empty means all folders."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "limit",
          "description": {
            "zh": "返回结果数量上限。",
            "en": "Maximum number of returned records."
          },
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "name": "memory_get_dashboard",
      "description": {
        "zh": "获取记忆中心仪表盘（节点、边、文件夹、统计）。",
        "en": "Get memory center dashboard (nodes, links, folders, stats)."
      },
      "parameters": [
        {
          "name": "query",
          "description": {
            "zh": "查询关键词，用于过滤记忆节点。",
            "en": "Search keywords used to filter memory nodes."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "folder_path",
          "description": {
            "zh": "目标文件夹路径，留空表示全库。",
            "en": "Target folder path; empty means all folders."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "limit",
          "description": {
            "zh": "返回结果数量上限。",
            "en": "Maximum number of returned records."
          },
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "name": "memory_get_settings",
      "description": {
        "zh": "读取记忆搜索与云向量设置。",
        "en": "Read memory search and cloud embedding settings."
      },
      "parameters": []
    },
    {
      "name": "memory_save_settings",
      "description": {
        "zh": "保存记忆搜索与云向量设置。",
        "en": "Save memory search and cloud embedding settings."
      },
      "parameters": [
        {
          "name": "settings_json",
          "description": {
            "zh": "设置对象的 JSON 字符串。",
            "en": "JSON string of the settings payload."
          },
          "type": "string",
          "required": true
        }
      ]
    },
    {
      "name": "memory_get_dimension_stats",
      "description": {
        "zh": "获取记忆向量维数统计。",
        "en": "Get memory embedding dimension stats."
      },
      "parameters": []
    },
    {
      "name": "memory_start_rebuild_embedding_job",
      "description": {
        "zh": "启动向量重建任务。",
        "en": "Start embedding rebuild job."
      },
      "parameters": [
        {
          "name": "batch_size",
          "description": {
            "zh": "每次处理的批量大小。",
            "en": "Batch size per processing slice."
          },
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "name": "memory_get_rebuild_job_progress",
      "description": {
        "zh": "获取向量重建任务进度（查询时推进任务切片）。",
        "en": "Get rebuild job progress (advances a job slice on each query)."
      },
      "parameters": [
        {
          "name": "job_id",
          "description": {
            "zh": "重建任务 ID。",
            "en": "Rebuild job identifier."
          },
          "type": "string",
          "required": true
        },
        {
          "name": "batch_size",
          "description": {
            "zh": "每次处理的批量大小。",
            "en": "Batch size per processing slice."
          },
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "name": "memory_upsert_node",
      "description": {
        "zh": "创建或更新记忆节点。",
        "en": "Create or update a memory node."
      },
      "parameters": [
        {
          "name": "id",
          "description": {
            "zh": "记录唯一标识。",
            "en": "Unique record identifier."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "title",
          "description": {
            "zh": "节点标题。",
            "en": "Node title."
          },
          "type": "string",
          "required": true
        },
        {
          "name": "content",
          "description": {
            "zh": "节点正文内容。",
            "en": "Node content text."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "folder_path",
          "description": {
            "zh": "目标文件夹路径，留空表示全库。",
            "en": "Target folder path; empty means all folders."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "node_type",
          "description": {
            "zh": "节点类型（如 text/summary）。",
            "en": "Node type (for example text or summary)."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "content_type",
          "description": {
            "zh": "内容 MIME 类型。",
            "en": "Content MIME type."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "source",
          "description": {
            "zh": "数据来源标记。",
            "en": "Source marker for the record."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "importance",
          "description": {
            "zh": "重要性权重（0-1）。",
            "en": "Importance weight (0-1)."
          },
          "type": "number",
          "required": false
        },
        {
          "name": "credibility",
          "description": {
            "zh": "可信度权重（0-1）。",
            "en": "Credibility weight (0-1)."
          },
          "type": "number",
          "required": false
        },
        {
          "name": "is_document_node",
          "description": {
            "zh": "是否为文档节点。",
            "en": "Whether the node is a document node."
          },
          "type": "boolean",
          "required": false
        },
        {
          "name": "chunks_json",
          "description": {
            "zh": "文档分块数组 JSON。",
            "en": "JSON array of document chunks."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "tags_json",
          "description": {
            "zh": "标签数组 JSON。",
            "en": "JSON array of tags."
          },
          "type": "string",
          "required": false
        }
      ]
    },
    {
      "name": "memory_delete_node",
      "description": {
        "zh": "删除记忆节点。",
        "en": "Delete a memory node."
      },
      "parameters": [
        {
          "name": "id",
          "description": {
            "zh": "记录唯一标识。",
            "en": "Unique record identifier."
          },
          "type": "string",
          "required": true
        }
      ]
    },
    {
      "name": "memory_bulk_delete_nodes",
      "description": {
        "zh": "批量删除记忆节点。",
        "en": "Bulk-delete memory nodes."
      },
      "parameters": [
        {
          "name": "ids_json",
          "description": {
            "zh": "ID 列表 JSON 数组。",
            "en": "JSON array of IDs."
          },
          "type": "string",
          "required": true
        }
      ]
    },
    {
      "name": "memory_move_nodes_to_folder",
      "description": {
        "zh": "批量移动节点到目标文件夹。",
        "en": "Move nodes to target folder."
      },
      "parameters": [
        {
          "name": "ids_json",
          "description": {
            "zh": "ID 列表 JSON 数组。",
            "en": "JSON array of IDs."
          },
          "type": "string",
          "required": true
        },
        {
          "name": "target_folder_path",
          "description": {
            "zh": "目标文件夹路径。",
            "en": "Destination folder path."
          },
          "type": "string",
          "required": false
        }
      ]
    },
    {
      "name": "memory_list_folders",
      "description": {
        "zh": "列出文件夹。",
        "en": "List folders."
      },
      "parameters": []
    },
    {
      "name": "memory_create_folder",
      "description": {
        "zh": "创建文件夹。",
        "en": "Create folder."
      },
      "parameters": [
        {
          "name": "folder_path",
          "description": {
            "zh": "目标文件夹路径，留空表示全库。",
            "en": "Target folder path; empty means all folders."
          },
          "type": "string",
          "required": true
        }
      ]
    },
    {
      "name": "memory_rename_folder",
      "description": {
        "zh": "重命名文件夹。",
        "en": "Rename folder."
      },
      "parameters": [
        {
          "name": "old_path",
          "description": {
            "zh": "原文件夹路径。",
            "en": "Original folder path."
          },
          "type": "string",
          "required": true
        },
        {
          "name": "new_path",
          "description": {
            "zh": "新文件夹路径。",
            "en": "New folder path."
          },
          "type": "string",
          "required": true
        }
      ]
    },
    {
      "name": "memory_delete_folder",
      "description": {
        "zh": "删除文件夹及其节点。",
        "en": "Delete folder and contained nodes."
      },
      "parameters": [
        {
          "name": "folder_path",
          "description": {
            "zh": "目标文件夹路径，留空表示全库。",
            "en": "Target folder path; empty means all folders."
          },
          "type": "string",
          "required": true
        }
      ]
    },
    {
      "name": "memory_upsert_link",
      "description": {
        "zh": "创建或更新节点连接。",
        "en": "Create or update a node link."
      },
      "parameters": [
        {
          "name": "id",
          "description": {
            "zh": "记录唯一标识。",
            "en": "Unique record identifier."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "source_node_id",
          "description": {
            "zh": "源节点 ID。",
            "en": "Source node ID."
          },
          "type": "string",
          "required": true
        },
        {
          "name": "target_node_id",
          "description": {
            "zh": "目标节点 ID。",
            "en": "Target node ID."
          },
          "type": "string",
          "required": true
        },
        {
          "name": "link_type",
          "description": {
            "zh": "连接类型（如 related）。",
            "en": "Link type (for example related)."
          },
          "type": "string",
          "required": false
        },
        {
          "name": "weight",
          "description": {
            "zh": "连接权重。",
            "en": "Link weight."
          },
          "type": "number",
          "required": false
        },
        {
          "name": "description",
          "description": {
            "zh": "连接描述文本。",
            "en": "Link description text."
          },
          "type": "string",
          "required": false
        }
      ]
    },
    {
      "name": "memory_delete_link",
      "description": {
        "zh": "删除节点连接。",
        "en": "Delete a node link."
      },
      "parameters": [
        {
          "name": "id",
          "description": {
            "zh": "记录唯一标识。",
            "en": "Unique record identifier."
          },
          "type": "string",
          "required": true
        }
      ]
    }
  ]
}
*/

const NAMESPACE_SEARCH = "memory.search";
const NAMESPACE_CLOUD = "memory.embedding.cloud";
const NAMESPACE_UI = "memory.ui";
const SCHEMA_VERSION = "2";

const DEFAULT_SEARCH_SETTINGS = {
  semanticThreshold: 0.6,
  scoreMode: "balanced",
  keywordWeight: 10.0,
  vectorWeight: 0.0,
  edgeWeight: 0.4
};

const DEFAULT_CLOUD_CONFIG = {
  enabled: false,
  endpoint: "",
  apiKey: "",
  model: "",
  provider: "cloud"
};

const SCORE_MODE_MULTIPLIERS = {
  balanced: { keyword: 1.0, vector: 1.0, edge: 1.0 },
  keyword_first: { keyword: 1.3, vector: 0.8, edge: 0.9 },
  vector_first: { keyword: 0.8, vector: 1.3, edge: 1.1 }
};

const SCHEMA_SQL = [
  "CREATE TABLE IF NOT EXISTS memory_nodes (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, node_type TEXT NOT NULL DEFAULT 'text', title TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '', content_type TEXT NOT NULL DEFAULT 'text/plain', folder_path TEXT DEFAULT NULL, is_document_node INTEGER NOT NULL DEFAULT 0, is_placeholder INTEGER NOT NULL DEFAULT 0, importance REAL NOT NULL DEFAULT 0.5, credibility REAL NOT NULL DEFAULT 0.5, tags_json TEXT NOT NULL DEFAULT '[]', extra_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER DEFAULT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_memory_nodes_profile_updated ON memory_nodes(profile_id, updated_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_memory_nodes_profile_folder ON memory_nodes(profile_id, folder_path)",
  "CREATE TABLE IF NOT EXISTS memory_chunks (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, node_id TEXT NOT NULL, chunk_index INTEGER NOT NULL, content TEXT NOT NULL, token_count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_memory_chunks_profile_node ON memory_chunks(profile_id, node_id, chunk_index)",
  "CREATE TABLE IF NOT EXISTS memory_links (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, source_node_id TEXT NOT NULL, target_node_id TEXT NOT NULL, link_type TEXT NOT NULL DEFAULT 'related', weight REAL NOT NULL DEFAULT 1.0, description TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_memory_links_profile_source ON memory_links(profile_id, source_node_id)",
  "CREATE INDEX IF NOT EXISTS idx_memory_links_profile_target ON memory_links(profile_id, target_node_id)",
  "CREATE TABLE IF NOT EXISTS memory_embeddings (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, provider TEXT NOT NULL DEFAULT '', model TEXT NOT NULL DEFAULT '', dimension INTEGER NOT NULL DEFAULT 0, vector_json TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_embeddings_target_unique ON memory_embeddings(profile_id, target_type, target_id, provider, model)",
  "CREATE INDEX IF NOT EXISTS idx_memory_embeddings_profile_model ON memory_embeddings(profile_id, provider, model, target_type)",
  "CREATE TABLE IF NOT EXISTS memory_rebuild_jobs (job_id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, status TEXT NOT NULL, current_stage TEXT NOT NULL DEFAULT 'preparing', total_count INTEGER NOT NULL DEFAULT 0, processed_count INTEGER NOT NULL DEFAULT 0, failed_count INTEGER NOT NULL DEFAULT 0, cursor_index INTEGER NOT NULL DEFAULT 0, started_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, finished_at INTEGER DEFAULT NULL, config_json TEXT NOT NULL DEFAULT '{}', error_text TEXT NOT NULL DEFAULT '')",
  "CREATE INDEX IF NOT EXISTS idx_memory_rebuild_jobs_profile_status ON memory_rebuild_jobs(profile_id, status, updated_at DESC)",
  "CREATE TABLE IF NOT EXISTS memory_metadata (profile_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL, PRIMARY KEY(profile_id, key))"
];

const TABLE_REQUIRED_COLUMNS = {
  memory_nodes: {
    source: "TEXT NOT NULL DEFAULT ''",
    content_type: "TEXT NOT NULL DEFAULT 'text/plain'",
    folder_path: "TEXT DEFAULT NULL",
    is_document_node: "INTEGER NOT NULL DEFAULT 0",
    is_placeholder: "INTEGER NOT NULL DEFAULT 0",
    importance: "REAL NOT NULL DEFAULT 0.5",
    credibility: "REAL NOT NULL DEFAULT 0.5",
    tags_json: "TEXT NOT NULL DEFAULT '[]'",
    extra_json: "TEXT NOT NULL DEFAULT '{}'",
    deleted_at: "INTEGER DEFAULT NULL"
  },
  memory_chunks: {
    token_count: "INTEGER NOT NULL DEFAULT 0"
  },
  memory_rebuild_jobs: {
    current_stage: "TEXT NOT NULL DEFAULT 'preparing'",
    cursor_index: "INTEGER NOT NULL DEFAULT 0",
    config_json: "TEXT NOT NULL DEFAULT '{}'",
    error_text: "TEXT NOT NULL DEFAULT ''"
  },
  memory_metadata: {
    profile_id: "TEXT NOT NULL DEFAULT 'default'"
  }
};

let schemaInitialized = false;

type SqlParams = unknown[];
type SqlOperation = {
  type: string;
  sql: string;
  params?: SqlParams;
};
type JsonRow = Record<string, unknown>;
type ChunkInput = {
  id: string;
  chunkIndex: number;
  content: string;
};

function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function getNativeInterface() {
  const candidate = (globalThis as any)?.NativeInterface;
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  return candidate;
}

function parseJsonSafely(raw, fallback) {
  const text = String(raw || "").trim();
  if (!text) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text);
    return parsed == null ? fallback : parsed;
  } catch (_) {
    return fallback;
  }
}

function deepClone(value) {
  return parseJsonSafely(JSON.stringify(value == null ? null : value), null);
}

function nowMs() {
  return Date.now();
}

function createId(prefix) {
  const ts = nowMs().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}_${random}`;
}

function normalizeFolderPath(folderPath) {
  const raw = String(folderPath == null ? "" : folderPath).trim();
  if (!raw) {
    return "";
  }
  const normalized = raw
    .replace(/\\/g, "/")
    .split("/")
    .map(part => String(part || "").trim())
    .filter(Boolean)
    .join("/");
  return normalized;
}

function normalizeScoreMode(value) {
  const raw = String(value == null ? "" : value).trim().toLowerCase();
  if (raw === "keyword_first" || raw === "vector_first" || raw === "balanced") {
    return raw;
  }
  return "balanced";
}

function asText(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
}

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  const text = String(value == null ? "" : value).trim().toLowerCase();
  if (text === "true" || text === "1" || text === "yes" || text === "on") {
    return true;
  }
  if (text === "false" || text === "0" || text === "no" || text === "off") {
    return false;
  }
  return fallback;
}

function asNumber(value, fallback = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }
  return numberValue;
}

function asInt(value, fallback = 0) {
  const numberValue = asNumber(value, fallback);
  return Number.isFinite(numberValue) ? Math.trunc(numberValue) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseJsonValue(raw, fallback) {
  if (raw == null) {
    return fallback;
  }
  if (typeof raw === "object") {
    return raw;
  }
  const text = String(raw).trim();
  if (!text) {
    return fallback;
  }
  return parseJsonSafely(text, fallback);
}

function getActiveProfileId() {
  const nativeInterface = getNativeInterface();
  if (!nativeInterface || typeof nativeInterface.getActiveProfileId !== "function") {
    return "default";
  }
  const profileId = String(nativeInterface.getActiveProfileId() || "default").trim();
  return profileId || "default";
}

function datastoreGet(namespace, key, fallback) {
  const nativeInterface = getNativeInterface();
  if (!nativeInterface || typeof nativeInterface.datastoreGet !== "function") {
    return fallback;
  }

  const raw = nativeInterface.datastoreGet(namespace, key);
  const payload = parseJsonSafely(raw, { success: false });
  if (!payload || payload.success !== true) {
    return fallback;
  }
  if (payload.value === undefined) {
    return fallback;
  }
  return payload.value;
}

function datastoreSet(namespace, key, value) {
  const nativeInterface = getNativeInterface();
  if (!nativeInterface || typeof nativeInterface.datastoreSet !== "function") {
    return { success: false, error: "datastoreSet bridge unavailable" };
  }

  const raw = nativeInterface.datastoreSet(namespace, key, JSON.stringify(value));
  const payload = parseJsonSafely(raw, { success: false, error: "invalid datastoreSet response" });
  return payload;
}

function sqlExecute(sql: string, params: SqlParams = []) {
  const nativeInterface = getNativeInterface();
  if (!nativeInterface || typeof nativeInterface.datastoreSqlExecute !== "function") {
    return { success: false, error: "datastoreSqlExecute bridge unavailable" };
  }
  const raw = nativeInterface.datastoreSqlExecute(sql, JSON.stringify(params || []));
  return parseJsonSafely(raw, { success: false, error: "invalid datastoreSqlExecute response" });
}

function sqlQuery(sql: string, params: SqlParams = []) {
  const nativeInterface = getNativeInterface();
  if (!nativeInterface || typeof nativeInterface.datastoreSqlQuery !== "function") {
    return { success: false, error: "datastoreSqlQuery bridge unavailable" };
  }
  const raw = nativeInterface.datastoreSqlQuery(sql, JSON.stringify(params || []));
  return parseJsonSafely(raw, { success: false, error: "invalid datastoreSqlQuery response" });
}

function sqlTransaction(operations: SqlOperation[]) {
  const nativeInterface = getNativeInterface();
  if (!nativeInterface || typeof nativeInterface.datastoreSqlTransaction !== "function") {
    return { success: false, error: "datastoreSqlTransaction bridge unavailable" };
  }
  const raw = nativeInterface.datastoreSqlTransaction(JSON.stringify(Array.isArray(operations) ? operations : []));
  return parseJsonSafely(raw, { success: false, error: "invalid datastoreSqlTransaction response" });
}

function queryRows(sql: string, params: SqlParams = []): JsonRow[] {
  const result = sqlQuery(sql, params);
  if (!result || result.success !== true) {
    throw new Error(String((result && result.error) || "sql query failed"));
  }
  const payload = result.result || result;
  const columns = Array.isArray(payload.columns) ? payload.columns : [];
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  return rows.map(row => {
    const item: JsonRow = {};
    for (let index = 0; index < columns.length; index += 1) {
      item[String(columns[index])] = Array.isArray(row) ? row[index] : undefined;
    }
    return item;
  });
}

function queryOne(sql: string, params: SqlParams = []): JsonRow | null {
  const rows = queryRows(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function queryCount(sql: string, params: SqlParams = []): number {
  const row = queryOne(sql, params);
  if (!row) {
    return 0;
  }
  const firstKey = Object.keys(row)[0];
  const value = firstKey ? row[firstKey] : 0;
  return asInt(value, 0);
}

function execOrThrow(sql: string, params: SqlParams = []) {
  const result = sqlExecute(sql, params);
  if (!result || result.success !== true) {
    throw new Error(String((result && result.error) || "sql execute failed"));
  }
  return result.result || result;
}

function ensureColumn(tableName, columnName, definition) {
  const rows = queryRows(`PRAGMA table_info(${tableName})`);
  const exists = rows.some(row => String(row.name || "").trim().toLowerCase() === columnName.toLowerCase());
  if (!exists) {
    execOrThrow(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function ensureSchemaReady() {
  if (schemaInitialized) {
    return { success: true, initialized: true };
  }

  try {
    for (const sql of SCHEMA_SQL) {
      execOrThrow(sql, []);
    }

    Object.keys(TABLE_REQUIRED_COLUMNS).forEach(tableName => {
      const columns = TABLE_REQUIRED_COLUMNS[tableName] || {};
      Object.keys(columns).forEach(columnName => {
        ensureColumn(tableName, columnName, columns[columnName]);
      });
    });

    const profileId = getActiveProfileId();
    const now = nowMs();
    execOrThrow(
      "INSERT OR REPLACE INTO memory_metadata(profile_id, key, value, updated_at) VALUES (?, ?, ?, ?)",
      [profileId, "schema_version", SCHEMA_VERSION, now]
    );

    schemaInitialized = true;
    return { success: true, initialized: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error || "schema init failed")
    };
  }
}

function normalizeSearchSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    semanticThreshold: clamp(asNumber(source.semanticThreshold, DEFAULT_SEARCH_SETTINGS.semanticThreshold), 0, 1),
    scoreMode: normalizeScoreMode(source.scoreMode),
    keywordWeight: Math.max(0, asNumber(source.keywordWeight, DEFAULT_SEARCH_SETTINGS.keywordWeight)),
    vectorWeight: Math.max(0, asNumber(source.vectorWeight, DEFAULT_SEARCH_SETTINGS.vectorWeight)),
    edgeWeight: Math.max(0, asNumber(source.edgeWeight, DEFAULT_SEARCH_SETTINGS.edgeWeight))
  };
}

function normalizeCloudConfig(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const endpoint = asText(source.endpoint, "").trim();
  const apiKey = asText(source.apiKey, "").trim();
  const model = asText(source.model, "").trim();
  const providerRaw = asText(source.provider, "").trim();
  const provider = providerRaw || deriveProviderFromEndpoint(endpoint) || "cloud";
  const enabled = asBoolean(source.enabled, false);
  return {
    enabled,
    endpoint,
    apiKey,
    model,
    provider,
    ready: !!(enabled && endpoint && apiKey && model)
  };
}

function deriveProviderFromEndpoint(endpoint) {
  const value = asText(endpoint, "").trim();
  if (!value) {
    return "";
  }
  try {
    const url = new URL(value);
    const host = String(url.host || "").trim().toLowerCase();
    return host || "cloud";
  } catch (_) {
    return "cloud";
  }
}

function loadSearchSettings() {
  const loaded = {
    semanticThreshold: datastoreGet(NAMESPACE_SEARCH, "semantic_threshold", DEFAULT_SEARCH_SETTINGS.semanticThreshold),
    scoreMode: datastoreGet(NAMESPACE_SEARCH, "score_mode", DEFAULT_SEARCH_SETTINGS.scoreMode),
    keywordWeight: datastoreGet(NAMESPACE_SEARCH, "keyword_weight", DEFAULT_SEARCH_SETTINGS.keywordWeight),
    vectorWeight: datastoreGet(NAMESPACE_SEARCH, "vector_weight", DEFAULT_SEARCH_SETTINGS.vectorWeight),
    edgeWeight: datastoreGet(NAMESPACE_SEARCH, "edge_weight", DEFAULT_SEARCH_SETTINGS.edgeWeight)
  };

  return normalizeSearchSettings(loaded);
}

function saveSearchSettings(settings) {
  const normalized = normalizeSearchSettings(settings);
  datastoreSet(NAMESPACE_SEARCH, "semantic_threshold", normalized.semanticThreshold);
  datastoreSet(NAMESPACE_SEARCH, "score_mode", normalized.scoreMode);
  datastoreSet(NAMESPACE_SEARCH, "keyword_weight", normalized.keywordWeight);
  datastoreSet(NAMESPACE_SEARCH, "vector_weight", normalized.vectorWeight);
  datastoreSet(NAMESPACE_SEARCH, "edge_weight", normalized.edgeWeight);
  return normalized;
}

function loadCloudConfig() {
  const loaded = {
    enabled: datastoreGet(NAMESPACE_CLOUD, "enabled", DEFAULT_CLOUD_CONFIG.enabled),
    endpoint: datastoreGet(NAMESPACE_CLOUD, "endpoint", DEFAULT_CLOUD_CONFIG.endpoint),
    apiKey: datastoreGet(NAMESPACE_CLOUD, "api_key", DEFAULT_CLOUD_CONFIG.apiKey),
    model: datastoreGet(NAMESPACE_CLOUD, "model", DEFAULT_CLOUD_CONFIG.model),
    provider: datastoreGet(NAMESPACE_CLOUD, "provider", DEFAULT_CLOUD_CONFIG.provider)
  };
  return normalizeCloudConfig(loaded);
}

function saveCloudConfig(config) {
  const normalized = normalizeCloudConfig(config);
  datastoreSet(NAMESPACE_CLOUD, "enabled", normalized.enabled);
  datastoreSet(NAMESPACE_CLOUD, "endpoint", normalized.endpoint);
  datastoreSet(NAMESPACE_CLOUD, "api_key", normalized.apiKey);
  datastoreSet(NAMESPACE_CLOUD, "model", normalized.model);
  datastoreSet(NAMESPACE_CLOUD, "provider", normalized.provider);
  return normalized;
}

function loadSettingsPayload() {
  return {
    search: loadSearchSettings(),
    cloud: loadCloudConfig()
  };
}

function normalizeNodeRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: asText(row.id, ""),
    profileId: asText(row.profile_id, ""),
    nodeType: asText(row.node_type, "text"),
    title: asText(row.title, ""),
    content: asText(row.content, ""),
    source: asText(row.source, ""),
    contentType: asText(row.content_type, "text/plain"),
    folderPath: normalizeFolderPath(row.folder_path),
    isDocumentNode: asBoolean(row.is_document_node, false),
    isPlaceholder: asBoolean(row.is_placeholder, false),
    importance: clamp(asNumber(row.importance, 0.5), 0, 1),
    credibility: clamp(asNumber(row.credibility, 0.5), 0, 1),
    tags: parseJsonValue(row.tags_json, []),
    extra: parseJsonValue(row.extra_json, {}),
    createdAt: asInt(row.created_at, 0),
    updatedAt: asInt(row.updated_at, 0),
    deletedAt: row.deleted_at == null ? null : asInt(row.deleted_at, 0)
  };
}

function normalizeLinkRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: asText(row.id, ""),
    profileId: asText(row.profile_id, ""),
    sourceNodeId: asText(row.source_node_id, ""),
    targetNodeId: asText(row.target_node_id, ""),
    linkType: asText(row.link_type, "related"),
    weight: asNumber(row.weight, 1),
    description: asText(row.description, ""),
    createdAt: asInt(row.created_at, 0),
    updatedAt: asInt(row.updated_at, 0)
  };
}

function listFolders(profileId) {
  const rows = queryRows(
    "SELECT DISTINCT folder_path FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND folder_path IS NOT NULL AND TRIM(folder_path) <> '' ORDER BY folder_path ASC",
    [profileId]
  );
  return rows
    .map(row => normalizeFolderPath(row.folder_path))
    .filter(Boolean);
}

function splitKeywords(query) {
  const text = asText(query, "").trim();
  if (!text) {
    return [];
  }
  const parts = text.includes("|") ? text.split("|") : text.split(/\s+/g);
  return parts
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function escapeRegex(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(text, keyword) {
  const source = asText(text, "").toLowerCase();
  const token = asText(keyword, "").toLowerCase();
  if (!source || !token) {
    return 0;
  }
  const matches = source.match(new RegExp(escapeRegex(token), "g"));
  return matches ? matches.length : 0;
}

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const lv = asNumber(left[index], 0);
    const rv = asNumber(right[index], 0);
    dot += lv * rv;
    leftNorm += lv * lv;
    rightNorm += rv * rv;
  }

  if (leftNorm <= 0 || rightNorm <= 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function completeEmbeddingsEndpoint(endpoint) {
  const trimmed = asText(endpoint, "").trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.endsWith("#")) {
    return trimmed.slice(0, -1);
  }

  const noSlash = trimmed.replace(/\/+$/g, "");
  try {
    const url = new URL(trimmed);
    const path = String(url.pathname || "").replace(/\/+$/g, "");
    if (!path) {
      return `${noSlash}/v1/embeddings`;
    }
    if (path.endsWith("/v1")) {
      return `${noSlash}/embeddings`;
    }
    return trimmed;
  } catch (_) {
    return trimmed;
  }
}

async function requestEmbedding(cloudConfig, text) {
  if (!cloudConfig || !cloudConfig.ready || !asText(text, "").trim()) {
    return null;
  }

  const endpoint = completeEmbeddingsEndpoint(cloudConfig.endpoint);
  if (!endpoint) {
    return null;
  }

  const payload = {
    model: cloudConfig.model,
    input: text
  };

  let responseContent = "";
  let statusCode = 0;

  if (typeof Tools !== "undefined" && Tools && Tools.Net && typeof Tools.Net.http === "function") {
    try {
      const response = await Tools.Net.http({
        url: endpoint,
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudConfig.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: payload,
        validateStatus: false,
        connect_timeout: 15,
        read_timeout: 35
      });
      statusCode = asInt(response && response.statusCode, 0);
      responseContent = asText(response && response.content, "");
    } catch (_) {
      return null;
    }
  } else if (typeof fetch === "function") {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudConfig.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      statusCode = asInt(response.status, 0);
      responseContent = await response.text();
    } catch (_) {
      return null;
    }
  } else {
    return null;
  }

  if (statusCode >= 400 || !responseContent.trim()) {
    return null;
  }

  const parsed = parseJsonSafely(responseContent, null);
  if (!parsed || !Array.isArray(parsed.data) || parsed.data.length === 0) {
    return null;
  }

  const first = parsed.data[0];
  if (!first || !Array.isArray(first.embedding) || first.embedding.length === 0) {
    return null;
  }

  return first.embedding.map(item => asNumber(item, 0));
}

function normalizeChunksInput(rawChunks): ChunkInput[] {
  const parsed = parseJsonValue(rawChunks, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item, index) => {
      if (item == null) {
        return null;
      }
      if (typeof item === "string") {
        const text = item.trim();
        if (!text) {
          return null;
        }
        return {
          id: "",
          chunkIndex: index,
          content: text
        };
      }

      const raw = item as Record<string, unknown>;
      const content = asText(raw.content, "").trim();
      if (!content) {
        return null;
      }

      return {
        id: asText(raw.id, "").trim(),
        chunkIndex: asInt(raw.chunkIndex, index),
        content
      };
    })
    .filter(isNonNull)
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
    .map((item, index) => ({
      id: item.id,
      chunkIndex: index,
      content: item.content
    }));
}

function ensureProfileSchemaMetadata(profileId) {
  const now = nowMs();
  execOrThrow(
    "INSERT OR REPLACE INTO memory_metadata(profile_id, key, value, updated_at) VALUES (?, ?, ?, ?)",
    [profileId, "schema_version", SCHEMA_VERSION, now]
  );
}

function loadNodeById(profileId, id) {
  const row = queryOne(
    "SELECT * FROM memory_nodes WHERE profile_id = ? AND id = ? AND deleted_at IS NULL LIMIT 1",
    [profileId, id]
  );
  return normalizeNodeRow(row);
}

function listChunksForNode(profileId, nodeId) {
  const rows = queryRows(
    "SELECT id, node_id, chunk_index, content, token_count, created_at, updated_at FROM memory_chunks WHERE profile_id = ? AND node_id = ? ORDER BY chunk_index ASC",
    [profileId, nodeId]
  );
  return rows.map(row => ({
    id: asText(row.id, ""),
    nodeId: asText(row.node_id, ""),
    chunkIndex: asInt(row.chunk_index, 0),
    content: asText(row.content, ""),
    tokenCount: asInt(row.token_count, 0),
    createdAt: asInt(row.created_at, 0),
    updatedAt: asInt(row.updated_at, 0)
  }));
}

function buildFolderFilterClause(folderPath) {
  const normalized = normalizeFolderPath(folderPath);
  if (!normalized) {
    return {
      clause: "",
      params: []
    };
  }
  return {
    clause: " AND (folder_path = ? OR folder_path LIKE ?)",
    params: [normalized, `${normalized}/%`]
  };
}

function collectEdgeMap(profileId, nodeIds) {
  const edgeMap: Record<string, { sum: number; count: number }> = {};
  if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
    return edgeMap;
  }

  const placeholders = nodeIds.map(() => "?").join(", ");
  const rows = queryRows(
    `SELECT source_node_id, target_node_id, weight FROM memory_links WHERE profile_id = ? AND (source_node_id IN (${placeholders}) OR target_node_id IN (${placeholders}))`,
    [profileId].concat(nodeIds).concat(nodeIds)
  );

  for (const row of rows) {
    const source = asText(row.source_node_id, "");
    const target = asText(row.target_node_id, "");
    const weight = Math.abs(asNumber(row.weight, 0));

    if (!edgeMap[source]) {
      edgeMap[source] = { sum: 0, count: 0 };
    }
    if (!edgeMap[target]) {
      edgeMap[target] = { sum: 0, count: 0 };
    }

    edgeMap[source].sum += weight;
    edgeMap[source].count += 1;
    edgeMap[target].sum += weight;
    edgeMap[target].count += 1;
  }

  return edgeMap;
}

async function searchNodes(profileId, queryText, folderPath, limit, settings, cloudConfig) {
  const searchSettings = normalizeSearchSettings(settings);
  const folderFilter = buildFolderFilterClause(folderPath);
  const resolvedLimit = clamp(asInt(limit, 120), 1, 500);

  const rows = queryRows(
    `SELECT * FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND is_placeholder = 0${folderFilter.clause} ORDER BY updated_at DESC LIMIT 500`,
    [profileId].concat(folderFilter.params)
  );

  const nodes = rows.map(normalizeNodeRow).filter(isNonNull);
  if (nodes.length === 0) {
    return [];
  }

  const keywords = splitKeywords(queryText);
  const mode = SCORE_MODE_MULTIPLIERS[searchSettings.scoreMode] || SCORE_MODE_MULTIPLIERS.balanced;

  const cloudReady = !!(cloudConfig && cloudConfig.ready);
  const shouldUseVector = keywords.length > 0 && searchSettings.vectorWeight > 0 && cloudReady;

  let queryEmbedding: number[] | null = null;
  if (shouldUseVector) {
    queryEmbedding = await requestEmbedding(cloudConfig, keywords.join(" "));
  }

  const embeddingMap: Record<string, number[]> = {};
  if (queryEmbedding && queryEmbedding.length > 0) {
    const nodeIds = nodes.map(node => node.id).filter(Boolean);
    if (nodeIds.length > 0) {
      const placeholders = nodeIds.map(() => "?").join(", ");
      const embeddings = queryRows(
        `SELECT target_id, vector_json FROM memory_embeddings WHERE profile_id = ? AND target_type = 'node' AND provider = ? AND model = ? AND target_id IN (${placeholders})`,
        [profileId, cloudConfig.provider, cloudConfig.model].concat(nodeIds)
      );

      for (const item of embeddings) {
        const targetId = asText(item.target_id, "");
        const vector = parseJsonValue(item.vector_json, []);
        if (targetId && Array.isArray(vector) && vector.length > 0) {
          embeddingMap[targetId] = vector.map(value => asNumber(value, 0));
        }
      }
    }
  }

  const edgeMap = collectEdgeMap(profileId, nodes.map(node => node.id));

  const scored = nodes.map((node, index) => {
    const title = asText(node.title, "");
    const content = asText(node.content, "");

    let keywordScore = 0;
    if (keywords.length > 0) {
      let total = 0;
      for (const keyword of keywords) {
        const titleHits = countOccurrences(title, keyword);
        const contentHits = countOccurrences(content, keyword);
        const reverseHits = asText(queryText, "").toLowerCase().includes(title.toLowerCase()) ? 1 : 0;
        total += (titleHits * 1.5) + (contentHits * 0.35) + reverseHits;
      }
      keywordScore = clamp(total / (keywords.length * 3), 0, 1);
    }

    let vectorScore = 0;
    const storedVector = embeddingMap[node.id];
    if (queryEmbedding && Array.isArray(storedVector) && storedVector.length === queryEmbedding.length) {
      vectorScore = cosineSimilarity(queryEmbedding, storedVector);
      if (vectorScore < searchSettings.semanticThreshold) {
        vectorScore = 0;
      }
    }

    const edgeStat = edgeMap[node.id] || { sum: 0, count: 0 };
    const edgeScore = edgeStat.count <= 0 ? 0 : clamp((edgeStat.sum / edgeStat.count) / 2, 0, 1);

    const recencyScore = clamp(1 - (index / Math.max(nodes.length, 1)), 0, 1);

    const finalScore =
      (keywordScore * searchSettings.keywordWeight * mode.keyword) +
      (vectorScore * searchSettings.vectorWeight * mode.vector) +
      (edgeScore * searchSettings.edgeWeight * mode.edge) +
      (keywords.length === 0 ? recencyScore * 0.2 : 0);

    return {
      node,
      keywordScore,
      vectorScore,
      edgeScore,
      recencyScore,
      finalScore
    };
  });

  const filtered = scored
    .filter(item => {
      if (keywords.length === 0) {
        return true;
      }
      return item.finalScore > 0;
    })
    .sort((left, right) => right.finalScore - left.finalScore)
    .slice(0, resolvedLimit)
    .map(item => ({
      ...item.node,
      score: {
        final: item.finalScore,
        keyword: item.keywordScore,
        vector: item.vectorScore,
        edge: item.edgeScore,
        recency: item.recencyScore
      }
    }));

  return filtered;
}

function listLinksForNodes(profileId, nodeIds) {
  if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
    return [];
  }
  const placeholders = nodeIds.map(() => "?").join(", ");
  const rows = queryRows(
    `SELECT * FROM memory_links WHERE profile_id = ? AND (source_node_id IN (${placeholders}) OR target_node_id IN (${placeholders})) ORDER BY updated_at DESC LIMIT 500`,
    [profileId].concat(nodeIds).concat(nodeIds)
  );
  return rows.map(normalizeLinkRow).filter(isNonNull);
}

function nodeToSummary(node) {
  return {
    id: node.id,
    title: node.title,
    content: node.content,
    folderPath: node.folderPath,
    nodeType: node.nodeType,
    source: node.source,
    contentType: node.contentType,
    isDocumentNode: node.isDocumentNode,
    importance: node.importance,
    credibility: node.credibility,
    tags: Array.isArray(node.tags) ? node.tags : [],
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    score: node.score || null
  };
}

function getLatestRebuildJob(profileId) {
  const row = queryOne(
    "SELECT * FROM memory_rebuild_jobs WHERE profile_id = ? ORDER BY updated_at DESC LIMIT 1",
    [profileId]
  );
  return row ? mapRebuildJob(row) : null;
}

function mapRebuildJob(row) {
  if (!row) {
    return null;
  }
  const total = asInt(row.total_count, 0);
  const processed = asInt(row.processed_count, 0);
  const failed = asInt(row.failed_count, 0);
  const fraction = total <= 0 ? 0 : clamp(processed / total, 0, 1);
  return {
    jobId: asText(row.job_id, ""),
    status: asText(row.status, "idle"),
    currentStage: asText(row.current_stage, ""),
    total,
    processed,
    failed,
    cursorIndex: asInt(row.cursor_index, 0),
    startedAt: asInt(row.started_at, 0),
    updatedAt: asInt(row.updated_at, 0),
    finishedAt: row.finished_at == null ? null : asInt(row.finished_at, 0),
    errorText: asText(row.error_text, ""),
    fraction,
    config: parseJsonValue(row.config_json, {})
  };
}

function buildDimensionStats(profileId) {
  const memoryTotal = queryCount(
    "SELECT COUNT(1) AS c FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND is_placeholder = 0",
    [profileId]
  );
  const chunkTotal = queryCount(
    "SELECT COUNT(1) AS c FROM memory_chunks WHERE profile_id = ?",
    [profileId]
  );

  const memoryEmbedded = queryCount(
    "SELECT COUNT(DISTINCT target_id) AS c FROM memory_embeddings WHERE profile_id = ? AND target_type = 'node'",
    [profileId]
  );
  const chunkEmbedded = queryCount(
    "SELECT COUNT(DISTINCT target_id) AS c FROM memory_embeddings WHERE profile_id = ? AND target_type = 'chunk'",
    [profileId]
  );

  const memoryDimensions = queryRows(
    "SELECT dimension, COUNT(1) AS count FROM memory_embeddings WHERE profile_id = ? AND target_type = 'node' GROUP BY dimension ORDER BY count DESC, dimension ASC",
    [profileId]
  ).map(item => ({
    dimension: asInt(item.dimension, 0),
    count: asInt(item.count, 0)
  }));

  const chunkDimensions = queryRows(
    "SELECT dimension, COUNT(1) AS count FROM memory_embeddings WHERE profile_id = ? AND target_type = 'chunk' GROUP BY dimension ORDER BY count DESC, dimension ASC",
    [profileId]
  ).map(item => ({
    dimension: asInt(item.dimension, 0),
    count: asInt(item.count, 0)
  }));

  const grouped = queryRows(
    "SELECT provider, model, target_type, dimension, COUNT(1) AS count FROM memory_embeddings WHERE profile_id = ? GROUP BY provider, model, target_type, dimension ORDER BY count DESC",
    [profileId]
  ).map(item => ({
    provider: asText(item.provider, ""),
    model: asText(item.model, ""),
    targetType: asText(item.target_type, ""),
    dimension: asInt(item.dimension, 0),
    count: asInt(item.count, 0)
  }));

  return {
    memoryTotal,
    memoryMissing: Math.max(0, memoryTotal - memoryEmbedded),
    memoryDimensions,
    chunkTotal,
    chunkMissing: Math.max(0, chunkTotal - chunkEmbedded),
    chunkDimensions,
    grouped
  };
}

function buildDashboard(profileId, queryText, folderPath, limit, settings, cloudConfig, dimensionStats, rebuildJob) {
  return searchNodes(profileId, queryText, folderPath, limit, settings, cloudConfig).then(nodes => {
    const nodeSummaries = nodes.map(nodeToSummary);
    const nodeIds = nodeSummaries.map(node => node.id);
    const links = listLinksForNodes(profileId, nodeIds);
    const folders = listFolders(profileId);

    return {
      profileId,
      query: asText(queryText, ""),
      folderPath: normalizeFolderPath(folderPath),
      nodes: nodeSummaries,
      links,
      folders,
      settings,
      cloud: cloudConfig,
      dimensionStats,
      rebuildJob,
      stats: {
        nodeCount: queryCount(
          "SELECT COUNT(1) AS c FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND is_placeholder = 0",
          [profileId]
        ),
        linkCount: queryCount("SELECT COUNT(1) AS c FROM memory_links WHERE profile_id = ?", [profileId]),
        chunkCount: queryCount("SELECT COUNT(1) AS c FROM memory_chunks WHERE profile_id = ?", [profileId])
      }
    };
  });
}

function upsertEmbedding(profileId, targetType, targetId, vector, cloudConfig) {
  if (!Array.isArray(vector) || vector.length === 0) {
    return;
  }
  const now = nowMs();
  const provider = asText(cloudConfig.provider, "cloud");
  const model = asText(cloudConfig.model, "");
  const embeddingId = `${profileId}_${targetType}_${targetId}_${provider}_${model}`;
  execOrThrow(
    "INSERT OR REPLACE INTO memory_embeddings(id, profile_id, target_type, target_id, provider, model, dimension, vector_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [embeddingId, profileId, targetType, targetId, provider, model, vector.length, JSON.stringify(vector), now, now]
  );
}

async function rebuildEmbeddingForNode(profileId, node, cloudConfig) {
  const text = node.isDocumentNode ? asText(node.title, "") : asText(node.content, "");
  const vector = await requestEmbedding(cloudConfig, text);
  if (!Array.isArray(vector) || vector.length === 0) {
    return false;
  }
  upsertEmbedding(profileId, "node", node.id, vector, cloudConfig);
  return true;
}

async function rebuildEmbeddingForChunk(profileId, chunk, cloudConfig) {
  const vector = await requestEmbedding(cloudConfig, asText(chunk.content, ""));
  if (!Array.isArray(vector) || vector.length === 0) {
    return false;
  }
  upsertEmbedding(profileId, "chunk", chunk.id, vector, cloudConfig);
  return true;
}

function parseJobConfig(configJson) {
  const raw = parseJsonValue(configJson, {});
  return {
    provider: asText(raw.provider, "cloud"),
    model: asText(raw.model, ""),
    endpoint: asText(raw.endpoint, ""),
    apiKey: asText(raw.apiKey, ""),
    batchSize: clamp(asInt(raw.batchSize, 20), 1, 50)
  };
}

function queryRebuildJob(profileId, jobId) {
  const row = queryOne(
    "SELECT * FROM memory_rebuild_jobs WHERE profile_id = ? AND job_id = ? LIMIT 1",
    [profileId, jobId]
  );
  return row ? mapRebuildJob(row) : null;
}

function queryRunningRebuildJob(profileId) {
  const row = queryOne(
    "SELECT * FROM memory_rebuild_jobs WHERE profile_id = ? AND status = 'running' ORDER BY updated_at DESC LIMIT 1",
    [profileId]
  );
  return row ? mapRebuildJob(row) : null;
}

function loadNodesBatch(profileId, offset, limit) {
  return queryRows(
    "SELECT * FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND is_placeholder = 0 ORDER BY id ASC LIMIT ? OFFSET ?",
    [profileId, limit, offset]
  ).map(normalizeNodeRow).filter(isNonNull);
}

function loadChunksBatch(profileId, offset, limit) {
  return queryRows(
    "SELECT id, node_id, chunk_index, content, token_count, created_at, updated_at FROM memory_chunks WHERE profile_id = ? ORDER BY id ASC LIMIT ? OFFSET ?",
    [profileId, limit, offset]
  ).map(row => ({
    id: asText(row.id, ""),
    nodeId: asText(row.node_id, ""),
    chunkIndex: asInt(row.chunk_index, 0),
    content: asText(row.content, ""),
    tokenCount: asInt(row.token_count, 0),
    createdAt: asInt(row.created_at, 0),
    updatedAt: asInt(row.updated_at, 0)
  }));
}

async function runRebuildJobSlice(profileId, jobId, requestedBatchSize) {
  const current = queryRebuildJob(profileId, jobId);
  if (!current) {
    throw new Error(`Rebuild job not found: ${jobId}`);
  }
  if (current.status !== "running") {
    return current;
  }

  const config = parseJobConfig(current.config);
  const batchSize = clamp(asInt(requestedBatchSize, config.batchSize), 1, 100);
  const cloudConfig = normalizeCloudConfig({
    enabled: true,
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    model: config.model,
    provider: config.provider
  });

  if (!cloudConfig.ready) {
    const now = nowMs();
    execOrThrow(
      "UPDATE memory_rebuild_jobs SET status = 'failed', error_text = ?, updated_at = ?, finished_at = ? WHERE profile_id = ? AND job_id = ?",
      ["cloud embedding config invalid", now, now, profileId, jobId]
    );
    return queryRebuildJob(profileId, jobId);
  }

  const nodeTotal = queryCount(
    "SELECT COUNT(1) AS c FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND is_placeholder = 0",
    [profileId]
  );
  const chunkTotal = queryCount("SELECT COUNT(1) AS c FROM memory_chunks WHERE profile_id = ?", [profileId]);
  const total = nodeTotal + chunkTotal;

  let cursor = current.cursorIndex;
  let processed = current.processed;
  let failed = current.failed;
  let stage = "preparing";
  let remaining = batchSize;

  if (cursor < nodeTotal && remaining > 0) {
    const take = Math.min(remaining, nodeTotal - cursor);
    const batch = loadNodesBatch(profileId, cursor, take);
    for (const node of batch) {
      const ok = await rebuildEmbeddingForNode(profileId, node, cloudConfig);
      processed += 1;
      cursor += 1;
      if (!ok) {
        failed += 1;
      }
      stage = "memory";
    }
    remaining -= batch.length;
  }

  if (remaining > 0 && cursor >= nodeTotal && cursor < total) {
    const chunkOffset = cursor - nodeTotal;
    const take = Math.min(remaining, total - cursor);
    const batch = loadChunksBatch(profileId, chunkOffset, take);
    for (const chunk of batch) {
      const ok = await rebuildEmbeddingForChunk(profileId, chunk, cloudConfig);
      processed += 1;
      cursor += 1;
      if (!ok) {
        failed += 1;
      }
      stage = "chunk";
    }
  }

  const finished = cursor >= total;
  const now = nowMs();
  const status = finished ? "done" : "running";
  const finalStage = finished ? "done" : stage;

  execOrThrow(
    "UPDATE memory_rebuild_jobs SET status = ?, current_stage = ?, total_count = ?, processed_count = ?, failed_count = ?, cursor_index = ?, updated_at = ?, finished_at = ? WHERE profile_id = ? AND job_id = ?",
    [status, finalStage, total, processed, failed, cursor, now, finished ? now : null, profileId, jobId]
  );

  return queryRebuildJob(profileId, jobId);
}

function deleteNodesByIds(profileId, ids) {
  const uniqueIds = Array.from(new Set((Array.isArray(ids) ? ids : []).map(item => asText(item, "").trim()).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return 0;
  }

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const chunkRows = queryRows(
    `SELECT id FROM memory_chunks WHERE profile_id = ? AND node_id IN (${placeholders})`,
    [profileId].concat(uniqueIds)
  );
  const chunkIds = chunkRows.map(row => asText(row.id, "")).filter(Boolean);

  const ops: SqlOperation[] = [];
  ops.push({
    type: "execute",
    sql: `DELETE FROM memory_links WHERE profile_id = ? AND (source_node_id IN (${placeholders}) OR target_node_id IN (${placeholders}))`,
    params: [profileId].concat(uniqueIds).concat(uniqueIds)
  });
  ops.push({
    type: "execute",
    sql: `DELETE FROM memory_chunks WHERE profile_id = ? AND node_id IN (${placeholders})`,
    params: [profileId].concat(uniqueIds)
  });
  ops.push({
    type: "execute",
    sql: `DELETE FROM memory_embeddings WHERE profile_id = ? AND target_type = 'node' AND target_id IN (${placeholders})`,
    params: [profileId].concat(uniqueIds)
  });

  if (chunkIds.length > 0) {
    const chunkPlaceholders = chunkIds.map(() => "?").join(", ");
    ops.push({
      type: "execute",
      sql: `DELETE FROM memory_embeddings WHERE profile_id = ? AND target_type = 'chunk' AND target_id IN (${chunkPlaceholders})`,
      params: [profileId].concat(chunkIds)
    });
  }

  ops.push({
    type: "execute",
    sql: `DELETE FROM memory_nodes WHERE profile_id = ? AND id IN (${placeholders})`,
    params: [profileId].concat(uniqueIds)
  });

  const result = sqlTransaction(ops);
  if (!result || result.success !== true) {
    throw new Error(String((result && result.error) || "delete nodes transaction failed"));
  }

  return uniqueIds.length;
}

async function memory_bootstrap(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  ensureProfileSchemaMetadata(profileId);

  const settings = loadSearchSettings();
  const cloud = loadCloudConfig();
  const dimensionStats = buildDimensionStats(profileId);
  const rebuildJob = getLatestRebuildJob(profileId);

  const query = asText(params && params.query, "");
  const folderPath = asText(params && params.folder_path, "");
  const limit = asInt(params && params.limit, 120);
  const dashboard = await buildDashboard(profileId, query, folderPath, limit, settings, cloud, dimensionStats, rebuildJob);

  return {
    success: true,
    profileId,
    dashboard
  };
}

async function memory_get_dashboard(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const settings = loadSearchSettings();
  const cloud = loadCloudConfig();
  const dimensionStats = buildDimensionStats(profileId);
  const rebuildJob = getLatestRebuildJob(profileId);

  const query = asText(params && params.query, "");
  const folderPath = asText(params && params.folder_path, "");
  const limit = asInt(params && params.limit, 120);

  const dashboard = await buildDashboard(profileId, query, folderPath, limit, settings, cloud, dimensionStats, rebuildJob);
  return {
    success: true,
    profileId,
    dashboard
  };
}

async function memory_get_settings() {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  return {
    success: true,
    profileId,
    settings: loadSettingsPayload()
  };
}

async function memory_save_settings(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const rawSettings = parseJsonValue(params && params.settings_json, {});
  const nextSearch = saveSearchSettings(rawSettings.search || rawSettings);
  const nextCloud = saveCloudConfig(rawSettings.cloud || rawSettings.cloudConfig || rawSettings.embedding || {});

  return {
    success: true,
    settings: {
      search: nextSearch,
      cloud: nextCloud
    }
  };
}

async function memory_get_dimension_stats() {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const usage = buildDimensionStats(profileId);
  return {
    success: true,
    profileId,
    usage
  };
}

async function memory_start_rebuild_embedding_job(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const cloud = loadCloudConfig();
  if (!cloud.ready) {
    return {
      success: false,
      error: "Cloud embedding configuration is incomplete"
    };
  }

  const running = queryRunningRebuildJob(profileId);
  if (running) {
    return {
      success: true,
      profileId,
      job: running,
      reused: true
    };
  }

  const batchSize = clamp(asInt(params && params.batch_size, 20), 1, 100);
  const nodeTotal = queryCount(
    "SELECT COUNT(1) AS c FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND is_placeholder = 0",
    [profileId]
  );
  const chunkTotal = queryCount("SELECT COUNT(1) AS c FROM memory_chunks WHERE profile_id = ?", [profileId]);
  const totalCount = nodeTotal + chunkTotal;

  const jobId = createId("rebuild");
  const now = nowMs();
  const config = {
    provider: cloud.provider,
    model: cloud.model,
    endpoint: cloud.endpoint,
    apiKey: cloud.apiKey,
    batchSize
  };

  execOrThrow(
    "INSERT INTO memory_rebuild_jobs(job_id, profile_id, status, current_stage, total_count, processed_count, failed_count, cursor_index, started_at, updated_at, finished_at, config_json, error_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [jobId, profileId, "running", "preparing", totalCount, 0, 0, 0, now, now, null, JSON.stringify(config), ""]
  );

  const advanced = await runRebuildJobSlice(profileId, jobId, batchSize);

  return {
    success: true,
    profileId,
    job: advanced,
    reused: false
  };
}

async function memory_get_rebuild_job_progress(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const jobId = asText(params && params.job_id, "").trim();
  if (!jobId) {
    return {
      success: false,
      error: "job_id is required"
    };
  }

  const batchSize = clamp(asInt(params && params.batch_size, 20), 1, 100);
  const existing = queryRebuildJob(profileId, jobId);
  if (!existing) {
    return {
      success: false,
      error: `Rebuild job not found: ${jobId}`
    };
  }

  const job = existing.status === "running"
    ? await runRebuildJobSlice(profileId, jobId, batchSize)
    : existing;

  return {
    success: true,
    profileId,
    job
  };
}

async function memory_upsert_node(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const id = asText(params && params.id, "").trim() || createId("node");
  const now = nowMs();

  const title = asText(params && params.title, "").trim();
  if (!title) {
    return {
      success: false,
      error: "title is required"
    };
  }

  const content = asText(params && params.content, "");
  const nodeType = asText(params && params.node_type, "text").trim() || "text";
  const source = asText(params && params.source, "user_input").trim() || "user_input";
  const contentType = asText(params && params.content_type, "text/plain").trim() || "text/plain";
  const folderPath = normalizeFolderPath(params && params.folder_path);
  const importance = clamp(asNumber(params && params.importance, 0.5), 0, 1);
  const credibility = clamp(asNumber(params && params.credibility, 0.5), 0, 1);
  const isDocumentNode = asBoolean(params && params.is_document_node, false);
  const tags = parseJsonValue(params && params.tags_json, []);

  const existing = loadNodeById(profileId, id);
  const createdAt = existing ? existing.createdAt : now;

  execOrThrow(
    "INSERT OR REPLACE INTO memory_nodes(id, profile_id, node_type, title, content, source, content_type, folder_path, is_document_node, is_placeholder, importance, credibility, tags_json, extra_json, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)",
    [
      id,
      profileId,
      nodeType,
      title,
      content,
      source,
      contentType,
      folderPath || null,
      isDocumentNode ? 1 : 0,
      0,
      importance,
      credibility,
      JSON.stringify(Array.isArray(tags) ? tags : []),
      JSON.stringify({}),
      createdAt,
      now
    ]
  );

  const chunks = normalizeChunksInput(params && params.chunks_json);
  if (chunks.length > 0) {
    execOrThrow("DELETE FROM memory_chunks WHERE profile_id = ? AND node_id = ?", [profileId, id]);
    for (const chunk of chunks) {
      const chunkId = chunk.id || createId("chunk");
      execOrThrow(
        "INSERT INTO memory_chunks(id, profile_id, node_id, chunk_index, content, token_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [chunkId, profileId, id, chunk.chunkIndex, chunk.content, Math.max(0, asInt(chunk.content.length / 4, 0)), now, now]
      );
    }
  }

  const cloud = loadCloudConfig();
  if (cloud.ready) {
    const node = loadNodeById(profileId, id);
    const okNodeEmbedding = await rebuildEmbeddingForNode(profileId, node, cloud);
    if (!okNodeEmbedding) {
      // skip hard-fail to keep CRUD available
    }

    if (chunks.length > 0) {
      const savedChunks = listChunksForNode(profileId, id);
      for (const chunk of savedChunks) {
        await rebuildEmbeddingForChunk(profileId, chunk, cloud);
      }
    }
  }

  return {
    success: true,
    profileId,
    node: nodeToSummary(loadNodeById(profileId, id)),
    chunks: listChunksForNode(profileId, id)
  };
}

async function memory_delete_node(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const id = asText(params && params.id, "").trim();
  if (!id) {
    return {
      success: false,
      error: "id is required"
    };
  }

  const deleted = deleteNodesByIds(profileId, [id]);
  return {
    success: true,
    profileId,
    deleted
  };
}

async function memory_bulk_delete_nodes(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const ids = parseJsonValue(params && params.ids_json, []);
  const deleted = deleteNodesByIds(profileId, Array.isArray(ids) ? ids : []);

  return {
    success: true,
    profileId,
    deleted
  };
}

async function memory_move_nodes_to_folder(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const ids = parseJsonValue(params && params.ids_json, []);
  const targetFolder = normalizeFolderPath(params && params.target_folder_path);
  const uniqueIds = Array.from(new Set((Array.isArray(ids) ? ids : []).map(item => asText(item, "").trim()).filter(Boolean)));

  if (uniqueIds.length === 0) {
    return {
      success: true,
      profileId,
      moved: 0
    };
  }

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const updateResult = sqlExecute(
    `UPDATE memory_nodes SET folder_path = ?, updated_at = ? WHERE profile_id = ? AND id IN (${placeholders})`,
    [targetFolder || null, nowMs(), profileId].concat(uniqueIds)
  );

  if (!updateResult || updateResult.success !== true) {
    return {
      success: false,
      error: String((updateResult && updateResult.error) || "move nodes failed")
    };
  }

  return {
    success: true,
    profileId,
    moved: uniqueIds.length,
    targetFolderPath: targetFolder
  };
}

async function memory_list_folders() {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }
  const profileId = getActiveProfileId();
  return {
    success: true,
    profileId,
    folders: listFolders(profileId)
  };
}

async function memory_create_folder(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const folderPath = normalizeFolderPath(params && params.folder_path);
  if (!folderPath) {
    return {
      success: false,
      error: "folder_path is required"
    };
  }

  const exists = queryCount(
    "SELECT COUNT(1) AS c FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND folder_path = ?",
    [profileId, folderPath]
  );

  if (exists <= 0) {
    const now = nowMs();
    const placeholderId = createId("folder");
    execOrThrow(
      "INSERT INTO memory_nodes(id, profile_id, node_type, title, content, source, content_type, folder_path, is_document_node, is_placeholder, importance, credibility, tags_json, extra_json, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)",
      [
        placeholderId,
        profileId,
        "folder_placeholder",
        ".folder_placeholder",
        ".folder_placeholder",
        "system",
        "text/plain",
        folderPath,
        0,
        1,
        0,
        0,
        "[]",
        "{}",
        now,
        now
      ]
    );
  }

  return {
    success: true,
    profileId,
    folderPath,
    folders: listFolders(profileId)
  };
}

async function memory_rename_folder(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const oldPath = normalizeFolderPath(params && params.old_path);
  const newPath = normalizeFolderPath(params && params.new_path);

  if (!oldPath || !newPath) {
    return {
      success: false,
      error: "old_path and new_path are required"
    };
  }

  const rows = queryRows(
    "SELECT id, folder_path FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND (folder_path = ? OR folder_path LIKE ?)",
    [profileId, oldPath, `${oldPath}/%`]
  );

  const now = nowMs();
  for (const row of rows) {
    const id = asText(row.id, "").trim();
    const folder = normalizeFolderPath(row.folder_path);
    if (!id || !folder) {
      continue;
    }

    let replaced = "";
    if (folder === oldPath) {
      replaced = newPath;
    } else {
      replaced = `${newPath}/${folder.slice(oldPath.length + 1)}`;
    }

    execOrThrow(
      "UPDATE memory_nodes SET folder_path = ?, updated_at = ? WHERE profile_id = ? AND id = ?",
      [replaced, now, profileId, id]
    );
  }

  return {
    success: true,
    profileId,
    renamedCount: rows.length,
    folders: listFolders(profileId)
  };
}

async function memory_delete_folder(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const folderPath = normalizeFolderPath(params && params.folder_path);
  if (!folderPath) {
    return {
      success: false,
      error: "folder_path is required"
    };
  }

  const rows = queryRows(
    "SELECT id FROM memory_nodes WHERE profile_id = ? AND deleted_at IS NULL AND (folder_path = ? OR folder_path LIKE ?)",
    [profileId, folderPath, `${folderPath}/%`]
  );

  const ids = rows.map(row => asText(row.id, "")).filter(Boolean);
  const deleted = deleteNodesByIds(profileId, ids);

  return {
    success: true,
    profileId,
    deleted,
    folders: listFolders(profileId)
  };
}

async function memory_upsert_link(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const sourceNodeId = asText(params && params.source_node_id, "").trim();
  const targetNodeId = asText(params && params.target_node_id, "").trim();
  if (!sourceNodeId || !targetNodeId) {
    return {
      success: false,
      error: "source_node_id and target_node_id are required"
    };
  }

  const sourceNode = loadNodeById(profileId, sourceNodeId);
  const targetNode = loadNodeById(profileId, targetNodeId);
  if (!sourceNode || !targetNode) {
    return {
      success: false,
      error: "source or target node not found"
    };
  }

  const id = asText(params && params.id, "").trim() || createId("link");
  const now = nowMs();
  const existing = queryOne(
    "SELECT created_at FROM memory_links WHERE profile_id = ? AND id = ? LIMIT 1",
    [profileId, id]
  );
  const createdAt = existing ? asInt(existing.created_at, now) : now;

  execOrThrow(
    "INSERT OR REPLACE INTO memory_links(id, profile_id, source_node_id, target_node_id, link_type, weight, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      profileId,
      sourceNodeId,
      targetNodeId,
      asText(params && params.link_type, "related").trim() || "related",
      Math.max(0, asNumber(params && params.weight, 1.0)),
      asText(params && params.description, ""),
      createdAt,
      now
    ]
  );

  return {
    success: true,
    profileId,
    link: normalizeLinkRow(queryOne("SELECT * FROM memory_links WHERE profile_id = ? AND id = ? LIMIT 1", [profileId, id]))
  };
}

async function memory_delete_link(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const id = asText(params && params.id, "").trim();
  if (!id) {
    return {
      success: false,
      error: "id is required"
    };
  }

  const result = sqlExecute("DELETE FROM memory_links WHERE profile_id = ? AND id = ?", [profileId, id]);
  if (!result || result.success !== true) {
    return {
      success: false,
      error: String((result && result.error) || "delete link failed")
    };
  }

  return {
    success: true,
    profileId,
    deleted: 1
  };
}

async function attachment_select_scope(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  return {
    success: true,
    profileId,
    scope: {
      query: asText(params && params.user_query, ""),
      folders: listFolders(profileId)
    },
    message: "memory scope selected"
  };
}

async function chatbar_open_memory_settings() {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return JSON.stringify({ success: false, error: schema.error || "schema init failed" });
  }
  return JSON.stringify({ routeId: "memory_settings" });
}

async function chatbar_run_memory_summary() {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return JSON.stringify({ success: false, error: schema.error || "schema init failed" });
  }
  return JSON.stringify({ routeId: "memory_summary" });
}

function buildSummaryTextFromPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidates = [
    payload.summary,
    payload.assistant_reply,
    payload.assistantReply,
    payload.reply,
    payload.content,
    payload.text
  ];

  for (const candidate of candidates) {
    const text = asText(candidate, "").trim();
    if (text) {
      return text;
    }
  }

  if (Array.isArray(payload.messages)) {
    const joined = payload.messages
      .map(item => {
        if (!item || typeof item !== "object") {
          return "";
        }
        const role = asText(item.role, "").trim();
        const content = asText(item.content, "").trim();
        if (!content) {
          return "";
        }
        return role ? `[${role}] ${content}` : content;
      })
      .filter(Boolean)
      .join("\n");

    return joined.trim();
  }

  return "";
}

async function hooks_after_reply(params) {
  const schema = ensureSchemaReady();
  if (schema.success !== true) {
    return schema;
  }

  const profileId = getActiveProfileId();
  const payload = parseJsonValue(params && params.event_payload, params && params.event_payload || {});
  const summaryText = buildSummaryTextFromPayload(payload).trim();
  if (!summaryText) {
    return {
      success: true,
      profileId,
      skipped: true,
      reason: "empty summary payload"
    };
  }

  const now = nowMs();
  const nodeId = createId("summary");
  const title = `会话总结 ${new Date(now).toISOString().replace("T", " ").slice(0, 16)}`;
  execOrThrow(
    "INSERT INTO memory_nodes(id, profile_id, node_type, title, content, source, content_type, folder_path, is_document_node, is_placeholder, importance, credibility, tags_json, extra_json, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)",
    [
      nodeId,
      profileId,
      "summary",
      title,
      summaryText,
      "chat_summary",
      "text/plain",
      "自动总结",
      0,
      0,
      0.6,
      0.7,
      "[]",
      JSON.stringify({ fromHook: true }),
      now,
      now
    ]
  );

  const cloud = loadCloudConfig();
  if (cloud.ready) {
    const node = loadNodeById(profileId, nodeId);
    await rebuildEmbeddingForNode(profileId, node, cloud);
  }

  return {
    success: true,
    profileId,
    createdNodeId: nodeId,
    title
  };
}

const memoryRuntime = {
  attachment_select_scope,
  chatbar_open_memory_settings,
  chatbar_run_memory_summary,
  hooks_after_reply,
  memory_bootstrap,
  memory_get_dashboard,
  memory_get_settings,
  memory_save_settings,
  memory_get_dimension_stats,
  memory_start_rebuild_embedding_job,
  memory_get_rebuild_job_progress,
  memory_upsert_node,
  memory_delete_node,
  memory_bulk_delete_nodes,
  memory_move_nodes_to_folder,
  memory_list_folders,
  memory_create_folder,
  memory_rename_folder,
  memory_delete_folder,
  memory_upsert_link,
  memory_delete_link
};

exports.attachment_select_scope = memoryRuntime.attachment_select_scope;
exports.chatbar_open_memory_settings = memoryRuntime.chatbar_open_memory_settings;
exports.chatbar_run_memory_summary = memoryRuntime.chatbar_run_memory_summary;
exports.hooks_after_reply = memoryRuntime.hooks_after_reply;
exports.memory_bootstrap = memoryRuntime.memory_bootstrap;
exports.memory_get_dashboard = memoryRuntime.memory_get_dashboard;
exports.memory_get_settings = memoryRuntime.memory_get_settings;
exports.memory_save_settings = memoryRuntime.memory_save_settings;
exports.memory_get_dimension_stats = memoryRuntime.memory_get_dimension_stats;
exports.memory_start_rebuild_embedding_job = memoryRuntime.memory_start_rebuild_embedding_job;
exports.memory_get_rebuild_job_progress = memoryRuntime.memory_get_rebuild_job_progress;
exports.memory_upsert_node = memoryRuntime.memory_upsert_node;
exports.memory_delete_node = memoryRuntime.memory_delete_node;
exports.memory_bulk_delete_nodes = memoryRuntime.memory_bulk_delete_nodes;
exports.memory_move_nodes_to_folder = memoryRuntime.memory_move_nodes_to_folder;
exports.memory_list_folders = memoryRuntime.memory_list_folders;
exports.memory_create_folder = memoryRuntime.memory_create_folder;
exports.memory_rename_folder = memoryRuntime.memory_rename_folder;
exports.memory_delete_folder = memoryRuntime.memory_delete_folder;
exports.memory_upsert_link = memoryRuntime.memory_upsert_link;
exports.memory_delete_link = memoryRuntime.memory_delete_link;
