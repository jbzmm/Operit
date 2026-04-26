package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.LifeEventEntity

@Dao
interface LifeEventDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: LifeEventEntity): Long

    @Update
    suspend fun update(event: LifeEventEntity)

    @Delete
    suspend fun delete(event: LifeEventEntity)

    @Query("DELETE FROM life_events WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("SELECT * FROM life_events WHERE id = :id")
    suspend fun getById(id: String): LifeEventEntity?

    @Query("SELECT * FROM life_events WHERE status != 'deleted' ORDER BY startAt DESC")
    suspend fun getAll(): List<LifeEventEntity>

    @Query("SELECT * FROM life_events WHERE startAt >= :start AND startAt < :end AND status != 'deleted' ORDER BY startAt")
    suspend fun getByDateRange(start: Long, end: Long): List<LifeEventEntity>

    @Query("SELECT * FROM life_events WHERE personName = :name AND status != 'deleted' ORDER BY startAt DESC")
    suspend fun getByPersonName(name: String): List<LifeEventEntity>

    @Query("SELECT * FROM life_events WHERE amount IS NOT NULL AND status != 'deleted' ORDER BY startAt DESC")
    suspend fun getFinanceEvents(): List<LifeEventEntity>

    @Query("SELECT * FROM life_events WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%' AND status != 'deleted'")
    suspend fun search(query: String): List<LifeEventEntity>

    @Query("SELECT COUNT(*) FROM life_events WHERE status != 'deleted'")
    suspend fun getCount(): Int
}