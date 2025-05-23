import GenreModel from "./GenreModel";
import DdcCategoryModel from "./DdcCategoryModel";

class BookModel {
   id?: any;
   idBook: number;
   nameBook?: string; // Có thể NULL
   author?: string;
   isbn?: string;
   description?: string;
   listPrice: number;
   sellPrice: number;
   quantityForSold?: number;
   quantityForBorrow?: number;
   borrowQuantity?: number;
   avgRating?: number;
   soldQuantity?: number;
   discountPercent?: number;
   thumbnail?: string;
   relatedImg?: string[];
   idGenres?: number[];
   idDdcCategory?: number[];
   genresList?: GenreModel[];
   ddcCategoryList?: DdcCategoryModel[];
   isFavorited?: boolean;

   constructor(
       id: any,
       idBook: number,
       nameBook: string,
       author: string,
       isbn: string,
       description: string,
       listPrice: number,
       sellPrice: number,
       quantityForSold: number,
       quantityForBorrow: number,
       borrowQuantity: number,
       avgRating: number,
       soldQuantity: number,
       discountPercent: number,
       thumbnail: string,
       relatedImg: string[],
       idGenres: number[],
       idDdcCategory: number[],
       genresList: GenreModel[],
       ddcCategoryList: DdcCategoryModel[],
       isFavorited: boolean
   ) {
      this.id = id;
      this.idBook = idBook;
      this.nameBook = nameBook;
      this.author = author;
      this.isbn = isbn;
      this.description = description;
      this.listPrice = listPrice;
      this.sellPrice = sellPrice;
      this.quantityForSold = quantityForSold;
      this.quantityForBorrow = quantityForBorrow;
      this.borrowQuantity = borrowQuantity;
      this.avgRating = avgRating;
      this.soldQuantity = soldQuantity;
      this.discountPercent = discountPercent;
      this.thumbnail = thumbnail;
      this.relatedImg = relatedImg;
      this.idGenres = idGenres;
      this.idDdcCategory = idDdcCategory;
      this.genresList = genresList;
      this.ddcCategoryList = ddcCategoryList;
      this.isFavorited = isFavorited;
   }
}

export default BookModel;