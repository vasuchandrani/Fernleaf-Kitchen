'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
  subLabel?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Select...', disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'} rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer transition-all duration-200 shadow-sm hover:border-slate-300 ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex flex-col">
          <span className={`text-sm ${selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.subLabel && (
            <span className="text-xs text-slate-500 mt-0.5">{selectedOption.subLabel}</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center">No options available</div>
          ) : (
            options.map(option => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-emerald-50 border-b border-slate-50 last:border-0 ${value === option.value ? 'bg-emerald-50/50' : ''}`}
              >
                <div className="flex flex-col">
                  <span className={`text-sm ${value === option.value ? 'text-emerald-700 font-medium' : 'text-slate-700'}`}>
                    {option.label}
                  </span>
                  {option.subLabel && (
                    <span className="text-xs text-slate-500 mt-0.5">{option.subLabel}</span>
                  )}
                </div>
                {value === option.value && <Check size={16} className="text-emerald-600" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
