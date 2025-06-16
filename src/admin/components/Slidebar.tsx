import React, {useEffect, useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SecurityIcon from "@mui/icons-material/Security";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import FeedbackIcon from "@mui/icons-material/Feedback";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { logout } from "../../layouts/utils/JwtService";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../layouts/utils/AuthContext";
import { useCartItem } from "../../layouts/utils/CartItemContext";
import { hasPermission } from "../AdminPermissions";
import {jwtDecode} from "jwt-decode";

interface SlidebarProps {}

interface JwtPayload {
	id: any;
	role: string;
	avatar: string;
	lastName: string;
	enabled: boolean;
}

export const Slidebar: React.FC<SlidebarProps> = (props) => {
	const {setCartList} = useCartItem();
	const {setLoggedIn} = useAuth();
	const navigate = useNavigate();
	const [userRole, setUserRole] = useState<string>("");

	// Lấy role từ token
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const decodedToken = jwtDecode(token) as JwtPayload;
				setUserRole(decodedToken.role);
			} catch (error) {
				console.error("Error decoding token:", error);
			}
		}
	}, []);

	return (
		<div
			className="position-fixed overflow-auto bg-primary min-vh-100"
			style={{zIndex: "100", width: "250px", maxHeight: "100vh"}}
		>
			<div className='d-flex flex-column justify-content-between min-vh-100'>
				<div className='px-3'>
					<a
						className='text-decoration-none d-flex align-items-center text-white d-none d-sm-flex align-items-sm-center justify-content-center pt-3'
						href='#'
					>
						<h1>
							QLibrary
						</h1>
					</a>
					<hr className='text-white d-none d-sm-block d-md-block'/>
					<ul className='nav nav-pills flex-column' id='parentM'>
						{/* Dashboard - Sử dụng permission system */}
						{hasPermission(userRole, "dashboard") && (
							<li className='nav-item'>
								<NavLink
									to={"/admin/dashboard"}
									className={`nav-link d-flex align-items-center justify-content-center`}
								>
									<DashboardIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Dashboard
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý Sách - Sử dụng permission system */}
						{hasPermission(userRole, "book") && (
							<li className='nav-item'>
								<NavLink
									to={"/admin/book"}
									className={`nav-link d-flex align-items-center justify-content-center`}
								>
									<MenuBookRoundedIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý Sách
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý BookItem - Sử dụng permission system */}
						{hasPermission(userRole, "book-item") && (
							<li className='nav-item'>
								<NavLink
									to={"/admin/book-item"}
									className={`nav-link d-flex align-items-center justify-content-center`}
								>
									<LibraryBooksIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý BookItem
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý thể loại - Sử dụng permission system */}
						{hasPermission(userRole, "genre") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/genre"}
									className={`nav-link d-flex align-items-center justify-content-center`}
								>
									<CategoryRoundedIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý thể loại
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý tài khoản - Sử dụng permission system */}
						{hasPermission(userRole, "user") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/user"}
									className={`nav-link d-flex align-items-center justify-content-center`}
								>
									<ManageAccountsIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý tài khoản
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý phân quyền - Sử dụng permission system */}
						{hasPermission(userRole, "role-management") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/role-management"}
									className={`nav-link d-flex align-items-center justify-content-center`}
								>
									<SecurityIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
									Quản lý phân quyền
								</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý đơn hàng - Sử dụng permission system */}
						{hasPermission(userRole, "order") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/order"}
									className={`nav-link d-flex align-items-center justify-content-center `}
								>
									<LocalMallRoundedIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý đơn hàng
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý mượn trả - Sử dụng permission system */}
						{hasPermission(userRole, "borrow") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/borrow"}
									className={`nav-link d-flex align-items-center justify-content-center `}
								>
									<LocalMallRoundedIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý mượn trả
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý thẻ thư viện - Sử dụng permission system */}
						{hasPermission(userRole, "library-card") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/library-card"}
									className={`nav-link d-flex align-items-center justify-content-center `}
								>
									<CreditCardIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý thẻ thư viện
									</span>
								</NavLink>
							</li>
						)}

						{/* Quản lý vi phạm - Sử dụng permission system */}
						{hasPermission(userRole, "violation-types") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/violation-types"}
									className={`nav-link d-flex align-items-center justify-content-center `}
								>
									<ReportProblemIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Quản lý vi phạm
									</span>
								</NavLink>
							</li>
						)}

						{/* Feedback - Sử dụng permission system */}
						{hasPermission(userRole, "feedback") && (
							<li className='nav-item '>
								<NavLink
									to={"/admin/feedback"}
									className={`nav-link d-flex align-items-center justify-content-center `}
								>
									<FeedbackIcon fontSize='small'/>
									<span className='ms-2 d-none d-sm-inline d-md-inline'>
										Feedback
									</span>
								</NavLink>
							</li>
						)}
					</ul>
				</div>
				<div className='dropdown open text-center mb-3'>
					<a
						className='my-3 btn border-0 dropdown-toggle text-white d-inline-flex align-items-center justify-content-center'
						type='button'
						id='triggerId'
						data-bs-toggle='dropdown'
						aria-haspopup='true'
						aria-expanded='false'
					>
						<PersonIcon fontSize='small'/>
						<span className='ms-2'>{userRole}</span>
					</a>
					<div className='dropdown-menu' aria-labelledby='triggerId'>
						<Link
							className='dropdown-item'
							style={{cursor: "pointer"}}
							to={"/profile"}
						>
							Thông tin cá nhân
						</Link>
						<a
							className='dropdown-item'
							style={{cursor: "pointer"}}
							onClick={() => {
								setLoggedIn(false);
								setCartList([]);
								logout(navigate);
							}}
						>
							Đăng xuất
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}