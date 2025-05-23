class DdcCategoryModel {
    id?: number;
    idDdcCategory: number;
    nameCategory: string;

    constructor(idDdcCategory: number, nameCategory: string) {
        this.idDdcCategory = idDdcCategory;
        this.nameCategory = nameCategory;
    }
}

export default DdcCategoryModel;