package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.AnniversaryEntity

@Dao
interface AnniversaryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: AnniversaryEntity)

    @Update
    suspend fun update(item: AnniversaryEntity)

    @Delete
    suspend fun delete(item: AnniversaryEntity)

    @Query("SELECT * FROM anniversaries ORDER BY date ASC")
    suspend fun getAll(): List<AnniversaryEntity>

    @Query("SELECT * FROM anniversaries WHERE linkedPersonName = :name")
    suspend fun getByPersonName(name: String): List<AnniversaryEntity>
}