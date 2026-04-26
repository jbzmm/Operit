package com.star.operit.plugins.toolbox

import com.star.operit.core.application.OperitApplication
import com.star.operit.core.tools.AIToolHandler
import com.star.operit.core.tools.packTool.PackageManager
import com.star.operit.core.tools.packTool.ToolPkgContainerRuntime
import com.star.operit.plugins.OperitPlugin
import com.star.operit.plugins.lifecycle.AppLifecycleEvent
import com.star.operit.plugins.lifecycle.AppLifecycleHookParams
import com.star.operit.plugins.lifecycle.AppLifecycleHookPlugin
import com.star.operit.plugins.lifecycle.AppLifecycleHookPluginRegistry
import com.star.operit.plugins.toolpkg.ToolPkgAppLifecycleHookRegistration
import com.star.operit.util.AppLogger
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private object ToolPkgAppLifecycleHookPlugin : AppLifecycleHookPlugin {
    private const val TAG = "ToolboxPlugin"
    @Volatile
    private var hooksByEvent: Map<String, List<ToolPkgAppLifecycleHookRegistration>> = emptyMap()

    override val id: String = "builtin.toolbox.toolpkg-app-lifecycle"

    override suspend fun onEvent(
        event: AppLifecycleEvent,
        params: AppLifecycleHookParams
    ) {
        val context = params.context
        val packageManager =
            PackageManager.getInstance(
                context,
                AIToolHandler.getInstance(context)
            )
        val hooks = hooksByEvent[event.wireName.trim().lowercase()].orEmpty()

        for (hook in hooks) {
            val result =
                withContext(Dispatchers.IO) {
                    packageManager.runToolPkgMainHook(
                        containerPackageName = hook.containerPackageName,
                        functionName = hook.functionName,
                        event = hook.event,
                        pluginId = hook.hookId,
                        inlineFunctionSource = hook.functionSource,
                        eventPayload =
                            mapOf(
                                "extras" to params.extras
                            )
                    )
                }
            result.onFailure { error ->
                AppLogger.e(
                    TAG,
                    "ToolPkg app lifecycle hook failed: ${hook.containerPackageName}:${hook.hookId}",
                    error
                )
            }
        }
    }

    fun syncToolPkgRegistrations(activeContainers: List<ToolPkgContainerRuntime>) {
        hooksByEvent =
            activeContainers.flatMap { runtime ->
                runtime.appLifecycleHooks.mapNotNull { hook ->
                    val normalizedEvent = hook.event.trim().lowercase()
                    if (normalizedEvent.isBlank()) {
                        null
                    } else {
                        ToolPkgAppLifecycleHookRegistration(
                            containerPackageName = runtime.packageName,
                            hookId = hook.id,
                            event = hook.event,
                            functionName = hook.function,
                            functionSource = hook.functionSource
                        )
                    }
                }
            }
                .groupBy { hook -> hook.event.trim().lowercase() }
                .mapValues { (_, hooks) ->
                    hooks.sortedWith(
                        compareBy(
                            ToolPkgAppLifecycleHookRegistration::containerPackageName,
                            ToolPkgAppLifecycleHookRegistration::hookId
                        )
                    )
                }
    }
}

object ToolboxPlugin : OperitPlugin {
    override val id: String = "builtin.toolbox"
    private val installed = AtomicBoolean(false)
    private val runtimeChangeListener =
        PackageManager.ToolPkgRuntimeChangeListener {
            val context = OperitApplication.instance.applicationContext
            val packageManager = PackageManager.getInstance(context, AIToolHandler.getInstance(context))
            ToolPkgAppLifecycleHookPlugin.syncToolPkgRegistrations(
                packageManager.getEnabledToolPkgContainerRuntimes()
            )
        }

    override fun register() {
        if (!installed.compareAndSet(false, true)) {
            return
        }
        AppLifecycleHookPluginRegistry.register(ToolPkgAppLifecycleHookPlugin)

        val context = OperitApplication.instance.applicationContext
        val packageManager = PackageManager.getInstance(context, AIToolHandler.getInstance(context))
        packageManager.addToolPkgRuntimeChangeListener(runtimeChangeListener)
    }
}
