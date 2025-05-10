'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { StudentFee } from './types';

// Using imported types

type PaymentModalProps = {
  studentFee: StudentFee;
  onClose: () => void;
  onPaymentComplete: () => void;
}

const PaymentModal = ({
  studentFee,
  onClose,
  onPaymentComplete
}: PaymentModalProps) => {
  const [amount, setAmount] = useState<string>(
    studentFee.remaining_amount?.toString() || studentFee.total_amount.toString()
  );
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(
    `REC-${studentFee.student?.rollno || '000'}-${Date.now().toString().slice(-6)}`
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };
  
  const handlePayment = async () => {
    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid payment amount",
      });
      return;
    }
    
    const remainingAmount = studentFee.remaining_amount || studentFee.total_amount;
    if (paymentAmount > remainingAmount) {
      toast.error("Amount exceeds remaining balance", {
        description: `The maximum payment amount is ₹${remainingAmount.toLocaleString()}`,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // Record the payment
      const { data: payment, error: paymentError } = await supabase
        .from('payment')
        .insert({
          student_fee_id: studentFee.id,
          amount: paymentAmount,
          payment_date: new Date().toISOString(),
          payment_method: paymentMethod,
          transaction_reference: transactionReference || null,
          receipt_number: receiptNumber,
          notes: notes || null,
          created_by: 'admin', // This would be the current user
        })
        .select();
        
      if (paymentError) throw paymentError;
      
      // Calculate new totals
      const newPaidAmount = (studentFee.paid_amount || 0) + paymentAmount;
      const newRemainingAmount = studentFee.total_amount - newPaidAmount;
      
      // Determine new status
      let newStatus = studentFee.status;
      if (newPaidAmount >= studentFee.total_amount) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      }
      
      // Update student fee status if needed
      if (newStatus !== studentFee.status) {
        const { error: updateError } = await supabase
          .from('student_fee')
          .update({ status: newStatus })
          .eq('id', studentFee.id);
          
        if (updateError) throw updateError;
      }
      
      toast.success("Payment successful", {
        description: `Payment of ₹${paymentAmount.toLocaleString()} recorded successfully`,
      });
      
      onPaymentComplete();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error("Payment failed", {
        description: "There was an error processing the payment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Collect fee payment from {studentFee.student?.firstname} {studentFee.student?.lastname}
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-muted bg-muted/40 mb-4">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Student:</span>
              <span className="text-sm font-medium">
                {studentFee.student?.firstname} {studentFee.student?.lastname} ({studentFee.student?.rollno})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fee Type:</span>
              <span className="text-sm font-medium">{studentFee.fee_type?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="text-sm font-medium">₹{studentFee.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Already Paid:</span>
              <span className="text-sm font-medium">₹{(studentFee.paid_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Remaining:</span>
              <span className="text-sm font-medium text-red-600">
                ₹{(studentFee.remaining_amount || studentFee.total_amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Due Date:</span>
              <span className="text-sm font-medium">
                {format(new Date(studentFee.due_date), 'MMM dd, yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₹)</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter payment amount"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transaction-reference">
              Transaction Reference
              <span className="text-muted-foreground text-xs ml-1">(Optional)</span>
            </Label>
            <Input
              id="transaction-reference"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="Transaction ID, Cheque Number, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="receipt-number">Receipt Number</Label>
            <Input
              id="receipt-number"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Receipt number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes
              <span className="text-muted-foreground text-xs ml-1">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any payment notes here"
              rows={3}
            />
          </div>
        </div>
        
        <Separator className="my-2" />
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;