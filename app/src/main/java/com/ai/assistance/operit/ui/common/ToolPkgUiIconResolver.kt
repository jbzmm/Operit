package com.ai.assistance.operit.ui.common

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.AudioFile
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.ScreenshotMonitor
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Token
import androidx.compose.material.icons.filled.Tune
import androidx.compose.ui.graphics.vector.ImageVector

object ToolPkgUiIconResolver {
    fun resolve(icon: String): ImageVector {
        return when (icon.trim().lowercase()) {
            "memory" -> Icons.Default.Memory
            "history", "clock", "time" -> Icons.Default.History
            "settings", "setting", "gear", "cog" -> Icons.Default.Settings
            "tune", "sliders", "slider", "adjust" -> Icons.Default.Tune
            "build", "tool", "tools", "wrench" -> Icons.Default.Build
            "apps", "grid", "dashboard" -> Icons.Default.Apps
            "cloud" -> Icons.Default.Cloud
            "storage", "database", "db" -> Icons.Default.Storage
            "description", "file", "document", "doc" -> Icons.Default.Description
            "terminal", "console" -> Icons.Default.Terminal
            "token", "key" -> Icons.Default.Token
            "workflow", "tree", "flow" -> Icons.Default.AccountTree
            "chat", "message" -> Icons.Default.Chat
            "email", "mail" -> Icons.Default.Email
            "person", "user", "profile" -> Icons.Default.Person
            "image", "photo", "picture" -> Icons.Default.Image
            "audio", "music", "sound" -> Icons.Default.AudioFile
            "camera" -> Icons.Default.PhotoCamera
            "screen", "screenshot" -> Icons.Default.ScreenshotMonitor
            "notification", "notifications" -> Icons.Default.Notifications
            "location", "map", "gps" -> Icons.Default.LocationOn
            else -> Icons.Default.Extension
        }
    }
}
