import React, { useState } from "react";
import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Container,
    Breadcrumbs,
    Link,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { BookItemTable } from "./components/bookitem/BookItemTable";
import { BookItemForm } from "./components/bookitem/BookItemForm";

const BookItemManagement: React.FC = () => {
    // State quản lý modal
    const [openModal, setOpenModal] = useState(false);
    const [option, setOption] = useState<"add" | "update" | "view">("add");
    const [selectedId, setSelectedId] = useState<number>(0);
    const [keyCountReload, setKeyCountReload] = useState<number>(0);

    // Xử lý mở modal
    const handleOpenModal = () => {
        setOpenModal(true);
    };

    // Xử lý đóng modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedId(0);
        setOption("add");
    };

    // Xử lý thêm mới BookItem
    const handleAddBookItem = () => {
        setOption("add");
        setSelectedId(0);
        handleOpenModal();
    };

    // Hàm reload dữ liệu
    const reloadData = () => {
        setKeyCountReload(Math.random());
    };

    // Lấy tiêu đề modal theo option
    const getModalTitle = () => {
        switch (option) {
            case "add":
                return "Thêm mới BookItem";
            case "update":
                return "Cập nhật BookItem";
            case "view":
                return "Xem chi tiết BookItem";
            default:
                return "BookItem";
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Breadcrumb */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="/admin">
                        Trang chủ
                    </Link>
                    <Typography color="text.primary">Quản lý BookItem</Typography>
                </Breadcrumbs>
            </Box>

            {/* Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                    }}
                >
                    <Typography variant="h4" component="h1" gutterBottom>
                        Quản lý BookItem
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddBookItem}
                        sx={{
                            backgroundColor: "#1976d2",
                            "&:hover": {
                                backgroundColor: "#1565c0",
                            },
                        }}
                    >
                        Thêm BookItem
                    </Button>
                </Box>

                <Typography variant="body2" color="text.secondary">
                    Quản lý thông tin các bản sao sách trong thư viện
                </Typography>
            </Paper>

            {/* BookItem Table */}
            <Paper sx={{ p: 3 }}>
                <BookItemTable
                    setOption={setOption}
                    handleOpenModal={handleOpenModal}
                    setKeyCountReload={reloadData}
                    keyCountReload={keyCountReload}
                    setId={setSelectedId}
                />
            </Paper>

            {/* Modal Form */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minHeight: "60vh",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f5f5f5",
                        borderBottom: "1px solid #e0e0e0",
                    }}
                >
                    <Typography variant="h6" component="div">
                        {getModalTitle()}
                    </Typography>
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleCloseModal}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    <BookItemForm
                        id={selectedId}
                        option={option}
                        setKeyCountReload={reloadData}
                        handleCloseModal={handleCloseModal}
                    />
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default BookItemManagement;