package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.HabitEntity
import com.star.operit.data.life.entity.HabitRecordEntity

@Dao
interface HabitDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(habit: HabitEntity)

    @Update
    suspend fun update(habit: HabitEntity)

    @Delete
    suspend fun delete(habit: HabitEntity)

    @Query("SELECT * FROM habits WHERE isActive = 1 ORDER BY sortOrder")
    suspend fun getActive(): List<HabitEntity>

    @Query("SELECT * FROM habits ORDER BY sortOrder")
    suspend fun getAll(): List<HabitEntity>

    @Query("SELECT * FROM habit_records WHERE habitId = :habitId AND date = :date")
    suspend fun getRecord(habitId: String, date: String): HabitRecordEntity?

    @Query("SELECT * FROM habit_records WHERE habitId = :habitId ORDER BY date DESC")
    suspend fun getRecords(habitId: String): List<HabitRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecord(record: HabitRecordEntity)

    @Query("SELECT COUNT(DISTINCT date) FROM habit_records WHERE habitId = :habitId AND completedCount >= 1")
    suspend fun getCompletedDays(habitId: String): Int

    @Query("""SELECT COUNT(*) FROM (
        SELECT date FROM habit_records WHERE habitId = :habitId AND completedCount >= 1 
        ORDER BY date DESC LIMIT :limit
    )""")
    suspend fun getRecentStreak(habitId: String, limit: Int = 365): Int
}