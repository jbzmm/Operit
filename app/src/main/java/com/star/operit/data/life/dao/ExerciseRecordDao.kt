package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.ExerciseRecordEntity

@Dao
interface ExerciseRecordDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(record: ExerciseRecordEntity)

    @Delete
    suspend fun delete(record: ExerciseRecordEntity)

    @Query("SELECT * FROM exercise_records WHERE date = :date ORDER BY createdAt")
    suspend fun getByDate(date: String): List<ExerciseRecordEntity>

    @Query("SELECT * FROM exercise_records ORDER BY date DESC")
    suspend fun getAll(): List<ExerciseRecordEntity>

    @Query("SELECT * FROM exercise_records WHERE date BETWEEN :startDate AND :endDate ORDER BY date")
    suspend fun getByDateRange(startDate: String, endDate: String): List<ExerciseRecordEntity>

    @Query("SELECT type, SUM(durationMinutes) as totalMinutes FROM exercise_records WHERE date >= :sinceDate GROUP BY type ORDER BY totalMinutes DESC")
    suspend fun getSummaryByType(sinceDate: String): List<ExerciseSummary>
}

data class ExerciseSummary(val type: String, val totalMinutes: Long)