import { VisibilityOutlined } from "@mui/icons-material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { DataTable } from "../../../layouts/utils/DataTable";
import BorrowRecordApi, { BorrowRecord, BorrowRecordDetail, BORROW_RECORD_STATUS } from "../../../api/BorrowRecordApi";
import { toast } from "react-toastify";

interface BorrowRequestTableProps {
    setKeyCountReload?: any;
    keyCountReload?: any;
}

export const BorrowRequestTable: React.FC<BorrowRequestTableProps> = (props) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BorrowRecord[]>([]);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

    // State for detail modal
    const [detailModal, setDetailModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<BorrowRecordDetail[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch data from API
    useEffect(() => {
        const fetchBorrowRequests = async () => {
            try {
                setLoading(true);
                const records = await BorrowRecordApi.fetchAllBorrowRecords();

                // Lọc chỉ những phiếu có status "Đang xử lý"
                const pendingRecords = records.filter(
                    record => record.status === BORROW_RECORD_STATUS.PROCESSING
                );

                setData(pendingRecords);
            } catch (error) {
                console.error("Error fetching borrow requests:", error);
                toast.error("Lỗi khi tải danh sách phiếu đặt mượn");
            } finally {
                setLoading(false);
            }
        };

        fetchBorrowRequests();
    }, [props.keyCountReload]);

    // Hàm để phê duyệt phiếu mượn
    const handleApprove = async (recordId: number) => {
        if (processingIds.has(recordId)) return;

        setProcessingIds(prev => new Set(prev).add(recordId));

        try {
            await BorrowRecordApi.updateBorrowRecord({
                idBorrowRecord: recordId,
                status: BORROW_RECORD_STATUS.APPROVED,
                notes: "Phiếu mượn đã được phê duyệt"
            });

            toast.success("Phê duyệt phiếu mượn thành công");

            // Refresh data
            if (props.setKeyCountReload) {
                props.setKeyCountReload(Math.random());
            }
        } catch (error: any) {
            console.error("Error approving borrow record:", error);
            toast.error(error.message || "Lỗi khi phê duyệt phiếu mượn");
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(recordId);
                return newSet;
            });
        }
    };

    // Hàm để từ chối phiếu mượn
    const handleReject = async (recordId: number) => {
        if (processingIds.has(recordId)) return;

        const confirmed = window.confirm("Bạn có chắc chắn muốn từ chối phiếu mượn này?");
        if (!confirmed) return;

        setProcessingIds(prev => new Set(prev).add(recordId));

        try {
            await BorrowRecordApi.updateBorrowRecord({
                idBorrowRecord: recordId,
                status: BORROW_RECORD_STATUS.CANCELLED,
                notes: "Phiếu mượn bị từ chối"
            });

            toast.success("Từ chối phiếu mượn thành công");

            // Refresh data
            if (props.setKeyCountReload) {
                props.setKeyCountReload(Math.random());
            }
        } catch (error: any) {
            console.error("Error rejecting borrow record:", error);
            toast.error(error.message || "Lỗi khi từ chối phiếu mượn");
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(recordId);
                return newSet;
            });
        }
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

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "cardNumber", headerName: "MÃ THẺ", width: 120 },
        { field: "recordId", headerName: "MÃ ĐẶT MƯỢN", width: 150 },
        {
            field: "borrowDate",
            headerName: "NGÀY TẠO",
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
            field: "status",
            headerName: "TRẠNG THÁI",
            width: 130,
            renderCell: (params) => {
                return (
                    <Chip
                        label={params.value}
                        color="info"
                        variant="outlined"
                        size="small"
                    />
                );
            },
        },
        {
            field: "notes",
            headerName: "GHI CHÚ",
            width: 150,
            renderCell: (params) => (
                <span title={params.value || ""}>
                    {params.value ?
                        (params.value.length > 20 ? params.value.substring(0, 20) + "..." : params.value)
                        : "—"
                    }
                </span>
            )
        },
        {
            field: "action",
            headerName: "HÀNH ĐỘNG",
            width: 200,
            type: "actions",
            renderCell: (item) => {
                const isProcessing = processingIds.has(item.id as number);

                return (
                    <div className="d-flex gap-1">
                        <Tooltip title={"Xem chi tiết"}>
                            <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleViewRecord(item.id as number)}
                            >
                                <VisibilityOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={"Phê duyệt"}>
                            <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(item.id as number)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <CheckCircleOutlineIcon fontSize="small" />
                                )}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={"Từ chối"}>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(item.id as number)}
                                disabled={isProcessing}
                            >
                                <CancelOutlinedIcon fontSize="small" />
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

    return (
        <div>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Typography variant="h6">
                        Tổng số phiếu đặt mượn: {data.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Các phiếu mượn đang chờ xử lý và phê duyệt
                    </Typography>
                </div>
            </Box>

            {data.length === 0 ? (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 8,
                        backgroundColor: "#f9f9f9",
                        borderRadius: 2,
                        border: "1px dashed #ddd"
                    }}
                >
                    <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Không có phiếu đặt mượn nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Hiện tại không có phiếu mượn nào đang chờ xử lý
                    </Typography>
                </Box>
            ) : (
                <DataTable columns={columns} rows={data} />
            )}

            {/* Detail Modal */}
            <Dialog
                open={detailModal}
                onClose={handleCloseDetailModal}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <div className="d-flex justify-content-between align-items-center">
                        <Typography variant="h6">
                            Chi tiết phiếu đặt mượn #{selectedRecord?.id}
                        </Typography>
                        <IconButton onClick={handleCloseDetailModal}>
                            <CloseIcon />
                        </IconButton>
                    </div>
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
                                            <small className="text-muted">Mã đặt mượn</small>
                                            <div className="fw-bold">{selectedRecord.recordId}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Ngày tạo</small>
                                            <div className="fw-bold">{BorrowRecordApi.formatDate(selectedRecord.borrowDate)}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Ngày hẹn trả</small>
                                            <div className="fw-bold">{BorrowRecordApi.formatDate(selectedRecord.dueDate)}</div>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <small className="text-muted">Trạng thái</small>
                                            <div>
                                                <Chip
                                                    label={selectedRecord.status}
                                                    color="info"
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-12 mb-2">
                                            <small className="text-muted">Ghi chú</small>
                                            <div>{selectedRecord.notes || "—"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách sách */}
                            <div className="mb-4">
                                <h5 className="mb-2">Danh sách sách mượn ({selectedDetails.length} quyển)</h5>
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
                    <Button onClick={handleCloseDetailModal} color="secondary">
                        Đóng
                    </Button>
                    {selectedRecord && (
                        <>
                            <Button
                                onClick={() => handleApprove(selectedRecord.id)}
                                color="success"
                                variant="contained"
                                disabled={processingIds.has(selectedRecord.id)}
                                startIcon={<CheckCircleOutlineIcon />}
                            >
                                Phê duyệt
                            </Button>
                            <Button
                                onClick={() => handleReject(selectedRecord.id)}
                                color="error"
                                variant="outlined"
                                disabled={processingIds.has(selectedRecord.id)}
                                startIcon={<CancelOutlinedIcon />}
                            >
                                Từ chối
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default BorrowRequestTable;