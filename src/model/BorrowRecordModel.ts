import BookItemModel from "./BookItemModel";
import LibraryCardModel from "./LibraryCardModel";
import UserModel from "./UserModel";

export interface ViolationTypeModel {
    idLibraryViolationType: number;
    code: string;
    description: string;
    fine: number;
}

export interface BorrowRecordDetailModel {
    id: number;
    quantity: number;
    isReturned: boolean;
    returnDate?: Date;
    notes?: string;
    bookItem: BookItemModel;
    violationType?: ViolationTypeModel;
}

class BorrowRecordModel {
    id: number;
    borrowDate: Date;
    dueDate: Date;
    returnDate?: Date;
    notes?: string;
    status: string;
    fineAmount: number;
    libraryCard: LibraryCardModel;
    borrowRecordDetails?: BorrowRecordDetailModel[];

    constructor(
        id: number,
        borrowDate: Date,
        dueDate: Date,
        status: string,
        fineAmount: number,
        libraryCard: LibraryCardModel,
        returnDate?: Date,
        notes?: string,
        borrowRecordDetails?: BorrowRecordDetailModel[]
    ) {
        this.id = id;
        this.borrowDate = borrowDate;
        this.dueDate = dueDate;
        this.returnDate = returnDate;
        this.notes = notes;
        this.status = status;
        this.fineAmount = fineAmount;
        this.libraryCard = libraryCard;
        this.borrowRecordDetails = borrowRecordDetails;
    }
}
export default BorrowRecordModel;