// Cập nhật AdminEndpoint.ts để hỗ trợ cả Admin và Staff

// Các endpoint mà cả Admin và Staff đều có quyền truy cập
export const AdminStaffEndpoints = [
    "/admin/book",        // Quản lý sách
    "/admin/book-item",   // Quản lý BookItem
    "/admin/genre",       // Quản lý thể loại
    "/admin/user",        // Quản lý tài khoản
    "/admin/order",       // Quản lý đơn hàng
    "/admin/borrow",        // Quản lý mượn trả
    "/admin/dashboard",
    "/admin/library-card" // Quản lý thẻ thư viện
];

// Các endpoint chỉ Admin mới có quyền truy cập
export const AdminOnlyEndpoints = [
    "/admin/dashboard",      // Dashboard
    "/admin/violation-types", // Quản lý vi phạm
    "/admin/feedback",        // Quản lý feedback
    "/admin/role-management",  // Quản lý phân quyền
];

// Tất cả các endpoint admin (để backward compatibility)
export const AdminEndpoint = [
    "/admin",
    ...AdminStaffEndpoints,
    ...AdminOnlyEndpoints
];

/**
 * Kiểm tra quyền truy cập endpoint theo role
 * @param userRole - Vai trò của user
 * @param path - Đường dẫn cần kiểm tra
 * @returns boolean - True nếu có quyền truy cập
 */
export const hasEndpointAccess = (userRole: string, path: string): boolean => {
    if (userRole === "ADMIN") {
        return AdminEndpoint.some(endpoint => path.startsWith(endpoint));
    }

    if (userRole === "STAFF") {
        return AdminStaffEndpoints.some(endpoint => path.startsWith(endpoint));
    }

    return false;
};

/**
 * Redirect user về trang phù hợp với quyền của họ
 * @param userRole - Vai trò của user
 * @returns string - Đường dẫn trang mặc định
 */
export const getDefaultAdminPath = (userRole: string): string => {
    if (userRole === "ADMIN") {
        return "/admin/dashboard";
    }

    if (userRole === "STAFF") {
        return "/admin/dashboard"; // Staff sẽ được redirect về trang quản lý sách
    }

    return "/error-403";
};