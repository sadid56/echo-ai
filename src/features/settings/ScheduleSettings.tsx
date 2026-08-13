import React, { useState } from "react";
import { TextField } from "../../components/ui/textField";
import { Dropdown } from "../../components/ui/dropdown";
import { Button } from "../../components/ui/button";
import { ScheduledTask } from "../../store/chatStore";

interface ScheduleSettingsProps {
  scheduleList: ScheduledTask[];
  setScheduleList: React.Dispatch<React.SetStateAction<ScheduledTask[]>>;
}

const frequencyOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Interval (Minutes)", value: "interval" },
];

export function ScheduleSettings({ scheduleList, setScheduleList }: ScheduleSettingsProps) {
  // Form states for adding a new scheduled task
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskFrequency, setNewTaskFrequency] = useState("daily");
  const [newTaskDayOfMonth, setNewTaskDayOfMonth] = useState(1);
  const [newTaskDayOfWeek, setNewTaskDayOfWeek] = useState(1);
  const [newTaskHour, setNewTaskHour] = useState(9);
  const [newTaskMinute, setNewTaskMinute] = useState(0);
  const [newTaskIntervalMinutes, setNewTaskIntervalMinutes] = useState(2);
  const [newTaskPrompt, setNewTaskPrompt] = useState("");

  const handleAddTask = () => {
    if (!newTaskName.trim() || !newTaskPrompt.trim()) return;

    const newTask: ScheduledTask = {
      name: newTaskName.trim(),
      frequency: newTaskFrequency,
      day_of_month: newTaskFrequency === "monthly" ? Number(newTaskDayOfMonth) : null,
      day_of_week: newTaskFrequency === "weekly" ? Number(newTaskDayOfWeek) : null,
      hour: newTaskFrequency !== "interval" ? Number(newTaskHour) : null,
      minute: newTaskFrequency !== "interval" ? Number(newTaskMinute) : null,
      interval_minutes: newTaskFrequency === "interval" ? Number(newTaskIntervalMinutes) : null,
      prompt: newTaskPrompt.trim(),
    };

    setScheduleList((prev) => [...prev, newTask]);

    setNewTaskName("");
    setNewTaskFrequency("daily");
    setNewTaskDayOfMonth(1);
    setNewTaskDayOfWeek(1);
    setNewTaskHour(9);
    setNewTaskMinute(0);
    setNewTaskIntervalMinutes(2);
    setNewTaskPrompt("");
  };

  const handleRemoveTask = (index: number) => {
    setScheduleList((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTaskScheduleLabel = (task: ScheduledTask) => {
    switch (task.frequency) {
      case "daily":
        return `Daily at ${String(task.hour).padStart(2, "0")}:${String(task.minute).padStart(2, "0")}`;
      case "weekly":
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayLabel = dayNames[(task.day_of_week ?? 1) - 1] ?? "Monday";
        return `Weekly on ${dayLabel} at ${String(task.hour).padStart(2, "0")}:${String(task.minute).padStart(2, "0")}`;
      case "monthly":
        return `Monthly on the ${task.day_of_month}th day at ${String(task.hour).padStart(2, "0")}:${String(task.minute).padStart(2, "0")}`;
      case "interval":
        return `Repeat every ${task.interval_minutes} minutes`;
      default:
        return "Task Schedule";
    }
  };

  return (
    <div className='space-y-4 animate-fadeIn'>
      <div className='space-y-3.5'>
        <h3 className='border-l-2 border-accent-cyan pl-2 text-[10.5px] font-bold uppercase tracking-wider text-accent-cyan'>
          Scheduled Tasks & Cron Setup
        </h3>

        {scheduleList.length === 0 ? (
          <p className='text-xs text-text-muted italic bg-bg-secondary/40 p-4 rounded-xl border border-border-color/20'>
            No scheduled routine tasks configured. Add one below!
          </p>
        ) : (
          <div className='space-y-2'>
            {scheduleList.map((task, idx) => (
              <div
                key={idx}
                className='flex items-center justify-between bg-bg-secondary/60 p-4 rounded-xl border border-border-color/40 shadow-sm'
              >
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-bold text-accent-cyan'>{task.name}</span>
                    <span className='text-[10px] bg-bg-primary border border-border-color px-2.5 py-0.5 rounded text-text-muted font-mono'>
                      {formatTaskScheduleLabel(task)}
                    </span>
                  </div>
                  <p className='mt-1 text-xs text-text-muted line-clamp-1'>{task.prompt}</p>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleRemoveTask(idx)}
                  className='text-[10px] text-accent-red hover:text-accent-red/80 border-none shadow-none font-bold uppercase tracking-wider pl-4'
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className='bg-bg-secondary/40 p-4 rounded-xl border border-border-color/30 mt-4 space-y-3.5'>
          <h4 className='text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border-color/30 pb-1.5'>
            Add New Scheduled Task
          </h4>
          <div className='grid gap-4 sm:grid-cols-2'>
            <TextField
              label='Task Name'
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder='e.g., Morning Briefing Summary'
            />
            <div className='space-y-1'>
              <label className='text-[9.5px] font-bold uppercase tracking-wider text-text-muted select-none'>
                Frequency Schedule
              </label>
              <Dropdown
                value={newTaskFrequency}
                onChange={(nextValue) => setNewTaskFrequency(nextValue)}
                options={frequencyOptions}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-3 bg-bg-primary/20 p-3 rounded-lg border border-border-color/10'>
            {newTaskFrequency === "interval" ? (
              <div className='sm:col-span-3'>
                <TextField
                  label='Repeat Interval (Minutes)'
                  type='number'
                  min={1}
                  value={newTaskIntervalMinutes}
                  onChange={(e) => setNewTaskIntervalMinutes(Math.max(1, Number(e.target.value)))}
                />
              </div>
            ) : (
              <>
                {newTaskFrequency === "monthly" && (
                  <TextField
                    label='Day of Month (1-31)'
                    type='number'
                    min={1}
                    max={31}
                    value={newTaskDayOfMonth}
                    onChange={(e) => setNewTaskDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
                  />
                )}

                {newTaskFrequency === "weekly" && (
                  <div className='space-y-1'>
                    <label className='text-[9.5px] font-bold uppercase tracking-wider text-text-muted select-none'>
                      Day of Week
                    </label>
                    <Dropdown
                      value={String(newTaskDayOfWeek)}
                      onChange={(val) => setNewTaskDayOfWeek(Number(val))}
                      options={[
                        { label: "Monday", value: "1" },
                        { label: "Tuesday", value: "2" },
                        { label: "Wednesday", value: "3" },
                        { label: "Thursday", value: "4" },
                        { label: "Friday", value: "5" },
                        { label: "Saturday", value: "6" },
                        { label: "Sunday", value: "7" },
                      ]}
                    />
                  </div>
                )}

                <TextField
                  label='Hour (0-23)'
                  type='number'
                  min={0}
                  max={23}
                  value={newTaskHour}
                  onChange={(e) => setNewTaskHour(Math.min(23, Math.max(0, Number(e.target.value))))}
                />

                <TextField
                  label='Min (0-59)'
                  type='number'
                  min={0}
                  max={59}
                  value={newTaskMinute}
                  onChange={(e) => setNewTaskMinute(Math.min(59, Math.max(0, Number(e.target.value))))}
                />
              </>
            )}
          </div>

          <TextField
            label='AI Agent Prompt Directive'
            textarea
            rows={2}
            value={newTaskPrompt}
            onChange={(e) => setNewTaskPrompt(e.target.value)}
            placeholder='What prompt directions should the AI follow at this time? (e.g. check emails, browse tech news)'
          />
          <Button variant='primary' fullWidth onClick={handleAddTask}>
            Add Task to Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
