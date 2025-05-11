class LibraryCardModel {
    idLibraryCard: number;
    cardNumber?: string;
    activated: boolean;
    issuedDate?: Date;

    constructor(
        idLibraryCard: number,
        activated: boolean,
        cardNumber?: string,
        issuedDate?: Date
    ) {
        this.idLibraryCard = idLibraryCard;
        this.activated = activated;
        this.cardNumber = cardNumber;
        this.issuedDate = issuedDate;
    }
}

export default LibraryCardModel;