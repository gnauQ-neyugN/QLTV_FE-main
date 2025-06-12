import { VisibilityOutlined } from "@mui/icons-material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
    Box,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip,
    Typography,
    Button,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { DataTable } from "../../../layouts/utils/DataTable";
import BorrowRecordApi, { BorrowRecord, BORROW_RECORD_STATUS } from "../../../api/BorrowRecordApi";
import { toast } from "react-toastify";

interface BorrowRequestTableProps {
    setId: any;
    setOption: any;
    handleOpenModal: any;
    setKeyCountReload?: any;
    keyCountReload?: any;
}

export const BorrowRequestTable: React.FC<BorrowRequestTableProps> = (props) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BorrowRecord[]>([]);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

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

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "cardNumber", headerName: "MÃ THẺ", width: 120 },
        { field: "userName", headerName: "TÊN NGƯỜI MƯỢN", width: 150 },
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
                                onClick={() => {
                                    props.setOption("view");
                                    props.setId(item.id);
                                    props.handleOpenModal();
                                }}
                            >
                                <VisibilityOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={"Chỉnh sửa"}>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                    props.setOption("update");
                                    props.setId(item.id);
                                    props.handleOpenModal();
                                }}
                            >
                                <EditOutlinedIcon fontSize="small" />
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

                {data.length > 0 && (
                    <div className="d-flex gap-2">
                        <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleOutlineIcon />}
                        >
                            Phê duyệt tất cả
                        </Button>
                    </div>
                )}
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
        </div>
    );
};

export default BorrowRequestTable;