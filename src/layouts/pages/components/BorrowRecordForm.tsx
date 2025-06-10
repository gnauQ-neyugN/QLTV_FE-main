import React, { FormEvent, useEffect, useState } from "react";
import { Button, Chip, TextField, Typography, Grid, IconButton, Box, Paper, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { endpointBE } from "../../utils/Constant";
import { getIdUserByToken, isToken } from "../../utils/JwtService";
import CartItemModel from "../../../model/CartItemModel";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCartItem } from "../../utils/CartItemContext";
import { useBorrowCart } from "../../utils/BorrowCartContext";

interface BorrowRecordFormProps {
    cartItems: CartItemModel[];
    handleCloseModal?: any;
    onBorrowSuccess?: () => void; // Thêm prop mới này
}

const BorrowRecordForm: React.FC<BorrowRecordFormProps> = (props) => {
    const navigate = useNavigate();
    const [dueDate, setDueDate] = useState<string>(''); // Using string for HTML date inputs
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [idLibraryCard, setIdLibraryCard] = useState<number | null>(null);
    const { setCartList, setTotalCart } = useCartItem();
    const { setBorrowCartList, setTotalBorrowItems } = useBorrowCart(); // Thêm useBorrowCart hook

    // Calculate default, min and max dates
    const getFormattedDate = (daysToAdd: number): string => {
        const date = new Date();
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    const tomorrowFormatted = getFormattedDate(1);
    const thirtyDaysLaterFormatted = getFormattedDate(30);
    const defaultDueDateFormatted = getFormattedDate(14);

    // Set default due date on component mount
    useEffect(() => {
        setDueDate(defaultDueDateFormatted);
    }, [defaultDueDateFormatted]);

    // Fetch user's library card on component mount
    useEffect(() => {
        if (!isToken()) {
            toast.warning("Bạn cần đăng nhập để sử dụng tính năng này");
            navigate("/login");
            return;
        }

        // Fetch the user's library card ID
        const token = localStorage.getItem("token");
        fetch(`${endpointBE}/users/${getIdUserByToken()}/libraryCard`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.idLibraryCard) {
                    setIdLibraryCard(data.idLibraryCard);
                } else {
                    toast.error("Bạn chưa có thẻ thư viện hoặc thẻ chưa được kích hoạt");
                    if (props.handleCloseModal) {
                        props.handleCloseModal();
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching library card:", error);
                toast.error("Không thể lấy thông tin thẻ thư viện");
            });
    }, [navigate, props]);

    // Calculate total books
    const totalBooks = props.cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Format date from YYYY-MM-DD to DD/MM/YYYY for display purposes
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // Handle form submission
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isToken()) {
            toast.warning("Bạn cần đăng nhập để sử dụng tính năng này");
            navigate("/login");
            return;
        }

        if (!idLibraryCard) {
            toast.error("Bạn chưa có thẻ thư viện hoặc thẻ chưa được kích hoạt");
            return;
        }

        if (!dueDate) {
            toast.error("Vui lòng chọn ngày hẹn trả");
            return;
        }

        setSubmitting(true);

        // Prepare the book data
        const bookData = props.cartItems.map(item => ({
            book: item.book,
            quantity: item.quantity
        }));

        // Create borrow record request object
        const borrowRecordRequest = {
            dueDate: dueDate, // Already in YYYY-MM-DD format
            notes: note,
            idLibraryCard: idLibraryCard,
            book: bookData
        };

        // Submit to API
        const token = localStorage.getItem("token");
        fetch(`${endpointBE}/borrow-record/add-borrow-record`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(borrowRecordRequest)
        })
            .then(response => {
                if (response.ok) {
                    // Xóa giỏ mượn sách
                    localStorage.removeItem("borrowCart");
                    setBorrowCartList([]);
                    setTotalBorrowItems(0);

                    // Đóng modal
                    if (props.handleCloseModal) {
                        props.handleCloseModal();
                    }

                    // Hiển thị thông báo thành công
                    toast.success("Đăng ký mượn sách thành công");

                    // Nếu có callback onBorrowSuccess thì gọi nó
                    if (props.onBorrowSuccess) {
                        props.onBorrowSuccess();
                    } else {
                        // Nếu không có callback, thì tự chuyển hướng
                        navigate("/borrow-records");
                    }
                } else {
                    return response.text().then(text => {
                        throw new Error(text || "Có lỗi xảy ra khi đăng ký mượn sách");
                    });
                }
            })
            .catch(error => {
                console.error("Error creating borrow record:", error);
                toast.error(error.message || "Có lỗi xảy ra khi đăng ký mượn sách");
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <div className="container bg-white p-4 rounded">
            <Typography variant="h5" component="h2" className="text-center mb-4">
                ĐĂNG KÝ MƯỢN SÁCH
            </Typography>

            <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                    <div className="col-md-6">
                        <Typography variant="subtitle1" className="mb-2">
                            Thông tin phiếu mượn
                        </Typography>

                        <TextField
                            label="Ngày hẹn trả"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: tomorrowFormatted,
                                max: thirtyDaysLaterFormatted
                            }}
                            fullWidth
                            sx={{ marginBottom: '16px' }}
                            helperText={dueDate ? `Hiển thị: ${formatDateForDisplay(dueDate)}` : ''}
                        />

                        <TextField
                            label="Ghi chú"
                            multiline
                            rows={4}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            fullWidth
                        />
                    </div>

                    <div className="col-md-6">
                        <Typography variant="subtitle1" className="mb-2">
                            Thống kê
                        </Typography>
                        <Box border={1} borderColor="grey.300" borderRadius={1} p={2}>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Tổng số sách:</span>
                                <strong>{totalBooks}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Tổng số đầu sách:</span>
                                <strong>{props.cartItems.length}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Trạng thái:</span>
                                <Chip
                                    label="Chờ xác nhận"
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                />
                            </div>
                        </Box>
                    </div>
                </div>

                <Typography variant="subtitle1" className="mb-2">
                    Sách đăng ký mượn
                </Typography>

                {/* New cart item list with better alignment */}
                <Paper variant="outlined" className="mb-4">
                    <Box p={2}>
                        <Typography variant="subtitle1" sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 2 }}>
                            Số lượng sách: {totalBooks} cuốn ({props.cartItems.length} đầu sách)
                        </Typography>

                        <Box display="flex" justifyContent="space-between" fontWeight="bold" pb={1} mb={2} borderBottom={1} borderColor="divider">
                            <Box width="60%">Sản phẩm</Box>
                            <Box width="20%" textAlign="center">Số lượng</Box>
                        </Box>

                        {props.cartItems.map((item, index) => (
                            <Box key={index} display="flex" alignItems="center" justifyContent="space-between" py={2} borderBottom={index < props.cartItems.length - 1 ? 1 : 0} borderColor="divider">
                                <Box width="60%" display="flex" alignItems="center">
                                    <Box component="img" src={item.book.thumbnail || "/placeholder-book.jpg"} alt={item.book.nameBook} sx={{ width: 80, height: 100, objectFit: 'cover', mr: 2 }} />
                                    <Box>
                                        <Typography variant="subtitle1">{item.book.nameBook}</Typography>
                                    </Box>
                                </Box>

                                <Box width="20%" display="flex" alignItems="center" justifyContent="center">
                                    <TextField
                                        value={item.quantity}
                                        inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                        size="small"
                                        sx={{ width: '60px', mx: 1 }}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <div className="d-flex justify-content-end">
                    {props.handleCloseModal && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={props.handleCloseModal}
                            className="me-2"
                        >
                            Hủy
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={submitting || !idLibraryCard}
                    >
                        {submitting ? "Đang xử lý..." : "Đăng ký mượn sách"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default BorrowRecordForm;