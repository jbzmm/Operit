package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "goals")
data class GoalEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String? = null,
    val type: String = "number",
    val targetValue: Double = 0.0,
    val currentValue: Double = 0.0,
    val unit: String = "",
    val startDate: String,
    val endDate: String? = null,
    val linkedHabitId: String? = null,
    val linkedCategoryId: String? = null,
    val status: String = "active",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "goal_logs",
    foreignKeys = [ForeignKey(
        entity = GoalEntity::class,
        parentColumns = ["id"],
        childColumns = ["goalId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index("goalId")]
)
data class GoalLogEntity(
    @PrimaryKey val id: String,
    val goalId: String,
    val value: Double,
    val note: String? = null,
    val recordedAt: Long = System.currentTimeMillis()
)