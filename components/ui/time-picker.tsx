'use client';

import * as React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  use12HourFormat?: boolean;
  minuteIncrement?: 1 | 5 | 10 | 15 | 30;
  className?: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  use12HourFormat = false,
  minuteIncrement = 5,
  className = "",
  label,
  ariaLabel = "Time picker",
  disabled = false,
  placeholder = "Select time",
}: TimePickerProps) {
  // Parse the initial value with validation
  const parseTime = React.useCallback((timeString: string) => {
    const timeParts = timeString?.split(':') || [];
    let hours = '09';
    let minutes = '00';
    let period = 'AM';

    if (timeParts.length === 2) {
      // Validate hours
      const parsedHours = parseInt(timeParts[0], 10);
      if (!isNaN(parsedHours) && parsedHours >= 0 && parsedHours < 24) {
        hours = parsedHours.toString().padStart(2, '0');
        // Set period for 12-hour format
        if (use12HourFormat) {
          period = parsedHours >= 12 ? 'PM' : 'AM';
        }
      }

      // Validate minutes
      const parsedMinutes = parseInt(timeParts[1], 10);
      if (!isNaN(parsedMinutes) && parsedMinutes >= 0 && parsedMinutes < 60) {
        // Round to nearest interval if needed
        const roundedMinutes = Math.round(parsedMinutes / minuteIncrement) * minuteIncrement;
        minutes = (roundedMinutes % 60).toString().padStart(2, '0');
      }
    }

    return { hours, minutes, period };
  }, [use12HourFormat, minuteIncrement]);

  // Track open state of the popover
  const [open, setOpen] = React.useState(false);

  // State initialization with single state object
  const [timeState, setTimeState] = React.useState(() => parseTime(value));
  
  // Track which part of the clock is being set (hour or minute)
  const [selectionStep, setSelectionStep] = React.useState<'hour' | 'minute'>('hour');
  
  // Update state when value prop changes
  React.useEffect(() => {
    setTimeState(parseTime(value));
  }, [value, parseTime]);

  // Generate hours and minutes options
  const hoursOptions = React.useMemo(() => {
    if (use12HourFormat) {
      return Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        return hour.toString().padStart(2, '0');
      });
    }
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  }, [use12HourFormat]);

  const minutesOptions = React.useMemo(() => {
    const steps = Math.floor(60 / minuteIncrement);
    return Array.from({ length: steps }, (_, i) => (i * minuteIncrement).toString().padStart(2, '0'));
  }, [minuteIncrement]);

  // Convert 12-hour format to 24-hour for the onChange callback
  const formatTimeForOutput = (hours: string, minutes: string, period: string) => {
    let outputHours = hours;
    
    if (use12HourFormat) {
      const parsedHours = parseInt(hours, 10);
      if (period === 'PM' && parsedHours < 12) {
        outputHours = (parsedHours + 12).toString().padStart(2, '0');
      } else if (period === 'AM' && parsedHours === 12) {
        outputHours = '00';
      }
    }
    
    return `${outputHours}:${minutes}`;
  };

  // Handle hours change and advance to minute selection
  const handleHoursChange = (newHours: string) => {
    setTimeState(prev => {
      const updated = { ...prev, hours: newHours };
      onChange(formatTimeForOutput(newHours, prev.minutes, prev.period));
      return updated;
    });
    // Automatically move to minutes selection after setting hour
    setSelectionStep('minute');
  };

  // Handle minutes change
  const handleMinutesChange = (newMinutes: string) => {
    setTimeState(prev => {
      const updated = { ...prev, minutes: newMinutes };
      onChange(formatTimeForOutput(prev.hours, newMinutes, prev.period));
      return updated;
    });
    // Reset to hour selection for next time
    setSelectionStep('hour');
    // Close the popover after full time selection
    setOpen(false);
  };

  // Handle period change (AM/PM)
  const handlePeriodChange = (newPeriod: string) => {
    setTimeState(prev => {
      const updated = { ...prev, period: newPeriod };
      onChange(formatTimeForOutput(prev.hours, prev.minutes, newPeriod));
      return updated;
    });
  };

  // Displayed hours for 12-hour format
  const displayHours = React.useMemo(() => {
    if (use12HourFormat) {
      const hourNum = parseInt(timeState.hours, 10);
      if (hourNum === 0 || hourNum === 12) return '12';
      return (hourNum % 12).toString().padStart(2, '0');
    }
    return timeState.hours;
  }, [timeState.hours, use12HourFormat]);

  // Format the complete time for display
  const formattedTime = React.useMemo(() => {
    if (!value) return '';
    const time = `${displayHours}:${timeState.minutes}`;
    return use12HourFormat ? `${time} ${timeState.period}` : time;
  }, [displayHours, timeState.minutes, timeState.period, use12HourFormat, value]);

  return (
    <div className={`${className}`} role="group" aria-label={ariaLabel}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            {formattedTime || placeholder}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Time display */}
            <div className="text-2xl font-medium mb-2">
              {formattedTime || "--:--"}
            </div>
            
            {/* Clock selection UI */}
            <div className="flex flex-col items-center w-full">
              {selectionStep === 'hour' ? (
                <div className="mb-4 w-full">
                  <div className="text-sm font-medium mb-2 text-center">Select Hour</div>
                  <div className="grid grid-cols-4 gap-2">
                    {hoursOptions.map((hour) => (
                      <button
                        key={hour}
                        onClick={() => handleHoursChange(hour)}
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          displayHours === hour ? 
                          'bg-blue-500 text-white' : 
                          'bg-gray-100 hover:bg-gray-200'
                        }`}
                        disabled={disabled}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 w-full">
                  <div className="text-sm font-medium mb-2 text-center">Select Minute</div>
                  <div className="grid grid-cols-4 gap-2">
                    {minutesOptions.map((minute) => (
                      <button
                        key={minute}
                        onClick={() => handleMinutesChange(minute)}
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          timeState.minutes === minute ? 
                          'bg-blue-500 text-white' : 
                          'bg-gray-100 hover:bg-gray-200'
                        }`}
                        disabled={disabled}
                      >
                        {minute}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Period selector for 12-hour format */}
              {use12HourFormat && (
                <div className="flex space-x-2 mt-2 w-full justify-center">
                  <button
                    onClick={() => handlePeriodChange('AM')}
                    className={`px-4 py-2 rounded ${
                      timeState.period === 'AM' ? 
                      'bg-blue-500 text-white' : 
                      'bg-gray-100 hover:bg-gray-200'
                    }`}
                    disabled={disabled}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => handlePeriodChange('PM')}
                    className={`px-4 py-2 rounded ${
                      timeState.period === 'PM' ? 
                      'bg-blue-500 text-white' : 
                      'bg-gray-100 hover:bg-gray-200'
                    }`}
                    disabled={disabled}
                  >
                    PM
                  </button>
                </div>
              )}
              
              {/* Step buttons */}
              <div className="flex justify-between w-full mt-4">
                <button
                  onClick={() => setSelectionStep('hour')}
                  className={`px-4 py-2 rounded ${
                    selectionStep === 'hour' ? 
                    'bg-blue-500 text-white' : 
                    'bg-gray-300 hover:bg-gray-400'
                  }`}
                  disabled={disabled}
                >
                  Hour
                </button>
                <button
                  onClick={() => setSelectionStep('minute')}
                  className={`px-4 py-2 rounded ${
                    selectionStep === 'minute' ? 
                    'bg-blue-500 text-white' : 
                    'bg-gray-300 hover:bg-gray-400'
                  }`}
                  disabled={disabled}
                >
                  Minute
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}