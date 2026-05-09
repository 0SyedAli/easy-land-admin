'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, CircularProgress, Alert, InputAdornment, IconButton } from '@mui/material';
import ForestIcon from '@mui/icons-material/Forest';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('auth/signin', { email, password });

      const token = response.data.token || response.data.data?.token || 'dummy_token_if_none_provided';
      Cookies.set('token', token, { expires: 7 });
      localStorage.setItem('token', token);

      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 bg-[url('https://images.unsplash.com/photo-1558904541-efa843a96f09?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      {/* Overlay to dim the background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative z-10 flex w-full max-w-5xl bg-white/95 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden m-4 border border-white/20">

        {/* Left Side - Theme color with gradient */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-[#2E6B20] to-[#153A0B] p-12 flex-col justify-between items-start text-white relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#a1f086]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

          <div className="relative z-10 w-full">
            {/* <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl inline-flex items-center gap-3 mb-12 shadow-lg">
              <ForestIcon fontSize="large" className="text-[#a1f086]" />
              <span className="text-white font-black tracking-widest text-2xl pr-2">EASY LAND</span>
            </div> */}
            <Image src="/logo.png" alt="Logo" width={250} height={100} />

            <h1 className="text-4xl font-extrabold mt-6 mb-4 leading-tight">Admin<br />Dashboard</h1>
            <p className="text-green-50 text-lg leading-relaxed font-light">
              Manage your entire landscaping empire. Oversee providers, users, and track real-time bookings from a centralized control center.
            </p>
          </div>

          <div className="relative z-10 w-full text-sm text-green-200/60 flex justify-between items-center font-medium mt-6">
            <span>© 2026 Easy Land Maintenance</span>
            {/* <span>Version 2.0</span> */}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-7/12 p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10 md:hidden flex justify-center">
            <div className="bg-[#2E6B20]/10 p-3 rounded-2xl flex items-center gap-2">
              <ForestIcon className="text-[#2E6B20]" />
              <span className="text-[#2E6B20] font-black tracking-widest text-xl">EASY LAND</span>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Login Dashboard</h2>
            <p className="text-gray-500 mb-10 text-lg">Enter your admin credentials to continue.</p>

            {error && (
              <Alert severity="error" className="mb-6 rounded-xl font-medium" sx={{ border: '1px solid #fca5a5' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 3,
                      bgcolor: '#f9fafb',
                      '& input:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 100px #f9fafb inset',
                        WebkitTextFillColor: '#000',
                        borderRadius: 'inherit',
                      },
                    }
                  },
                  inputLabel: {
                    shrink: true
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#2E6B20',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#2E6B20',
                    fontWeight: 'bold'
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 3,
                      bgcolor: '#f9fafb',
                      '& input:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 100px #f9fafb inset',
                        WebkitTextFillColor: '#000',
                        borderRadius: 'inherit',
                      },
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  },
                  inputLabel: {
                    shrink: true
                  }
                }}
                sx={{
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#2E6B20',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#2E6B20',
                    fontWeight: 'bold'
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: '#2E6B20',
                  py: 1.8,
                  mt: 2,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: '0 10px 25px -5px rgba(46, 107, 32, 0.4)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#1a4012',
                    boxShadow: '0 15px 30px -5px rgba(46, 107, 32, 0.5)',
                    transform: 'translateY(-2px)'
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>

            {/* <div className="mt-8 text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="font-semibold text-gray-700 mb-1">Demo Credentials</p>
              <p className="font-mono text-gray-600 bg-white px-2 py-1 rounded border inline-block">user@yopmail.com</p>
              <span className="mx-2">/</span>
              <p className="font-mono text-gray-600 bg-white px-2 py-1 rounded border inline-block">Samad_007</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
