import { endpointBE } from "../layouts/utils/Constant";
import { requestAdmin } from "./Request";

// Interfaces for API responses
export interface DashboardStatistics {
    totalRevenue: number;
    totalBorrowRecords: number;
    totalSuccessfulOrders: number;
    totalUsers: number;
    totalBooks: number;
    totalFines: number;
    totalViolationTypes: number;
}

export interface RevenueStatistics {
    bookRevenue: number;
    fineRevenue: number;
    totalRevenue: number;
}

export interface TopBorrowedBook {
    idBook: number;
    nameBook: string;
    author: string;
    borrowQuantity: number;
    isbn: string;
}

export interface CommonViolation {
    code: string;
    description: string;
    fine: number;
    count: number;
}

/**
 * Statistics API service for admin dashboard
 */
class StatisticsApi {

    /**
     * Get dashboard statistics
     */
    public async getDashboardStatistics(): Promise<DashboardStatistics> {
        try {
            const response = await requestAdmin(`${endpointBE}/statistics/dashboard`);
            return response;
        } catch (error) {
            console.error("Error fetching dashboard statistics:", error);
            throw new Error("Không thể tải thống kê dashboard");
        }
    }

    /**
     * Get revenue statistics
     */
    public async getRevenueStatistics(): Promise<RevenueStatistics> {
        try {
            const response = await requestAdmin(`${endpointBE}/statistics/revenue`);
            return response;
        } catch (error) {
            console.error("Error fetching revenue statistics:", error);
            throw new Error("Không thể tải thống kê doanh thu");
        }
    }

    /**
     * Get top borrowed books
     */
    public async getTopBorrowedBooks(limit: number = 3): Promise<TopBorrowedBook[]> {
        try {
            const response = await requestAdmin(`${endpointBE}/statistics/top-borrowed-books?limit=${limit}`);
            return response;
        } catch (error) {
            console.error("Error fetching top borrowed books:", error);
            throw new Error("Không thể tải top sách được mượn nhiều nhất");
        }
    }

    /**
     * Get most common violations
     */
    public async getMostCommonViolations(limit: number = 3): Promise<CommonViolation[]> {
        try {
            const response = await requestAdmin(`${endpointBE}/statistics/most-common-violations?limit=${limit}`);
            return response;
        } catch (error) {
            console.error("Error fetching most common violations:", error);
            throw new Error("Không thể tải thống kê vi phạm phổ biến nhất");
        }
    }

    /**
     * Format currency for display
     */
    public formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    /**
     * Format number for display
     */
    public formatNumber(num: number): string {
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    /**
     * Calculate percentage change
     */
    public calculatePercentageChange(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }
}

export default new StatisticsApi();