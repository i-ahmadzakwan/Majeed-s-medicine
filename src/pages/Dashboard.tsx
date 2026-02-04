import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import MedicineTable from '@/components/MedicineTable';
import AddMedicine from '@/components/AddMedicine';
import Cart from '@/components/Cart';
import OrdersManagement from '@/components/OrdersManagement';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, LogOut, Shield, ShoppingBag, Package, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { API_URL } from '@/lib/config';

interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

const Dashboard = () => {
  const { isAuthenticated, user, logout, fetchCart } = useApp();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/api/medicines`);
      const data = await response.json();
      setMedicines(data || []);
      
      // Also refresh cart to sync stock changes
      if (fetchCart) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMedicines();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary shadow-lg">
                <Pill className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">
                  Majeed's Medicines
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {isAdmin ? 'Admin Dashboard' : 'Online Pharmacy'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                {isAdmin ? (
                  <Shield className="w-4 h-4 text-primary" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-accent" />
                )}
                <span className="text-sm font-medium text-foreground">{user?.username}</span>
                <Badge variant={isAdmin ? "default" : "secondary"} className="ml-2">
                  {isAdmin ? 'Admin' : 'Customer'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {isAdmin ? (
          // Admin View - Tabs with Inventory and Orders
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="inventory" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                  <TabsTrigger value="inventory" className="gap-2">
                    <Package className="w-4 h-4" />
                    <span>Inventory</span>
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>Orders</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="inventory" className="space-y-6">
                  {loading ? (
                    <div className="bg-card rounded-xl border border-border shadow-lg p-8 text-center">
                      <p className="text-muted-foreground">Loading medicines...</p>
                    </div>
                  ) : (
                    <>
                      <MedicineTable
                        medicines={medicines}
                        onMedicineDeleted={fetchMedicines}
                        onMedicineBought={fetchMedicines}
                        isAdmin={isAdmin}
                      />
                      <AddMedicine onMedicineAdded={fetchMedicines} />
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="orders">
                  <OrdersManagement />
                </TabsContent>
              </Tabs>
            </div>

            {/* Admin Cart - Right Column */}
            <div className="lg:col-span-1">
              <Cart />
            </div>
          </div>
        ) : (
          // Customer View - Full Width
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {loading ? (
                <div className="bg-card rounded-xl border border-border shadow-lg p-8 text-center">
                  <p className="text-muted-foreground">Loading medicines...</p>
                </div>
              ) : (
                <MedicineTable
                  medicines={medicines}
                  onMedicineDeleted={fetchMedicines}
                  onMedicineBought={fetchMedicines}
                  isAdmin={isAdmin}
                />
              )}
            </div>

            {/* Customer Cart - Bottom Full Width */}
            <div className="lg:col-span-3">
              <Cart />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Majeed's Medicines. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;