class LibraryCardModel {
    idLibraryCard: number;
    cardNumber?: string;
    activated: boolean;
    issuedDate?: Date;
    status?: string;

    constructor(
        idLibraryCard: number,
        activated: boolean,
        cardNumber?: string,
        issuedDate?: Date,
        status?: string
    ) {
        this.idLibraryCard = idLibraryCard;
        this.activated = activated;
        this.cardNumber = cardNumber;
        this.issuedDate = issuedDate;
        this.status = status;
    }
}

export default LibraryCardModel;