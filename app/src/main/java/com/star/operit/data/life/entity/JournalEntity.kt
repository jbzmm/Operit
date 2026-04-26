package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "journals")
data class JournalEntity(
    @PrimaryKey val id: String,
    val date: String,
    val title: String? = null,
    val content: String = "",
    val mood: String? = null,
    val weather: String? = null,
    val location: String? = null,
    val linkedEventIds: String? = null,
    val images: String? = null,
    val aiSummary: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)