import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { hasPermission, getAccessibleModules } from '../admin/AdminPermissions';

interface JwtPayload {
    id: any;
    role: string;
    avatar: string;
    lastName: string;
    enabled: boolean;
}

export interface UsePermissionsReturn {
    userRole: string;
    isAdmin: boolean;
    isStaff: boolean;
    hasModuleAccess: (module: string) => boolean;
    accessibleModules: string[];
    loading: boolean;
}

/**
 * Hook để quản lý quyền truy cập cho user
 * @returns UsePermissionsReturn
 */
export const usePermissions = (): UsePermissionsReturn => {
    const [userRole, setUserRole] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
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

    const hasModuleAccess = (module: string): boolean => {
        return hasPermission(userRole, module);
    };

    const accessibleModules = getAccessibleModules(userRole);

    return {
        userRole,
        isAdmin: userRole === 'ADMIN',
        isStaff: userRole === 'STAFF',
        hasModuleAccess,
        accessibleModules,
        loading
    };
};

/**
 * Hook riêng để kiểm tra quyền admin/staff
 * @returns boolean
 */
export const useIsAdminOrStaff = (): boolean => {
    const { userRole } = usePermissions();
    return userRole === 'ADMIN' || userRole === 'STAFF';
};

/**
 * Hook để kiểm tra quyền truy cập module cụ thể
 * @param module - Tên module cần kiểm tra
 * @returns boolean
 */
export const useHasModuleAccess = (module: string): boolean => {
    const { hasModuleAccess } = usePermissions();
    return hasModuleAccess(module);
};