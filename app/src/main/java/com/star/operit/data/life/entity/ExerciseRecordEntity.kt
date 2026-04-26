package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "exercise_records", indices = [Index("date")])
data class ExerciseRecordEntity(
    @PrimaryKey val id: String,
    val date: String,
    val type: String,
    val durationMinutes: Int,
    val calories: Int? = null,
    val distance: Double? = null,
    val note: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)