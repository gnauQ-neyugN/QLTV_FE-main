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
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [notes, setNotes] = useState<string>('');
    const [suggestedBookItems, setSuggestedBookItems] = useState<BookItemModel[]>([]);

    // Barcode input states
    const [barcodeInput, setBarcodeInput] = useState<string>('');
    const [loadingBarcode, setLoadingBarcode] = useState(false);

    // Search states
    const [cardSearchTerm, setCardSearchTerm] = useState<string>('');

    // Loading states
    const [loadingCards, setLoadingCards] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Date states
    const [borrowDate, setBorrowDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState<string>(
        new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0]
    );

    useEffect(() => {
        const fetchSuggestions = async () => {
            const trimmed = barcodeInput.trim();
            if (!trimmed) {
                setSuggestedBookItems([]);
                return;
            }

            try {
                const response = await request(
                    `${endpointBE}/book/book-items/search-barcode?keyword=${trimmed}`
                );

                const embedded = response._embedded?.bookItems || [];
                const suggestions: BookItemModel[] = await Promise.all(
                    embedded.map(async (item: any) => {
                        const book = await request(item._links.book.href);
                        return {
                            idBookItem: item.idBookItem,
                            barcode: item.barcode,
                            status: item.status,
                            location: item.location,
                            condition: item.condition,
                            bookName: item.bookName,
                            author: item.author
                        };
                    })
                );

                setSuggestedBookItems(suggestions);
            } catch (error) {
                console.error('Không thể tìm book item gợi ý', error);
                setSuggestedBookItems([]);
            }
        };

        const delayDebounce = setTimeout(fetchSuggestions, 300); // debounce 300ms
        return () => clearTimeout(delayDebounce);
    }, [barcodeInput]);

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

    // Fetch BookItem by barcode
    const fetchBookItemByBarcode = async (barcode: string): Promise<BookItemModel | null> => {
        try {
            // Search for BookItem by barcode
            const bookItemResponse = await request(`${endpointBE}/book-items/search/findByBarcode?barcode=${barcode}`);

            if (!bookItemResponse) {
                return null;
            }

            // Get the book information
            const bookResponse = await request(bookItemResponse._links.book.href);

            // Create BookItemModel with complete book information
            const bookItemModel: BookItemModel = {
                idBookItem: bookItemResponse.idBookItem,
                barcode: bookItemResponse.barcode,
                status: bookItemResponse.status,
                location: bookItemResponse.location,
                condition: bookItemResponse.condition,
                book: {
                    idBook: bookResponse.idBook,
                    nameBook: bookResponse.nameBook,
                    author: bookResponse.author,
                    isbn: bookResponse.isbn,
                    thumbnail: bookResponse.thumbnail,
                    listPrice: bookResponse.listPrice,
                    sellPrice: bookItemResponse.sellPrice,
                    avgRating: bookResponse.avgRating,
                    quantityForBorrow: bookResponse.quantityForBorrow,
                    borrowQuantity: bookResponse.borrowQuantity,
                    description: bookResponse.description
                }
            };

            return bookItemModel;
        } catch (error) {
            console.error('Error fetching book item:', error);
            return null;
        }
    };

    const handleBarcodeSubmit = async () => {
        if (!barcodeInput.trim()) {
            toast.warning('Vui lòng nhập mã barcode');
            return;
        }

        // Check if this barcode is already in cart
        const existingItem = cartItems.find(item => item.bookItem.barcode === barcodeInput.trim());
        if (existingItem) {
            toast.warning('Bản sao sách này đã được thêm vào danh sách mượn');
            setBarcodeInput('');
            return;
        }

        setLoadingBarcode(true);
        try {
            const bookItem = await fetchBookItemByBarcode(barcodeInput.trim());

            if (!bookItem) {
                toast.error('Không tìm thấy bản sao sách với mã barcode này');
                return;
            }

            // Check if the book item is available
            if (bookItem.status !== 'Có sẵn' && bookItem.status !== 'AVAILABLE') {
                toast.error(`Bản sao sách này không sẵn sàng để mượn. Trạng thái hiện tại: ${bookItem.status}`);
                return;
            }

            // Add to cart
            setCartItems([...cartItems, { bookItem }]);
            setBarcodeInput('');
            toast.success('Đã thêm sách vào danh sách mượn');
        } catch (error: any) {
            console.error('Error adding book to cart:', error);
            toast.error('Lỗi khi thêm sách: ' + (error.message || 'Vui lòng thử lại'));
        } finally {
            setLoadingBarcode(false);
        }
    };

    const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBarcodeSubmit();
        }
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
            const response = await fetch(`${endpointBE}/borrow-record/create-borrow-record`, {
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

    const renderBarcodeSuggestions = () => {
        if (!barcodeInput.trim() || suggestedBookItems.length === 0) return null;

        return (
            <div className="card mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <div className="list-group list-group-flush">
                    {suggestedBookItems.slice(0, 10).map(item => (
                        <button
                            key={item.idBookItem}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onClick={() => {
                                setBarcodeInput(item.barcode);
                                setSuggestedBookItems([]);
                            }}
                        >
                            <div className="d-flex justify-content-between">
                                <div>
                                    <div className="fw-bold">{item.barcode}</div>
                                    <small className="text-muted">
                                        {item.book?.nameBook} - {item.book?.author}
                                    </small>
                                </div>
                                <span className="badge bg-secondary">{item.status}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
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

                {/* Barcode Input Section */}
                <div className="col-12 mb-4">
                    <h5 className="mb-2">Thêm sách bằng mã barcode</h5>
                    <div className="card p-3">
                        <div className="row align-items-end">
                            <div className="col-8">
                                <label className="form-label">
                                    <i className="fas fa-barcode me-2"></i>
                                    Nhập mã barcode của bản sao sách
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nhập hoặc quét mã barcode..."
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    onKeyPress={handleBarcodeKeyPress}
                                    disabled={loadingBarcode}
                                    autoFocus
                                />
                                {renderBarcodeSuggestions()}
                                <small className="form-text text-muted">
                                    Nhập mã barcode và nhấn Enter hoặc click "Thêm vào danh sách"
                                </small>
                            </div>
                            <div className="col-4">
                                <button
                                    type="button"
                                    className="btn btn-primary w-100"
                                    onClick={handleBarcodeSubmit}
                                    disabled={!barcodeInput.trim() || loadingBarcode}
                                >
                                    {loadingBarcode ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-plus me-2"></i>
                                            Thêm vào danh sách
                                        </>
                                    )}
                                </button>
                            </div>
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
                                    <th>Trạng thái</th>
                                    <th className="text-center">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {cartItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4">
                                            <div className="text-muted">
                                                <i className="fas fa-books fa-2x mb-2 d-block"></i>
                                                Chưa có sách nào được thêm
                                                <br />
                                                <small>Nhập mã barcode ở trên để thêm sách</small>
                                            </div>
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
                                                        <div className="fw-bold">{item.bookItem.book.nameBook}</div>
                                                        <small className="text-muted">Tác giả: {item.bookItem.book.author}</small>
                                                        <br />
                                                        <small className="text-muted">ISBN: {item.bookItem.book.isbn}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">{item.bookItem.barcode}</span>
                                            </td>
                                            <td>
                                                <small>{item.bookItem.location}</small>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    item.bookItem.condition >= 80 ? "bg-success" :
                                                        item.bookItem.condition >= 60 ? "bg-warning text-dark" : "bg-danger"
                                                }`}>
                                                    {item.bookItem.condition}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-success">{item.bookItem.status}</span>
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
                        {cartItems.length > 0 && (
                            <div className="card-footer text-muted">
                                <small>
                                    <i className="fas fa-info-circle me-1"></i>
                                    Tổng cộng: {cartItems.length} bản sao sách được chọn
                                </small>
                            </div>
                        )}
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
                                    placeholder="Nhập ghi chú (nếu có)..."
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
                    <i className="fas fa-times me-2"></i>
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
                        <>
                            <i className="fas fa-save me-2"></i>
                            Tạo phiếu mượn
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BorrowRecordCreate;