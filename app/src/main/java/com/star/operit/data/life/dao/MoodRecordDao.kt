package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.MoodRecordEntity

@Dao
interface MoodRecordDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(record: MoodRecordEntity)

    @Delete
    suspend fun delete(record: MoodRecordEntity)

    @Query("SELECT * FROM mood_records WHERE date = :date ORDER BY time ASC")
    suspend fun getByDate(date: String): List<MoodRecordEntity>

    @Query("SELECT * FROM mood_records WHERE date BETWEEN :startDate AND :endDate ORDER BY date DESC, time ASC")
    suspend fun getByDateRange(startDate: String, endDate: String): List<MoodRecordEntity>

    @Query("SELECT * FROM mood_records ORDER BY date DESC, time ASC")
    suspend fun getAll(): List<MoodRecordEntity>

    @Query("SELECT mood, COUNT(*) as cnt FROM mood_records WHERE date >= :sinceDate GROUP BY mood ORDER BY cnt DESC")
    suspend fun getMoodDistribution(sinceDate: String): List<MoodCount>
}

data class MoodCount(val mood: String, val cnt: Int)