package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.SleepRecordEntity

@Dao
interface SleepRecordDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(record: SleepRecordEntity)

    @Delete
    suspend fun delete(record: SleepRecordEntity)

    @Query("SELECT * FROM sleep_records WHERE date = :date")
    suspend fun getByDate(date: String): SleepRecordEntity?

    @Query("SELECT * FROM sleep_records ORDER BY date DESC")
    suspend fun getAll(): List<SleepRecordEntity>

    @Query("SELECT * FROM sleep_records WHERE date BETWEEN :startDate AND :endDate ORDER BY date")
    suspend fun getByDateRange(startDate: String, endDate: String): List<SleepRecordEntity>

    @Query("SELECT AVG(durationMinutes) FROM sleep_records WHERE date >= :sinceDate")
    suspend fun getAvgDuration(sinceDate: String): Double?
}