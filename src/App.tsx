/* eslint-disable jsx-a11y/anchor-is-valid */
import {BrowserRouter, Navigate, Route, Routes, useLocation} from "react-router-dom";
import "./App.css";
import Navbar from "./layouts/header-footer/Navbar";
import Footer from "./layouts/header-footer/Footer";
import HomePage from "./layouts/pages/HomePage";
import About from "./layouts/about/About";
import BookDetail from "./layouts/products/BookDetail";
import FilterPage from "./layouts/pages/FilterPage";
import MyFavoriteBooksPage from "./layouts/pages/MyFavoriteBooksPage";
import CartPage from "./layouts/pages/CartPage";
import RegisterPage from "./layouts/user/RegisterPage";
import LoginPage from "./layouts/user/LoginPage";
import ProfilePage from "./layouts/user/ProfilePage";
import ActiveAccount from "./layouts/user/ActiveAccount";
import { useState } from "react";
import { Slidebar } from "./admin/components/Slidebar";
import DashboardPage from "./admin/Dashboard";
import { ToastContainer } from "react-toastify";
import { ConfirmProvider } from "material-ui-confirm";
import BookManagementPage from "./admin/BookManagement";
import UserManagementPage from "./admin/UserManagement";
import GenreManagementPage from "./admin/GenreManagement";
import OrderManagementPage from "./admin/OrderManagement";
import PolicyPage from "./layouts/pages/PolicyPage";
import FeedbackPage from "./admin/FeedbackManagement";
import { FeedbackCustomerPage } from "./layouts/pages/FeedbackCustomerPage";
import { Error403Page } from "./layouts/pages/403Page";
import { AuthProvider } from "./layouts/utils/AuthContext";
import { Error404Page } from "./layouts/pages/404Page";
import { ForgotPassword } from "./layouts/user/ForgotPassword";
import { CartItemProvider } from "./layouts/utils/CartItemContext";
import { BorrowCartProvider } from "./layouts/utils/BorrowCartContext";
import CheckoutStatus from "./layouts/pages/CheckoutStatus";
import BorrowRecordsPage from './layouts/pages/BorrowRecordsPage';
import BorrowCartPage from './layouts/pages/BorrowCartPage';
import BorrowRecordManagementPage from "./admin/BorrowRecordManagement";
// Import new library card management components
import LibraryCardManagementPage from "./admin/LibraryCardManagement";
import LibraryViolationTypeManagementPage from "./admin/LibraryCardViolationTypeManagement";
import RoleManagement from "./admin/RoleManagement";
// Import BookItem Management
import BookItemManagementPage from "./admin/BookItemManagement";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getDefaultAdminPath, hasEndpointAccess } from "./admin/AdminEnpoint";

interface JwtPayload {
	id: any;
	role: string;
	avatar: string;
	lastName: string;
	enabled: boolean;
}

// Component bảo vệ route cho admin
const ProtectedAdminRoute = ({ children, requiredPath }: { children: React.ReactNode, requiredPath: string }) => {
	const [userRole, setUserRole] = useState<string>('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const decodedToken = jwtDecode(token) as JwtPayload;
				setUserRole(decodedToken.role || '');
			} catch (error) {
				console.error('Error decoding token:', error);
				setUserRole('');
			}
		}
		setLoading(false);
	}, []);

	if (loading) {
		return <div>Loading...</div>;
	}

	// Kiểm tra quyền truy cập
	if (!hasEndpointAccess(userRole, requiredPath)) {
		return <Navigate to="/error-403" replace />;
	}

	return <>{children}</>;
};

const MyRoutes = () => {
	const [reloadAvatar, setReloadAvatar] = useState(0);
	const location = useLocation();
	const isAdminPath = location.pathname.startsWith("/admin");

	return (
		<AuthProvider>
			<CartItemProvider>
				<BorrowCartProvider>
					<ConfirmProvider>
						{/* Customer routes */}
						{!isAdminPath && <Navbar key={reloadAvatar} />}
						<Routes>
							{/* Customer Routes */}
							<Route path='/' element={<HomePage />} />
							<Route path='/book/:idBook' element={<BookDetail />} />
							<Route path='/about' element={<About />} />
							<Route path='/search/:idGenreParam' element={<FilterPage />} />
							<Route path='/search' element={<FilterPage />} />
							<Route path='/my-favorite-books' element={<MyFavoriteBooksPage />} />
							<Route path='/cart' element={<CartPage />} />
							<Route path='/borrow-cart' element={<BorrowCartPage />} />
							<Route path='/borrow-records' element={<BorrowRecordsPage />} />
							<Route path='/register' element={<RegisterPage />} />
							<Route path='/login' element={<LoginPage />} />
							<Route path='/profile' element={<ProfilePage setReloadAvatar={setReloadAvatar} />} />
							<Route path='/active/:email/:activationCode' element={<ActiveAccount />} />
							<Route path='/forgot-password' element={<ForgotPassword />} />
							<Route path='/policy' element={<PolicyPage />} />
							<Route path='/feedback' element={<FeedbackCustomerPage />} />
							<Route path='/error-403' element={<Error403Page />} />
							<Route path='/check-out/status' element={<CheckoutStatus />} />
							{!isAdminPath && <Route path='*' element={<Error404Page />} />}
						</Routes>
						{!isAdminPath && <Footer />}

						{/* Admin routes */}
						{isAdminPath && (
							<div className='row overflow-hidden w-100'>
								<div className='col-2 col-md-3 col-lg-2'>
									<Slidebar />
								</div>
								<div className='col-10 col-md-9 col-lg-10'>
									<Routes>
										{/* Admin/Staff shared routes */}
										<Route
											path='/admin'
											element={
												<AdminRedirectRoute />
											}
										/>

										{/* Dashboard - chỉ Admin */}
										<Route
											path='/admin/dashboard'
											element={
												<ProtectedAdminRoute requiredPath="/admin/dashboard">
													<DashboardPage />
												</ProtectedAdminRoute>
											}
										/>

										{/* Routes cho cả Admin và Staff */}
										<Route
											path='/admin/book'
											element={
												<ProtectedAdminRoute requiredPath="/admin/book">
													<BookManagementPage />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/book-item'
											element={
												<ProtectedAdminRoute requiredPath="/admin/book-item">
													<BookItemManagementPage />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/user'
											element={
												<ProtectedAdminRoute requiredPath="/admin/user">
													<UserManagementPage />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/genre'
											element={
												<ProtectedAdminRoute requiredPath="/admin/genre">
													<GenreManagementPage />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/order'
											element={
												<ProtectedAdminRoute requiredPath="/admin/order">
													<OrderManagementPage />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/borrow'
											element={
												<ProtectedAdminRoute requiredPath="/admin/borrow">
													<BorrowRecordManagementPage />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/library-card'
											element={
												<ProtectedAdminRoute requiredPath="/admin/library-card">
													<LibraryCardManagementPage />
												</ProtectedAdminRoute>
											}
										/>

										{/* Routes chỉ cho Admin */}
										<Route
											path='/admin/role-management'
											element={
												<ProtectedAdminRoute requiredPath="/admin/role-management">
													<RoleManagement />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/feedback'
											element={
												<ProtectedAdminRoute requiredPath="/admin/feedback">
													<FeedbackPage />
												</ProtectedAdminRoute>
											}
										/>
										<Route
											path='/admin/violation-types'
											element={
												<ProtectedAdminRoute requiredPath="/admin/violation-types">
													<LibraryViolationTypeManagementPage />
												</ProtectedAdminRoute>
											}
										/>

										{isAdminPath && <Route path='*' element={<Error404Page />} />}
									</Routes>
								</div>
							</div>
						)}
						<ToastContainer
							position='bottom-center'
							autoClose={3000}
							pauseOnFocusLoss={false}
						/>
					</ConfirmProvider>
				</BorrowCartProvider>
			</CartItemProvider>
		</AuthProvider>
	);
};

// Component redirect admin về trang phù hợp
const AdminRedirectRoute = () => {
	const [userRole, setUserRole] = useState<string>('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const decodedToken = jwtDecode(token) as JwtPayload;
				setUserRole(decodedToken.role || '');
			} catch (error) {
				console.error('Error decoding token:', error);
				setUserRole('');
			}
		}
		setLoading(false);
	}, []);

	if (loading) {
		return <div>Loading...</div>;
	}

	const defaultPath = getDefaultAdminPath(userRole);
	return <Navigate to={defaultPath} replace />;
};

function App() {
	return (
		<BrowserRouter>
			<MyRoutes />
		</BrowserRouter>
	);
}

export default App;