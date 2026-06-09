import { useEffect, useMemo, useState } from 'react'

type Task = {
  id: number
  date: string
  stack: string
  topic: string
  planned_hours: number
  actual_hours: number
  completed: boolean
}

const API_URL = 'http://127.0.0.1:8000'

function formatSeconds(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newTask, setNewTask] = useState({
    date: new Date().toISOString().slice(0, 10),
    stack: '',
    topic: '',
    planned_hours: '1',
    actual_hours: '0',
    completed: false,
  })
  const [editValues, setEditValues] = useState({
    date: '',
    stack: '',
    topic: '',
    planned_hours: '',
    actual_hours: '',
    completed: false,
  })
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [alarmTime, setAlarmTime] = useState('18:00')
  const [alarmNote, setAlarmNote] = useState('Start daily DSA review')
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [alarmTriggered, setAlarmTriggered] = useState(false)
  const [alarmStatus, setAlarmStatus] = useState('No alarm set')
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'currentWeek' | 'lastWeek' | 'lastMonth' | 'date'>('today')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedSection, setSelectedSection] = useState<'home' | 'stopwatch' | 'tasks' | 'reminder'>('home')
  const [dailyTrackedSeconds, setDailyTrackedSeconds] = useState(0)
  const userName = 'Reddy'
  const quoteOfDay = 'Focus on progress, not perfection.'
  const quoteMeaning = 'Small, consistent study sessions build lasting skill and confidence.'
  const heroImage = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80'

  const playAlarmSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 880
      gain.gain.value = 0.2
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        context.close()
      }, 2000)
    } catch (error) {
      console.warn('Unable to play alarm sound:', error)
    }
  }

  const triggerAlarm = () => {
    setAlarmTriggered(true)
    setAlarmEnabled(false)
    setAlarmStatus(`Alarm triggered: ${alarmNote}`)

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Learning Tracker Alarm', { body: alarmNote })
    }

    if (document.hidden) {
      const originalTitle = document.title
      document.title = `⏰ ${alarmNote}`
      setTimeout(() => {
        document.title = originalTitle
      }, 10000)
    }

    playAlarmSound()
  }

  useEffect(() => {
    if (!alarmEnabled) {
      return undefined
    }

    const interval = setInterval(() => {
      const now = new Date()
      const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`

      if (nowTime === alarmTime && !alarmTriggered) {
        triggerAlarm()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [alarmEnabled, alarmTime, alarmNote, alarmTriggered])

  const setAlarm = () => {
    if (!alarmTime) {
      setAlarmStatus('Please choose a time for the alarm.')
      return
    }

    setAlarmEnabled(true)
    setAlarmTriggered(false)
    setAlarmStatus(`Alarm set for ${alarmTime}`)
  }

  const cancelAlarm = () => {
    setAlarmEnabled(false)
    setAlarmTriggered(false)
    setAlarmStatus('Alarm cancelled')
  }

  const getTodayStopwatchKey = () => `stopwatch-${new Date().toISOString().slice(0, 10)}`

  const parseDateString = (dateString: string) => new Date(`${dateString}T00:00:00`) 
  const showStopwatch = selectedSection === 'stopwatch'
  const showTasks = selectedSection === 'tasks'
  const showReminder = selectedSection === 'reminder'
  const showHome = selectedSection === 'home'
  const layoutColumns = 'grid-cols-1'

  const startOfWeek = (date: Date) => {
    const copy = new Date(date)
    const day = copy.getDay()
    const diff = copy.getDate() - day + (day === 0 ? -6 : 1)
    copy.setDate(diff)
    copy.setHours(0, 0, 0, 0)
    return copy
  }
  const endOfWeek = (date: Date) => {
    const start = startOfWeek(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }
  const startOfMonth = (date: Date) => {
    const copy = new Date(date)
    copy.setDate(1)
    copy.setHours(0, 0, 0, 0)
    return copy
  }
  const endOfMonth = (date: Date) => {
    const copy = new Date(date)
    copy.setMonth(copy.getMonth() + 1, 0)
    copy.setHours(23, 59, 59, 999)
    return copy
  }

  const filteredTasks = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const currentWeekStart = startOfWeek(now)
    const currentWeekEnd = endOfWeek(now)

    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(previousWeekStart)
    previousWeekEnd.setDate(previousWeekStart.getDate() + 6)
    previousWeekEnd.setHours(23, 59, 59, 999)

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)

    const selected = parseDateString(selectedDate)
    selected.setHours(0, 0, 0, 0)
    const selectedEnd = new Date(selected)
    selectedEnd.setHours(23, 59, 59, 999)

    const byView = tasks.filter((task) => {
      const taskDate = parseDateString(task.date)

      if (viewMode === 'today') {
        return taskDate >= todayStart && taskDate <= todayEnd
      }

      if (viewMode === 'currentWeek') {
        return taskDate >= currentWeekStart && taskDate <= currentWeekEnd
      }

      if (viewMode === 'lastWeek') {
        return taskDate >= previousWeekStart && taskDate <= previousWeekEnd
      }

      if (viewMode === 'lastMonth') {
        return taskDate >= lastMonthStart && taskDate <= lastMonthEnd
      }

      if (viewMode === 'date') {
        return taskDate >= selected && taskDate <= selectedEnd
      }

      return true
    })

    if (statusFilter === 'completed') {
      return byView.filter((task) => task.completed)
    }

    if (statusFilter === 'incomplete') {
      return byView.filter((task) => !task.completed)
    }

    return byView
  }, [tasks, viewMode, statusFilter, selectedDate])

  const totalHours = useMemo(
    () => filteredTasks.reduce((sum, task) => sum + task.actual_hours, 0),
    [filteredTasks],
  )

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/tasks/`)
        if (!response.ok) {
          throw new Error('Unable to load tasks')
        }
        const data: Task[] = await response.json()
        setTasks(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()

    const storedSeconds = localStorage.getItem(getTodayStopwatchKey())
    if (storedSeconds) {
      setDailyTrackedSeconds(Number(storedSeconds))
    }
  }, [])

  useEffect(() => {
    if (!timerRunning) {
      return undefined
    }

    const todayKey = getTodayStopwatchKey()
    const interval = setInterval(() => {
      setElapsedSeconds((current) => current + 1)
      setDailyTrackedSeconds((current) => {
        const next = current + 1
        localStorage.setItem(todayKey, String(next))
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerRunning])

  const handleFieldChange = (field: string, value: string | boolean) => {
    setNewTask((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleEditValueChange = (field: string, value: string | boolean) => {
    setEditValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const refreshTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/tasks/`)
      if (!response.ok) throw new Error('Unable to load tasks')
      setTasks(await response.json())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const response = await fetch(`${API_URL}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newTask.date,
          stack: newTask.stack,
          topic: newTask.topic,
          planned_hours: Number(newTask.planned_hours),
          actual_hours: Number(newTask.actual_hours),
          completed: newTask.completed,
        }),
      })
      if (!response.ok) throw new Error('Unable to create task')
      const created: Task = await response.json()
      setTasks((current) => [created, ...current])
      setNewTask({
        date: new Date().toISOString().slice(0, 10),
        stack: '',
        topic: '',
        planned_hours: '1',
        actual_hours: '0',
        completed: false,
      })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const beginEdit = (task: Task) => {
    setEditingId(task.id)
    setEditValues({
      date: task.date,
      stack: task.stack,
      topic: task.topic,
      planned_hours: String(task.planned_hours),
      actual_hours: String(task.actual_hours),
      completed: task.completed,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editValues.date,
          stack: editValues.stack,
          topic: editValues.topic,
          planned_hours: Number(editValues.planned_hours),
          actual_hours: Number(editValues.actual_hours),
          completed: editValues.completed,
        }),
      })
      if (!response.ok) throw new Error('Unable to update task')
      const updated: Task = await response.json()
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)))
      setEditingId(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const deleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Unable to delete task')
      setTasks((current) => current.filter((task) => task.id !== taskId))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const toggleComplete = async (task: Task) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (!response.ok) throw new Error('Unable to update task')
      const updated: Task = await response.json()
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40">
        <header className="mb-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Good day, {userName}</p>
              <h1 className="text-4xl font-semibold">Learning Tracker</h1>
              <p className="mt-3 max-w-2xl text-slate-400">“{quoteOfDay}”</p>
            </div>
            <div className="rounded-3xl bg-slate-800 px-5 py-4 text-center sm:text-right">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Today's total</p>
              <p className="text-3xl font-semibold">{totalHours.toFixed(1)}h</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { key: 'home', label: 'Home' },
              { key: 'stopwatch', label: 'Stopwatch' },
              { key: 'tasks', label: 'Tasks' },
              { key: 'reminder', label: 'Reminder' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedSection(item.key as any)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  selectedSection === item.key
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className={`grid gap-6 ${layoutColumns}`}>
          <div className="space-y-6">
            {showHome ? (
              <article className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-inner shadow-slate-950/30">
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                  <div>
                    <h2 className="mb-4 text-3xl font-semibold">Welcome back, {userName}</h2>
                    <p className="mb-4 text-slate-400 text-lg">{quoteOfDay}</p>
                    <p className="mb-4 text-slate-300">{quoteMeaning}</p>
                    <p className="text-slate-400">This dashboard helps you capture your daily learning habits, keep your tasks organized, and stay on track with focused time tracking.</p>
                  </div>
                  <img
                    src={heroImage}
                    alt="Learning tracker illustration"
                    className="h-64 w-full rounded-3xl object-cover shadow-xl shadow-slate-950/20"
                  />
                </div>
              </article>
            ) : null}

            {showStopwatch ? (
              <article className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-inner shadow-slate-950/30">
                <h2 className="mb-4 text-xl font-semibold">Stopwatch</h2>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-5xl font-semibold">{formatSeconds(elapsedSeconds)}</p>
                    <p className="mt-2 text-sm text-slate-400">Today tracked: {formatSeconds(dailyTrackedSeconds)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setTimerRunning(true)}
                      className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => setTimerRunning(false)}
                      className="rounded-2xl bg-slate-800 px-5 py-3 text-slate-200 transition hover:bg-slate-700"
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => {
                        setTimerRunning(false)
                        setElapsedSeconds(0)
                      }}
                      className="rounded-2xl bg-slate-800 px-5 py-3 text-slate-200 transition hover:bg-slate-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </article>
            ) : null}

            {showTasks ? (
              <article className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-inner shadow-slate-950/30">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <h2 className="mb-2 text-xl font-semibold">Tasks</h2>
                  <p className="text-slate-400">Add or update daily learning topics and time totals.</p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm text-slate-300">
                      View:
                      <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as any)}
                        className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
                      >
                        <option value="today">Today</option>
                        <option value="currentWeek">Current week</option>
                        <option value="lastWeek">Last week</option>
                        <option value="lastMonth">Last month</option>
                        <option value="date">Particular date</option>
                        <option value="all">All data</option>
                      </select>
                    </label>

                    <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm text-slate-300">
                      Status:
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
                      >
                        <option value="all">All</option>
                        <option value="completed">Completed</option>
                        <option value="incomplete">Incomplete</option>
                      </select>
                    </label>

                    {viewMode === 'date' ? (
                      <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm text-slate-300">
                        Date:
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none"
                        />
                      </label>
                    ) : null}
                  </div>
                  <button
                    onClick={refreshTasks}
                    className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <form onSubmit={createTask} className="mb-6 grid gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 grid-cols-1 lg:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-300">
                  Date
                  <input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Stack
                  <input
                    value={newTask.stack}
                    onChange={(e) => handleFieldChange('stack', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300">
                  Topic
                  <input
                    value={newTask.topic}
                    onChange={(e) => handleFieldChange('topic', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-300">
                    Planned hours
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTask.planned_hours}
                      onChange={(e) => handleFieldChange('planned_hours', e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-300">
                    Actual hours
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={newTask.actual_hours}
                      onChange={(e) => handleFieldChange('actual_hours', e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={newTask.completed}
                      onChange={(e) => handleFieldChange('completed', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500"
                    />
                    Completed
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded-3xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Add task
                </button>
              </form>

              {error ? <p className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p> : null}
              {loading ? (
                <p className="text-slate-400">Loading tasks...</p>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                    <thead className="bg-slate-950/80">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Stack</th>
                        <th className="px-4 py-3">Topic</th>
                        <th className="px-4 py-3">Hours</th>
                        <th className="px-4 py-3">Done</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-950">
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                            No tasks found for the selected view and status.
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map((task) => (
                          <tr key={task.id}>
                            <td className="px-4 py-3">
                              {editingId === task.id ? (
                                <input
                                  type="date"
                                  value={editValues.date}
                                  onChange={(e) => handleEditValueChange('date', e.target.value)}
                                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                                />
                              ) : (
                                task.date
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingId === task.id ? (
                                <input
                                  value={editValues.stack}
                                  onChange={(e) => handleEditValueChange('stack', e.target.value)}
                                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                                />
                              ) : (
                                task.stack
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingId === task.id ? (
                                <input
                                  value={editValues.topic}
                                  onChange={(e) => handleEditValueChange('topic', e.target.value)}
                                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                                />
                              ) : (
                                task.topic
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingId === task.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editValues.actual_hours}
                                  onChange={(e) => handleEditValueChange('actual_hours', e.target.value)}
                                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
                                />
                              ) : (
                                task.actual_hours.toFixed(1)
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => toggleComplete(task)}
                                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 space-x-2">
                              {editingId === task.id ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(task.id)}
                                    className="rounded-2xl bg-sky-500 px-3 py-1 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="rounded-2xl bg-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => beginEdit(task)}
                                    className="rounded-2xl bg-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="rounded-2xl bg-rose-600 px-3 py-1 text-xs transition hover:bg-rose-500"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
            ) : null}
          </div>

          {showReminder ? (
            <aside className="space-y-6">
            <article className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-inner shadow-slate-950/30">
              <h2 className="mb-4 text-xl font-semibold">Reminder</h2>
              <div className="space-y-4">
                <label className="space-y-2 text-sm text-slate-300">
                  Reminder text
                  <input
                    type="text"
                    value={alarmNote}
                    onChange={(e) => setAlarmNote(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-300">
                  Alarm time
                  <input
                    type="time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={setAlarm}
                    className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Set alarm
                  </button>
                  <button
                    onClick={cancelAlarm}
                    className="flex-1 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                  >
                    Cancel alarm
                  </button>
                </div>
                <div className="rounded-3xl bg-slate-900 p-4 text-sm text-slate-300">
                  <p>Status: {alarmStatus}</p>
                  <p>{alarmEnabled ? 'Alarm is active.' : 'Alarm is not active.'}</p>
                  <p>Notification permission: {notificationPermission}</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-inner shadow-slate-950/30">
              <h2 className="mb-4 text-xl font-semibold">Monthly summary</h2>
              <p className="text-slate-300">Live summary is coming soon. Use the tasks panel to capture work by day.</p>
            </article>
          </aside>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default App
