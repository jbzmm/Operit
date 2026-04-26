package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "life_events")
data class LifeEventEntity(
    @PrimaryKey val id: String,
    val categoryId: String,
    val subcategoryId: String? = null,
    val title: String,
    val description: String? = null,
    val startAt: Long,
    val endAt: Long? = null,
    val amount: Double? = null,
    val personName: String? = null,
    val personRelation: String? = null,
    val location: String? = null,
    val mood: String? = null,
    val note: String? = null,
    val status: String = "active",
    val tags: String? = null,
    val source: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
