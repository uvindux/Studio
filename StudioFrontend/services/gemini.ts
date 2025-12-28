
import { Shift, Staff, ScheduleResult } from '../types';

export const generateSchedule = async (
  shifts: Shift[],
  staff: Staff[]
): Promise<ScheduleResult> => {
  if (shifts.length === 0 || staff.length === 0) {
    throw new Error('Please add at least one shift and one staff member.');
  }

  const API = import.meta.env.VITE_API_URL ?? '';

  const res = await fetch(`${API}/api/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shifts, staff }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Schedule generation failed');
  }

  return (await res.json()) as ScheduleResult;
};
