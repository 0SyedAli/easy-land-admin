'use client';

import React, { useEffect, useState } from 'react';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import Search from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import {
  IconButton,
  CircularProgress,
  Alert,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Grid,
  Divider,
  Box,
  Chip,
  TablePagination,
  Avatar,
  Button,
  DialogActions,
  DialogContentText
} from '@mui/material';
import api from '@/lib/api';
import { DeleteOutlineOutlined } from '@mui/icons-material';

interface Provider {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profile: string;
  location: {
    address: string;
  };
  pricingPerKm: number;
  status: string;
  createdAt: string;
  totalJobs: number;
  totalEarnings: number;
  services: any[];
  workingHours: Record<string, any>;
  portfolio?: string[];
  subscription?: {
    name?: string;
    status?: string;
  } | null;
}

export default function ProviderPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [totalProviders, setTotalProviders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerIdToDelete, setProviderIdToDelete] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`landscraper/all?page=${page + 1}&limit=${rowsPerPage}`, {});
      if (response.data && response.data.landscrapers) {
        setProviders(response.data.landscrapers);
        setTotalProviders(response.data.pagination?.total || response.data.landscrapers.length);
      }
    } catch (err: any) {
      console.error('Failed to fetch providers:', err);
      setError('Failed to load providers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setModalOpen(true);
  };

  const handleToggleStatus = async (event: React.ChangeEvent<HTMLInputElement>, provider: Provider) => {
    if (event.stopPropagation) event.stopPropagation(); // Prevent opening the modal if called from table
    const newStatus = event.target.checked ? 'active' : 'suspended';

    try {
      // Optimistic update
      setProviders((prev) =>
        prev.map((p) => p._id === provider._id ? { ...p, status: newStatus } : p)
      );
      if (selectedProvider && selectedProvider._id === provider._id) {
        setSelectedProvider({ ...selectedProvider, status: newStatus });
      }

      await api.patch(`landscraper/status/${provider._id}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update provider status.');
      // Revert on failure
      setProviders((prev) =>
        prev.map((p) => p._id === provider._id ? { ...p, status: provider.status } : p)
      );
      if (selectedProvider && selectedProvider._id === provider._id) {
        setSelectedProvider({ ...selectedProvider, status: provider.status });
      }
    };
  };

  const handleDeleteProvider = async () => {
    if (!providerIdToDelete) return;

    try {
      setLoading(true);
      await api.delete(`landscraper/admin/${providerIdToDelete}`);
      setProviders((prev) => prev.filter((p) => p._id !== providerIdToDelete));
      setTotalProviders((prev) => prev - 1);
      setDeleteDialogOpen(false);
      setProviderIdToDelete(null);
    } catch (err) {
      console.error('Failed to delete provider:', err);
      alert('Failed to delete provider.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (event: React.MouseEvent, providerId: string) => {
    event.stopPropagation();
    setProviderIdToDelete(providerId);
    setDeleteDialogOpen(true);
  };

  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.phone?.includes(searchTerm) ||
    (provider.location?.address && provider.location.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Providers</h1>
          <p className="text-gray-500">Manage Service Providers</p>
        </div>
        <IconButton className="bg-white border border-gray-200 shadow-sm rounded-full w-10 h-10">
          <NotificationsNone className="text-gray-600" />
        </IconButton>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">

        {/* Container Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Provider Management</h2>
            <p className="text-gray-500 text-sm">Manage all service providers (landscrapers)</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg font-medium text-gray-700">
            {totalProviders} Total Providers
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6f1f]/20 focus:border-[#2f6f1f] transition-all"
            placeholder="Search by name, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error / Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <CircularProgress sx={{ color: '#2f6f1f' }} />
          </div>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="pb-3 font-semibold">Provider</th>
                    <th className="pb-3 font-semibold">Contact</th>
                    <th className="pb-3 font-semibold">Address</th>
                    <th className="pb-3 font-semibold">Services</th>
                    <th className="pb-3 font-semibold">Earnings</th>
                    <th className="pb-3 font-semibold">Join Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((provider) => (
                    <tr
                      key={provider._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    // onClick={() => handleRowClick(provider)}
                    >
                      <td className="py-4 flex items-center gap-3">
                        {provider.profile ? (
                          <img src={provider.profile} alt={provider.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#82b83b] flex items-center justify-center text-white font-bold text-lg">
                            {provider.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{provider.name}</span>
                      </td>
                      <td className="py-4 text-gray-600 text-sm">{provider.phone || '-'}</td>
                      <td className="py-4 text-gray-600 text-sm max-w-[200px] truncate" title={provider.location?.address}>
                        {provider.location?.address || '-'}
                      </td>
                      <td className="py-4 text-gray-600 text-sm">
                        {provider.services?.length || 0} services
                      </td>
                      <td className="py-4 text-gray-600 text-sm">${provider.totalEarnings || 0}</td>
                      <td className="py-4 text-gray-600 text-sm">
                        {new Date(provider.createdAt).toLocaleDateString('en-CA')}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider ${provider.status === 'active' ? 'bg-[#0f172a]' : 'bg-orange-500'
                          }`}>
                          {provider.status}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <button
                            onClick={() => handleRowClick(provider)}
                            className="px-4 py-1 rounded-lg text-xs font-semibold text-black uppercase tracking-wider bg-primary border border-[#4f6f2f] hover:bg-opacity-80 cursor-pointer transition-all"
                          >
                            View
                          </button>
                          <IconButton
                            onClick={(e) => openDeleteDialog(e, provider._id)}
                            sx={{ color: '#ef4444' }}
                            size="small"
                          >
                            <DeleteOutlineOutlined />
                          </IconButton>
                        </Box>
                      </td>
                    </tr>
                  ))}
                  {filteredProviders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        No providers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalProviders > 10 && (
              <TablePagination
                component="div"
                count={totalProviders}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}
          </>
        )}

      </div>

      {/* Provider Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              bgcolor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }
          }
        }}
      >
        <DialogTitle sx={{ px: 4, pt: 4, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b' }}>Provider Details</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Complete provider information</Typography>
          </Box>
          <IconButton onClick={() => setModalOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 4 }}>
          {selectedProvider && (
            <Box >
              {/* Profile Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, my: 3 }}>
                <Avatar
                  src={selectedProvider.profile}
                  sx={{ width: 100, height: 100, border: '4px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: 3 }}
                >
                  {selectedProvider.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b', mb: 0.5 }}>
                    {selectedProvider.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                      <span className="mr-1 text-sm">★</span>
                      <Typography variant="body2" sx={{ fontWeight: '600' }}>4.8 Rating</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>•</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: '500' }}>{selectedProvider.totalJobs || 0} Jobs</Typography>
                  </Box>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider ${selectedProvider.status === 'active' ? 'bg-[#2ECC71]' : 'bg-orange-500'}`}>
                    {selectedProvider.status}
                  </span>
                </Box>
              </Box>

              {/* Information Grid */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 0.5 }}>Email</Typography>
                  <Typography variant="body2" sx={{ fontWeight: '500', color: '#334155', wordBreak: 'break-all' }}>{selectedProvider.email || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 0.5 }}>Phone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: '500', color: '#334155' }}>{selectedProvider.phone || 'N/A'}</Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 0.5 }}>Total Earnings</Typography>
                  <Typography variant="h6" sx={{ fontWeight: '700', color: '#2ECC71' }}>${selectedProvider.totalEarnings?.toLocaleString() || 0}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 0.5 }}>Join Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: '500', color: '#334155' }}>
                    {new Date(selectedProvider.createdAt).toLocaleDateString('en-CA')}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 0.5 }}>Distance</Typography>
                  <Typography variant="body2" sx={{ fontWeight: '500', color: '#334155' }}>2.3 miles</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 0.5 }}>Completed Jobs</Typography>
                  <Typography variant="body2" sx={{ fontWeight: '500', color: '#334155' }}>{selectedProvider.totalJobs || 0}</Typography>
                </Grid>
              </Grid>

              {/* Services Offered */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 1.5 }}>Services Offered</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedProvider.services && selectedProvider.services.length > 0 ? (
                    selectedProvider.services.map((service: any, index: number) => (
                      <Chip
                        key={index}
                        label={service.name}
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: '8px', fontWeight: '500', color: '#475569', borderColor: '#e2e8f0', bgcolor: '#f8fafc' }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No services listed</Typography>
                  )}
                </Box>
              </Box>

              {/* Subscription */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 1 }}>Subscription</Typography>
                <Box sx={{
                  bgcolor: '#f1f5f9',
                  borderRadius: '12px',
                  p: 2,
                  border: '1px border #e2e8f0',
                  display: 'inline-block',
                  minWidth: '150px'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: '700', color: '#1e293b' }}>
                    {selectedProvider.subscription?.name || 'Basic Plan'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Status: {selectedProvider.subscription?.status || 'Active'}
                  </Typography>
                </Box>
              </Box>

              {/* Portfolio */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: '600', color: '#94a3b8', display: 'block', mb: 1.5 }}>Portfolio</Typography>
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                  {selectedProvider.portfolio && selectedProvider.portfolio.length > 0 ? (
                    selectedProvider.portfolio.map((img: string, index: number) => (
                      <Box
                        key={index}
                        component="img"
                        src={img}
                        alt={`Portfolio ${index + 1}`}
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '1px solid #e2e8f0',
                          flexShrink: 0
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No portfolio images</Typography>
                  )}
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <button
                  className="flex items-center cursor-pointer gap-2 px-6 py-2 border border-[#e2e8f0] rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
                  onClick={(e) => handleToggleStatus({ target: { checked: selectedProvider.status !== 'active' } } as any, selectedProvider)}
                >
                  {selectedProvider.status === 'active' ? 'Suspend Provider' : 'Activate Provider'}
                </button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this provider? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'gray' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProvider}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}
