
import React, { useState, useCallback, useEffect } from 'react';
import { ShiftInput } from './components/ShiftInput';
import { StaffInput } from './components/StaffInput';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { Stats } from './components/Stats';
import { DailyScheduleList } from './components/DailyScheduleList';
import { generateSchedule } from './services/gemini';
import { Shift, Staff, StaffRole } from './types';
import { Sparkles, AlertTriangle, Loader2, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  // Staff is loaded from backend (MongoDB). Use empty initial value and fetch on mount.
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL ?? '';
    (async () => {
      try {
        const res = await fetch(`${API}/api/staff`);
        if (!res.ok) return;
        const data = await res.json();
        setStaff(data);
      } catch (err) {
        console.error('Failed to load staff from API', err);
      }
    })();
  }, []);

  // Initialize with shifts for December 2025 with strict 3 slots
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const year = 2025;
    const month = 11; // Month is 0-indexed, 11 = December
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const defaultShifts: Shift[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // 1. Morning Shift: 6:30 am to 8:30 am
      defaultShifts.push({
        id: `dec25-${d}-mor`,
        date: dateStr,
        startTime: '06:30',
        endTime: '08:30',
        role: StaffRole.HOST
      });

      // 2. Day Shift: 8:30 am to 1:30 pm (13:30)
      defaultShifts.push({
        id: `dec25-${d}-day`,
        date: dateStr,
        startTime: '08:30',
        endTime: '13:30',
        role: StaffRole.HOST
      });

      // 3. Evening Shift: 2:45 pm (14:45) to 6:30 pm (18:30)
      defaultShifts.push({
        id: `dec25-${d}-eve`,
        date: dateStr,
        startTime: '14:45',
        endTime: '18:30',
        role: StaffRole.HOST
      });
    }
    return defaultShifts;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shifts' | 'staff'>('shifts');

  const handleGenerateSchedule = useCallback(async () => {
    if (shifts.length === 0) {
      setError("Add some shifts first!");
      return;
    }
    if (staff.length === 0) {
      setError("Add some staff members first!");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotes(null);

    try {
      // Clear current assignments first
      const cleanShifts = shifts.map(s => ({ ...s, assignedStaffId: undefined }));
      setShifts(cleanShifts);

      const result = await generateSchedule(cleanShifts, staff);

      if (!result || !Array.isArray(result.assignments)) {
        throw new Error('Invalid schedule response from server');
      }

      // Apply assignments (guarded)
      const updatedShifts = cleanShifts.map(shift => {
        const assignment = result.assignments.find(a => a && a.shiftId === shift.id);
        return assignment && assignment.staffId ? { ...shift, assignedStaffId: assignment.staffId } : shift;
      });

      setShifts(updatedShifts);
      setNotes(result.notes ?? null);

      if (Array.isArray(result.unfilledShiftIds) && result.unfilledShiftIds.length > 0) {
        setError(`Warning: ${result.unfilledShiftIds.length} shifts could not be filled based on constraints.`);
      }

    } catch (err: any) {
      setError(err.message || "Failed to generate schedule.");
    } finally {
      setIsGenerating(false);
    }
  }, [shifts, staff]);

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white shadow-sm">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Studio Host AI</h1>
            <p className="text-xs text-gray-500">Dec 2025 Planning</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {notes && (
            <div className="text-xs max-w-md text-right text-gray-600 bg-amber-50 p-2 rounded-md border border-amber-100 hidden md:block shadow-sm">
              <span className="font-bold text-amber-700">AI Note:</span> {notes}
            </div>
          )}
          <button
            onClick={handleGenerateSchedule}
            disabled={isGenerating}
            className={`
                flex items-center px-5 py-2 rounded-full font-bold text-sm text-white shadow-md transition-all transform hover:scale-105
                ${isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-indigo-700 hover:shadow-indigo-200'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Generate Roster
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Panel: Controls - Fixed Width */}
        <div className="w-full md:w-1/3 lg:w-[320px] flex flex-col border-r border-gray-200 bg-white z-10 shadow-sm flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('shifts')}
              className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'shifts' ? 'text-primary border-primary bg-white' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
            >
              1. Range
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'staff' ? 'text-secondary border-secondary bg-white' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
            >
              2. Staff
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {activeTab === 'shifts' ? (
              <ShiftInput shifts={shifts} setShifts={setShifts} />
            ) : (
              <StaffInput staff={staff} setStaff={setStaff} />
            )}
          </div>

          {/* Error/Status Message area in sidebar */}
          {error && (
            <div className="p-4 border-t border-red-100 bg-red-50 text-red-700 text-xs flex items-start animate-pulse">
              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Right Panel: Visualizations - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="p-6 space-y-8 max-w-6xl mx-auto">
            {/* 1. Calendar View */}
            <div className="min-h-[500px]">
              <ScheduleCalendar shifts={shifts} staff={staff} />
            </div>

            {/* 2. Statistics */}
            <div className="h-80">
              <Stats shifts={shifts} staff={staff} />
            </div>

            {/* 3. Detailed Daily List */}
            <div>
              <DailyScheduleList shifts={shifts} staff={staff} />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
