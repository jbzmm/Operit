import type { ComposeDslContext, ComposeNode } from "../../../types/compose-dsl";
import { buildAttachmentScope, loadFolders, type AttachmentPreviewNode } from "./service";
import { asErrorText } from "../shared/runtime_tool";
import { clampNumber, compactText } from "../shared/format";

function useValueState<T>(ctx: ComposeDslContext, key: string, initialValue: T): { value: T; set: (value: T) => void } {
  const pair = ctx.useState<T>(key, initialValue);
  return {
    value: pair[0],
    set: pair[1]
  };
}

function asNodeList(value: unknown): AttachmentPreviewNode[] {
  return Array.isArray(value) ? (value as AttachmentPreviewNode[]) : [];
}

export function buildMemoryAttachmentScreen(ctx: ComposeDslContext): ComposeNode {
  const initializedState = useValueState(ctx, "ma_initialized", false);
  const loadingState = useValueState(ctx, "ma_loading", false);
  const errorState = useValueState(ctx, "ma_error", "");

  const queryState = useValueState(ctx, "ma_query", "");
  const folderState = useValueState(ctx, "ma_folder", "");
  const limitState = useValueState(ctx, "ma_limit", "20");

  const foldersState = useValueState<string[]>(ctx, "ma_folders", []);
  const scopeQueryState = useValueState(ctx, "ma_scope_query", "");
  const scopeFoldersState = useValueState<string[]>(ctx, "ma_scope_folders", []);
  const attachmentTextState = useValueState(ctx, "ma_attachment_text", "");
  const nodesState = useValueState<AttachmentPreviewNode[]>(ctx, "ma_nodes", []);

  const setError = (message: string): void => {
    errorState.set(String(message || "").trim());
  };

  const clearError = (): void => {
    setError("");
  };

  const refreshFoldersAction = async (): Promise<void> => {
    loadingState.set(true);
    try {
      const folders = await loadFolders(ctx);
      foldersState.set(folders);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      loadingState.set(false);
    }
  };

  const buildAction = async (): Promise<void> => {
    loadingState.set(true);
    try {
      const limit = Math.round(clampNumber(limitState.value, 1, 200, 20));
      const result = await buildAttachmentScope(ctx, queryState.value, folderState.value, limit);
      foldersState.set(result.folders);
      scopeQueryState.set(result.scope.query);
      scopeFoldersState.set(result.scope.folders);
      nodesState.set(result.nodes);
      attachmentTextState.set(result.attachmentText);
      clearError();
    } catch (error) {
      setError(asErrorText(error));
    } finally {
      loadingState.set(false);
    }
  };

  const nodes = asNodeList(nodesState.value);
  const scopeFolders = Array.isArray(scopeFoldersState.value) ? scopeFoldersState.value : [];

  const children: ComposeNode[] = [
    ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
      ctx.Column({ weight: 1, spacing: 2 }, [
        ctx.Text({ text: "记忆附着", style: "headlineSmall", fontWeight: "bold" }),
        ctx.Text({ text: "按查询与目录生成可附着的记忆范围", style: "bodySmall", color: "onSurfaceVariant" })
      ]),
      ctx.IconButton({ icon: "refresh", onClick: refreshFoldersAction }),
      ctx.IconButton({
        icon: "close",
        onClick: async () => {
          await ctx.navigate("memory_center");
        }
      })
    ]),

    loadingState.value
      ? ctx.Row({ spacing: 8, verticalAlignment: "center" }, [
          ctx.CircularProgressIndicator({ width: 16, height: 16, strokeWidth: 2 }),
          ctx.Text({ text: "处理中...", style: "bodyMedium" })
        ])
      : ctx.Spacer({ height: 0 }),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Text({ text: "附着参数", style: "titleMedium", fontWeight: "semiBold" }),
        ctx.TextField({
          label: "查询关键词",
          value: queryState.value,
          onValueChange: queryState.set,
          singleLine: true
        }),
        ctx.Row({ spacing: 8, fillMaxWidth: true }, [
          ctx.TextField({
            label: "文件夹（为空表示全部）",
            value: folderState.value,
            onValueChange: folderState.set,
            singleLine: true,
            weight: 1
          }),
          ctx.TextField({
            label: "候选数",
            value: limitState.value,
            onValueChange: limitState.set,
            singleLine: true,
            width: 92
          })
        ]),
        ctx.Row({ spacing: 8 }, [
          ctx.Button({ text: "生成附着内容", onClick: buildAction }),
          ctx.Button({
            text: "清空",
            onClick: () => {
              queryState.set("");
              folderState.set("");
              attachmentTextState.set("");
              nodesState.set([]);
              scopeQueryState.set("");
              scopeFoldersState.set([]);
            }
          })
        ])
      ])
    ]),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Text({ text: "文件夹列表", style: "titleMedium", fontWeight: "semiBold" }),
        ctx.LazyColumn({ spacing: 6, height: 140 }, [
          ctx.Button({
            text: folderState.value ? "全部 (点击切换)" : "全部 (已选中)",
            onClick: () => folderState.set("")
          }),
          ...(foldersState.value || []).map(folder =>
            ctx.Button({
              text: folderState.value === folder ? `${folder} (已选中)` : folder,
              onClick: () => folderState.set(folder)
            })
          )
        ])
      ])
    ]),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Text({ text: "附着结果", style: "titleMedium", fontWeight: "semiBold" }),
        ctx.Text({
          text: `scope.query: ${scopeQueryState.value || "(empty)"}`,
          style: "bodySmall",
          color: "onSurfaceVariant"
        }),
        ctx.Text({
          text: scopeFolders.length > 0 ? `scope.folders: ${scopeFolders.join(" · ")}` : "scope.folders: (empty)",
          style: "bodySmall",
          color: "onSurfaceVariant"
        }),
        ctx.Text({
          text: attachmentTextState.value ? compactText(attachmentTextState.value, 900) : "尚未生成附着内容",
          style: "bodyMedium"
        })
      ])
    ]),

    ctx.Card({ fillMaxWidth: true }, [
      ctx.Column({ padding: 12, spacing: 8 }, [
        ctx.Text({ text: `命中节点 (${nodes.length})`, style: "titleMedium", fontWeight: "semiBold" }),
        ctx.LazyColumn({ spacing: 6, height: 220 }, [
          ...nodes.map(node =>
            ctx.Card({ fillMaxWidth: true }, [
              ctx.Column({ padding: 8, spacing: 4 }, [
                ctx.Text({ text: node.title || "(untitled)", style: "bodyMedium", fontWeight: "semiBold" }),
                ctx.Text({
                  text: `folder=${node.folderPath || "(none)"}${typeof node.score === "number" ? ` · score=${node.score.toFixed(4)}` : ""}`,
                  style: "bodySmall",
                  color: "onSurfaceVariant"
                }),
                ctx.Text({ text: compactText(node.content, 120), style: "bodySmall", color: "onSurfaceVariant" })
              ])
            ])
          )
        ])
      ])
    ])
  ];

  if (errorState.value.trim()) {
    children.push(
      ctx.Card({ fillMaxWidth: true, containerColor: "errorContainer", contentColor: "onErrorContainer" }, [
        ctx.Row({ padding: 10, spacing: 8, verticalAlignment: "center" }, [
          ctx.Icon({ name: "error", tint: "onErrorContainer" }),
          ctx.Text({ text: errorState.value, style: "bodyMedium", color: "onErrorContainer", weight: 1 }),
          ctx.IconButton({ icon: "close", onClick: clearError })
        ])
      ])
    );
  }

  return ctx.Column(
    {
      onLoad: async () => {
        if (!initializedState.value) {
          initializedState.set(true);
          await refreshFoldersAction();
        }
      },
      fillMaxSize: true,
      padding: 12,
      spacing: 10
    },
    children
  );
}
