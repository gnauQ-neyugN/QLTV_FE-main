import { endpointBE } from "../layouts/utils/Constant";
import BorrowRecordModel from "../model/BorrowRecordModel";
import BorrowRecordDetailModel from "../model/BorrowRecordDetailModel";
import { request, requestAdmin } from "./Request";
import { getIdUserByToken } from "../layouts/utils/JwtService";
import { format } from 'date-fns';

// Types
export type BorrowRecord = {
    id: number;
    borrowDate: string;
    dueDate: string;
    returnDate?: string;
    notes?: string;
    status: string;
    cardNumber: string;
    userName: string;
    libraryCardId?: number;
};

export type BorrowRecordDetail = {
    id: number;
    quantity: number;
    isReturned: boolean;
    returnDate?: string;
    notes?: string;
    book: {
        idBook: number;
        nameBook: string;
        author: string;
    };
};

export interface UpdateBorrowRecordParams {
    idBorrowRecord: number;
    status: string;
    notes?: string;
    code?: string; // New parameter for violation code
}

// Add a new interface for violation types
export interface ViolationType {
    id: number;
    code: string;
    fine: number;
    description: string;
}

export type UpdateBookReturnParams = {
    id: number;
    isReturned: boolean;
    returnDate: string | null;
    notes: string;
};

// Status constants
export const BORROW_RECORD_STATUS = {
    PROCESSING: "Đang xử lý",
    APPROVED: "Đã duyệt",
    BORROWING: "Đang mượn",
    RETURNED: "Đã trả",
    CANCELLED: "Hủy"
};
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

/**
 * BorrowRecordApi class for handling all borrow record related API calls
 */
class BorrowRecordApi {
    /**
     * Get the authentication token from local storage
     */
    private getToken(): string {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Authentication token not found");
        }
        return token;
    }

    /**
     * Create headers with authentication token
     */
    private getHeaders(includeContentType: boolean = false): HeadersInit {
        const headers: HeadersInit = {
            Authorization: `Bearer ${this.getToken()}`
        };

        if (includeContentType) {
            headers["Content-Type"] = "application/json";
        }

        return headers;
    }

    /**
     * Format date to display format (dd/MM/yyyy)
     */
    public formatDate(dateString?: string): string {
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), "dd/MM/yyyy");
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Format date for input (yyyy-MM-dd)
     */
    public formatDateForInput(dateString?: string): string {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), "yyyy-MM-dd");
        } catch (e) {
            return "";
        }
    }

    /**
     * Get color for status chip
     */
    public getStatusColor(status: string): 'info' | 'success' | 'primary' | 'secondary' | 'error' | 'default' {
        switch (status) {
            case BORROW_RECORD_STATUS.PROCESSING:
                return "info";
            case BORROW_RECORD_STATUS.APPROVED:
                return "success";
            case BORROW_RECORD_STATUS.BORROWING:
                return "primary";
            case BORROW_RECORD_STATUS.RETURNED:
                return "secondary";
            case BORROW_RECORD_STATUS.CANCELLED:
                return "error";
            default:
                return "default";
        }
    }

    /**
     * Fetch all violation types
     */
    public async fetchViolationTypes(): Promise<ViolationType[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/library-violation-types`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error("Failed to fetch violation types");
            }

            const responseData = await response.json();
            const violationTypes = responseData._embedded?.libraryViolationTypes || [];

            return violationTypes.map((type: any) => ({
                id: type.id,
                code: type.code,
                name: type.name,
                description: type.description || '',
            }));
        } catch (error) {
            console.error("Error in fetchViolationTypes:", error);
            throw error;
        }
    }
    /**
     * Fetch all borrow records
     */
    public async fetchAllBorrowRecords(): Promise<BorrowRecord[]> {
        try {
            let allRecords: any[] = [];
            let nextUrl = `${API_BASE_URL}/borrow-records?size=100&sort=id,desc`; // size lớn hơn 20

            // Duyệt qua tất cả các trang
            while (nextUrl) {
                const response = await fetch(nextUrl, {
                    headers: this.getHeaders()
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch borrow records");
                }

                const data = await response.json();
                const records = data._embedded?.borrowRecords || [];
                allRecords = allRecords.concat(records);

                // Lấy URL của trang tiếp theo nếu có
                nextUrl = data._links?.next?.href || null;
            }

            // Xử lý các bản ghi đã gom lại
            const processedRecords = await Promise.all(
                allRecords.map(async (record: any) => {
                    let userName = "Unknown";
                    let cardNumber = "Unknown";

                    try {
                        const libraryCardData = await this.fetchLinkedResource(record._links.libraryCard.href);
                        cardNumber = libraryCardData.cardNumber || "Unknown";
                        userName = libraryCardData._embedded.user.username || "Unknown";
                    } catch (error) {
                        console.error("Error fetching related info:", error);
                    }

                    return {
                        id: record.id,
                        borrowDate: record.borrowDate,
                        dueDate: record.dueDate,
                        returnDate: record.returnDate,
                        notes: record.notes,
                        status: record.status,
                        cardNumber,
                        userName,
                    };
                })
            );

            return processedRecords;
        } catch (error) {
            console.error("Error in fetchAllBorrowRecords:", error);
            throw error;
        }
    }


    /**
     * Fetch a specific borrow record by ID
     */
    public async fetchBorrowRecordById(id: number): Promise<BorrowRecord> {
        try {
            const response = await fetch(`${API_BASE_URL}/borrow-records/${id}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error("Failed to fetch borrow record");
            }

            const borrowRecordData = await response.json();

            // Get library card info
            let cardNumber = "Unknown";
            let userName = "Unknown";
            let libraryCardId = 0;

            try {
                const libraryCardData = await this.fetchLinkedResource(borrowRecordData._links.libraryCard.href);
                cardNumber = libraryCardData.cardNumber || "Unknown";
                libraryCardId = libraryCardData.idLibraryCard || 0;
                userName = libraryCardData._embedded.user.username;
            } catch (error) {
                console.error("Error fetching related info:", error);
            }

            // Create record object
            const recordData: BorrowRecord = {
                id: borrowRecordData.id,
                borrowDate: borrowRecordData.borrowDate,
                dueDate: borrowRecordData.dueDate,
                returnDate: borrowRecordData.returnDate,
                notes: borrowRecordData.notes,
                status: borrowRecordData.status,
                cardNumber,
                userName,
                libraryCardId,
            };

            return recordData;
        } catch (error) {
            console.error("Error in fetchBorrowRecordById:", error);
            throw error;
        }
    }

    /**
     * Fetch borrow record details for a specific borrow record
     */
    public async fetchBorrowRecordDetails(id: number): Promise<BorrowRecordDetail[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/borrow-records/${id}/borrowRecordDetails`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error("Failed to fetch borrow record details");
            }

            const detailsData = await response.json();
            const detailsList = detailsData._embedded?.borrowRecordDetails || [];

            // Process the details and include book info
            const processedDetails = await Promise.all(
                detailsList.map(async (detail: any) => {
                    let book = {
                        idBook: 0,
                        nameBook: "Unknown",
                        author: "Unknown",
                    };

                    try {
                        // Get book info
                        const bookData = await this.fetchLinkedResource(detail._links.book.href);
                        book = {
                            idBook: bookData.idBook,
                            nameBook: bookData.nameBook,
                            author: bookData.author
                        };
                    } catch (error) {
                        console.error("Error fetching book info:", error);
                    }

                    return {
                        id: detail.id,
                        quantity: detail.quantity,
                        isReturned: detail.returned,
                        returnDate: detail.returnDate,
                        notes: detail.notes,
                        book,
                    };
                })
            );

            return processedDetails;
        } catch (error) {
            console.error("Error in fetchBorrowRecordDetails:", error);
            throw error;
        }
    }

    /**
     * Fetch linked resource from HATEOAS link
     */
    private async fetchLinkedResource(url: string): Promise<any> {
        const response = await fetch(url, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch linked resource: ${url}`);
        }

        return await response.json();
    }

    /**
     * Update borrow record status and notes
     */
    /**
     * Update borrow record status, notes, and violation code
     */
    public async updateBorrowRecord(params: UpdateBorrowRecordParams): Promise<void> {
        try {
            // Prepare the request body, including the code parameter if it's provided
            const requestBody: any = {
                idBorrowRecord: params.idBorrowRecord,
                status: params.status,
                notes: params.notes || ''
            };

            // Only include the code parameter if status is "Đã trả" (RETURNED)
            if (params.status === BORROW_RECORD_STATUS.RETURNED && params.code) {
                requestBody.code = params.code;
            }

            const response = await fetch(`${API_BASE_URL}/borrow-record/update-borrow-record`, {
                method: "PUT",
                headers: this.getHeaders(true),
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to update borrow record");
            }
        } catch (error) {
            console.error("Error in updateBorrowRecord:", error);
            throw error;
        }
    }

    /**
     * Update individual book return status
     */
    public async updateBookReturnStatus(params: UpdateBookReturnParams): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/borrow-record/return-1-book`, {
                method: "PUT",
                headers: this.getHeaders(true),
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to update borrow record detail");
            }
        } catch (error) {
            console.error("Error in updateBookReturnStatus:", error);
            throw error;
        }
    }

    /**
     * Calculate statistics for a borrow record
     */
    public calculateBorrowRecordStats(details: BorrowRecordDetail[]) {
        const totalBooks = details.reduce((total, detail) => total + detail.quantity, 0);
        const returnedBooks = details
            .filter(detail => detail.isReturned)
            .reduce((total, detail) => total + detail.quantity, 0);

        return {
            totalTitles: details.length,
            totalBooks,
            returnedBooks,
            remainingBooks: totalBooks - returnedBooks,
            allReturned: totalBooks === returnedBooks
        };
    }
}

export default new BorrowRecordApi();
// Function to create a new borrow record
export async function createBorrowRecord(borrowRecordData: any): Promise<any> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("User not authenticated");
    }

    try {
        const response = await fetch(`${endpointBE}/borrow-record/add-borrow-record`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(borrowRecordData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to create borrow record");
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating borrow record:", error);
        throw error;
    }
}

// Function to get all borrow records for the current user
export async function getUserBorrowRecords(): Promise<BorrowRecordModel[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("User not authenticated");
    }

    try {
        const idUser = getIdUserByToken();
        const userResponse = await request(`${endpointBE}/users/${idUser}/libraryCard`);
        if (!userResponse.idLibraryCard) {
            throw new Error("User doesn't have a library card");
        }

        const cardNumber = userResponse.cardNumber;

        // If the user has a library card, get all borrow records associated with it
        const response = await request(`${endpointBE}/borrow-records/search/findBorrowRecordsByLibraryCard_CardNumber?cardNumber=${cardNumber}`);

        return response._embedded?.borrowRecords.map((record: any) => ({
            id: record.id,
            borrowDate: record.borrowDate,
            dueDate: record.dueDate,
            returnDate: record.returnDate,
            notes: record.notes,
            status: record.status,
            details: []
        })) || [];
    } catch (error) {
        console.error("Error fetching user borrow records:", error);
        throw error;
    }
}

// Function to get all details for a specific borrow record
export async function getBorrowRecordDetails(borrowRecordId: number): Promise<BorrowRecordDetailModel[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("User not authenticated");
    }

    try {
        const response = await request(`${endpointBE}/borrow-records/${borrowRecordId}/borrowRecordDetails`);

        // Fetch book details for each borrow record detail
        const detailsWithBooks = await Promise.all(
            response._embedded?.borrowRecordDetails.map(async (detail: any) => {
                const bookResponse = await request(detail._links.book.href);
                return {
                    id: detail.id,
                    quantity: detail.quantity,
                    isReturned: detail.isReturned,
                    returnDate: detail.returnDate,
                    notes: detail.notes,
                    book: bookResponse
                };
            }) || []
        );

        return detailsWithBooks;
    } catch (error) {
        console.error("Error fetching borrow record details:", error);
        throw error;
    }
}

// Function to cancel a borrow record
export async function cancelBorrowRecord(borrowRecordId: any): Promise<any> {
    const id = Number(borrowRecordId);

    if (isNaN(id)) {
        throw new Error("ID phiếu mượn không hợp lệ");
    }

    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("User not authenticated");
    }

    try {
        const response = await fetch(`${endpointBE}/borrow-record/cancel-borrow-record`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idBorrowRecord: id
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to cancel borrow record");
        }

        return await response.json();
    } catch (error) {
        console.error("Error canceling borrow record:", error);
        throw error;
    }
}
