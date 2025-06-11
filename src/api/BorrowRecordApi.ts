import { endpointBE } from "../layouts/utils/Constant";
import BorrowRecordModel, { BorrowRecordDetailModel, ViolationTypeModel } from "../model/BorrowRecordModel";
import { request, requestAdmin } from "./Request";
import { getIdUserByToken } from "../layouts/utils/JwtService";
import { format } from 'date-fns';

// Types for API responses
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
    fineAmount?: number;
};

export type BorrowRecordDetail = {
    id: number;
    quantity: number;
    isReturned: boolean;
    returnDate?: string;
    notes?: string;
    bookItem: {
        idBookItem: number;
        barcode: string;
        status: string;
        location: string;
        condition: number;
        book: {
            idBook: number;
            nameBook: string;
            author: string;
        };
    };
    violationType?: ViolationTypeModel;
};

export interface UpdateBorrowRecordParams {
    idBorrowRecord: number;
    status: string;
    notes?: string;
    code?: string;
}

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
    code?: string;
};

// Status constants
export const BORROW_RECORD_STATUS = {
    PROCESSING: "Đang xử lý",
    APPROVED: "Đã duyệt",
    BORROWING: "Đang mượn",
    RETURNED: "Đã trả",
    CANCELLED: "Hủy"
};

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
            const response = await requestAdmin(`${endpointBE}/library-violation-types`);

            if (!response._embedded?.libraryViolationTypes) {
                return [];
            }

            return response._embedded.libraryViolationTypes.map((type: any) => ({
                id: type.idLibraryViolationType,
                code: type.code,
                description: type.description || '',
                fine: type.fine || 0,
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
            let page = 0;
            let totalPages = 1;

            // Fetch all pages
            while (page < totalPages) {
                const response = await requestAdmin(`${endpointBE}/borrow-records?size=100&page=${page}&sort=id,desc`);

                if (response._embedded?.borrowRecords) {
                    allRecords = allRecords.concat(response._embedded.borrowRecords);
                }

                totalPages = response.page?.totalPages || 1;
                page++;
            }

            // Process the records
            const processedRecords = await Promise.all(
                allRecords.map(async (record: any) => {
                    let userName = "Unknown";
                    let cardNumber = "Unknown";

                    try {
                        // Fetch library card info
                        const libraryCardResponse = await request(record._links.libraryCard.href);
                        cardNumber = libraryCardResponse.cardNumber || "";

                        // Fetch user info from library card
                        if (libraryCardResponse._links?.user) {
                            const userResponse = libraryCardResponse._embedded.user;
                            userName = userResponse.username || "Unknown";
                        }
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
                        fineAmount: record.fineAmount || 0,
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
            const borrowRecordData = await request(`${endpointBE}/borrow-records/${id}`);

            // Get library card info
            let cardNumber = "Unknown";
            let userName = "Unknown";
            let libraryCardId = 0;

            try {
                const libraryCardData = await request(borrowRecordData._links.libraryCard.href);
                cardNumber = libraryCardData.cardNumber || "";
                libraryCardId = libraryCardData.idLibraryCard || 0;
                const userData = libraryCardData._embedded.user;
                userName = userData.username;
            } catch (error) {
                console.error("Error fetching related info:", error);
            }

            return {
                id: borrowRecordData.id,
                borrowDate: borrowRecordData.borrowDate,
                dueDate: borrowRecordData.dueDate,
                returnDate: borrowRecordData.returnDate,
                notes: borrowRecordData.notes,
                status: borrowRecordData.status,
                fineAmount: borrowRecordData.fineAmount || 0,
                cardNumber,
                userName,
                libraryCardId,
            };
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
            const detailsData = await request(`${endpointBE}/borrow-records/${id}/borrowRecordDetails`);
            const detailsList = detailsData._embedded?.borrowRecordDetails || [];

            // Process the details and include book item info
            const processedDetails = await Promise.all(
                detailsList.map(async (detail: any) => {
                    let bookItem = {
                        idBookItem: 0,
                        barcode: "Unknown",
                        status: "Unknown",
                        location: "Unknown",
                        condition: 0,
                        book: {
                            idBook: 0,
                            nameBook: "Unknown",
                            author: "Unknown",
                        }
                    };

                    let violationType: ViolationTypeModel | undefined = undefined;

                    try {
                        // Get book item info
                        const bookItemData = await request(detail._links.bookItem.href);
                        // Get book info from book item
                        const bookData = await request(bookItemData._links.book.href);

                        bookItem = {
                            idBookItem: bookItemData.idBookItem,
                            barcode: bookItemData.barcode,
                            status: bookItemData.status,
                            location: bookItemData.location,
                            condition: bookItemData.condition,
                            book: {
                                idBook: bookData.idBook,
                                nameBook: bookData.nameBook,
                                author: bookData.author
                            }
                        };

                        // Get violation type if exists
                        if (detail._links?.violationType) {
                            const violationData = await request(detail._links.violationType.href);
                            violationType = {
                                idLibraryViolationType: violationData.idLibraryViolationType,
                                code: violationData.code,
                                description: violationData.description,
                                fine: violationData.fine
                            };
                        }
                    } catch (error) {
                        console.error("Error fetching book item info:", error);
                    }

                    return {
                        id: detail.id,
                        quantity: detail.quantity,
                        isReturned: detail.isReturned || detail.returned,
                        returnDate: detail.returnDate,
                        notes: detail.notes,
                        bookItem,
                        violationType,
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
     * Update borrow record status, notes, and violation code
     */
    public async updateBorrowRecord(params: UpdateBorrowRecordParams): Promise<void> {
        try {
            const requestBody: any = {
                idBorrowRecord: params.idBorrowRecord,
                status: params.status,
                notes: params.notes || ''
            };

            // Only include the code parameter if status is "Đã trả" (RETURNED)
            if (params.status === BORROW_RECORD_STATUS.RETURNED && params.code) {
                requestBody.code = params.code;
            }

            const response = await fetch(`${endpointBE}/borrow-record/update-borrow-record`, {
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
            const response = await fetch(`${endpointBE}/borrow-record/return-1-book`, {
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

// Legacy functions for backward compatibility
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
        const response = await request(`${endpointBE}/borrow-records/search/findBorrowRecordsByLibraryCard_CardNumber?cardNumber=${cardNumber}`);

        return response._embedded?.borrowRecords.map((record: any) => ({
            id: record.id,
            borrowDate: record.borrowDate,
            dueDate: record.dueDate,
            returnDate: record.returnDate,
            notes: record.notes,
            status: record.status,
            fineAmount: record.fineAmount,
            details: []
        })) || [];
    } catch (error) {
        console.error("Error fetching user borrow records:", error);
        throw error;
    }
}

export async function getBorrowRecordDetails(borrowRecordId: number): Promise<BorrowRecordDetailModel[]> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("User not authenticated");
    }

    try {
        const response = await request(`${endpointBE}/borrow-records/${borrowRecordId}/borrowRecordDetails`);

        const detailsWithBookItems = await Promise.all(
            response._embedded?.borrowRecordDetails.map(async (detail: any) => {
                const bookItemResponse = await request(detail._links.bookItem.href);
                const bookResponse = await request(bookItemResponse._links.book.href);

                return {
                    id: detail.id,
                    quantity: detail.quantity,
                    isReturned: detail.isReturned || detail.returned,
                    returnDate: detail.returnDate,
                    notes: detail.notes,
                    bookItem: {
                        ...bookItemResponse,
                        book: bookResponse
                    }
                };
            }) || []
        );

        return detailsWithBookItems;
    } catch (error) {
        console.error("Error fetching borrow record details:", error);
        throw error;
    }
}

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