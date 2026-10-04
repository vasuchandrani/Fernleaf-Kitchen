'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/CustomSelect';

interface SettingsFormProps {
  initialSettings: Record<string, any>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [cutoffDays, setCutoffDays] = useState(initialSettings.cutoff_days_before ?? 2);
  const [cutoffTime, setCutoffTime] = useState(initialSettings.cutoff_time ?? '16:00');
  const [timezone, setTimezone] = useState(initialSettings.kitchen_timezone ?? 'Asia/Kolkata');
  
  const [workingDays, setWorkingDays] = useState<number[]>(initialSettings.kitchen_working_days ?? [1, 2, 3, 4, 5]);

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' }
  ];

  const toggleDay = (dayValue: number) => {
    if (workingDays.includes(dayValue)) {
      setWorkingDays(workingDays.filter(d => d !== dayValue));
    } else {
      setWorkingDays([...workingDays, dayValue].sort((a, b) => a - b));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    const payload = {
      cutoff_days_before: cutoffDays,
      cutoff_time: cutoffTime,
      kitchen_timezone: timezone,
      kitchen_working_days: workingDays
    };

    try {
      const res = await fetch('/api/proxy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save settings');
      
      setMessage('Settings saved successfully!');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-500">Cut-off Days Before Delivery</label>
        <input 
          type="number" 
          value={cutoffDays} 
          onChange={(e) => setCutoffDays(parseInt(e.target.value) || 0)} 
          className="input-field" 
          min="0"
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-500">Cut-off Time</label>
        <input 
          type="time" 
          value={cutoffTime} 
          onChange={(e) => setCutoffTime(e.target.value)} 
          className="input-field" 
        />
      </div>
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-500">Kitchen Timezone</label>
        <input 
          type="text" 
          value={timezone} 
          onChange={(e) => setTimezone(e.target.value)} 
          className="input-field" 
        />
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-500">Kitchen Working Days</label>
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map(day => {
            const isActive = workingDays.includes(day.value);
            return (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'} border`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {message && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm">{message}</div>}
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <button className="btn-primary mt-2 flex justify-center" onClick={handleSave} disabled={loading}>
        {loading ? <div className="spinner" style={{ width: '18px', height: '18px' }} /> : 'Save Settings'}
      </button>
    </div>
  );
}
