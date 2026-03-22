package com.ai.assistance.operit.core.tools

import com.ai.assistance.operit.provider.IUiAutomationService

/**
 * A singleton bridge holding the remote IUiAutomationService proxy 
 * injected by UiAutoBinderReceiver via Binder IPC. Provides an instant memory-level gateway for UI tools.
 */
object UiAutomatorBridge {
    private const val TAG = "UiAutomatorBridge"

    @Volatile
    var uiAutomationService: IUiAutomationService? = null

    val isReady: Boolean
        get() = uiAutomationService != null && uiAutomationService?.asBinder()?.isBinderAlive == true

    /**
     * 确保自动化服务已就绪。如果未就绪，则尝试从 assets 中提取并安装 APK，然后启动服务。
     * @param context 环境上下文
     * @param shellExecutor 执行 Shell 命令的方法
     * @return 是否成功就绪
     */
    suspend fun ensureServiceReady(
        context: android.content.Context,
        shellExecutor: suspend (String) -> Unit
    ): Boolean {
        if (isReady) return true

        android.util.Log.i(TAG, "自动化服务未就绪，正在尝试初始化...")

        // 1. 尝试从 assets 提取 APK
        val assetManager = context.assets
        val tmpApk = java.io.File(context.cacheDir, "uiautoserver.apk")
        try {
            assetManager.open("uiautoserver.apk").use { input ->
                tmpApk.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "从 assets 提取 uiautoserver.apk 失败", e)
        }

        // 2. 如果提取成功，则执行安装
        if (tmpApk.exists()) {
            val targetApk = "/data/local/tmp/uiautoserver.apk"
            shellExecutor("cp ${tmpApk.absolutePath} $targetApk && chmod 777 $targetApk")
            shellExecutor("pm install -r -d -t $targetApk")
        }

        // 3. 启动 Instrumentation
        val serverPkg = "com.ai.assistance.operit.uiautoserver"
        val cmd = "am instrument -w -e class $serverPkg.AgentInstrumentation $serverPkg/.AgentInstrumentation"
        shellExecutor("$cmd &")

        // 4. 等待就绪
        for (i in 0..15) {
            if (isReady) {
                android.util.Log.i(TAG, "自动化服务唤醒成功")
                return true
            }
            kotlinx.coroutines.delay(500)
        }

        android.util.Log.e(TAG, "自动化服务唤醒超时")
        return false
    }
}
