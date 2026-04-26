package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "habits")
data class HabitEntity(
    @PrimaryKey val id: String,
    val name: String,
    val icon: String,
    val frequency: String = "daily",
    val targetCount: Int = 1,
    val color: String = "#4CAF50",
    val createdAt: Long = System.currentTimeMillis(),
    val sortOrder: Int = 0,
    val isActive: Boolean = true
)

@Entity(
    tableName = "habit_records",
    foreignKeys = [ForeignKey(
        entity = HabitEntity::class,
        parentColumns = ["id"],
        childColumns = ["habitId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index("habitId"), Index("date")]
)
data class HabitRecordEntity(
    @PrimaryKey val id: String,
    val habitId: String,
    val date: String,
    val completedCount: Int = 1,
    val note: String? = null
)