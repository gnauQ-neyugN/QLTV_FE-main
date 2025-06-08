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
    Chip,
    Card,
    CardContent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { createBorrowRecord } from '../../../api/BorrowRecordApi';
import { toast } from 'react-toastify';
import { endpointBE } from '../../../layouts/utils/Constant';
import { request } from '../../../api/Request';

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

interface BookModel {
    idBook: number;
    nameBook: string;
    author: string;
    quantityForBorrow: number;
    thumbnail?: string;
}

interface BookItemModel {
    idBookItem: number;
    barcode: string;
    status: string;
    location: string;
    condition: number;
    book: BookModel;
}

interface CartItem {
    bookItem: BookItemModel;
}

const BorrowRecordCreate: React.FC<BorrowRecordCreateProps> = ({ handleCloseModal, setKeyCountReload }) => {
    const [submitting, setSubmitting] = useState(false);
    const [libraryCards, setLibraryCards] = useState<LibraryCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<LibraryCard | null>(null);
    const [books, setBooks] = useState<BookModel[]>([]);
    const [availableBookItems, setAvailableBookItems] = useState<BookItemModel[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookModel | null>(null);
    const [selectedBookItem, setSelectedBookItem] = useState<BookItemModel | null>(null);
    const [notes, setNotes] = useState<string>('');
    const [loadingBooks, setLoadingBooks] = useState(false);
    const [loadingBookItems, setLoadingBookItems] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch library cards
    useEffect(() => {
        const fetchLibraryCards = async () => {
            setLoadingCards(true);
            try {
                const response = await request(`http://localhost:8080/library-cards?projection=full`);

                if (response && response._embedded && response._embedded.libraryCards) {
                    const activeCards = await Promise.all(
                        response._embedded.libraryCards
                            .filter((card: any) => card.activated)
                            .map(async (card: any) => {
                                try {
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
                const response = await request(`http://localhost:8080/books?size=1000`);

                if (response && response._embedded && response._embedded.books) {
                    const booksWithImages = await Promise.all(
                        response._embedded.books
                            .filter((book: BookModel) => book.quantityForBorrow > 0)
                            .map(async (book: BookModel) => {
                                try {
                                    const imagesResponse = await request(`http://localhost:8080/books/${book.idBook}/listImages`);
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

    // Fetch available book items when a book is selected
    useEffect(() => {
        const fetchAvailableBookItems = async () => {
            if (!selectedBook) {
                setAvailableBookItems([]);
                return;
            }

            setLoadingBookItems(true);
            try {
                const response = await request(`http://localhost:8080/books/${selectedBook.idBook}/listBookItems`);

                if (response && response._embedded && response._embedded.bookItems) {
                    const availableItems = response._embedded.bookItems.filter((item: any) =>
                        item.status === 'AVAILABLE' || item.status === 'Có sẵn'
                    );

                    setAvailableBookItems(availableItems.map((item: any) => ({
                        idBookItem: item.idBookItem,
                        barcode: item.barcode,
                        status: item.status,
                        location: item.location,
                        condition: item.condition,
                        book: selectedBook
                    })));
                } else {
                    setAvailableBookItems([]);
                }
            } catch (error) {
                console.error('Error fetching book items:', error);
                setAvailableBookItems([]);
            } finally {
                setLoadingBookItems(false);
            }
        };

        fetchAvailableBookItems();
    }, [selectedBook]);

    const handleAddToCart = () => {
        if (!selectedBookItem) {
            alert('Vui lòng chọn bản sao sách cụ thể');
            return;
        }

        const existingItem = cartItems.find(item => item.bookItem.idBookItem === selectedBookItem.idBookItem);
        if (existingItem) {
            alert('Bản sao sách này đã được thêm vào danh sách mượn');
            return;
        }

        setCartItems([...cartItems, { bookItem: selectedBookItem }]);
        setSelectedBook(null);
        setSelectedBookItem(null);
        setAvailableBookItems([]);
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
            alert('Vui lòng chọn thẻ thư viện');
            return;
        }

        if (cartItems.length === 0) {
            alert('Vui lòng thêm ít nhất một bản sao sách');
            return;
        }

        if (!borrowDate) {
            alert('Vui lòng chọn ngày mượn');
            return;
        }

        if (!dueDate) {
            alert('Vui lòng chọn ngày hẹn trả');
            return;
        }

        if (new Date(dueDate) <= new Date(borrowDate)) {
            alert('Ngày hẹn trả phải sau ngày mượn');
            return;
        }

        setSubmitting(true);

        try {
            const borrowRecordData = {
                idLibraryCard: selectedCard.idLibraryCard,
                borrowDate: borrowDate,
                dueDate: dueDate,
                notes: notes,
                bookItem: cartItems.map(item => ({
                    idBookItem: item.bookItem.idBookItem
                }))
            };

            const token = localStorage.getItem("token");
            const response = await fetch('http://localhost:8080/borrow-record/add-borrow-record', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(borrowRecordData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to create borrow record");
            }

            alert('Tạo phiếu mượn thành công');

            if (setKeyCountReload) {
                setKeyCountReload(Math.random());
            }

            handleCloseModal();
        } catch (error: any) {
            console.error('Error creating borrow record:', error);
            alert(error.message || 'Lỗi khi tạo phiếu mượn');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container bg-white p-4 rounded">
            <h2 className="text-center mb-4">TẠO PHIẾU MƯỢN MỚI</h2>

            {error && (
                <div className="alert alert-danger mb-3">
                    {error}
                </div>
            )}

            <div className="row">
                <div className="col-12 mb-4">
                    <h5 className="mb-2">Thông tin độc giả</h5>
                    <div className="card p-3">
                        <div className="mb-3">
                            <label className="form-label">Chọn thẻ thư viện</label>
                            <select
                                className="form-control"
                                value={selectedCard?.idLibraryCard || ''}
                                onChange={(e) => {
                                    const cardId = parseInt(e.target.value);
                                    const card = libraryCards.find(c => c.idLibraryCard === cardId);
                                    setSelectedCard(card || null);
                                }}
                                disabled={loadingCards}
                            >
                                <option value="">-- Chọn thẻ thư viện --</option>
                                {libraryCards.map(card => (
                                    <option key={card.idLibraryCard} value={card.idLibraryCard}>
                                        {card.cardNumber} - {card.userName}
                                    </option>
                                ))}
                            </select>
                            {loadingCards && <div className="text-muted mt-1">Đang tải...</div>}
                        </div>

                        {selectedCard && (
                            <div className="mt-2">
                                <h6>Thông tin độc giả</h6>
                                <div className="row">
                                    <div className="col-4">
                                        <small className="text-muted">Mã thẻ</small>
                                        <div className="fw-bold">{selectedCard.cardNumber}</div>
                                    </div>
                                    <div className="col-4">
                                        <small className="text-muted">Tên độc giả</small>
                                        <div className="fw-bold">{selectedCard.userName}</div>
                                    </div>
                                    <div className="col-4">
                                        <small className="text-muted">Trạng thái thẻ</small>
                                        <div className="fw-bold text-success">Đã kích hoạt</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-12 mb-4">
                    <h5 className="mb-2">Chọn sách và bản sao</h5>
                    <div className="card p-3">
                        <div className="row">
                            <div className="col-6">
                                <label className="form-label">Chọn sách</label>
                                <select
                                    className="form-control"
                                    value={selectedBook?.idBook || ''}
                                    onChange={(e) => {
                                        const bookId = parseInt(e.target.value);
                                        const book = books.find(b => b.idBook === bookId);
                                        setSelectedBook(book || null);
                                        setSelectedBookItem(null);
                                    }}
                                    disabled={loadingBooks}
                                >
                                    <option value="">-- Chọn sách --</option>
                                    {books.map(book => (
                                        <option key={book.idBook} value={book.idBook}>
                                            {book.nameBook} - {book.author} (Còn: {book.quantityForBorrow})
                                        </option>
                                    ))}
                                </select>
                                {loadingBooks && <div className="text-muted mt-1">Đang tải...</div>}
                            </div>

                            <div className="col-6">
                                <label className="form-label">Chọn bản sao cụ thể</label>
                                <select
                                    className="form-control"
                                    value={selectedBookItem?.idBookItem || ''}
                                    onChange={(e) => {
                                        const itemId = parseInt(e.target.value);
                                        const item = availableBookItems.find(i => i.idBookItem === itemId);
                                        setSelectedBookItem(item || null);
                                    }}
                                    disabled={!selectedBook || loadingBookItems}
                                >
                                    <option value="">-- Chọn bản sao --</option>
                                    {availableBookItems.map(item => (
                                        <option key={item.idBookItem} value={item.idBookItem}>
                                            {item.barcode} - {item.location} (Tình trạng: {item.condition}%)
                                        </option>
                                    ))}
                                </select>
                                {loadingBookItems && <div className="text-muted mt-1">Đang tải...</div>}
                            </div>
                        </div>

                        <div className="mt-2 d-flex justify-content-end">
                            <button
                                className="btn btn-primary"
                                onClick={handleAddToCart}
                                disabled={!selectedBookItem}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Thêm vào danh sách mượn
                            </button>
                        </div>

                        {selectedBook && (
                            <div className="card mt-2">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        {selectedBook.thumbnail && (
                                            <img
                                                src={selectedBook.thumbnail}
                                                alt={selectedBook.nameBook}
                                                width="60"
                                                height="80"
                                                style={{ objectFit: 'cover' }}
                                                className="me-3"
                                            />
                                        )}
                                        <div>
                                            <h6 className="fw-bold">{selectedBook.nameBook}</h6>
                                            <div className="text-muted">Tác giả: {selectedBook.author}</div>
                                            <div className="text-muted">Số lượng còn lại: {selectedBook.quantityForBorrow}</div>
                                            <div className="text-muted">Bản sao có sẵn: {availableBookItems.length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-12 mb-4">
                    <h5 className="mb-2">
                        Danh sách sách mượn {cartItems.length > 0 && `(${cartItems.length} bản sao)`}
                    </h5>

                    <div className="card">
                        <div className="table-responsive">
                            <table className="table table-striped mb-0">
                                <thead style={{ backgroundColor: "#f5f5f5" }}>
                                <tr>
                                    <th width="60">STT</th>
                                    <th>Sách</th>
                                    <th>Mã vạch</th>
                                    <th>Vị trí</th>
                                    <th>Tình trạng</th>
                                    <th width="100" className="text-center">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {cartItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-3">
                                            <div className="text-muted">Chưa có sách nào được thêm</div>
                                        </td>
                                    </tr>
                                ) : (
                                    cartItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {item.bookItem.book.thumbnail && (
                                                        <img
                                                            src={item.bookItem.book.thumbnail}
                                                            alt={item.bookItem.book.nameBook}
                                                            width="40"
                                                            height="60"
                                                            style={{ objectFit: 'cover' }}
                                                            className="me-2"
                                                        />
                                                    )}
                                                    <div>
                                                        <div>{item.bookItem.book.nameBook}</div>
                                                        <small className="text-muted">{item.bookItem.book.author}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-outline-secondary">{item.bookItem.barcode}</span>
                                            </td>
                                            <td>{item.bookItem.location}</td>
                                            <td>
                                                    <span className={`badge ${item.bookItem.condition >= 80 ? "bg-success" : item.bookItem.condition >= 60 ? "bg-warning" : "bg-danger"}`}>
                                                        {item.bookItem.condition}%
                                                    </span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleRemoveFromCart(index)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-12 mb-4">
                    <h5 className="mb-2">Thông tin mượn sách</h5>
                    <div className="card p-3">
                        <div className="row">
                            <div className="col-6">
                                <label className="form-label">Ngày mượn</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={borrowDate}
                                    onChange={(e) => setBorrowDate(e.target.value)}
                                />
                            </div>
                            <div className="col-6">
                                <label className="form-label">Ngày hẹn trả</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="col-12 mt-3">
                                <label className="form-label">Ghi chú phiếu mượn</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Nhập ghi chú..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="my-3" />

            <div className="d-flex justify-content-center gap-2">
                <button
                    className="btn btn-outline-danger"
                    onClick={handleCloseModal}
                >
                    Hủy
                </button>

                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedCard || cartItems.length === 0}
                >
                    {submitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Đang xử lý...
                        </>
                    ) : (
                        "Tạo phiếu mượn"
                    )}
                </button>
            </div>
        </div>
    );
};

export default BorrowRecordCreate;