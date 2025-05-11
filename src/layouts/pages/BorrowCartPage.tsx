import React, { useEffect, useState } from "react";
import { Button, Typography, IconButton, TextField, Tooltip } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { isToken } from "../utils/JwtService";
import { useBorrowCart } from "../utils/BorrowCartContext";
import BookCartProps from "../products/components/BookCartProps";
import {
    Delete as DeleteIcon,
    DeleteOutline as DeleteOutlineIcon,
    Search as SearchIcon,
    History as HistoryIcon,
    ArrowForward as ArrowForwardIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { FadeModal } from "../utils/FadeModal";
import BorrowRecordForm from "./components/BorrowRecordForm";
import useScrollToTop from "../../hooks/ScrollToTop";

// Giới hạn tổng số sách có thể mượn
const MAX_TOTAL_BOOKS = 4;

const BorrowCartPage: React.FC = () => {
    useScrollToTop();
    const navigate = useNavigate();
    const { borrowCartList, setBorrowCartList, setTotalBorrowItems } = useBorrowCart();
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        setTotalBorrowItems(borrowCartList.length);
    }, [borrowCartList, setTotalBorrowItems]);

    // Handle removing a book from the borrow cart
    const handleRemoveBook = (idBook: number) => {
        const newBorrowCartList = borrowCartList.filter(
            (cartItem) => cartItem.book.idBook !== idBook
        );
        localStorage.setItem("borrowCart", JSON.stringify(newBorrowCartList));
        setBorrowCartList(newBorrowCartList);
        setTotalBorrowItems(newBorrowCartList.length);
        toast.success("Xoá sách khỏi phiếu mượn thành công");
    };

    // Handle clearing the entire borrow cart
    const handleClearBorrowCart = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sách trong phiếu mượn?")) {
            localStorage.removeItem("borrowCart");
            setBorrowCartList([]);
            setTotalBorrowItems(0);
            toast.success("Đã xóa tất cả sách trong phiếu mượn");
        }
    };

    // Tính tổng số sách trong phiếu mượn
    const getTotalBooks = () => {
        return borrowCartList.reduce((total, item) => total + item.quantity, 0);
    };

    // Tính số sách còn lại có thể thêm vào phiếu mượn
    const getRemainingBooks = () => {
        const totalBooks = getTotalBooks();
        return Math.max(0, MAX_TOTAL_BOOKS - totalBooks);
    };

    // Kiểm tra nếu vượt quá giới hạn
    const isExceedingLimit = () => {
        return getTotalBooks() > MAX_TOTAL_BOOKS;
    };

    // Handle updating book quantity with validation for max total books
    const handleUpdateQuantity = (idBook: number, newQuantity: number) => {
        // Đảm bảo số lượng không âm
        if (newQuantity < 1) {
            newQuantity = 1;
        }

        // Lấy thông tin cuốn sách hiện tại
        const currentItem = borrowCartList.find((cartItem) => cartItem.book.idBook === idBook);
        if (!currentItem) return;

        // Tính toán sự thay đổi số lượng
        const quantityChange = newQuantity - currentItem.quantity;

        // Tính tổng số sách sau khi cập nhật
        const totalBooksAfterUpdate = getTotalBooks() + quantityChange;

        // Kiểm tra nếu vượt quá giới hạn
        if (totalBooksAfterUpdate > MAX_TOTAL_BOOKS) {
            // Tính số lượng tối đa có thể thêm
            const maxAllowedQuantity = currentItem.quantity + getRemainingBooks();

            if (maxAllowedQuantity <= currentItem.quantity) {
                toast.warning(`Không thể tăng số lượng. Tổng số sách không được vượt quá ${MAX_TOTAL_BOOKS} quyển.`);
                return;
            } else {
                newQuantity = maxAllowedQuantity;
                toast.warning(`Số lượng đã được điều chỉnh để tổng số sách không vượt quá ${MAX_TOTAL_BOOKS} quyển.`);
            }
        }

        const newBorrowCartList = borrowCartList.map((cartItem) => {
            if (cartItem.book.idBook === idBook) {
                return { ...cartItem, quantity: newQuantity };
            }
            return cartItem;
        });

        localStorage.setItem("borrowCart", JSON.stringify(newBorrowCartList));
        setBorrowCartList(newBorrowCartList);
    };

    // Handle incrementing book quantity
    const handleIncreaseQuantity = (idBook: number, currentQuantity: number) => {
        handleUpdateQuantity(idBook, currentQuantity + 1);
    };

    // Handle decrementing book quantity
    const handleDecreaseQuantity = (idBook: number, currentQuantity: number) => {
        if (currentQuantity > 1) { // Không cho phép số lượng nhỏ hơn    1
            handleUpdateQuantity(idBook, currentQuantity - 1);
        }
    };

    // Handle direct input of quantity
    const handleQuantityInputChange = (idBook: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value)) {
            handleUpdateQuantity(idBook, value);
        }
    };

    // Kiểm tra nếu nút tăng số lượng nên bị vô hiệu hóa
    const isIncreaseDisabled = (currentQuantity: number) => {
        return getTotalBooks() >= MAX_TOTAL_BOOKS;
    };

    // Hàm xử lý khi đăng ký mượn thành công
    const handleBorrowSuccess = () => {
        // Xóa giỏ mượn sách
        localStorage.removeItem("borrowCart");
        setBorrowCartList([]);
        setTotalBorrowItems(0);
        // Đóng modal
        setOpenModal(false);
        // Chuyển hướng đến trang lịch sử mượn
        navigate("/borrow-records");
    };

    // Handle opening the borrow modal
    const handleOpenBorrowModal = () => {
        if (!isToken()) {
            toast.warning("Bạn cần đăng nhập để sử dụng tính năng này");
            navigate("/login");
            return;
        }

        if (borrowCartList.length === 0) {
            toast.warning("Phiếu mượn của bạn đang trống");
            return;
        }

        if (isExceedingLimit()) {
            toast.error(`Không thể đăng ký mượn sách. Tổng số sách vượt quá giới hạn ${MAX_TOTAL_BOOKS} quyển.`);
            return;
        }

        setOpenModal(true);
    };

    // Handle closing the borrow modal
    const handleCloseBorrowModal = () => {
        setOpenModal(false);
    };

    // Kiểm tra trạng thái phiếu mượn để hiển thị cảnh báo phù hợp
    const getCartStatus = () => {
        const totalBooks = getTotalBooks();
        if (totalBooks > MAX_TOTAL_BOOKS) {
            return {
                type: "error",
                message: `Vượt quá giới hạn! Vui lòng giảm số lượng sách xuống tối đa ${MAX_TOTAL_BOOKS} quyển để tiếp tục.`,
                icon: <WarningIcon fontSize="small" style={{ marginRight: '8px' }} />
            };
        } else if (totalBooks === MAX_TOTAL_BOOKS) {
            return {
                type: "warning",
                message: `Đã đạt giới hạn tối đa ${MAX_TOTAL_BOOKS} quyển sách.`,
                icon: <InfoIcon fontSize="small" style={{ marginRight: '8px' }} />
            };
        } else {
            return {
                type: "info",
                message: `Bạn có thể mượn tối đa ${MAX_TOTAL_BOOKS} quyển sách. Hiện tại đã chọn ${totalBooks} quyển, còn có thể thêm ${getRemainingBooks()} quyển.`,
                icon: <InfoIcon fontSize="small" style={{ marginRight: '8px' }} />
            };
        }
    };

    const cartStatus = getCartStatus();

    return (
        <div className="container my-5">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="fw-bold text-primary">Phiếu mượn sách</h2>
                </div>
            </div>

            {borrowCartList.length === 0 ? (
                <div className="text-center my-5 p-5 bg-light rounded shadow">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/1170/1170678.png"
                        alt="Empty cart"
                        style={{ width: '120px', opacity: '0.6' }}
                        className="mb-3"
                    />
                    <h4 className="mb-3">Phiếu mượn của bạn đang trống</h4>
                    <p className="text-muted mb-4">Hãy thêm sách vào phiếu mượn để tiếp tục</p>
                    <Link to="/search" className="text-decoration-none">
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SearchIcon />}
                        >
                            Tìm sách ngay
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-light py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <h5 className="mb-0">
                                        <span className={`badge ${isExceedingLimit() ? 'bg-danger' : 'bg-primary'} me-2`}>{getTotalBooks()}</span>
                                        cuốn sách ({borrowCartList.length} đầu sách)
                                    </h5>
                                    <Tooltip title={`Bạn có thể mượn tối đa ${MAX_TOTAL_BOOKS} quyển sách. Còn ${getRemainingBooks()} quyển có thể thêm.`}>
                                        <InfoIcon fontSize="small" color="primary" style={{ marginLeft: '8px', cursor: 'pointer' }} />
                                    </Tooltip>
                                </div>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleClearBorrowCart}
                                >
                                    Xóa tất cả
                                </Button>
                            </div>
                        </div>

                        <div className="card-body p-0">
                            <div className={`alert alert-${cartStatus.type} m-2`} role="alert">
                                <div className="d-flex align-items-center">
                                    {cartStatus.icon}
                                    <span>{cartStatus.message}</span>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                    <tr>
                                        <th className="ps-4" style={{ width: '50%' }}>Sản phẩm</th>
                                        <th className="text-center" style={{ width: '30%' }}>Số lượng</th>
                                        <th className="text-center" style={{ width: '20%' }}>Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {borrowCartList.map((cartItem) => (
                                        <tr key={cartItem.book.idBook}>
                                            <td className="align-middle ps-4">
                                                <div className="d-flex align-items-center">
                                                    {cartItem.book.thumbnail && (
                                                        <img
                                                            src={cartItem.book.thumbnail}
                                                            alt={cartItem.book.nameBook}
                                                            className="me-3"
                                                            style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    <div>
                                                        <h6 className="mb-1">{cartItem.book.nameBook}</h6>
                                                        <small className="text-muted">
                                                            {cartItem.book.author || 'Chưa có tác giả'}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle text-center">
                                                <div className="d-flex justify-content-center align-items-center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDecreaseQuantity(cartItem.book.idBook, cartItem.quantity)}
                                                        disabled={cartItem.quantity <= 1}
                                                    >
                                                        <RemoveIcon fontSize="small" />
                                                    </IconButton>
                                                    <TextField
                                                        value={cartItem.quantity}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                            handleQuantityInputChange(cartItem.book.idBook, e)
                                                        }
                                                        inputProps={{
                                                            min: 1,
                                                            style: { textAlign: 'center' }
                                                        }}
                                                        size="small"
                                                        sx={{ width: '60px', mx: 1 }}
                                                    />
                                                    <Tooltip title={isIncreaseDisabled(cartItem.quantity) ?
                                                        `Đã đạt giới hạn tối đa ${MAX_TOTAL_BOOKS} quyển sách` :
                                                        "Tăng số lượng"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleIncreaseQuantity(cartItem.book.idBook, cartItem.quantity)}
                                                                disabled={isIncreaseDisabled(cartItem.quantity)}
                                                            >
                                                                <AddIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                            <td className="align-middle text-center">
                                                <Button
                                                    variant="text"
                                                    color="error"
                                                    startIcon={<DeleteOutlineIcon />}
                                                    onClick={() => handleRemoveBook(cartItem.book.idBook)}
                                                >
                                                    Xóa
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4 mb-5">
                        <Link to="/borrow-records" className="text-decoration-none">
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<HistoryIcon />}
                            >
                                Xem lịch sử mượn
                            </Button>
                        </Link>
                        <Tooltip
                            title={isExceedingLimit() ? `Vượt quá giới hạn ${MAX_TOTAL_BOOKS} quyển. Vui lòng giảm số lượng để tiếp tục.` : ""}
                            placement="top"
                        >
                            <span>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={handleOpenBorrowModal}
                                    disabled={isExceedingLimit() || borrowCartList.length === 0}
                                >
                                    Đăng ký mượn sách
                                </Button>
                            </span>
                        </Tooltip>
                    </div>
                </>
            )}

            <FadeModal
                open={openModal}
                handleOpen={handleOpenBorrowModal}
                handleClose={handleCloseBorrowModal}
            >
                <BorrowRecordForm
                    cartItems={borrowCartList}
                    handleCloseModal={handleCloseBorrowModal}
                    onBorrowSuccess={handleBorrowSuccess}
                />
            </FadeModal>
        </div>
    );
};

export default BorrowCartPage;