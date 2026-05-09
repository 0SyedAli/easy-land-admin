'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { ErrorOutlineOutlined } from '@mui/icons-material';

export default function SessionExpiredModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleSessionExpired = () => {
      setOpen(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const handleLogin = () => {
    setOpen(false);
    router.push('/login');
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 4, p: 2 }
        }
      }}
    >
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pt: 4 }}>
        <Box sx={{ bgcolor: '#fee2e2', p: 2, borderRadius: '50%', mb: 3 }}>
          <ErrorOutlineOutlined sx={{ fontSize: 48, color: '#ef4444' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#111827' }}>
          Session Expired
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280', mb: 3 }}>
          Your session has expired. Please login again to continue.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleLogin}
          sx={{
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' },
            borderRadius: '12px',
            textTransform: 'none',
            py: 1.5,
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          Login Again
        </Button>
      </DialogActions>
    </Dialog>
  );
}
