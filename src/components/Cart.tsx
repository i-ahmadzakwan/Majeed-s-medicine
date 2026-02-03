import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Checkout from './Checkout';

interface CartItem {
  _id: string;
  medicine: {
    _id: string;
    name: string;
    price: number;
    stock: number;
  };
  quantity: number;
  price: number;
}

const Cart = () => {
  const { user, cart, fetchCart, removeFromCart, updateCartQuantity } = useApp();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<string | null>(null);
  const [quantityInputs, setQuantityInputs] = useState<{ [key: string]: string }>({});

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Update cartItems when cart changes
  useEffect(() => {
    if (cart?.items) {
      setCartItems(cart.items);
      // Initialize quantity inputs
      const inputs: { [key: string]: string } = {};
      cart.items.forEach((item: CartItem) => {
        inputs[item._id] = item.quantity.toString();
      });
      setQuantityInputs(inputs);
    }
  }, [cart]);

  const loadCart = async () => {
    try {
      await fetchCart();
      setCartItems(cart?.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    await removeFromCart(cartItemId);
  };

  const handleQuantityChange = async (medicineId: string, newQuantity: number, maxStock: number) => {
    // Validate quantity
    if (newQuantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }
    
    if (newQuantity > maxStock) {
      alert(`Only ${maxStock} items available in stock`);
      return;
    }

    await updateCartQuantity(medicineId, newQuantity);
    setEditingQuantity(null);
  };

  const handleQuantityInputChange = (itemId: string, medicineId: string, value: string, maxStock: number) => {
    // Update the input state
    setQuantityInputs(prev => ({ ...prev, [itemId]: value }));

    // Allow empty input while typing
    if (value === '') {
      return;
    }

    const num = parseInt(value);
    
    if (isNaN(num) || num < 1) {
      return;
    }

    if (num > maxStock) {
      alert(`Only ${maxStock} items available in stock`);
      setQuantityInputs(prev => ({ ...prev, [itemId]: maxStock.toString() }));
      return;
    }
  };

  const handleQuantityBlur = async (itemId: string, medicineId: string, maxStock: number) => {
    const value = quantityInputs[itemId];
    
    // On blur, ensure we have a valid value
    if (value === '' || parseInt(value) < 1) {
      setQuantityInputs(prev => ({ ...prev, [itemId]: '1' }));
      await handleQuantityChange(medicineId, 1, maxStock);
    } else {
      const num = parseInt(value);
      await handleQuantityChange(medicineId, num, maxStock);
    }
    
    setEditingQuantity(null);
  };

  const handleQuantityFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when input is focused for easy replacement
    e.target.select();
  };

  const incrementQuantity = (itemId: string, medicineId: string, currentQuantity: number, maxStock: number) => {
    if (currentQuantity < maxStock) {
      const newQty = currentQuantity + 1;
      setQuantityInputs(prev => ({ ...prev, [itemId]: newQty.toString() }));
      handleQuantityChange(medicineId, newQty, maxStock);
    }
  };

  const decrementQuantity = (itemId: string, medicineId: string, currentQuantity: number, maxStock: number) => {
    if (currentQuantity > 1) {
      const newQty = currentQuantity - 1;
      setQuantityInputs(prev => ({ ...prev, [itemId]: newQty.toString() }));
      handleQuantityChange(medicineId, newQty, maxStock);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckoutComplete = () => {
    setShowCheckout(false);
    loadCart();
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading cart...</p>
        </CardContent>
      </Card>
    );
  }

  if (showCheckout) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowCheckout(false)}
          className="mb-2"
        >
          ← Back to Cart
        </Button>
        <Checkout
          cartItems={cartItems.map(item => ({
            _id: item.medicine._id,
            name: item.medicine.name,
            price: item.price,
            quantity: item.quantity
          }))}
          totalAmount={calculateTotal()}
          onCheckoutComplete={handleCheckoutComplete}
        />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Shopping Cart
          {cartItems.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>Medicine</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">
                        {item.medicine.name}
                        <div className="text-xs text-muted-foreground">
                          Stock: {item.medicine.stock}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => decrementQuantity(item._id, item.medicine._id, item.quantity, item.medicine.stock)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          
                          {editingQuantity === item._id ? (
                            <Input
                              type="number"
                              min="1"
                              max={item.medicine.stock}
                              value={quantityInputs[item._id] || item.quantity}
                              onChange={(e) => handleQuantityInputChange(item._id, item.medicine._id, e.target.value, item.medicine.stock)}
                              onBlur={() => handleQuantityBlur(item._id, item.medicine._id, item.medicine.stock)}
                              onFocus={handleQuantityFocus}
                              autoFocus
                              className="w-16 h-8 text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingQuantity(item._id)}
                              className="w-16 h-8 text-center font-semibold hover:bg-muted rounded px-2 transition-colors"
                            >
                              {item.quantity}
                            </button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => incrementQuantity(item._id, item.medicine._id, item.quantity, item.medicine.stock)}
                            disabled={item.quantity >= item.medicine.stock}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          Click to type quantity directly
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        Rs. {item.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item.medicine._id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-foreground">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  Rs. {calculateTotal().toLocaleString()}
                </span>
              </div>
              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-12 text-base font-semibold"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Cart;