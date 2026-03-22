package com.ai.assistance.operit.core.tools.agent

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.ai.assistance.operit.provider.IUiAutomationService
import com.ai.assistance.operit.core.tools.UiAutomatorBridge
import com.ai.assistance.operit.util.AppLogger

class UiAutoBinderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_UIAUTO_BINDER_READY) {
            return
        }
        val bundle = intent.extras
        val binder = bundle?.getBinder("binder")
        if (binder != null) {
            val service = IUiAutomationService.Stub.asInterface(binder)
            val alive = service?.asBinder()?.isBinderAlive == true
            AppLogger.d(TAG, "onReceive: UiAutomationService=$service alive=$alive")
            UiAutomatorBridge.uiAutomationService = service
        } else {
            AppLogger.e(TAG, "onReceive: Binder not found in Intent extras")
        }
    }

    companion object {
        private const val TAG = "UiAutoBinderReceiver"
        const val ACTION_UIAUTO_BINDER_READY = "com.ai.assistance.operit.action.UIAUTO_BINDER_READY"
    }
}
