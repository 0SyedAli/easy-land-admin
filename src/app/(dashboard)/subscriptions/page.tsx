'use client';

import React, { useEffect, useState } from 'react';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import Search from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TimelineIcon from '@mui/icons-material/Timeline';
import StarOutlineIcon from '@mui/icons-material/StarOutlineOutlined';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import {
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Grid,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  DialogActions,
  Avatar,
  Switch
} from '@mui/material';
import api from '@/lib/api';

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  tier: string;
  features: string[];
  status: 'active' | 'inactive';
  subscribersCount: number;
  activeSubscribers?: any[];
}

interface SubscriptionStats {
  monthlyRevenue: number;
  totalSubscriptionsSold: number;
  totalUniqueSubscribers: number;
  activePlansCount: number;
  activeSubscribersCount: number;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    tier: 'basic',
    features: [''],
    status: 'active' as 'active' | 'inactive'
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('subscription', {
        params: {
          search: debouncedSearchTerm || undefined
        }
      });
      if (response.data && response.data.plans) {
        setPlans(response.data.plans);
      }
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
      setError('Failed to load subscription plans.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('subscription/stats');
      if (response.data && response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, [debouncedSearchTerm]);

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingCycle: plan.billingCycle,
        tier: plan.tier,
        features: plan.features.length > 0 ? plan.features : [''],
        status: plan.status || 'active'
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        billingCycle: 'monthly',
        tier: 'basic',
        features: [''],
        status: 'active'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeatureRow = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeatureRow = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, features: newFeatures.length ? newFeatures : [''] }));
  };

  const handleSubmit = async () => {
    try {
      setFormLoading(true);
      const payload = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (editingPlan) {
        await api.patch(`subscription/${editingPlan._id}`, payload);
      } else {
        await api.post('subscription', payload);
      }

      fetchPlans();
      fetchStats();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving plan:', err);
      alert('Failed to save subscription plan.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      const newStatus = plan.status === 'active' ? 'inactive' : 'active';
      await api.patch(`subscription/${plan._id}`, { status: newStatus });
      setPlans(prev => prev.map(p => p._id === plan._id ? { ...p, status: newStatus } : p));
      fetchStats();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update plan status.');
    }
  };

  const filteredPlans = plans.filter(plan => activeFilter === 'all' || plan.status === activeFilter);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Subscriptions</h1>
          <p className="text-gray-500">Manage All Subscriptions</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#1e293b' },
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1,
              fontWeight: 'bold'
            }}
          >
            Add New Plan
          </Button>
          <IconButton className="bg-white border border-gray-200 shadow-sm rounded-full w-10 h-10">
            <NotificationsNone className="text-gray-600" />
          </IconButton>
        </div>
      </div>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {loading ? (
            // show skeletons for the top stat cards while loading
            Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xl: 'grow', lg: 3, sm: 6 }}>
                <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs flex flex-col justify-between h-[100px] animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                    <div className="space-y-3 w-2/3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
                </div>
              </Grid>
            ))
          ) : (
            [
              { label: 'Monthly Revenue', value: `$${stats?.monthlyRevenue || 0}`, icon: <AttachMoneyIcon />, color: '#4caf50', bg: '#e8f5e9' },
              { label: 'Total Subscribers', value: stats?.totalUniqueSubscribers || 0, icon: <PeopleOutlineIcon />, color: '#2196f3', bg: '#e3f2fd' },
              { label: 'Active Plans', value: stats?.activePlansCount || 0, icon: <FactCheckIcon />, color: '#9c27b0', bg: '#f3e5f5' },
              { label: 'Active Subscribers', value: stats?.activeSubscribersCount || 0, icon: <TimelineIcon />, color: '#ff9800', bg: '#fff3e0' },
            ].map((stat, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <Box sx={{ bgcolor: stat.bg, p: 1.5, borderRadius: 3, color: stat.color, display: 'flex' }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: "500" }}>{stat.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }} color="#1e293b">{stat.value}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Search & Filters */}
      <Box sx={{ mb: 4 }}>
        <Box className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:bg-gray-100 transition-all text-sm"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Box className="flex bg-gray-50 p-1 rounded-xl">
            {['all', 'active', 'inactive'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${activeFilter === filter ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {filter}
              </button>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Plan Cards Grid */}
      <Box sx={{ flex: 1 }}>

        <Grid container spacing={4}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Grid key={i} size={{ xl: 'grow', lg: 3, sm: 6 }}>
                <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs flex flex-col justify-between h-[500px] animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 w-2/3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  </div>
                  {/* <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div> */}
                </div>
              </Grid>
            ))
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            filteredPlans.map((plan) => (
              <Grid key={plan._id} size={{ xs: 12, md: 4 }}>
                <Box className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col relative transition-all hover:shadow-lg hover:border-gray-200">
                  {/* Status Badge & Toggle */}
                  <Box sx={{ position: 'absolute', top: 32, right: 32, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      size="small"
                      checked={plan.status === 'active'}
                      onChange={() => handleToggleStatus(plan)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#000' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#000' },
                      }}
                    />
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${plan.status === 'active' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {plan.status}
                    </span>
                  </Box>

                  {/* Icon & Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {plan.tier === 'premium' ? <WorkspacePremiumIcon sx={{ color: '#ffc107' }} /> :
                      plan.tier === 'pro' ? <StarOutlineIcon sx={{ color: '#9c27b0' }} /> :
                        plan.tier === 'basic' ? <TaskAltIcon sx={{ color: '#2196f3' }} /> :
                          <TaskAltIcon sx={{ color: '#2196f3' }} />}
                    <Typography variant="h5" sx={{ fontWeight: "bold" }} color="#1e293b">{plan.name}</Typography>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 4, height: 40, overflow: 'hidden' }}>
                    {plan.description}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" component="span" sx={{ fontWeight: '800' }} color="#1e293b">${plan.price}</Typography>
                    <Typography variant="body2" component="span" color="textSecondary"> / {plan.billingCycle}</Typography>
                  </Box>

                  {/* Subscribers */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <PeopleOutlineIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: '500' }}>
                      {plan.subscribersCount || 0} subscribers
                    </Typography>
                  </Box>

                  {/* Tier Badge */}
                  <Box sx={{ mb: 4 }}>
                    <Chip
                      label={`${plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)} Tier`}
                      size="small"
                      sx={{
                        bgcolor: plan.tier === 'premium' ? '#fff9e6' : plan.tier === 'pro' ? '#f3e5f5' : '#e3f2fd',
                        color: plan.tier === 'premium' ? '#ff9800' : plan.tier === 'pro' ? '#9c27b0' : '#2196f3',
                        fontWeight: 'bold',
                        borderRadius: 1.5,
                        fontSize: '11px'
                      }}
                    />
                  </Box>

                  {/* Features */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="#1e293b" sx={{ mb: 2, fontWeight: 'bold' }}>Features:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                          <Typography variant="body2" color="#475569" sx={{ fontSize: '13px' }}>{feature}</Typography>
                        </Box>
                      ))}
                      {plan.features.length > 3 && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, cursor: 'pointer', '&:hover': { color: '#000' } }}>
                          +{plan.features.length - 3} more features
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenModal(plan)}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        borderColor: '#e2e8f0',
                        color: '#475569',
                        fontWeight: 'bold',
                        '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
                      }}
                    >
                      Edit
                    </Button>
                    {/* <IconButton sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 1 }}>
                      <MoreHorizIcon />
                    </IconButton> */}
                  </Box>
                </Box>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 6, bgcolor: 'white' } }
        }}
      >
        <DialogTitle sx={{ px: 4, pt: 4, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b' }}>
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Define pricing and features for your service
            </Typography>
          </Box>
          <IconButton onClick={handleCloseModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Plan Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g. Premium Plan"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="Short description of the plan..."
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Price ($)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Billing Cycle</InputLabel>
                <Select
                  name="billingCycle"
                  value={formData.billingCycle}
                  label="Billing Cycle"
                  onChange={handleInputChange as any}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Plan Tier</InputLabel>
                <Select
                  name="tier"
                  value={formData.tier}
                  label="Plan Tier"
                  onChange={handleInputChange as any}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange as any}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Features Section */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#475569' }}>Features</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addFeatureRow} sx={{ textTransform: 'none', color: '#0f172a' }}>
                  Add Feature
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {formData.features.map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder={`Feature #${index + 1}`}
                    />
                    <IconButton size="small" color="error" onClick={() => removeFeatureRow(index)} disabled={formData.features.length === 1 && feature === ''}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 4, pt: 0 }}>
          <Button onClick={handleCloseModal} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={formLoading}
            sx={{
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#1e293b' },
              borderRadius: '12px',
              textTransform: 'none',
              px: 4,
              fontWeight: 'bold'
            }}
          >
            {formLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (editingPlan ? 'Update Plan' : 'Create Plan')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
