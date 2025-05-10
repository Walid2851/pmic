'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Loader2, 
  UserCheck, 
  User 
} from 'lucide-react';
import { Student } from './types';

interface StudentSearchProps {
  onSelectStudent: (student: Student) => void;
}

const StudentSearch = ({ onSelectStudent }: StudentSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [noResults, setNoResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    try {
      setSearching(true);
      setNoResults(false);
      const supabase = createClient();
      
      // Search by ID, roll number, name, or email
      const { data, error } = await supabase
        .from('student')
        .select('*')
        .or(`
          studentid.eq.${isNaN(parseInt(searchTerm)) ? -1 : parseInt(searchTerm)},
          rollno.eq.${isNaN(parseInt(searchTerm)) ? -1 : parseInt(searchTerm)},
          firstname.ilike.%${searchTerm}%,
          lastname.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%
        `)
        .limit(10);
      
      if (error) throw error;
      
      if (data.length === 0) {
        setNoResults(true);
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      toast.error('Failed to search students', {
        description: 'There was an error processing your search. Please try again.'
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label htmlFor="student-search" className="mb-1 block">Search Students</Label>
          <Input
            id="student-search"
            placeholder="Student ID, Roll No, Name, or Email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button 
          type="submit" 
          disabled={searching || !searchTerm.trim()}
          className="mt-auto"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search
        </Button>
      </form>
      
      {searching ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Searching...</span>
        </div>
      ) : noResults ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-center">
          <User className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="font-medium">No students found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No students match your search criteria. Try a different search term.
          </p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">
            {searchResults.length} student{searchResults.length !== 1 ? 's' : ''} found
          </h3>
          {searchResults.map((student) => (
            <Card 
              key={student.studentid} 
              className="cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => onSelectStudent(student)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {student.firstname} {student.lastname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {student.studentid} | Roll No: {student.rollno}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default StudentSearch;