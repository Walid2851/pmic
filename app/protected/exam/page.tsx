'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DataTable } from '@/app/protected/data-table';
import { columns } from '@/app/protected/column';
import CreateBatchForm from './create_batch';
import ScrollButton from '@/components/ScrollButton';
import PrintComponent from './batch_print'; // Import the PrintComponent
import { useRouter } from 'next/navigation';
import { 
  FileDown, 
  Search, 
  Filter, 
  RefreshCw, 
  Printer,
  ChevronDown,
  Users,
  Briefcase,
  Calendar,
  Clock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Batch = {
  id: string;
  batch_id: string;
  intake_session: string;
  number_of_students: number;
  program_code: string;
  created_at: string;
  updated_at: string;
};

const BatchManagementPage = () => {
  const [batchList, setBatchList] = useState<Batch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/sign-in');
          return;
        }
        const { data, error } = await supabase
          .from('batch')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching batches:', error);
          setBatchList(null);
        } else {
          setBatchList(data);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setBatchList(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
    const supabase = createClient();
    const channel = supabase
      .channel('batch-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Batch'
        },
        () => {
          fetchBatches();
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [router]);

  // Derived values for summary stats
  const totalBatches = batchList ? batchList.length : 0;
  const totalStudents = batchList ? batchList.reduce((sum, batch) => sum + batch.number_of_students, 0) : 0;
  
  // FIX 1: Convert Set to Array before using spread operator
  const uniqueProgramsCount = useMemo(() => {
    if (!batchList) return 0;
    const programCodesSet = new Set(batchList.map(batch => batch.program_code));
    return Array.from(programCodesSet).length;
  }, [batchList]);
  
  const recentBatches = batchList ? batchList.filter(batch => {
    const batchDate = new Date(batch.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return batchDate >= thirtyDaysAgo;
  }).length : 0;

  // FIX 2: Convert Set to Array before using spread operator for program codes
  const programCodes = useMemo(() => {
    if (!batchList) return [];
    const programCodesSet = new Set(batchList.map(batch => batch.program_code));
    return Array.from(programCodesSet);
  }, [batchList]);

  // Filtered data
  const filteredBatches = useMemo(() => {
    if (!batchList) return null;
    
    return batchList.filter(batch => {
      const matchesSearch = 
        batch.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.program_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.intake_session.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProgram = selectedProgram === 'all' || batch.program_code === selectedProgram;
      
      return matchesSearch && matchesProgram;
    });
  }, [batchList, searchTerm, selectedProgram]);

  const handleRefresh = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('batch')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error refreshing batches:', error);
    } else {
      setBatchList(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading batch data...</p>
        </div>
      </div>
    );
  }

  if (!batchList) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg mb-4">No batches found</p>
          <Button onClick={handleRefresh}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="bg-accent rounded-lg shadow-sm mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-semibold">
              Batch Management
            </h1>
            <Button 
              variant="outline" 
              onClick={() => router.push('/protected/reports')}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              View Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalBatches}</div>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalStudents}</div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{uniqueProgramsCount}</div>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Batches (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{recentBatches}</div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-card rounded-lg shadow-sm mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">Batches</h2>
              <Badge variant="outline">{filteredBatches?.length || 0} total</Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search batches..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select 
                value={selectedProgram} 
                onValueChange={setSelectedProgram}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="All Programs" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} className="min-w-10 px-3">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {/* Replace the Print button with the PrintComponent */}
              <PrintComponent 
                data={batchList || []} 
                filteredData={filteredBatches || []} 
              />
            </div>
          </div>
          <DataTable columns={columns} data={filteredBatches || []} />
        </div>
      </div>

      {/* Form Section */}
      <div id="addBatchForm" className="bg-card rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-6">Add New Batch</h2>
          <CreateBatchForm />
        </div>
      </div>
      
    </div>
  );
};

export default BatchManagementPage;