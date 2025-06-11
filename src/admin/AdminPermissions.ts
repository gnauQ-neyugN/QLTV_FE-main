// AdminPermissions.ts - Cấu hình quyền truy cập cho các vai trò

export interface Permission {
    module: string;
    description: string;
    adminAccess: boolean;
    staffAccess: boolean;
}

export const PERMISSIONS: Permission[] = [
    {
        module: "dashboard",
        description: "Dashboard - Thống kê tổng quan",
        adminAccess: true,
        staffAccess: false // Staff không được xem dashboard
    },
    {
        module: "book",
        description: "Quản lý sách",
        adminAccess: true,
        staffAccess: true // Staff được phép quản lý sách
    },
    {
        module: "genre",
        description: "Quản lý thể loại",
        adminAccess: true,
        staffAccess: true // Staff được phép quản lý thể loại
    },
    {
        module: "user",
        description: "Quản lý tài khoản",
        adminAccess: true,
        staffAccess: true // Staff được phép quản lý tài khoản
    },
    {
        module: "order",
        description: "Quản lý đơn hàng",
        adminAccess: true,
        staffAccess: true // Staff được phép quản lý đơn hàng
    },
    {
        module: "borrow",
        description: "Quản lý mượn trả",
        adminAccess: true,
        staffAccess: true // Staff được phép quản lý mượn trả
    },
    {
        module: "library-card",
        description: "Quản lý thẻ thư viện",
        adminAccess: true,
        staffAccess: true // Staff được phép quản lý thẻ thư viện
    },
    {
        module: "violation-types",
        description: "Quản lý vi phạm",
        adminAccess: true,
        staffAccess: false // Chỉ Admin mới được quản lý vi phạm
    },
    {
        module: "feedback",
        description: "Quản lý feedback",
        adminAccess: true,
        staffAccess: false // Chỉ Admin mới được quản lý feedback
    },
    {
        module: "role-management",
        description: "Quản lý phân quyền",
        adminAccess: true,
        staffAccess: false // Chỉ Admin mới được quản lý phân quyền
    }
];

/**
 * Kiểm tra quyền truy cập module theo vai trò
 * @param userRole - Vai trò của user (ADMIN, STAFF, CUSTOMER)
 * @param module - Tên module cần kiểm tra
 * @returns boolean - True nếu có quyền truy cập
 */
export const hasPermission = (userRole: string, module: string): boolean => {
    const permission = PERMISSIONS.find(p => p.module === module);

    if (!permission) {
        return false; // Không tìm thấy module thì không có quyền
    }

    switch (userRole.toUpperCase()) {
        case "ADMIN":
            return permission.adminAccess;
        case "STAFF":
            return permission.staffAccess;
        default:
            return false; // Các vai trò khác không có quyền truy cập admin
    }
};

/**
 * Lấy danh sách module mà user có quyền truy cập
 * @param userRole - Vai trò của user
 * @returns string[] - Danh sách module có quyền truy cập
 */
export const getAccessibleModules = (userRole: string): string[] => {
    return PERMISSIONS
        .filter(permission => hasPermission(userRole, permission.module))
        .map(permission => permission.module);
};

/**
 * Lấy mô tả của module
 * @param module - Tên module
 * @returns string - Mô tả module
 */
export const getModuleDescription = (module: string): string => {
    const permission = PERMISSIONS.find(p => p.module === module);
    return permission?.description || module;
};