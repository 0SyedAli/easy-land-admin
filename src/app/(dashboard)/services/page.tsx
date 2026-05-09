'use client';

import React, { useEffect, useState, useRef } from 'react';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import Search from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
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
  Divider
} from '@mui/material';
import api from '@/lib/api';

interface Category {
  _id: string;
  name: string;
}

interface Service {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: Category;
  price: number;
  pricingType: string;
  status: string;
  requests: number;
  revenue: number;
  landscrapers: string[];
  createdAt: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    pricingType: 'per_visit',
    status: 'active'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        api.get('service'),
        api.get('category').catch(() => ({ data: { categories: [] } })) // Fallback if no category endpoint
      ]);

      if (servicesRes.data && servicesRes.data.services) {
        setServices(servicesRes.data.services);
      }

      if (categoriesRes.data && categoriesRes.data.categories) {
        setCategories(categoriesRes.data.categories);
      } else {
        // Mocking some categories if empty to allow testing
        setCategories([
          { _id: '69e94e3966693295faa9b5ba', name: 'Remodeling' },
          { _id: '69e94e3966693295faa9b5bb', name: 'Cleaning' },
          { _id: '69e94e3966693295faa9b5bc', name: 'Landscaping' }
        ]);
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        category: service.category?._id || '',
        price: service.price,
        pricingType: service.pricingType,
        status: service.status
      });
      setImagePreview(service.icon);
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        price: 0,
        pricingType: 'per_visit',
        status: 'active'
      });
      setImagePreview(null);
    }
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleViewDetail = (service: Service) => {
    setSelectedService(service);
    setDetailModalOpen(true);
  };

  const handleOpenDeleteDialog = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setFormLoading(true);
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('price', formData.price.toString());
      data.append('pricingType', formData.pricingType);
      data.append('status', formData.status);

      if (selectedFile) {
        data.append('icon', selectedFile);
      }

      if (editingService) {
        // Note: For PATCH with FormData, some APIs require different handling, 
        // but typically axios handles it.
        await api.patch(`service/${editingService._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('service', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      fetchData();
      setModalOpen(false);
    } catch (err: any) {
      console.error('Error saving service:', err);
      alert('Failed to save service.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      setFormLoading(true);
      await api.delete(`service/${serviceToDelete._id}`);
      fetchData();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Failed to delete service:', err);
      alert('Failed to delete service.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Services</h1>
          <p className="text-gray-500">Manage all service offerings</p>
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
            Add New Service
          </Button>
          <IconButton className="bg-white border border-gray-200 shadow-sm rounded-full w-10 h-10">
            <NotificationsNone className="text-gray-600" />
          </IconButton>
        </div>
      </div>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {[
            { label: 'Total Services', value: services.length, color: '#0f172a', bg: '#f1f5f9' },
            { label: 'Active Services', value: services.filter(s => s.status === 'active').length, color: '#2ECC71', bg: '#e8f5e9' },
            { label: 'Total Revenue', value: `$${services.reduce((acc, curr) => acc + (curr.revenue || 0), 0).toFixed(2)}`, color: '#2ECC71', bg: '#e8f5e9' },
            { label: 'Total Requests', value: services.reduce((acc, curr) => acc + (curr.requests || 0), 0), color: '#3498DB', bg: '#e3f2fd' },
          ].map((stat, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Box className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: '500', mb: 1 }}>{stat.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: '800', color: stat.color }}>{stat.value}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1 }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] transition-all text-sm"
                placeholder="Search services by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <CircularProgress sx={{ color: '#0f172a' }} />
            </div>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-sm text-gray-400">
                    <th className="pb-4 font-semibold px-2">Service</th>
                    <th className="pb-4 font-semibold px-2">Category</th>
                    <th className="pb-4 font-semibold px-2">Price</th>
                    <th className="pb-4 font-semibold px-2">Pricing Type</th>
                    <th className="pb-4 font-semibold px-2">Providers</th>
                    <th className="pb-4 font-semibold px-2">Requests</th>
                    <th className="pb-4 font-semibold px-2">Status</th>
                    <th className="pb-4 font-semibold px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={service.icon}
                            variant="rounded"
                            sx={{ width: 44, height: 44, bgcolor: '#f1f5f9', p: 1 }}
                          >
                            <PhotoCameraIcon sx={{ color: '#94a3b8' }} />
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{service.name}</span>
                            <span className="text-xs text-gray-400 max-w-[200px] truncate">{service.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Chip
                          label={service.category?.name || 'Uncategorized'}
                          size="small"
                          sx={{ fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#475569' }}
                        />
                      </td>
                      <td className="py-4 px-2 font-bold text-gray-800">${service.price}</td>
                      <td className="py-4 px-2 text-sm text-gray-600 capitalize">{service.pricingType?.replace('_', ' ')}</td>
                      <td className="py-4 px-2 text-sm text-gray-600 font-medium">{service.landscrapers?.length || 0}</td>
                      <td className="py-4 px-2 text-sm text-gray-600 font-medium">{service.requests || 0}</td>
                      <td className="py-4 px-2">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${service.status === 'active' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-1">
                          <IconButton size="small" onClick={() => handleViewDetail(service)} sx={{ color: '#64748b' }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenModal(service)} sx={{ color: '#64748b' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenDeleteDialog(service)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Box>

      {/* Create/Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 6, bgcolor: 'white' } }
        }}
      >
        <DialogTitle sx={{ px: 4, pt: 4, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b' }}>
              {editingService ? 'Edit Service' : 'Create New Service'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Fill in the details to {editingService ? 'update the' : 'add a new'} service
            </Typography>
          </Box>
          <IconButton onClick={() => setModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 4, mt: 2 }}>
          <Grid container spacing={3}>
            {/* Icon Upload */}
            <Grid size={{ xs: 12 }}>
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  height: 120,
                  border: '2px dashed #e2e8f0',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <PhotoCameraIcon sx={{ fontSize: 32, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="caption" color="textSecondary">Upload Service Icon</Typography>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Service Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="e.g. Minor Remodeling"
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
                placeholder="Describe the service..."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={handleInputChange as any}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                <InputLabel>Pricing Type</InputLabel>
                <Select
                  name="pricingType"
                  value={formData.pricingType}
                  label="Pricing Type"
                  onChange={handleInputChange as any}
                >
                  <MenuItem value="per_visit">Per Visit</MenuItem>
                  <MenuItem value="per_hour">Per Hour</MenuItem>
                  <MenuItem value="fixed">Fixed Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
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
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 4, pt: 0 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
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
            {formLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (editingService ? 'Update Service' : 'Create Service')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 6, bgcolor: 'white' } }
        }}
      >
        <DialogTitle sx={{ px: 4, pt: 4, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b' }}>Service Details</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Complete service information</Typography>
          </Box>
          <IconButton onClick={() => setDetailModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, mt: 2, py: 4 }}>
          {selectedService && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Avatar
                  src={selectedService.icon}
                  variant="rounded"
                  sx={{ width: 80, height: 80, bgcolor: '#f1f5f9', p: 1 }}
                />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="#1e293b">{selectedService.name}</Typography>
                  <Chip
                    label={selectedService.category?.name}
                    size="small"
                    sx={{ mt: 1, fontWeight: 'bold', bgcolor: '#f1f5f9', color: '#475569' }}
                  />
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Description</Typography>
                  <Typography variant="body1" color="#475569" sx={{ mt: 0.5 }}>{selectedService.description}</Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Price</Typography>
                  <Typography variant="h6" fontWeight="bold" color="#0f172a">${selectedService.price}</Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Pricing Type</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, textTransform: 'capitalize' }}>{selectedService.pricingType?.replace('_', ' ')}</Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Total Requests</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>{selectedService.requests || 0}</Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Total Revenue</Typography>
                  <Typography variant="body1" fontWeight="bold" color="#2ECC71" sx={{ mt: 0.5 }}>${selectedService.revenue?.toFixed(2) || '0.00'}</Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1, display: 'block' }}>Assigned Landscrapers ({selectedService.landscrapers?.length || 0})</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedService.landscrapers?.length > 0 ? (
                      selectedService.landscrapers.map((id, index) => (
                        <Chip key={index} label={`ID: ${id.slice(-6)}`} size="small" variant="outlined" />
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">No landscrapers assigned yet.</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, p: 2 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Service?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            Are you sure you want to delete <strong>{serviceToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={formLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 3 }}
          >
            {formLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}
