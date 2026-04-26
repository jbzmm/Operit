package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.GoalEntity
import com.star.operit.data.life.entity.GoalLogEntity

@Dao
interface GoalDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(goal: GoalEntity)

    @Update
    suspend fun update(goal: GoalEntity)

    @Delete
    suspend fun delete(goal: GoalEntity)

    @Query("SELECT * FROM goals WHERE status = 'active' ORDER BY createdAt DESC")
    suspend fun getActive(): List<GoalEntity>

    @Query("SELECT * FROM goals ORDER BY createdAt DESC")
    suspend fun getAll(): List<GoalEntity>

    @Query("SELECT * FROM goals WHERE id = :id")
    suspend fun getById(id: String): GoalEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: GoalLogEntity)

    @Query("SELECT * FROM goal_logs WHERE goalId = :goalId ORDER BY recordedAt DESC")
    suspend fun getLogs(goalId: String): List<GoalLogEntity>
}