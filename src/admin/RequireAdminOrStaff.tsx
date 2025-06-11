import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export interface JwtPayload {
	id: any;
	role: string;
	avatar: string;
	lastName: string;
	enabled: boolean;
}

// Higher Order Component để kiểm tra quyền Admin hoặc Staff
const RequireAdminOrStaff = <P extends object>(
	WrappedComponent: React.ComponentType<P>
) => {
	const WithAdminOrStaffCheck: React.FC<P> = (props) => {
		const navigate = useNavigate();

		useEffect(() => {
			const token = localStorage.getItem("token");

			// Nếu chưa đăng nhập thì về trang /login
			if (!token) {
				navigate("/login");
				return;
			}

			// Giải mã token
			const decodedToken = jwtDecode(token) as JwtPayload;

			// Lấy thông tin từ token đó
			const role = decodedToken.role;

			// Kiểm tra quyền - cho phép cả ADMIN và STAFF
			if (role !== "ADMIN" && role !== "STAFF") {
				navigate("/error-403");
			}
		}, [navigate]);

		return <WrappedComponent {...props} />;
	};
	return WithAdminOrStaffCheck || null;
};

export default RequireAdminOrStaff;