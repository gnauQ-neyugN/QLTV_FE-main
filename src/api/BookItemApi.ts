import { endpointBE } from "../layouts/utils/Constant";
import BookItemModel from "../model/BookItemModel";

interface BookItemResponse {
    bookItemList: BookItemModel[];
    totalPages: number;
    totalItems: number;
}

/**
 * Lấy tất cả BookItem với phân trang
 */
export async function getAllBookItems(size: number = 10, page: number = 0): Promise<BookItemResponse> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${endpointBE}/book-items?size=${size}&page=${page}&sort=idBookItem,desc`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
        bookItemList: data._embedded?.bookItems || [],
        totalPages: data.page?.totalPages || 0,
        totalItems: data.page?.totalElements || 0,
    };
}

/**
 * Lấy BookItem theo ID
 */
export async function getBookItemById(id: number): Promise<BookItemModel> {
    const token = localStorage.getItem("token");

    const response = await fetch(`${endpointBE}/book-items/${id}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Tạo BookItem mới
 */
export async function createBookItem(bookItem: Partial<BookItemModel>): Promise<BookItemModel> {
    const token = localStorage.getItem("token");

    const response = await fetch(`${endpointBE}/book-items`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bookItem),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Cập nhật BookItem
 */
export async function updateBookItem(bookItem: BookItemModel): Promise<BookItemModel> {
    const token = localStorage.getItem("token");

    const response = await fetch(`${endpointBE}/book-item/update-book-item`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            idBookItem: bookItem.idBookItem,
            barcode: bookItem.barcode,
            status: bookItem.status,
            location: bookItem.location,
            condition: bookItem.condition,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Xóa BookItem
 */
export async function deleteBookItem(id: number): Promise<void> {
    const token = localStorage.getItem("token");

    const response = await fetch(`${endpointBE}/book-item/delete-book-item`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ idBookItem: id }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

/**
 * Tìm kiếm BookItem theo barcode
 */
export async function findBookItemByBarcode(barcode: string): Promise<BookItemModel | null> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${endpointBE}/book-items/search/findByBarcode?barcode=${barcode}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Lấy BookItem theo Book ID và status
 */
export async function getBookItemsByBookIdAndStatus(
    bookId: number,
    status: string,
    size: number = 10
): Promise<BookItemModel[]> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${endpointBE}/book-items/search/findByBookIdAndStatusOrderByIdBookItem?bookId=${bookId}&status=${status}&size=${size}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data._embedded?.bookItems || [];
}