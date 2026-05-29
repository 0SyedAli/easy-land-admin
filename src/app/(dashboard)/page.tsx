'use client';

import React, { useEffect, useState } from 'react';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import People from '@mui/icons-material/People';
import BusinessCenter from '@mui/icons-material/BusinessCenter';
import EventNote from '@mui/icons-material/EventNote';
import AttachMoney from '@mui/icons-material/AttachMoney';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Star from '@mui/icons-material/Star';
import { IconButton, Alert } from '@mui/material';
import api from '@/lib/api';

// Interfaces for Dashboard stats API
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
  activeJobs: StatDetail;
  averageRating: StatDetail;
}

// Interfaces for Service Distribution API
interface ServiceDistributionItem {
  serviceId: string | null;
  name: string;
  bookings: number;
  percentage: number;
  color: string;
}

// Interfaces for Activity Log API
interface ActivityLog {
  _id: string;
  user: string;
  userModel: string;
  name: string;
  action: string;
  description: string;
  type: string;
  ipAddress: string;
  resourceId: string;
  resourceModel: string;
  metadata?: {
    providerId?: string;
    serviceId?: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Helper to draw SVG Pie slices
const getPieSlicePath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  if (endAngle - startAngle >= 359.9) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

// Sub-components
interface StatCardProps {
  title: string;
  value: string | number;
  change: StatChange;
  icon: React.ReactNode;
  iconBgColor: string;
}

const StatCard = ({ title, value, change, icon, iconBgColor }: StatCardProps) => {
  const isNegative = change.value < 0;
  const isZero = change.value === 0;
  const absValue = Math.abs(change.value);
  const formattedValue = change.type === 'percentage' ? `${absValue}%` : absValue;

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
          {isNegative ? '↓' : '↑'} {isNegative ? '' : '+'}{formattedValue}
        </span>
        <span className="text-gray-400 text-xs ml-1 font-medium">{change.period}</span>
      </div>
    </div>
  );
};

// Skeletons
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

const ServiceSkeleton = () => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col h-[520px] animate-pulse">
    <div className="space-y-2 mb-6">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-6">
      <div className="h-5 bg-gray-200 rounded"></div>
      <div className="h-5 bg-gray-200 rounded"></div>
      <div className="h-5 bg-gray-200 rounded"></div>
      <div className="h-5 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ActivitySkeleton = () => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col h-[520px] animate-pulse">
    <div className="space-y-2 mb-6">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="space-y-6 flex-1">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex justify-between items-center py-1">
          <div className="flex gap-4 items-center w-2/3">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  </div>
);

// Service Distribution Chart
const ServiceDistributionChart = ({ services }: { services: ServiceDistributionItem[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    name: string;
    bookings: number;
    percentage: number;
    color: string;
    x: number;
    y: number;
  } | null>(null);

  const activeServices = services.filter((s) => s.percentage > 0);

  if (activeServices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
        <p className="text-sm font-medium">No service distribution data available</p>
      </div>
    );
  }

  let cumulativeAngle = 0;

  const slices = activeServices.map((service, index) => {
    const angle = (service.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle  = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const midAngle = startAngle + angle / 2;
    const rad = ((midAngle - 90) * Math.PI) / 180;

    const labelR = 115;
    const tx = 200 + labelR * Math.cos(rad);
    const ty = 140 + labelR * Math.sin(rad);

    const isHovered = hoveredIndex === index;
    const shiftR = 6;
    const dx = isHovered ? shiftR * Math.cos(rad) : 0;
    const dy = isHovered ? shiftR * Math.sin(rad) : 0;

    const pathData = getPieSlicePath(200, 140, 80, startAngle, endAngle);
    const textAnchor: 'start' | 'end' = Math.cos(rad) > 0 ? 'start' : 'end';

    return {
      service,
      index,
      pathData,
      color: service.color || '#cccccc',
      dx,
      dy,
      tx,
      ty,
      textAnchor,
    };
  });

  const handleMouseMove = (e: React.MouseEvent, slice: any) => {
    const container = e.currentTarget.closest('.chart-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltip({
        show: true,
        name: slice.service.name,
        bookings: slice.service.bookings,
        percentage: slice.service.percentage,
        color: slice.color,
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top - 15,
      });
    }
  };

  return (
    <div className="relative chart-container flex flex-col flex-1 justify-between h-[380px]">
      <div className="relative flex justify-center items-center h-[260px]">
        <svg className="w-full h-full" viewBox="0 0 400 280">
          <g>
            {slices.map((slice) => (
              <g
                key={slice.index}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setTooltip(null);
                }}
                onMouseMove={(e) => handleMouseMove(e, slice)}
                style={{
                  transform: `translate(${slice.dx}px, ${slice.dy}px)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <path
                  d={slice.pathData}
                  fill={slice.color}
                  className="opacity-90 hover:opacity-100 transition-opacity duration-200"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <text
                  x={slice.tx}
                  y={slice.ty}
                  textAnchor={slice.textAnchor}
                  fill={slice.color}
                  className="text-[11px] font-bold tracking-wide"
                  dominantBaseline="middle"
                >
                  {slice.service.name}: {slice.service.percentage}%
                </text>
              </g>
            ))}
          </g>
        </svg>

        {tooltip && (
          <div
            className="absolute z-10 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl text-[11px] flex flex-col pointer-events-none border border-white/10"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tooltip.color }}></span>
              <span>{tooltip.name}</span>
            </div>
            <div className="text-gray-300 font-medium">Bookings: <span className="text-white font-semibold">{tooltip.bookings}</span></div>
            <div className="text-gray-300 font-medium">Percentage: <span className="text-white font-semibold">{tooltip.percentage}%</span></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-gray-100 pt-4 mt-2">
        {activeServices.map((service, index) => (
          <div key={index} className="flex items-center gap-3 text-sm">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: service.color || '#cccccc' }}
            ></span>
            <span className="text-gray-600 font-medium truncate">{service.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recent Activity List (Mock Data matching layout)
const mockActivities = [
  {
    id: 1,
    title: 'New booking created',
    subtitle: 'John Doe',
    time: '5 min ago',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 2,
    title: 'Provider approved',
    subtitle: 'Mike Smith',
    time: '15 min ago',
    dotColor: 'bg-blue-500'
  },
  {
    id: 3,
    title: 'Job completed',
    subtitle: 'Sarah Johnson',
    time: '32 min ago',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 4,
    title: 'Payment received',
    subtitle: 'Tom Wilson',
    time: '1 hour ago',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 5,
    title: 'New user registered',
    subtitle: 'Emily Brown',
    time: '2 hours ago',
    dotColor: 'bg-blue-500'
  },
  {
    id: 6,
    title: 'Review submitted',
    subtitle: 'David Lee',
    time: '3 hours ago',
    dotColor: 'bg-emerald-500'
  }
];

// Helper function to calculate relative time
const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Helper function to get dot color based on activity type
const getDotColorByType = (type: string): string => {
  const typeColorMap: Record<string, string> = {
    'Booking': 'bg-emerald-500',
    'User': 'bg-blue-500',
    'Provider': 'bg-purple-500',
    'Payment': 'bg-green-500',
    'Review': 'bg-amber-500',
  };
  return typeColorMap[type] || 'bg-gray-500';
};

const RecentActivityList = ({ activities = [] }: { activities?: ActivityLog[] }) => {
  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="divide-y divide-gray-100 flex-1 max-h-[400px] overflow-y-auto pe-2">
        {(activities.length > 0
          ? activities.map((act) => (
            <div key={act._id} className="flex justify-between items-center py-3.5 first:pt-1 last:pb-1">
              <div className="flex gap-4 items-start">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getDotColorByType(act.type)}`}></span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm tracking-wide">{act.action}</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{act.name}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium">{getRelativeTime(act.createdAt)}</span>
            </div>
          ))
          : mockActivities.map((act) => (
            <div key={act.id} className="flex justify-between items-center py-3.5 first:pt-1 last:pb-1">
              <div className="flex gap-4 items-start">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${act.dotColor}`}></span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm tracking-wide">{act.title}</h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{act.subtitle}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-medium">{act.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main Dashboard Page
export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<ServiceDistributionItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsRes, servicesRes, activitiesRes] = await Promise.all([
          api.get('analytics/dashboard'),
          api.get('analytics/service-distribution'),
          api.get('activity-log')
        ]);

        if (statsRes.data?.success && statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        } else {
          throw new Error(statsRes.data?.message || 'Failed to fetch dashboard stats.');
        }

        if (servicesRes.data?.success && servicesRes.data?.services) {
          setServices(servicesRes.data.services);
        } else {
          throw new Error(servicesRes.data?.message || 'Failed to fetch service distribution.');
        }

        if (activitiesRes.data?.success && activitiesRes.data?.logs) {
          setActivities(activitiesRes.data.logs);
        } else {
          throw new Error(activitiesRes.data?.message || 'Failed to fetch activity logs.');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || err.message || 'An error occurred while loading dashboard analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back, Alex 👋</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Hello User, Hope You Fine</p>
        </div>
        <IconButton className="bg-white border border-gray-200 shadow-xs rounded-full w-11 h-11 hover:bg-gray-50 transition-colors">
          <NotificationsNone className="text-gray-600" />
        </IconButton>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="rounded-2xl border border-red-100">
          {error}
        </Alert>
      )}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Users"
              value={formatNumber(stats.totalUsers.value)}
              change={stats.totalUsers.change}
              icon={<People fontSize="medium" />}
              iconBgColor="bg-blue-500"
            />
            <StatCard
              title="Active Providers"
              value={formatNumber(stats.activeProviders.value)}
              change={stats.activeProviders.change}
              icon={<BusinessCenter fontSize="medium" />}
              iconBgColor="bg-emerald-500"
            />
            <StatCard
              title="Total Bookings"
              value={formatNumber(stats.totalBookings.value)}
              change={stats.totalBookings.change}
              icon={<EventNote fontSize="medium" />}
              iconBgColor="bg-purple-500"
            />
            <StatCard
              title="Revenue (MTD)"
              value={formatCurrency(stats.revenueMtd.value)}
              change={stats.revenueMtd.change}
              icon={<AttachMoney fontSize="medium" />}
              iconBgColor="bg-orange-500"
            />
            <StatCard
              title="Active Jobs"
              value={formatNumber(stats.activeJobs.value)}
              change={stats.activeJobs.change}
              icon={<TrendingUp fontSize="medium" />}
              iconBgColor="bg-pink-500"
            />
            <StatCard
              title="Avg Rating"
              value={stats.averageRating.value.toFixed(1)}
              change={stats.averageRating.change}
              icon={<Star fontSize="medium" />}
              iconBgColor="bg-amber-500"
            />
          </>
        ) : null}
      </div>

      {/* Bottom Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Distribution Component */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col min-h-[500px] hover:shadow-xs transition-shadow duration-300">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Service Distribution</h3>
            <p className="text-gray-500 text-sm font-medium mt-0.5">Popular services by booking percentage</p>
          </div>
          <div className="flex-1 flex flex-col justify-center mt-6">
            {loading ? (
              <ServiceSkeleton />
            ) : (
              <ServiceDistributionChart services={services} />
            )}
          </div>
        </div>

        {/* Recent Activity Component */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col min-h-[500px] hover:shadow-xs transition-shadow duration-300">
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Recent Activity</h3>
            <p className="text-gray-500 text-sm font-medium mt-0.5">Latest system activities</p>
          </div>
          <div className="flex-1 flex flex-col justify-center mt-6">
            {loading ? (
              <ActivitySkeleton />
            ) : (
              <RecentActivityList activities={activities} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}