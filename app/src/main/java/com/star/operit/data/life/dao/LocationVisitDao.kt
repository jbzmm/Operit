package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.LocationVisitEntity

@Dao
interface LocationVisitDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(visit: LocationVisitEntity)

    @Update
    suspend fun update(visit: LocationVisitEntity)

    @Delete
    suspend fun delete(visit: LocationVisitEntity)

    @Query("SELECT * FROM location_visits ORDER BY visitCount DESC")
    suspend fun getAll(): List<LocationVisitEntity>

    @Query("SELECT * FROM location_visits WHERE name LIKE '%' || :query || '%' OR address LIKE '%' || :query || '%'")
    suspend fun search(query: String): List<LocationVisitEntity>
}