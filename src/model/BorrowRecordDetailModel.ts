import BookModel from "./BookModel";

class BorrowRecordDetailModel {
    id: number;
    quantity: number;
    isReturned: boolean;
    returnDate?: Date;
    notes?: string;
    book: BookModel;

    constructor(
        id: number,
        quantity: number,
        isReturned: boolean,
        book: BookModel
    ) {
        this.id = id;
        this.quantity = quantity;
        this.isReturned = isReturned;
        this.book = book;
    }
}

export default BorrowRecordDetailModel;