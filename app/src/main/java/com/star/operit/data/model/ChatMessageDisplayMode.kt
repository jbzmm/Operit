package com.star.operit.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class ChatMessageDisplayMode {
    NORMAL,
    HIDDEN_PLACEHOLDER
}
