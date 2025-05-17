import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Tab,
    Tabs,
    Typography
} from "@mui/material";
import { toast } from "react-toastify";
import RequireAdmin from "./RequireAdmin";
import LibraryCardApi, { LibraryCard } from "../api/LibraryCardApi";
import LibraryCardTable from "./components/libarycard/LibraryCardTable";
import LibraryCardForms from "./components/libarycard/LibraryCardForms";

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
    const [processing, setProcessing] = useState(false);

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
        </div>
    );
};

// Wrap component with RequireAdmin HOC to ensure only admins can access
const LibraryCardManagementPage = RequireAdmin(LibraryCardManagement);
export default LibraryCardManagementPage;