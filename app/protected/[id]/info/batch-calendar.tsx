

// Calendar Component with real data and teacher information
export const BatchCalendar = ({ schedule }: BatchCalendarProps) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-1">
            <div className="h-10"></div>
            {days.map(day => (
              <div key={day} className="h-10 flex items-center justify-center font-semibold bg-gray-50 rounded">
                {day}
              </div>
            ))}
            
            {hours.map(hour => (
              <>
                <div key={`time-${hour}`} className="h-16 flex items-center justify-end pr-2 text-sm text-gray-500">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>
                
                {days.map(day => {
                  const classes = schedule.filter(s => 
                    s.day === day && 
                    parseInt(s.startTime.split(':')[0]) <= hour && 
                    parseInt(s.endTime.split(':')[0]) > hour
                  );
                  
                  return (
                    <div key={`${day}-${hour}`} className="h-16 border border-gray-200 relative">
                      {classes.map((cls, i) => (
                        <div 
                          key={i} 
                          className="absolute inset-0 m-1 bg-blue-100 p-1 rounded text-xs overflow-hidden"
                          style={{ zIndex: i + 1 }}
                        >
                          <div className="font-medium text-blue-800">{cls.courseCode}</div>
                          <div className="text-xs truncate">{cls.startTime} - {cls.endTime}</div>
                          {cls.teacherName && (
                            <div className="text-xs text-blue-600 truncate font-medium mt-1">
                              {cls.teacherName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    );
  };