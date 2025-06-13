    import React, { useState, useEffect } from "react";
    import {
        Box,
        Card,
        CardContent,
        TextField,
        Button,
        Typography,
        Chip,
        Divider,
        IconButton,
        Tooltip,
        Alert,
        SelectChangeEvent,
        Dialog,
        DialogTitle,
        DialogContent,
        DialogActions,
    } from "@mui/material";
    import SearchIcon from "@mui/icons-material/Search";
    import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
    import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
    import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
    import UndoIcon from "@mui/icons-material/Undo";
    import CloseIcon from "@mui/icons-material/Close";
    import BorrowRecordApi, {
        BorrowRecord,
        BorrowRecordDetail,
        BORROW_RECORD_STATUS,
        UpdateBorrowRecordParams,
        UpdateBookReturnParams,
        ViolationType
    } from "../../../api/BorrowRecordApi";
    import { toast } from "react-toastify";
    
    interface BorrowRecordSearchProps {
        searchType: "borrow" | "return";
        keyCountReload?: any;
        setOption?: any;
        handleOpenModal?: any;
        setKeyCountReload?: any;
        setId?: any;
    }
    
    const BorrowRecordSearch: React.FC<BorrowRecordSearchProps> = (props) => {
        const [searchValue, setSearchValue] = useState("");
        const [loading, setLoading] = useState(false);
        const [record, setRecord] = useState<BorrowRecord | null>(null);
        const [details, setDetails] = useState<BorrowRecordDetail[]>([]);
        const [notFound, setNotFound] = useState(false);
    
        // State cho modal form
        const [formModalOpen, setFormModalOpen] = useState(false);
        const [formOption, setFormOption] = useState<"view" | "update">("view");
        const [submitting, setSubmitting] = useState(false);
    
        // State cho form update
        const [newStatus, setNewStatus] = useState("");
        const [newNotes, setNewNotes] = useState("");
        const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
        const [selectedViolationType, setSelectedViolationType] = useState<string>("");
        const [showViolationSelect, setShowViolationSelect] = useState(false);
    
        // State cho dialog update detail
        const [detailDialogOpen, setDetailDialogOpen] = useState(false);
        const [selectedDetail, setSelectedDetail] = useState<BorrowRecordDetail | null>(null);
        const [updatedIsReturned, setUpdatedIsReturned] = useState(false);
        const [updatedReturnDate, setUpdatedReturnDate] = useState<string>("");
        const [updatedNotes, setUpdatedNotes] = useState("");
        const [updatedViolationCode, setUpdatedViolationCode] = useState<string>("");
        const [updatingDetail, setUpdatingDetail] = useState(false);
    
        // Fetch violation types khi component mount
        useEffect(() => {
            const fetchViolationTypes = async () => {
                try {
                    const violationTypesData = await BorrowRecordApi.fetchViolationTypes();
                    setViolationTypes(violationTypesData);
                } catch (error) {
                    console.error("Error fetching violation types:", error);
                }
            };
    
            fetchViolationTypes();
        }, []);
    
        // Reset form khi record thay đổi
        useEffect(() => {
            if (record) {
                setNewStatus(record.status);
                setNewNotes(record.notes || "");
            }
        }, [record]);
    
        const handleSearch = async () => {
            if (!searchValue.trim()) {
                toast.warning("Vui lòng nhập mã phiếu mượn");
                return;
            }
    
            setLoading(true);
            setNotFound(false);
            setRecord(null);
            setDetails([]);
    
            try {
                const recordId = parseInt(searchValue.trim());
    
                if (isNaN(recordId)) {
                    toast.error("Mã phiếu mượn không hợp lệ");
                    setNotFound(true);
                    return;
                }
    
                const recordData = await BorrowRecordApi.fetchBorrowRecordById(recordId);
                const detailsData = await BorrowRecordApi.fetchBorrowRecordDetails(recordId);
    
                if (props.searchType === "borrow") {
                    if (recordData.status !== BORROW_RECORD_STATUS.APPROVED) {
                        toast.warning("Phiếu mượn này chưa được phê duyệt hoặc không thể cho mượn");
                        setNotFound(true);
                        return;
                    }
                } else if (props.searchType === "return") {
                    if (recordData.status !== BORROW_RECORD_STATUS.BORROWING) {
                        toast.warning("Phiếu mượn này không ở trạng thái đang mượn");
                        setNotFound(true);
                        return;
                    }
                }
    
                setRecord(recordData);
                setDetails(detailsData);
    
            } catch (error: any) {
                console.error("Error searching borrow record:", error);
                if (error.message.includes("Failed to fetch")) {
                    toast.error("Không tìm thấy phiếu mượn với mã này");
                    setNotFound(true);
                } else {
                    toast.error(error.message || "Lỗi khi tìm kiếm phiếu mượn");
                }
            } finally {
                setLoading(false);
            }
        };
    
        const handleKeyPress = (event: React.KeyboardEvent) => {
            if (event.key === 'Enter') {
                handleSearch();
            }
        };
    
        const handleQuickAction = async (actionType: "approve_borrow" | "complete_return") => {
            if (!record) return;
    
            try {
                if (actionType === "approve_borrow") {
                    await BorrowRecordApi.updateBorrowRecord({
                        idBorrowRecord: record.id,
                        status: BORROW_RECORD_STATUS.BORROWING,
                        notes: "Đã cho mượn sách"
                    });
                    toast.success("Cho mượn sách thành công");
                } else if (actionType === "complete_return") {
                    const allReturned = details.every(detail => detail.isReturned);
                    if (!allReturned) {
                        toast.warning("Vui lòng trả tất cả sách trước khi hoàn tất phiếu mượn");
                        return;
                    }
    
                    await BorrowRecordApi.updateBorrowRecord({
                        idBorrowRecord: record.id,
                        status: BORROW_RECORD_STATUS.RETURNED,
                        notes: "Đã trả tất cả sách"
                    });
                    toast.success("Hoàn tất trả sách thành công");
                }
    
                setRecord(null);
                setDetails([]);
                setSearchValue("");
    
                if (props.setKeyCountReload) {
                    props.setKeyCountReload(Math.random());
                }
    
            } catch (error: any) {
                console.error("Error performing quick action:", error);
                toast.error(error.message || "Lỗi khi thực hiện thao tác");
            }
        };
    
        // Mở form modal
        const handleOpenFormModal = (option: "view" | "update") => {
            setFormOption(option);
            setFormModalOpen(true);
        };
    
        // Đóng form modal
        const handleCloseFormModal = () => {
            setFormModalOpen(false);
            setShowViolationSelect(false);
            setSelectedViolationType("");
        };
    
        // Xử lý thay đổi status trong form
        const handleStatusChange = (event: SelectChangeEvent) => {
            const newValue = event.target.value;
    
            if (newValue === BORROW_RECORD_STATUS.RETURNED) {
                const allBooksReturned = details.every(detail => detail.isReturned);
    
                if (!allBooksReturned) {
                    toast.warning("Không thể cập nhật trạng thái phiếu mượn thành 'Đã trả' vì còn sách chưa được trả!");
                    return;
                }
    
                setShowViolationSelect(true);
            } else {
                setShowViolationSelect(false);
                setSelectedViolationType("");
            }
    
            setNewStatus(newValue);
        };
    
        // Xử lý cập nhật phiếu mượn trong form
        const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
    
            if (formOption !== "update" || !record) {
                handleCloseFormModal();
                return;
            }
    
            if (newStatus === BORROW_RECORD_STATUS.RETURNED && !details.every(detail => detail.isReturned)) {
                toast.error("Không thể cập nhật trạng thái phiếu mượn thành 'Đã trả' vì còn sách chưa được trả!");
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
    
                // Cập nhật lại record hiện tại
                const updatedRecord = { ...record, status: newStatus, notes: newNotes };
                setRecord(updatedRecord);
    
                if (props.setKeyCountReload) {
                    props.setKeyCountReload(Math.random());
                }
    
                handleCloseFormModal();
            } catch (error) {
                console.error("Error updating borrow record:", error);
                toast.error((error as Error).message || "Failed to update borrow record");
            } finally {
                setSubmitting(false);
            }
        };
    
        // Mở dialog cập nhật detail
        const handleOpenDetailDialog = (detail: BorrowRecordDetail) => {
            setSelectedDetail(detail);
            setUpdatedIsReturned(detail.isReturned);
            setUpdatedReturnDate(BorrowRecordApi.formatDateForInput(detail.returnDate));
            setUpdatedNotes(detail.notes || "");
            setUpdatedViolationCode(detail.violationType?.code || "");
            setDetailDialogOpen(true);
        };
    
        // Đóng dialog cập nhật detail
        const handleCloseDetailDialog = () => {
            setDetailDialogOpen(false);
            setSelectedDetail(null);
        };
    
        // Cập nhật detail
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
                    code: updatedViolationCode || "Không vi phạm",
                };
    
                await BorrowRecordApi.updateBookReturnStatus(updateParams);
    
                toast.success("Cập nhật chi tiết phiếu mượn thành công");
    
                // Cập nhật details local
                const updatedDetails = details.map(detail =>
                    detail.id === selectedDetail.id
                        ? {
                            ...detail,
                            isReturned: updatedIsReturned,
                            returnDate: updatedIsReturned ? (effectiveReturnDate || undefined) : undefined,
                            notes: updatedNotes
                        }
                        : detail
                );
    
                setDetails(updatedDetails);
                handleCloseDetailDialog();
            } catch (error) {
                console.error("Error updating borrow record detail:", error);
                toast.error((error as Error).message || "Failed to update borrow record detail");
            } finally {
                setUpdatingDetail(false);
            }
        };
    
        const getStatusColorClass = (status: string) => {
            const colorMap = BorrowRecordApi.getStatusColor(status);
            switch (colorMap) {
                case 'success': return 'success';
                case 'info': return 'info';
                case 'primary': return 'primary';
                case 'secondary': return 'default';
                case 'error': return 'error';
                default: return 'default';
            }
        };
    
        const calculateStats = () => {
            if (!details.length) return { totalBooks: 0, returnedBooks: 0, remainingBooks: 0 };
    
            const totalBooks = details.reduce((total, detail) => total + detail.quantity, 0);
            const returnedBooks = details
                .filter(detail => detail.isReturned)
                .reduce((total, detail) => total + detail.quantity, 0);
    
            return {
                totalBooks,
                returnedBooks,
                remainingBooks: totalBooks - returnedBooks
            };
        };
    
        const stats = calculateStats();
    
        return (
            <div>
                {/* Search Section */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            <SearchIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                            Tìm kiếm phiếu mượn
                        </Typography>
    
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                            <TextField
                                fullWidth
                                label="Nhập mã phiếu mượn"
                                variant="outlined"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                placeholder="Ví dụ: 1, 2, 3..."
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSearch}
                                disabled={loading}
                                startIcon={<SearchIcon />}
                                sx={{ minWidth: 120 }}
                            >
                                {loading ? "Đang tìm..." : "Tìm kiếm"}
                            </Button>
                        </Box>
    
                        {props.searchType === "borrow" && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    <strong>Lưu ý:</strong> Chỉ hiển thị các phiếu mượn đã được phê duyệt và sẵn sàng cho mượn.
                                </Typography>
                            </Alert>
                        )}
    
                        {props.searchType === "return" && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="body2">
                                    <strong>Lưu ý:</strong> Chỉ hiển thị các phiếu mượn đang trong trạng thái mượn sách.
                                </Typography>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
    
                {/* Not Found Message */}
                {notFound && (
                    <Card>
                        <CardContent>
                            <Box sx={{ textAlign: "center", py: 4 }}>
                                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Không tìm thấy phiếu mượn
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Vui lòng kiểm tra lại mã phiếu mượn hoặc trạng thái phiếu mượn
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                )}
    
                {/* Record Details */}
                {record && (
                    <Card>
                        <CardContent>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Typography variant="h6">
                                    Chi tiết phiếu mượn #{record.id}
                                </Typography>
                                <div className="d-flex gap-2">
                                    <Tooltip title="Xem chi tiết">
                                        <IconButton
                                            color="secondary"
                                            onClick={() => handleOpenFormModal("view")}
                                        >
                                            <VisibilityOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            </div>
    
                            {/* Basic Info */}
                            <div className="row mb-4">
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                                    <Chip
                                        label={record.status}
                                        color={getStatusColorClass(record.status) as any}
                                        variant="outlined"
                                        size="small"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Mã thẻ thư viện</Typography>
                                    <Typography variant="body1" fontWeight="bold">{record.cardNumber}</Typography>
                                </div>
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Tên người mượn</Typography>
                                    <Typography variant="body1" fontWeight="bold">{record.userName}</Typography>
                                </div>
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Ngày mượn</Typography>
                                    <Typography variant="body1">{BorrowRecordApi.formatDate(record.borrowDate)}</Typography>
                                </div>
                            </div>
    
                            <div className="row mb-4">
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Ngày hẹn trả</Typography>
                                    <Typography variant="body1">{BorrowRecordApi.formatDate(record.dueDate)}</Typography>
                                </div>
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Ngày trả</Typography>
                                    <Typography variant="body1">{BorrowRecordApi.formatDate(record.returnDate)}</Typography>
                                </div>
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Tiền phạt</Typography>
                                    <Typography variant="body1" className={record.fineAmount && record.fineAmount > 0 ? "text-danger fw-bold" : ""}>
                                        {(record.fineAmount ?? 0).toLocaleString("vi-VN")}₫
                                    </Typography>
                                </div>
                                <div className="col-md-3">
                                    <Typography variant="body2" color="text.secondary">Ghi chú</Typography>
                                    <Typography variant="body1">{record.notes || "—"}</Typography>
                                </div>
                            </div>
    
                            {/* Statistics */}
                            {props.searchType === "return" && (
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <Typography variant="h6" color="primary">{stats.totalBooks}</Typography>
                                                <Typography variant="body2" color="text.secondary">Tổng số sách</Typography>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <Typography variant="h6" color="success.main">{stats.returnedBooks}</Typography>
                                                <Typography variant="body2" color="text.secondary">Đã trả</Typography>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <Typography variant="h6" color="warning.main">{stats.remainingBooks}</Typography>
                                                <Typography variant="body2" color="text.secondary">Chưa trả</Typography>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
    
                            <Divider sx={{ my: 2 }} />
    
                            {/* Books List */}
                            <Typography variant="h6" gutterBottom>
                                Danh sách sách ({details.length} đầu sách)
                            </Typography>
    
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead style={{ backgroundColor: "#f5f5f5" }}>
                                    <tr>
                                        <th>STT</th>
                                        <th>Tên sách</th>
                                        <th>Mã vạch</th>
                                        <th>Vị trí</th>
                                        <th>Tình trạng</th>
                                        {props.searchType === "return" && <th>Trạng thái trả</th>}
                                        {props.searchType === "return" && <th>Ngày trả</th>}
                                        {props.searchType === "return" && <th>Vi phạm</th>}
                                        {props.searchType === "return" && <th>Ghi chú</th>}
                                        {props.searchType === "return" && <th className="text-center">Thao tác</th>}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {details.map((detail, index) => (
                                        <tr key={detail.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div>
                                                    <div className="fw-bold">{detail.bookItem.book.nameBook}</div>
                                                    <small className="text-muted">{detail.bookItem.book.author}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fw-bold">{detail.bookItem.barcode}</span>
                                            </td>
                                            <td>{detail.bookItem.location}</td>
                                            <td>
                                                    <span className={`badge ${
                                                        detail.bookItem.condition >= 80 ? "bg-success" :
                                                            detail.bookItem.condition >= 60 ? "bg-warning text-dark" : "bg-danger"
                                                    }`}>
                                                        {detail.bookItem.condition}%
                                                    </span>
                                            </td>
                                            {props.searchType === "return" && (
                                                <>
                                                    <td>
                                                            <span className={`badge ${detail.isReturned ? 'bg-success' : 'bg-warning'}`}>
                                                                {detail.isReturned ? 'Đã trả' : 'Chưa trả'}
                                                            </span>
                                                    </td>
                                                    <td>{BorrowRecordApi.formatDate(detail.returnDate)}</td>
                                                    <td>
                                                        {detail.violationType ? (
                                                            <span className={`badge ${
                                                                detail.violationType.code === 'Không vi phạm' ? 'bg-success' : 'bg-danger'
                                                            }`}>
                                                                    {detail.violationType.code}
                                                                </span>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </td>
                                                    <td>{detail.notes || "—"}</td>
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleOpenDetailDialog(detail)}
                                                            title="Cập nhật trạng thái"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
    
                            <Divider sx={{ my: 3 }} />
    
                            {/* Quick Actions */}
                            <div className="d-flex justify-content-center gap-3">
                                {props.searchType === "borrow" && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="large"
                                        startIcon={<CheckCircleOutlineIcon />}
                                        onClick={() => handleQuickAction("approve_borrow")}
                                    >
                                        Cho mượn sách
                                    </Button>
                                )}
    
                                {props.searchType === "return" && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        startIcon={<UndoIcon />}
                                        onClick={() => handleQuickAction("complete_return")}
                                        disabled={stats.remainingBooks > 0}
                                    >
                                        Hoàn tất trả sách
                                    </Button>
                                )}
    
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="large"
                                    onClick={() => {
                                        setRecord(null);
                                        setDetails([]);
                                        setSearchValue("");
                                        setNotFound(false);
                                    }}
                                >
                                    Tìm kiếm khác
                                </Button>
                            </div>
    
                            {props.searchType === "return" && stats.remainingBooks > 0 && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Lưu ý:</strong> Còn {stats.remainingBooks} sách chưa được trả.
                                        Vui lòng trả tất cả sách trước khi hoàn tất phiếu mượn.
                                    </Typography>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}
    
                {/* Form Modal */}
                <Dialog
                    open={formModalOpen}
                    onClose={handleCloseFormModal}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        <div className="d-flex justify-content-between align-items-center">
                            <Typography variant="h6">
                                {formOption === "update" ? "CẬP NHẬT PHIẾU MƯỢN" : "CHI TIẾT PHIẾU MƯỢN"}
                            </Typography>
                            <IconButton onClick={handleCloseFormModal}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </DialogTitle>
                    <DialogContent>
                        {record && (
                            <form onSubmit={handleFormSubmit}>
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <span className="me-2">Trạng thái hiện tại:</span>
                                        <span className={`badge bg-${getStatusColorClass(record.status)}`}>
                                            {record.status}
                                        </span>
                                    </div>
                                </div>
    
                                <div className="mb-4">
                                    <h5 className="mb-2">Thông tin phiếu mượn</h5>
                                    <div className="card p-3">
                                        <div className="row">
                                            <div className="col-md-4 mb-2">
                                                <small className="text-muted">Mã phiếu</small>
                                                <div className="fw-bold">{record.id}</div>
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <small className="text-muted">Mã thẻ thư viện</small>
                                                <div className="fw-bold">{record.cardNumber}</div>
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <small className="text-muted">Ngày mượn</small>
                                                <div className="fw-bold">{BorrowRecordApi.formatDate(record.borrowDate)}</div>
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <small className="text-muted">Ngày hẹn trả</small>
                                                <div className="fw-bold">{BorrowRecordApi.formatDate(record.dueDate)}</div>
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <small className="text-muted">Ngày trả</small>
                                                <div className="fw-bold">{BorrowRecordApi.formatDate(record.returnDate)}</div>
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <small className="text-muted">Tiền phạt</small>
                                                <div className={`fw-bold ${record.fineAmount && record.fineAmount > 0 ? "text-danger" : ""}`}>
                                                    {(record.fineAmount ?? 0).toLocaleString("vi-VN")}₫
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <small className="text-muted">Ghi chú</small>
                                            <div>{record.notes || "—"}</div>
                                        </div>
                                    </div>
                                </div>
    
                                <div className="mb-4">
                                    <h5 className="mb-2">Thống kê</h5>
                                    <div className="row">
                                        <div className="col-md-3">
                                            <div className="card text-center">
                                                <div className="card-body">
                                                    <h6 className="card-title">Tổng số đầu sách</h6>
                                                    <div className="h4 text-primary">{details.length}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card text-center">
                                                <div className="card-body">
                                                    <h6 className="card-title">Tổng số sách</h6>
                                                    <div className="h4 text-info">{stats.totalBooks}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card text-center">
                                                <div className="card-body">
                                                    <h6 className="card-title">Đã trả</h6>
                                                    <div className="h4 text-success">{stats.returnedBooks}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card text-center">
                                                <div className="card-body">
                                                    <h6 className="card-title">Chưa trả</h6>
                                                    <div className="h4 text-warning">{stats.remainingBooks}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
    
                                <div className="mb-4">
                                    <h5 className="mb-2">Danh sách sách mượn</h5>
                                    <div className="card">
                                        <div className="table-responsive">
                                            <table className="table table-striped mb-0">
                                                <thead style={{ backgroundColor: "#f5f5f5" }}>
                                                <tr>
                                                    <th>STT</th>
                                                    <th>Tên sách</th>
                                                    <th>Mã vạch</th>
                                                    <th>Vị trí</th>
                                                    <th>Tình trạng</th>
                                                    <th>Đã trả</th>
                                                    <th>Ngày trả</th>
                                                    <th>Vi phạm</th>
                                                    <th>Ghi chú</th>
                                                    {formOption === "update" && <th className="text-center">Thao tác</th>}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {details.map((detail, index) => (
                                                    <tr key={detail.id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <div>
                                                                <div className="fw-bold">{detail.bookItem.book.nameBook}</div>
                                                                <small className="text-muted">{detail.bookItem.book.author}</small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-outline-secondary">{detail.bookItem.barcode}</span>
                                                        </td>
                                                        <td>{detail.bookItem.location}</td>
                                                        <td>
                                                                <span className={`badge ${
                                                                    detail.bookItem.condition >= 80 ? "bg-success" :
                                                                        detail.bookItem.condition >= 60 ? "bg-warning text-dark" : "bg-danger"
                                                                }`}>
                                                                    {detail.bookItem.condition}%
                                                                </span>
                                                        </td>
                                                        <td>
                                                                <span className={`badge ${detail.isReturned ? 'bg-success' : 'bg-warning'}`}>
                                                                    {detail.isReturned ? 'Đã trả' : 'Chưa trả'}
                                                                </span>
                                                        </td>
                                                        <td>{BorrowRecordApi.formatDate(detail.returnDate)}</td>
                                                        <td>
                                                            {detail.violationType ? (
                                                                <span className={`badge ${
                                                                    detail.violationType.code === 'Không vi phạm' ? 'bg-success' : 'bg-danger'
                                                                }`}>
                                                                    {detail.violationType.code}
                                                                </span>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </td>
                                                        <td>{detail.notes || "—"}</td>
                                                        {formOption === "update" && (
                                                            <td className="text-center">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => handleOpenDetailDialog(detail)}
                                                                    title="Cập nhật trạng thái"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
    
                                {formOption === "update" && (
                                    <div className="mb-4">
                                        <h5 className="mb-2">Cập nhật phiếu mượn</h5>
                                        <div className="card p-3">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Trạng thái phiếu mượn</label>
                                                    <select
                                                        className="form-control"
                                                        value={newStatus}
                                                        onChange={(e) => handleStatusChange(e as any)}
                                                    >
                                                        <option value={BORROW_RECORD_STATUS.PROCESSING}>Đang xử lý</option>
                                                        <option value={BORROW_RECORD_STATUS.APPROVED}>Đã duyệt</option>
                                                        <option value={BORROW_RECORD_STATUS.BORROWING}>Đang mượn</option>
                                                        <option value={BORROW_RECORD_STATUS.RETURNED}>Đã trả</option>
                                                        <option value={BORROW_RECORD_STATUS.CANCELLED}>Hủy</option>
                                                    </select>
                                                </div>
    
                                                <div className="col-12">
                                                    <label className="form-label">Ghi chú</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={3}
                                                        value={newNotes}
                                                        onChange={(e) => setNewNotes(e.target.value)}
                                                        placeholder="Nhập ghi chú cho phiếu mượn..."
                                                    />
                                                </div>
                                            </div>
    
                                            {newStatus === BORROW_RECORD_STATUS.RETURNED && stats.remainingBooks > 0 && (
                                                <div className="alert alert-warning mt-3">
                                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                                    Chưa thể cập nhật trạng thái thành "Đã trả" vì còn {stats.remainingBooks} sách chưa được trả.
                                                    Vui lòng cập nhật trạng thái từng sách trước.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </form>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseFormModal} color="secondary">
                            {formOption === "update" ? "Hủy" : "Đóng"}
                        </Button>
                        {formOption === "update" && (
                            <Button
                                onClick={handleFormSubmit as any}
                                color="primary"
                                variant="contained"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    "Cập nhật phiếu mượn"
                                )}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
    
                {/* Dialog cập nhật detail */}
                <Dialog
                    open={detailDialogOpen}
                    onClose={handleCloseDetailDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        <div className="d-flex justify-content-between align-items-center">
                            <Typography variant="h6">
                                Cập nhật trạng thái sách
                            </Typography>
                            <IconButton onClick={handleCloseDetailDialog}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </DialogTitle>
                    <DialogContent>
                        {selectedDetail && (
                            <div>
                                <div className="mb-3">
                                    <h6>{selectedDetail.bookItem.book.nameBook}</h6>
                                    <div className="text-muted">Tác giả: {selectedDetail.bookItem.book.author}</div>
                                    <div className="text-muted">Mã vạch: {selectedDetail.bookItem.barcode}</div>
                                    <div className="text-muted">Vị trí: {selectedDetail.bookItem.location}</div>
                                </div>
    
                                <div className="form-check form-switch mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={updatedIsReturned}
                                        onChange={(e) => setUpdatedIsReturned(e.target.checked)}
                                    />
                                    <label className="form-check-label">
                                        Đã trả sách
                                    </label>
                                </div>
    
                                {updatedIsReturned && (
                                    <div className="mb-3">
                                        <label className="form-label">Loại vi phạm</label>
                                        <select
                                            className="form-control"
                                            value={updatedViolationCode}
                                            onChange={(e) => setUpdatedViolationCode(e.target.value)}
                                        >
                                            <option value="">Chọn loại vi phạm</option>
                                            <option value="Không vi phạm">Không vi phạm</option>
                                            {violationTypes.map((type) => (
                                                <option key={type.code} value={type.code}>
                                                    {type.code} - {type.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
    
                                <div className="mb-3">
                                    <label className="form-label">Ghi chú</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={updatedNotes}
                                        onChange={(e) => setUpdatedNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDetailDialog} color="secondary">
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateDetail}
                            color="primary"
                            variant="contained"
                            disabled={updatingDetail}
                        >
                            {updatingDetail ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Đang cập nhật...
                                </>
                            ) : (
                                "Cập nhật"
                            )}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    };
    
    export default BorrowRecordSearch;