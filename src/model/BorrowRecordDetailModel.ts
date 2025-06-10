import BookItemModel from "./BookItemModel";

export interface ViolationTypeModel {
    idLibraryViolationType: number;
    code: string;
    description: string;
    fine: number;
}

class BorrowRecordDetailModel {
    id: number;
    quantity: number;
    isReturned: boolean;
    returnDate?: Date;
    notes?: string;
    bookItem: BookItemModel; // Changed from book to bookItem
    violationType?: ViolationTypeModel;

    constructor(
        id: number,
        quantity: number,
        isReturned: boolean,
        bookItem: BookItemModel,
        returnDate?: Date,
        notes?: string,
        violationType?: ViolationTypeModel
    ) {
        this.id = id;
        this.quantity = quantity;
        this.isReturned = isReturned;
        this.bookItem = bookItem;
        this.returnDate = returnDate;
        this.notes = notes;
        this.violationType = violationType;
    }
}

export default BorrowRecordDetailModel;