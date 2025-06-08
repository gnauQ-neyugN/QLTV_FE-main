import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Autocomplete,
    CircularProgress,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Divider,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { createBorrowRecord } from '../../../api/BorrowRecordApi';
import { toast } from 'react-toastify';
import { endpointBE } from '../../../layouts/utils/Constant';
import { request } from '../../../api/Request';
import BookModel from '../../../model/BookModel';

interface BorrowRecordCreateProps {
    handleCloseModal: () => void;
    setKeyCountReload?: (value: number) => void;
}

interface LibraryCard {
    idLibraryCard: number;
    cardNumber: string;
    activated: boolean;
    userName: string;
}

interface CartItem {
    book: BookModel;
    quantity: number;
}

const BorrowRecordCreate: React.FC<BorrowRecordCreateProps> = ({ handleCloseModal, setKeyCountReload }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [libraryCards, setLibraryCards] = useState<LibraryCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<LibraryCard | null>(null);
    const [books, setBooks] = useState<BookModel[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookModel | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [loadingBooks, setLoadingBooks] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch library cards
    useEffect(() => {
        const fetchLibraryCards = async () => {
            setLoadingCards(true);
            try {
                // Get all library cards that are activated
                const response = await request(`${endpointBE}/library-cards?projection=full`);

                if (response && response._embedded && response._embedded.libraryCards) {
                    // Process library cards
                    const activeCards = await Promise.all(
                        response._embedded.libraryCards
                            .filter((card: any) => card.activated) // Only activated cards
                            .map(async (card: any) => {
                                try {
                                    // Get user for each library card
                                    const userdata = await card._embedded.user;
                                    return {
                                        idLibraryCard: card.idLibraryCard,
                                        cardNumber: card.cardNumber,
                                        activated: card.activated,
                                        userName: userdata.username
                                    };
                                } catch (error) {
                                    console.error('Error fetching user for card:', error);
                                    return {
                                        idLibraryCard: card.idLibraryCard,
                                        cardNumber: card.cardNumber,
                                        activated: card.activated,
                                        userName: 'Unknown'
                                    };
                                }
                            })
                    );
                    setLibraryCards(activeCards);
                }
            } catch (error) {
                console.error('Error fetching library cards:', error);
                setError('Không thể tải thông tin thẻ thư viện. Vui lòng thử lại sau.');
            } finally {
                setLoadingCards(false);
            }
        };

        fetchLibraryCards();
    }, []);

    // Fetch books
    useEffect(() => {
        const fetchBooks = async () => {
            setLoadingBooks(true);
            try {
                const response = await request(`${endpointBE}/books?size=1000`);

                if (response && response._embedded && response._embedded.books) {
                    // Process books to include images
                    const booksWithImages = await Promise.all(
                        response._embedded.books.map(async (book: BookModel) => {
                            try {
                                // Get images for the book
                                const imagesResponse = await request(`${endpointBE}/books/${book.idBook}/listImages`);
                                const thumbnail = imagesResponse._embedded.images.find((img: any) => img.thumbnail);
                                return {
                                    ...book,
                                    thumbnail: thumbnail ? thumbnail.urlImage : '',
                                };
                            } catch (error) {
                                console.error(`Error fetching images for book ${book.idBook}:`, error);
                                return book;
                            }
                        })
                    );
                    setBooks(booksWithImages);
                }
            } catch (error) {
                console.error('Error fetching books:', error);
                setError('Không thể tải thông tin sách. Vui lòng thử lại sau.');
            } finally {
                setLoadingBooks(false);
            }
        };

        fetchBooks();
    }, []);

    const handleAddToCart = () => {
        if (!selectedBook) {
            toast.warning('Vui lòng chọn sách');
            return;
        }

        if (quantity <= 0) {
            toast.warning('Số lượng phải lớn hơn 0');
            return;
        }

        if (quantity > selectedBook.quantityForBorrow!) {
            toast.warning(`Chỉ còn ${selectedBook.quantityForBorrow} quyển sách này trong kho`);
            return;
        }

        // Check if book already exists in cart
        const existingItemIndex = cartItems.findIndex(item => item.book.idBook === selectedBook.idBook);

        if (existingItemIndex >= 0) {
            // Update quantity if book already exists
            const newCartItems = [...cartItems];
            const newQuantity = newCartItems[existingItemIndex].quantity + quantity;

            if (newQuantity > selectedBook.quantityForBorrow!) {
                toast.warning(`Chỉ còn ${selectedBook.quantityForBorrow} quyển sách này trong kho`);
                return;
            }

            newCartItems[existingItemIndex].quantity = newQuantity;
            setCartItems(newCartItems);
        } else {
            // Add new book to cart
            setCartItems([...cartItems, { book: selectedBook, quantity }]);
        }

        // Reset selection
        setSelectedBook(null);
        setQuantity(1);
    };

    const handleRemoveFromCart = (index: number) => {
        const newCartItems = [...cartItems];
        newCartItems.splice(index, 1);
        setCartItems(newCartItems);
    };

    const [borrowDate, setBorrowDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState<string>(
        new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0]
    );

    const handleSubmit = async () => {
        if (!selectedCard) {
            toast.warning('Vui lòng chọn thẻ thư viện');
            return;
        }

        if (cartItems.length === 0) {
            toast.warning('Vui lòng thêm ít nhất một quyển sách');
            return;
        }

        // Validate dates
        if (!borrowDate) {
            toast.warning('Vui lòng chọn ngày mượn');
            return;
        }

        if (!dueDate) {
            toast.warning('Vui lòng chọn ngày hẹn trả');
            return;
        }

        // Check if due date is after borrow date
        if (new Date(dueDate) <= new Date(borrowDate)) {
            toast.warning('Ngày hẹn trả phải sau ngày mượn');
            return;
        }

        setSubmitting(true);

        try {
            // Prepare data for API call
            const borrowRecordData = {
                idLibraryCard: selectedCard.idLibraryCard,
                borrowDate: borrowDate,
                dueDate: dueDate,
                notes: notes,
                book: cartItems.map(item => ({
                    book: {
                        idBook: item.book.idBook
                    },
                    quantity: item.quantity
                }))
            };

            // Make API call
            await createBorrowRecord(borrowRecordData);

            toast.success('Tạo phiếu mượn thành công');

            // Reload data in parent component
            if (setKeyCountReload) {
                setKeyCountReload(Math.random());
            }

            // Close modal
            handleCloseModal();
        } catch (error: any) {
            console.error('Error creating borrow record:', error);
            toast.error(error.message || 'Lỗi khi tạo phiếu mượn');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box className="container bg-white p-4 rounded">
            <Typography variant="h5" component="h2" className="text-center mb-4">
                TẠO PHIẾU MƯỢN MỚI
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Thông tin độc giả
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Autocomplete
                            id="library-card-select"
                            options={libraryCards}
                            getOptionLabel={(option) => `${option.cardNumber} - ${option.userName}`}
                            loading={loadingCards}
                            value={selectedCard}
                            onChange={(event, newValue) => {
                                setSelectedCard(newValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Chọn thẻ thư viện"
                                    fullWidth
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingCards ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        {selectedCard && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Thông tin độc giả
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Mã thẻ
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {selectedCard.cardNumber}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Tên độc giả
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {selectedCard.userName}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Trạng thái thẻ
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium" color="success.main">
                                            Đã kích hoạt
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Thêm sách
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Autocomplete
                                id="book-select"
                                options={books}
                                getOptionLabel={(option) => `${option.nameBook} - ${option.author}`}
                                loading={loadingBooks}
                                value={selectedBook}
                                onChange={(event, newValue) => {
                                    setSelectedBook(newValue);
                                }}
                                sx={{ flexGrow: 1 }}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            {option.thumbnail && (
                                                <img
                                                    src={option.thumbnail}
                                                    alt={option.nameBook}
                                                    width="40"
                                                    height="60"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            )}
                                            <Box>
                                                <Typography variant="body1">{option.nameBook}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {option.author} - Còn lại: {option.quantityForBorrow}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Chọn sách"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loadingBooks ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            <TextField
                                label="Số lượng"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                InputProps={{ inputProps: { min: 1, max: selectedBook?.quantityForBorrow || 1 } }}
                                sx={{ width: '100px' }}
                            />

                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddToCart}
                                disabled={!selectedBook}
                            >
                                Thêm
                            </Button>
                        </Box>

                        {selectedBook && (
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                {selectedBook.thumbnail && (
                                    <img
                                        src={selectedBook.thumbnail}
                                        alt={selectedBook.nameBook}
                                        width="60"
                                        height="80"
                                        style={{ objectFit: 'cover' }}
                                    />
                                )}
                                <Box>
                                    <Typography variant="body1">{selectedBook.nameBook}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Tác giả: {selectedBook.author}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Số lượng còn lại: {selectedBook.quantityForBorrow}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Danh sách sách mượn {cartItems.length > 0 && `(${cartItems.length} đầu sách)`}
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                                <TableRow>
                                    <TableCell width="60">STT</TableCell>
                                    <TableCell>Sách</TableCell>
                                    <TableCell align="center">Số lượng</TableCell>
                                    <TableCell align="center" width="100">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cartItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                Chưa có sách nào được thêm
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cartItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {item.book.thumbnail && (
                                                        <img
                                                            src={item.book.thumbnail}
                                                            alt={item.book.nameBook}
                                                            width="40"
                                                            height="60"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    <Box>
                                                        <Typography variant="body1">{item.book.nameBook}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {item.book.author}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleRemoveFromCart(index)}
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Ghi chú
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <TextField
                            label="Ghi chú phiếu mượn"
                            multiline
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            fullWidth
                        />
                    </Paper>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCloseModal}
                >
                    Hủy
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedCard || cartItems.length === 0}
                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                    {submitting ? "Đang xử lý..." : "Tạo phiếu mượn"}
                </Button>
            </Box>
        </Box>
    );
};

export default BorrowRecordCreate;