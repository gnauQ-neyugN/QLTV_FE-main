import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Grid,
    Alert,
    Avatar,
    Tooltip
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
    Book as BookIcon
} from '@mui/icons-material';
import BorrowRecordApi from '../../../api/BorrowRecordApi';

// Interface cho detail tương thích với cả API và Model
interface BorrowBookItemDetail {
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
            nameBook?: string; // Cho phép undefined
            author?: string;   // Cho phép undefined
        };
    };
    violationType?: {
        idLibraryViolationType: number;
        code: string;
        description: string;
        fine: number;
    };
}

interface BorrowBookItemProps {
    detail: BorrowBookItemDetail;
    dueDate?: string;
    showFullDetails?: boolean;
}

const BorrowBookItem: React.FC<BorrowBookItemProps> = ({
                                                           detail,
                                                           dueDate,
                                                           showFullDetails = true
                                                       }) => {
    // Calculate days until due (for overdue checking)
    const getDaysUntilDue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = due.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const isOverdue = dueDate && !detail.isReturned && getDaysUntilDue(dueDate) < 0;
    const daysOverdue = isOverdue ? Math.abs(getDaysUntilDue(dueDate!)) : 0;

    // Get status info
    const getStatusInfo = () => {
        if (detail.isReturned) {
            return {
                label: 'Đã trả',
                color: 'success' as const,
                icon: <CheckCircleIcon fontSize="small" />
            };
        } else if (isOverdue) {
            return {
                label: `Quá hạn ${daysOverdue} ngày`,
                color: 'error' as const,
                icon: <WarningIcon fontSize="small" />
            };
        } else {
            return {
                label: 'Chưa trả',
                color: 'default' as const,
                icon: <ScheduleIcon fontSize="small" />
            };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <Card
            elevation={1}
            sx={{
                borderRadius: 2,
                border: isOverdue ? '1px solid' : 'none',
                borderColor: isOverdue ? 'error.main' : 'transparent',
                backgroundColor: isOverdue ? 'error.50' : 'background.paper'
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="flex-start">
                    {/* Book Avatar/Icon */}
                    <Grid item>
                        <Avatar
                            sx={{
                                bgcolor: detail.isReturned ? 'success.main' : 'primary.main',
                                width: 40,
                                height: 40
                            }}
                        >
                            <BookIcon />
                        </Avatar>
                    </Grid>

                    {/* Book Information */}
                    <Grid item xs>
                        <Box>
                            {/* Book Title */}
                            <Typography
                                variant="subtitle1"
                                fontWeight="medium"
                                sx={{
                                    mb: 0.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {detail.bookItem.book.nameBook || 'Tên sách không xác định'}
                            </Typography>

                            {/* Author */}
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Tác giả: {detail.bookItem.book.author || 'Tác giả không xác định'}
                            </Typography>

                            {/* Book Item Details */}
                            {showFullDetails && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        Mã sách: {detail.bookItem.barcode}
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        Vị trí: {detail.bookItem.location}
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        Tình trạng sách: {detail.bookItem.condition}%
                                    </Typography>
                                </Box>
                            )}

                            {/* Status and Dates */}
                            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 1 }}>
                                <Chip
                                    icon={statusInfo.icon}
                                    label={statusInfo.label}
                                    color={statusInfo.color}
                                    size="small"
                                    variant="outlined"
                                />

                                <Chip
                                    label={`${detail.quantity} quyển`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>

                            {/* Return Date */}
                            {detail.returnDate && (
                                <Typography variant="caption" color="text.secondary">
                                    Ngày trả: {BorrowRecordApi.formatDate(detail.returnDate)}
                                </Typography>
                            )}

                            {/* Notes */}
                            {detail.notes && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mt: 1,
                                        fontStyle: 'italic',
                                        p: 1,
                                        bgcolor: 'grey.50',
                                        borderRadius: 1
                                    }}
                                >
                                    💬 {detail.notes}
                                </Typography>
                            )}

                            {/* Violation Warning */}
                            {detail.violationType && (
                                <Alert
                                    severity="warning"
                                    sx={{ mt: 1 }}
                                    icon={<WarningIcon fontSize="small" />}
                                >
                                    <Typography variant="caption">
                                        <strong>Vi phạm:</strong> {detail.violationType.description}
                                        {detail.violationType.fine > 0 && (
                                            <>
                                                <br />
                                                <strong>Phí phạt:</strong> {detail.violationType.fine.toLocaleString()}₫
                                            </>
                                        )}
                                    </Typography>
                                </Alert>
                            )}

                            {/* Overdue Warning */}
                            {isOverdue && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                    <Typography variant="caption">
                                        ⚠️ Sách đã quá hạn {daysOverdue} ngày! Vui lòng trả sách sớm nhất có thể.
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default BorrowBookItem;