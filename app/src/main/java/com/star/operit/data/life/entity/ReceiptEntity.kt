package com.star.operit.data.life.entity

import androidx.room.*

@Entity(tableName = "receipts", indices = [Index("date")])
data class ReceiptEntity(
    @PrimaryKey val id: String,
    val date: String,
    val imagePath: String,
    val merchant: String? = null,
    val amount: Double? = null,
    val category: String? = null,
    val ocrText: String? = null,
    val linkedEventId: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)