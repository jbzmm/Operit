package com.star.operit.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.star.operit.data.dao.ChatDao
import com.star.operit.data.dao.MessageDao
import com.star.operit.data.dao.MessageVariantDao
import com.star.operit.data.model.ChatEntity
import com.star.operit.data.model.MessageEntity
import com.star.operit.data.model.MessageVariantEntity
import com.star.operit.data.life.entity.*
import com.star.operit.data.life.dao.*

/** 应用数据库，包含聊天表、消息表和生活模块表 */
@Database(
    entities = [
        ChatEntity::class, MessageEntity::class, MessageVariantEntity::class,
        LifeEventEntity::class, HabitEntity::class, HabitRecordEntity::class,
        ReminderEntity::class, JournalEntity::class, AnniversaryEntity::class,
        GoalEntity::class, GoalLogEntity::class, MoodRecordEntity::class,
        SleepRecordEntity::class, ExerciseRecordEntity::class,
        LocationVisitEntity::class, ReceiptEntity::class, MenstrualCycleEntity::class
    ],
    version = 17,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    /** 获取聊天DAO */
    abstract fun chatDao(): ChatDao

    /** 获取消息DAO */
    abstract fun messageDao(): MessageDao

    abstract fun messageVariantDao(): MessageVariantDao

    // 生活模块 DAO
    abstract fun lifeEventDao(): LifeEventDao
    abstract fun habitDao(): HabitDao
    abstract fun reminderDao(): ReminderDao
    abstract fun journalDao(): JournalDao
    abstract fun anniversaryDao(): AnniversaryDao
    abstract fun goalDao(): GoalDao
    abstract fun moodRecordDao(): MoodRecordDao
    abstract fun sleepRecordDao(): SleepRecordDao
    abstract fun exerciseRecordDao(): ExerciseRecordDao
    abstract fun locationVisitDao(): LocationVisitDao
    abstract fun receiptDao(): ReceiptDao
    abstract fun menstrualCycleDao(): MenstrualCycleDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        // 定义从版本1到2的迁移
        private val MIGRATION_1_2 =
            object : Migration(1, 2) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 创建chats表
                    db.execSQL(
                        """
                            CREATE TABLE IF NOT EXISTS `chats` (
                                `id` TEXT NOT NULL,
                                `title` TEXT NOT NULL,
                                `createdAt` INTEGER NOT NULL,
                                `updatedAt` INTEGER NOT NULL,
                                `inputTokens` INTEGER NOT NULL DEFAULT 0,
                                `outputTokens` INTEGER NOT NULL DEFAULT 0,
                                PRIMARY KEY(`id`)
                            )
                        """.trimIndent()
                    )

                    // 创建messages表
                    db.execSQL(
                        """
                            CREATE TABLE IF NOT EXISTS `messages` (
                                `messageId` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                                `chatId` TEXT NOT NULL,
                                `sender` TEXT NOT NULL,
                                `content` TEXT NOT NULL,
                                `timestamp` INTEGER NOT NULL,
                                `orderIndex` INTEGER NOT NULL,
                                FOREIGN KEY(`chatId`) REFERENCES `chats`(`id`) ON DELETE CASCADE
                            )
                        """.trimIndent()
                    )

                    // 为messages表创建索引
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_messages_chatId` ON `messages` (`chatId`)")
                }

            }

        // 定义从版本10到11的迁移
        private val MIGRATION_10_11 =
            object : Migration(10, 11) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向chats表添加workspaceEnv列
                    try {
                        db.execSQL("ALTER TABLE chats ADD COLUMN `workspaceEnv` TEXT")
                    } catch (_: Exception) {

                    }
                }
            }

        // 定义从版本11到12的迁移
        private val MIGRATION_11_12 =
            object : Migration(11, 12) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向chats表添加characterGroupId列（用于绑定群组角色卡）
                    try {
                        db.execSQL("ALTER TABLE chats ADD COLUMN `characterGroupId` TEXT")
                    } catch (_: Exception) {

                    }
                }
            }

        private val MIGRATION_12_13 =
            object : Migration(12, 13) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    try {
                        db.execSQL("ALTER TABLE messages ADD COLUMN `inputTokens` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {
                    }
                    try {
                        db.execSQL("ALTER TABLE messages ADD COLUMN `outputTokens` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {
                    }
                    try {
                        db.execSQL("ALTER TABLE messages ADD COLUMN `cachedInputTokens` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {
                    }
                    try {
                        db.execSQL("ALTER TABLE messages ADD COLUMN `sentAt` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {
                    }
                    try {
                        db.execSQL("ALTER TABLE messages ADD COLUMN `outputDurationMs` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {
                    }
                    try {
                        db.execSQL("ALTER TABLE messages ADD COLUMN `waitDurationMs` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {
                    }
                }
            }

        private val MIGRATION_13_14 =
            object : Migration(13, 14) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL("DROP TABLE IF EXISTS `problem_records`")
                }
            }

        private val MIGRATION_14_15 =
            object : Migration(14, 15) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL(
                        "ALTER TABLE messages ADD COLUMN `selectedVariantIndex` INTEGER NOT NULL DEFAULT 0"
                    )
                    db.execSQL(
                        """
                            CREATE TABLE IF NOT EXISTS `message_variants` (
                                `variantId` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                                `chatId` TEXT NOT NULL,
                                `messageTimestamp` INTEGER NOT NULL,
                                `variantIndex` INTEGER NOT NULL,
                                `content` TEXT NOT NULL,
                                `roleName` TEXT NOT NULL DEFAULT '',
                                `provider` TEXT NOT NULL DEFAULT '',
                                `modelName` TEXT NOT NULL DEFAULT '',
                                `inputTokens` INTEGER NOT NULL DEFAULT 0,
                                `outputTokens` INTEGER NOT NULL DEFAULT 0,
                                `cachedInputTokens` INTEGER NOT NULL DEFAULT 0,
                                `sentAt` INTEGER NOT NULL DEFAULT 0,
                                `outputDurationMs` INTEGER NOT NULL DEFAULT 0,
                                `waitDurationMs` INTEGER NOT NULL DEFAULT 0,
                                FOREIGN KEY(`chatId`) REFERENCES `chats`(`id`) ON DELETE CASCADE
                            )
                        """.trimIndent()
                    )
                    db.execSQL(
                        "CREATE INDEX IF NOT EXISTS `index_message_variants_chatId_messageTimestamp` ON `message_variants` (`chatId`, `messageTimestamp`)"
                    )
                    db.execSQL(
                        "CREATE UNIQUE INDEX IF NOT EXISTS `index_message_variants_chatId_messageTimestamp_variantIndex` ON `message_variants` (`chatId`, `messageTimestamp`, `variantIndex`)"
                    )
                }
            }

        private val MIGRATION_15_16 =
            object : Migration(15, 16) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL(
                        "ALTER TABLE messages ADD COLUMN `displayMode` TEXT NOT NULL DEFAULT 'NORMAL'"
                    )
                }
            }

        // 生活模块：version 16 → 17
        private val MIGRATION_16_17 =
            object : Migration(16, 17) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `life_events` (
                        `id` TEXT NOT NULL, `categoryId` TEXT NOT NULL, `subcategoryId` TEXT,
                        `title` TEXT NOT NULL, `description` TEXT, `startAt` INTEGER NOT NULL,
                        `endAt` INTEGER, `amount` REAL, `personName` TEXT, `personRelation` TEXT,
                        `location` TEXT, `mood` TEXT, `note` TEXT, `status` TEXT NOT NULL DEFAULT 'active',
                        `tags` TEXT, `source` TEXT, `createdAt` INTEGER NOT NULL, PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `habits` (
                        `id` TEXT NOT NULL, `name` TEXT NOT NULL, `icon` TEXT NOT NULL,
                        `frequency` TEXT NOT NULL DEFAULT 'daily', `targetCount` INTEGER NOT NULL DEFAULT 1,
                        `color` TEXT NOT NULL DEFAULT '#4CAF50', `createdAt` INTEGER NOT NULL,
                        `sortOrder` INTEGER NOT NULL DEFAULT 0, `isActive` INTEGER NOT NULL DEFAULT 1,
                        PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `habit_records` (
                        `id` TEXT NOT NULL, `habitId` TEXT NOT NULL, `date` TEXT NOT NULL,
                        `completedCount` INTEGER NOT NULL DEFAULT 1, `note` TEXT,
                        PRIMARY KEY(`id`), FOREIGN KEY(`habitId`) REFERENCES `habits`(`id`) ON DELETE CASCADE
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_habit_records_habitId` ON `habit_records` (`habitId`)")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_habit_records_date` ON `habit_records` (`date`)")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `reminders` (
                        `id` TEXT NOT NULL, `title` TEXT NOT NULL, `description` TEXT,
                        `type` TEXT NOT NULL DEFAULT 'time', `triggerAt` INTEGER,
                        `locationLat` REAL, `locationLng` REAL, `locationRadius` REAL,
                        `linkedEventId` TEXT, `repeatRule` TEXT,
                        `isCompleted` INTEGER NOT NULL DEFAULT 0, `completedAt` INTEGER,
                        `createdAt` INTEGER NOT NULL, PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `journals` (
                        `id` TEXT NOT NULL, `date` TEXT NOT NULL, `title` TEXT,
                        `content` TEXT NOT NULL DEFAULT '', `mood` TEXT, `weather` TEXT,
                        `location` TEXT, `linkedEventIds` TEXT, `images` TEXT, `aiSummary` TEXT,
                        `createdAt` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `anniversaries` (
                        `id` TEXT NOT NULL, `title` TEXT NOT NULL, `date` TEXT NOT NULL,
                        `type` TEXT NOT NULL DEFAULT 'anniversary', `linkedPersonName` TEXT,
                        `repeatYearly` INTEGER NOT NULL DEFAULT 1, `remindDaysBefore` INTEGER NOT NULL DEFAULT 1,
                        `icon` TEXT NOT NULL DEFAULT '🎂', `note` TEXT,
                        `createdAt` INTEGER NOT NULL, PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `goals` (
                        `id` TEXT NOT NULL, `title` TEXT NOT NULL, `description` TEXT,
                        `type` TEXT NOT NULL DEFAULT 'number', `targetValue` REAL NOT NULL DEFAULT 0,
                        `currentValue` REAL NOT NULL DEFAULT 0, `unit` TEXT NOT NULL DEFAULT '',
                        `startDate` TEXT NOT NULL, `endDate` TEXT,
                        `linkedHabitId` TEXT, `linkedCategoryId` TEXT,
                        `status` TEXT NOT NULL DEFAULT 'active', `createdAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `goal_logs` (
                        `id` TEXT NOT NULL, `goalId` TEXT NOT NULL, `value` REAL NOT NULL,
                        `note` TEXT, `recordedAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`), FOREIGN KEY(`goalId`) REFERENCES `goals`(`id`) ON DELETE CASCADE
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_goal_logs_goalId` ON `goal_logs` (`goalId`)")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `mood_records` (
                        `id` TEXT NOT NULL, `date` TEXT NOT NULL, `time` TEXT,
                        `mood` TEXT NOT NULL, `intensity` INTEGER NOT NULL DEFAULT 5,
                        `note` TEXT, `linkedEventIds` TEXT, `factors` TEXT,
                        `createdAt` INTEGER NOT NULL, PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_mood_records_date` ON `mood_records` (`date`)")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `sleep_records` (
                        `id` TEXT NOT NULL, `date` TEXT NOT NULL, `bedTime` INTEGER NOT NULL,
                        `wakeTime` INTEGER NOT NULL, `durationMinutes` INTEGER NOT NULL,
                        `quality` INTEGER NOT NULL DEFAULT 3, `note` TEXT,
                        `createdAt` INTEGER NOT NULL, PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_sleep_records_date` ON `sleep_records` (`date`)")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `exercise_records` (
                        `id` TEXT NOT NULL, `date` TEXT NOT NULL, `type` TEXT NOT NULL,
                        `durationMinutes` INTEGER NOT NULL, `calories` INTEGER,
                        `distance` REAL, `note` TEXT, `createdAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_exercise_records_date` ON `exercise_records` (`date`)")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `location_visits` (
                        `id` TEXT NOT NULL, `name` TEXT NOT NULL,
                        `lat` REAL NOT NULL, `lng` REAL NOT NULL, `address` TEXT,
                        `category` TEXT, `visitCount` INTEGER NOT NULL DEFAULT 1,
                        `firstVisitAt` INTEGER NOT NULL, `lastVisitAt` INTEGER NOT NULL,
                        `totalDurationMinutes` INTEGER, PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_location_visits_name` ON `location_visits` (`name`)")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `receipts` (
                        `id` TEXT NOT NULL, `date` TEXT NOT NULL, `imagePath` TEXT NOT NULL,
                        `merchant` TEXT, `amount` REAL, `category` TEXT,
                        `ocrText` TEXT, `linkedEventId` TEXT, `createdAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_receipts_date` ON `receipts` (`date`)")
                    db.execSQL("""CREATE TABLE IF NOT EXISTS `menstrual_cycles` (
                        `id` TEXT NOT NULL, `startDate` TEXT NOT NULL, `endDate` TEXT,
                        `cycleLength` INTEGER, `periodLength` INTEGER,
                        `symptoms` TEXT, `note` TEXT, `createdAt` INTEGER NOT NULL,
                        PRIMARY KEY(`id`)
                    )""")
                    db.execSQL("CREATE INDEX IF NOT EXISTS `index_menstrual_cycles_startDate` ON `menstrual_cycles` (`startDate`)")
                }
            }

        // 定义从版本2到3的迁移
        private val MIGRATION_2_3 =
            object : Migration(2, 3) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向chats表添加group列
                    db.execSQL("ALTER TABLE chats ADD COLUMN `group` TEXT")
                }
            }

        // 定义从版本3到4的迁移
        private val MIGRATION_3_4 =
            object : Migration(3, 4) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向chats表添加displayOrder列，并用updatedAt填充现有数据
                    db.execSQL(
                        "ALTER TABLE chats ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0"
                    )
                    db.execSQL("UPDATE chats SET displayOrder = updatedAt")
                }
            }

        // 定义从版本4到5的迁移
        private val MIGRATION_4_5 =
            object : Migration(4, 5) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向chats表添加workspace列
                    db.execSQL("ALTER TABLE chats ADD COLUMN `workspace` TEXT")
                }
            }

        // 定义从版本5到6的迁移
        private val MIGRATION_5_6 =
            object : Migration(5, 6) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 检查currentWindowSize列是否已存在，如果不存在则添加
                    try {
                        db.execSQL("ALTER TABLE chats ADD COLUMN `currentWindowSize` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {

                    }
                }
            }

        // 定义从版本6到7的迁移
        private val MIGRATION_6_7 =
            object : Migration(6, 7) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向messages表添加roleName列
                    db.execSQL("ALTER TABLE messages ADD COLUMN `roleName` TEXT NOT NULL DEFAULT ''")
                }
            }

        // 定义从版本7到8的迁移
        private val MIGRATION_7_8 =
            object : Migration(7, 8) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向chats表添加parentChatId列
                    db.execSQL("ALTER TABLE chats ADD COLUMN `parentChatId` TEXT")
                    // 向chats表添加characterCardName列（用于绑定角色卡）
                    db.execSQL("ALTER TABLE chats ADD COLUMN `characterCardName` TEXT")
                }
            }

        // 定义从版本8到9的迁移
        private val MIGRATION_8_9 =
            object : Migration(8, 9) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向messages表添加provider列（供应商）
                    db.execSQL("ALTER TABLE messages ADD COLUMN `provider` TEXT NOT NULL DEFAULT ''")
                    // 向messages表添加modelName列（模型名称）
                    db.execSQL("ALTER TABLE messages ADD COLUMN `modelName` TEXT NOT NULL DEFAULT ''")
                }
            }

        // 定义从版本9到10的迁移
        private val MIGRATION_9_10 =
            object : Migration(9, 10) {
                override fun migrate(db: SupportSQLiteDatabase) {
                    // 向chats表添加locked列（锁定聊天，禁止删除）
                    try {
                        db.execSQL("ALTER TABLE chats ADD COLUMN `locked` INTEGER NOT NULL DEFAULT 0")
                    } catch (_: Exception) {

                    }
                }
            }

        /** 获取数据库实例，单例模式 */
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE
                ?: synchronized(this) {
                    val instance =
                        Room.databaseBuilder(
                            context.applicationContext,
                            AppDatabase::class.java,
                            "app_database"
                        )
.addMigrations(
                                MIGRATION_1_2,
                                MIGRATION_2_3,
                                MIGRATION_3_4,
                                MIGRATION_4_5,
                                MIGRATION_5_6,
                                MIGRATION_6_7,
                                MIGRATION_7_8,
                                MIGRATION_8_9,
                                MIGRATION_9_10,
                                MIGRATION_10_11,
                                MIGRATION_11_12,
                                MIGRATION_12_13,
                                MIGRATION_13_14,
                                MIGRATION_14_15,
                                MIGRATION_15_16,
                                MIGRATION_16_17
                            )
                            ) // 添加新的迁移
                            .build()
                    INSTANCE = instance
                    instance
                }
        }

        fun closeDatabase() {
            synchronized(this) {
                try {
                    INSTANCE?.close()
                } finally {
                    INSTANCE = null
                }
            }
        }
    }
}
