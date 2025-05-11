import { endpointBE } from "../layouts/utils/Constant";
import BorrowRecordModel from "../model/BorrowRecordModel";
import BorrowRecordDetailModel from "../model/BorrowRecordDetailModel";
import { request, requestAdmin } from "./Request";
import { getIdUserByToken } from "../layouts/utils/JwtService";

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
