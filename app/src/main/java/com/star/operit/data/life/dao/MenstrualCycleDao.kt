package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.MenstrualCycleEntity

@Dao
interface MenstrualCycleDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(cycle: MenstrualCycleEntity)

    @Update
    suspend fun update(cycle: MenstrualCycleEntity)

    @Delete
    suspend fun delete(cycle: MenstrualCycleEntity)

    @Query("SELECT * FROM menstrual_cycles ORDER BY startDate DESC")
    suspend fun getAll(): List<MenstrualCycleEntity>

    @Query("SELECT * FROM menstrual_cycles ORDER BY startDate DESC LIMIT 1")
    suspend fun getLatest(): MenstrualCycleEntity?

    @Query("SELECT * FROM menstrual_cycles WHERE startDate >= :sinceDate ORDER BY startDate DESC")
    suspend fun getSince(sinceDate: String): List<MenstrualCycleEntity>
}