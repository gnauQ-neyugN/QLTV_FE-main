import React, { useState } from "react";
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
    Alert
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";
import BorrowRecordApi, { BorrowRecord, BorrowRecordDetail, BORROW_RECORD_STATUS } from "../../../api/BorrowRecordApi";
import { toast } from "react-toastify";

interface BorrowRecordSearchProps {
    searchType: "borrow" | "return";
    keyCountReload?: any;
    setOption: any;
    handleOpenModal: any;
    setKeyCountReload?: any;
    setId: any;
}

const BorrowRecordSearch: React.FC<BorrowRecordSearchProps> = (props) => {
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [record, setRecord] = useState<BorrowRecord | null>(null);
    const [details, setDetails] = useState<BorrowRecordDetail[]>([]);
    const [notFound, setNotFound] = useState(false);

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
            // Tìm kiếm bằng ID
            const recordId = parseInt(searchValue.trim());

            if (isNaN(recordId)) {
                toast.error("Mã phiếu mượn không hợp lệ");
                setNotFound(true);
                return;
            }

            // Fetch record và details
            const recordData = await BorrowRecordApi.fetchBorrowRecordById(recordId);
            const detailsData = await BorrowRecordApi.fetchBorrowRecordDetails(recordId);

            // Kiểm tra trạng thái phù hợp với tab hiện tại
            if (props.searchType === "borrow") {
                // Tab mượn: chỉ hiển thị phiếu đã được phê duyệt
                if (recordData.status !== BORROW_RECORD_STATUS.APPROVED) {
                    toast.warning("Phiếu mượn này chưa được phê duyệt hoặc không thể cho mượn");
                    setNotFound(true);
                    return;
                }
            } else if (props.searchType === "return") {
                // Tab trả: chỉ hiển thị phiếu đang mượn
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
                // Kiểm tra xem tất cả sách đã được trả chưa
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

            // Reset sau khi thực hiện action
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
                                        onClick={() => {
                                            props.setOption("view");
                                            props.setId(record.id);
                                            props.handleOpenModal();
                                        }}
                                    >
                                        <VisibilityOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Chỉnh sửa">
                                    <IconButton
                                        color="primary"
                                        onClick={() => {
                                            props.setOption("update");
                                            props.setId(record.id);
                                            props.handleOpenModal();
                                        }}
                                    >
                                        <EditOutlinedIcon />
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
        </div>
    );
};

export default BorrowRecordSearch;