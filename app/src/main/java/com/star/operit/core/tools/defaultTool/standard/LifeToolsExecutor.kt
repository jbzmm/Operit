package com.star.operit.core.tools.defaultTool.standard

import android.content.Context
import com.star.operit.data.db.AppDatabase
import com.star.operit.data.life.entity.*
import com.star.operit.data.model.AITool
import com.star.operit.data.model.ToolResult
import com.star.operit.core.tools.StringResultData
import com.star.operit.core.tools.ToolExecutor
import com.star.operit.util.AppLogger
import kotlinx.coroutines.runBlocking
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * AI 工具执行器：让 AI 可以读取和操作生活模块数据。
 * 支持：习惯打卡、待办、日记、情绪、睡眠、运动、记账、纪念日、目标、足迹、生理周期。
 */
class LifeToolsExecutor(private val context: Context) : ToolExecutor {

    companion object {
        private const val TAG = "LifeToolsExecutor"
    }

    private val db: AppDatabase by lazy { AppDatabase.getDatabase(context) }

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val timeFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

    override fun invoke(tool: AITool): ToolResult {
        val action = tool.parameters.find { it.name == "action" }?.value ?: ""
        return try {
            runBlocking {
                when (action) {
                    // ===== 习惯 =====
                    "list_habits" -> listHabits()
                    "check_habit" -> checkHabit(tool)
                    "get_habit_stats" -> getHabitStats(tool)

                    // ===== 待办/提醒 =====
                    "list_reminders" -> listReminders(tool)
                    "add_reminder" -> addReminder(tool)
                    "complete_reminder" -> completeReminder(tool)

                    // ===== 日记 =====
                    "list_journals" -> listJournals(tool)
                    "get_journal" -> getJournal(tool)
                    "add_journal" -> addJournal(tool)
                    "search_journals" -> searchJournals(tool)

                    // ===== 情绪 =====
                    "list_mood_records" -> listMoodRecords(tool)
                    "add_mood_record" -> addMoodRecord(tool)
                    "get_mood_summary" -> getMoodSummary(tool)

                    // ===== 睡眠 =====
                    "list_sleep_records" -> listSleepRecords(tool)
                    "get_sleep_stats" -> getSleepStats(tool)

                    // ===== 运动 =====
                    "list_exercise_records" -> listExerciseRecords(tool)
                    "get_exercise_summary" -> getExerciseSummary(tool)

                    // ===== 记账 =====
                    "list_finance_events" -> listFinanceEvents(tool)
                    "add_life_event" -> addLifeEvent(tool)

                    // ===== 纪念日 =====
                    "list_anniversaries" -> listAnniversaries()
                    "add_anniversary" -> addAnniversary(tool)

                    // ===== 目标 =====
                    "list_goals" -> listGoals()
                    "add_goal_log" -> addGoalLog(tool)

                    // ===== 足迹 =====
                    "list_locations" -> listLocations(tool)

                    // ===== 生理周期 =====
                    "get_menstrual_status" -> getMenstrualStatus()

                    // ===== 概览 =====
                    "life_overview" -> lifeOverview()

                    else -> errorResult("Unknown action: $action")
                }
            }
        } catch (e: Exception) {
            AppLogger.e(TAG, "Life tool error: ${e.message}", e)
            errorResult("Error: ${e.message}")
        }
    }

    // ==================== 习惯 ====================

    private suspend fun listHabits(): ToolResult {
        val habits = db.habitDao().getActive()
        if (habits.isEmpty()) return successResult("No habits found.")
        val today = dateFormat.format(Date())
        val sb = StringBuilder("Active Habits:\n")
        for (h in habits) {
            val record = db.habitDao().getRecord(h.id, today)
            val status = if (record != null) "✅ Done" else "⬜ Not done"
            val days = db.habitDao().getCompletedDays(h.id)
            sb.append("- ${h.name} ($status) | Streak info: $days days completed | Freq: ${h.frequency}\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun checkHabit(tool: AITool): ToolResult {
        val habitId = tool.parameters.find { it.name == "habit_id" }?.value
            ?: return errorResult("habit_id is required")
        val date = tool.parameters.find { it.name == "date" }?.value ?: dateFormat.format(Date())
        val existing = db.habitDao().getRecord(habitId, date)
        if (existing != null) {
            return successResult("Habit already checked for $date.")
        }
        db.habitDao().insertRecord(HabitRecordEntity(
            id = UUID.randomUUID().toString(),
            habitId = habitId,
            date = date,
            completedCount = 1,
            note = tool.parameters.find { it.name == "note" }?.value
        ))
        return successResult("Habit checked successfully for $date.")
    }

    private suspend fun getHabitStats(tool: AITool): ToolResult {
        val habitId = tool.parameters.find { it.name == "habit_id" }?.value
            ?: return errorResult("habit_id is required")
        val habit = db.habitDao().getActive().find { it.id == habitId }
            ?: return errorResult("Habit not found: $habitId")
        val days = db.habitDao().getCompletedDays(habitId)
        val records = db.habitDao().getRecords(habitId)
        val sb = StringBuilder("Habit: ${habit.name}\n")
        sb.append("Frequency: ${habit.frequency}\n")
        sb.append("Total completed days: $days\n")
        sb.append("Recent records (${minOf(10, records.size)}):\n")
        for (r in records.take(10)) {
            sb.append("  ${r.date}: completed=${r.completedCount}${r.note?.let { " note=$it" } ?: ""}\n")
        }
        return successResult(sb.toString())
    }

    // ==================== 待办/提醒 ====================

    private suspend fun listReminders(tool: AITool): ToolResult {
        val showAll = tool.parameters.find { it.name == "show_all" }?.value?.toBoolean() ?: false
        val reminders = if (showAll) db.reminderDao().getAll() else db.reminderDao().getPending()
        if (reminders.isEmpty()) return successResult("No reminders found.")
        val sb = StringBuilder("Reminders:\n")
        for (r in reminders) {
            val status = if (r.isCompleted) "✅" else "⏳"
            val time = r.triggerAt?.let { timeFormat.format(Date(it)) } ?: "No time set"
            sb.append("- $status ${r.title} | Type: ${r.type} | Time: $time${r.description?.let { " | Desc: $it" } ?: ""}\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun addReminder(tool: AITool): ToolResult {
        val title = tool.parameters.find { it.name == "title" }?.value
            ?: return errorResult("title is required")
        val triggerAtStr = tool.parameters.find { it.name == "trigger_at" }?.value
        val triggerAt = triggerAtStr?.toLongOrNull()
        val desc = tool.parameters.find { it.name == "description" }?.value
        val type = tool.parameters.find { it.name == "type" }?.value ?: "time"
        db.reminderDao().insert(ReminderEntity(
            id = UUID.randomUUID().toString(),
            title = title,
            description = desc,
            type = type,
            triggerAt = triggerAt,
            repeatRule = tool.parameters.find { it.name == "repeat_rule" }?.value,
            createdAt = System.currentTimeMillis()
        ))
        return successResult("Reminder '$title' added successfully.")
    }

    private suspend fun completeReminder(tool: AITool): ToolResult {
        val id = tool.parameters.find { it.name == "reminder_id" }?.value
            ?: return errorResult("reminder_id is required")
        db.reminderDao().markCompleted(id)
        return successResult("Reminder completed.")
    }

    // ==================== 日记 ====================

    private suspend fun listJournals(tool: AITool): ToolResult {
        val limit = tool.parameters.find { it.name == "limit" }?.value?.toIntOrNull() ?: 10
        val journals = db.journalDao().getAll().take(limit)
        if (journals.isEmpty()) return successResult("No journals found.")
        val sb = StringBuilder("Journals:\n")
        for (j in journals) {
            sb.append("- ${j.date} | ${j.title ?: "No title"} | Mood: ${j.mood ?: "N/A"} | Preview: ${(j.content.take(80))}...\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun getJournal(tool: AITool): ToolResult {
        val date = tool.parameters.find { it.name == "date" }?.value
            ?: return errorResult("date is required (yyyy-MM-dd)")
        val journal = db.journalDao().getByDate(date)
            ?: return successResult("No journal found for $date.")
        val sb = StringBuilder("Journal for ${journal.date}:\n")
        sb.append("Title: ${journal.title ?: "No title"}\n")
        sb.append("Mood: ${journal.mood ?: "N/A"}\n")
        sb.append("Weather: ${journal.weather ?: "N/A"}\n")
        sb.append("Location: ${journal.location ?: "N/A"}\n")
        sb.append("Content:\n${journal.content}\n")
        journal.aiSummary?.let { sb.append("AI Summary: $it\n") }
        return successResult(sb.toString())
    }

    private suspend fun addJournal(tool: AITool): ToolResult {
        val date = tool.parameters.find { it.name == "date" }?.value ?: dateFormat.format(Date())
        val content = tool.parameters.find { it.name == "content" }?.value ?: ""
        val title = tool.parameters.find { it.name == "title" }?.value
        val mood = tool.parameters.find { it.name == "mood" }?.value
        val weather = tool.parameters.find { it.name == "weather" }?.value
        val location = tool.parameters.find { it.name == "location" }?.value
        val existing = db.journalDao().getByDate(date)
        if (existing != null) {
            db.journalDao().update(existing.copy(
                content = content,
                title = title ?: existing.title,
                mood = mood ?: existing.mood,
                weather = weather ?: existing.weather,
                location = location ?: existing.location,
                updatedAt = System.currentTimeMillis()
            ))
            return successResult("Journal for $date updated.")
        }
        db.journalDao().insert(JournalEntity(
            id = UUID.randomUUID().toString(),
            date = date,
            title = title,
            content = content,
            mood = mood,
            weather = weather,
            location = location,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        ))
        return successResult("Journal for $date added.")
    }

    private suspend fun searchJournals(tool: AITool): ToolResult {
        val query = tool.parameters.find { it.name == "query" }?.value
            ?: return errorResult("query is required")
        val results = db.journalDao().search(query)
        if (results.isEmpty()) return successResult("No journals matching '$query'.")
        val sb = StringBuilder("Search results for '$query' (${results.size} found):\n")
        for (j in results) {
            sb.append("- ${j.date} | ${j.title ?: "No title"} | ${(j.content.take(80))}...\n")
        }
        return successResult(sb.toString())
    }

    // ==================== 情绪 ====================

    private suspend fun listMoodRecords(tool: AITool): ToolResult {
        val startDate = tool.parameters.find { it.name == "start_date" }?.value
        val endDate = tool.parameters.find { it.name == "end_date" }?.value
        val records = if (startDate != null && endDate != null) {
            db.moodRecordDao().getByDateRange(startDate, endDate)
        } else {
            db.moodRecordDao().getAll().take(20)
        }
        if (records.isEmpty()) return successResult("No mood records found.")
        val sb = StringBuilder("Mood Records:\n")
        for (r in records) {
            sb.append("- ${r.date} ${r.time ?: ""} | Mood: ${r.mood} | Intensity: ${r.intensity}${r.note?.let { " | Note: $it" } ?: ""}\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun addMoodRecord(tool: AITool): ToolResult {
        val mood = tool.parameters.find { it.name == "mood" }?.value
            ?: return errorResult("mood is required")
        val date = tool.parameters.find { it.name == "date" }?.value ?: dateFormat.format(Date())
        val time = tool.parameters.find { it.name == "time" }?.value
        val intensity = tool.parameters.find { it.name == "intensity" }?.value?.toIntOrNull() ?: 5
        val note = tool.parameters.find { it.name == "note" }?.value
        val factors = tool.parameters.find { it.name == "factors" }?.value
        db.moodRecordDao().insert(MoodRecordEntity(
            id = UUID.randomUUID().toString(),
            date = date,
            time = time,
            mood = mood,
            intensity = intensity,
            note = note,
            factors = factors,
            createdAt = System.currentTimeMillis()
        ))
        return successResult("Mood record added: $mood (intensity $intensity) for $date.")
    }

    private suspend fun getMoodSummary(tool: AITool): ToolResult {
        val days = tool.parameters.find { it.name == "days" }?.value?.toIntOrNull() ?: 30
        val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -days) }
        val sinceDate = dateFormat.format(cal.time)
        val distribution = db.moodRecordDao().getMoodDistribution(sinceDate)
        if (distribution.isEmpty()) return successResult("No mood data in last $days days.")
        val sb = StringBuilder("Mood distribution (last $days days):\n")
        for (m in distribution) {
            sb.append("- ${m.mood}: ${m.cnt} times\n")
        }
        return successResult(sb.toString())
    }

    // ==================== 睡眠 ====================

    private suspend fun listSleepRecords(tool: AITool): ToolResult {
        val startDate = tool.parameters.find { it.name == "start_date" }?.value
        val endDate = tool.parameters.find { it.name == "end_date" }?.value
        val records = if (startDate != null && endDate != null) {
            db.sleepRecordDao().getByDateRange(startDate, endDate)
        } else {
            db.sleepRecordDao().getAll().take(14)
        }
        if (records.isEmpty()) return successResult("No sleep records found.")
        val sb = StringBuilder("Sleep Records:\n")
        for (r in records) {
            val bed = timeFormat.format(Date(r.bedTime))
            val wake = timeFormat.format(Date(r.wakeTime))
            sb.append("- ${r.date} | Bed: $bed | Wake: $wake | Duration: ${r.durationMinutes}min | Quality: ${r.quality}/5\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun getSleepStats(tool: AITool): ToolResult {
        val days = tool.parameters.find { it.name == "days" }?.value?.toIntOrNull() ?: 30
        val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -days) }
        val sinceDate = dateFormat.format(cal.time)
        val avgDuration = db.sleepRecordDao().getAvgDuration(sinceDate)
        val records = db.sleepRecordDao().getByDateRange(sinceDate, dateFormat.format(Date()))
        if (records.isEmpty()) return successResult("No sleep data in last $days days.")
        val avgQuality = records.map { it.quality }.average()
        val sb = StringBuilder("Sleep stats (last $days days):\n")
        sb.append("- Records: ${records.size}\n")
        sb.append("- Avg duration: ${"%.1f".format(avgDuration ?: 0.0)} minutes\n")
        sb.append("- Avg quality: ${"%.1f".format(avgQuality)}/5\n")
        return successResult(sb.toString())
    }

    // ==================== 运动 ====================

    private suspend fun listExerciseRecords(tool: AITool): ToolResult {
        val startDate = tool.parameters.find { it.name == "start_date" }?.value
        val endDate = tool.parameters.find { it.name == "end_date" }?.value
        val records = if (startDate != null && endDate != null) {
            db.exerciseRecordDao().getByDateRange(startDate, endDate)
        } else {
            db.exerciseRecordDao().getAll().take(20)
        }
        if (records.isEmpty()) return successResult("No exercise records found.")
        val sb = StringBuilder("Exercise Records:\n")
        for (r in records) {
            sb.append("- ${r.date} | Type: ${r.type} | Duration: ${r.durationMinutes}min${r.calories?.let { " | Cal: ${it}kcal" } ?: ""}${r.distance?.let { " | Dist: ${it}km" } ?: ""}\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun getExerciseSummary(tool: AITool): ToolResult {
        val days = tool.parameters.find { it.name == "days" }?.value?.toIntOrNull() ?: 30
        val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -days) }
        val sinceDate = dateFormat.format(cal.time)
        val summary = db.exerciseRecordDao().getSummaryByType(sinceDate)
        if (summary.isEmpty()) return successResult("No exercise data in last $days days.")
        val sb = StringBuilder("Exercise summary (last $days days):\n")
        for (s in summary) {
            sb.append("- ${s.type}: ${s.totalMinutes} minutes total\n")
        }
        return successResult(sb.toString())
    }

    // ==================== 记账 ====================

    private suspend fun listFinanceEvents(tool: AITool): ToolResult {
        val limit = tool.parameters.find { it.name == "limit" }?.value?.toIntOrNull() ?: 20
        val events = db.lifeEventDao().getFinanceEvents().take(limit)
        if (events.isEmpty()) return successResult("No finance events found.")
        val sb = StringBuilder("Finance Events:\n")
        for (e in events) {
            val time = timeFormat.format(Date(e.startAt))
            sb.append("- $time | ${e.title} | Amount: ${e.amount ?: 0}${e.categoryId?.let { " | Category: $it" } ?: ""}\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun addLifeEvent(tool: AITool): ToolResult {
        val title = tool.parameters.find { it.name == "title" }?.value
            ?: return errorResult("title is required")
        val categoryId = tool.parameters.find { it.name == "category_id" }?.value ?: "general"
        val startAtStr = tool.parameters.find { it.name == "start_at" }?.value
        val startAt = startAtStr?.toLongOrNull() ?: System.currentTimeMillis()
        val amount = tool.parameters.find { it.name == "amount" }?.value?.toDoubleOrNull()
        val description = tool.parameters.find { it.name == "description" }?.value
        val personName = tool.parameters.find { it.name == "person_name" }?.value
        val location = tool.parameters.find { it.name == "location" }?.value
        val mood = tool.parameters.find { it.name == "mood" }?.value
        val note = tool.parameters.find { it.name == "note" }?.value
        db.lifeEventDao().insert(LifeEventEntity(
            id = UUID.randomUUID().toString(),
            categoryId = categoryId,
            subcategoryId = null,
            title = title,
            description = description,
            startAt = startAt,
            endAt = null,
            amount = amount,
            personName = personName,
            personRelation = null,
            location = location,
            mood = mood,
            note = note,
            status = "active",
            createdAt = System.currentTimeMillis()
        ))
        return successResult("Event '$title' added successfully.")
    }

    // ==================== 纪念日 ====================

    private suspend fun listAnniversaries(): ToolResult {
        val items = db.anniversaryDao().getAll()
        if (items.isEmpty()) return successResult("No anniversaries found.")
        val today = dateFormat.format(Date())
        val sb = StringBuilder("Anniversaries:\n")
        for (a in items) {
            val daysUntil = calculateDaysUntil(a.date)
            sb.append("- ${a.icon} ${a.title} | Date: ${a.date} | Type: ${a.type}${a.linkedPersonName?.let { " | Person: $it" } ?: ""} | Days until: $daysUntil\n")
        }
        return successResult(sb.toString())
    }

    private fun calculateDaysUntil(dateStr: String): Long {
        return try {
            val target = dateFormat.parse(dateStr)
            val today = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0)
            }
            // Next occurrence this year or next year
            val cal = Calendar.getInstance().apply { time = target }
            cal.set(Calendar.YEAR, today.get(Calendar.YEAR))
            if (cal.before(today)) cal.add(Calendar.YEAR, 1)
            (cal.timeInMillis - today.timeInMillis) / (1000 * 60 * 60 * 24)
        } catch (e: Exception) { -1L }
    }

    private suspend fun addAnniversary(tool: AITool): ToolResult {
        val title = tool.parameters.find { it.name == "title" }?.value
            ?: return errorResult("title is required")
        val date = tool.parameters.find { it.name == "date" }?.value
            ?: return errorResult("date is required (yyyy-MM-dd)")
        val type = tool.parameters.find { it.name == "anniversary_type" }?.value ?: "anniversary"
        val personName = tool.parameters.find { it.name == "person_name" }?.value
        val icon = tool.parameters.find { it.name == "icon" }?.value ?: "📅"
        val note = tool.parameters.find { it.name == "note" }?.value
        db.anniversaryDao().insert(AnniversaryEntity(
            id = UUID.randomUUID().toString(),
            title = title,
            date = date,
            type = type,
            linkedPersonName = personName,
            createdAt = System.currentTimeMillis(),
            note = note
        ))
        return successResult("Anniversary '$title' ($date) added.")
    }

    // ==================== 目标 ====================

    private suspend fun listGoals(): ToolResult {
        val goals = db.goalDao().getActive()
        if (goals.isEmpty()) return successResult("No active goals found.")
        val sb = StringBuilder("Active Goals:\n")
        for (g in goals) {
            val pct = if (g.targetValue != 0.0) "${"%.1f".format(g.currentValue / g.targetValue * 100)}%" else "N/A"
            sb.append("- ${g.title} | ${g.currentValue}/${g.targetValue} ${g.unit} ($pct) | Type: ${g.type} | Deadline: ${g.endDate ?: "No deadline"}\n")
        }
        return successResult(sb.toString())
    }

    private suspend fun addGoalLog(tool: AITool): ToolResult {
        val goalId = tool.parameters.find { it.name == "goal_id" }?.value
            ?: return errorResult("goal_id is required")
        val value = tool.parameters.find { it.name == "value" }?.value?.toDoubleOrNull()
            ?: return errorResult("value is required")
        val note = tool.parameters.find { it.name == "note" }?.value
        val goal = db.goalDao().getById(goalId) ?: return errorResult("Goal not found: $goalId")
        db.goalDao().insertLog(GoalLogEntity(
            id = UUID.randomUUID().toString(),
            goalId = goalId,
            value = value,
            note = note,
            recordedAt = System.currentTimeMillis()
        ))
        val newCurrent = goal.currentValue + value
        db.goalDao().update(goal.copy(currentValue = newCurrent))
        return successResult("Goal progress updated: ${goal.title} now at $newCurrent/${goal.targetValue} ${goal.unit}.")
    }

    // ==================== 足迹 ====================

    private suspend fun listLocations(tool: AITool): ToolResult {
        val query = tool.parameters.find { it.name == "query" }?.value
        val locations = if (query != null) db.locationVisitDao().search(query) else db.locationVisitDao().getAll()
        if (locations.isEmpty()) return successResult("No locations found.")
        val sb = StringBuilder("Locations:\n")
        for (l in locations.take(20)) {
            sb.append("- ${l.name} | Visits: ${l.visitCount}${l.address?.let { " | Addr: $it" } ?: ""}${l.category?.let { " | Cat: $it" } ?: ""}\n")
        }
        return successResult(sb.toString())
    }

    // ==================== 生理周期 ====================

    private suspend fun getMenstrualStatus(): ToolResult {
        val latest = db.menstrualCycleDao().getLatest()
        if (latest == null) return successResult("No menstrual cycle data found.")
        val sb = StringBuilder("Latest menstrual cycle:\n")
        sb.append("Start: ${latest.startDate}\n")
        sb.append("End: ${latest.endDate ?: "Ongoing"}\n")
        sb.append("Cycle length: ${latest.cycleLength ?: "Unknown"} days\n")
        sb.append("Period length: ${latest.periodLength ?: "Unknown"} days\n")
        latest.symptoms?.let { sb.append("Symptoms: $it\n") }
        latest.note?.let { sb.append("Note: $it\n") }
        // Calculate next period if cycle length is known
        if (latest.cycleLength != null && latest.endDate != null) {
            try {
                val lastStart = dateFormat.parse(latest.startDate)
                val next = Calendar.getInstance().apply { time = lastStart }
                next.add(Calendar.DAY_OF_YEAR, latest.cycleLength!!)
                val daysUntil = (next.timeInMillis - System.currentTimeMillis()) / (1000 * 60 * 60 * 24)
                sb.append("Next expected: ${dateFormat.format(next.time)} (${daysUntil} days from now)\n")
            } catch (_: Exception) {}
        }
        return successResult(sb.toString())
    }

    // ==================== 概览 ====================

    private suspend fun lifeOverview(): ToolResult {
        val sb = StringBuilder("=== Life Overview ===\n\n")
        val today = dateFormat.format(Date())

        // Habits
        val habits = db.habitDao().getActive()
        val checkedToday = habits.count { h ->
            runCatching { db.habitDao().getRecord(h.id, today) != null }.getOrDefault(false)
        }
        sb.append("📋 Habits: $checkedToday/${habits.size} done today\n")

        // Reminders
        val pendingReminders = db.reminderDao().getPending()
        sb.append("⏳ Pending reminders: ${pendingReminders.size}\n")
        for (r in pendingReminders.take(3)) {
            val time = r.triggerAt?.let { timeFormat.format(Date(it)) } ?: "No time"
            sb.append("  - ${r.title} ($time)\n")
        }

        // Today's mood
        val todayMood = db.moodRecordDao().getByDate(today)
        if (todayMood.isNotEmpty()) {
            sb.append("😊 Today's mood: ${todayMood.last().mood} (intensity ${todayMood.last().intensity})\n")
        } else {
            sb.append("😊 Today's mood: Not recorded\n")
        }

        // Today's journal
        val todayJournal = db.journalDao().getByDate(today)
        sb.append("📝 Today's journal: ${if (todayJournal != null) "Written" else "Not written"}\n")

        // Active goals
        val goals = db.goalDao().getActive()
        sb.append("🎯 Active goals: ${goals.size}\n")
        for (g in goals.take(3)) {
            val pct = if (g.targetValue != 0.0) "${"%.0f".format(g.currentValue / g.targetValue * 100)}%" else "N/A"
            sb.append("  - ${g.title}: $pct\n")
        }

        // Upcoming anniversaries
        val anniversaries = db.anniversaryDao().getAll()
        val upcoming = anniversaries.filter { calculateDaysUntil(it.date) in 0..30 }
        if (upcoming.isNotEmpty()) {
            sb.append("🎂 Upcoming (30 days):\n")
            for (a in upcoming) {
                sb.append("  - ${a.icon} ${a.title} (${calculateDaysUntil(a.date)} days)\n")
            }
        }

        return successResult(sb.toString())
    }

    // ==================== Helpers ====================

    private fun successResult(content: String): ToolResult = ToolResult(
        toolName = "life_query",
        success = true,
        result = StringResultData(content),
        error = ""
    )

    private fun errorResult(error: String): ToolResult = ToolResult(
        toolName = "life_query",
        success = false,
        result = StringResultData(""),
        error = error
    )
}
