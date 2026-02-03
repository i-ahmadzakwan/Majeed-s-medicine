import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2, Package, Plus, Minus, Tag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  batchNumber?: string;
  discount?: number;
  discountedPrice?: number;
}

interface MedicineTableProps {
  medicines: Medicine[];
  onMedicineDeleted: () => void;
  onMedicineBought: () => void;
  isAdmin: boolean;
}

const MedicineTable = ({ medicines, onMedicineDeleted, onMedicineBought, isAdmin }: MedicineTableProps) => {
  const { addToCart } = useApp();
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const medicineList = Array.isArray(medicines) ? medicines : [];

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (stock < 10) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const calculateDiscountedPrice = (price: number, discount?: number) => {
    if (discount && discount > 0) {
      return price - (price * discount / 100);
    }
    return price;
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/medicines/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onMedicineDeleted();
      } else {
        alert('Failed to delete medicine');
      }
    } catch (error) {
      alert('Failed to connect to server');
    }
  };

  const openQuantityDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setQuantity(1);
    setQuantityInput('1');
    setIsDialogOpen(true);
  };

  const handleQuantityChange = (value: string) => {
    setQuantityInput(value);
    
    if (value === '') {
      return;
    }

    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
    } else if (selectedMedicine && num > selectedMedicine.stock) {
      setQuantity(selectedMedicine.stock);
      setQuantityInput(selectedMedicine.stock.toString());
    } else {
      setQuantity(num);
    }
  };

  const handleQuantityBlur = () => {
    if (quantityInput === '' || parseInt(quantityInput) < 1) {
      setQuantity(1);
      setQuantityInput('1');
    }
  };

  const handleQuantityFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const incrementQuantity = () => {
    if (selectedMedicine && quantity < selectedMedicine.stock) {
      const newQty = quantity + 1;
      setQuantity(newQty);
      setQuantityInput(newQty.toString());
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      const newQty = quantity - 1;
      setQuantity(newQty);
      setQuantityInput(newQty.toString());
    }
  };

  const handleAddToCart = async () => {
    if (!selectedMedicine) return;

    try {
      for (let i = 0; i < quantity; i++) {
        await addToCart(selectedMedicine._id);
      }
      setIsDialogOpen(false);
      onMedicineBought();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">Medicine Inventory</h2>
            <p className="text-sm text-muted-foreground">{medicineList.length} products available</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableHead className="font-semibold text-foreground">Medicine</TableHead>
              <TableHead className="font-semibold text-foreground">Description</TableHead>
              {isAdmin && <TableHead className="font-semibold text-foreground text-center">Batch No.</TableHead>}
              <TableHead className="font-semibold text-foreground text-right">Price (PKR)</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Stock</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Status</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicineList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="h-32 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  No medicines in inventory
                </TableCell>
              </TableRow>
            ) : (
              medicineList.map((medicine) => {
                const stockStatus = getStockStatus(medicine.stock);
                const discountedPrice = calculateDiscountedPrice(medicine.price, medicine.discount);
                const hasDiscount = medicine.discount && medicine.discount > 0;

                return (
                  <TableRow key={medicine._id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">
                      {medicine.name}
                      {hasDiscount && (
                        <Badge variant="secondary" className="ml-2 bg-success/10 text-success border-success/20">
                          <Tag className="w-3 h-3 mr-1" />
                          {medicine.discount}% OFF
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {medicine.description}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {medicine.batchNumber || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {hasDiscount ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm text-muted-foreground line-through">
                            Rs. {medicine.price.toLocaleString()}
                          </span>
                          <span className="font-semibold text-success">
                            Rs. {discountedPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-foreground">
                          Rs. {medicine.price.toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${medicine.stock === 0 ? 'text-destructive' : medicine.stock < 10 ? 'text-accent' : 'text-success'}`}>
                        {medicine.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={stockStatus.variant}
                        className={stockStatus.variant === 'default' ? 'bg-success/10 text-success border-success/20' : ''}
                      >
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Dialog open={isDialogOpen && selectedMedicine?._id === medicine._id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => openQuantityDialog(medicine)}
                              disabled={medicine.stock === 0}
                              className="gradient-accent text-accent-foreground hover:opacity-90 shadow-sm"
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Add to Cart
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Add to Cart</DialogTitle>
                              <DialogDescription>
                                Select quantity for <span className="font-semibold text-foreground">{selectedMedicine?.name}</span>
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-muted-foreground">
                                    {selectedMedicine?.discount && selectedMedicine.discount > 0 ? 'Original Price:' : 'Price:'}
                                  </span>
                                  <span className={selectedMedicine?.discount && selectedMedicine.discount > 0 ? 'text-sm text-muted-foreground line-through' : 'font-semibold text-foreground'}>
                                    Rs. {selectedMedicine?.price.toLocaleString()}
                                  </span>
                                </div>
                                {selectedMedicine?.discount && selectedMedicine.discount > 0 && (
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-success">Discounted Price ({selectedMedicine.discount}% OFF):</span>
                                    <span className="font-semibold text-success">
                                      Rs. {calculateDiscountedPrice(selectedMedicine.price, selectedMedicine.discount).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Available Stock:</span>
                                  <span className="font-semibold text-success">{selectedMedicine?.stock}</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Quantity</label>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={decrementQuantity}
                                    disabled={quantity <= 1}
                                    className="h-10 w-10"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  
                                  <Input
                                    type="number"
                                    min="1"
                                    max={selectedMedicine?.stock}
                                    value={quantityInput}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    onBlur={handleQuantityBlur}
                                    onFocus={handleQuantityFocus}
                                    className="h-10 text-center font-semibold text-lg bg-background border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={incrementQuantity}
                                    disabled={selectedMedicine ? quantity >= selectedMedicine.stock : false}
                                    className="h-10 w-10"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Click input to type quantity directly or use +/- buttons
                                </p>
                              </div>

                              <div className="p-4 bg-primary/10 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-foreground">Total:</span>
                                  <span className="text-2xl font-bold text-primary">
                                    Rs. {(calculateDiscountedPrice(selectedMedicine?.price || 0, selectedMedicine?.discount) * quantity).toLocaleString()}
                                  </span>
                                </div>
                                {selectedMedicine?.discount && selectedMedicine.discount > 0 && (
                                  <p className="text-xs text-success mt-1 text-right">
                                    You save: Rs. {(((selectedMedicine?.price || 0) - calculateDiscountedPrice(selectedMedicine?.price || 0, selectedMedicine?.discount)) * quantity).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            <DialogFooter className="gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={handleAddToCart}
                                className="gradient-primary"
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Delete Medicine</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <span className="font-semibold">{medicine.name}</span>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-muted text-foreground hover:bg-muted/80">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(medicine._id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MedicineTable;