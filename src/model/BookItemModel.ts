import BookModel from './BookModel';

class BookItemModel {
    idBookItem: number;
    barcode: string;
    status: string;
    location: string;
    condition: number;
    book: BookModel;

    constructor(
        idBookItem: number,
        barcode: string,
        status: string,
        location: string,
        condition: number,
        book: BookModel
    ) {
        this.idBookItem = idBookItem;
        this.barcode = barcode;
        this.status = status;
        this.location = location;
        this.condition = condition;
        this.book = book;
    }
}

export default BookItemModel;