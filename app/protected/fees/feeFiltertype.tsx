'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface FeeTypeFiltersProps {
  onFilterChange: (filters: {
    search: string;
    feeType: string;
    frequency: string;
    status: string;
    priceRange: [number, number];
  }) => void;
  maxPrice: number;
}

const FeeTypeFilters = ({ onFilterChange, maxPrice = 5000 }: FeeTypeFiltersProps) => {
  const [search, setSearch] = useState('');
  const [feeType, setFeeType] = useState('all');
  const [frequency, setFrequency] = useState('all');
  const [status, setStatus] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Helper to update filters
  const updateFilters = (newFilters: Partial<{
    search: string;
    feeType: string;
    frequency: string;
    status: string;
    priceRange: [number, number];
  }>) => {
    const updatedFilters = {
      search: newFilters.search !== undefined ? newFilters.search : search,
      feeType: newFilters.feeType !== undefined ? newFilters.feeType : feeType,
      frequency: newFilters.frequency !== undefined ? newFilters.frequency : frequency,
      status: newFilters.status !== undefined ? newFilters.status : status,
      priceRange: newFilters.priceRange !== undefined ? newFilters.priceRange : priceRange,
    };

    // Update active filters list
    const newActiveFilters: string[] = [];
    if (updatedFilters.feeType !== 'all') newActiveFilters.push(`Type: ${updatedFilters.feeType}`);
    if (updatedFilters.frequency !== 'all') newActiveFilters.push(`Frequency: ${updatedFilters.frequency}`);
    if (updatedFilters.status !== 'all') newActiveFilters.push(`Status: ${updatedFilters.status}`);
    if (updatedFilters.priceRange[0] > 0 || updatedFilters.priceRange[1] < maxPrice) {
      newActiveFilters.push(`Price: $${updatedFilters.priceRange[0]} - $${updatedFilters.priceRange[1]}`);
    }
    
    setActiveFilters(newActiveFilters);
    
    // Apply filters
    setSearch(updatedFilters.search);
    setFeeType(updatedFilters.feeType);
    setFrequency(updatedFilters.frequency);
    setStatus(updatedFilters.status);
    setPriceRange(updatedFilters.priceRange);
    
    onFilterChange(updatedFilters);
  };

  // Reset all filters
  const resetFilters = () => {
    updateFilters({
      search: '',
      feeType: 'all',
      frequency: 'all',
      status: 'all',
      priceRange: [0, maxPrice],
    });
  };

  // Remove a specific filter
  const removeFilter = (filter: string) => {
    if (filter.startsWith('Type:')) {
      updateFilters({ feeType: 'all' });
    }  else if (filter.startsWith('Status:')) {
      updateFilters({ status: 'all' });
    } else if (filter.startsWith('Price:')) {
      updateFilters({ priceRange: [0, maxPrice] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fee types..."
            value={search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-8 w-full"
          />
          {search && (
            <Button
              variant="ghost"
              className="absolute right-0 top-0 h-full aspect-square p-0"
              onClick={() => updateFilters({ search: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Select
            value={feeType}
            onValueChange={(value) => updateFilters({ feeType: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Fee Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="one-time">One-time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={frequency}
            onValueChange={(value) => updateFilters({ frequency: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="semester">Semester</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={status}
            onValueChange={(value) => updateFilters({ status: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Advanced</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Advanced Filters</h4>
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Price Range</Label>
                    <span className="text-sm">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    value={[priceRange[0], priceRange[1]]}
                    min={0}
                    max={maxPrice}
                    step={100}
                    onValueChange={(value) => updateFilters({ priceRange: [value[0], value[1]] as [number, number] })}
                    className="py-4"
                  />
                </div>
                
                <Accordion type="single" collapsible>
                  <AccordionItem value="components">
                    <AccordionTrigger>Component Options</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="opt-components" />
                          <Label htmlFor="opt-components">Has optional components</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="multi-components" />
                          <Label htmlFor="multi-components">Multiple components</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setAdvancedOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => setAdvancedOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>
          
          {activeFilters.map((filter) => (
            <Badge variant="secondary" key={filter} className="flex items-center gap-1">
              {filter}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter(filter)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          <Button variant="ghost" size="sm" className="text-xs" onClick={resetFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeeTypeFilters;