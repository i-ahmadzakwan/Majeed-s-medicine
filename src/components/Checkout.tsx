import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingBag, CreditCard, Banknote, Smartphone, Check, AlertCircle } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutProps {
  cartItems: CartItem[];
  totalAmount: number;
  onCheckoutComplete: () => void;
}

const Checkout = ({ cartItems, totalAmount, onCheckoutComplete }: CheckoutProps) => {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'cash',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.customerPhone.trim()) {
      setError('Please enter your phone number');
      setLoading(false);
      return;
    }

    if (!formData.customerAddress.trim()) {
      setError('Please enter your delivery address');
      setLoading(false);
      return;
    }

    try {
    const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user?.username || 'Guest',
          customerId: user?.username || 'guest',
          items: cartItems.map(item => ({
            medicineId: item._id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          })),
          totalAmount,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onCheckoutComplete();
        }, 2000);
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Order Placed Successfully!</h3>
            <p className="text-muted-foreground mb-4">Thank you for your order. We'll process it shortly.</p>
            <p className="text-sm text-muted-foreground">Redirecting to cart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Checkout
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground font-medium">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="bg-background border-border focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-foreground font-medium">
              Delivery Address *
            </Label>
            <Textarea
              id="address"
              placeholder="Enter your complete delivery address"
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              className="bg-background border-border focus:border-primary focus:ring-primary min-h-20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Payment Method</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="w-4 h-4" />
                  Cash on Delivery
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="w-4 h-4" />
                  Card Payment
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="w-4 h-4" />
                  Online Banking
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-background border-border focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-foreground">Total Amount:</span>
              <span className="text-2xl font-bold text-primary">Rs. {totalAmount.toLocaleString()}</span>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-12 text-base font-semibold"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                'Place Order'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default Checkout;