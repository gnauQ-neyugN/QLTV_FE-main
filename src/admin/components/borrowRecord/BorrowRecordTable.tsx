import { VisibilityOutlined } from "@mui/icons-material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
    Box,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Tooltip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { DataTable } from "../../../layouts/utils/DataTable";
import BorrowRecordApi, { BorrowRecord, BorrowRecordDetail, BORROW_RECORD_STATUS } from "../../../api/BorrowRecordApi";
import { toast } from "react-toastify";

interface BorrowRecordTableProps {
    setKeyCountReload?: any;
    keyCountReload?: any;
}

export const BorrowRecordTable: React.FC<BorrowRecordTableProps> = (props) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BorrowRecord[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // State for detail modal
    const [detailModal, setDetailModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<BorrowRecordDetail[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch data from API
    useEffect(() => {
        const fetchBorrowRecords = async () => {
            try {
                setLoading(true);
                const records = await BorrowRecordApi.fetchAllBorrowRecords();
                setData(records);
            } catch (error) {
                console.error("Error fetching borrow records:", error);
                toast.error("Lỗi khi tải danh sách phiếu mượn");
            } finally {
                setLoading(false);
            }
        };

        fetchBorrowRecords();
    }, [props.keyCountReload]);

    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value);
    };

    const handleViewRecord = async (recordId: number) => {
        try {
            setLoadingDetails(true);
            const record = data.find(r => r.id === recordId);
            if (record) {
                setSelectedRecord(record);
                const details = await BorrowRecordApi.fetchBorrowRecordDetails(recordId);
                setSelectedDetails(details);
                setDetailModal(true);
            }
        } catch (error) {
            console.error("Error fetching record details:", error);
            toast.error("Lỗi khi tải chi tiết phiếu mượn");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseDetailModal = () => {
        setDetailModal(false);
        setSelectedRecord(null);
        setSelectedDetails([]);
    };

    const filteredData = statusFilter === "all"
        ? data
        : data.filter(record => record.status === statusFilter);

    const calculateStats = (details: BorrowRecordDetail[]) => {
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

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "cardNumber", headerName: "MÃ THẺ", width: 120 },
        {
            field: "borrowDate",
            headerName: "NGÀY MƯỢN",
            width: 120,
            renderCell: (params) => BorrowRecordApi.formatDate(params.value as string)
        },
        {
            field: "dueDate",
            headerName: "NGÀY HẸN TRẢ",
            width: 120,
            renderCell: (params) => BorrowRecordApi.formatDate(params.value as string)
        },
        {
            field: "returnDate",
            headerName: "NGÀY TRẢ",
            width: 120,
            renderCell: (params) => BorrowRecordApi.formatDate(params.value as string)
        },
        {
            field: "status",
            headerName: "TRẠNG THÁI",
            width: 130,
            renderCell: (params) => {
                return (
                    <Chip
                        label={params.value}
                        color={BorrowRecordApi.getStatusColor(params.value as string) as any}
                        variant="outlined"
                        size="small"
                    />
                );
            },
        },
        {
            field: "fineAmount",
            headerName: "Tiền phạt",
            width: 120,
            renderCell: (params) => (
                <span className={params.value > 0 ? "text-danger fw-bold" : ""}>
                    {(params.value || 0).toLocaleString("vi-VN")}₫
                </span>
            )
        },
        {
            field: "action",
            headerName: "HÀNH ĐỘNG",
            width: 120,
            type: "actions",
            renderCell: (item) => {
                return (
                    <div>
                        <Tooltip title={"Xem chi tiết"}>
                            <IconButton
                                color="secondary"
                                onClick={() => handleViewRecord(item.id as number)}
                            >
                                <VisibilityOutlined />
                            </IconButton>
                        </Tooltip>
                    </div>
                );
            },
        },
    ];

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "200px",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    const stats = selectedDetails.length > 0 ? calculateStats(selectedDetails) : { totalBooks: 0, returnedBooks: 0, remainingBooks: 0 };

    return (
        <div>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Tổng số phiếu mượn: {data.length}</Typography>
                <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
                    <InputLabel id="status-filter-label">Lọc theo trạng thái</InputLabel>
                    <Select
                        labelId="status-filter-label"
                        id="status-filter"
                        value={statusFilter}
                        label="Lọc theo trạng thái"
                        onChange={handleStatusFilterChange}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value={BORROW_RECORD_STATUS.PROCESSING}>Đang xử lý</MenuItem>
                        <MenuItem value={BORROW_RECORD_STATUS.APPROVED}>Đã duyệt</MenuItem>
                        <MenuItem value={BORROW_RECORD_STATUS.BORROWING}>Đang mượn</MenuItem>
                        <MenuItem value={BORROW_RECORD_STATUS.RETURNED}>Đã trả</MenuItem>
                        <MenuItem value={BORROW_RECORD_STATUS.CANCELLED}>Hủy</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <DataTable columns={columns} rows={filteredData} />

            {/* Detail Modal */}
            <Dialog
                open={detailModal}
                onClose={handleCloseDetailModal}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6">
                        Chi tiết phiếu mượn #{selectedRecord?.id}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {loadingDetails ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedRecord ? (
                        <div>
                            {/* Thông tin cơ bản */}
                            <div className="mb-4">
                                <h5 className="mb-2">Thông tin phiếu mượn</h5>
                                <div className="card p-3">
                                    <div className="row">
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Mã phiếu</small>
                                            <div className="fw-bold">{selectedRecord.id}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Mã thẻ thư viện</small>
                                            <div className="fw-bold">{selectedRecord.cardNumber}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Ngày mượn</small>
                                            <div className="fw-bold">{BorrowRecordApi.formatDate(selectedRecord.borrowDate)}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Ngày hẹn trả</small>
                                            <div className="fw-bold">{BorrowRecordApi.formatDate(selectedRecord.dueDate)}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Ngày trả</small>
                                            <div className="fw-bold">{BorrowRecordApi.formatDate(selectedRecord.returnDate)}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Trạng thái</small>
                                            <div>
                                                <Chip
                                                    label={selectedRecord.status}
                                                    color={BorrowRecordApi.getStatusColor(selectedRecord.status) as any}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Tiền phạt</small>
                                            <div className={`fw-bold ${selectedRecord.fineAmount && selectedRecord.fineAmount > 0 ? "text-danger" : ""}`}>
                                                {(selectedRecord.fineAmount ?? 0).toLocaleString("vi-VN")}₫
                                            </div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Ghi chú</small>
                                            <div>{selectedRecord.notes || "—"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thống kê */}
                            <div className="mb-4">
                                <h5 className="mb-2">Thống kê</h5>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="card text-center">
                                            <div className="card-body">
                                                <h6 className="card-title">Tổng số đầu sách</h6>
                                                <div className="h4 text-primary">{selectedDetails.length}</div>
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

                            {/* Danh sách sách */}
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
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedDetails.map((detail, index) => (
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
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailModal} color="primary">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};