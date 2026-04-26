package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.JournalEntity

@Dao
interface JournalDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(journal: JournalEntity)

    @Update
    suspend fun update(journal: JournalEntity)

    @Delete
    suspend fun delete(journal: JournalEntity)

    @Query("SELECT * FROM journals WHERE date = :date")
    suspend fun getByDate(date: String): JournalEntity?

    @Query("SELECT * FROM journals ORDER BY date DESC")
    suspend fun getAll(): List<JournalEntity>

    @Query("SELECT * FROM journals WHERE date BETWEEN :startDate AND :endDate ORDER BY date DESC")
    suspend fun getByDateRange(startDate: String, endDate: String): List<JournalEntity>

    @Query("SELECT * FROM journals WHERE title LIKE '%' || :query || '%' OR content LIKE '%' || :query || '%'")
    suspend fun search(query: String): List<JournalEntity>
}