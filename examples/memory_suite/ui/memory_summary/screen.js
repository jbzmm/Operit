"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMemorySummaryScreen = buildMemorySummaryScreen;
const service_1 = require("./service");
const runtime_tool_1 = require("../shared/runtime_tool");
const format_1 = require("../shared/format");
function useValueState(ctx, key, initialValue) {
    const pair = ctx.useState(key, initialValue);
    return {
        value: pair[0],
        set: pair[1]
    };
}
function asNodeList(value) {
    return Array.isArray(value) ? value : [];
}
function buildMemorySummaryScreen(ctx) {
    const initializedState = useValueState(ctx, "msu_initialized", false);
    const loadingState = useValueState(ctx, "msu_loading", false);
    const errorState = useValueState(ctx, "msu_error", "");
    const queryState = useValueState(ctx, "msu_query", "");
    const inputTitleState = useValueState(ctx, "msu_input_title", "");
    const inputContentState = useValueState(ctx, "msu_input_content", "");
    const nodesState = useValueState(ctx, "msu_nodes", []);
    const setError = (message) => {
        errorState.set(String(message || "").trim());
    };
    const clearError = () => {
        setError("");
    };
    const refreshAction = async () => {
        loadingState.set(true);
        try {
            const nodes = await (0, service_1.loadSummaryNodes)(ctx, queryState.value, 80);
            nodesState.set(nodes);
            clearError();
        }
        catch (error) {
            setError((0, runtime_tool_1.asErrorText)(error));
        }
        finally {
            loadingState.set(false);
        }
    };
    const createManualAction = async () => {
        loadingState.set(true);
        try {
            await (0, service_1.createManualSummary)(ctx, inputTitleState.value, inputContentState.value);
            inputTitleState.set("");
            inputContentState.set("");
            await refreshAction();
            if (ctx.showToast) {
                await ctx.showToast("手动总结已写入");
            }
        }
        catch (error) {
            setError((0, runtime_tool_1.asErrorText)(error));
        }
        finally {
            loadingState.set(false);
        }
    };
    const runHookAction = async () => {
        loadingState.set(true);
        try {
            await (0, service_1.runHookSummary)(ctx, inputContentState.value);
            inputContentState.set("");
            await refreshAction();
            if (ctx.showToast) {
                await ctx.showToast("已通过 Hook 写入总结");
            }
        }
        catch (error) {
            setError((0, runtime_tool_1.asErrorText)(error));
        }
        finally {
            loadingState.set(false);
        }
    };
    const removeNodeAction = async (id) => {
        loadingState.set(true);
        try {
            await (0, service_1.deleteSummaryNode)(ctx, id);
            await refreshAction();
        }
        catch (error) {
            setError((0, runtime_tool_1.asErrorText)(error));
        }
        finally {
            loadingState.set(false);
        }
    };
    const nodes = asNodeList(nodesState.value);
    const children = [
        ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
            ctx.Column({ weight: 1, spacing: 2 }, [
                ctx.Text({ text: "记忆总结", style: "headlineSmall", fontWeight: "bold" }),
                ctx.Text({ text: "会话总结落库与历史查看", style: "bodySmall", color: "onSurfaceVariant" })
            ]),
            ctx.IconButton({ icon: "refresh", onClick: refreshAction }),
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
                ctx.Row({ spacing: 8, fillMaxWidth: true, verticalAlignment: "center" }, [
                    ctx.TextField({
                        label: "筛选关键词",
                        value: queryState.value,
                        onValueChange: queryState.set,
                        singleLine: true,
                        weight: 1
                    }),
                    ctx.Button({ text: "查询", onClick: refreshAction }),
                    ctx.IconButton({
                        icon: "clear",
                        onClick: async () => {
                            queryState.set("");
                            await refreshAction();
                        }
                    })
                ])
            ])
        ]),
        ctx.Card({ fillMaxWidth: true }, [
            ctx.Column({ padding: 12, spacing: 8 }, [
                ctx.Text({ text: "手动总结写入", style: "titleMedium", fontWeight: "semiBold" }),
                ctx.TextField({
                    label: "标题（可空）",
                    value: inputTitleState.value,
                    onValueChange: inputTitleState.set,
                    singleLine: true
                }),
                ctx.TextField({
                    label: "总结内容",
                    value: inputContentState.value,
                    onValueChange: inputContentState.set,
                    minLines: 4
                }),
                ctx.Row({ spacing: 8 }, [
                    ctx.Button({ text: "写入总结节点", onClick: createManualAction }),
                    ctx.Button({ text: "走 Hook 写入", onClick: runHookAction })
                ])
            ])
        ]),
        ctx.Card({ fillMaxWidth: true }, [
            ctx.Column({ padding: 12, spacing: 8 }, [
                ctx.Text({ text: `总结列表 (${nodes.length})`, style: "titleMedium", fontWeight: "semiBold" }),
                ctx.LazyColumn({ spacing: 8, height: 340 }, [
                    ...nodes.map(node => ctx.Card({ fillMaxWidth: true }, [
                        ctx.Column({ padding: 10, spacing: 6 }, [
                            ctx.Row({ fillMaxWidth: true, verticalAlignment: "center" }, [
                                ctx.Column({ weight: 1, spacing: 2 }, [
                                    ctx.Text({ text: node.title || "(untitled)", style: "bodyMedium", fontWeight: "semiBold" }),
                                    ctx.Text({
                                        text: `${node.source || "summary"} · ${(0, format_1.formatDateTime)(node.updatedAt)}`,
                                        style: "bodySmall",
                                        color: "onSurfaceVariant"
                                    })
                                ]),
                                ctx.Button({
                                    text: "删除",
                                    onClick: async () => {
                                        await removeNodeAction(node.id);
                                    }
                                })
                            ]),
                            ctx.Text({
                                text: (0, format_1.compactText)(node.content, 260),
                                style: "bodySmall",
                                color: "onSurfaceVariant"
                            })
                        ])
                    ]))
                ])
            ])
        ])
    ];
    if (errorState.value.trim()) {
        children.push(ctx.Card({ fillMaxWidth: true, containerColor: "errorContainer", contentColor: "onErrorContainer" }, [
            ctx.Row({ padding: 10, spacing: 8, verticalAlignment: "center" }, [
                ctx.Icon({ name: "error", tint: "onErrorContainer" }),
                ctx.Text({ text: errorState.value, style: "bodyMedium", color: "onErrorContainer", weight: 1 }),
                ctx.IconButton({ icon: "close", onClick: clearError })
            ])
        ]));
    }
    return ctx.Column({
        onLoad: async () => {
            if (!initializedState.value) {
                initializedState.set(true);
                await refreshAction();
            }
        },
        fillMaxSize: true,
        padding: 12,
        spacing: 10
    }, children);
}
