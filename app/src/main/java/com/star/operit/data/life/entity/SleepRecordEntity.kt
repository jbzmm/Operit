package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "sleep_records", indices = [Index("date")])
data class SleepRecordEntity(
    @PrimaryKey val id: String,
    val date: String,
    val bedTime: Long,
    val wakeTime: Long,
    val durationMinutes: Int,
    val quality: Int = 3,
    val note: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)