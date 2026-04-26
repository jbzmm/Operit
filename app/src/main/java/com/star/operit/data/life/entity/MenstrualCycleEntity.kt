package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "menstrual_cycles", indices = [Index("startDate")])
data class MenstrualCycleEntity(
    @PrimaryKey val id: String,
    val startDate: String,
    val endDate: String? = null,
    val cycleLength: Int? = null,
    val periodLength: Int? = null,
    val symptoms: String? = null,
    val note: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)