import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pill, AlertCircle, Check, Hash, Percent } from 'lucide-react';

interface AddMedicineProps {
  onMedicineAdded: () => void;
}

const AddMedicine = ({ onMedicineAdded }: AddMedicineProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [discount, setDiscount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim() || !description.trim() || !price.trim() || !stock.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);
    const discountNum = discount ? parseFloat(discount) : 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Please enter a valid stock quantity');
      return;
    }

    if (discountNum < 0 || discountNum > 100) {
      setError('Discount must be between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          stock: stockNum,
          batchNumber: batchNumber.trim(),
          discount: discountNum
        }),
      });

      if (response.ok) {
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
        setBatchNumber('');
        setDiscount('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onMedicineAdded();
      } else {
        setError('Failed to add medicine');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-display text-foreground">Add New Medicine</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              Medicine added successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="med-name" className="text-foreground font-medium">
                Medicine Name *
              </Label>
              <div className="relative">
                <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="med-name"
                  type="text"
                  placeholder="e.g., Panadol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-background border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="med-desc" className="text-foreground font-medium">
                Description *
              </Label>
              <Input
                id="med-desc"
                type="text"
                placeholder="e.g., Pain reliever"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="med-price" className="text-foreground font-medium">
                Price (PKR) *
              </Label>
              <Input
                id="med-price"
                type="number"
                placeholder="e.g., 250"
                min="1"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-background border-border focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="med-stock" className="text-foreground font-medium">
                Stock Quantity *
              </Label>
              <Input
                id="med-stock"
                type="number"
                placeholder="e.g., 100"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="bg-background border-border focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-number" className="text-foreground font-medium">
                Batch Number
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="batch-number"
                  type="text"
                  placeholder="e.g., BATCH-2024-001"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="pl-10 bg-background border-border focus:border-primary focus:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">Optional - For tracking purposes</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount" className="text-foreground font-medium">
                Discount (%)
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="discount"
                  type="number"
                  placeholder="e.g., 10"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="pl-10 bg-background border-border focus:border-primary focus:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">Optional - Special event discount (0-100%)</p>
            </div>
          </div>

          {/* Preview of discounted price */}
          {price && discount && parseFloat(discount) > 0 && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">
                  <strong>Original Price:</strong> Rs. {parseFloat(price).toLocaleString()}
                </span>
                <span className="text-sm text-success font-semibold">
                  <strong>Discounted Price:</strong> Rs. {(parseFloat(price) * (1 - parseFloat(discount) / 100)).toLocaleString()}
                  <span className="ml-1 text-xs">({discount}% OFF)</span>
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto gradient-primary text-primary-foreground hover:opacity-90 shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Adding...' : 'Add Medicine'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddMedicine;