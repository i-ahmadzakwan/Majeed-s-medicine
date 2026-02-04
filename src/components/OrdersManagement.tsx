import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_URL } from '@/lib/config';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  ShoppingBag,
  Phone,
  MapPin,
  RefreshCw,
  Bell,
  BellOff,
  Volume2,
  Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const previousPendingCount = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationsEnabled(permission === 'granted');
        });
      } else {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    }
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const showBrowserNotification = (order: Order) => {
    if (notificationsEnabled && 'Notification' in window) {
      const notification = new Notification('🔔 New Order Received!', {
        body: `Order ${order.orderNumber} from ${order.customerName}\nAmount: Rs. ${order.totalAmount.toLocaleString()}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: order._id,
        requireInteraction: true,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        setSelectedOrder(order);
        notification.close();
      };

      playNotificationSound();
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      const data = await response.json();
      
      const newPendingOrders = data.filter((order: Order) => order.status === 'pending');
      
      if (previousPendingCount.current > 0 && newPendingOrders.length > previousPendingCount.current) {
        const newestOrder = newPendingOrders[0];
        showBrowserNotification(newestOrder);
      }
      
      previousPendingCount.current = newPendingOrders.length;
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } else {
      setNotificationsEnabled(false);
    }
  };

  const downloadOrderPDF = (order: Order) => {
    const doc = new jsPDF();
    
    // Colors
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const textColor: [number, number, number] = [51, 51, 51];
    const lightGray: [number, number, number] = [245, 245, 245];
    
    // Header with background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MAJEED MEDICINE', 105, 15, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Health, Our Priority', 105, 22, { align: 'center' });
    
    // Document Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER INVOICE', 105, 30, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(...textColor);
    
    // Order Info Section
    let yPos = 45;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Information', 14, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Number: ${order.orderNumber}`, 14, yPos);
    doc.text(`Status: ${order.status.toUpperCase()}`, 120, yPos);
    
    yPos += 6;
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Date: ${orderDate}`, 14, yPos);
    doc.text(`Payment: ${order.paymentMethod}`, 120, yPos);
    
    // Customer Information
    yPos += 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', 14, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.customerName}`, 14, yPos);
    
    if (order.customerPhone) {
      yPos += 6;
      doc.text(`Phone: ${order.customerPhone}`, 14, yPos);
    }
    
    if (order.customerAddress) {
      yPos += 6;
      const addressLines = doc.splitTextToSize(`Address: ${order.customerAddress}`, 180);
      doc.text(addressLines, 14, yPos);
      yPos += (addressLines.length - 1) * 6;
    }
    
    // Items Table
    yPos += 12;
    
    const tableData = order.items.map(item => [
      item.name,
      item.quantity.toString(),
      `Rs. ${item.price.toLocaleString()}`,
      `Rs. ${item.subtotal.toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Medicine', 'Quantity', 'Price', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 40 }
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      margin: { left: 14, right: 14 }
    });
    
    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
    
    // Total Section with background
    yPos = finalY + 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, yPos - 5, 182, 15, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 120, yPos + 5);
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.text(`Rs. ${order.totalAmount.toLocaleString()}`, 180, yPos + 5, { align: 'right' });
    
    // Reset color
    doc.setTextColor(...textColor);
    
    // Notes if available
    if (order.notes) {
      yPos += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 14, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(order.notes, 180);
      doc.text(notesLines, 14, yPos);
      yPos += notesLines.length * 5;
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
    doc.text('For any queries, please contact our support team', 105, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    doc.save(`Order-${order.orderNumber}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      processing: { variant: 'default' as const, icon: RefreshCw, label: 'Processing' },
      completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={status === 'completed' ? 'bg-success/10 text-success border-success/20' : ''}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Controls */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${notificationsEnabled ? 'bg-success/10' : 'bg-muted'}`}>
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-success" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {notificationsEnabled ? '🔔 Notifications Active' : '🔕 Notifications Off'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {notificationsEnabled 
                    ? 'You\'ll get alerts for new orders' 
                    : 'Enable to receive order notifications'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="gap-2"
              >
                <Volume2 className={`w-4 h-4 ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                Sound {soundEnabled ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant={notificationsEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={toggleNotifications}
                className="gap-2"
              >
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {notificationsEnabled ? 'Enabled' : 'Enable Notifications'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalOrders || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{stats?.completedOrders || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">Rs. {stats?.totalRevenue.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Recent Orders
              {stats && stats.pendingOrders > 0 && (
                <Badge variant="secondary" className="ml-2 bg-yellow-500/10 text-yellow-600">
                  {stats.pendingOrders} pending
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchOrders(); fetchStats(); }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow 
                      key={order._id} 
                      className={`hover:bg-muted/30 transition-colors ${order.status === 'pending' ? 'bg-yellow-500/5' : ''}`}
                    >
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.items.length} item(s)</TableCell>
                      <TableCell className="text-right font-semibold">
                        Rs. {order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadOrderPDF(order)}
                            className="gap-1"
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                  <span>Order Details - {order.orderNumber}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadOrderPDF(order)}
                                    className="gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                  </Button>
                                </DialogTitle>
                                <DialogDescription>
                                  Complete order information and management
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedOrder && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Customer</p>
                                      <p className="font-medium">{selectedOrder.customerName}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> Phone
                                      </p>
                                      <p className="font-medium">{selectedOrder.customerPhone || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Address
                                      </p>
                                      <p className="font-medium">{selectedOrder.customerAddress || 'N/A'}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="font-semibold mb-2">Order Items</p>
                                    <div className="border border-border rounded-lg overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-muted/20">
                                            <TableHead>Medicine</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {selectedOrder.items.map((item, idx) => (
                                            <TableRow key={idx}>
                                              <TableCell>{item.name}</TableCell>
                                              <TableCell className="text-center">{item.quantity}</TableCell>
                                              <TableCell className="text-right">Rs. {item.price.toLocaleString()}</TableCell>
                                              <TableCell className="text-right font-semibold">
                                                Rs. {item.subtotal.toLocaleString()}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                                    <span className="font-semibold">Total Amount:</span>
                                    <span className="text-2xl font-bold text-primary">
                                      Rs. {selectedOrder.totalAmount.toLocaleString()}
                                    </span>
                                  </div>

                                  {selectedOrder.notes && (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                                      <p className="text-sm p-3 bg-muted/30 rounded-lg">{selectedOrder.notes}</p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4">
                                    <Label className="font-semibold">Update Status:</Label>
                                    <Select
                                      value={selectedOrder.status}
                                      onValueChange={(value) => {
                                        updateOrderStatus(selectedOrder._id, value);
                                        setSelectedOrder({ ...selectedOrder, status: value as any });
                                      }}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {order.status === 'pending' && (
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order._id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManagement;


