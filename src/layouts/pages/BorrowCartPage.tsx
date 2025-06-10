    import React, { useEffect, useState } from 'react';
    import {
        Container,
        Paper,
        Typography,
        Box,
        Button,
        Card,
        CardContent,
        Grid,
        IconButton,
        Divider,
        Dialog,
        DialogTitle,
        DialogContent,
        DialogActions,
        TextField,
        Alert,
        CircularProgress,
        Tooltip,
        Chip
    } from '@mui/material';
    import {
        Delete as DeleteIcon,
        LibraryBooks as LibraryBooksIcon,
        Send as SendIcon,
        ShoppingCart as ShoppingCartIcon,
        Add as AddIcon,
        Remove as RemoveIcon
    } from '@mui/icons-material';
    import { toast } from 'react-toastify';
    import { Link, useNavigate } from 'react-router-dom';
    import { useBorrowCart } from '../utils/BorrowCartContext';
    import { useAuth } from '../utils/AuthContext';
    import useScrollToTop from '../../hooks/ScrollToTop';
    import { createBorrowRecord } from '../../api/BorrowRecordApi';
    import { endpointBE } from '../utils/Constant';
    import { getIdUserByToken } from '../utils/JwtService';
    import CartItemModel from '../../model/CartItemModel';
    
    interface BorrowCartPageProps {}
    
    const BorrowCartPage: React.FC<BorrowCartPageProps> = () => {
        useScrollToTop();
        const { isLoggedIn } = useAuth();
        const navigate = useNavigate();
        const { borrowCartList, setBorrowCartList, setTotalBorrowItems } = useBorrowCart();
    
        // State management
        const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
        const [notes, setNotes] = useState('');
        const [submitting, setSubmitting] = useState(false);
        const [libraryCard, setLibraryCard] = useState<any>(null);
        const [loadingLibraryCard, setLoadingLibraryCard] = useState(true);
    
        // Check authentication
        useEffect(() => {
            if (!isLoggedIn) {
                navigate('/login');
            }
        }, [isLoggedIn, navigate]);
    
        // Fetch user's library card
        useEffect(() => {
            if (isLoggedIn) {
                fetchLibraryCard();
            }
        }, [isLoggedIn]);
    
        const fetchLibraryCard = async () => {
            try {
                setLoadingLibraryCard(true);
                const idUser = getIdUserByToken();
                const response = await fetch(`${endpointBE}/users/${idUser}/libraryCard`);
    
                if (response.ok) {
                    const cardData = await response.json();
                    setLibraryCard(cardData);
                } else {
                    setLibraryCard(null);
                }
            } catch (error) {
                console.error('Error fetching library card:', error);
                setLibraryCard(null);
            } finally {
                setLoadingLibraryCard(false);
            }
        };
    
        // Handle remove item from borrow cart
        const handleRemoveItem = (bookId: number) => {
            const updatedCart = borrowCartList.filter(item => item.book.idBook !== bookId);
            setBorrowCartList(updatedCart);
            setTotalBorrowItems(updatedCart.length);
            localStorage.setItem('borrowCart', JSON.stringify(updatedCart));
            toast.success('Đã xóa sách khỏi phiếu mượn');
        };
    
        // Handle quantity change
        const handleQuantityChange = (bookId: number, change: number) => {
            const updatedCart = borrowCartList.map(item => {
                if (item.book.idBook === bookId) {
                    const newQuantity = Math.max(1, item.quantity + change);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
    
            setBorrowCartList(updatedCart);
            localStorage.setItem('borrowCart', JSON.stringify(updatedCart));
        };
    
        // Handle submit borrow request
        const handleSubmitBorrowRequest = async () => {
            if (!libraryCard || !libraryCard.activated) {
                toast.error('Bạn cần có thẻ thư viện đã kích hoạt để mượn sách');
                return;
            }
    
            try {
                setSubmitting(true);
    
                // Prepare book items data
                const bookItems = borrowCartList.flatMap(cartItem =>
                    Array.from({ length: cartItem.quantity }, () => ({
                        idBookItem: cartItem.book.idBook, // This should be the actual book item ID
                        book: cartItem.book
                    }))
                );
    
                const borrowRecordData = {
                    idLibraryCard: libraryCard.idLibraryCard,
                    notes: notes.trim(),
                    bookItem: bookItems.map(item => ({ idBookItem: item.idBookItem }))
                };

                await createBorrowRecord(borrowRecordData);
    
                // Clear borrow cart
                setBorrowCartList([]);
                setTotalBorrowItems(0);
                localStorage.removeItem('borrowCart');
                setSubmitDialogOpen(false);
                setNotes('');
    
                toast.success('Đã gửi yêu cầu mượn sách thành công!');
                navigate('/borrow-records');
    
            } catch (error) {
                console.error('Error submitting borrow request:', error);
                toast.error('Không thể gửi yêu cầu mượn sách. Vui lòng thử lại.');
            } finally {
                setSubmitting(false);
            }
        };
    
        // Calculate total books
        const totalBooks = borrowCartList.reduce((total, item) => total + item.quantity, 0);
    
        if (!isLoggedIn) {
            return null;
        }
    
        if (loadingLibraryCard) {
            return (
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                        <CircularProgress size={40} />
                    </Box>
                </Container>
            );
        }
    
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                        <LibraryBooksIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            Phiếu mượn sách
                        </Typography>
                        {borrowCartList.length > 0 && (
                            <Chip
                                label={`${borrowCartList.length} đầu sách, ${totalBooks} quyển`}
                                color="primary"
                                sx={{ ml: 2 }}
                            />
                        )}
                    </Box>
    
                    {/* Library Card Status */}
                    {!libraryCard && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Bạn chưa có thẻ thư viện. Vui lòng tạo thẻ thư viện trong phần thông tin cá nhân để có thể mượn sách.
                        </Alert>
                    )}
    
                    {libraryCard && !libraryCard.activated && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            Thẻ thư viện của bạn chưa được kích hoạt. Vui lòng liên hệ thủ thư để kích hoạt thẻ.
                        </Alert>
                    )}
    
                    {borrowCartList.length === 0 ? (
                        <Box textAlign="center" py={8}>
                            <LibraryBooksIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Phiếu mượn của bạn đang trống
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Hãy tìm kiếm và thêm những cuốn sách bạn muốn mượn!
                            </Typography>
                            <Button
                                variant="contained"
                                component={Link}
                                to="/search"
                                startIcon={<LibraryBooksIcon />}
                            >
                                Khám phá sách
                            </Button>
                        </Box>
                    ) : (
                        <>
                            {/* Borrow Cart Items */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} lg={8}>
                                    <Typography variant="h6" gutterBottom>
                                        Danh sách sách muốn mượn
                                    </Typography>
    
                                    {borrowCartList.map((cartItem, index) => (
                                        <Card key={cartItem.book.idBook} sx={{ mb: 2, borderRadius: 2 }}>
                                            <CardContent>
                                                <Grid container spacing={2} alignItems="center">
                                                    {/* Book Image */}
                                                    <Grid item xs={12} sm={3} md={2}>
                                                        <Box
                                                            component={Link}
                                                            to={`/book/${cartItem.book.idBook}`}
                                                            sx={{ textDecoration: 'none' }}
                                                        >
                                                            <img
                                                                src={cartItem.book.thumbnail}
                                                                alt={cartItem.book.nameBook}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '120px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '8px'
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
    
                                                    {/* Book Info */}
                                                    <Grid item xs={12} sm={6} md={7}>
                                                        <Typography
                                                            variant="h6"
                                                            component={Link}
                                                            to={`/book/${cartItem.book.idBook}`}
                                                            sx={{
                                                                textDecoration: 'none',
                                                                color: 'inherit',
                                                                '&:hover': { color: 'primary.main' }
                                                            }}
                                                            gutterBottom
                                                        >
                                                            {cartItem.book.nameBook}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            Tác giả: {cartItem.book.author}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Có thể mượn: {cartItem.book.quantityForBorrow || 0} quyển
                                                        </Typography>
                                                    </Grid>
    
                                                    {/* Quantity Controls */}
                                                    <Grid item xs={12} sm={2} md={2}>
                                                        <Box display="flex" alignItems="center" justifyContent="center">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleQuantityChange(cartItem.book.idBook, -1)}
                                                                disabled={cartItem.quantity <= 1}
                                                            >
                                                                <RemoveIcon />
                                                            </IconButton>
                                                            <Typography sx={{ mx: 2, minWidth: '20px', textAlign: 'center' }}>
                                                                {cartItem.quantity}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleQuantityChange(cartItem.book.idBook, 1)}
                                                                disabled={cartItem.quantity >= (cartItem.book.quantityForBorrow || 0)}
                                                            >
                                                                <AddIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </Grid>
    
                                                    {/* Remove Button */}
                                                    <Grid item xs={12} sm={1} md={1}>
                                                        <Box display="flex" justifyContent="center">
                                                            <Tooltip title="Xóa khỏi phiếu mượn">
                                                                <IconButton
                                                                    color="error"
                                                                    onClick={() => handleRemoveItem(cartItem.book.idBook)}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Grid>
    
                                {/* Summary Panel */}
                                <Grid item xs={12} lg={4}>
                                    <Card sx={{ borderRadius: 2, position: 'sticky', top: 20 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                📋 Tóm tắt phiếu mượn
                                            </Typography>
    
                                            <Divider sx={{ my: 2 }} />
    
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography>Số đầu sách:</Typography>
                                                <Typography fontWeight="medium">{borrowCartList.length}</Typography>
                                            </Box>
    
                                            <Box display="flex" justifyContent="space-between" mb={2}>
                                                <Typography>Tổng số quyển:</Typography>
                                                <Typography fontWeight="medium">{totalBooks}</Typography>
                                            </Box>
    
                                            <Divider sx={{ my: 2 }} />
    
                                            {/* Library Card Info */}
                                            {libraryCard && (
                                                <Box mb={2}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        📄 Thông tin thẻ thư viện
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Số thẻ: {libraryCard.cardNumber}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Trạng thái: {libraryCard.activated ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                                                    </Typography>
                                                </Box>
                                            )}
    
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                <Typography variant="body2">
                                                    • Thời hạn mượn: 60 ngày
                                                    <br />
                                                    • Có thể gia hạn nếu không có người đặt trước
                                                    <br />
                                                    • Vui lòng trả sách đúng hạn để tránh phí phạt
                                                </Typography>
                                            </Alert>
    
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                size="large"
                                                startIcon={<SendIcon />}
                                                onClick={() => setSubmitDialogOpen(true)}
                                                disabled={!libraryCard || !libraryCard.activated || borrowCartList.length === 0}
                                                sx={{ mt: 2 }}
                                            >
                                                Gửi yêu cầu mượn sách
                                            </Button>
    
                                            {(!libraryCard || !libraryCard.activated) && (
                                                <Typography variant="caption" color="error" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                                                    {!libraryCard ? 'Cần có thẻ thư viện' : 'Thẻ thư viện chưa kích hoạt'}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Paper>
    
                {/* Submit Dialog */}
                <Dialog
                    open={submitDialogOpen}
                    onClose={() => setSubmitDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" alignItems="center">
                            <SendIcon sx={{ mr: 1 }} />
                            Xác nhận gửi yêu cầu mượn sách
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Typography gutterBottom>
                            Bạn đang yêu cầu mượn <strong>{borrowCartList.length}</strong> đầu sách
                            với tổng cộng <strong>{totalBooks}</strong> quyển.
                        </Typography>
    
                        <Box sx={{ my: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Danh sách sách:
                            </Typography>
                            {borrowCartList.map((item, index) => (
                                <Typography key={item.book.idBook} variant="body2" sx={{ ml: 2 }}>
                                    {index + 1}. {item.book.nameBook} - {item.quantity} quyển
                                </Typography>
                            ))}
                        </Box>
    
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Ghi chú (không bắt buộc)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Nhập ghi chú cho yêu cầu mượn sách..."
                            sx={{ mt: 2 }}
                        />
    
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Yêu cầu của bạn sẽ được xem xét và phê duyệt bởi thủ thư.
                            Bạn sẽ được thông báo khi có cập nhật.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSubmitDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSubmitBorrowRequest}
                            variant="contained"
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
                        >
                            {submitting ? 'Đang gửi...' : 'Xác nhận gửi'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        );
    };
    
    export default BorrowCartPage;