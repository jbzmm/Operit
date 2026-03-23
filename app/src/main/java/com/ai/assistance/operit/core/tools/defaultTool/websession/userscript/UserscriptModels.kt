package com.ai.assistance.operit.core.tools.defaultTool.websession.userscript

import kotlinx.serialization.Serializable

internal enum class UserscriptRunAt(val rawValue: String) {
    DOCUMENT_START("document-start"),
    DOCUMENT_END("document-end"),
    DOCUMENT_IDLE("document-idle");

    companion object {
        fun fromRaw(raw: String?): UserscriptRunAt =
            entries.firstOrNull { it.rawValue.equals(raw?.trim(), ignoreCase = true) }
                ?: DOCUMENT_END
    }
}

internal enum class UserscriptInstallSourceType {
    LOCAL_FILE,
    REMOTE_URL,
    PAGE_LINK,
    UPDATE,
    TOOL_INPUT
}

@Serializable
internal data class UserscriptRequireEntry(
    val url: String
)

@Serializable
internal data class UserscriptResourceEntry(
    val name: String,
    val url: String
)

@Serializable
internal data class ParsedUserscriptMetadata(
    val name: String,
    val namespace: String? = null,
    val version: String = "0",
    val description: String? = null,
    val author: String? = null,
    val homepage: String? = null,
    val downloadUrl: String? = null,
    val updateUrl: String? = null,
    val runAt: UserscriptRunAt = UserscriptRunAt.DOCUMENT_END,
    val grants: List<String> = emptyList(),
    val matches: List<String> = emptyList(),
    val includes: List<String> = emptyList(),
    val excludes: List<String> = emptyList(),
    val excludeMatches: List<String> = emptyList(),
    val connects: List<String> = emptyList(),
    val requires: List<UserscriptRequireEntry> = emptyList(),
    val resources: List<UserscriptResourceEntry> = emptyList(),
    val noFrames: Boolean = false,
    val metadataBlock: String = ""
)

internal data class UserscriptInstallPreview(
    val metadata: ParsedUserscriptMetadata,
    val rawSource: String,
    val sourceType: UserscriptInstallSourceType,
    val sourceUrl: String? = null,
    val sourceDisplay: String? = null,
    val supportedGrants: List<String> = emptyList(),
    val unsupportedGrants: List<String> = emptyList(),
    val isUpdate: Boolean = false,
    val existingScriptId: Long? = null
)

@Serializable
internal data class UserscriptBootstrapPayload(
    val scripts: List<UserscriptExecutionPayload> = emptyList()
)

@Serializable
internal data class UserscriptExecutionPayload(
    val scriptId: Long,
    val name: String,
    val namespace: String? = null,
    val version: String,
    val runAt: String,
    val grants: List<String>,
    val metadataJson: String,
    val code: String,
    val requires: List<String>,
    val values: Map<String, String>,
    val resources: Map<String, UserscriptResourcePayload>
)

@Serializable
internal data class UserscriptResourcePayload(
    val text: String? = null,
    val dataUrl: String? = null
)

internal data class UserscriptListItem(
    val id: Long,
    val name: String,
    val namespace: String?,
    val version: String,
    val description: String?,
    val sourceDisplay: String?,
    val enabled: Boolean,
    val unsupportedGrants: List<String>,
    val grants: List<String>,
    val matches: List<String>,
    val includes: List<String>,
    val excludes: List<String>,
    val excludeMatches: List<String>,
    val connects: List<String>,
    val requires: List<UserscriptRequireEntry>,
    val resources: List<UserscriptResourceEntry>,
    val homepage: String?,
    val sourceUrl: String?,
    val updateUrl: String?,
    val downloadUrl: String?,
    val installedAt: Long,
    val updatedAt: Long
)

internal data class UserscriptLogItem(
    val id: Long,
    val userscriptId: Long?,
    val level: String,
    val message: String,
    val pageUrl: String?,
    val createdAt: Long
)

internal data class UserscriptPageMenuCommand(
    val commandId: String,
    val title: String,
    val userscriptId: Long
)

internal data class UserscriptSupportState(
    val isSupported: Boolean,
    val reason: String? = null
)

internal enum class UserscriptPageRuntimeState {
    DISABLED,
    UNSUPPORTED,
    NOT_MATCHED,
    QUEUED,
    RUNNING,
    SUCCESS,
    ERROR
}

internal data class UserscriptPageRuntimeStatus(
    val state: UserscriptPageRuntimeState,
    val detail: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)
