import React, { FormEvent, useEffect, useState } from "react";
import {
    Typography,
    TextField,
    Box,
    Button,
    Grid,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Autocomplete,
    Card,
    CardContent,
    Divider,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";
import BookItemModel from "../../../model/BookItemModel";
import BookModel from "../../../model/BookModel";
import { getAllBook } from "../../../api/BookApi";
import { getBookItemById, updateBookItem, createBookItem } from "../../../api/BookItemApi";

interface BookItemFormProps {
    id: number;
    option: "add" | "update" | "view";
    setKeyCountReload?: any;
    handleCloseModal: any;
}

const BOOK_STATUS_OPTIONS = [
    { value: "AVAILABLE", label: "Có sẵn" },
    { value: "BORROWED", label: "Đã mượn" },
    { value: "RESERVED", label: "Đã đặt trước" },
    { value: "MAINTENANCE", label: "Bảo trì" },
    { value: "LOST", label: "Mất" },
    { value: "DAMAGED", label: "Hỏng" },
];

const CONDITION_OPTIONS = [
    { value: 1, label: "Rất tệ" },
    { value: 2, label: "Tệ" },
    { value: 3, label: "Bình thường" },
    { value: 4, label: "Tốt" },
    { value: 5, label: "Rất tốt" },
];

export const BookItemForm: React.FC<BookItemFormProps> = (props) => {
    const [bookItem, setBookItem] = useState<BookItemModel>({
        idBookItem: 0,
        barcode: "",
        status: "AVAILABLE",
        location: "",
        condition: 5,
        book: {
            idBook: 0,
            nameBook: "",
            author: "",
            isbn: "",
            description: "",
            listPrice: 0,
            sellPrice: 0,
            quantityForSold: 0,
            quantityForBorrow: 0,
            borrowQuantity: 0,
            avgRating: 0,
            soldQuantity: 0,
            discountPercent: 0,
            thumbnail: "",
            relatedImg: [],
            idGenres: [],
            idDdcCategory: [],
        },
    });

    const [booksList, setBooksList] = useState<BookModel[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookModel | null>(null);
    const [statusBtn, setStatusBtn] = useState(false);

    // Lấy dữ liệu khi update hoặc view
    useEffect(() => {
        if (props.option === "update" || props.option === "view") {
            getBookItemById(props.id)
                .then((response) => {
                    setBookItem(response);
                    setSelectedBook(response.book);
                })
                .catch((error) => {
                    console.error("Error fetching book item:", error);
                    toast.error("Không thể tải thông tin BookItem");
                });
        }
    }, [props.option, props.id]);

    // Lấy danh sách sách
    useEffect(() => {
        getAllBook(1000, 0)
            .then((response) => {
                setBooksList(response.bookList);
            })
            .catch((error) => {
                console.error("Error fetching books:", error);
                toast.error("Không thể tải danh sách sách");
            });
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedBook) {
            toast.error("Vui lòng chọn sách");
            return;
        }

        setStatusBtn(true);

        const bookItemRequest = {
            ...bookItem,
            book: selectedBook,
        };

        try {
            if (props.option === "add") {
                await createBookItem(bookItemRequest);
                toast.success("Thêm BookItem thành công");
            } else {
                await updateBookItem(bookItemRequest);
                toast.success("Cập nhật BookItem thành công");
            }

            // Reset form
            setBookItem({
                idBookItem: 0,
                barcode: "",
                status: "AVAILABLE",
                location: "",
                condition: 5,
                book: {
                    idBook: 0,
                    nameBook: "",
                    author: "",
                    isbn: "",
                    description: "",
                    listPrice: 0,
                    sellPrice: 0,
                    quantityForSold: 0,
                    quantityForBorrow: 0,
                    borrowQuantity: 0,
                    avgRating: 0,
                    soldQuantity: 0,
                    discountPercent: 0,
                    thumbnail: "",
                    relatedImg: [],
                    idGenres: [],
                    idDdcCategory: [],
                },
            });
            setSelectedBook(null);
            props.setKeyCountReload?.(Math.random());
            props.handleCloseModal();
        } catch (error) {
            console.error("Error saving book item:", error);
            toast.error("Lỗi khi lưu BookItem");
        } finally {
            setStatusBtn(false);
        }
    };

    // Render chi tiết BookItem khi option = "view"
    if (props.option === "view") {
        return (
            <div>
                <Typography className="text-center" variant="h4" component="h2">
                    CHI TIẾT BOOKITEM
                </Typography>
                <hr />
                <div className="container px-5">
                    <Grid container spacing={3}>
                        {/* Thông tin BookItem */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "primary.main" }}>
                                        Thông tin BookItem
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>ID:</strong> {bookItem.idBookItem}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Mã vạch:</strong> {bookItem.barcode}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Trạng thái:</strong>{" "}
                                                {BOOK_STATUS_OPTIONS.find(opt => opt.value === bookItem.status)?.label || bookItem.status}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Vị trí:</strong> {bookItem.location}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Tình trạng:</strong>{" "}
                                                {CONDITION_OPTIONS.find(opt => opt.value === bookItem.condition)?.label || bookItem.condition}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Thông tin sách */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "primary.main" }}>
                                        Thông tin sách
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Tên sách:</strong> {bookItem.book?.nameBook}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Tác giả:</strong> {bookItem.book?.author}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>ISBN:</strong> {bookItem.book?.isbn}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body1">
                                                <strong>Giá:</strong> {bookItem.book?.sellPrice?.toLocaleString("vi-VN")}₫
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Nút đóng */}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={props.handleCloseModal}
                            sx={{ minWidth: 120 }}
                        >
                            Đóng
                        </Button>
                    </Box>
                </div>
            </div>
        );
    }

    // Render form thêm/sửa
    return (
        <div>
            <Typography className="text-center" variant="h4" component="h2">
                {props.option === "add" ? "TẠO BOOKITEM" : "SỬA BOOKITEM"}
            </Typography>
            <hr />
            <div className="container px-5">
                <form onSubmit={handleSubmit} className="form">
                    <input type="hidden" id="idBookItem" value={bookItem?.idBookItem} hidden />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ "& .MuiTextField-root": { mb: 3 } }}>
                                <TextField
                                    required
                                    label="Vị trí"
                                    fullWidth
                                    value={bookItem.location}
                                    onChange={(e) =>
                                        setBookItem({ ...bookItem, location: e.target.value })
                                    }
                                    size="small"
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    <LoadingButton
                        className="w-100 my-3"
                        type="submit"
                        loading={statusBtn}
                        variant="outlined"
                        sx={{ width: "25%", padding: "10px" }}
                    >
                        {props.option === "add" ? "Tạo BookItem" : "Lưu BookItem"}
                    </LoadingButton>
                </form>
            </div>
        </div>
    );
};