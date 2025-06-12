import React, { useState } from "react";
import { Tab, Tabs, Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { BorrowRecordTable } from "./components/borrowRecord/BorrowRecordTable";
import { FadeModal } from "../layouts/utils/FadeModal";
import { BorrowRecordForm } from "./components/borrowRecord/BorrowRecordForm";
import BorrowRecordCreate from "./components/borrowRecord/BorrowRecordCreate";
import BorrowRecordSearch from "./components/borrowRecord/BorrowRecordSearch";
import BorrowRequestTable from "./components/borrowRecord/BorrowRequestTable";
import RequireAdminOrStaff from "./RequireAdminOrStaff";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`borrow-tabpanel-${index}`}
            aria-labelledby={`borrow-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `borrow-tab-${index}`,
        'aria-controls': `borrow-tabpanel-${index}`,
    };
}

const BorrowRecordManagement = () => {
    // State for tabs
    const [tabValue, setTabValue] = useState(0);

    // State for reloading data after updates
    const [keyCountReload, setKeyCountReload] = useState(0);
    const [id, setId] = useState(0);

    // State for modal control and operation type
    const [option, setOption] = useState("");
    const [openModal, setOpenModal] = React.useState(false);
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    // State for create modal
    const [openCreateModal, setOpenCreateModal] = React.useState(false);
    const handleOpenCreateModal = () => setOpenCreateModal(true);
    const handleCloseCreateModal = () => setOpenCreateModal(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <div className="container-fluid p-4">
            <div className="shadow-4-strong rounded p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Quản lý mượn trả sách</h2>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateModal}
                    >
                        Tạo phiếu mượn
                    </Button>
                </div>

                <Box sx={{ width: '100%' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="borrow record management tabs"
                            variant="fullWidth"
                        >
                            <Tab
                                label={
                                    <span>
                                        <i className="fas fa-clipboard-list me-2"></i>
                                        Phiếu đặt mượn
                                    </span>
                                }
                                {...a11yProps(0)}
                            />
                            <Tab
                                label={
                                    <span>
                                        <i className="fas fa-book-reader me-2"></i>
                                        Quản lý mượn
                                    </span>
                                }
                                {...a11yProps(1)}
                            />
                            <Tab
                                label={
                                    <span>
                                        <i className="fas fa-undo me-2"></i>
                                        Quản lý trả
                                    </span>
                                }
                                {...a11yProps(2)}
                            />
                            <Tab
                                label={
                                    <span>
                                        <i className="fas fa-chart-line me-2"></i>
                                        Tổng hợp
                                    </span>
                                }
                                {...a11yProps(3)}
                            />
                        </Tabs>
                    </Box>

                    {/* Tab 0: Phiếu đặt mượn - Danh sách phiếu có status "Đang xử lý" */}
                    <TabPanel value={tabValue} index={0}>
                        <div className="mb-3">
                            <Typography variant="h6" gutterBottom>
                                <i className="fas fa-clipboard-list me-2 text-primary"></i>
                                Danh sách phiếu đặt mượn
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-3">
                                Quản lý các phiếu mượn đang chờ xử lý và phê duyệt
                            </Typography>
                        </div>
                        <BorrowRequestTable
                            keyCountReload={keyCountReload}
                            setOption={setOption}
                            handleOpenModal={handleOpenModal}
                            setKeyCountReload={setKeyCountReload}
                            setId={setId}
                        />
                    </TabPanel>

                    {/* Tab 1: Quản lý mượn - Search theo mã phiếu mượn */}
                    <TabPanel value={tabValue} index={1}>
                        <div className="mb-3">
                            <Typography variant="h6" gutterBottom>
                                <i className="fas fa-book-reader me-2 text-success"></i>
                                Quản lý cho mượn sách
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-3">
                                Tìm kiếm phiếu mượn và cập nhật trạng thái cho mượn
                            </Typography>
                        </div>
                        <BorrowRecordSearch
                            searchType="borrow"
                            keyCountReload={keyCountReload}
                            setOption={setOption}
                            handleOpenModal={handleOpenModal}
                            setKeyCountReload={setKeyCountReload}
                            setId={setId}
                        />
                    </TabPanel>

                    {/* Tab 2: Quản lý trả - Search theo mã phiếu mượn */}
                    <TabPanel value={tabValue} index={2}>
                        <div className="mb-3">
                            <Typography variant="h6" gutterBottom>
                                <i className="fas fa-undo me-2 text-warning"></i>
                                Quản lý trả sách
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-3">
                                Tìm kiếm phiếu mượn và xử lý trả sách
                            </Typography>
                        </div>
                        <BorrowRecordSearch
                            searchType="return"
                            keyCountReload={keyCountReload}
                            setOption={setOption}
                            handleOpenModal={handleOpenModal}
                            setKeyCountReload={setKeyCountReload}
                            setId={setId}
                        />
                    </TabPanel>

                    {/* Tab 3: Tổng hợp - Bảng tất cả phiếu mượn */}
                    <TabPanel value={tabValue} index={3}>
                        <div className="mb-3">
                            <Typography variant="h6" gutterBottom>
                                <i className="fas fa-chart-line me-2 text-info"></i>
                                Tổng hợp phiếu mượn
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mb-3">
                                Xem tổng quan tất cả các phiếu mượn trong hệ thống
                            </Typography>
                        </div>
                        <BorrowRecordTable
                            keyCountReload={keyCountReload}
                            setOption={setOption}
                            handleOpenModal={handleOpenModal}
                            setKeyCountReload={setKeyCountReload}
                            setId={setId}
                        />
                    </TabPanel>
                </Box>
            </div>

            {/* Modal for editing borrow records */}
            <FadeModal
                open={openModal}
                handleOpen={handleOpenModal}
                handleClose={handleCloseModal}
            >
                <BorrowRecordForm
                    id={id}
                    option={option}
                    setKeyCountReload={setKeyCountReload}
                    handleCloseModal={handleCloseModal}
                />
            </FadeModal>

            {/* Modal for creating new borrow records */}
            <FadeModal
                open={openCreateModal}
                handleOpen={handleOpenCreateModal}
                handleClose={handleCloseCreateModal}
            >
                <BorrowRecordCreate
                    handleCloseModal={handleCloseCreateModal}
                    setKeyCountReload={setKeyCountReload}
                />
            </FadeModal>
        </div>
    );
};

const BorrowRecordManagementPage = RequireAdminOrStaff(BorrowRecordManagement);
export default BorrowRecordManagementPage;