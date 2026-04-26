package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String? = null,
    val type: String = "time",
    val triggerAt: Long? = null,
    val locationLat: Double? = null,
    val locationLng: Double? = null,
    val locationRadius: Float? = null,
    val linkedEventId: String? = null,
    val repeatRule: String? = null,
    val isCompleted: Boolean = false,
    val completedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis()
)