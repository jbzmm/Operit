## 执行任务清单（必须逐项打勾）
> 要求：每项完成后必须将 `[ ]` 改为 `[x]`，未打勾视为未完成；不得跳项。

> 本轮新增强制要求（写入开头计划）：
> 1) `ui/*.ts` 允许并要求按功能拆分为多文件 `import` 结构；
> 2) 侧边栏进入的“记忆管理”页面必须 1:1 复刻当前 KT 版本，缺失控件必须补齐。

- [x] T01：完成 ToolPkg `extensions` 解析（`routes` / `attachments` / `chat_setting_bars` / `chat_hooks`）
- [x] T02：完成四类通用注册中心接入（Route / Attachment / ChatSettingBar / ChatHook）
- [x] T03：打通动态路由（侧边栏 + Router + `ctx.navigate`）
- [x] T04：打通附件注册与触发（移除 `memory_context.xml` 特判）
- [x] T05：打通 ChatSettingBar 注册与触发（移除记忆专属按钮硬编码）
- [x] T06：打通 `ctx.datastore` 全套桥接（`get/set/batchSet/observe/sql*`）
- [x] T07：落地 `memory_suite` ToolPkg 骨架（单包，UI 内部模块化）
- [x] T08：在 TS 内完成记忆 SQL Schema/迁移/CRUD/检索/链接
- [x] T09：在 TS 内完成向量检索、维数统计、重建任务与进度
- [x] T10：完成记忆设置弹窗 ToolPkg 化（云向量接入、权重阈值、重建进度）
- [x] T10A：完成 UI 脚本模块化与侧边栏记忆管理页 1:1 复刻（含缺失控件补齐）
- [x] T11：完成记忆附着/记忆总结 ToolPkg 化（含 ProblemLibrary 链路迁移）
- [x] T12：下线旧记忆工具、旧 JS Memory 中间层、旧 Kotlin 记忆入口
- [x] T13：完成 HNSW 彻底清理（代码、依赖、许可展示、备份规则）
- [x] T14：完成类型声明与文档更新（`examples/types/*` + `TOOLPKG_FORMAT_GUIDE.md`）
- [x] T15：完成最终清理验收（全局 grep 清零项全部通过）

当前状态（2026-02-18）：
1. T10A 已完成：`memory_center` 已按 `index + screen + service` 模块化拆分，并对齐 KT `MemoryScreen` 主交互结构（搜索栏 + 左侧记忆仓库 + 图谱主画布 + 右侧动作列 + 多弹层）；图谱拖拽/连线点击、记忆详情、边详情编辑、文档分块编辑、`read_file_full` 文件导入、检索设置与重建进度均在 ToolPkg 侧闭环。
2. T11 已完成：`memory_attachment`、`memory_summary` 已迁入 ToolPkg，可操作；Kotlin `ProblemLibrary` 及 `<memory>` 协议链路已下线，主链路统一走 `chat_hooks`。
3. T12/T13 已完成：旧记忆工具、旧 JS Memory 中间层、旧 Kotlin 记忆入口与 HNSW 代码/依赖/许可/备份特判均已清理。
4. T14 已完成：`TOOLPKG_FORMAT_GUIDE.md`、`examples/types/compose-dsl.d.ts`、`examples/types/index.d.ts` 已同步；`examples/types/memory.d.ts` 与 `Tools.Memory` 相关文档残留已删除。
5. T15 已完成：静态 grep 清零项通过；设置页残留 `MemoryManagementCard` 与 `MemoryOperation` 已删除。

# 记忆能力 ToolPkg 化改造计划（已决策执行版）

## 0. 已确认决策
1. 发布状态：未发布，按替换方案执行；不做前向兼容层与回退分支。
2. `ctx.datastore.sql*` 权限边界：采用 `B`，不做 `memory_*` 表白名单限制。
3. `MemoryDocumentsProvider`：下线（含 Manifest 注册移除）。
4. 记忆备份/导入导出：采用 `C`，迁入 ToolPkg，删除 Kotlin 入口。
5. 旧记忆工具：采用 `A`，`query_memory/get_memory_by_title/create/update/delete/link_memories` 全下线。
6. 旧 JS 中间层：`JsTools.Memory` 全移除，不再保留 memory JS wrapper。
7. `ProblemLibrary` 链路：采用 `A`，迁到 TS/ToolPkg。
8. 消息协议：采用 `B`，从 `<memory>/memory_context.xml` 切到注册式通用附件协议。
9. 悬浮窗：本期不纳入范围（主聊天先完成）。
10. 多 profile 存储：按“与原来一致”执行（每 profile 隔离）。
11. 旧记忆搜索/云向量偏好迁移：采用 `B`，不迁移旧值，直接新默认。
12. 向量/HNSW 清理力度：采用 `A`（彻底清理）。
13. 无 HNSW 后向量检索：采用 `A`（TS 侧全量向量计算 + SQL 预筛选，不引入本地 ANN）。

---

## 1. 目标与边界

目标：把 `记忆`、`记忆附着`、`记忆总结` 从 Kotlin 业务实现迁移为 ToolPkg（TS）实现，Native 侧仅保留通用宿主与通用接口。

必须达成：
1. 侧边栏大路由支持 ToolPkg 注册（通用接口，不限记忆）。
2. 附件入口支持 ToolPkg 注册（通用接口，不限记忆）。
3. ChatSettingBar 支持 ToolPkg 注册（通用接口，不限记忆）。
4. 聊天生命周期 Hook 支持 ToolPkg 注册（用于总结、自动入库等通用场景）。
5. 记忆数据 SQL 与配置存储由 TS 通过通用 `ctx.datastore` 接管。
6. 记忆业务逻辑（CRUD/检索/附着/总结/重建）由 TS/toolpkg 接管。

非目标：
1. 本轮不做悬浮窗路径改造。
2. 本轮不保留旧记忆能力回退代码。
3. 本轮不新增本地向量模型或本地 ANN 索引。

执行约束：
1. 不新增 memory 专属 Native API（禁止 `ctx.memoryStore.*`）。
2. 不新增 Native `jobs` 特化 API（禁止 `ctx.jobs.*` 承载记忆实现）。
3. 默认不执行编译/构建/测试命令（除非你明确要求）。

---

## 2. 现状补充扫描（本次复查新增）

### 2.1 ToolPkg/Bridge 基础
1. `app/src/main/java/com/ai/assistance/operit/core/tools/packTool/ToolPkgParser.kt`
2. `app/src/main/java/com/ai/assistance/operit/core/tools/packTool/PackageManager.kt`
3. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsComposeDslBridge.kt`
4. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsEngine.kt`
5. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsNativeInterfaceDelegates.kt`

### 2.2 路由与侧边栏硬编码（当前无法插件化）
1. `app/src/main/java/com/ai/assistance/operit/ui/common/NavItem.kt`
2. `app/src/main/java/com/ai/assistance/operit/ui/main/screens/OperitScreens.kt`
3. `app/src/main/java/com/ai/assistance/operit/ui/main/OperitApp.kt`
4. `app/src/main/java/com/ai/assistance/operit/ui/main/components/DrawerContent.kt`
5. `app/src/main/java/com/ai/assistance/operit/ui/main/components/AppContent.kt`

### 2.3 附件与消息协议硬编码（当前记忆专用）
1. `app/src/main/java/com/ai/assistance/operit/services/core/AttachmentDelegate.kt`（生成 `memory_context.xml`）
2. `app/src/main/java/com/ai/assistance/operit/services/core/MessageCoordinationDelegate.kt`（按 `memory_context.xml` 特判）
3. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/AttachmentSelector.kt`（记忆附件硬编码入口）
4. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/MemoryFolderSelectionDialog.kt`（直接读 `MemoryRepository`）
5. `app/src/main/java/com/ai/assistance/operit/util/ChatMarkupRegex.kt`（`memoryTag`）
6. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/style/cursor/UserMessageComposable.kt`（清理 `<memory>`）
7. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/style/bubble/BubbleUserMessageComposable.kt`（清理 `<memory>`）
8. `app/src/main/java/com/ai/assistance/operit/core/chat/AIMessageManager.kt`（总结前清理 `<memory>`）

### 2.4 记忆业务硬耦合（需迁/删）
1. `app/src/main/java/com/ai/assistance/operit/data/repository/MemoryRepository.kt`
2. `app/src/main/java/com/ai/assistance/operit/core/tools/defaultTool/standard/MemoryQueryToolExecutor.kt`
3. `app/src/main/java/com/ai/assistance/operit/core/tools/ToolRegistration.kt`
4. `app/src/main/java/com/ai/assistance/operit/core/config/SystemToolPrompts.kt`
5. `app/src/main/java/com/ai/assistance/operit/core/config/SystemToolPromptsInternal.kt`
6. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsTools.kt`
7. `app/src/main/java/com/ai/assistance/operit/data/preferences/MemorySearchSettingsPreferences.kt`
8. `app/src/main/java/com/ai/assistance/operit/data/model/MemorySearchConfig.kt`
9. `app/src/main/java/com/ai/assistance/operit/data/model/CloudEmbeddingConfig.kt`
10. `app/src/main/java/com/ai/assistance/operit/ui/features/memory/**/*`

### 2.5 记忆总结/ProblemLibrary 外围耦合（计划里原先漏写）
1. `app/src/main/java/com/ai/assistance/operit/api/chat/library/ProblemLibrary.kt`
2. `app/src/main/java/com/ai/assistance/operit/api/chat/library/ProblemLibraryTool.kt`
3. `app/src/main/java/com/ai/assistance/operit/api/chat/EnhancedAIService.kt`（初始化+自动保存）
4. `app/src/main/java/com/ai/assistance/operit/services/core/MessageCoordinationDelegate.kt`（手动总结/手动记忆触发）
5. `app/src/main/java/com/ai/assistance/operit/services/core/ApiConfigDelegate.kt`（`enableMemoryQuery`）
6. `app/src/main/java/com/ai/assistance/operit/data/preferences/ApiPreferences.kt`（`enableMemoryQueryFlow`）
7. `app/src/main/java/com/ai/assistance/operit/core/config/SystemPromptConfig.kt`（按 `enableMemoryQuery` 拼提示词）
8. `app/src/main/java/com/ai/assistance/operit/api/chat/enhance/ToolExecutionManager.kt`（`query_memory` 并行名单）

### 2.6 HNSW 与依赖耦合（计划里原先漏写）
1. `app/src/main/java/com/ai/assistance/operit/util/vector/VectorIndexManager.kt`
2. `app/src/main/java/com/ai/assistance/operit/util/vector/IndexItem.kt`
3. `app/src/main/java/com/ai/assistance/operit/ui/features/about/screens/OpenSourceLicenses.kt`
4. `app/src/main/java/com/ai/assistance/operit/data/backup/RawSnapshotBackupManager.kt`
5. `app/build.gradle.kts`
6. `gradle/libs.versions.toml`

### 2.7 其他遗漏影响点（计划补充）
1. `app/src/main/java/com/ai/assistance/operit/provider/MemoryDocumentsProvider.kt`
2. `app/src/main/AndroidManifest.xml`（provider 声明）
3. `app/src/main/java/com/ai/assistance/operit/ui/features/settings/screens/ChatBackupSettingsScreen.kt`
4. `app/src/main/java/com/ai/assistance/operit/ui/features/toolbox/screens/tooltester/ToolTesterScreen.kt`
5. `app/src/main/assets/packages/extended_memory_tools.js`
6. `examples/extended_memory_tools.ts`
7. `examples/extended_memory_tools.js`
8. `examples/operit-tester.ts`
9. `examples/operit-tester.js`
10. `examples/types/tool-types.d.ts`
11. `examples/types/memory.d.ts`

---

## 3. 目标架构（改造后）

分层原则：
1. Native/Kotlin：只负责通用注册中心、通用 JS Bridge、通用 datastore/sql 执行通道、生命周期调度。
2. ToolPkg/TS：负责全部记忆业务与 SQL（DDL/DML/事务/统计/重建/迁移）。

ToolPkg 形态：
1. 单包 `com.operit.memory_suite`。
2. 单 runtime 入口 `memory_runtime`。
3. `ui/` 下继续模块化拆分（`memory_center`、`memory_settings`、`memory_attachment`、`memory_summary`、`shared/*`）。
4. `ui/*.ts` 允许继续拆出多个 `import` 依赖文件（禁止强制单文件堆叠）。
5. 不拆成多个子包发布。

产物位置：
1. 开发源目录：`examples/memory_suite/`。
2. 内置发布产物：`app/src/main/assets/packages/memory_suite.toolpkg`。

---

## 4. 通用接口与协议设计（新增）

### 4.1 Manifest 扩展（通用）
`manifest.json` 新增 `extensions`：

```json
{
  "extensions": {
    "routes": [
      {
        "id": "memory_center",
        "ui_module_id": "memory_center",
        "nav_group": "primary",
        "order": 220,
        "icon": "history"
      }
    ],
    "attachments": [
      {
        "id": "memory_scope_attach",
        "title": { "zh": "记忆范围", "en": "Memory Scope" },
        "icon": "memory",
        "handler": "memory_runtime:attachment.select_scope"
      }
    ],
    "chat_setting_bars": [
      {
        "id": "memory_settings_entry",
        "title": { "zh": "记忆设置", "en": "Memory Settings" },
        "icon": "tune",
        "handler": "memory_runtime:chatbar.open_memory_settings"
      }
    ],
    "chat_hooks": [
      {
        "id": "memory_summary_hook",
        "event": "after_assistant_reply",
        "handler": "memory_runtime:hooks.after_reply"
      }
    ]
  }
}
```

### 4.2 Native 注册中心（通用）
由 `PackageManager` 驱动四类注册中心：
1. `RouteExtensionRegistry`
2. `AttachmentExtensionRegistry`
3. `ChatSettingBarExtensionRegistry`
4. `ChatHookExtensionRegistry`

### 4.3 Compose DSL `ctx` API（通用，无 memory 专有命名）
1. `ctx.app.listRoutes()`
2. `ctx.app.navigateToRoute(routeId, args?)`
3. `ctx.app.getActiveProfileId()`
4. `ctx.chat.listAttachmentEntries()`
5. `ctx.chat.triggerAttachment(entryId, payload?)`
6. `ctx.chat.listSettingBarEntries()`
7. `ctx.chat.triggerSettingBar(entryId, payload?)`
8. `ctx.datastore.get(namespace, key)`
9. `ctx.datastore.set(namespace, key, value)`
10. `ctx.datastore.batchSet(namespace, entries)`
11. `ctx.datastore.observe(namespace, keys?)`
12. `ctx.datastore.sqlQuery(sql, params?)`
13. `ctx.datastore.sqlExecute(sql, params?)`
14. `ctx.datastore.sqlTransaction(operations)`

约束：
1. `ctx.navigate` 空实现必须替换为真实路由调用。
2. SQL 访问不做 `memory_*` 表限制。
3. 多 profile 隔离由 datastore 执行层保证（与当前行为一致）。
4. 禁止新增 `ctx.memoryStore.*`、`ctx.jobs.*`。

### 4.4 聊天生命周期 Hook 事件（通用）
1. `before_send`
2. `before_model_request`
3. `after_assistant_reply`
4. `manual_action`

说明：记忆总结、ProblemLibrary 入库、手动“记忆更新/总结”都统一走 `chat_hooks`，不在 Kotlin 中保留记忆专用流程。

---

## 5. 分阶段实施（WBS，按任务号执行）

### T01：ToolPkg `extensions` 解析
目标：让 ToolPkg manifest 可声明 route/attachment/chatbar/hook。

实施：
1. 在 `ToolPkgParser.kt` 新增 manifest 结构体与 runtime 承载结构。
2. 在解析流程中把 `extensions` 读入 `ToolPkgContainerRuntime`。
3. 增加解析校验：`id` 必填、`handler` 格式、`ui_module_id` 存在性。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/core/tools/packTool/ToolPkgParser.kt`
2. `docs/TOOLPKG_FORMAT_GUIDE.md`

完成定义：
1. `extensions` 可被解析且不影响旧包加载。
2. `examples/windows_control/manifest.json` 仍可被加载。

### T02：通用注册中心接入
目标：在 `PackageManager` 层输出四类扩展注册数据。

实施：
1. 新增四类 registry（或在现有 runtime 管理器中统一实现）。
2. `PackageManager` 在包启用/禁用时同步注册与反注册。
3. 暴露查询接口给 UI 与消息链路使用。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/core/tools/packTool/PackageManager.kt`
2. `app/src/main/java/com/ai/assistance/operit/core/tools/packTool/*Registry*.kt`（新增）

完成定义：
1. 开关一个 ToolPkg，四类 registry 内容实时变化。
2. 无内存泄漏（重复 import/remove 后 registry 不残留）。

### T03：动态路由（侧边栏 + Router + `ctx.navigate`）
目标：侧边栏路由从硬编码迁到“内置路由 + 扩展路由合并”。

实施：
1. 重构 `NavItem` 结构，支持扩展项（不再只靠 sealed object）。
2. `OperitScreens` 增加“扩展路由 Screen 工厂”。
3. `OperitApp`/`DrawerContent` 按 registry 动态渲染。
4. 移除硬编码 `MemoryBase` 主入口。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/ui/common/NavItem.kt`
2. `app/src/main/java/com/ai/assistance/operit/ui/main/screens/OperitScreens.kt`
3. `app/src/main/java/com/ai/assistance/operit/ui/main/OperitApp.kt`
4. `app/src/main/java/com/ai/assistance/operit/ui/main/components/DrawerContent.kt`
5. `app/src/main/java/com/ai/assistance/operit/ui/main/components/AppContent.kt`

完成定义：
1. 内置路由正常。
2. ToolPkg route 可动态出现并可进入页面。
3. `ctx.navigate` 可跳转到扩展 route。

### T04：附件注册与触发（替代 `memory_context.xml`）
目标：附件入口全部走 registry，不再写死记忆文件夹逻辑。

实施：
1. `AttachmentSelector` 改为“内置附件 + 扩展附件”合并列表。
2. 触发扩展附件时调用 `ctx.chat.triggerAttachment` 返回附件对象。
3. 删除 `memory_context.xml` 生成逻辑与消费特判。
4. 移除 `MemoryFolderSelectionDialog` 对 `MemoryRepository` 的直接依赖。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/AttachmentSelector.kt`
2. `app/src/main/java/com/ai/assistance/operit/services/core/AttachmentDelegate.kt`
3. `app/src/main/java/com/ai/assistance/operit/services/core/MessageCoordinationDelegate.kt`
4. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/MemoryFolderSelectionDialog.kt`
5. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/screens/AIChatScreen.kt`

完成定义：
1. 记忆附着由 ToolPkg 提供，不再出现 `memory_context.xml`。
2. 消息发送链路不再有记忆附件特判代码。

### T05：ChatSettingBar 注册与触发
目标：ChatSettingBar 的记忆按钮与动作迁为扩展项。

实施：
1. `ClassicChatSettingsBar`、`AgentChatInputSection` 支持扩展按钮列表渲染。
2. 手动“记忆更新/总结”改为触发扩展 action。
3. 删除硬编码记忆按钮与记忆回调参数。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/style/input/classic/ClassicChatSettingsBar.kt`
2. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/style/input/agent/AgentChatInputSection.kt`
3. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/screens/AIChatScreen.kt`

完成定义：
1. 记忆相关入口来自 ToolPkg 注册。
2. Kotlin 侧无记忆专属按钮实现。

### T06：`ctx.datastore` 与导航桥接
目标：把 DSL 需要的通用能力补齐到 JS Native bridge。

实施：
1. `JsComposeDslBridge.kt` 增加 `ctx.app.*` 与 `ctx.datastore.*`。
2. `JsEngine.kt` 的 `NativeInterface` 暴露对应 `@JavascriptInterface`。
3. `JsNativeInterfaceDelegates.kt` 实现 datastore/sql 调用。
4. 返回值统一 JSON 编码，错误统一结构化格式。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsComposeDslBridge.kt`
2. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsEngine.kt`
3. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsNativeInterfaceDelegates.kt`

完成定义：
1. TS ToolPkg 可直接做 SQL CRUD 与事务。
2. TS UI 可直接导航与读写配置。

### T07：`memory_suite` ToolPkg 骨架
目标：创建单包、多 UI 模块、单 runtime 的记忆包。

实施：
1. 新建 `examples/memory_suite/manifest.json`。
2. 新建 `packages/memory_runtime.ts`。
3. 新建 `ui/memory_center`、`ui/memory_settings`、`ui/memory_attachment`、`ui/memory_summary`。
4. 在 manifest 注册 route/attachment/chat_setting_bar/chat_hooks。

涉及文件：
1. `examples/memory_suite/**`（新增）
2. `app/src/main/assets/packages/memory_suite.toolpkg`（产物）

完成定义：
1. 包导入后可在注册中心看到四类扩展。
2. 进入记忆中心 UI 不依赖 Kotlin 记忆页面。

### T08：TS 侧 SQL 接管
目标：记忆主数据与业务 SQL 全部由 TS 接管。

实施：
1. runtime 启动时执行 `initSchema()`（建表/索引/版本迁移）。
2. 提供 TS 层 DAO：node/chunk/link/embedding/rebuild_job/metadata。
3. 从 ObjectBox 做一次性迁移到 SQL（按 profile 执行）。
4. 迁移后在线读写只走 `ctx.datastore.sql*`。

涉及文件：
1. `examples/memory_suite/packages/memory_runtime.ts`
2. `examples/memory_suite/packages/sql/*.ts`（新增）
3. `examples/memory_suite/packages/migration/*.ts`（新增）

完成定义：
1. 记忆 CRUD、链接、文档分块、检索均不触发 Kotlin `MemoryRepository`。
2. profile 切换后数据隔离与现状一致。

### T09：向量检索/维数统计/重建（TS）
目标：在无 HNSW 前提下完成向量相关功能。

实施：
1. 本地向量模型权重默认 `0`，不再内置本地模型。
2. 云向量配置写入 datastore（endpoint/key/model）。
3. 查询时采用“关键词 SQL 预筛 + TS 余弦计算 + 加权融合”。
4. 维数统计通过 SQL 聚合 `memory_embeddings`。
5. 重建任务由 TS 写 `memory_rebuild_jobs` 并持续更新进度。

涉及文件：
1. `examples/memory_suite/packages/vector/*.ts`（新增）
2. `examples/memory_suite/packages/jobs/rebuild_embeddings.ts`（新增）

完成定义：
1. 不存在 HNSW 调用。
2. 设置页可看到维数统计与重建实时进度。

### T10：记忆设置弹窗 ToolPkg 化
目标：完成设置弹窗插件化并满足你的交互要求。

实施：
1. 设置项：阈值、计算方式、关键词/向量/边权重。
2. 云端关闭时隐藏 endpoint/apiKey/model 输入框。
3. 展示维数使用情况（按 provider/model/dimension 分组）。
4. 提供“重建向量索引”按钮与进度显示。
5. 继续保持布局紧凑（去掉“什么优先”等冗余项）。

涉及文件：
1. `examples/memory_suite/ui/memory_settings/index.ui.ts`
2. `examples/memory_suite/ui/shared/*`（新增）

完成定义：
1. UI 逻辑与数据全部在 TS。
2. Kotlin 中不再维护记忆设置弹窗实现。

### T10A：UI 脚本模块化 + 记忆管理页 1:1 复刻
目标：确保 ToolPkg UI 结构可维护，且侧边栏进入的“记忆管理”页面与 KT 版本一致。
当前进度（2026-02-18）：`memory_center` 已完成多文件拆分（`index + screen + service`），并在 ToolPkg 侧补齐图谱画布交互（节点拖拽 + 连线可视化）、文档查看/分块编辑（含文档内搜索）、边详情/边编辑、文件路径导入（`read_file_full`）链路；1:1 复刻联调完成并通过验收。
待补控件差异（联调中持续核对）：
1. 暂无新增缺项（若联调发现偏差再回填）。

实施：
1. `ui/*.ts` 按功能拆分为多文件并通过 `import` 组合，禁止将全部 UI 逻辑塞入单文件。
2. 侧边栏 `memory_center` 页面按当前 KT 版本做 1:1 复刻（布局、交互、信息层级一致）。
3. 对 KT 页面存在但 ToolPkg 版本缺失的控件逐项补齐（按钮、筛选、状态展示、批量操作入口等）。
4. 复刻中涉及的数据行为统一接入 ToolPkg runtime/SQL，不回接 Kotlin 记忆页面逻辑。

涉及文件：
1. `examples/memory_suite/ui/memory_center/index.ui.ts`
2. `examples/memory_suite/ui/memory_center/**/*.ts`（新增）
3. `examples/memory_suite/ui/shared/**/*.ts`（新增/调整）

完成定义：
1. `memory_center` 页面控件清单与 KT 版本逐项对齐，无缺项。
2. `memory_center` 页面可由多 `import` 模块组成并保持可运行。
3. 不再依赖任何 Kotlin 记忆页面组件实现。

### T11：记忆附着/总结/ProblemLibrary ToolPkg 化
目标：把记忆总结与 ProblemLibrary 从 Kotlin 移走。
当前进度（2026-02-18）：`memory_attachment`、`memory_summary` UI 已从占位页改为可操作模块（支持查询、写入、删除与 scope 预览）；Kotlin 主链路已移除 `ProblemLibrary.initialize/saveProblemAsync` 直调，改为 ToolPkg `chat_hooks`（`after_assistant_reply` + `manual_action`）分发，并同步清理 `<memory>` 正则/渲染特判；`ProblemLibrary*` 与 `ProblemDao/ProblemEntity` 旧文件已删除，数据库升至 v12 并迁移清理 `problem_records`；T11 已完成并勾选。

实施：
1. `chat_hooks.after_assistant_reply` 中实现总结抽取与入库。
2. 把手动“记忆更新/总结”改为 hook action。
3. `EnhancedAIService` 移除 `ProblemLibrary.initialize/saveProblemAsync` 直调。
4. 清理 `<memory>` 相关渲染与正则特判。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/api/chat/EnhancedAIService.kt`
2. `app/src/main/java/com/ai/assistance/operit/core/chat/AIMessageManager.kt`
3. `app/src/main/java/com/ai/assistance/operit/util/ChatMarkupRegex.kt`
4. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/style/cursor/UserMessageComposable.kt`
5. `app/src/main/java/com/ai/assistance/operit/ui/features/chat/components/style/bubble/BubbleUserMessageComposable.kt`
6. `app/src/main/java/com/ai/assistance/operit/api/chat/library/ProblemLibrary.kt`（删除）
7. `app/src/main/java/com/ai/assistance/operit/api/chat/library/ProblemLibraryTool.kt`（删除）

完成定义：
1. Kotlin 无记忆总结/ProblemLibrary 主逻辑。
2. 主聊天链路完全依赖 ToolPkg hook。

### T12：旧入口与旧工具下线
目标：彻底移除旧记忆工具链和中间层。
当前进度（2026-02-18）：已完成旧工具注册下线（`query_memory/get_memory_by_title/create/update/delete/link_memories`）、`JsTools.Memory` 命名空间清理、`SystemToolPrompts*` 旧记忆工具提示清理、tool tester `query_memory` 测试项清理；`MemoryBase` 侧边栏旧入口已移除；`MemoryQueryToolExecutor` 已删除并拆出独立 `StandardUserPreferenceToolExecutor` 承接 `update_user_preferences`；旧 `ui/features/memory/*`、`MemoryFolderSelectionDialog.kt`、`MemoryRepository.kt`、`MemorySearchSettingsPreferences.kt` 已删除，Kotlin 记忆入口已彻底下线。

实施：
1. 删除 `MemoryQueryToolExecutor` 与对应 ToolRegistration。
2. 删除 `JsTools.Memory` 命名空间。
3. 清理 `SystemToolPrompts*` 中记忆工具条目。
4. 清理 tool tester 里 `query_memory` 测试项。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/core/tools/defaultTool/standard/MemoryQueryToolExecutor.kt`
2. `app/src/main/java/com/ai/assistance/operit/core/tools/ToolRegistration.kt`
3. `app/src/main/java/com/ai/assistance/operit/core/tools/javascript/JsTools.kt`
4. `app/src/main/java/com/ai/assistance/operit/core/config/SystemToolPrompts.kt`
5. `app/src/main/java/com/ai/assistance/operit/core/config/SystemToolPromptsInternal.kt`
6. `app/src/main/java/com/ai/assistance/operit/ui/features/toolbox/screens/tooltester/ToolTesterScreen.kt`

完成定义：
1. 全局不再注册 `query_memory/get_memory_by_title/link_memories`。
2. Prompt 不再内建记忆工具描述。

### T13：HNSW 彻底清理
目标：删除 HNSW 代码、依赖、许可展示与残余处理。
当前进度（2026-02-18）：`VectorIndexManager/IndexItem` 已删除，`app/build.gradle.kts` 与 `libs.versions.toml` 的 hnsw/jelmerk 依赖已移除，开源许可页 HNSWLib 条目已删除，`RawSnapshotBackupManager` 中 hnsw 文件特判已清理；静态 grep（`hnsw|HNSW|VectorIndexManager|IndexItem|jelmerk`）已清零。

实施：
1. 删除 `VectorIndexManager` 与 `IndexItem`。
2. 移除 gradle 中 hnsw 依赖（含 `libs.versions.toml`）。
3. 从开源许可页面删除 HNSWLib。
4. 清理备份逻辑中 hnsw 文件特判。

涉及文件：
1. `app/src/main/java/com/ai/assistance/operit/util/vector/VectorIndexManager.kt`
2. `app/src/main/java/com/ai/assistance/operit/util/vector/IndexItem.kt`
3. `app/build.gradle.kts`
4. `gradle/libs.versions.toml`
5. `app/src/main/java/com/ai/assistance/operit/ui/features/about/screens/OpenSourceLicenses.kt`
6. `app/src/main/java/com/ai/assistance/operit/data/backup/RawSnapshotBackupManager.kt`

完成定义：
1. 代码和依赖树里无 hnsw。
2. 不再产出/处理 hnsw 索引文件。

### T14：文档与类型声明同步
目标：让开发者文档与类型系统可直接指导后续开发。
当前进度（2026-02-18）：已清理 `examples/types/tool-types.d.ts` 中旧记忆工具声明，下线 `examples/extended_memory_tools.ts`、`examples/extended_memory_tools.js` 与 `app/src/main/assets/packages/extended_memory_tools.js`；`TOOLPKG_FORMAT_GUIDE.md`、`examples/types/compose-dsl.d.ts`、`examples/types/index.d.ts` 已同步，`examples/types/memory.d.ts` 已删除，T14 完成。

实施：
1. 更新 `TOOLPKG_FORMAT_GUIDE.md`（`extensions` + `chat_hooks` + `ctx.datastore.sql*`）。
2. 更新 `examples/types/compose-dsl.d.ts` 与 `examples/types/core.d.ts`。
3. 清理 `examples/types/tool-types.d.ts` 中旧记忆工具声明。
4. 清理旧 `examples/extended_memory_tools.*` 示例。

涉及文件：
1. `docs/TOOLPKG_FORMAT_GUIDE.md`
2. `examples/types/compose-dsl.d.ts`
3. `examples/types/core.d.ts`
4. `examples/types/index.d.ts`
5. `examples/types/tool-types.d.ts`
6. `examples/types/memory.d.ts`
7. `examples/extended_memory_tools.ts`
8. `examples/extended_memory_tools.js`

完成定义：
1. 类型定义与 runtime API 一致。
2. 文档示例可覆盖四类 extensions 使用方式。

### T15：最终清理验收
目标：确保“无旧路径残留”。

实施：
1. 执行全局 grep 验收脚本（见第 9 节）。
2. 按任务清单逐项打勾。
3. 产出“删除清单 + 新增清单 + 迁移说明”摘要。

完成定义：
1. 清零项全部通过。
2. 记忆能力仅由 ToolPkg 提供。

---

## 6. TS 侧 SQL 设计（实现归属：ToolPkg）

### 6.1 表结构（由 TS 创建）
1. `memory_nodes`
2. `memory_chunks`
3. `memory_links`
4. `memory_embeddings`
5. `memory_rebuild_jobs`
6. `memory_metadata`

建议字段（示意）：

```sql
CREATE TABLE IF NOT EXISTS memory_nodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folder_path TEXT,
  source TEXT,
  content_type TEXT,
  is_document_node INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  extra_json TEXT
);

CREATE TABLE IF NOT EXISTS memory_chunks (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(node_id) REFERENCES memory_nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memory_links (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  link_type TEXT,
  weight REAL NOT NULL DEFAULT 0,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_embeddings (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  dimension INTEGER NOT NULL,
  vector_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_rebuild_jobs (
  job_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  finished_at INTEGER,
  config_json TEXT,
  error_text TEXT
);

CREATE TABLE IF NOT EXISTS memory_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 6.2 向量检索（无 HNSW）
1. 第一步：SQL 关键词预筛选（title/content/folder/time）。
2. 第二步：若 `vector_weight > 0` 且云向量开启，则请求云端 query embedding。
3. 第三步：TS 对候选向量做余弦计算，融合关键词/向量/边权重。
4. 第四步：按 score mode 输出 TopK。

### 6.3 维数统计与重建进度（纯 TS）
1. 维数统计：`memory_embeddings` 按 `provider/model/dimension` 聚合。
2. 重建进度：通过 `memory_rebuild_jobs` 更新 `processed_count/total_count/status`。
3. UI 轮询该表显示进度，不依赖 Native `jobs`。

### 6.4 配置存储（纯 datastore）
1. 命名空间建议：`memory.search`、`memory.embedding.cloud`、`memory.ui`。
2. 默认值：`vector_weight = 0`、云向量关闭。
3. 云向量关闭时，设置 UI 不展示 endpoint/key/model 输入框。

---

## 7. Kotlin 清理清单（必须删除/替换）

### 7.1 删除项
1. `app/src/main/java/com/ai/assistance/operit/provider/MemoryDocumentsProvider.kt`
2. `app/src/main/java/com/ai/assistance/operit/core/tools/defaultTool/standard/MemoryQueryToolExecutor.kt`
3. `app/src/main/java/com/ai/assistance/operit/api/chat/library/ProblemLibrary.kt`
4. `app/src/main/java/com/ai/assistance/operit/api/chat/library/ProblemLibraryTool.kt`
5. `app/src/main/java/com/ai/assistance/operit/util/vector/VectorIndexManager.kt`
6. `app/src/main/java/com/ai/assistance/operit/util/vector/IndexItem.kt`
7. `app/src/main/java/com/ai/assistance/operit/ui/features/memory/**/*`

### 7.2 代码块清理项
1. `app/src/main/AndroidManifest.xml` 中 Memory provider 节点
2. `ToolRegistration.kt` 记忆工具注册块
3. `SystemToolPrompts*.kt` 记忆工具提示块
4. `JsTools.kt` 的 `Memory` 命名空间
5. `AttachmentDelegate.kt` 中 `memory_context.xml` 生成代码
6. `MessageCoordinationDelegate.kt` 中 `memory_context.xml` 特判代码
7. `ChatMarkupRegex.kt` 中 `memoryTag`
8. `UserMessageComposable.kt` 与 `BubbleUserMessageComposable.kt` 中 `<memory>` 清理逻辑
9. `ToolTesterScreen.kt` 中 `query_memory` 测试项
10. `OpenSourceLicenses.kt` 中 HNSW 条目

### 7.3 待确认后清理项（若完全无引用）
1. `app/src/main/java/com/ai/assistance/operit/data/repository/MemoryRepository.kt`
2. `app/src/main/java/com/ai/assistance/operit/data/preferences/MemorySearchSettingsPreferences.kt`
3. `app/src/main/java/com/ai/assistance/operit/data/model/MemorySearchConfig.kt`
4. `app/src/main/java/com/ai/assistance/operit/data/model/CloudEmbeddingConfig.kt`
5. `app/src/main/java/com/ai/assistance/operit/data/db/ProblemEntity.kt`
6. `app/src/main/java/com/ai/assistance/operit/data/db/ProblemDao.kt`
7. `app/src/main/java/com/ai/assistance/operit/data/db/AppDatabase.kt` 中 ProblemEntity 相关声明

---

## 8. PR 切分建议（可审查）

1. PR-1：`extensions` 解析 + 注册中心 + `ctx` bridge。
2. PR-2：路由/附件/chatbar 动态注册接入（先接空包验证）。
3. PR-3：`memory_suite` 骨架 + SQL schema + CRUD + 搜索。
4. PR-4：记忆设置 UI + 云向量 + 维数统计 + 重建进度。
5. PR-5：总结/ProblemLibrary 迁移到 hook + 消息协议改造。
6. PR-6：旧链路下线 + HNSW 清理 + 文档类型更新 + 全局验收。

约束：每个 PR 合并后必须回填本页任务清单勾选状态。

---

## 9. 最终验收脚本（不编译版）

以下命令全部用于“静态清理验收”，不触发构建：

```powershell
rg -n "query_memory|get_memory_by_title|create_memory|update_memory|delete_memory|link_memories" app/src/main/java app/src/main/res
rg -n "JsTools\.Memory|MemoryQueryToolExecutor|MemoryDocumentsProvider" app/src/main/java
rg -n "memory_context\.xml|<memory_context>|<memory>|memoryTag" app/src/main/java
rg -n "ProblemLibrary|saveProblemAsync|enableMemoryQuery" app/src/main/java
rg -n "hnsw|HNSW|VectorIndexManager|IndexItem|jelmerk" app/src/main/java app/build.gradle.kts gradle/libs.versions.toml
rg -n "extended_memory_tools" app/src/main/assets examples
rg -n "memory_base" app/src/main/java/com/ai/assistance/operit/ui
```

通过标准：
1. 上述关键字仅允许出现在新文档或明确保留的注释说明中。
2. 运行时链路中不再有旧记忆实现。

---

## 10. 风险与控制

1. 风险：路由模型从 sealed 改动态，影响面大。
控制：先兼容“内置路由 + 扩展路由”双源，完成后再移除 `MemoryBase`。

2. 风险：消息链路切换 hook 后出现触发顺序问题。
控制：定义固定事件顺序（`before_send -> before_model_request -> after_assistant_reply`）。

3. 风险：无 HNSW 下向量检索性能下降。
控制：SQL 预筛选 + 限流候选 + 批量余弦计算；默认 `vector_weight=0`。

4. 风险：ProblemLibrary 移除导致行为回归。
控制：先在 TS 复刻输入输出契约，再切换调用点。

5. 风险：删除旧偏好导致用户配置丢失。
控制：已确认不做迁移；新默认值在设置页清晰可见。

---

## 11. 最终验收标准

1. 侧边栏/附件/ChatSettingBar/ChatHook 四类入口均由 ToolPkg 注册驱动。
2. 记忆 CRUD、检索、附着、总结、重建全部在 TS ToolPkg 实现。
3. 侧边栏“记忆管理”页面与 KT 版本 1:1 对齐，缺失控件全部补齐。
4. SQL 成为记忆唯一在线数据源；Kotlin `MemoryRepository` 不再参与主链路。
5. 旧记忆工具与 `JsTools.Memory` 中间层完全移除。
6. 消息协议不再依赖 `<memory>` 与 `memory_context.xml`。
7. `ProblemLibrary` Kotlin 链路完全下线。
8. HNSW 代码、依赖、许可展示全部清理。
9. 悬浮窗不作为本期验收项。
10. 顶部任务清单全部打勾。
