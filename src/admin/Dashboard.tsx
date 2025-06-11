import React, { useEffect, useState } from 'react';
import {
	Grid,
	Card,
	CardContent,
	Typography,
	Box,
	CircularProgress,
	Alert,
	Chip,
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Avatar,
	Paper,
	Container
} from '@mui/material';
import {
	TrendingUp as TrendingUpIcon,
	People as PeopleIcon,
	LibraryBooks as LibraryBooksIcon,
	Receipt as ReceiptIcon,
	AccountBalance as AccountBalanceIcon,
	Warning as WarningIcon,
	MonetizationOn as MonetizationOnIcon,
	Assignment as AssignmentIcon,
	Book as BookIcon,
	Error as ErrorIcon
} from '@mui/icons-material';
import { requestAdmin } from '../api/Request';
import { endpointBE } from '../layouts/utils/Constant';

// Interfaces for type safety
interface DashboardStatistics {
	totalRevenue: number;
	totalBorrowRecords: number;
	totalSuccessfulOrders: number;
	totalUsers: number;
	totalBooks: number;
	totalFines: number;
	totalViolationTypes: number;
}

interface TopBorrowedBook {
	idBook: number;
	nameBook: string;
	author: string;
	borrowQuantity: number;
	isbn: string;
}

interface CommonViolation {
	code: string;
	description: string;
	fine: number;
	count: number;
}

// Utility function to format currency
const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(amount);
};

// Utility function to format number
const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('vi-VN').format(num);
};

// Stat Card Component
interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	color: string;
	subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
	<Card
		elevation={3}
		sx={{
			height: '100%',
			background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
			border: `1px solid ${color}30`,
			transition: 'all 0.3s ease',
			'&:hover': {
				transform: 'translateY(-4px)',
				boxShadow: 6
			}
		}}
	>
		<CardContent>
			<Box display="flex" alignItems="center" justifyContent="space-between">
				<Box>
					<Typography color="textSecondary" gutterBottom variant="h6">
						{title}
					</Typography>
					<Typography variant="h4" component="div" fontWeight="bold" color={color}>
						{typeof value === 'number' ? formatNumber(value) : value}
					</Typography>
					{subtitle && (
						<Typography variant="body2" color="textSecondary">
							{subtitle}
						</Typography>
					)}
				</Box>
				<Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
					{icon}
				</Avatar>
			</Box>
		</CardContent>
	</Card>
);

const AdminDashboard: React.FC = () => {
	// State management
	const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch all dashboard data
	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			setError(null);

			// Fetch dashboard statistics
			const statsResponse = await requestAdmin(`${endpointBE}/statistics/dashboard`);
			setDashboardStats(statsResponse);


		} catch (err) {
			console.error('Error fetching dashboard data:', err);
			setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDashboardData();
	}, []);

	if (loading) {
		return (
			<Container maxWidth="xl" sx={{ py: 4 }}>
				<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
					<CircularProgress size={50} />
				</Box>
			</Container>
		);
	}

	if (error) {
		return (
			<Container maxWidth="xl" sx={{ py: 4 }}>
				<Alert severity="error" action={
					<button onClick={fetchDashboardData}>Thử lại</button>
				}>
					{error}
				</Alert>
			</Container>
		);
	}

	if (!dashboardStats) {
		return (
			<Container maxWidth="xl" sx={{ py: 4 }}>
				<Alert severity="warning">
					Không có dữ liệu để hiển thị
				</Alert>
			</Container>
		);
	}

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			{/* Page Header */}
			<Box mb={4}>
				<Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
					Dashboard Quản Trị
				</Typography>
				<Typography variant="body1" color="textSecondary">
					Tổng quan thống kê hệ thống thư viện
				</Typography>
			</Box>

			{/* Hàng đầu tiên - 3 card chính */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} sm={6} md={4}>
					<StatCard
						title="Tổng Doanh Thu"
						value={formatCurrency(dashboardStats.totalRevenue)}
						icon={<MonetizationOnIcon />}
						color="#4caf50"
						subtitle="Từ bán sách"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={4}>
					<StatCard
						title="Tổng Phiếu Mượn"
						value={dashboardStats.totalBorrowRecords}
						icon={<AssignmentIcon />}
						color="#2196f3"
						subtitle="Tất cả phiếu mượn"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={4}>
					<StatCard
						title="Tổng Hóa Đơn"
						value={dashboardStats.totalSuccessfulOrders}
						icon={<ReceiptIcon />}
						color="#ff9800"
						subtitle="Đơn hàng thành công"
					/>
				</Grid>
			</Grid>

			{/* Hàng thứ hai - 3 card phụ */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} sm={6} md={4}>
					<StatCard
						title="Tổng Tài Khoản"
						value={dashboardStats.totalUsers}
						icon={<PeopleIcon />}
						color="#9c27b0"
						subtitle="Người dùng đăng ký"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={4}>
					<StatCard
						title="Tổng Số Sách"
						value={dashboardStats.totalBooks}
						icon={<LibraryBooksIcon />}
						color="#607d8b"
						subtitle="Tất cả đầu sách"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={4}>
					<StatCard
						title="Tổng Tiền Phạt"
						value={formatCurrency(dashboardStats.totalFines)}
						icon={<AccountBalanceIcon />}
						color="#f44336"
						subtitle="Phí phạt thu được"
					/>
				</Grid>
			</Grid>
		</Container>
	);
};

export default AdminDashboard;