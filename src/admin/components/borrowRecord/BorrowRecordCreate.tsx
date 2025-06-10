import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import BookModel from '../../../model/BookModel';
import BookItemModel from '../../../model/BookItemModel';
import LibraryCardModel from '../../../model/LibraryCardModel';
import UserModel from '../../../model/UserModel';
import { getAllBook, searchBook } from '../../../api/BookApi';
import LibraryCardApi, { LibraryCardWithUser } from '../../../api/LibraryCardApi';
import { request } from '../../../api/Request';
import { endpointBE } from '../../../layouts/utils/Constant';

interface BorrowRecordCreateProps {
    handleCloseModal: () => void;
    setKeyCountReload?: (value: number) => void;
}

interface CartItem {
    bookItem: BookItemModel;
}

const BorrowRecordCreate: React.FC<BorrowRecordCreateProps> = ({ handleCloseModal, setKeyCountReload }) => {
    const [submitting, setSubmitting] = useState(false);
    const [libraryCards, setLibraryCards] = useState<LibraryCardWithUser[]>([]);
    const [filteredLibraryCards, setFilteredLibraryCards] = useState<LibraryCardWithUser[]>([]);
    const [selectedCard, setSelectedCard] = useState<LibraryCardWithUser | null>(null);
    const [books, setBooks] = useState<BookModel[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<BookModel[]>([]);
    const [availableBookItems, setAvailableBookItems] = useState<BookItemModel[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookModel | null>(null);
    const [selectedBookItem, setSelectedBookItem] = useState<BookItemModel | null>(null);
    const [notes, setNotes] = useState<string>('');

    // Search states
    const [cardSearchTerm, setCardSearchTerm] = useState<string>('');
    const [bookSearchTerm, setBookSearchTerm] = useState<string>('');

    // Loading states
    const [loadingBooks, setLoadingBooks] = useState(false);
    const [loadingBookItems, setLoadingBookItems] = useState(false);
    const [loadingCards, setLoadingCards] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Date states
    const [borrowDate, setBorrowDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState<string>(
        new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0]
    );

    // Fetch library cards and users
    useEffect(() => {
        const fetchLibraryCardsAndUsers = async () => {
            setLoadingCards(true);
            try {
                // Use the new API method to fetch library cards with user info
                const cardsData = await LibraryCardApi.fetchLibraryCardsWithUsers();

                // Filter only activated cards
                const activeCards = cardsData.filter(card => card.activated);

                setLibraryCards(activeCards);
                setFilteredLibraryCards(activeCards);
            } catch (error) {
                console.error('Error fetching library cards:', error);
                setError('Không thể tải thông tin thẻ thư viện. Vui lòng thử lại sau.');
            } finally {
                setLoadingCards(false);
            }
        };

        fetchLibraryCardsAndUsers();
    }, []);

    // Fetch books
    useEffect(() => {
        const fetchBooks = async () => {
            setLoadingBooks(true);
            try {
                // Fetch books using existing API
                const booksResponse = await getAllBook(1000, 0);

                // Filter books that have quantity for borrow > 0
                const availableBooks = booksResponse.bookList.filter(
                    book => book.quantityForBorrow && book.quantityForBorrow > 0
                );

                setBooks(availableBooks);
                setFilteredBooks(availableBooks);
            } catch (error) {
                console.error('Error fetching books:', error);
                setError('Không thể tải thông tin sách. Vui lòng thử lại sau.');
            } finally {
                setLoadingBooks(false);
            }
        };

        fetchBooks();
    }, []);

    // Filter library cards based on search term
    useEffect(() => {
        if (!cardSearchTerm.trim()) {
            setFilteredLibraryCards(libraryCards);
            return;
        }

        const searchLower = cardSearchTerm.toLowerCase();

        const filtered = libraryCards.filter(card => {
            return (
                card.cardNumber?.toLowerCase().includes(searchLower) ||
                card.user?.username?.toLowerCase().includes(searchLower) ||
                card.user?.firstName?.toLowerCase().includes(searchLower) ||
                card.user?.lastName?.toLowerCase().includes(searchLower) ||
                card.user?.email?.toLowerCase().includes(searchLower) ||
                `${card.user?.firstName || ''} ${card.user?.lastName || ''}`.toLowerCase().includes(searchLower)
            );
        });

        setFilteredLibraryCards(filtered);
    }, [cardSearchTerm, libraryCards]);

    // Filter books based on search term
    useEffect(() => {
        if (!bookSearchTerm.trim()) {
            setFilteredBooks(books);
            return;
        }

        const filtered = books.filter(book => {
            const searchLower = bookSearchTerm.toLowerCase();
            return (
                book.nameBook?.toLowerCase().includes(searchLower) ||
                book.isbn?.toLowerCase().includes(searchLower) ||
                book.author?.toLowerCase().includes(searchLower)
            );
        });

        setFilteredBooks(filtered);
    }, [bookSearchTerm, books]);

    // Fetch available book items when a book is selected
    useEffect(() => {
        const fetchAvailableBookItems = async () => {
            if (!selectedBook) {
                setAvailableBookItems([]);
                return;
            }

            setLoadingBookItems(true);
            try {
                const response = await request(`${endpointBE}/books/${selectedBook.idBook}/listBookItems`);

                if (response && response._embedded && response._embedded.bookItems) {
                    const availableItems = response._embedded.bookItems.filter((item: any) =>
                        item.status === 'AVAILABLE' || item.status === 'Có sẵn'
                    );

                    const bookItemModels: BookItemModel[] = availableItems.map((item: any) => ({
                        idBookItem: item.idBookItem,
                        barcode: item.barcode,
                        status: item.status,
                        location: item.location,
                        condition: item.condition,
                        book: selectedBook
                    }));

                    setAvailableBookItems(bookItemModels);
                } else {
                    setAvailableBookItems([]);
                }
            } catch (error) {
                console.error('Error fetching book items:', error);
                setAvailableBookItems([]);
                toast.error('Không thể tải thông tin bản sao sách');
            } finally {
                setLoadingBookItems(false);
            }
        };

        fetchAvailableBookItems();
    }, [selectedBook]);

    const handleAddToCart = () => {
        if (!selectedBookItem) {
            toast.warning('Vui lòng chọn bản sao sách cụ thể');
            return;
        }

        const existingItem = cartItems.find(item => item.bookItem.idBookItem === selectedBookItem.idBookItem);
        if (existingItem) {
            toast.warning('Bản sao sách này đã được thêm vào danh sách mượn');
            return;
        }

        setCartItems([...cartItems, { bookItem: selectedBookItem }]);
        setSelectedBook(null);
        setSelectedBookItem(null);
        setAvailableBookItems([]);
        setBookSearchTerm('');
        toast.success('Đã thêm sách vào danh sách mượn');
    };

    const handleRemoveFromCart = (index: number) => {
        const newCartItems = [...cartItems];
        newCartItems.splice(index, 1);
        setCartItems(newCartItems);
        toast.info('Đã xóa sách khỏi danh sách mượn');
    };

    const handleCardSelect = (card: LibraryCardWithUser) => {
        setSelectedCard(card);
        setCardSearchTerm(card.cardNumber || '');
    };

    const handleBookSelect = (book: BookModel) => {
        setSelectedBook(book);
        setSelectedBookItem(null);
        setBookSearchTerm(book.nameBook || '');
    };

    const validateForm = (): boolean => {
        if (!selectedCard) {
            toast.error('Vui lòng chọn thẻ thư viện');
            return false;
        }

        if (cartItems.length === 0) {
            toast.error('Vui lòng thêm ít nhất một bản sao sách');
            return false;
        }

        if (!borrowDate) {
            toast.error('Vui lòng chọn ngày mượn');
            return false;
        }

        if (!dueDate) {
            toast.error('Vui lòng chọn ngày hẹn trả');
            return false;
        }

        if (new Date(dueDate) <= new Date(borrowDate)) {
            toast.error('Ngày hẹn trả phải sau ngày mượn');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const borrowRecordData = {
                idLibraryCard: selectedCard!.idLibraryCard,
                borrowDate: borrowDate,
                dueDate: dueDate,
                notes: notes,
                bookItem: cartItems.map(item => ({
                    idBookItem: item.bookItem.idBookItem
                }))
            };

            const token = localStorage.getItem("token");
            const response = await fetch(`${endpointBE}/borrow-record/add-borrow-record`, {
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

            toast.success('Tạo phiếu mượn thành công');

            if (setKeyCountReload) {
                setKeyCountReload(Math.random());
            }

            handleCloseModal();
        } catch (error: any) {
            console.error('Error creating borrow record:', error);
            toast.error(error.message || 'Lỗi khi tạo phiếu mượn');
        } finally {
            setSubmitting(false);
        }
    };

    const renderCardSearchResults = () => {
        if (!cardSearchTerm.trim() || filteredLibraryCards.length === 0) return null;

        return (
            <div className="card mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <div className="list-group list-group-flush">
                    {filteredLibraryCards.slice(0, 10).map(card => (
                        <button
                            key={card.idLibraryCard}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onClick={() => handleCardSelect(card)}
                        >
                            <div className="d-flex justify-content-between">
                                <div>
                                    <div className="fw-bold">{card.cardNumber}</div>
                                    <div className="text-muted">
                                        {card.user ? (
                                            <>
                                                <div>Tên: {card.user.firstName} {card.user.lastName}</div>
                                                <small>Username: {card.user.username}</small>
                                            </>
                                        ) : (
                                            'Không có thông tin user'
                                        )}
                                    </div>
                                </div>
                                <span className="badge bg-success">Hoạt động</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderBookSearchResults = () => {
        if (!bookSearchTerm.trim() || filteredBooks.length === 0) return null;

        return (
            <div className="card mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div className="list-group list-group-flush">
                    {filteredBooks.slice(0, 10).map(book => (
                        <button
                            key={book.idBook}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onClick={() => handleBookSelect(book)}
                        >
                            <div className="d-flex align-items-center">
                                {book.thumbnail && (
                                    <img
                                        src={book.thumbnail}
                                        alt={book.nameBook}
                                        width="40"
                                        height="60"
                                        style={{ objectFit: 'cover' }}
                                        className="me-3"
                                    />
                                )}
                                <div className="flex-grow-1">
                                    <div className="fw-bold">{book.nameBook}</div>
                                    <div className="text-muted">Tác giả: {book.author}</div>
                                    <div className="text-muted">ISBN: {book.isbn}</div>
                                    <small className="text-success">
                                        Còn lại: {book.quantityForBorrow} bản
                                    </small>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
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
                {/* Library Card Selection */}
                <div className="col-12 mb-4">
                    <h5 className="mb-2">Thông tin độc giả</h5>
                    <div className="card p-3">
                        <div className="mb-3">
                            <label className="form-label">Tìm kiếm thẻ thư viện</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nhập mã thẻ thư viện, tên hoặc username để tìm kiếm..."
                                value={cardSearchTerm}
                                onChange={(e) => setCardSearchTerm(e.target.value)}
                                disabled={loadingCards}
                            />
                            {loadingCards && <div className="text-muted mt-1">Đang tải...</div>}
                        </div>

                        {renderCardSearchResults()}

                        {selectedCard && (
                            <div className="mt-3 p-3 bg-light rounded">
                                <h6>Thông tin độc giả đã chọn</h6>
                                <div className="row">
                                    <div className="col-3">
                                        <small className="text-muted">Mã thẻ</small>
                                        <div className="fw-bold">{selectedCard.cardNumber}</div>
                                    </div>
                                    <div className="col-3">
                                        <small className="text-muted">Tên độc giả</small>
                                        <div className="fw-bold">
                                            {selectedCard.user ?
                                                `${selectedCard.user.firstName} ${selectedCard.user.lastName}` :
                                                'N/A'
                                            }
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <small className="text-muted">Username</small>
                                        <div className="fw-bold">{selectedCard.user?.username || 'N/A'}</div>
                                    </div>
                                    <div className="col-3">
                                        <small className="text-muted">Trạng thái thẻ</small>
                                        <div className="fw-bold text-success">Đã kích hoạt</div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm btn-outline-secondary mt-2"
                                    onClick={() => {
                                        setSelectedCard(null);
                                        setCardSearchTerm('');
                                    }}
                                >
                                    Chọn thẻ khác
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Book Selection */}
                <div className="col-12 mb-4">
                    <h5 className="mb-2">Chọn sách và bản sao</h5>
                    <div className="card p-3">
                        <div className="row">
                            <div className="col-6">
                                <label className="form-label">Tìm kiếm sách</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nhập tên sách hoặc ISBN để tìm kiếm..."
                                    value={bookSearchTerm}
                                    onChange={(e) => setBookSearchTerm(e.target.value)}
                                    disabled={loadingBooks}
                                />
                                {loadingBooks && <div className="text-muted mt-1">Đang tải...</div>}

                                {renderBookSearchResults()}
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

                        {selectedBook && (
                            <div className="card mt-3">
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
                                            <div className="text-muted">ISBN: {selectedBook.isbn}</div>
                                            <div className="text-muted">Số lượng còn lại: {selectedBook.quantityForBorrow}</div>
                                            <div className="text-muted">Bản sao có sẵn: {availableBookItems.length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 d-flex justify-content-end">
                            <button
                                className="btn btn-primary"
                                onClick={handleAddToCart}
                                disabled={!selectedBookItem}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Thêm vào danh sách mượn
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="col-12 mb-4">
                    <h5 className="mb-2">
                        Danh sách sách mượn {cartItems.length > 0 && `(${cartItems.length} bản sao)`}
                    </h5>

                    <div className="card">
                        <div className="table-responsive">
                            <table className="table table-striped mb-0">
                                <thead style={{ backgroundColor: "#f5f5f5" }}>
                                <tr>
                                    <th>STT</th>
                                    <th>Sách</th>
                                    <th>Mã vạch</th>
                                    <th>Vị trí</th>
                                    <th>Tình trạng</th>
                                    <th className="text-center">Thao tác</th>
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
                                                <span className={`badge ${
                                                    item.bookItem.condition >= 80 ? "bg-success" :
                                                        item.bookItem.condition >= 60 ? "bg-warning text-dark" : "bg-danger"
                                                }`}>
                                                    {item.bookItem.condition}%
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleRemoveFromCart(index)}
                                                    title="Xóa khỏi danh sách"
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

                {/* Borrow Information */}
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