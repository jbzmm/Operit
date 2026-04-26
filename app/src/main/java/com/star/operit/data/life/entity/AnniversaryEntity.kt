package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "anniversaries")
data class AnniversaryEntity(
    @PrimaryKey val id: String,
    val title: String,
    val date: String,
    val type: String = "anniversary",
    val linkedPersonName: String? = null,
    val repeatYearly: Boolean = true,
    val remindDaysBefore: Int = 1,
    val icon: String = "🎂",
    val note: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)