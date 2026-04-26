package com.star.operit.ui.features.life

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.star.operit.data.db.AppDatabase
import com.star.operit.data.life.entity.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

// ============================================================
// LifeScreenContent - 生活页面主入口
// ============================================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LifeScreenContent() {
    val context = LocalContext.current
    val db = remember { AppDatabase.getDatabase(context) }
    val viewModel: LifeViewModel = remember {
        LifeViewModel(
            lifeEventDao = db.lifeEventDao(),
            habitDao = db.habitDao(),
            reminderDao = db.reminderDao(),
            journalDao = db.journalDao(),
            anniversaryDao = db.anniversaryDao(),
            goalDao = db.goalDao(),
            moodRecordDao = db.moodRecordDao(),
            sleepRecordDao = db.sleepRecordDao(),
            exerciseRecordDao = db.exerciseRecordDao(),
        )
    }

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("时间轴", "习惯", "待办", "日记", "全部", "记账", "联系人", "目标", "报告", "情绪")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("生活") },
                colors = TopAppBarDefaults.topAppBarColors()
            )
        },
        bottomBar = {
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                edgePadding = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                    )
                }
            }
        }
    ) { padding ->
        when (selectedTab) {
            0 -> TimelineTab(viewModel, padding)
            1 -> HabitTab(viewModel, padding)
            2 -> ReminderTab(viewModel, padding)
            3 -> JournalTab(viewModel, padding)
            4 -> AllEventsTab(viewModel, padding)
            5 -> FinanceTab(viewModel, padding)
            6 -> ContactsTab(viewModel, padding)
            7 -> GoalTab(viewModel, padding)
            8 -> ReportTab(viewModel, padding)
            9 -> MoodTab(viewModel, padding)
        }
    }
}

// ============================================================
// ViewModel
// ============================================================

class LifeViewModel(
    private val lifeEventDao: com.star.operit.data.life.dao.LifeEventDao,
    private val habitDao: com.star.operit.data.life.dao.HabitDao,
    private val reminderDao: com.star.operit.data.life.dao.ReminderDao,
    private val journalDao: com.star.operit.data.life.dao.JournalDao,
    private val anniversaryDao: com.star.operit.data.life.dao.AnniversaryDao,
    private val goalDao: com.star.operit.data.life.dao.GoalDao,
    private val moodRecordDao: com.star.operit.data.life.dao.MoodRecordDao,
    private val sleepRecordDao: com.star.operit.data.life.dao.SleepRecordDao,
    private val exerciseRecordDao: com.star.operit.data.life.dao.ExerciseRecordDao,
) : ViewModel() {

    var events by mutableStateOf<List<LifeEventEntity>>(emptyList())
        private set
    var habits by mutableStateOf<List<HabitEntity>>(emptyList())
        private set
    var reminders by mutableStateOf<List<ReminderEntity>>(emptyList())
        private set
    var journals by mutableStateOf<List<JournalEntity>>(emptyList())
        private set
    var anniversaries by mutableStateOf<List<AnniversaryEntity>>(emptyList())
        private set
    var goals by mutableStateOf<List<GoalEntity>>(emptyList())
        private set
    var moodRecords by mutableStateOf<List<MoodRecordEntity>>(emptyList())
        private set
    var sleepRecords by mutableStateOf<List<SleepRecordEntity>>(emptyList())
        private set
    var exerciseRecords by mutableStateOf<List<ExerciseRecordEntity>>(emptyList())
        private set
    var isLoading by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set

    init {
        loadAll()

        // 自动添加示例数据
        viewModelScope.launch {
            if (lifeEventDao.getCount() == 0) {
                insertSampleData()
                loadAll()
            }
        }
    }

    private suspend fun insertSampleData() {
        val now = System.currentTimeMillis()
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        // 示例事件
        lifeEventDao.insert(LifeEventEntity("s1", "work", null, "团队周会", "讨论Q3计划", now - 3600000, now, null, "小王", "同事", "公司", "good", "准备PPT", "active", "[\"work\",\"meeting\"]", "manual"))
        lifeEventDao.insert(LifeEventEntity("s2", "food", null, "和小李吃火锅", "海底捞", now - 7200000, now - 3600000, 120.0, "小李", "朋友", "商场", "happy", "很好吃", "active", "[\"food\",\"social\"]", "manual"))
        lifeEventDao.insert(LifeEventEntity("s3", "exercise", null, "跑步5公里", "晨跑", now - 86400000, now - 86400000 + 1800000, null, null, null, "公园", "good", null, "active", "[\"exercise\",\"health\"]", "manual"))

        // 示例习惯
        habitDao.insert(HabitEntity("h1", "喝水8杯", "💧", "daily", 8, "#2196F3"))
        habitDao.insert(HabitEntity("h2", "阅读30分钟", "📖", "daily", 1, "#4CAF50"))
        habitDao.insert(HabitEntity("h3", "冥想10分钟", "🧘", "daily", 1, "#9C27B0"))
        habitDao.insert(HabitEntity("h4", "运动", "🏃", "daily", 1, "#FF9800"))

        // 示例待办
        reminderDao.insert(ReminderEntity("r1", "交房租", "月度房租", "time", now + 86400000 * 3, null, null, null, null, "monthly"))
        reminderDao.insert(ReminderEntity("r2", "买生日礼物", "小李生日", "time", now + 86400000 * 7, null, null, null, null, null))
        reminderDao.insert(ReminderEntity("r3", "提交周报", null, "time", now + 86400000, null, null, null, null, "weekly"))

        // 示例日记
        journalDao.insert(JournalEntity("j1", today, "美好的一天", "今天天气很好，早上跑了5公里，中午和小李吃了火锅。下午开了团队周会，讨论了Q3计划。晚上看了一章书。", "happy", "晴天 25°C", "公园/商场", "[\"s1\",\"s2\",\"s3\"]"))

        // 示例纪念日
        anniversaryDao.insert(AnniversaryEntity("a1", "小李生日", "06-15", "birthday", "小李", true, 3, "🎂"))
        anniversaryDao.insert(AnniversaryEntity("a2", "结婚纪念日", "2025-10-01", "anniversary", null, true, 7, "💝"))

        // 示例目标
        goalDao.insert(GoalEntity("g1", "减重到70kg", "今年减重目标", "number", 70.0, 75.0, "kg", "2025-01-01", "2025-12-31"))
        goalDao.insert(GoalEntity("g2", "读完24本书", "每月2本", "number", 24.0, 8.0, "本", "2025-01-01", "2025-12-31"))

        // 示例情绪
        moodRecordDao.insert(MoodRecordEntity("m1", today, "09:00", "happy", 8, "跑步后心情很好", "[\"s3\"]", "[\"运动\",\"好天气\"]"))
        moodRecordDao.insert(MoodRecordEntity("m2", today, "14:00", "good", 6, "会议顺利", "[\"s1\"]", "[\"社交\"]"))
    }

    fun loadAll() {
        viewModelScope.launch {
            isLoading = true
            try {
                events = lifeEventDao.getAll()
                habits = habitDao.getActive()
                reminders = reminderDao.getAll()
                journals = journalDao.getAll()
                anniversaries = anniversaryDao.getAll()
                goals = goalDao.getActive()
                moodRecords = moodRecordDao.getAll()
                sleepRecords = sleepRecordDao.getAll()
                exerciseRecords = exerciseRecordDao.getAll()
            } catch (e: Exception) {
                errorMessage = e.message
                Log.e("LifeViewModel", "Load failed", e)
            } finally {
                isLoading = false
            }
        }
    }

    // --- Habit ---
    fun toggleHabit(habitId: String) {
        viewModelScope.launch {
            val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val existing = habitDao.getRecord(habitId, today)
            if (existing != null) {
                habitDao.insertRecord(existing.copy(completedCount = existing.completedCount + 1))
            } else {
                habitDao.insertRecord(HabitRecordEntity(UUID.randomUUID().toString(), habitId, today, 1))
            }
            // Reload
            habits = habitDao.getActive()
        }
    }

    // --- Reminder ---
    fun completeReminder(id: String) {
        viewModelScope.launch {
            reminderDao.markCompleted(id)
            reminders = reminderDao.getAll()
        }
    }

    // --- Event CRUD ---
    fun deleteEvent(id: String) {
        viewModelScope.launch {
            lifeEventDao.deleteById(id)
            events = lifeEventDao.getAll()
        }
    }

    fun addEvent(event: LifeEventEntity) {
        viewModelScope.launch {
            lifeEventDao.insert(event)
            events = lifeEventDao.getAll()
        }
    }
}

// ============================================================
// Tab: 时间轴
// ============================================================

@Composable
fun TimelineTab(viewModel: LifeViewModel, padding: PaddingValues) {
    val events = viewModel.events.sortedByDescending { it.startAt }
    val dateFormat = remember { SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()) }

    if (events.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.EventNote, contentDescription = null, modifier = Modifier.size(64.dp), tint = MaterialTheme.colorScheme.outline)
                Spacer(Modifier.height(16.dp))
                Text("暂无生活事件", style = MaterialTheme.typography.titleMedium)
                Text("数据已自动添加示例", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            items(events) { event ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(event.title, style = MaterialTheme.typography.titleSmall)
                            if (event.description != null) {
                                Text(event.description!!, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                            }
                            Row {
                                Text(dateFormat.format(event.startAt), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                                if (event.personName != null) {
                                    Text(" · 👤 ${event.personName}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                                }
                                if (event.amount != null) {
                                    Text(" · ¥${event.amount}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                        IconButton(onClick = { viewModel.deleteEvent(event.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "删除", tint = MaterialTheme.colorScheme.outline)
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 习惯
// ============================================================

@Composable
fun HabitTab(viewModel: LifeViewModel, padding: PaddingValues) {
    val today = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(vertical = 8.dp)
    ) {
        items(viewModel.habits) { habit ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(habit.icon, fontSize = 24.sp)
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(habit.name, style = MaterialTheme.typography.titleSmall)
                        Text("目标: ${habit.targetCount}次/${habit.frequency}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    FilledTonalButton(onClick = { viewModel.toggleHabit(habit.id) }) {
                        Icon(Icons.Default.Check, contentDescription = "打卡", modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("打卡")
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 待办
// ============================================================

@Composable
fun ReminderTab(viewModel: LifeViewModel, padding: PaddingValues) {
    val dateFormat = remember { SimpleDateFormat("MM/dd HH:mm", Locale.getDefault()) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(vertical = 8.dp)
    ) {
        items(viewModel.reminders) { reminder ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            reminder.title,
                            style = MaterialTheme.typography.titleSmall,
                            color = if (reminder.isCompleted) MaterialTheme.colorScheme.outline else MaterialTheme.colorScheme.onSurface
                        )
                        if (reminder.description != null) {
                            Text(reminder.description!!, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        if (reminder.triggerAt != null) {
                            Text(dateFormat.format(reminder.triggerAt!!), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                        }
                    }
                    if (!reminder.isCompleted) {
                        FilledTonalButton(onClick = { viewModel.completeReminder(reminder.id) }) {
                            Icon(Icons.Default.Check, contentDescription = "完成", modifier = Modifier.size(18.dp))
                        }
                    } else {
                        Icon(Icons.Default.CheckCircle, contentDescription = "已完成", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 日记
// ============================================================

@Composable
fun JournalTab(viewModel: LifeViewModel, padding: PaddingValues) {
    if (viewModel.journals.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Text("暂无日记", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.outline)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            items(viewModel.journals) { journal ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (journal.mood != null) {
                                Text(moodToEmoji(journal.mood!!), fontSize = 20.sp)
                                Spacer(Modifier.width(8.dp))
                            }
                            Text(journal.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                            if (journal.weather != null) {
                                Text(" · ${journal.weather}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                            }
                        }
                        if (journal.title != null) {
                            Text(journal.title!!, style = MaterialTheme.typography.titleSmall)
                        }
                        Text(
                            journal.content,
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 4,
                            overflow = TextOverflow.Ellipsis,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 全部事件
// ============================================================

@Composable
fun AllEventsTab(viewModel: LifeViewModel, padding: PaddingValues) {
    val grouped = viewModel.events.groupBy { event ->
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(event.startAt)
    }.toSortedMap(reverseOrder())

    if (grouped.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Text("暂无事件", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.outline)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            grouped.forEach { (date, events) ->
                item {
                    Text(date, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                }
                items(events) { event ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(event.title, style = MaterialTheme.typography.bodyLarge)
                            if (event.description != null) {
                                Text(event.description!!, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 记账
// ============================================================

@Composable
fun FinanceTab(viewModel: LifeViewModel, padding: PaddingValues) {
    val financeEvents = viewModel.events.filter { it.amount != null }
    val totalExpense = financeEvents.filter { it.amount!! < 0 }.sumOf { it.amount!! }
    val totalIncome = financeEvents.filter { it.amount!! > 0 }.sumOf { it.amount!! }

    Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
        // 统计卡片
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("财务概览", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("收入", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                        Text("¥${"%.0f".format(totalIncome)}", color = MaterialTheme.colorScheme.primary)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("支出", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                        Text("¥${"%.0f".format(Math.abs(totalExpense))}", color = MaterialTheme.colorScheme.error)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("净额", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                        Text("¥${"%.0f".format(totalIncome + totalExpense)}", color = if (totalIncome + totalExpense >= 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
        Spacer(Modifier.height(8.dp))

        // 明细列表
        LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            items(financeEvents) { event ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(event.title, style = MaterialTheme.typography.bodyLarge)
                        }
                        Text(
                            "¥${event.amount}",
                            style = MaterialTheme.typography.titleSmall,
                            color = if (event.amount!! > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 联系人
// ============================================================

@Composable
fun ContactsTab(viewModel: LifeViewModel, padding: PaddingValues) {
    val contacts = viewModel.events
        .filter { it.personName != null }
        .groupBy { it.personName!! }
        .mapValues { it.value.size }

    if (contacts.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Text("暂无联系人记录", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.outline)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            contacts.entries.sortedByDescending { it.value }.forEach { (name, count) ->
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(name, style = MaterialTheme.typography.bodyLarge)
                                Text("${count}次互动", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 目标
// ============================================================

@Composable
fun GoalTab(viewModel: LifeViewModel, padding: PaddingValues) {
    if (viewModel.goals.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Text("暂无目标", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.outline)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            items(viewModel.goals) { goal ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(goal.title, style = MaterialTheme.typography.titleSmall)
                        val progress = if (goal.targetValue != 0.0) ((goal.currentValue / goal.targetValue) * 100).coerceIn(0, 100) else 0.0
                        LinearProgressIndicator(
                            progress = { (progress / 100).toFloat() },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        )
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${goal.currentValue}/${goal.targetValue} ${goal.unit}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
                            Text("${"%.0f".format(progress)}%", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// Tab: 报告
// ============================================================

@Composable
fun ReportTab(viewModel: LifeViewModel, padding: PaddingValues) {
    val eventCount = viewModel.events.size
    val contactCount = viewModel.events.mapNotNull { it.personName }.distinct().size
    val totalSpent = viewModel.events.mapNotNull { it.amount }.filter { it < 0 }.sumOf { Math.abs(it) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(vertical = 8.dp)
    ) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("生活统计概览", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(12.dp))
                    StatRow("📋 总事件数", "$eventCount")
                    StatRow("👥 联系人数", "$contactCount")
                    StatRow("💰 总支出", "¥${"%.0f".format(totalSpent)}")
                    StatRow("😊 记录情绪", "${viewModel.moodRecords.size}次")
                    StatRow("🏃 运动记录", "${viewModel.exerciseRecords.size}次")
                    StatRow("😴 睡眠记录", "${viewModel.sleepRecords.size}次")
                }
            }
        }
        // 纪念日
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("📅 即将到来", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(8.dp))
                    viewModel.anniversaries.forEach { ann ->
                        val daysLeft = calculateDaysUntil(ann.date)
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${ann.icon} ${ann.title}", style = MaterialTheme.typography.bodyMedium)
                            Text(
                                if (daysLeft == 0) "今天！" else "${daysLeft}天后",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (daysLeft <= 3) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
    }
}

private fun calculateDaysUntil(dateStr: String): Int {
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val target = sdf.parse(dateStr)
    return if (target != null) {
        val diff = target.time - System.currentTimeMillis()
        (diff / (1000 * 60 * 60 * 24)).toInt()
    } else Int.MAX_VALUE
}

// ============================================================
// Tab: 情绪
// ============================================================

@Composable
fun MoodTab(viewModel: LifeViewModel, padding: PaddingValues) {
    if (viewModel.moodRecords.isEmpty()) {
        Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Text("暂无情绪记录", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.outline)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            // 情绪分布
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("情绪分布", style = MaterialTheme.typography.titleSmall)
                        Spacer(Modifier.height(8.dp))
                        val moodGroups = viewModel.moodRecords.groupBy { it.mood }
                        moodGroups.entries.sortedByDescending { it.value.size }.forEach { (mood, records) ->
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(moodToEmoji(mood), fontSize = 20.sp)
                                Spacer(Modifier.width(8.dp))
                                LinearProgressIndicator(
                                    progress = { records.size.toFloat() / viewModel.moodRecords.size.toFloat() },
                                    modifier = Modifier.weight(1f).padding(end = 8.dp),
                                )
                                Text("${records.size}", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
            // 情绪记录列表
            items(viewModel.moodRecords) { record ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(moodToEmoji(record.mood), fontSize = 24.sp)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("${record.mood} (${record.intensity}/10)", style = MaterialTheme.typography.bodyLarge)
                            Text(record.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                            if (record.note != null) {
                                Text(record.note!!, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun moodToEmoji(mood: String): String = when (mood.lowercase()) {
    "happy" -> "😊"
    "good" -> "🙂"
    "neutral" -> "😐"
    "bad" -> "😕"
    "sad" -> "😢"
    "angry" -> "😠"
    "anxious" -> "😰"
    else -> "❓"
}