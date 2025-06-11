import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import { toast } from "react-toastify";
import RequireAdminOrStaff from "./RequireAdminOrStaff";
import LibraryCardApi, { LibraryCard } from "../api/LibraryCardApi";
import LibraryCardTable from "./components/libarycard/LibraryCardTable";
import LibraryCardForms from "./components/libarycard/LibraryCardForms";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";

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
    const [tabValue, setTabValue] = useState(0);
    const [selectedCard, setSelectedCard] = useState<LibraryCard | null>(null);

    // Dialog states
    const [renewDialogOpen, setRenewDialogOpen] = useState(false);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [activateDialogOpen, setActivateDialogOpen] = useState(false);
    const [createCardDialogOpen, setCreateCardDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Create card state
    const [newCardNumber, setNewCardNumber] = useState("");
    const [cardNumberError, setCardNumberError] = useState("");

    // Fetch library cards on component mount
    useEffect(() => {
        fetchLibraryCards();
    }, []);

    // Fetch library cards from API
    const fetchLibraryCards = async () => {
        setLoading(true);
        try {
            const cardsData = await LibraryCardApi.fetchAllLibraryCards();
            setCards(cardsData);
        } catch (error) {
            console.error("Error fetching library cards:", error);
            toast.error("Lỗi khi tải dữ liệu thẻ thư viện");
        } finally {
            setLoading(false);
        }
    };

    // Handle tab change
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Handlers for dialog operations
    const handleRenewDialogOpen = (card: LibraryCard) => {
        setSelectedCard(card);
        setRenewDialogOpen(true);
    };

    const handleDeactivateDialogOpen = (card: LibraryCard) => {
        setSelectedCard(card);
        setDeactivateDialogOpen(true);
    };

    const handleActivateDialogOpen = (card: LibraryCard) => {
        setSelectedCard(card);
        setActivateDialogOpen(true);
    };

    const handleCreateCardDialogOpen = (card: LibraryCard) => {
        setSelectedCard(card);
        setNewCardNumber("");
        setCardNumberError("");
        setCreateCardDialogOpen(true);
    };

    // Handlers for CRUD operations
    const handleRenewCard = async (renewalDate: string) => {
        if (!selectedCard) return;

        setProcessing(true);
        try {
            await LibraryCardApi.renewCard(selectedCard.idLibraryCard);
            toast.success("Gia hạn thẻ thư viện thành công");
            setRenewDialogOpen(false);
            fetchLibraryCards(); // Refresh data
        } catch (error) {
            console.error("Error renewing library card:", error);
            toast.error("Lỗi khi gia hạn thẻ thư viện");
        } finally {
            setProcessing(false);
        }
    };

    const handleDeactivateCard = async () => {
        if (!selectedCard) return;

        setProcessing(true);
        try {
            await LibraryCardApi.deactivateCard(selectedCard.idLibraryCard);
            toast.success("Vô hiệu hóa thẻ thư viện thành công");
            setDeactivateDialogOpen(false);
            fetchLibraryCards(); // Refresh data
        } catch (error) {
            console.error("Error deactivating library card:", error);
            toast.error("Lỗi khi vô hiệu hóa thẻ thư viện");
        } finally {
            setProcessing(false);
        }
    };

    const handleActivateCard = async () => {
        if (!selectedCard || !selectedCard.userId || !selectedCard.cardNumber) return;

        setProcessing(true);
        try {
            await LibraryCardApi.activateCard(
                selectedCard.idLibraryCard,
                selectedCard.userId,
                selectedCard.cardNumber
            );
            toast.success("Kích hoạt thẻ thư viện thành công");
            setActivateDialogOpen(false);
            fetchLibraryCards(); // Refresh data
        } catch (error) {
            console.error("Error activating library card:", error);
            toast.error("Lỗi khi kích hoạt thẻ thư viện");
        } finally {
            setProcessing(false);
        }
    };

    const handleCreateCard = async () => {
        if (!selectedCard || !selectedCard.userId) return;

        // Validate card number
        if (!newCardNumber) {
            setCardNumberError("Vui lòng nhập mã thẻ thư viện");
            return;
        }

        if (newCardNumber.length < 8) {
            setCardNumberError("Mã thẻ thư viện phải có ít nhất 8 ký tự");
            return;
        }

        setProcessing(true);
        try {
            // Use LibraryCardApi method to create card
            await LibraryCardApi.createCard(
                selectedCard.idLibraryCard,
                selectedCard.userId,
                newCardNumber
            );

            toast.success("Tạo thẻ thư viện thành công");
            setCreateCardDialogOpen(false);
            fetchLibraryCards(); // Refresh data
        } catch (error) {
            console.error("Error creating library card:", error);
            toast.error("Lỗi khi tạo thẻ thư viện");
        } finally {
            setProcessing(false);
        }
    };

    // Render the Create Card Dialog
    const renderCreateCardDialog = () => (
        <Dialog
            open={createCardDialogOpen}
            onClose={() => setCreateCardDialogOpen(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" alignItems="center">
                    <LibraryAddIcon sx={{ mr: 1 }} />
                    Tạo thẻ thư viện
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ my: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Thông tin người dùng:
                    </Typography>
                    <Typography variant="body1">
                        <strong>Tên độc giả:</strong> {selectedCard?.userName}
                    </Typography>
                    <Typography variant="body1">
                        <strong>ID người dùng:</strong> {selectedCard?.userId}
                    </Typography>

                    <TextField
                        label="Mã thẻ thư viện"
                        value={newCardNumber}
                        onChange={(e) => {
                            setNewCardNumber(e.target.value);
                            if (e.target.value) {
                                setCardNumberError("");
                            }
                        }}
                        fullWidth
                        required
                        margin="normal"
                        error={!!cardNumberError}
                        helperText={cardNumberError || "Nhập mã thẻ thư viện (CCCD hoặc mã số định danh)"}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Thẻ thư viện sẽ được kích hoạt và có thời hạn 1 năm kể từ ngày tạo.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setCreateCardDialogOpen(false)} color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleCreateCard}
                    color="primary"
                    variant="contained"
                    disabled={processing || !newCardNumber}
                    startIcon={processing ? <CircularProgress size={20} /> : null}
                >
                    {processing ? "Đang xử lý..." : "Tạo thẻ"}
                </Button>
            </DialogActions>
        </Dialog>
    );

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

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TabPanel value={tabValue} index={0}>
                            <LibraryCardTable
                                cards={cards}
                                loading={loading}
                                onRenew={handleRenewDialogOpen}
                                onDeactivate={handleDeactivateDialogOpen}
                                onActivate={handleActivateDialogOpen}
                                onCreateCard={handleCreateCardDialogOpen}
                                tabValue={tabValue}
                            />
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <LibraryCardTable
                                cards={cards}
                                loading={loading}
                                onRenew={handleRenewDialogOpen}
                                onDeactivate={handleDeactivateDialogOpen}
                                onActivate={handleActivateDialogOpen}
                                onCreateCard={handleCreateCardDialogOpen}
                                tabValue={tabValue}
                            />
                        </TabPanel>

                        <TabPanel value={tabValue} index={2}>
                            <LibraryCardTable
                                cards={cards}
                                loading={loading}
                                onRenew={handleRenewDialogOpen}
                                onDeactivate={handleDeactivateDialogOpen}
                                onActivate={handleActivateDialogOpen}
                                onCreateCard={handleCreateCardDialogOpen}
                                tabValue={tabValue}
                            />
                        </TabPanel>

                        <TabPanel value={tabValue} index={3}>
                            <LibraryCardTable
                                cards={cards}
                                loading={loading}
                                onRenew={handleRenewDialogOpen}
                                onDeactivate={handleDeactivateDialogOpen}
                                onActivate={handleActivateDialogOpen}
                                onCreateCard={handleCreateCardDialogOpen}
                                tabValue={tabValue}
                            />
                        </TabPanel>
                    </>
                )}
            </Paper>

            {/* Forms/Dialogs */}
            <LibraryCardForms.RenewForm
                open={renewDialogOpen}
                onClose={() => setRenewDialogOpen(false)}
                onSubmit={handleRenewCard}
                card={selectedCard}
                loading={processing}
            />

            <LibraryCardForms.DeactivateForm
                open={deactivateDialogOpen}
                onClose={() => setDeactivateDialogOpen(false)}
                onSubmit={handleDeactivateCard}
                card={selectedCard}
                loading={processing}
            />

            <LibraryCardForms.ActivateForm
                open={activateDialogOpen}
                onClose={() => setActivateDialogOpen(false)}
                onSubmit={handleActivateCard}
                card={selectedCard}
                loading={processing}
            />

            {/* Create Card Dialog */}
            {renderCreateCardDialog()}
        </div>
    );
};

// Wrap component with RequireAdminOrStaff HOC to ensure only admins can access
const LibraryCardManagementPage = RequireAdminOrStaff(LibraryCardManagement);
export default LibraryCardManagementPage;