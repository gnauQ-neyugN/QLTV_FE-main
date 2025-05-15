import React, { FormEvent, useEffect, useState } from "react";
import {
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    TextField,
    Typography,
    Box,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Switch,
    FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import { StepperComponent } from "../../../layouts/utils/StepperComponent";
import BorrowRecordApi, {
    BorrowRecord,
    BorrowRecordDetail,
    BORROW_RECORD_STATUS,
    UpdateBorrowRecordParams,
    UpdateBookReturnParams
} from "../../../api/BorrowRecordApi";

// Define a new interface for violation types
interface ViolationType {
    id: number;
    code: string;
    fine: number;
    description: string;
}

interface BorrowRecordFormProps {
    id: number;
    option: string;
    setKeyCountReload?: any;
    handleCloseModal: any;
}

export const BorrowRecordForm: React.FC<BorrowRecordFormProps> = (props) => {
    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState<BorrowRecord | null>(null);
    const [details, setDetails] = useState<BorrowRecordDetail[]>([]);
    const [newStatus, setNewStatus] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [steps, setSteps] = useState<String[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // State for violation types
    const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
    const [selectedViolationType, setSelectedViolationType] = useState<string>("");
    const [showViolationSelect, setShowViolationSelect] = useState(false);

    // State for dialog to update borrowDetail
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<BorrowRecordDetail | null>(null);
    const [updatedIsReturned, setUpdatedIsReturned] = useState(false);
    const [updatedReturnDate, setUpdatedReturnDate] = useState<string>("");
    const [updatedNotes, setUpdatedNotes] = useState("");
    const [updatingDetail, setUpdatingDetail] = useState(false);

    useEffect(() => {
        const fetchBorrowRecord = async () => {
            try {
                setLoading(true);

                // Fetch the borrow record
                const recordData = await BorrowRecordApi.fetchBorrowRecordById(props.id);
                setRecord(recordData);
                setNewStatus(recordData.status);
                setNewNotes(recordData.notes || "");

                // Set steps based on status
                if (recordData.status === BORROW_RECORD_STATUS.CANCELLED) {
                    setSteps([BORROW_RECORD_STATUS.PROCESSING, BORROW_RECORD_STATUS.CANCELLED]);
                    setActiveStep([BORROW_RECORD_STATUS.PROCESSING, BORROW_RECORD_STATUS.CANCELLED].indexOf(recordData.status));
                } else {
                    setSteps([
                        BORROW_RECORD_STATUS.PROCESSING,
                        BORROW_RECORD_STATUS.APPROVED,
                        BORROW_RECORD_STATUS.BORROWING,
                        BORROW_RECORD_STATUS.RETURNED
                    ]);
                    setActiveStep([
                        BORROW_RECORD_STATUS.PROCESSING,
                        BORROW_RECORD_STATUS.APPROVED,
                        BORROW_RECORD_STATUS.BORROWING,
                        BORROW_RECORD_STATUS.RETURNED
                    ].indexOf(recordData.status));
                }

                // Fetch borrow record details
                const detailsData = await BorrowRecordApi.fetchBorrowRecordDetails(props.id);
                setDetails(detailsData);

                // Fetch violation types
                const violationTypesData = await BorrowRecordApi.fetchViolationTypes();
                setViolationTypes(violationTypesData);

            } catch (error) {
                console.error("Error:", error);
                toast.error("Failed to load borrow record");
            } finally {
                setLoading(false);
            }
        };

        fetchBorrowRecord();
    }, [props.id]);

    const handleStatusChange = (event: SelectChangeEvent) => {
        const newValue = event.target.value;

        // Check if user wants to update to "Returned" status
        if (newValue === BORROW_RECORD_STATUS.RETURNED) {
            // Check if all books have been returned
            const allBooksReturned = details.every(detail => detail.isReturned);

            if (!allBooksReturned) {
                toast.warning("Không thể cập nhật trạng thái phiếu mượn thành 'Đã trả' vì còn sách chưa được trả!");
                return;
            }

            // Show violation type selector when marking as returned
            setShowViolationSelect(true);
        } else {
            // Hide violation type selector for other statuses
            setShowViolationSelect(false);
            setSelectedViolationType("");
        }

        setNewStatus(newValue);
    };

    // Handle violation type change
    const handleViolationTypeChange = (event: SelectChangeEvent) => {
        setSelectedViolationType(event.target.value);
    };

    // Open dialog to update borrow record detail
    const handleOpenDetailDialog = (detail: BorrowRecordDetail) => {
        setSelectedDetail(detail);
        setUpdatedIsReturned(detail.isReturned);
        setUpdatedReturnDate(BorrowRecordApi.formatDateForInput(detail.returnDate));
        setUpdatedNotes(detail.notes || "");
        setDetailDialogOpen(true);
    };

    // Close dialog to update borrow record detail
    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedDetail(null);
    };

    // Handle updating borrow record detail
    const handleUpdateDetail = async () => {
        if (!selectedDetail) return;

        setUpdatingDetail(true);

        try {
            const effectiveReturnDate = updatedIsReturned
                ? (updatedReturnDate || new Date().toISOString().split('T')[0])
                : null;

            const updateParams: UpdateBookReturnParams = {
                id: selectedDetail.id,
                isReturned: updatedIsReturned,
                returnDate: effectiveReturnDate,
                notes: updatedNotes,
            };

            await BorrowRecordApi.updateBookReturnStatus(updateParams);

            toast.success("Cập nhật chi tiết phiếu mượn thành công");

            // List after updating status
            const updatedDetails = details.map(detail =>
                detail.id === selectedDetail.id
                    ? {
                        ...detail,
                        isReturned: updatedIsReturned,
                        returnDate: updatedIsReturned ? effectiveReturnDate : undefined,
                        notes: updatedNotes
                    }
                    : detail
            );

            // Check before and after update
            const wasAllReturnedBefore = details.every(detail => detail.isReturned);
            const isAllReturnedNow = updatedDetails.every(detail => detail.isReturned);

            // Update state
            setDetails(details.map(detail =>
                detail.id === selectedDetail.id
                    ? {
                        ...detail,
                        isReturned: updatedIsReturned,
                        returnDate: updatedIsReturned
                            ? (effectiveReturnDate ?? undefined)
                            : undefined,
                        notes: updatedNotes
                    }
                    : detail
            ));

            // Notify if all books have been returned
            if (isAllReturnedNow && !wasAllReturnedBefore) {
                toast.info("Tất cả sách đã được trả. Bạn có thể cập nhật trạng thái phiếu mượn thành 'Đã trả'.");
            }

            handleCloseDetailDialog();
        } catch (error) {
            console.error("Error updating borrow record detail:", error);
            toast.error((error as Error).message || "Failed to update borrow record detail");
        } finally {
            setUpdatingDetail(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (props.option !== "update") {
            props.handleCloseModal();
            return;
        }

        if (!record) {
            toast.error("No record data available");
            return;
        }

        // Check if status is "Returned" but not all books have been returned
        if (newStatus === BORROW_RECORD_STATUS.RETURNED && !details.every(detail => detail.isReturned)) {
            toast.error("Không thể cập nhật trạng thái phiếu mượn thành 'Đã trả' vì còn sách chưa được trả!");
            return;
        }

        // Check if violation type is selected when status is "Returned"
        if (newStatus === BORROW_RECORD_STATUS.RETURNED && !selectedViolationType) {
            toast.warning("Vui lòng chọn loại vi phạm (hoặc 'Không vi phạm' nếu không có)");
            return;
        }

        setSubmitting(true);

        try {
            const updateParams: UpdateBorrowRecordParams = {
                idBorrowRecord: record.id,
                status: newStatus,
                notes: newNotes,
                code: newStatus === BORROW_RECORD_STATUS.RETURNED ? selectedViolationType : undefined,
            };

            await BorrowRecordApi.updateBorrowRecord(updateParams);

            toast.success("Cập nhật phiếu mượn thành công");

            if (props.setKeyCountReload) {
                props.setKeyCountReload(Math.random());
            }

            props.handleCloseModal();
        } catch (error) {
            console.error("Error updating borrow record:", error);
            toast.error((error as Error).message || "Failed to update borrow record");
        } finally {
            setSubmitting(false);
        }
    };

    // Dialog to update borrow record detail
    const renderDetailDialog = () => {
        if (!selectedDetail) return null;

        return (
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseDetailDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Cập nhật trạng thái sách
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3, mt: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {selectedDetail.book.nameBook}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tác giả: {selectedDetail.book.author}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Số lượng: {selectedDetail.quantity}
                        </Typography>
                    </Box>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={updatedIsReturned}
                                onChange={(e) => setUpdatedIsReturned(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Đã trả sách"
                        sx={{ mb: 2 }}
                    />

                    {updatedIsReturned && (
                        <TextField
                            label="Ngày trả"
                            type="date"
                            value={updatedReturnDate}
                            onChange={(e) => setUpdatedReturnDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            margin="normal"
                        />
                    )}

                    <TextField
                        label="Ghi chú"
                        multiline
                        rows={3}
                        value={updatedNotes}
                        onChange={(e) => setUpdatedNotes(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailDialog} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleUpdateDetail}
                        color="primary"
                        variant="contained"
                        disabled={updatingDetail}
                        startIcon={updatingDetail ? <CircularProgress size={20} /> : null}
                    >
                        {updatingDetail ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!record) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography variant="h6" color="error">
                    Failed to load borrow record
                </Typography>
            </Box>
        );
    }

    // Calculate statistics
    const stats = BorrowRecordApi.calculateBorrowRecordStats(details);

    return (
        <div className="container bg-white p-4 rounded">
            <Typography variant="h5" component="h2" className="text-center mb-4">
                {props.option === "update" ? "CẬP NHẬT PHIẾU MƯỢN" : "CHI TIẾT PHIẾU MƯỢN"}
            </Typography>

            <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ mr: 2 }}>
                            Trạng thái hiện tại:
                        </Typography>
                        <Chip
                            label={record.status}
                            color={BorrowRecordApi.getStatusColor(record.status) as any}
                            variant="outlined"
                        />
                    </Box>

                    <StepperComponent steps={steps} activeStep={activeStep} />
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Thông tin phiếu mượn
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Mã phiếu
                                </Typography>
                                <Typography variant="body1">{record.id}</Typography>
                            </Box>

                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Tên độc giả
                                </Typography>
                                <Typography variant="body1">{record.userName}</Typography>
                            </Box>

                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Mã thẻ thư viện
                                </Typography>
                                <Typography variant="body1">{record.cardNumber}</Typography>
                            </Box>

                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Ngày mượn
                                </Typography>
                                <Typography variant="body1">{BorrowRecordApi.formatDate(record.borrowDate)}</Typography>
                            </Box>

                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Ngày hẹn trả
                                </Typography>
                                <Typography variant="body1">{BorrowRecordApi.formatDate(record.dueDate)}</Typography>
                            </Box>

                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Ngày trả
                                </Typography>
                                <Typography variant="body1">{BorrowRecordApi.formatDate(record.returnDate)}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Ghi chú
                            </Typography>
                            <Typography variant="body1">{record.notes || "—"}</Typography>
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Thống kê
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Tổng số đầu sách
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {stats.totalTitles}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Tổng số sách
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {stats.totalBooks}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Số sách đã trả
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {stats.returnedBooks}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Số sách chưa trả
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {stats.remainingBooks}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Danh sách sách mượn
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                                <TableRow>
                                    <TableCell>Sách</TableCell>
                                    <TableCell align="center">Số lượng</TableCell>
                                    <TableCell align="center">Trạng thái</TableCell>
                                    <TableCell align="center">Ngày trả</TableCell>
                                    <TableCell>Ghi chú</TableCell>
                                    {props.option === "update" && (
                                        <TableCell align="center">Thao tác</TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {details.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <Box>
                                                    <Typography variant="body1">{detail.book.nameBook}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {detail.book.author}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">{detail.quantity}</TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={detail.isReturned ? "Đã trả" : "Chưa trả"}
                                                color={detail.isReturned ? "success" : "warning"}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">{BorrowRecordApi.formatDate(detail.returnDate)}</TableCell>
                                        <TableCell>{detail.notes || "—"}</TableCell>
                                        {props.option === "update" && (
                                            <TableCell align="center">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleOpenDetailDialog(detail)}
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {props.option === "update" && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Cập nhật trạng thái phiếu mượn
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel id="status-select-label">Trạng thái mới</InputLabel>
                                <Select
                                    labelId="status-select-label"
                                    value={newStatus}
                                    label="Trạng thái mới"
                                    onChange={handleStatusChange}
                                >
                                    <MenuItem value={BORROW_RECORD_STATUS.PROCESSING}>Đang xử lý</MenuItem>
                                    <MenuItem value={BORROW_RECORD_STATUS.APPROVED}>Đã duyệt</MenuItem>
                                    <MenuItem value={BORROW_RECORD_STATUS.BORROWING}>Đang mượn</MenuItem>
                                    <MenuItem value={BORROW_RECORD_STATUS.RETURNED} disabled={!details.every(detail => detail.isReturned)}>
                                        Đã trả {!details.every(detail => detail.isReturned) && "(Cần trả hết sách)"}
                                    </MenuItem>
                                    <MenuItem value={BORROW_RECORD_STATUS.CANCELLED}>Hủy</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Show violation type selector when status is "Returned" */}
                            {showViolationSelect && (
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel id="violation-type-select-label">Loại vi phạm</InputLabel>
                                    <Select
                                        labelId="violation-type-select-label"
                                        value={selectedViolationType}
                                        label="Loại vi phạm"
                                        onChange={handleViolationTypeChange}
                                        required
                                    >
                                        <MenuItem value="">
                                            <em>Chọn loại vi phạm</em>
                                        </MenuItem>
                                        <MenuItem value="Không vi phạm">Không vi phạm</MenuItem>
                                        {violationTypes.map((type) => (
                                            <MenuItem key={type.code} value={type.code}>
                                                {type.code}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {newStatus === BORROW_RECORD_STATUS.RETURNED && !details.every(detail => detail.isReturned) && (
                                <Box sx={{ mb: 2, p: 2, bgcolor: "#fff3e0", borderRadius: 1 }}>
                                    <Typography variant="body2" color="warning.dark">
                                        <b>Lưu ý:</b> Không thể cập nhật trạng thái phiếu mượn thành "Đã trả" vì còn {stats.remainingBooks} sách chưa được trả.
                                        Vui lòng cập nhật trạng thái cho tất cả các sách trước.
                                    </Typography>
                                </Box>
                            )}

                            <FormControl fullWidth>
                                <TextField
                                    label="Ghi chú"
                                    multiline
                                    rows={3}
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                />
                            </FormControl>
                        </Paper>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={props.handleCloseModal}
                    >
                        Đóng
                    </Button>

                    {props.option === "update" && (
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={submitting ||
                                (newStatus === BORROW_RECORD_STATUS.RETURNED && !details.every(detail => detail.isReturned)) ||
                                (newStatus === BORROW_RECORD_STATUS.RETURNED && !selectedViolationType)}
                            startIcon={submitting ? <CircularProgress size={20} /> : null}
                        >
                            {submitting ? "Đang cập nhật..." : "Cập nhật"}
                        </Button>
                    )}
                </Box>
            </form>

            {/* Dialog to update borrow record detail */}
            {renderDetailDialog()}
        </div>
    );
};