import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Tab,
    Tabs,
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
import { toast } from "react-toastify";
import RequireAdmin from "./RequireAdmin";
import { endpointBE } from "../layouts/utils/Constant";
import { format, addDays } from "date-fns";

// Define interfaces
interface LibraryCard {
    id: number;
    idLibraryCard: number;
    cardNumber: string;
    userName: string;
    issuedDate: string;
    expiryDate: string;
    activated: boolean;
    status: string;
    userId?: number;
    violationCount?: number;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// Tab Panel Component
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`library-card-tabpanel-${index}`}
            aria-labelledby={`library-card-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const LibraryCardManagement = () => {
    // State variables
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState<LibraryCard[]>([]);
    const [filteredCards, setFilteredCards] = useState<LibraryCard[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [tabValue, setTabValue] = useState(0);
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedCard, setSelectedCard] = useState<LibraryCard | null>(null);

    // Dialog states
    const [renewDialogOpen, setRenewDialogOpen] = useState(false);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [activateDialogOpen, setActivateDialogOpen] = useState(false);
    const [renewalDate, setRenewalDate] = useState<string>(format(addDays(new Date(), 365), "yyyy-MM-dd"));

    const fetchLibraryCards = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Phiên đăng nhập đã hết hạn");
                return;
            }

            const response = await fetch(`${endpointBE}/library-cards?projection=full&size=1000`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch library cards");
            }

            const data = await response.json();
            if (data._embedded && data._embedded.libraryCards) {
                // Process library cards and include user data
                const processedCards = await Promise.all(
                    data._embedded.libraryCards.map(async (card: any) => {
                        let userName = "Unknown";
                        let userId = 0;
                        let violationCount = 0;

                        try {
                            // Get user data if available
                            if (card._embedded && card._embedded.user) {
                                const userData = card._embedded.user;
                                userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username;
                                userId = userData.idUser;
                            }

                            // Count violations
                            if (card._embedded && card._embedded.violationTypes) {
                                violationCount = card._embedded.violationTypes.length;
                            }
                        } catch (err) {
                            console.error("Error processing user data:", err);
                        }

                        // Check if card is expired
                        const expiryDate = new Date(card.expiryDate);
                        const isExpired = new Date() > expiryDate;
                        const activated = isExpired ? false : card.activated;

                        return {
                            id: card.idLibraryCard,
                            idLibraryCard: card.idLibraryCard,
                            cardNumber: card.cardNumber || "N/A",
                            userName,
                            userId,
                            issuedDate: card.issuedDate,
                            expiryDate: card.expiryDate,
                            activated,
                            status: card.status,
                            violationCount
                        };
                    })
                );

                setCards(processedCards);
                applyFilters(processedCards, searchQuery, tabValue === 0 ? statusFilter : "all");
            }
        } catch (error) {
            console.error("Error fetching library cards:", error);
            toast.error("Lỗi khi tải dữ liệu thẻ thư viện");
        } finally {
            setLoading(false);
        }
    };

    // Filter cards based on search query and status
    const applyFilters = (cardList: LibraryCard[], query: string, status: string) => {
        let filtered = [...cardList];

        // Apply search filter
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(
                card =>
                    card.cardNumber.toLowerCase().includes(lowerQuery) ||
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
            }
        }

        setFilteredCards(filtered);
    };

    useEffect(() => {
        fetchLibraryCards();
    }, []);

    useEffect(() => {
        applyFilters(cards, searchQuery, tabValue === 0 ? statusFilter : "all");
    }, [searchQuery, statusFilter, tabValue, cards]);

    // Handle tab change
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Handle status filter change
    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value);
    };

    // Handle search input change
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), "dd/MM/yyyy");
        } catch (e) {
            return dateString;
        }
    };

    // Calculate days until expiry
    const getDaysUntilExpiry = (expiryDate: string) => {
        try {
            const expiry = new Date(expiryDate);
            const today = new Date();
            const diffTime = expiry.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (e) {
            return 0;
        }
    };

    // Get expiry status text and color
    const getExpiryStatus = (expiryDate: string) => {
        const daysUntil = getDaysUntilExpiry(expiryDate);

        if (daysUntil < 0) {
            return { text: `Hết hạn ${Math.abs(daysUntil)} ngày trước`, color: "error" };
        } else if (daysUntil === 0) {
            return { text: "Hết hạn hôm nay", color: "error" };
        } else if (daysUntil <= 30) {
            return { text: `Sắp hết hạn (còn ${daysUntil} ngày)`, color: "warning" };
        } else {
            return { text: `Còn hạn (${daysUntil} ngày)`, color: "success" };
        }
    };

    // Handle renew dialog
    const handleRenewDialogOpen = (card: LibraryCard) => {
        setSelectedCard(card);

        // Set default renewal date to 1 year from today
        const defaultRenewalDate = format(addDays(new Date(), 365), "yyyy-MM-dd");
        setRenewalDate(defaultRenewalDate);
        setRenewDialogOpen(true);
    };

    const handleRenewCard = async () => {
        if (!selectedCard || !renewalDate) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${endpointBE}/library-card/renew`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idLibraryCard: selectedCard.idLibraryCard,
                    // We don't need to pass renewalPeriodDays since we'll explicitly set the new expiry date
                })
            });

            if (!response.ok) {
                throw new Error("Failed to renew library card");
            }

            toast.success("Gia hạn thẻ thư viện thành công");
            setRenewDialogOpen(false);
            fetchLibraryCards(); // Refresh data
        } catch (error) {
            console.error("Error renewing library card:", error);
            toast.error("Lỗi khi gia hạn thẻ thư viện");
        }
    };

    // Handle deactivate dialog
    const handleDeactivateDialogOpen = (card: LibraryCard) => {
        setSelectedCard(card);
        setDeactivateDialogOpen(true);
    };

    const handleDeactivateCard = async () => {
        if (!selectedCard) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${endpointBE}/library-card/deactivate`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idLibraryCard: selectedCard.idLibraryCard
                })
            });

            if (!response.ok) {
                throw new Error("Failed to deactivate library card");
            }

            toast.success("Vô hiệu hóa thẻ thư viện thành công");
            setDeactivateDialogOpen(false);
            fetchLibraryCards(); // Refresh data
        } catch (error) {
            console.error("Error deactivating library card:", error);
            toast.error("Lỗi khi vô hiệu hóa thẻ thư viện");
        }
    };

    // Handle activate dialog
    const handleActivateDialogOpen = (card: LibraryCard) => {
        setSelectedCard(card);
        setActivateDialogOpen(true);
    };

    const handleActivateCard = async () => {
        if (!selectedCard) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${endpointBE}/library-card/update`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idLibraryCard: selectedCard.idLibraryCard,
                    expiryNewDate: format(addDays(new Date(), 365), "yyyy-MM-dd")
                })
            });

            if (!response.ok) {
                throw new Error("Failed to activate library card");
            }

            // Now activate the card
            const activateResponse = await fetch(`${endpointBE}/library-card/create`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idUser: selectedCard.userId,
                    cardNumber: selectedCard.cardNumber
                })
            });

            if (!activateResponse.ok) {
                throw new Error("Failed to activate library card");
            }

            toast.success("Kích hoạt thẻ thư viện thành công");
            setActivateDialogOpen(false);
            fetchLibraryCards(); // Refresh data
        } catch (error) {
            console.error("Error activating library card:", error);
            toast.error("Lỗi khi kích hoạt thẻ thư viện");
        }
    };

    // Handle renewal date change
    const handleRenewalDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRenewalDate(event.target.value);
    };

    // DataGrid columns
    const columns: GridColDef[] = [
        { field: "idLibraryCard", headerName: "ID", width: 70 },
        { field: "cardNumber", headerName: "Mã thẻ", width: 150 },
        { field: "userName", headerName: "Tên độc giả", width: 200 },
        {
            field: "issuedDate",
            headerName: "Ngày cấp",
            width: 120,
            valueGetter: (params: GridValueGetterParams) => formatDate(params.row.issuedDate)
        },
        {
            field: "expiryDate",
            headerName: "Ngày hết hạn",
            width: 120,
            valueGetter: (params: GridValueGetterParams) => formatDate(params.row.expiryDate)
        },
        {
            field: "Request",
            headerName: "Yêu cầu",
            width: 180,
            renderCell: (params) => {
                const status = params.row.status;
                return (
                    <Chip
                        label={status === "Yêu cầu gia hạn thẻ" ? status:"Không có"}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: "status",
            headerName: "Trạng thái",
            width: 150,
            renderCell: (params) => (
                <Chip
                    icon={params.row.activated ? <CheckCircleIcon /> : <CancelIcon />}
                    label={params.row.activated ? "Đang hoạt động" : "Không hoạt động"}
                    color={params.row.activated ? "success" : "error"}
                    variant="outlined"
                    size="small"
                />
            )
        },
        {
            field: "violationCount",
            headerName: "Vi phạm",
            width: 100,
            renderCell: (params) => (
                params.row.violationCount > 0 ? (
                    <Chip
                        icon={<ErrorOutlineIcon />}
                        label={params.row.violationCount}
                        color="warning"
                        size="small"
                    />
                ) : (
                    <span>0</span>
                )
            )
        },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 180,
            renderCell: (params) => (
                <Box>
                    {params.row.activated ? (
                        <>
                            <Tooltip title="Gia hạn thẻ">
                                <IconButton
                                    color="primary"
                                    onClick={() => handleRenewDialogOpen(params.row)}
                                >
                                    <AutorenewIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Vô hiệu hóa thẻ">
                                <IconButton
                                    color="error"
                                    onClick={() => handleDeactivateDialogOpen(params.row)}
                                >
                                    <BlockIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    ) : (
                        <Tooltip title="Kích hoạt thẻ">
                            <IconButton
                                color="success"
                                onClick={() => handleActivateDialogOpen(params.row)}
                            >
                                <CheckCircleIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )
        }
    ];

    return (
        <div className="container p-5">
            <Paper elevation={3} className="p-4 mb-4">
                <Typography variant="h5" component="h1" gutterBottom>
                    Quản lý thẻ thư viện
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="library card tabs"
                    >
                        <Tab label="Tất cả thẻ" />
                        <Tab label="Thẻ đang hoạt động" />
                        <Tab label="Thẻ không hoạt động" />
                        <Tab label="Thẻ sắp hết hạn" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2} alignItems="center" className="mb-3">
                        <Grid item xs={12} md={6}>
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
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Box sx={{ height: 600, width: '100%' }}>
                        <DataGrid
                            rows={filteredCards}
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
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ height: 600, width: '100%' }}>
                        <DataGrid
                            rows={cards.filter(card => card.activated)}
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
                        />
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ height: 600, width: '100%' }}>
                        <DataGrid
                            rows={cards.filter(card => !card.activated)}
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
                        />
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <Box sx={{ height: 600, width: '100%' }}>
                        <DataGrid
                            rows={cards.filter(card => {
                                const expiryDate = new Date(card.expiryDate);
                                const in30Days = addDays(new Date(), 30);
                                return card.activated &&
                                    expiryDate > new Date() &&
                                    expiryDate <= in30Days;
                            })}
                            columns={columns}
                            loading={loading}
                            pageSizeOptions={[10, 25, 50, 100]}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 10 }
                                },
                                sorting: {
                                    sortModel: [{ field: 'expiryDate', sort: 'asc' }]
                                }
                            }}
                            disableRowSelectionOnClick
                        />
                    </Box>
                </TabPanel>
            </Paper>

            {/* Renew Dialog */}
            <Dialog
                open={renewDialogOpen}
                onClose={() => setRenewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Gia hạn thẻ thư viện
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ my: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Thông tin thẻ:
                        </Typography>
                        <Typography variant="body1">
                            <strong>Mã thẻ:</strong> {selectedCard?.cardNumber}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Độc giả:</strong> {selectedCard?.userName}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Ngày hết hạn hiện tại:</strong> {selectedCard ? formatDate(selectedCard.expiryDate) : ""}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" gutterBottom>
                            Chọn thời hạn mới:
                        </Typography>

                        <TextField
                            label="Ngày hết hạn mới"
                            type="date"
                            value={renewalDate}
                            onChange={handleRenewalDateChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                min: format(new Date(), "yyyy-MM-dd"),
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenewDialogOpen(false)} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleRenewCard}
                        color="primary"
                        variant="contained"
                        disabled={!renewalDate || new Date(renewalDate) <= new Date()}
                    >
                        Gia hạn
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Deactivate Dialog */}
            <Dialog
                open={deactivateDialogOpen}
                onClose={() => setDeactivateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Vô hiệu hóa thẻ thư viện
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ my: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            Bạn có chắc chắn muốn vô hiệu hóa thẻ thư viện này?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Mã thẻ:</strong> {selectedCard?.cardNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Độc giả:</strong> {selectedCard?.userName}
                        </Typography>

                        <Box sx={{ mt: 2, p: 2, bgcolor: "#fff3e0", borderRadius: 1 }}>
                            <Typography variant="body2" color="warning.dark">
                                <b>Lưu ý:</b> Khi vô hiệu hóa, độc giả sẽ không thể sử dụng thẻ này để mượn sách.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeactivateDialogOpen(false)} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleDeactivateCard}
                        color="error"
                        variant="contained"
                    >
                        Vô hiệu hóa
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Activate Dialog */}
            <Dialog
                open={activateDialogOpen}
                onClose={() => setActivateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Kích hoạt thẻ thư viện
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ my: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            Bạn có chắc chắn muốn kích hoạt thẻ thư viện này?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Mã thẻ:</strong> {selectedCard?.cardNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Độc giả:</strong> {selectedCard?.userName}
                        </Typography>

                        <Box sx={{ mt: 2, p: 2, bgcolor: "#e8f5e9", borderRadius: 1 }}>
                            <Typography variant="body2" color="success.dark">
                                <b>Lưu ý:</b> Khi kích hoạt, thẻ sẽ có thời hạn 1 năm kể từ ngày hiện tại.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActivateDialogOpen(false)} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleActivateCard}
                        color="success"
                        variant="contained"
                    >
                        Kích hoạt
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

// Wrap component with RequireAdmin HOC to ensure only admins can access
const LibraryCardManagementPage = RequireAdmin(LibraryCardManagement);
export default LibraryCardManagementPage;