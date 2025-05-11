import React, { useState } from "react";
import { Button } from "@mui/material";
import { FadeModal } from "../../utils/FadeModal";
import BorrowRecordForm from "./BorrowRecordForm";
import { useNavigate } from "react-router-dom";
import { isToken } from "../../utils/JwtService";
import { toast } from "react-toastify";
import CartItemModel from "../../../model/CartItemModel";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";

interface AddBorrowRecordButtonProps {
    cartItems: CartItemModel[];
    buttonText?: string;
    variant?: "text" | "outlined" | "contained";
    color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
    size?: "small" | "medium" | "large";
    fullWidth?: boolean;
    className?: string;
}

const AddBorrowRecordButton: React.FC<AddBorrowRecordButtonProps> = ({
                                                                         cartItems,
                                                                         buttonText = "Mượn sách",
                                                                         variant = "contained",
                                                                         color = "primary",
                                                                         size = "medium",
                                                                         fullWidth = false,
                                                                         className = ""
                                                                     }) => {
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(false);

    const handleOpenModal = () => {
        if (!isToken()) {
            toast.warning("Bạn cần đăng nhập để sử dụng tính năng này");
            navigate("/login");
            return;
        }

        if (cartItems.length === 0) {
            toast.warning("Vui lòng chọn sách để mượn");
            return;
        }

        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    return (
        <>
            <Button
                variant={variant}
                color={color}
                size={size}
                fullWidth={fullWidth}
                className={className}
                onClick={handleOpenModal}
                startIcon={<LibraryAddIcon />}
            >
                {buttonText}
            </Button>

            <FadeModal
                open={openModal}
                handleOpen={handleOpenModal}
                handleClose={handleCloseModal}
            >
                <BorrowRecordForm
                    cartItems={cartItems}
                    handleCloseModal={handleCloseModal}
                />
            </FadeModal>
        </>
    );
};

export default AddBorrowRecordButton;