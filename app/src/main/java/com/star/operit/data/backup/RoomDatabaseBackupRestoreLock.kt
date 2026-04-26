package com.star.operit.data.backup

import kotlinx.coroutines.sync.Mutex

object RoomDatabaseBackupRestoreLock {
    val mutex = Mutex()
}
