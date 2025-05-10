'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { DataTable } from './data-table';
import { columns } from './column';
import CreateFeeTypeForm from './create-fee-type';
const FeeTypeFilters = dynamic(() => import('./feeFiltertype'), { ssr: false });
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Download, Upload, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type FeeComponent = {
  id: string;
  fee_type_id: string;
  name: string;
  description: string | null;
  amount: number;
  is_optional: boolean;
  is_active: boolean;
}

type FeeType = {
  id: string;
  name: string;
  description: string | null;
  is_recurring: boolean;
  frequency: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  components?: FeeComponent[];
  total_amount?: number;
}

const FeeTypeManagementPage = () => {
  const [feeTypes, setFeeTypes] = useState<FeeType[] | null>(null);
  const [filteredFeeTypes, setFilteredFeeTypes] = useState<FeeType[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [maxPrice, setMaxPrice] = useState(5000);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    const fetchFeeTypes = async () => {
      try {
        const { data: feeTypesData, error: feeTypesError } = await supabase
          .from('fee_type')
          .select('*')
          .order('created_at', { ascending: false });

        if (feeTypesError) {
          console.error('Error fetching fee types:', feeTypesError);
          setFeeTypes(null);
          return;
        }

        const feeTypesWithComponents = await Promise.all(
          feeTypesData.map(async (feeType) => {
            const { data: components, error: componentsError } = await supabase
              .from('fee_component')
              .select('*')
              .eq('fee_type_id', feeType.id);

            if (componentsError) {
              console.error(`Error fetching components for fee type ${feeType.id}:`, componentsError);
              return {
                ...feeType,
                components: [],
                total_amount: 0
              };
            }

            const totalAmount = components.reduce((sum, component) => 
              sum + (component.is_active ? component.amount : 0), 0);

            return {
              ...feeType,
              components,
              total_amount: totalAmount
            };
          })
        );

        setFeeTypes(feeTypesWithComponents);
        setFilteredFeeTypes(feeTypesWithComponents);
        
        const maxFound = Math.max(
          ...feeTypesWithComponents.map(fee => fee.total_amount || 0),
          1000
        );
        setMaxPrice(Math.ceil(maxFound / 1000) * 1000);
      } catch (error) {
        console.error('Unexpected error:', error);
        setFeeTypes(null);
        setFilteredFeeTypes(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeTypes();

    const feeTypesChannel = supabase
      .channel('fee-types-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_type'
        },
        () => {
          fetchFeeTypes();
        }
      )
      .subscribe();

    const feeComponentsChannel = supabase
      .channel('fee-components-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_component'
        },
        () => {
          fetchFeeTypes();
        }
      )
      .subscribe();

    return () => {
      feeTypesChannel.unsubscribe();
      feeComponentsChannel.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!feeTypes) return;
    
    let filtered = [...feeTypes];
    
    if (activeTab === 'recurring') {
      filtered = filtered.filter(fee => fee.is_recurring);
    } else if (activeTab === 'one-time') {
      filtered = filtered.filter(fee => !fee.is_recurring);
    } else if (activeTab === 'active') {
      filtered = filtered.filter(fee => fee.is_active);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(fee => !fee.is_active);
    }
    
    setFilteredFeeTypes(filtered);
  }, [feeTypes, activeTab]);

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const handleFilterChange = (filters: {
    search: string;
    feeType: string;
    frequency: string;
    status: string;
    priceRange: [number, number];
  }) => {
    if (!feeTypes) return;
    
    let filtered = [...feeTypes];
    
    if (activeTab === 'recurring') {
      filtered = filtered.filter(fee => fee.is_recurring);
    } else if (activeTab === 'one-time') {
      filtered = filtered.filter(fee => !fee.is_recurring);
    } else if (activeTab === 'active') {
      filtered = filtered.filter(fee => fee.is_active);
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(fee => !fee.is_active);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(fee => 
        fee.name.toLowerCase().includes(searchLower) || 
        (fee.description && fee.description.toLowerCase().includes(searchLower)) ||
        fee.components?.some(comp => 
          comp.name.toLowerCase().includes(searchLower) || 
          (comp.description && comp.description.toLowerCase().includes(searchLower))
        )
      );
    }
    
    if (filters.feeType !== 'all') {
      if (filters.feeType === 'recurring') {
        filtered = filtered.filter(fee => fee.is_recurring);
      } else if (filters.feeType === 'one-time') {
        filtered = filtered.filter(fee => !fee.is_recurring);
      }
    }
    
    if (filters.frequency !== 'all') {
      filtered = filtered.filter(fee => fee.frequency === filters.frequency);
    }
    
    if (filters.status !== 'all') {
      if (filters.status === 'active') {
        filtered = filtered.filter(fee => fee.is_active);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(fee => !fee.is_active);
      }
    }
    
    filtered = filtered.filter(fee => {
      const amount = fee.total_amount || 0;
      return amount >= filters.priceRange[0] && amount <= filters.priceRange[1];
    });
    
    setFilteredFeeTypes(filtered);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-lg">Loading fee types...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage all university fee types and their components
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggleForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {showForm ? 'Hide Form' : 'New Fee Type'}
            </Button>
          </div>
        </div>
        
        {showForm && (
          <Card id="addFeeTypeForm" className="mb-8 border-2 border-primary/20">
            <CardContent className="pt-6">
              <CreateFeeTypeForm onComplete={() => setShowForm(false)} />
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="space-y-4">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsContent value="all" className="mt-4">
            <FeeTypeFilters 
              onFilterChange={handleFilterChange}
              maxPrice={maxPrice}
            />
          </TabsContent>
          
          <TabsContent value="recurring" className="mt-4">
            <FeeTypeFilters 
              onFilterChange={handleFilterChange}
              maxPrice={maxPrice}
            />
          </TabsContent>
          
          <TabsContent value="one-time" className="mt-4">
            <FeeTypeFilters 
              onFilterChange={handleFilterChange}
              maxPrice={maxPrice}
            />
          </TabsContent>
          
          <TabsContent value="active" className="mt-4">
            <FeeTypeFilters 
              onFilterChange={handleFilterChange}
              maxPrice={maxPrice}
            />
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-4">
            <FeeTypeFilters 
              onFilterChange={handleFilterChange}
              maxPrice={maxPrice}
            />
          </TabsContent>
        </Tabs>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {!filteredFeeTypes || filteredFeeTypes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="text-center max-w-md space-y-4">
                  {feeTypes && feeTypes.length > 0 ? (
                    <>
                      <h3 className="text-lg font-semibold">No matching fee types</h3>
                      <p className="text-muted-foreground">
                        No fee types match your current filters. Try adjusting your search criteria.
                      </p>
                      <Button variant="outline" onClick={() => {
                        setActiveTab('all');
                        handleFilterChange({
                          search: '',
                          feeType: 'all',
                          frequency: 'all',
                          status: 'all',
                          priceRange: [0, maxPrice],
                        });
                      }}>
                        Reset Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold">No fee types found</h3>
                      <p className="text-muted-foreground">
                        You haven't created any fee types yet. Click the button below to create your first fee type.
                      </p>
                      <Button onClick={() => setShowForm(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Fee Type
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredFeeTypes} />
            )}
          </CardContent>
        </Card>
        
        <div className="bg-muted/40 rounded-lg p-4 mt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fee Management Tips</AlertTitle>
            <AlertDescription>
              Remember to keep fee types well-organized with clear breakdowns. 
              When creating a new fee type, consider whether it should be recurring or one-time.
              You can add multiple components to each fee type to provide transparent fee breakdowns
              for students and administrators.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default FeeTypeManagementPage;