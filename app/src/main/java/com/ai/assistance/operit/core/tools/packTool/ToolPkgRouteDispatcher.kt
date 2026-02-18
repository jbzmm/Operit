package com.ai.assistance.operit.core.tools.packTool

import com.ai.assistance.operit.util.AppLogger
import java.util.concurrent.atomic.AtomicReference

internal object ToolPkgRouteDispatcher {
    private const val TAG = "ToolPkgRouteDispatcher"
    private val navigatorRef = AtomicReference<((String, String) -> Boolean)?>(null)

    fun registerNavigator(navigator: ((String, String) -> Boolean)?) {
        navigatorRef.set(navigator)
    }

    fun dispatch(routeId: String, argsJson: String): Boolean {
        val navigator = navigatorRef.get() ?: return false
        return try {
            navigator.invoke(routeId, argsJson)
        } catch (e: Exception) {
            AppLogger.e(TAG, "Route dispatch failed: routeId=$routeId", e)
            false
        }
    }
}
