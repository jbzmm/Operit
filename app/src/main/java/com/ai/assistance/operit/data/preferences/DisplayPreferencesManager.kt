package com.ai.assistance.operit.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

// DataStore 实例
private val Context.displayPreferencesDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "display_preferences"
)

/**
 * DisplayPreferencesManager
 * 管理消息显示相关的偏好设置
 * 这些设置独立于角色卡和主题系统
 * 使用单例模式，避免重复创建实例
 */
class DisplayPreferencesManager private constructor(private val context: Context) {

    companion object {
        @Volatile
        private var INSTANCE: DisplayPreferencesManager? = null

        fun getInstance(context: Context): DisplayPreferencesManager {
            return INSTANCE ?: synchronized(this) {
                val instance = DisplayPreferencesManager(context.applicationContext)
                INSTANCE = instance
                instance
            }
        }

        // 消息显示设置的 Key
        private val KEY_SHOW_MODEL_PROVIDER = booleanPreferencesKey("show_model_provider")
        private val KEY_SHOW_MODEL_NAME = booleanPreferencesKey("show_model_name")
        private val KEY_SHOW_ROLE_NAME = booleanPreferencesKey("show_role_name")
        private val KEY_SHOW_USER_NAME = booleanPreferencesKey("show_user_name")
        
        // 全局用户设置的 Key
        private val KEY_GLOBAL_USER_AVATAR_URI = stringPreferencesKey("global_user_avatar_uri")
        private val KEY_GLOBAL_USER_NAME = stringPreferencesKey("global_user_name")
        
        // 显示相关设置的 Key
        private val KEY_SHOW_FPS_COUNTER = booleanPreferencesKey("show_fps_counter")
        private val KEY_ENABLE_REPLY_NOTIFICATION = booleanPreferencesKey("enable_reply_notification")
    }

    /**
     * 是否显示模型供应商
     * 默认值：false
     */
    val showModelProvider: Flow<Boolean> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_SHOW_MODEL_PROVIDER] ?: false
        }

    /**
     * 是否显示模型名称
     * 默认值：false
     */
    val showModelName: Flow<Boolean> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_SHOW_MODEL_NAME] ?: false
        }

    /**
     * 是否显示角色卡名称
     * 默认值：false
     */
    val showRoleName: Flow<Boolean> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_SHOW_ROLE_NAME] ?: false
        }

    /**
     * 是否显示用户名字
     * 默认值：false
     */
    val showUserName: Flow<Boolean> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_SHOW_USER_NAME] ?: false
        }

    /**
     * 全局用户头像URI
     */
    val globalUserAvatarUri: Flow<String?> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_GLOBAL_USER_AVATAR_URI]
        }

    /**
     * 全局用户名称
     */
    val globalUserName: Flow<String?> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_GLOBAL_USER_NAME]
        }

    /**
     * 是否显示FPS计数器
     * 默认值：false
     */
    val showFpsCounter: Flow<Boolean> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_SHOW_FPS_COUNTER] ?: false
        }

    /**
     * 是否启用回复通知
     * 默认值：true
     */
    val enableReplyNotification: Flow<Boolean> =
        context.displayPreferencesDataStore.data.map { preferences ->
            preferences[KEY_ENABLE_REPLY_NOTIFICATION] ?: true
        }

    /**
     * 保存显示设置
     */
    suspend fun saveDisplaySettings(
        showModelProvider: Boolean? = null,
        showModelName: Boolean? = null,
        showRoleName: Boolean? = null,
        showUserName: Boolean? = null,
        globalUserAvatarUri: String? = null,
        globalUserName: String? = null,
        showFpsCounter: Boolean? = null,
        enableReplyNotification: Boolean? = null
    ) {
        context.displayPreferencesDataStore.edit { preferences ->
            showModelProvider?.let { preferences[KEY_SHOW_MODEL_PROVIDER] = it }
            showModelName?.let { preferences[KEY_SHOW_MODEL_NAME] = it }
            showRoleName?.let { preferences[KEY_SHOW_ROLE_NAME] = it }
            showUserName?.let { preferences[KEY_SHOW_USER_NAME] = it }
            globalUserAvatarUri?.let { preferences[KEY_GLOBAL_USER_AVATAR_URI] = it }
            globalUserName?.let { preferences[KEY_GLOBAL_USER_NAME] = it }
            showFpsCounter?.let { preferences[KEY_SHOW_FPS_COUNTER] = it }
            enableReplyNotification?.let { preferences[KEY_ENABLE_REPLY_NOTIFICATION] = it }
        }
    }

    /**
     * 重置所有显示设置为默认值
     */
    suspend fun resetDisplaySettings() {
        context.displayPreferencesDataStore.edit { preferences ->
            preferences[KEY_SHOW_MODEL_PROVIDER] = false
            preferences[KEY_SHOW_MODEL_NAME] = false
            preferences[KEY_SHOW_ROLE_NAME] = false
            preferences[KEY_SHOW_USER_NAME] = false
            preferences.remove(KEY_GLOBAL_USER_AVATAR_URI)
            preferences.remove(KEY_GLOBAL_USER_NAME)
            preferences[KEY_SHOW_FPS_COUNTER] = false
            preferences[KEY_ENABLE_REPLY_NOTIFICATION] = true
        }
    }
}
