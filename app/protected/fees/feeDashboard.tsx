'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

interface FeeDashboardProps {
  feeTypes: FeeType[] | null;
}

const FeeDashboard = ({ feeTypes }: FeeDashboardProps) => {
  const [stats, setStats] = useState({
    totalFeeTypes: 0,
    activeFeeTypes: 0,
    totalFeeAmount: 0,
    recurringFees: 0,
    oneTimeFees: 0,
    mostExpensiveFee: { name: '', amount: 0 },
    componentCount: 0,
    avgComponentsPerFee: 0,
  });

  useEffect(() => {
    if (!feeTypes || feeTypes.length === 0) return;

    // Calculate statistics
    const activeFeeTypes = feeTypes.filter(fee => fee.is_active).length;
    const recurringFees = feeTypes.filter(fee => fee.is_recurring).length;
    const oneTimeFees = feeTypes.filter(fee => !fee.is_recurring).length;
    
    // Calculate total fee amount (sum of all active fee types)
    const totalFeeAmount = feeTypes.reduce((sum, fee) => {
      return sum + (fee.is_active ? (fee.total_amount || 0) : 0);
    }, 0);
    
    // Find most expensive fee
    let maxAmount = 0;
    let maxFeeName = '';
    feeTypes.forEach(fee => {
      if ((fee.total_amount || 0) > maxAmount) {
        maxAmount = fee.total_amount || 0;
        maxFeeName = fee.name;
      }
    });
    
    // Count total components
    const totalComponents = feeTypes.reduce((sum, fee) => {
      return sum + (fee.components?.length || 0);
    }, 0);
    
    // Average components per fee
    const avgComponents = totalComponents / feeTypes.length;
    
    setStats({
      totalFeeTypes: feeTypes.length,
      activeFeeTypes,
      totalFeeAmount,
      recurringFees,
      oneTimeFees,
      mostExpensiveFee: { name: maxFeeName, amount: maxAmount },
      componentCount: totalComponents,
      avgComponentsPerFee: avgComponents,
    });
  }, [feeTypes]);

  // Determine fee distribution by frequency
  const getFrequencyData = () => {
    if (!feeTypes) return [];
    
    const frequencies: Record<string, number> = {
      'semester': 0,
      'yearly': 0,
      'monthly': 0,
      'quarterly': 0,
      'one-time': 0,
    };
    
    feeTypes.forEach(fee => {
      const freq = fee.is_recurring ? (fee.frequency || 'other') : 'one-time';
      frequencies[freq] = (frequencies[freq] || 0) + 1;
    });
    
    return Object.entries(frequencies)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }));
  };

  const frequencyData = getFrequencyData();
  const maxFrequencyCount = Math.max(...frequencyData.map(item => item.count), 1);

  return (
    <div className="grid gap-4">
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm">
            <Activity className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fee Types</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFeeTypes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeFeeTypes} active, {stats.totalFeeTypes - stats.activeFeeTypes} inactive
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fee Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalFeeAmount.toFixed(2)}
                </div>
                <div className="flex items-center pt-1">
                  <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+12.5% from previous period</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fee Components</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.componentCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg. {stats.avgComponentsPerFee.toFixed(1)} per fee type
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fee by Type</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recurringFees} / {stats.oneTimeFees}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recurring / One-time fees
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Frequency Distribution</CardTitle>
                <CardDescription>
                  Breakdown of fees by payment frequency
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  {frequencyData.map((item) => (
                    <div className="flex items-center" key={item.name}>
                      <div className="w-1/3">
                        <div className="text-sm font-medium capitalize">{item.name.replace('-', ' ')}</div>
                      </div>
                      <div className="w-2/3 flex flex-col gap-1">
                        <Progress value={(item.count / maxFrequencyCount) * 100} className="h-2" />
                        <div className="text-xs text-muted-foreground">{item.count} fees</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground">
                  Updated just now
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fee Insights</CardTitle>
                <CardDescription>
                  Key information about your fee structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Most expensive fee
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stats.mostExpensiveFee.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-lg font-bold">
                        ${stats.mostExpensiveFee.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Recurring fees revenue
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Estimated annual
                      </p>
                    </div>
                    <div className="flex items-center">
                      <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">
                        +8.2%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        One-time fees revenue
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current period
                      </p>
                    </div>
                    <div className="flex items-center">
                      <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500 font-medium">
                        -2.4%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Detailed Analytics
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Fee Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of your fee structure and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Advanced analytics view would be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This section can be expanded with charts and detailed reports
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeeDashboard;