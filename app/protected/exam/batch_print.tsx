'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Printer, 
  Download,
  Check,
  X
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Define the Batch type (same as in your main component)
type Batch = {
  id: string;
  batch_id: string;
  intake_session: string;
  number_of_students: number;
  program_code: string;
  created_at: string;
  updated_at: string;
};

type PrintComponentProps = {
  data: Batch[];
  filteredData: Batch[];
};

const PrintComponent = ({ data, filteredData }: PrintComponentProps) => {
  const [open, setOpen] = useState(false);
  const [printOption, setPrintOption] = useState<'all' | 'filtered'>('filtered');
  const [printFormat, setPrintFormat] = useState<'detailed' | 'summary'>('detailed');
  const [showLogo, setShowLogo] = useState(true);
  const [showHeaders, setShowHeaders] = useState(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Get the HTML content to print
    const contentToPrint = printRef.current?.innerHTML;
    if (!contentToPrint) return;
    
    // Current date for the report header
    const currentDate = format(new Date(), 'PPP');
    
    // Create full HTML document with proper styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Batch Report</title>
          <style>
            @media print {
              @page {
                size: ${orientation};
                margin: 1cm;
              }
              
              body {
                font-family: system-ui, -apple-system, sans-serif;
                color: #333;
                line-height: 1.5;
              }
              
              .print-container {
                width: 100%;
              }
              
              .print-header {
                display: ${showHeaders ? 'flex' : 'none'};
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
              }
              
              .logo {
                font-weight: bold;
                font-size: 24px;
                display: ${showLogo ? 'block' : 'none'};
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              
              .summary-card {
                border: 1px solid #ddd;
                padding: 15px;
                margin-bottom: 15px;
                break-inside: avoid;
              }
              
              .card-header {
                font-weight: bold;
                margin-bottom: 10px;
                font-size: 16px;
              }
              
              .badge {
                background-color: #f2f2f2;
                padding: 2px 6px;
                border-radius: 12px;
                font-size: 12px;
                margin-left: 8px;
              }
              
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <div class="logo">Your Organization Name</div>
              <div>
                <div>Batch Management Report</div>
                <div>${currentDate}</div>
              </div>
            </div>
            ${contentToPrint}
            <div class="footer">
              Generated on ${currentDate} • Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
          </div>
          <script>
            // Auto print and close after loading
            window.onload = function() {
              // Add page numbers
              let style = document.createElement('style');
              style.innerHTML = '@page { @bottom-right { content: counter(page) " of " counter(pages); } }';
              document.head.appendChild(style);
              
              // Print after a short delay to ensure styles are applied
              setTimeout(() => {
                window.print();
                // Close the window after printing (or after 2 seconds if print is canceled)
                setTimeout(() => window.close(), 2000);
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    // Write to the new window and start print process
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Close dialog after print initiated
    setOpen(false);
  };
  
  // Determine which data to display
  const dataToDisplay = printOption === 'all' ? data : filteredData;
  
  // Function to export as CSV
  const exportCSV = () => {
    const exportData = dataToDisplay;
    const headers = ['Batch ID', 'Intake Session', 'Program Code', 'Number of Students', 'Created At'];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    exportData.forEach(batch => {
      const row = [
        `"${batch.batch_id}"`,
        `"${batch.intake_session}"`,
        `"${batch.program_code}"`,
        batch.number_of_students,
        `"${format(new Date(batch.created_at), 'yyyy-MM-dd')}"`,
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `batch_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)} 
        className="min-w-10 px-3"
      >
        <Printer className="h-4 w-4" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Print Batch Report</DialogTitle>
            <DialogDescription>
              Customize your batch report before printing or exporting.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preview" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="border rounded-md p-4 max-h-[400px] overflow-auto">
              <div ref={printRef}>
                {printFormat === 'detailed' ? (
                  <Table>
                    <TableCaption>
                      Showing {dataToDisplay.length} {printOption === 'filtered' ? 'filtered' : 'total'} batches
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch ID</TableHead>
                        <TableHead>Intake Session</TableHead>
                        <TableHead>Program Code</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataToDisplay.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batch_id}</TableCell>
                          <TableCell>{batch.intake_session}</TableCell>
                          <TableCell>{batch.program_code}</TableCell>
                          <TableCell>{batch.number_of_students}</TableCell>
                          <TableCell>{format(new Date(batch.created_at), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="space-y-4">
                    <div className="summary-stats grid grid-cols-2 gap-4">
                      <div className="summary-card">
                        <div className="card-header">Total Batches</div>
                        <div className="text-xl">{dataToDisplay.length}</div>
                      </div>
                      <div className="summary-card">
                        <div className="card-header">Total Students</div>
                        <div className="text-xl">
                          {dataToDisplay.reduce((sum, batch) => sum + batch.number_of_students, 0)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card-header">Programs</div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(dataToDisplay.map(batch => batch.program_code))).map(code => (
                          <span key={code} className="badge">
                            {code} 
                            <span className="ml-1">
                              ({dataToDisplay.filter(batch => batch.program_code === code).length})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="summary-card">
                      <div className="card-header">Intake Sessions</div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(dataToDisplay.map(batch => batch.intake_session))).map(session => (
                          <span key={session} className="badge">
                            {session}
                            <span className="ml-1">
                              ({dataToDisplay.filter(batch => batch.intake_session === session).length})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="options">
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Data to Print</Label>
                  <Select 
                    value={printOption} 
                    onValueChange={(value) => setPrintOption(value as 'all' | 'filtered')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filtered">Filtered Batches ({filteredData.length})</SelectItem>
                      <SelectItem value="all">All Batches ({data.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Report Format</Label>
                  <Select 
                    value={printFormat} 
                    onValueChange={(value) => setPrintFormat(value as 'detailed' | 'summary')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detailed (Table View)</SelectItem>
                      <SelectItem value="summary">Summary (Statistics View)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Page Orientation</Label>
                  <Select 
                    value={orientation} 
                    onValueChange={(value) => setOrientation(value as 'portrait' | 'landscape')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Landscape</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="show-logo" 
                    checked={showLogo} 
                    onCheckedChange={(checked) => setShowLogo(checked as boolean)} 
                  />
                  <Label htmlFor="show-logo">Include Logo/Header</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-headers" 
                    checked={showHeaders} 
                    onCheckedChange={(checked) => setShowHeaders(checked as boolean)} 
                  />
                  <Label htmlFor="show-headers">Include Page Headers</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => exportCSV()}>
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrintComponent;