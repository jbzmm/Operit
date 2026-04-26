package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "mood_records", indices = [Index("date")])
data class MoodRecordEntity(
    @PrimaryKey val id: String,
    val date: String,
    val time: String? = null,
    val mood: String,
    val intensity: Int = 5,
    val note: String? = null,
    val linkedEventIds: String? = null,
    val factors: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)