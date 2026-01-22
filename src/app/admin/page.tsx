'use client';

import { useAuth } from '@/hooks/use-auth';
import { isAdmin } from '@/lib/admin';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Gift,
  Lightbulb,
  Crown,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  grantPremiumAccess,
  addHintsToUser,
  getUserStats,
  getRecentTransactions,
  getAllUsers,
  updateUserProfile,
  deleteUserAccount,
} from '@/lib/admin-actions';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('');
  const [hintsToAdd, setHintsToAdd] = useState(10);

  useEffect(() => {
    if (!loading && (!user || !isAdmin(user))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isAdmin(user)) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.email) return;
    
    setLoadingData(true);
    try {
      const [statsData, usersData, transactionsData] = await Promise.all([
        getUserStats(user.email),
        getAllUsers(user.email),
        getRecentTransactions(user.email, 20),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setTransactions(transactionsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleGrantPremium = async (userId: string) => {
    if (!user?.email) return;
    
    try {
      await grantPremiumAccess(userId, user.email);
      toast({
        title: 'Success',
        description: 'Premium access granted',
      });
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddHints = async () => {
    if (!user?.email || !selectedUserId) return;
    
    try {
      await addHintsToUser(selectedUserId, hintsToAdd, user.email);
      toast({
        title: 'Success',
        description: `Added ${hintsToAdd} hints`,
      });
      loadDashboardData();
      setSelectedUserId('');
      setHintsToAdd(10);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Super Admin: {user.email}
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.freeUsers || 0} free, {stats?.premiumUsers || 0} premium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalUsers ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(stats?.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage users and grant privileges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Add Hints */}
            <div className="space-y-2">
              <Label>Add Hints to User</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="User ID"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Hints"
                  value={hintsToAdd}
                  onChange={(e) => setHintsToAdd(Number(e.target.value))}
                  className="w-24"
                />
                <Button onClick={handleAddHints} disabled={!selectedUserId}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.slice(0, 10).map((userData: any) => (
              <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{userData.email || 'No email'}</p>
                  <p className="text-sm text-muted-foreground">
                    ID: {userData.id} | Level: {userData.level || 1} | Score: {userData.score || 0} | Hints: {userData.hints || 0}
                  </p>
                  {userData.isPremium && (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1">
                      <Crown className="h-3 w-3" />
                      Premium
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!userData.isPremium && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGrantPremium(userData.id)}
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      Grant Premium
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">₦{transaction.amount?.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.type} | {transaction.reference}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    User: {transaction.userId}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                    transaction.status === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
