'use client';

import React, { useEffect, useState } from 'react';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import Search from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
  TablePagination,
  Menu,
  MenuItem,
  Chip,
  Avatar
} from '@mui/material';
import api from '@/lib/api';

interface Booking {
  _id: string;
  service: {
    name: string;
    price: number;
    category: { name: string };
    icon: string;
  };
  customer: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    property: string;
    location: { address: string; coordinates: [number, number] };
  };
  provider: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profile: string;
    averageRating: number;
    totalReviews: number;
    location: { address: string };
  };
  scheduledAt: string;
  status: string;
  amount: number;
  createdAt: string;
  location: { address: string; coordinates: [number, number] };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    revenue: 0
  });

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBooking, setMenuBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const query = `appointment?page=${page + 1}&limit=${rowsPerPage}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;
      const response = await api.get(query);
      if (response.data && response.data.appointments) {
        setBookings(response.data.appointments);
        setTotalBookings(response.data.pagination?.total || response.data.appointments.length);

        // Mocking stats for demonstration as the API might not provide them directly in this endpoint
        setStats({
          total: response.data.pagination?.total || 5,
          confirmed: 2,
          inProgress: 1,
          completed: 2,
          revenue: 630
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, rowsPerPage, statusFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, booking: Booking) => {
    setAnchorEl(event.currentTarget);
    setMenuBooking(booking);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuBooking(null);
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingModalOpen(true);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return '#3B82F6';
      case 'in_progress': return '#F97316';
      case 'completed': return '#22C55E';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] ">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Bookings</h1>
          <p className="text-gray-500">Manage All Bookings</p>
        </div>
        <IconButton className="bg-white border border-gray-200 shadow-sm rounded-full w-10 h-10">
          <NotificationsNone className="text-gray-600" />
        </IconButton>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { label: 'Total Bookings', value: stats.total, color: 'text-gray-900' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-500' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-orange-500' },
          { label: 'Completed', value: stats.completed, color: 'text-green-500' },
          { label: 'Total Revenue', value: `$${stats.revenue}`, color: 'text-green-600' },
        ].map((stat, i) => (
          <Grid size={{ xl: "grow", lg: 3, sm: 6 }} key={i}>
            <Box className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <Typography variant="body2" color="textSecondary" fontWeight="500" sx={{ mb: 1 }}>{stat.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }} className={stat.color}>{stat.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
        {/* Container Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Booking Management</h2>
          <p className="text-gray-500 text-sm">View and manage all service bookings</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6f1f]/20 focus:border-[#2f6f1f] transition-all"
              placeholder="Search by booking ID, user, provider, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6f1f]/20 focus:border-[#2f6f1f] text-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
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
                  <tr className="border-b border-gray-100 text-sm text-gray-400">
                    <th className="pb-4 font-semibold px-2">Booking ID</th>
                    <th className="pb-4 font-semibold px-2">Customer</th>
                    <th className="pb-4 font-semibold px-2">Provider</th>
                    <th className="pb-4 font-semibold px-2">Service</th>
                    <th className="pb-4 font-semibold px-2">Schedule</th>
                    <th className="pb-4 font-semibold px-2">Amount</th>
                    <th className="pb-4 font-semibold px-2">Status</th>
                    <th className="pb-4 font-semibold px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-2 text-sm text-gray-600 font-medium">
                        job-{booking._id.slice(-4)}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{booking.customer?.name}</span>
                          <span className="text-xs text-gray-400">{booking.customer?.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={booking.provider?.profile}
                            sx={{ width: 32, height: 32 }}
                          >
                            {booking.provider?.name?.charAt(0)}
                          </Avatar>
                          <span className="text-sm font-medium text-gray-700">{booking.provider?.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-700">{booking.service?.name}</td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-gray-700">
                            {new Date(booking.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-gray-400">
                            {new Date(booking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm font-bold text-gray-800">${booking.amount || booking.service?.price}</td>
                      <td className="py-4 px-2">
                        <span
                          className="px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <button
                          onClick={() => handleViewBooking(booking)}
                          className="px-4 py-1 rounded-lg text-xs font-semibold text-black uppercase tracking-wider bg-primary border border-[#4f6f2f] hover:bg-gray-[700] cursor-pointer">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              component="div"
              count={totalBookings}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      <Dialog
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 4, bgcolor: 'white' } }
        }}
      >
        <DialogTitle sx={{ px: 4, pt: 4, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b' }}>Booking Details</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Complete booking information</Typography>
          </Box>
          <IconButton onClick={() => setBookingModalOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 4 }}>
          {selectedBooking && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                {/* <Box>
                  <Typography variant="caption" fontWeight="bold" color="#94a3b8" sx={{ textTransform: 'uppercase' }}>Booking ID</Typography>
                  <Typography variant="h6" fontWeight="700" color="#334155">job-{selectedBooking._id}</Typography>
                </Box> */}
                <span
                  className="px-4 py-1.5 mt-3 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: getStatusColor(selectedBooking.status) }}
                >
                  {formatStatus(selectedBooking.status)}
                </span>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ sm: 6 }}>
                  <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #f1f5f9', bgcolor: '#fff', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: "700" }} color="#64748b">Customer Information</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "500" }}>{selectedBooking.customer?.name}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">Phone</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "500" }}>{selectedBooking.customer?.phone}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "500" }}>{selectedBooking.customer?.location?.address}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ sm: 6 }}>
                  <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #f1f5f9', bgcolor: '#fff', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: "700" }} color="#64748b">Provider Information</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={selectedBooking.provider?.profile} sx={{ width: 48, height: 48 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="700">{selectedBooking.provider?.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                          <span className="text-xs mr-1">★</span>
                          <Typography variant="caption" fontWeight="bold">4.9 • 203 jobs</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Distance</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "500" }}>1.8 miles</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid xs={12}>
                  <Box sx={{ p: 3, borderRadius: 4, border: '1px solid #f1f5f9', bgcolor: '#fff' }}>
                    <Typography variant="body2" color="#64748b" sx={{ mb: 3, fontWeight: "700" }}>Service Details</Typography>
                    <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                      <Grid xs={4}>
                        <Typography variant="caption" color="textSecondary">Service Type</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "500" }}>{selectedBooking.service?.name}</Typography>
                      </Grid>
                      <Grid xs={4}>
                        <Typography variant="caption" color="textSecondary">Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "500" }}>
                          {new Date(selectedBooking.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </Grid>
                      <Grid xs={4}>
                        <Typography variant="caption" color="textSecondary">Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "500" }}>
                          {new Date(selectedBooking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Grid>
                      <Grid xs={4}>
                        <Typography variant="caption" color="textSecondary">Amount</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "500", color: "#22C55E" }}>
                          ${selectedBooking.amount || selectedBooking.service?.price}
                        </Typography>
                      </Grid>
                      <Grid xs={8}>
                        <Typography variant="caption" color="textSecondary">Location</Typography>
                        <Typography variant="body2" sx={{ fontWeight: "500" }}>30.2775, -97.7403</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Row Action Menu */}
      {/* <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem MenuItem>
        <MenuItem onClick={handleMenuClose}>Update Status</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'red' }}>Cancel Booking</MenuItem>
      </Menu> */}
    </div>
  );
}
