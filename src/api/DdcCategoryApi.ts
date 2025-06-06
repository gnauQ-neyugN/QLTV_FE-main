import { endpointBE } from "../layouts/utils/Constant";
import DdcCategoryModel from "../model/DdcCategoryModel";
import { request } from "./Request";

interface resultInterface {
    ddcCategoryList: DdcCategoryModel[];
    ddcCategory: DdcCategoryModel;
}

async function getDdcCategory(endpoint: string): Promise<resultInterface> {
    // Gọi phương thức request()
    const response = await request(endpoint);

    // Lấy ra danh sách DDC Category
    const ddcCategoryList: any = response._embedded.ddcCategories.map((ddcCategoryData: any) => ({
        ...ddcCategoryData,
    }))

    return { ddcCategoryList: ddcCategoryList, ddcCategory: response.ddcCategory };
}

export async function getAllDdcCategories(): Promise<resultInterface> {
    const endpoint = endpointBE + "/ddc-categories?sort=idDdcCategory";

    return getDdcCategory(endpoint);
}

export async function get1DdcCategory(idDdcCategory: number): Promise<resultInterface> {
    const endpoint = endpointBE + `/ddc-categories/${idDdcCategory}`;
    const response = await request(endpoint);

    return { ddcCategory: response, ddcCategoryList: response };
}

export async function getDdcCategoryByIdBook(idBook: number): Promise<resultInterface> {
    const endpoint = endpointBE + `/books/${idBook}/listDdcCategory`;

    return getDdcCategory(endpoint);
}