'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Batch, FeeType, AcademicPeriod, FeeFilters } from './types';

type FeeCollectionFiltersProps = {
  batches: Batch[] | null;
  feeTypes: FeeType[] | null;
  academicPeriods: AcademicPeriod[] | null;
  onFilterChange: (filters: FeeFilters) => void;
}

const FeeCollectionFilters = ({
  batches,
  feeTypes,
  academicPeriods,
  onFilterChange
}: FeeCollectionFiltersProps) => {
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('all');
  const [feeTypeId, setFeeTypeId] = useState('all');
  const [academicPeriodId, setAcademicPeriodId] = useState('all');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Create adapter functions for Calendar's onSelect handlers
  const handleFromDateSelect = (date: Date | undefined) => {
    if (isMounted.current) {
      setFromDate(date || null);
    }
  };
  
  const handleToDateSelect = (date: Date | undefined) => {
    if (isMounted.current) {
      setToDate(date || null);
    }
  };
  
  // Use debounce for filter changes to avoid too many updates
  useEffect(() => {
    if (!isMounted.current) return;
    
    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        onFilterChange({
          search,
          batchId,
          feeTypeId,
          academicPeriodId,
          status,
          dueDateRange: [fromDate, toDate]
        });
      }
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [search, batchId, feeTypeId, academicPeriodId, status, fromDate, toDate, onFilterChange]);
  
  const resetFilters = () => {
    if (!isMounted.current) return;
    
    setSearch('');
    setBatchId('all');
    setFeeTypeId('all');
    setAcademicPeriodId('all');
    setStatus('all');
    setFromDate(null);
    setToDate(null);
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student, fee..."
              value={search}
              onChange={(e) => isMounted.current && setSearch(e.target.value)}
              className="pl-8"
            />
            {search && (
              <button
                onClick={() => isMounted.current && setSearch('')}
                className="absolute right-2 top-3"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <Select value={batchId} onValueChange={(value) => isMounted.current && setBatchId(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches?.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.batch_id} ({batch.program_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={feeTypeId} onValueChange={(value) => isMounted.current && setFeeTypeId(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Fee Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fee Types</SelectItem>
              {feeTypes?.map((feeType) => (
                <SelectItem key={feeType.id} value={feeType.id}>
                  {feeType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={academicPeriodId} onValueChange={(value) => isMounted.current && setAcademicPeriodId(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Academic Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Academic Periods</SelectItem>
              {academicPeriods?.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={status} onValueChange={(value) => isMounted.current && setStatus(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="WAIVED">Waived</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "MMM dd, yyyy") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate || undefined}
                    onSelect={handleFromDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "MMM dd, yyyy") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate || undefined}
                    onSelect={handleToDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeeCollectionFilters;