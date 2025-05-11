import React, { createContext, useContext, useEffect, useState } from "react";
import CartItemModel from "../../model/CartItemModel";

interface BorrowCartProps {
    children: React.ReactNode;
}

interface BorrowCartType {
    borrowCartList: CartItemModel[];
    setBorrowCartList: any;
    totalBorrowItems: number;
    setTotalBorrowItems: any;
}

const BorrowCart = createContext<BorrowCartType | undefined>(undefined);

export const BorrowCartProvider: React.FC<BorrowCartProps> = (props) => {
    const [borrowCartList, setBorrowCartList] = useState<CartItemModel[]>([]);
    const [totalBorrowItems, setTotalBorrowItems] = useState(0);

    useEffect(() => {
        const borrowCartData: string | null = localStorage.getItem("borrowCart");
        let borrowCart: CartItemModel[] = [];
        borrowCart = borrowCartData ? JSON.parse(borrowCartData) : [];
        setBorrowCartList(borrowCart);
        setTotalBorrowItems(borrowCart.length);
    }, []);

    return (
        <BorrowCart.Provider
            value={{ borrowCartList, setBorrowCartList, totalBorrowItems, setTotalBorrowItems }}
        >
            {props.children}
        </BorrowCart.Provider>
    );
};

export const useBorrowCart = (): BorrowCartType => {
    const context = useContext(BorrowCart);
    if (!context) {
        throw new Error("Lỗi context");
    }
    return context;
};