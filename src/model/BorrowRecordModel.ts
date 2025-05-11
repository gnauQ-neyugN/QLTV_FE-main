import BorrowRecordDetailModel from "./BorrowRecordDetailModel";
import LibraryCardModel from "./LibraryCardModel";

class BorrowRecordModel {
    id: number;
    borrowDate: Date;
    dueDate: Date;
    returnDate?: Date;
    notes?: string;
    status: string;
    libraryCard?: LibraryCardModel;
    details: BorrowRecordDetailModel[];

    constructor(
        id: number,
        borrowDate: Date,
        dueDate: Date,
        status: string,
        details: BorrowRecordDetailModel[] = []
    ) {
        this.id = id;
        this.borrowDate = borrowDate;
        this.dueDate = dueDate;
        this.status = status;
        this.details = details;
    }
}

export default BorrowRecordModel;