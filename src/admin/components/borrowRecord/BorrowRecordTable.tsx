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
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { DataTable } from "../../../layouts/utils/DataTable";
import BorrowRecordApi, { BorrowRecord, BORROW_RECORD_STATUS } from "../../../api/BorrowRecordApi";

interface BorrowRecordTableProps {
    setId: any;
    setOption: any;
    handleOpenModal: any;
    setKeyCountReload?: any;
    keyCountReload?: any;
}

export const BorrowRecordTable: React.FC<BorrowRecordTableProps> = (props) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BorrowRecord[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Fetch data from API
    useEffect(() => {
        const fetchBorrowRecords = async () => {
            try {
                setLoading(true);
                const records = await BorrowRecordApi.fetchAllBorrowRecords();
                setData(records);
            } catch (error) {
                console.error("Error fetching borrow records:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBorrowRecords();
    }, [props.keyCountReload]);

    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value);
    };

    const filteredData = statusFilter === "all"
        ? data
        : data.filter(record => record.status === statusFilter);

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
            width: 150,
            renderCell: (params) => {
                return (
                    <Chip
                        label={params.value}
                        color={BorrowRecordApi.getStatusColor(params.value as string) as any}
                        variant="outlined"
                    />
                );
            },
        },
        {
            field: "fineAmount",
            headerName: "Tiền phạt",
            width: 120,
        },
        {
            field: "action",
            headerName: "HÀNH ĐỘNG",
            width: 150,
            type: "actions",
            renderCell: (item) => {
                return (
                    <div>
                        <Tooltip title={"Xem chi tiết"}>
                            <IconButton
                                color="secondary"
                                onClick={() => {
                                    props.setOption("view");
                                    props.setId(item.id);
                                    props.handleOpenModal();
                                }}
                            >
                                <VisibilityOutlined />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={"Cập nhật trạng thái"}>
                            <IconButton
                                color="primary"
                                onClick={() => {
                                    props.setOption("update");
                                    props.setId(item.id);
                                    props.handleOpenModal();
                                }}
                                disabled={item.row.status === BORROW_RECORD_STATUS.RETURNED || item.row.status === BORROW_RECORD_STATUS.CANCELLED}
                            >
                                <EditOutlinedIcon />
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
        </div>
    );
};