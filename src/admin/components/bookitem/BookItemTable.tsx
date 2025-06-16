import { DeleteOutlineOutlined } from "@mui/icons-material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    Chip,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState, useMemo } from "react";
import { DataTable } from "../../../layouts/utils/DataTable";
import BookItemModel from "../../../model/BookItemModel";
import { getAllBookItems, deleteBookItem } from "../../../api/BookItemApi";
import { toast } from "react-toastify";
import { useConfirm } from "material-ui-confirm";

interface BookItemTableProps {
    setOption: any;
    handleOpenModal: any;
    setKeyCountReload?: any;
    keyCountReload?: any;
    setId: any;
}

const BOOK_STATUS_OPTIONS = [
    { value: "AVAILABLE", label: "Có sẵn", color: "success" as const },
    { value: "BORROWED", label: "Đã mượn", color: "warning" as const },
    { value: "RESERVED", label: "Đã đặt trước", color: "info" as const },
    { value: "MAINTENANCE", label: "Bảo trì", color: "default" as const },
    { value: "LOST", label: "Mất", color: "error" as const },
    { value: "DAMAGED", label: "Hỏng", color: "error" as const },
];

const CONDITION_OPTIONS = [
    { value: 1, label: "Rất tệ" },
    { value: 2, label: "Tệ" },
    { value: 3, label: "Bình thường" },
    { value: 4, label: "Tốt" },
    { value: 5, label: "Rất tốt" },
];

export const BookItemTable: React.FC<BookItemTableProps> = (props) => {
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const confirm = useConfirm();
    const [data, setData] = useState<BookItemModel[]>([]);

    // Lấy tất cả BookItem
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getAllBookItems(1000, 0);

                // Thêm id cho DataGrid
                const bookItemsWithId = response.bookItemList.map((item) => ({
                    ...item,
                    id: item.idBookItem,
                }));

                setData(bookItemsWithId);
            } catch (error) {
                console.error("Error fetching book items:", error);
                toast.error("Không thể tải danh sách BookItem");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [props.keyCountReload]);

    // Lọc dữ liệu theo từ khóa tìm kiếm
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter((bookItem) =>
            bookItem.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookItem.book?.nameBook?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookItem.book?.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookItem.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    // Xử lý xem chi tiết BookItem
    const handleViewBookItem = (id: any) => {
        props.setOption("view");
        props.setId(id);
        props.handleOpenModal();
    };

    // Xử lý xóa BookItem
    const handleDeleteBookItem = (id: any) => {
        confirm({
            title: "Xóa BookItem",
            description: `Bạn chắc chắn muốn xóa BookItem này?`,
            confirmationText: "Xóa",
            cancellationText: "Hủy",
        })
            .then(async () => {
                try {
                    await deleteBookItem(id);
                    toast.success("Xóa BookItem thành công");
                    props.setKeyCountReload?.(Math.random());
                } catch (error) {
                    console.error("Error deleting book item:", error);
                    toast.error("Lỗi khi xóa BookItem");
                }
            })
            .catch(() => {});
    };

    const getStatusChip = (status: string) => {
        const statusOption = BOOK_STATUS_OPTIONS.find(opt => opt.value === status);
        return (
            <Chip
                label={statusOption?.label || status}
                color={statusOption?.color || "default"}
                size="small"
            />
        );
    };

    const getConditionLabel = (condition: number) => {
        const conditionOption = CONDITION_OPTIONS.find(opt => opt.value === condition);
        return conditionOption?.label || condition.toString();
    };

    const columns: GridColDef[] = [
        {
            field: "id",
            headerName: "ID",
            width: 80,
            headerAlign: 'center',
            align: 'center'
        },
        {
            field: "barcode",
            headerName: "MÃ VẠCH",
            width: 220,
            headerAlign: 'center',
            align: 'center'
        },
        {
            field: "status",
            headerName: "TRẠNG THÁI",
            width: 140,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => getStatusChip(params.value),
        },
        {
            field: "location",
            headerName: "VỊ TRÍ",
            width: 160,
            headerAlign: 'center',
            align: 'center'
        },
        {
            field: "condition",
            headerName: "TÌNH TRẠNG",
            width: 140,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => getConditionLabel(params.value),
        },
        {
            field: "action",
            headerName: "HÀNH ĐỘNG",
            width: 180,
            type: "actions",
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: (item) => {
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 0.5
                        }}
                    >
                        <Tooltip title="Xem chi tiết">
                            <IconButton
                                color="info"
                                size="small"
                                onClick={() => handleViewBookItem(item.id)}
                            >
                                <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => {
                                    props.setOption("update");
                                    props.setId(item.id);
                                    props.handleOpenModal();
                                }}
                            >
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteBookItem(item.id)}
                            >
                                <DeleteOutlineOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
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
                    minHeight: 200
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            {/* Thanh tìm kiếm */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Tìm kiếm theo mã vạch, tên sách, ISBN hoặc vị trí..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        maxWidth: 600,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />
            </Box>

            {/* Bảng dữ liệu */}
            <Box sx={{
                height: 'auto',
                width: '100%',
                '& .MuiDataGrid-root': {
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #e0e0e0',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f5f5f5',
                        borderBottom: '2px solid #e0e0e0',
                        '& .MuiDataGrid-columnHeader': {
                            fontWeight: 600,
                        }
                    },
                    '& .MuiDataGrid-row': {
                        '&:nth-of-type(even)': {
                            backgroundColor: '#fafafa',
                        },
                        '&:hover': {
                            backgroundColor: '#f0f0f0',
                        }
                    }
                }
            }}>
                <DataTable
                    columns={columns}
                    rows={filteredData}
                />
            </Box>
        </Box>
    );
};