'use client';

import React, { useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import api from '@/lib/api';
import People from '@mui/icons-material/People';
import AttachMoney from '@mui/icons-material/AttachMoney';
import TrendingUp from '@mui/icons-material/TrendingUp';
import EventNote from '@mui/icons-material/EventNote';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface StatChange {
    value: number;
    type: string;
    period: string;
}

interface StatDetail {
    value: number;
    change: StatChange;
}

interface DashboardStats {
    totalUsers: StatDetail;
    activeProviders: StatDetail;
    totalBookings: StatDetail;
    revenueMtd: StatDetail;
}

interface ServiceDistributionItem {
    serviceId: string | null;
    name: string;
    bookings: number;
    percentage: number;
    color?: string;
}

interface PerformanceStats {
    growthRate: StatDetail;
    averageOrderValue: StatDetail;
    activeUsers: StatDetail;
    completionRate: StatDetail;
}

// StatCard (matches dashboard style)
const StatCard = ({ title, value, change, icon, iconBgColor }: { title: string; value: string | number; change: StatChange; icon: React.ReactNode; iconBgColor: string }) => {
    const isNegative = change.value < 0;
    const absValue = Math.abs(change.value);
    const formattedChange = change.type === 'percentage' ? `${absValue}%` : absValue;

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-gray-500 text-sm font-medium tracking-wide">{title}</span>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">{value}</h3>
                </div>
                <div className={`w-12 h-12 ${iconBgColor} rounded-2xl flex items-center justify-center text-white shadow-sm`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
                <span className={`text-sm font-bold flex items-center gap-0.5 ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                    {isNegative ? '↓' : '↑'} {isNegative ? '' : '+'}{formattedChange}
                </span>
                <span className="text-gray-400 text-xs ml-1 font-medium">{change.period}</span>
            </div>
        </div>
    );
};

// Dashboard-like Card skeleton
const CardSkeleton = () => (
    <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs flex flex-col justify-between h-[160px] animate-pulse">
        <div className="flex justify-between items-start">
            <div className="space-y-3 w-2/3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
    </div>
);

const sparklinePath = (values: number[], w = 300, h = 80) => {
    if (!values || values.length === 0) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const len = values.length;
    const points = values.map((v, i) => {
        const x = (i / (len - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return `${x},${y}`;
    });
    return points.join(' ');
};

export default function Analytics() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [services, setServices] = useState<ServiceDistributionItem[]>([]);
    const [performance, setPerformance] = useState<PerformanceStats | null>(null);
    const [revenueTrend, setRevenueTrend] = useState<number[]>([]);
    const [revenueLabels, setRevenueLabels] = useState<string[]>([]);
    const [bookingsVsUsers, setBookingsVsUsers] = useState<{ bookings: number[]; users: number[] }>({ bookings: [], users: [] });
    const [bvLabels, setBvLabels] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const controller = new AbortController();
        const fetchAll = async () => {
            try {
                setLoading(true);
                setError('');

                const [statsRes, servicesRes, revenueRes, bvUsersRes, perfRes] = await Promise.all([
                    api.get('analytics/dashboard', { signal: controller.signal }),
                    api.get('analytics/service-distribution', { signal: controller.signal }),
                    api.get('analytics/weekly-revenue-trend', { signal: controller.signal }).catch(() => ({ data: null })),
                    api.get('analytics/weekly-bookings-vs-users', { signal: controller.signal }).catch(() => ({ data: null })),
                    api.get('analytics/performance', { signal: controller.signal }).catch(() => ({ data: null })),
                ]);

                if (statsRes.data?.success && statsRes.data?.stats) setStats(statsRes.data.stats);
                if (servicesRes.data?.success && servicesRes.data?.services) setServices(servicesRes.data.services);

                if (revenueRes.data?.success && Array.isArray(revenueRes.data?.data)) {
                    setRevenueTrend(revenueRes.data.data.map((d: any) => Number(d.revenue || 0)));
                    setRevenueLabels(revenueRes.data.data.map((d: any) => d.day || d.date || ''));
                } else if (revenueRes.data && Array.isArray(revenueRes.data)) {
                    setRevenueTrend(revenueRes.data.map((d: any) => Number(d.revenue || 0)));
                    setRevenueLabels(revenueRes.data.map((d: any) => d.day || d.date || ''));
                }

                if (bvUsersRes.data?.success && Array.isArray(bvUsersRes.data?.data)) {
                    const bookings = bvUsersRes.data.data.map((d: any) => Number(d.bookings || 0));
                    const users = bvUsersRes.data.data.map((d: any) => Number((d.newUsers !== undefined ? d.newUsers : d.users) || 0));
                    setBookingsVsUsers({ bookings, users });
                    setBvLabels(bvUsersRes.data.data.map((d: any) => d.day || d.date || ''));
                } else if (bvUsersRes.data && Array.isArray(bvUsersRes.data)) {
                    const bookings = bvUsersRes.data.map((d: any) => Number(d.bookings || 0));
                    const users = bvUsersRes.data.map((d: any) => Number((d.newUsers !== undefined ? d.newUsers : d.users) || 0));
                    setBookingsVsUsers({ bookings, users });
                    setBvLabels(bvUsersRes.data.map((d: any) => d.day || d.date || ''));
                }

                if (perfRes.data?.success && perfRes.data?.stats) {
                    setPerformance(perfRes.data.stats);
                }
            } catch (err: any) {
                if (err.name === 'CanceledError' || err.name === 'AbortError') return;
                console.error('Analytics fetch error', err);
                setError(err.response?.data?.message || err.message || 'Failed to load analytics.');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        return () => controller.abort();
    }, []);

    const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

    // Mock summary values (used when specific APIs are not available)
    const mockServiceRevenueTotal = 68240;
    const mockPlatformFees = 12450;
    const mockProviderEarnings = 55790;

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-sm text-gray-500">Overview of platform performance</p>
                </div>
            </div>

            {error && <Alert severity="error" className="rounded-2xl">{error}</Alert>}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {loading ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Growth Rate"
                            value={performance ? `${performance.growthRate.value}${performance.growthRate.change.type === 'percentage' ? '%' : ''}` : '—'}
                            change={performance ? performance.growthRate.change : { value: 0, type: 'number', period: '' }}
                            icon={<TrendingUp fontSize="medium" />}
                            iconBgColor="bg-emerald-500"
                        />
                        <StatCard
                            title="Avg Order Value"
                            value={performance ? formatCurrency(performance.averageOrderValue.value) : '—'}
                            change={performance ? performance.averageOrderValue.change : { value: 0, type: 'currency', period: '' }}
                            icon={<AttachMoney fontSize="medium" />}
                            iconBgColor="bg-blue-500"
                        />
                        <StatCard
                            title="Active Users"
                            value={performance ? `${performance.activeUsers.value}` : (stats ? `${stats.totalUsers.value}` : '—')}
                            change={performance ? performance.activeUsers.change : (stats ? stats.totalUsers.change : { value: 0, type: 'number', period: '' })}
                            icon={<People fontSize="medium" />}
                            iconBgColor="bg-purple-500"
                        />
                        <StatCard
                            title="Completion Rate"
                            value={performance ? `${performance.completionRate.value}%` : '—'}
                            change={performance ? performance.completionRate.change : { value: 0, type: 'percentage', period: '' }}
                            icon={<EventNote fontSize="medium" />}
                            iconBgColor="bg-orange-500"
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border p-6 min-h-[300px] border-gray-100/80 shadow-xs">
                    <h3 className="font-bold text-gray-900">Weekly Revenue Trend</h3>
                    <p className="text-sm text-gray-500 mt-1">Daily revenue over the past week</p>
                    <div className="mt-4">
                        {loading ? (
                            <div className="h-[350px] animate-pulse bg-gray-100 rounded" />
                        ) : revenueTrend.length > 0 ? (
                            <div className="h-[350px]">
                                <Line
                                    data={{
                                        labels: revenueLabels.length ? revenueLabels : revenueTrend.map((_, i) => `Day ${i + 1}`),
                                        datasets: [
                                            {
                                                label: 'Revenue',
                                                data: revenueTrend,
                                                fill: true,
                                                backgroundColor: 'rgba(16,185,129,0.15)',
                                                borderColor: '#10b981',
                                                pointRadius: 3,
                                                // 👇 makes line rounded/smooth
                                                tension: 0.4,
                                            },
                                        ],
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: { y: { beginAtZero: true } },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-gray-500 py-10">No revenue trend data available</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border p-6 min-h-[300px] border-gray-100/80 shadow-xs">
                    <h3 className="font-bold text-gray-900">Bookings vs New Users</h3>
                    <p className="text-sm text-gray-500 mt-1">Weekly comparison</p>
                    <div className="mt-4">
                        {loading ? (
                            <div className="h-[350px] animate-pulse bg-gray-100 rounded" />
                        ) : (bookingsVsUsers.bookings.length > 0 || bookingsVsUsers.users.length > 0) ? (
                            <div className="h-[350px]">
                                <Bar
                                    data={{
                                        labels: bvLabels.length ? bvLabels : bookingsVsUsers.bookings.map((_, i) => `Day ${i + 1}`),
                                        datasets: [
                                            {
                                                label: 'Bookings',
                                                data: bookingsVsUsers.bookings,
                                                backgroundColor: '#3b82f6',
                                            },
                                            {
                                                label: 'New Users',
                                                data: bookingsVsUsers.users,
                                                backgroundColor: '#8b5cf6',
                                            },
                                        ],
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'top' } },
                                        scales: { y: { beginAtZero: true } },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-gray-500 py-10">No comparison data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border p-6">
                    <h3 className="font-bold text-gray-900">Service Revenue</h3>
                    <p className="text-sm text-gray-500 mt-1">Total service revenue</p>
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{formatCurrency(mockServiceRevenueTotal)}</div>
                            <div className="text-sm text-gray-500 mt-1">Lawn Mowing, Tree Trimming, Cleaning</div>
                        </div>
                        <div className="text-sm font-bold text-emerald-600">{services.length} services</div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Lawn Mowing</span>
                            <span className="text-emerald-600 font-semibold">{formatCurrency(23800)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Tree Trimming</span>
                            <span className="text-emerald-600 font-semibold">{formatCurrency(18600)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Cleaning</span>
                            <span className="text-emerald-600 font-semibold">{formatCurrency(15200)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border p-6">
                    <h3 className="font-bold text-gray-900">Platform Fees</h3>
                    <p className="text-sm text-gray-500 mt-1">Service fee (estimate)</p>
                    <div className="mt-4">
                        <div className="text-2xl font-bold">{formatCurrency(mockPlatformFees)}</div>
                        <div className="text-sm text-gray-500 mt-1">Estimated at 15% of service revenue</div>
                        <div className="text-emerald-600 font-semibold mt-2">{formatCurrency(Math.round(mockServiceRevenueTotal * 0.15))}</div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border p-6">
                    <h3 className="font-bold text-gray-900">Provider Earnings</h3>
                    <p className="text-sm text-gray-500 mt-1">Total provider payouts (estimate)</p>
                    <div className="mt-4">
                        <div className="text-2xl font-bold">{formatCurrency(mockProviderEarnings)}</div>
                        <div className="text-sm text-gray-500 mt-1">Avg per job: {formatCurrency(142)}</div>
                        <div className="text-sm text-gray-500">Active Providers: 127</div>
                    </div>
                </div>
            </div> */}

            <div className="bg-white rounded-3xl border p-6 border-gray-100/80 shadow-xs">
                <h3 className="font-bold text-gray-900">Service Revenue Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {loading ? (
                        <>
                            <CardSkeleton />
                            <CardSkeleton />
                            <CardSkeleton />
                        </>
                    ) : services.length > 0 ? (
                        services.map((s) => (
                            <div key={s.serviceId || s.name} className="p-4 bg-gray-50 rounded">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-gray-600">{s.name}</div>
                                        <div className="text-xs text-gray-400">{s.bookings} bookings</div>
                                    </div>
                                    <div className="text-sm font-bold">{s.percentage}%</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500 p-4">No service distribution data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}