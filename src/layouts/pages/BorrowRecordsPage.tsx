import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Collapse,
    Divider,
    Grid
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon,
    LibraryBooks as LibraryBooksIcon,
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import BorrowBookItem from './components/BorrowBookItem';
import { toast } from 'react-toastify';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import useScrollToTop from '../../hooks/ScrollToTop';
import BorrowRecordApi, {
    BorrowRecord,
    BorrowRecordDetail,
    BORROW_RECORD_STATUS,
    getUserBorrowRecords,
    getBorrowRecordDetails,
    cancelBorrowRecord
} from '../../api/BorrowRecordApi';

// Interface để đồng nhất kiểu dữ liệu
interface UnifiedBorrowRecordDetail {
    id: number;
    quantity: number;
    isReturned: boolean;
    returnDate?: string;
    notes?: string;
    bookItem: {
        idBookItem: number;
        barcode: string;
        status: string;
        location: string;
        condition: number;
        book: {
            idBook: number;
            nameBook?: string;
            author?: string;
        };
    };
    violationType?: {
        idLibraryViolationType: number;
        code: string;
        description: string;
        fine: number;
    };
}

interface BorrowRecordsPageProps {}

const BorrowRecordsPage: React.FC<BorrowRecordsPageProps> = () => {
    useScrollToTop();
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    // State management
    const [borrowRecords, setBorrowRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
    const [recordDetails, setRecordDetails] = useState<{ [key: number]: UnifiedBorrowRecordDetail[] }>({});
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [cancelling, setCancelling] = useState(false);

    // Check authentication
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, navigate]);

    // Fetch user's borrow records
    useEffect(() => {
        if (isLoggedIn) {
            fetchBorrowRecords();
        }
    }, [isLoggedIn]);

    const fetchBorrowRecords = async () => {
        try {
            setLoading(true);
            setError(null);
            const records = await getUserBorrowRecords();
            setBorrowRecords(records);
        } catch (err) {
            console.error('Error fetching borrow records:', err);
            setError('Không thể tải danh sách phiếu mượn. Vui lòng thử lại sau.');
            toast.error('Lỗi khi tải danh sách phiếu mượn');
        } finally {
            setLoading(false);
        }
    };

    // Fetch details for a specific record
    const fetchRecordDetails = async (recordId: number) => {
        if (recordDetails[recordId]) {
            return;
        }

        try {
            const details = await getBorrowRecordDetails(recordId);
            const convertedDetails = details.map(detail => {
                const returnDateString = detail.returnDate instanceof Date
                    ? detail.returnDate.toISOString().split('T')[0]
                    : detail.returnDate;

                return {
                    ...detail,
                    returnDate: returnDateString,
                    bookItem: {
                        ...detail.bookItem,
                        book: {
                            ...detail.bookItem.book,
                            nameBook: detail.bookItem.book.nameBook || 'Tên sách không xác định',
                            author: detail.bookItem.book.author || 'Tác giả không xác định'
                        }
                    }
                } as UnifiedBorrowRecordDetail;
            });

            setRecordDetails(prev => ({
                ...prev,
                [recordId]: convertedDetails
            }));
        } catch (err) {
            console.error('Error fetching record details:', err);
            toast.error('Lỗi khi tải chi tiết phiếu mượn');
        }
    };

    // Handle expand/collapse record
    const handleExpandRecord = async (recordId: number) => {
        if (expandedRecord === recordId) {
            setExpandedRecord(null);
        } else {
            setExpandedRecord(recordId);
            await fetchRecordDetails(recordId);
        }
    };

    // Handle cancel record
    const handleCancelRecord = async () => {
        if (!selectedRecordId) return;

        try {
            setCancelling(true);
            await cancelBorrowRecord(selectedRecordId);
            toast.success('Hủy phiếu mượn thành công');

            setBorrowRecords(prev =>
                prev.map(record =>
                    record.id === selectedRecordId
                        ? { ...record, status: BORROW_RECORD_STATUS.CANCELLED }
                        : record
                )
            );

            setCancelDialogOpen(false);
            setSelectedRecordId(null);
        } catch (err) {
            console.error('Error cancelling record:', err);
            toast.error('Không thể hủy phiếu mượn. Vui lòng thử lại.');
        } finally {
            setCancelling(false);
        }
    };

    // Open cancel dialog
    const openCancelDialog = (recordId: number) => {
        setSelectedRecordId(recordId);
        setCancelDialogOpen(true);
    };

    // Get status color
    const getStatusColor = (status: string): 'info' | 'success' | 'primary' | 'secondary' | 'error' | 'default' => {
        return BorrowRecordApi.getStatusColor(status);
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case BORROW_RECORD_STATUS.PROCESSING:
                return <AccessTimeIcon fontSize="small" />;
            case BORROW_RECORD_STATUS.APPROVED:
                return <CheckCircleIcon fontSize="small" />;
            case BORROW_RECORD_STATUS.BORROWING:
                return <LibraryBooksIcon fontSize="small" />;
            case BORROW_RECORD_STATUS.RETURNED:
                return <CheckCircleIcon fontSize="small" />;
            case BORROW_RECORD_STATUS.CANCELLED:
                return <CancelIcon fontSize="small" />;
            default:
                return <WarningIcon fontSize="small" />;
        }
    };

    // Check if record can be cancelled
    const canCancelRecord = (status: string) => {
        return status === BORROW_RECORD_STATUS.PROCESSING;
    };

    // Calculate days until due date
    const getDaysUntilDue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Render record details
    const renderRecordDetails = (recordId: number) => {
        const details = recordDetails[recordId];
        if (!details) {
            return (
                <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                </Box>
            );
        }

        const record = borrowRecords.find(r => r.id === recordId);

        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                    📚 Chi tiết sách mượn
                </Typography>
                <Grid container spacing={2}>
                    {details.map((detail) => (
                        <Grid item xs={12} key={detail.id}>
                            <BorrowBookItem
                                detail={detail}
                                dueDate={record?.dueDate}
                                showFullDetails={true}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    if (!isLoggedIn) {
        return null;
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={40} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={fetchBorrowRecords}>
                    Thử lại
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <LibraryBooksIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        Phiếu mượn của tôi
                    </Typography>
                </Box>

                {borrowRecords.length === 0 ? (
                    <Box textAlign="center" py={8}>
                        <LibraryBooksIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Bạn chưa có phiếu mượn nào
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Hãy tìm kiếm và mượn những cuốn sách bạn yêu thích!
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/search')}
                            startIcon={<LibraryBooksIcon />}
                        >
                            Khám phá sách
                        </Button>
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={1}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Mã phiếu</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Mã đặt mượn</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Ngày mượn</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Hạn trả</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Ngày trả</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Phí phạt</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Ghi chú</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {borrowRecords.map((record) => {
                                    const daysUntilDue = getDaysUntilDue(record.dueDate);
                                    const isExpanded = expandedRecord === record.id;

                                    return (
                                        <React.Fragment key={record.id}>
                                            <TableRow
                                                hover
                                                sx={{
                                                    '&:last-child td, &:last-child th': { border: 0 },
                                                    backgroundColor: isExpanded ? 'action.hover' : 'inherit'
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        #{record.id}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        icon={getStatusIcon(record.status)}
                                                        label={record.status}
                                                        color={getStatusColor(record.status)}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {record.recordId}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {BorrowRecordApi.formatDate(record.borrowDate)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        color={
                                                            daysUntilDue < 0
                                                                ? 'error'
                                                                : daysUntilDue <= 3
                                                                    ? 'warning.main'
                                                                    : 'text.primary'
                                                        }
                                                        fontWeight={daysUntilDue <= 3 ? 'medium' : 'normal'}
                                                    >
                                                        {BorrowRecordApi.formatDate(record.dueDate)}
                                                        {record.status === BORROW_RECORD_STATUS.BORROWING && daysUntilDue <= 3 && (
                                                            <Box component="span" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                                                {daysUntilDue < 0
                                                                    ? `Quá hạn ${Math.abs(daysUntilDue)} ngày`
                                                                    : `Còn ${daysUntilDue} ngày`
                                                                }
                                                            </Box>
                                                        )}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {record.returnDate
                                                            ? BorrowRecordApi.formatDate(record.returnDate)
                                                            : '-'
                                                        }
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        color={record.fineAmount && record.fineAmount > 0 ? 'error' : 'text.secondary'}
                                                        fontWeight={record.fineAmount && record.fineAmount > 0 ? 'medium' : 'normal'}
                                                    >
                                                        {record.fineAmount && record.fineAmount > 0
                                                            ? `${record.fineAmount.toLocaleString()}₫`
                                                            : '-'
                                                        }
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {record.notes || '-'}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="center">
                                                    <Box display="flex" justifyContent="center" gap={0.5}>
                                                        {canCancelRecord(record.status) && (
                                                            <IconButton
                                                                color="error"
                                                                size="small"
                                                                onClick={() => openCancelDialog(record.id)}
                                                                title="Hủy phiếu mượn"
                                                            >
                                                                <CancelIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleExpandRecord(record.id)}
                                                            title="Xem chi tiết"
                                                        >
                                                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                        </IconButton>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Row for Details */}
                                            <TableRow>
                                                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                                            {/* Warning Messages */}
                                                            {record.status === BORROW_RECORD_STATUS.BORROWING && daysUntilDue <= 3 && daysUntilDue >= 0 && (
                                                                <Alert severity="warning" sx={{ m: 2, mb: 1 }}>
                                                                    Sách sắp hết hạn! Còn {daysUntilDue} ngày để trả sách.
                                                                </Alert>
                                                            )}

                                                            {record.status === BORROW_RECORD_STATUS.BORROWING && daysUntilDue < 0 && (
                                                                <Alert severity="error" sx={{ m: 2, mb: 1 }}>
                                                                    Sách đã quá hạn {Math.abs(daysUntilDue)} ngày! Vui lòng trả sách sớm nhất có thể.
                                                                </Alert>
                                                            )}

                                                            {renderRecordDetails(record.id)}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
                <DialogTitle>Xác nhận hủy phiếu mượn</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn hủy phiếu mượn này không?
                        Hành động này không thể hoàn tác.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>
                        Không
                    </Button>
                    <Button
                        onClick={handleCancelRecord}
                        color="error"
                        disabled={cancelling}
                        startIcon={cancelling ? <CircularProgress size={16} /> : null}
                    >
                        {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BorrowRecordsPage;