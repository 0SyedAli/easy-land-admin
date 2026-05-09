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
  TablePagination,
  Button,
  DialogActions,
  DialogContentText
} from '@mui/material';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  status: string;
  profile: string;
  createdAt: string;
  location: {
    address: string;
  };
  totalJobs: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('user/all');
      if (response.data && response.data.users) {
        setUsers(response.data.users);
        setTotalUsers(response.data.pagination?.total || response.data.users.length);
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleToggleStatus = async (event: React.ChangeEvent<HTMLInputElement>, user: User) => {
    event.stopPropagation(); // Prevent opening the modal
    const newStatus = event.target.checked ? 'active' : 'blocked';

    try {
      // Optimistic update
      setUsers((prevUsers) =>
        prevUsers.map((u) => u._id === user._id ? { ...u, status: newStatus } : u)
      );

      await api.patch(`user/status/${user._id}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update user status.');
      // Revert on failure
      setUsers(prevUsers =>
        prevUsers.map((u) => u._id === user._id ? { ...u, status: user.status } : u)
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!userIdToDelete) return;

    try {
      setLoading(true);
      await api.delete(`user/admin/${userIdToDelete}`);
      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userIdToDelete));
      setTotalUsers((prev) => prev - 1);
      setDeleteDialogOpen(false);
      setUserIdToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (event: React.MouseEvent, userId: string) => {
    event.stopPropagation();
    setUserIdToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    (user.location?.address && user.location.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Users</h1>
          <p className="text-gray-500">Manage Registered Users</p>
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
            <h2 className="text-xl font-bold text-gray-800">User Management</h2>
            <p className="text-gray-500 text-sm">Manage all registered users on the platform</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg font-medium text-gray-700">
            {totalUsers} Total Users
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
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Contact</th>
                    <th className="pb-3 font-semibold">Address</th>
                    <th className="pb-3 font-semibold">Land Type</th>
                    <th className="pb-3 font-semibold">Bookings</th>
                    <th className="pb-3 font-semibold">Join Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <td className="py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-400 flex items-center justify-center text-white font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </td>
                      <td className="py-4 text-gray-600 text-sm">{user.phone || '-'}</td>
                      <td className="py-4 text-gray-600 text-sm max-w-[200px] truncate" title={user.location?.address}>
                        {user.location?.address || '-'}
                      </td>
                      <td className="py-4 text-gray-600 text-sm capitalize">{user.property || '-'}</td>
                      <td className="py-4 text-gray-600 text-sm">{user.totalJobs}</td>
                      <td className="py-4 text-gray-600 text-sm">
                        {new Date(user.createdAt).toLocaleDateString('en-CA')}
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${user.status === 'active' ? 'bg-[#0f172a]' : 'bg-red-500'
                          }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Switch
                            checked={user.status === 'active'}
                            onChange={(e) => handleToggleStatus(e, user)}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#2f6f1f',
                                '& + .MuiSwitch-track': {
                                  backgroundColor: '#2f6f1f',
                                },
                              },
                            }}
                          />
                          <IconButton
                            onClick={(e) => openDeleteDialog(e, user._id)}
                            sx={{ color: '#ef4444', ml: 1 }}
                          >
                            <DeleteOutlineOutlined />
                          </IconButton>
                        </Box>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredUsers.length > 10 && (
              <TablePagination
                component="div"
                count={filteredUsers.length}
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

      {/* User Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }
          }
        }}
      >
        <DialogTitle sx={{ px: 4, pt: 4, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '800', color: '#1e293b' }}>User Details</Typography>
            <Typography variant="body2" sx={{ color: 'textSecondary' }}>Complete user information</Typography>
          </Box>
          <IconButton onClick={() => setModalOpen(false)} size="small" sx={{ color: 'gray.400' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 4 }}>
          {selectedUser && (
            <Box>
              {/* Profile Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 4 }}>
                <Box className="w-18 h-18 rounded-xl bg-gradient-to-br from-[#2ECC71] to-[#3498DB] flex items-center justify-center text-white font-bold text-4xl border-4 border-white">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b', mb: 0.5 }}>
                    {selectedUser.name}
                  </Typography>
                  <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#0f172a] text-white uppercase tracking-wider">
                    {selectedUser.status}
                  </span>
                </Box>
              </Box>

              {/* Information Grid */}
              <Grid container spacing={4}>
                <Grid xs={6}>
                  <Typography variant="caption" fontWeight="bold" color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Phone</Typography>
                  <Typography variant="body1" fontWeight="600" color="#334155">{selectedUser.phone || 'N/A'}</Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="caption" fontWeight="bold" color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Land Type</Typography>
                  <Typography variant="body1" fontWeight="600" color="#334155" sx={{ textTransform: 'capitalize' }}>{selectedUser.property || 'N/A'}</Typography>
                </Grid>

                <Grid xs={12}>
                  <Typography variant="caption" fontWeight="bold" color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Address</Typography>
                  <Typography variant="body1" fontWeight="600" color="#334155">{selectedUser.location?.address || 'N/A'}</Typography>
                </Grid>

                <Grid xs={6}>
                  <Typography variant="caption" fontWeight="bold" color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Total Bookings</Typography>
                  <Typography variant="body1" fontWeight="600" color="#334155">{selectedUser.totalJobs || 0}</Typography>
                </Grid>
                <Grid xs={6}>
                  <Typography variant="caption" fontWeight="bold" color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Join Date</Typography>
                  <Typography variant="body1" fontWeight="600" color="#334155">
                    {new Date(selectedUser.createdAt).toISOString().split('T')[0]}
                  </Typography>
                </Grid>

                <Grid xs={12}>
                  <Typography variant="caption" fontWeight="bold" color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Location</Typography>
                  <Typography variant="body1" fontWeight="600" color="#334155">
                    {/* Mock coordinates if not available to match design */}
                    30.2672, -97.7431
                  </Typography>
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
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'gray' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
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
    </div>
  );
}
