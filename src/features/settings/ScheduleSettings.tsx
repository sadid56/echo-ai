import React, { useState } from "react";
import { TextField } from "../../components/ui/textField";
import { Dropdown } from "../../components/ui/dropdown";
import { Button } from "../../components/ui/button";
import { ScheduledTask } from "../../store/chatStore";
import { Card } from "../../components/ui/Card";
import { SectionHeader } from "../../components/ui/SectionHeader";

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
    <div className='space-y-6 animate-fadeIn'>
      <div className='space-y-4'>
        <SectionHeader>Scheduled Tasks & Cron Setup</SectionHeader>

        {scheduleList.length === 0 ? (
          <p className='text-xs text-m3-on-surface-variant/70 italic bg-m3-surface-container/40 p-4 rounded-2xl border border-m3-outline-variant/40'>
            No scheduled routine tasks configured. Add one below!
          </p>
        ) : (
          <div className='space-y-3.5'>
            {scheduleList.map((task, idx) => (
              <Card key={idx} className='flex items-center justify-between p-4 sm:p-4.5 space-y-0 shadow-sm'>
                <div>
                  <div className='flex items-center gap-2.5'>
                    <span className='text-xs font-bold text-m3-primary'>{task.name}</span>
                    <span className='text-[10px] bg-m3-surface-container border border-m3-outline-variant px-2.5 py-0.5 rounded-full text-m3-on-surface-variant font-mono'>
                      {formatTaskScheduleLabel(task)}
                    </span>
                  </div>
                  <p className='mt-1 text-xs text-m3-on-surface-variant line-clamp-1'>{task.prompt}</p>
                </div>
                <Button variant='error' size='sm' onClick={() => handleRemoveTask(idx)} className='shrink-0'>
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        )}

        <Card className='mt-6 space-y-6 shadow-sm'>
          <div>
            <h4 className='text-xs font-semibold text-m3-on-surface'>Add New Scheduled Task</h4>
          </div>

          <div className='grid gap-6 sm:grid-cols-2'>
            <TextField
              label='Task Name'
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder='e.g., Morning Briefing Summary'
            />
            <Dropdown value={newTaskFrequency} onChange={(nextValue) => setNewTaskFrequency(nextValue)} options={frequencyOptions} />
          </div>

          <div
            className={`grid gap-6 ${newTaskFrequency === "weekly" || newTaskFrequency === "monthly" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          >
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
                  <div className='space-y-2'>
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
                  className='w-full'
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
        </Card>
      </div>
    </div>
  );
}
