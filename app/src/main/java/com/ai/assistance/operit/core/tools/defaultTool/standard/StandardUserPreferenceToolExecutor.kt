package com.ai.assistance.operit.core.tools.defaultTool.standard

import android.content.Context
import com.ai.assistance.operit.core.tools.StringResultData
import com.ai.assistance.operit.core.tools.ToolExecutor
import com.ai.assistance.operit.data.model.AITool
import com.ai.assistance.operit.data.model.ToolResult
import com.ai.assistance.operit.data.preferences.preferencesManager
import com.ai.assistance.operit.util.AppLogger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

class StandardUserPreferenceToolExecutor(private val context: Context) : ToolExecutor {
    companion object {
        private const val TAG = "UserPreferenceExecutor"
    }

    override fun invoke(tool: AITool): ToolResult = runBlocking {
        if (tool.name != "update_user_preferences") {
            return@runBlocking ToolResult(
                toolName = tool.name,
                success = false,
                result = StringResultData(""),
                error = "Unknown tool: ${tool.name}"
            )
        }

        return@runBlocking try {
            val birthDate = tool.parameters.find { it.name == "birth_date" }?.value?.toLongOrNull()
            val gender = tool.parameters.find { it.name == "gender" }?.value
            val personality = tool.parameters.find { it.name == "personality" }?.value
            val identity = tool.parameters.find { it.name == "identity" }?.value
            val occupation = tool.parameters.find { it.name == "occupation" }?.value
            val aiStyle = tool.parameters.find { it.name == "ai_style" }?.value

            if (birthDate == null && gender == null && personality == null &&
                identity == null && occupation == null && aiStyle == null
            ) {
                return@runBlocking ToolResult(
                    toolName = tool.name,
                    success = false,
                    result = StringResultData(""),
                    error = "At least one preference parameter must be provided"
                )
            }

            withContext(Dispatchers.IO) {
                preferencesManager.updateProfileCategory(
                    birthDate = birthDate,
                    gender = gender,
                    personality = personality,
                    identity = identity,
                    occupation = occupation,
                    aiStyle = aiStyle
                )
            }

            val updatedFields = mutableListOf<String>()
            birthDate?.let { updatedFields.add("birth_date") }
            gender?.let { updatedFields.add("gender") }
            personality?.let { updatedFields.add("personality") }
            identity?.let { updatedFields.add("identity") }
            occupation?.let { updatedFields.add("occupation") }
            aiStyle?.let { updatedFields.add("ai_style") }

            val message = "Successfully updated user preferences: ${updatedFields.joinToString(", ")}"
            AppLogger.d(TAG, message)
            ToolResult(
                toolName = tool.name,
                success = true,
                result = StringResultData(message)
            )
        } catch (e: Exception) {
            AppLogger.e(TAG, "Failed to update user preferences", e)
            ToolResult(
                toolName = tool.name,
                success = false,
                result = StringResultData(""),
                error = "Failed to update user preferences: ${e.message}"
            )
        }
    }
}
