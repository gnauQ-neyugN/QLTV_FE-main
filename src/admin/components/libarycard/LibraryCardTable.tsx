import React, { useState, useEffect } from "react";
import {
    Box,
    Chip,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import BlockIcon from "@mui/icons-material/Block";
import SearchIcon from "@mui/icons-material/Search";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import LibraryCardApi, { LibraryCard } from '../../../api/LibraryCardApi';
import { addDays } from "date-fns";

interface LibraryCardTableProps {
    cards: LibraryCard[];
    loading: boolean;
    onRenew: (card: LibraryCard) => void;
    onDeactivate: (card: LibraryCard) => void;
    onActivate: (card: LibraryCard) => void;
    onCreateCard?: (card: LibraryCard) => void; // New prop for create card action
    tabValue: number;
}

const LibraryCardTable: React.FC<LibraryCardTableProps> = ({
                                                               cards,
                                                               loading,
                                                               onRenew,
                                                               onDeactivate,
                                                               onActivate,
                                                               onCreateCard,
                                                               tabValue
                                                           }) => {
    const [filteredCards, setFilteredCards] = useState<LibraryCard[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Apply filters when cards, search query, or status filter changes
    useEffect(() => {
        applyFilters(cards, searchQuery, tabValue === 0 ? statusFilter : "all");
    }, [cards, searchQuery, statusFilter, tabValue]);

    // Filter cards based on search query and status
    const applyFilters = (cardList: LibraryCard[], query: string, status: string) => {
        let filtered = [...cardList];

        // Apply search filter
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(
                card =>
                    (card.cardNumber && card.cardNumber.toLowerCase().includes(lowerQuery)) ||
                    card.userName.toLowerCase().includes(lowerQuery)
            );
        }

        // Apply status filter
        if (status !== "all") {
            if (status === "active") {
                filtered = filtered.filter(card => card.activated);
            } else if (status === "inactive") {
                filtered = filtered.filter(card => !card.activated);
            } else if (status === "expiring") {
                // Cards expiring in the next 30 days
                const in30Days = addDays(new Date(), 30);
                filtered = filtered.filter(card => {
                    const expiryDate = new Date(card.expiryDate);
                    return card.activated &&
                        expiryDate > new Date() &&
                        expiryDate <= in30Days;
                });
            } else if (status === "expired") {
                // Cards that have expired
                filtered = filtered.filter(card => {
                    const expiryDate = new Date(card.expiryDate);
                    return expiryDate <= new Date();
                });
            } else if (status === "with_violations") {
                // Cards with violations
                filtered = filtered.filter(card => card.violationCount && card.violationCount > 0);
            } else if (status === "not_created") {
                // Cards that haven't been created yet (empty card number)
                filtered = filtered.filter(card => !card.cardNumber || card.cardNumber === "" || card.cardNumber === "N/A");
            }
        }

        setFilteredCards(filtered);
    };

    // Handle status filter change
    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value);
    };

    // Handle search input change
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    // DataGrid columns
    const columns: GridColDef[] = [
        { field: "idLibraryCard", headerName: "ID", width: 70 },
        {
            field: "cardNumber",
            headerName: "Mã thẻ",
            width: 150,
            valueGetter: (params: GridValueGetterParams) => params.row.cardNumber || "Chưa tạo thẻ"
        },
        { field: "userName", headerName: "Tên độc giả", width: 200 },
        {
            field: "issuedDate",
            headerName: "Ngày cấp",
            width: 120,
            valueGetter: (params: GridValueGetterParams) => params.row.issuedDate ? LibraryCardApi.formatDate(params.row.issuedDate) : "—"
        },
        {
            field: "expiryDate",
            headerName: "Ngày hết hạn",
            width: 120,
            valueGetter: (params: GridValueGetterParams) => params.row.expiryDate ? LibraryCardApi.formatDate(params.row.expiryDate) : "—"
        },
        {
            field: "request",
            headerName: "Yêu cầu",
            width: 180,
            renderCell: (params) => {
                const status = params.row.status;
                return (
                    <Chip
                        label={status === "Yêu cầu gia hạn thẻ thư viện" ? "Yêu cầu gia hạn" : "Không có"}
                        size="small"
                        variant="outlined"
                        color={status === "Yêu cầu gia hạn thẻ thư viện" ? "warning" : "default"}
                    />
                );
            }
        },
        {
            field: "status",
            headerName: "Trạng thái",
            width: 150,
            renderCell: (params) => {
                if (!params.row.cardNumber || params.row.cardNumber === "N/A") {
                    return (
                        <Chip
                            icon={<ErrorOutlineIcon />}
                            label="Chưa tạo thẻ"
                            color="warning"
                            variant="outlined"
                            size="small"
                        />
                    );
                }
                return (
                    <Chip
                        icon={params.row.activated ? <CheckCircleIcon /> : <CancelIcon />}
                        label={params.row.activated ? "Đang hoạt động" : "Không hoạt động"}
                        color={params.row.activated ? "success" : "error"}
                        variant="outlined"
                        size="small"
                    />
                );
            }
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 180,
            renderCell: (params) => {
                // If card number is empty or N/A, show create button
                if (!params.row.cardNumber || params.row.cardNumber === "N/A") {
                    return (
                        <Tooltip title="Tạo thẻ thư viện">
                            <IconButton
                                color="success"
                                onClick={() => onCreateCard && onCreateCard(params.row)}
                            >
                                <LibraryAddIcon />
                            </IconButton>
                        </Tooltip>
                    );
                }

                // Otherwise show normal actions
                return (
                    <Box>
                        {params.row.activated ? (
                            <>
                                <Tooltip title="Gia hạn thẻ">
                                    <IconButton
                                        color="primary"
                                        onClick={() => onRenew(params.row)}
                                    >
                                        <AutorenewIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Vô hiệu hóa thẻ">
                                    <IconButton
                                        color="error"
                                        onClick={() => onDeactivate(params.row)}
                                    >
                                        <BlockIcon />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <Tooltip title="Kích hoạt thẻ">
                                <IconButton
                                    color="success"
                                    onClick={() => onActivate(params.row)}
                                >
                                    <CheckCircleIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                );
            }
        }
    ];

    // For current tab, define which cards to show
    const getCurrentTabCards = () => {
        switch (tabValue) {
            case 0: // All cards tab with filters
                return filteredCards;
            case 1: // Active cards tab
                return cards.filter(card => card.activated);
            case 2: // Inactive cards tab
                return cards.filter(card => !card.activated);
            case 3: // Expiring soon tab
                return cards.filter(card => {
                    const expiryDate = new Date(card.expiryDate);
                    const in30Days = addDays(new Date(), 30);
                    return card.activated &&
                        expiryDate > new Date() &&
                        expiryDate <= in30Days;
                });
            default:
                return filteredCards;
        }
    };

    return (
        <>
            {tabValue === 0 && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Tìm kiếm theo mã thẻ hoặc tên độc giả..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel id="status-filter-label">Lọc theo trạng thái</InputLabel>
                            <Select
                                labelId="status-filter-label"
                                value={statusFilter}
                                label="Lọc theo trạng thái"
                                onChange={handleStatusFilterChange}
                            >
                                <MenuItem value="all">Tất cả</MenuItem>
                                <MenuItem value="active">Đang hoạt động</MenuItem>
                                <MenuItem value="inactive">Không hoạt động</MenuItem>
                                <MenuItem value="expiring">Sắp hết hạn (30 ngày)</MenuItem>
                                <MenuItem value="expired">Đã hết hạn</MenuItem>
                                <MenuItem value="with_violations">Có vi phạm</MenuItem>
                                <MenuItem value="not_created">Chưa tạo thẻ</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>
            )}

            <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={getCurrentTabCards()}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 10 }
                        },
                        sorting: {
                            sortModel: [{ field: 'idLibraryCard', sort: 'desc' }]
                        }
                    }}
                    disableRowSelectionOnClick
                    slots={{
                        noRowsOverlay: () => (
                            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                                <Typography variant="body1" color="text.secondary">
                                    {loading ? 'Đang tải dữ liệu...' : 'Không có thẻ thư viện nào'}
                                </Typography>
                            </Box>
                        )
                    }}
                />
            </Box>
        </>
    );
};

export default LibraryCardTable;