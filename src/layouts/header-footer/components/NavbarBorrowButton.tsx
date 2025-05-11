
import React from "react";
import { Link } from "react-router-dom";
import { useBorrowCart } from "../../utils/BorrowCartContext";

const NavbarBorrowButton: React.FC = () => {
    const { totalBorrowItems } = useBorrowCart();

    return (
        <Link className="text-reset me-3" to="/borrow-cart">
            <i className="fas fa-book-reader"></i>
            <span className="badge rounded-pill badge-notification bg-danger">
                {totalBorrowItems ? totalBorrowItems : ""}
            </span>
        </Link>
    );
};

export default NavbarBorrowButton;