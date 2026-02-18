package com.ai.assistance.operit.core.tools.javascript

import android.content.Context
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.util.Base64
import androidx.sqlite.db.SimpleSQLiteQuery
import com.ai.assistance.operit.core.tools.AIToolHandler
import com.ai.assistance.operit.core.tools.packTool.PackageManager
import com.ai.assistance.operit.core.tools.packTool.ToolPkgRouteDispatcher
import com.ai.assistance.operit.data.db.AppDatabase
import com.ai.assistance.operit.data.model.AITool
import com.ai.assistance.operit.data.model.ToolParameter
import com.ai.assistance.operit.data.preferences.UserPreferencesManager
import com.ai.assistance.operit.data.preferences.EnvPreferences
import com.ai.assistance.operit.util.AppLogger
import com.ai.assistance.operit.util.OperitPaths
import java.io.ByteArrayOutputStream
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import kotlinx.serialization.json.contentOrNull
import org.json.JSONArray
import org.json.JSONObject

internal object JsNativeInterfaceDelegates {
    private const val TAG = "JsNativeInterface"
    private const val TOOLPKG_DATASTORE_PREFS = "toolpkg_datastore_v1"

    fun setEnv(context: Context, key: String, value: String?) {
        try {
            val name = key.trim()
            if (name.isEmpty()) {
                return
            }
            val normalized = value?.trim().orEmpty()
            val envPreferences = EnvPreferences.getInstance(context)
            if (normalized.isBlank()) {
                envPreferences.removeEnv(name)
            } else {
                envPreferences.setEnv(name, normalized)
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Error writing environment variable from JS: $key", e)
        }
    }

    fun setEnvs(context: Context, valuesJson: String) {
        try {
            if (valuesJson.isBlank()) {
                return
            }
            val payload = JSONObject(valuesJson)
            val envPreferences = EnvPreferences.getInstance(context)
            payload.keys().forEach { rawKey ->
                val key = rawKey.trim()
                if (key.isEmpty()) {
                    return@forEach
                }
                val normalized = payload.opt(rawKey)?.toString()?.trim().orEmpty()
                if (normalized.isBlank()) {
                    envPreferences.removeEnv(key)
                } else {
                    envPreferences.setEnv(key, normalized)
                }
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Error batch-writing environment variables from JS", e)
        }
    }

    fun isPackageImported(packageManager: PackageManager, packageName: String): Boolean {
        return try {
            val name = packageName.trim()
            if (name.isBlank()) {
                false
            } else {
                packageManager.isPackageImported(name)
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Error checking package imported from JS: $packageName", e)
            false
        }
    }

    fun importPackage(packageManager: PackageManager, packageName: String): String {
        return try {
            val name = packageName.trim()
            if (name.isBlank()) {
                "Package name is required"
            } else {
                packageManager.importPackage(name)
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Error importing package from JS: $packageName", e)
            "Error: ${e.message}"
        }
    }

    fun removePackage(packageManager: PackageManager, packageName: String): String {
        return try {
            val name = packageName.trim()
            if (name.isBlank()) {
                "Package name is required"
            } else {
                packageManager.removePackage(name)
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Error removing package from JS: $packageName", e)
            "Error: ${e.message}"
        }
    }

    fun usePackage(packageManager: PackageManager, packageName: String): String {
        return try {
            val name = packageName.trim()
            if (name.isBlank()) {
                "Package name is required"
            } else {
                packageManager.usePackage(name)
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Error using package from JS: $packageName", e)
            "Error: ${e.message}"
        }
    }

    fun listImportedPackagesJson(packageManager: PackageManager): String {
        return try {
            Json.encodeToString(
                ListSerializer(String.serializer()),
                packageManager.getImportedPackages()
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "Error listing imported packages from JS", e)
            "[]"
        }
    }

    fun resolveToolName(
        packageManager: PackageManager,
        packageName: String,
        subpackageId: String,
        toolName: String,
        preferImported: String
    ): String {
        return try {
            val normalizedTool = toolName.trim()
            if (normalizedTool.isBlank()) {
                return ""
            }
            if (normalizedTool.contains(":")) {
                return normalizedTool
            }

            val preferImportedBool = !preferImported.equals("false", ignoreCase = true)
            val packageCandidate = packageName.trim()
            val subpackageCandidate = subpackageId.trim()

            val resolvedPackageName =
                when {
                    packageCandidate.isNotBlank() ->
                        packageManager.findPreferredPackageNameForSubpackageId(
                            packageCandidate,
                            preferImported = preferImportedBool
                        ) ?: packageCandidate
                    subpackageCandidate.isNotBlank() ->
                        packageManager.findPreferredPackageNameForSubpackageId(
                            subpackageCandidate,
                            preferImported = preferImportedBool
                        ) ?: subpackageCandidate
                    else -> ""
                }

            if (resolvedPackageName.isBlank()) {
                normalizedTool
            } else {
                "$resolvedPackageName:$normalizedTool"
            }
        } catch (e: Exception) {
            AppLogger.e(
                TAG,
                "Error resolving tool name from JS: package=$packageName, subpackage=$subpackageId, tool=$toolName",
                e
            )
            toolName.trim()
        }
    }

    fun readToolPkgResource(
        packageManager: PackageManager,
        packageNameOrSubpackageId: String,
        resourceKey: String,
        outputFileName: String
    ): String {
        return try {
            val target = packageNameOrSubpackageId.trim()
            val key = resourceKey.trim()
            if (target.isBlank() || key.isBlank()) {
                return ""
            }

            val rawName =
                if (outputFileName.trim().isBlank()) {
                    packageManager.getToolPkgResourceOutputFileName(
                        packageNameOrSubpackageId = target,
                        resourceKey = key,
                        preferImportedContainer = true
                    ) ?: "$key.bin"
                } else {
                    outputFileName.trim()
                }
            val safeName =
                rawName.substringAfterLast('/').substringAfterLast('\\').ifBlank { "$key.bin" }

            val exportDir = OperitPaths.cleanOnExitDir()
            if (!exportDir.exists()) {
                exportDir.mkdirs()
            }
            val outputFile = File(exportDir, safeName)

            val copied =
                packageManager.copyToolPkgResourceToFile(target, key, outputFile) ||
                    packageManager.copyToolPkgResourceToFileBySubpackageId(
                        subpackageId = target,
                        resourceKey = key,
                        destinationFile = outputFile,
                        preferImportedContainer = true
                    )
            if (!copied) {
                ""
            } else {
                outputFile.absolutePath
            }
        } catch (e: Exception) {
            AppLogger.e(
                TAG,
                "Error reading toolpkg resource from JS: package/subpackage=$packageNameOrSubpackageId, resource=$resourceKey",
                e
            )
            ""
        }
    }

    fun readToolPkgTextResource(
        packageManager: PackageManager,
        packageNameOrSubpackageId: String,
        resourcePath: String
    ): String {
        return try {
            val target = packageNameOrSubpackageId.trim()
            val path = resourcePath.trim()
            if (target.isBlank() || path.isBlank()) {
                return ""
            }
            packageManager.readToolPkgTextResource(
                packageNameOrSubpackageId = target,
                resourcePath = path
            ) ?: ""
        } catch (e: Exception) {
            AppLogger.e(
                TAG,
                "Error reading toolpkg text resource from JS: package/subpackage=$packageNameOrSubpackageId, path=$resourcePath",
                e
            )
            ""
        }
    }

    fun listRouteExtensionsJson(
        packageManager: PackageManager
    ): String {
        return runCatching {
            val extensions = packageManager.getToolPkgRouteExtensions()
            val payload =
                buildJsonArray {
                    extensions.forEach { extension ->
                        add(
                            buildJsonObject {
                                put("containerPackageName", JsonPrimitive(extension.containerPackageName))
                                put("id", JsonPrimitive(extension.id))
                                put("uiModuleId", JsonPrimitive(extension.uiModuleId))
                                put("navGroup", JsonPrimitive(extension.navGroup))
                                put("order", JsonPrimitive(extension.order))
                                put("icon", JsonPrimitive(extension.icon))
                                put("runtime", JsonPrimitive(extension.runtime))
                                put("entry", JsonPrimitive(extension.entry))
                                put("title", JsonPrimitive(extension.title))
                            }
                        )
                    }
                }
            jsonEncode(payload)
        }.getOrElse { error ->
            AppLogger.e(TAG, "Failed to list route extensions", error)
            "[]"
        }
    }

    fun listAttachmentExtensionsJson(
        packageManager: PackageManager
    ): String {
        return runCatching {
            val extensions = packageManager.getToolPkgAttachmentExtensions()
            val payload =
                buildJsonArray {
                    extensions.forEach { extension ->
                        add(
                            buildJsonObject {
                                put("containerPackageName", JsonPrimitive(extension.containerPackageName))
                                put("id", JsonPrimitive(extension.id))
                                put("title", JsonPrimitive(extension.title))
                                put("icon", JsonPrimitive(extension.icon))
                                put("handler", JsonPrimitive(extension.handler))
                            }
                        )
                    }
                }
            jsonEncode(payload)
        }.getOrElse { error ->
            AppLogger.e(TAG, "Failed to list attachment extensions", error)
            "[]"
        }
    }

    fun listChatSettingBarExtensionsJson(
        packageManager: PackageManager
    ): String {
        return runCatching {
            val extensions = packageManager.getToolPkgChatSettingBarExtensions()
            val payload =
                buildJsonArray {
                    extensions.forEach { extension ->
                        add(
                            buildJsonObject {
                                put("containerPackageName", JsonPrimitive(extension.containerPackageName))
                                put("id", JsonPrimitive(extension.id))
                                put("title", JsonPrimitive(extension.title))
                                put("icon", JsonPrimitive(extension.icon))
                                put("handler", JsonPrimitive(extension.handler))
                            }
                        )
                    }
                }
            jsonEncode(payload)
        }.getOrElse { error ->
            AppLogger.e(TAG, "Failed to list chat setting bar extensions", error)
            "[]"
        }
    }

    fun listChatHookExtensionsJson(
        packageManager: PackageManager,
        event: String
    ): String {
        return runCatching {
            val normalizedEvent = event.trim()
            val extensions =
                if (normalizedEvent.isBlank()) {
                    packageManager.getToolPkgChatHookExtensions()
                } else {
                    packageManager.getToolPkgChatHookExtensions(normalizedEvent)
                }
            val payload =
                buildJsonArray {
                    extensions.forEach { extension ->
                        add(
                            buildJsonObject {
                                put("containerPackageName", JsonPrimitive(extension.containerPackageName))
                                put("id", JsonPrimitive(extension.id))
                                put("event", JsonPrimitive(extension.event))
                                put("handler", JsonPrimitive(extension.handler))
                            }
                        )
                    }
                }
            jsonEncode(payload)
        }.getOrElse { error ->
            AppLogger.e(TAG, "Failed to list chat hook extensions", error)
            "[]"
        }
    }

    fun getActiveProfileId(context: Context): String {
        return getActiveProfileIdInternal(context)
    }

    fun navigateToRoute(
        packageManager: PackageManager,
        routeId: String,
        argsJson: String
    ): String {
        return try {
            val id = routeId.trim()
            if (id.isBlank()) {
                return jsonError("routeId is required")
            }

            val matchedRoute =
                packageManager.getToolPkgRouteExtensions()
                    .firstOrNull { it.id.equals(id, ignoreCase = true) }
                    ?: return jsonError("Route extension not found: $id")

            val dispatched = ToolPkgRouteDispatcher.dispatch(id, argsJson)
            if (!dispatched) {
                return jsonError(
                    "Route dispatch is not connected for '$id' (module=${matchedRoute.uiModuleId})"
                )
            }

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(true))
                    put("routeId", JsonPrimitive(id))
                    put("uiModuleId", JsonPrimitive(matchedRoute.uiModuleId))
                    put("containerPackageName", JsonPrimitive(matchedRoute.containerPackageName))
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "Failed to navigate to route: $routeId", e)
            jsonError("Failed to navigate to route: ${e.message}")
        }
    }

    fun triggerAttachmentEntry(
        context: Context,
        packageManager: PackageManager,
        entryId: String,
        payloadJson: String
    ): String {
        return try {
            val id = entryId.trim()
            if (id.isBlank()) {
                return jsonError("entryId is required")
            }

            val entry =
                packageManager.getToolPkgAttachmentExtensions()
                    .firstOrNull { it.id.equals(id, ignoreCase = true) }
                    ?: return jsonError("Attachment entry not found: $id")

            executeExtensionHandler(
                context = context,
                handler = entry.handler,
                payloadJson = payloadJson
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "Failed to trigger attachment entry: $entryId", e)
            jsonError("Failed to trigger attachment entry: ${e.message}")
        }
    }

    fun triggerChatSettingBarEntry(
        context: Context,
        packageManager: PackageManager,
        entryId: String,
        payloadJson: String
    ): String {
        return try {
            val id = entryId.trim()
            if (id.isBlank()) {
                return jsonError("entryId is required")
            }

            val entry =
                packageManager.getToolPkgChatSettingBarExtensions()
                    .firstOrNull { it.id.equals(id, ignoreCase = true) }
                    ?: return jsonError("Chat setting bar entry not found: $id")

            executeExtensionHandler(
                context = context,
                handler = entry.handler,
                payloadJson = payloadJson
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "Failed to trigger chat setting bar entry: $entryId", e)
            jsonError("Failed to trigger chat setting bar entry: ${e.message}")
        }
    }

    fun datastoreGet(context: Context, namespace: String, key: String): String {
        return try {
            val normalizedNamespace = namespace.trim()
            val normalizedKey = key.trim()
            if (normalizedNamespace.isBlank() || normalizedKey.isBlank()) {
                return jsonError("namespace and key are required")
            }

            val profileId = getActiveProfileIdInternal(context)
            val storageKey = buildDatastoreKey(profileId, normalizedNamespace, normalizedKey)
            val prefs = context.getSharedPreferences(TOOLPKG_DATASTORE_PREFS, Context.MODE_PRIVATE)
            val rawValue = prefs.getString(storageKey, null)

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(true))
                    put("profileId", JsonPrimitive(profileId))
                    put("namespace", JsonPrimitive(normalizedNamespace))
                    put("key", JsonPrimitive(normalizedKey))
                    put("found", JsonPrimitive(rawValue != null))
                    put("value", parseStoredJsonOrNull(rawValue))
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "datastoreGet failed: namespace=$namespace key=$key", e)
            jsonError("datastoreGet failed: ${e.message}")
        }
    }

    fun datastoreSet(context: Context, namespace: String, key: String, valueJson: String): String {
        return try {
            val normalizedNamespace = namespace.trim()
            val normalizedKey = key.trim()
            if (normalizedNamespace.isBlank() || normalizedKey.isBlank()) {
                return jsonError("namespace and key are required")
            }

            val profileId = getActiveProfileIdInternal(context)
            val storageKey = buildDatastoreKey(profileId, normalizedNamespace, normalizedKey)
            val normalizedValue = valueJson.trim().ifBlank { "null" }
            context.getSharedPreferences(TOOLPKG_DATASTORE_PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(storageKey, normalizedValue)
                .apply()

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(true))
                    put("profileId", JsonPrimitive(profileId))
                    put("namespace", JsonPrimitive(normalizedNamespace))
                    put("key", JsonPrimitive(normalizedKey))
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "datastoreSet failed: namespace=$namespace key=$key", e)
            jsonError("datastoreSet failed: ${e.message}")
        }
    }

    fun datastoreBatchSet(context: Context, namespace: String, entriesJson: String): String {
        return try {
            val normalizedNamespace = namespace.trim()
            if (normalizedNamespace.isBlank()) {
                return jsonError("namespace is required")
            }
            if (entriesJson.isBlank()) {
                return jsonError("entriesJson is required")
            }

            val payload = JSONObject(entriesJson)
            val profileId = getActiveProfileIdInternal(context)
            val prefs = context.getSharedPreferences(TOOLPKG_DATASTORE_PREFS, Context.MODE_PRIVATE)
            val editor = prefs.edit()
            var count = 0
            payload.keys().forEach { rawKey ->
                val normalizedKey = rawKey.trim()
                if (normalizedKey.isBlank()) {
                    return@forEach
                }
                val storageKey = buildDatastoreKey(profileId, normalizedNamespace, normalizedKey)
                val rawValue = payload.opt(rawKey)
                editor.putString(storageKey, normalizeJsonLiteral(rawValue))
                count += 1
            }
            editor.apply()

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(true))
                    put("profileId", JsonPrimitive(profileId))
                    put("namespace", JsonPrimitive(normalizedNamespace))
                    put("count", JsonPrimitive(count))
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "datastoreBatchSet failed: namespace=$namespace", e)
            jsonError("datastoreBatchSet failed: ${e.message}")
        }
    }

    fun datastoreObserve(context: Context, namespace: String, keysJson: String): String {
        return try {
            val normalizedNamespace = namespace.trim()
            if (normalizedNamespace.isBlank()) {
                return jsonError("namespace is required")
            }

            val profileId = getActiveProfileIdInternal(context)
            val prefix = buildDatastoreNamespacePrefix(profileId, normalizedNamespace)
            val prefs = context.getSharedPreferences(TOOLPKG_DATASTORE_PREFS, Context.MODE_PRIVATE)
            val requestedKeys = parseRequestedDatastoreKeys(keysJson)

            val values =
                buildJsonObject {
                    if (requestedKeys.isEmpty()) {
                        prefs.all.entries.forEach { (storageKey, value) ->
                            if (!storageKey.startsWith(prefix)) {
                                return@forEach
                            }
                            val key = storageKey.removePrefix(prefix)
                            val raw = value as? String
                            put(key, parseStoredJsonOrNull(raw))
                        }
                    } else {
                        requestedKeys.forEach { key ->
                            val storageKey = buildDatastoreKey(profileId, normalizedNamespace, key)
                            val raw = prefs.getString(storageKey, null)
                            put(key, parseStoredJsonOrNull(raw))
                        }
                    }
                }

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(true))
                    put("profileId", JsonPrimitive(profileId))
                    put("namespace", JsonPrimitive(normalizedNamespace))
                    put("values", values)
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "datastoreObserve failed: namespace=$namespace", e)
            jsonError("datastoreObserve failed: ${e.message}")
        }
    }

    fun datastoreSqlQuery(context: Context, sql: String, paramsJson: String): String {
        return try {
            val statement = sql.trim()
            if (statement.isBlank()) {
                return jsonError("sql is required")
            }
            val database = AppDatabase.getDatabase(context).openHelper.writableDatabase
            val args = parseSqlParams(paramsJson)
            val query = if (args.isEmpty()) SimpleSQLiteQuery(statement) else SimpleSQLiteQuery(statement, args)
            val payload = database.query(query).use { cursor -> buildQueryPayload(cursor) }

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(true))
                    put("result", payload)
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "datastoreSqlQuery failed", e)
            jsonError("datastoreSqlQuery failed: ${e.message}")
        }
    }

    fun datastoreSqlExecute(context: Context, sql: String, paramsJson: String): String {
        return try {
            val statement = sql.trim()
            if (statement.isBlank()) {
                return jsonError("sql is required")
            }
            val database = AppDatabase.getDatabase(context).openHelper.writableDatabase
            val args = parseSqlParams(paramsJson)
            if (args.isEmpty()) {
                database.execSQL(statement)
            } else {
                database.execSQL(statement, args)
            }

            val changes = querySingleLong(database, "SELECT changes()") ?: 0L
            val lastInsertRowId = querySingleLong(database, "SELECT last_insert_rowid()")

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(true))
                    put(
                        "result",
                        buildJsonObject {
                            put("changes", JsonPrimitive(changes))
                            if (lastInsertRowId != null) {
                                put("lastInsertRowId", JsonPrimitive(lastInsertRowId))
                            } else {
                                put("lastInsertRowId", JsonNull)
                            }
                        }
                    )
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "datastoreSqlExecute failed", e)
            jsonError("datastoreSqlExecute failed: ${e.message}")
        }
    }

    fun datastoreSqlTransaction(context: Context, operationsJson: String): String {
        return try {
            if (operationsJson.isBlank()) {
                return jsonError("operationsJson is required")
            }
            val operationsElement = Json.parseToJsonElement(operationsJson)
            val operations = operationsElement.jsonArray
            val database = AppDatabase.getDatabase(context).openHelper.writableDatabase

            database.beginTransaction()
            try {
                val results =
                    buildJsonArray {
                        operations.forEachIndexed { index, operationElement ->
                            val operation = operationElement.jsonObject
                            val type =
                                operation["type"]?.jsonPrimitive?.contentOrNull
                                    ?.trim()
                                    ?.lowercase()
                                    .orEmpty()
                                    .ifBlank { "execute" }
                            val statement =
                                operation["sql"]?.jsonPrimitive?.contentOrNull
                                    ?.trim()
                                    .orEmpty()
                            if (statement.isBlank()) {
                                throw IllegalArgumentException("sql is required at operations[$index]")
                            }
                            val args = parseSqlParamsElement(operation["params"])

                            val opResult =
                                when (type) {
                                    "query" -> buildQueryPayload(database.query(simpleQuery(statement, args)))
                                    "execute" -> {
                                        if (args.isEmpty()) {
                                            database.execSQL(statement)
                                        } else {
                                            database.execSQL(statement, args)
                                        }
                                        buildJsonObject {
                                            put("changes", JsonPrimitive(querySingleLong(database, "SELECT changes()") ?: 0L))
                                            val lastInsertRowId =
                                                querySingleLong(database, "SELECT last_insert_rowid()")
                                            if (lastInsertRowId != null) {
                                                put("lastInsertRowId", JsonPrimitive(lastInsertRowId))
                                            } else {
                                                put("lastInsertRowId", JsonNull)
                                            }
                                        }
                                    }
                                    else -> throw IllegalArgumentException("Unsupported operation type '$type' at operations[$index]")
                                }

                            add(
                                buildJsonObject {
                                    put("index", JsonPrimitive(index))
                                    put("type", JsonPrimitive(type))
                                    put("result", opResult)
                                }
                            )
                        }
                    }

                database.setTransactionSuccessful()

                jsonEncode(
                    buildJsonObject {
                        put("success", JsonPrimitive(true))
                        put("results", results)
                    }
                )
            } finally {
                database.endTransaction()
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "datastoreSqlTransaction failed", e)
            jsonError("datastoreSqlTransaction failed: ${e.message}")
        }
    }

    private fun executeExtensionHandler(
        context: Context,
        handler: String,
        payloadJson: String
    ): String {
        return try {
            val toolName = handler.trim()
            if (toolName.isBlank()) {
                return jsonError("handler is required")
            }
            val parameters = parseToolParameters(payloadJson)
            val result =
                AIToolHandler.getInstance(context)
                    .executeTool(
                        AITool(
                            name = toolName,
                            parameters = parameters
                        )
                    )

            val dataElement =
                runCatching {
                    Json.parseToJsonElement(result.result.toJson())
                }.getOrElse {
                    JsonPrimitive(result.result.toString())
                }

            jsonEncode(
                buildJsonObject {
                    put("success", JsonPrimitive(result.success))
                    put("toolName", JsonPrimitive(result.toolName))
                    put("data", dataElement)
                    if (result.error.isNullOrBlank()) {
                        put("error", JsonNull)
                    } else {
                        put("error", JsonPrimitive(result.error))
                    }
                }
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "Failed to execute extension handler: $handler", e)
            jsonError("Failed to execute extension handler: ${e.message}")
        }
    }

    private fun parseToolParameters(payloadJson: String): List<ToolParameter> {
        if (payloadJson.isBlank()) {
            return emptyList()
        }
        val payload = JSONObject(payloadJson)
        val parameters = mutableListOf<ToolParameter>()
        payload.keys().forEach { rawKey ->
            val key = rawKey.trim()
            if (key.isBlank()) {
                return@forEach
            }
            val rawValue = payload.opt(rawKey)
            val value =
                when (rawValue) {
                    null,
                    JSONObject.NULL -> ""
                    is JSONObject,
                    is JSONArray -> rawValue.toString()
                    else -> rawValue.toString()
                }
            parameters.add(ToolParameter(name = key, value = value))
        }
        return parameters
    }

    private fun parseRequestedDatastoreKeys(keysJson: String): List<String> {
        if (keysJson.isBlank()) {
            return emptyList()
        }
        return runCatching {
            val parsed = JSONArray(keysJson)
            buildList {
                for (index in 0 until parsed.length()) {
                    val key = parsed.optString(index).trim()
                    if (key.isNotBlank()) {
                        add(key)
                    }
                }
            }
        }.getOrDefault(emptyList())
    }

    private fun normalizeJsonLiteral(value: Any?): String {
        return when (value) {
            null,
            JSONObject.NULL -> "null"
            is JSONObject,
            is JSONArray -> value.toString()
            is String -> JSONObject.quote(value)
            is Number,
            is Boolean -> value.toString()
            else -> JSONObject.wrap(value)?.toString() ?: "null"
        }
    }

    private fun parseStoredJsonOrNull(raw: String?): JsonElement {
        if (raw.isNullOrBlank()) {
            return JsonNull
        }
        return runCatching { Json.parseToJsonElement(raw) }
            .getOrElse { JsonPrimitive(raw) }
    }

    private fun getActiveProfileIdInternal(context: Context): String {
        return runCatching {
            runBlocking {
                UserPreferencesManager.getInstance(context).activeProfileIdFlow.first()
            }.trim().ifBlank { "default" }
        }.getOrElse { "default" }
    }

    private fun buildDatastoreNamespacePrefix(profileId: String, namespace: String): String {
        return "$profileId::$namespace::"
    }

    private fun buildDatastoreKey(profileId: String, namespace: String, key: String): String {
        return "${buildDatastoreNamespacePrefix(profileId, namespace)}$key"
    }

    private fun parseSqlParams(paramsJson: String): Array<Any?> {
        if (paramsJson.isBlank()) {
            return emptyArray()
        }
        val element = Json.parseToJsonElement(paramsJson)
        return parseSqlParamsElement(element)
    }

    private fun parseSqlParamsElement(paramsElement: JsonElement?): Array<Any?> {
        if (paramsElement == null) {
            return emptyArray()
        }
        val array = paramsElement as? JsonArray ?: return emptyArray()
        return array.map { element -> toSqlBindArg(element) }.toTypedArray()
    }

    private fun toSqlBindArg(element: JsonElement): Any? {
        if (element is JsonNull) {
            return null
        }
        val primitive = element as? JsonPrimitive ?: return element.toString()
        if (primitive.isString) {
            return primitive.content
        }
        primitive.booleanOrNull?.let { return if (it) 1 else 0 }
        primitive.longOrNull?.let { return it }
        primitive.doubleOrNull?.let { return it }
        return primitive.content
    }

    private fun simpleQuery(sql: String, args: Array<Any?>): SimpleSQLiteQuery {
        return if (args.isEmpty()) {
            SimpleSQLiteQuery(sql)
        } else {
            SimpleSQLiteQuery(sql, args)
        }
    }

    private fun buildQueryPayload(cursor: Cursor): JsonObject {
        cursor.use {
            val columnNames = it.columnNames
            val rows =
                buildJsonArray {
                    while (it.moveToNext()) {
                        add(
                            buildJsonArray {
                                for (index in columnNames.indices) {
                                    add(readCursorCellAsJson(it, index))
                                }
                            }
                        )
                    }
                }

            return buildJsonObject {
                putJsonArray("columns") {
                    columnNames.forEach { column -> add(JsonPrimitive(column)) }
                }
                put("rows", rows)
                put("rowCount", JsonPrimitive(rows.size))
            }
        }
    }

    private fun readCursorCellAsJson(cursor: Cursor, index: Int): JsonElement {
        return when (cursor.getType(index)) {
            Cursor.FIELD_TYPE_NULL -> JsonNull
            Cursor.FIELD_TYPE_INTEGER -> JsonPrimitive(cursor.getLong(index))
            Cursor.FIELD_TYPE_FLOAT -> JsonPrimitive(cursor.getDouble(index))
            Cursor.FIELD_TYPE_BLOB -> {
                val blob = cursor.getBlob(index)
                buildJsonObject {
                    put("type", JsonPrimitive("blob"))
                    put("size", JsonPrimitive(blob.size))
                    put("base64", JsonPrimitive(Base64.encodeToString(blob, Base64.NO_WRAP)))
                }
            }
            else -> JsonPrimitive(cursor.getString(index) ?: "")
        }
    }

    private fun querySingleLong(database: androidx.sqlite.db.SupportSQLiteDatabase, sql: String): Long? {
        return runCatching {
            database.query(sql).use { cursor ->
                if (cursor.moveToFirst()) {
                    cursor.getLong(0)
                } else {
                    null
                }
            }
        }.getOrNull()
    }

    private fun jsonError(message: String): String {
        return jsonEncode(
            buildJsonObject {
                put("success", JsonPrimitive(false))
                put("error", JsonPrimitive(message))
            }
        )
    }

    private fun jsonEncode(element: JsonElement): String {
        return Json.encodeToString(JsonElement.serializer(), element)
    }

    fun imageProcessing(
        callbackId: String,
        operation: String,
        argsJson: String,
        binaryDataRegistry: ConcurrentHashMap<String, ByteArray>,
        bitmapRegistry: ConcurrentHashMap<String, Bitmap>,
        binaryHandlePrefix: String,
        sendToolResult: (callbackId: String, result: String, isError: Boolean) -> Unit
    ) {
        Thread {
            try {
                val args = Json.decodeFromString(ListSerializer(JsonElement.serializer()), argsJson)
                val result: Any? =
                    when (operation.lowercase()) {
                        "read" -> {
                            AppLogger.d(TAG, "Entering 'read' operation in image_processing.")
                            val data = args[0].jsonPrimitive.content
                            val decodedBytes: ByteArray
                            if (data.startsWith(binaryHandlePrefix)) {
                                val handle = data.substring(binaryHandlePrefix.length)
                                AppLogger.d(TAG, "Reading image from binary handle: $handle")
                                decodedBytes =
                                    binaryDataRegistry.remove(handle)
                                        ?: throw Exception("Invalid or expired binary handle: $handle")
                            } else {
                                AppLogger.d(TAG, "Reading image from Base64 string.")
                                decodedBytes = Base64.decode(data, Base64.DEFAULT)
                            }
                            AppLogger.d(TAG, "Decoded data to ${decodedBytes.size} bytes.")

                            val bitmap =
                                BitmapFactory.decodeByteArray(
                                    decodedBytes,
                                    0,
                                    decodedBytes.size
                                )

                            if (bitmap == null) {
                                AppLogger.e(
                                    TAG,
                                    "BitmapFactory.decodeByteArray returned null. Throwing exception."
                                )
                                throw Exception(
                                    "Failed to decode image. The format may be unsupported or data is corrupt."
                                )
                            } else {
                                AppLogger.d(
                                    TAG,
                                    "BitmapFactory.decodeByteArray returned a non-null Bitmap."
                                )
                                AppLogger.d(TAG, "Bitmap dimensions: ${bitmap.width}x${bitmap.height}")
                                AppLogger.d(TAG, "Bitmap config: ${bitmap.config}")
                                val id = UUID.randomUUID().toString()
                                AppLogger.d(TAG, "Storing bitmap with ID: $id")
                                bitmapRegistry[id] = bitmap
                                id
                            }
                        }
                        "create" -> {
                            val width = args[0].jsonPrimitive.int
                            val height = args[1].jsonPrimitive.int
                            val bitmap =
                                Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                            val id = UUID.randomUUID().toString()
                            bitmapRegistry[id] = bitmap
                            id
                        }
                        "crop" -> {
                            val id = args[0].jsonPrimitive.content
                            AppLogger.d(TAG, "Attempting to crop bitmap with ID: $id")
                            val x = args[1].jsonPrimitive.int
                            val y = args[2].jsonPrimitive.int
                            val w = args[3].jsonPrimitive.int
                            val h = args[4].jsonPrimitive.int
                            val originalBitmap =
                                bitmapRegistry[id]
                                    ?: throw Exception("Source bitmap not found for crop (ID: $id)")
                            val croppedBitmap = Bitmap.createBitmap(originalBitmap, x, y, w, h)
                            val newId = UUID.randomUUID().toString()
                            bitmapRegistry[newId] = croppedBitmap
                            newId
                        }
                        "composite" -> {
                            val baseId = args[0].jsonPrimitive.content
                            val srcId = args[1].jsonPrimitive.content
                            AppLogger.d(
                                TAG,
                                "Attempting to composite with base ID: $baseId and src ID: $srcId"
                            )
                            val x = args[2].jsonPrimitive.int
                            val y = args[3].jsonPrimitive.int
                            val baseBitmap =
                                bitmapRegistry[baseId]
                                    ?: throw Exception(
                                        "Base bitmap not found for composite (ID: $baseId)"
                                    )
                            val srcBitmap =
                                bitmapRegistry[srcId]
                                    ?: throw Exception(
                                        "Source bitmap not found for composite (ID: $srcId)"
                                    )
                            val canvas = Canvas(baseBitmap)
                            canvas.drawBitmap(srcBitmap, x.toFloat(), y.toFloat(), null)
                            null
                        }
                        "getwidth" -> {
                            val id = args[0].jsonPrimitive.content
                            AppLogger.d(TAG, "Attempting to getWidth for bitmap with ID: $id")
                            bitmapRegistry[id]?.width
                                ?: throw Exception("Bitmap not found for getWidth (ID: $id)")
                        }
                        "getheight" -> {
                            val id = args[0].jsonPrimitive.content
                            AppLogger.d(TAG, "Attempting to getHeight for bitmap with ID: $id")
                            bitmapRegistry[id]?.height
                                ?: throw Exception("Bitmap not found for getHeight (ID: $id)")
                        }
                        "getbase64" -> {
                            val id = args[0].jsonPrimitive.content
                            AppLogger.d(TAG, "Attempting to getBase64 for bitmap with ID: $id")
                            val mime = args.getOrNull(1)?.jsonPrimitive?.content ?: "image/jpeg"
                            val bitmap =
                                bitmapRegistry[id]
                                    ?: throw Exception("Bitmap not found for getBase64 (ID: $id)")
                            val outputStream = ByteArrayOutputStream()
                            val format =
                                if (mime == "image/png") {
                                    Bitmap.CompressFormat.PNG
                                } else {
                                    Bitmap.CompressFormat.JPEG
                                }
                            bitmap.compress(format, 90, outputStream)
                            Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
                        }
                        "release" -> {
                            val id = args[0].jsonPrimitive.content
                            AppLogger.d(TAG, "Attempting to release bitmap with ID: $id")
                            bitmapRegistry.remove(id)?.recycle()
                            null
                        }
                        else -> throw IllegalArgumentException("Unknown image operation: $operation")
                    }
                val jsonResultElement =
                    when (result) {
                        is String -> JsonPrimitive(result)
                        is Number -> JsonPrimitive(result)
                        is Boolean -> JsonPrimitive(result)
                        null -> JsonNull
                        else -> JsonPrimitive(result.toString())
                    }
                sendToolResult(
                    callbackId,
                    Json.encodeToString(JsonElement.serializer(), jsonResultElement),
                    false
                )
            } catch (e: Exception) {
                AppLogger.e(TAG, "Native image processing failed: ${e.message}", e)
                sendToolResult(callbackId, e.message ?: "Unknown image processing error", true)
            }
        }.start()
    }

    fun crypto(algorithm: String, operation: String, argsJson: String): String {
        return try {
            val args = Json.decodeFromString(ListSerializer(String.serializer()), argsJson)

            when (algorithm.lowercase()) {
                "md5" -> {
                    val input = args.getOrNull(0) ?: ""
                    val md = MessageDigest.getInstance("MD5")
                    val digest = md.digest(input.toByteArray(Charsets.UTF_8))
                    digest.joinToString("") { "%02x".format(it) }
                }
                "aes" -> {
                    when (operation.lowercase()) {
                        "decrypt" -> {
                            val data = args.getOrNull(0) ?: ""
                            val keyHex =
                                args.getOrNull(1)
                                    ?: throw IllegalArgumentException(
                                        "Missing key for AES decryption"
                                    )

                            val keyBytes = keyHex.toByteArray(Charsets.UTF_8)
                            val secretKey = SecretKeySpec(keyBytes, "AES")
                            val cipher = Cipher.getInstance("AES/ECB/NoPadding")
                            cipher.init(Cipher.DECRYPT_MODE, secretKey)
                            val decodedData = Base64.decode(data, Base64.DEFAULT)
                            val decryptedWithPadding = cipher.doFinal(decodedData)

                            if (decryptedWithPadding.isEmpty()) {
                                return ""
                            }

                            val paddingLength = decryptedWithPadding.last().toInt()

                            if (paddingLength < 1 || paddingLength > decryptedWithPadding.size) {
                                throw Exception("Invalid PKCS7 padding length: $paddingLength")
                            }

                            val decryptedBytes =
                                decryptedWithPadding.copyOfRange(
                                    0,
                                    decryptedWithPadding.size - paddingLength
                                )

                            String(decryptedBytes, Charsets.UTF_8)
                        }
                        else -> throw IllegalArgumentException("Unknown AES operation: $operation")
                    }
                }
                else -> throw IllegalArgumentException("Unknown algorithm: $algorithm")
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Native crypto operation failed: ${e.message}", e)
            "{\"nativeError\":\"${e.message?.replace("\"", "'")}\"}"
        }
    }
}
