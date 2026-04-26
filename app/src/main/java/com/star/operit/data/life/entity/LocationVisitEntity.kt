package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "location_visits", indices = [Index("name")])
data class LocationVisitEntity(
    @PrimaryKey val id: String,
    val name: String,
    val lat: Double,
    val lng: Double,
    val address: String? = null,
    val category: String? = null,
    val visitCount: Int = 1,
    val firstVisitAt: Long = System.currentTimeMillis(),
    val lastVisitAt: Long = System.currentTimeMillis(),
    val totalDurationMinutes: Int? = null
)