package com.star.operit.data.life.dao

import androidx.room.*
import com.star.operit.data.life.entity.ReceiptEntity

@Dao
interface ReceiptDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(receipt: ReceiptEntity)

    @Delete
    suspend fun delete(receipt: ReceiptEntity)

    @Query("SELECT * FROM receipts ORDER BY date DESC")
    suspend fun getAll(): List<ReceiptEntity>

    @Query("SELECT * FROM receipts WHERE date BETWEEN :startDate AND :endDate ORDER BY date DESC")
    suspend fun getByDateRange(startDate: String, endDate: String): List<ReceiptEntity>

    @Query("SELECT * FROM receipts WHERE id = :id")
    suspend fun getById(id: String): ReceiptEntity?
}