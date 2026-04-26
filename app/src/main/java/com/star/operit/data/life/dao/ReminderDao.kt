package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.ReminderEntity

@Dao
interface ReminderDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(reminder: ReminderEntity)

    @Update
    suspend fun update(reminder: ReminderEntity)

    @Delete
    suspend fun delete(reminder: ReminderEntity)

    @Query("SELECT * FROM reminders WHERE isCompleted = 0 ORDER BY triggerAt ASC")
    suspend fun getPending(): List<ReminderEntity>

    @Query("SELECT * FROM reminders ORDER BY CASE WHEN isCompleted = 0 THEN 0 ELSE 1 END, triggerAt ASC")
    suspend fun getAll(): List<ReminderEntity>

    @Query("SELECT * FROM reminders WHERE id = :id")
    suspend fun getById(id: String): ReminderEntity?

    @Query("UPDATE reminders SET isCompleted = 1, completedAt = :completedAt WHERE id = :id")
    suspend fun markCompleted(id: String, completedAt: Long = System.currentTimeMillis())
}