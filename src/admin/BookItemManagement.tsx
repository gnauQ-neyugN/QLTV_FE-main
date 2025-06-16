import React, { useState } from "react";
import { Box, Button, Modal, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { BookItemTable } from "./components/bookitem/BookItemTable";
import { BookItemForm } from "./components/bookitem/BookItemForm";

const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "1200px",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
    maxHeight: "90vh",
    overflow: "auto",
};

const BookItemManagementPage: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [option, setOption] = useState("");
    const [keyCountReload, setKeyCountReload] = useState(0);
    const [id, setId] = useState(0);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <Box sx={{ margin: "20px" }}>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
                    Quản lý BookItem
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setOption("add");
                        setId(0);
                        handleOpen();
                    }}
                    sx={{
                        backgroundColor: "primary.main",
                        "&:hover": {
                            backgroundColor: "primary.dark"
                        }
                    }}
                >
                    Thêm BookItem
                </Button>
            </Box>

            {/* Table */}
            <BookItemTable
                setOption={setOption}
                handleOpenModal={handleOpen}
                setKeyCountReload={setKeyCountReload}
                keyCountReload={keyCountReload}
                setId={setId}
            />

            {/* Modal for Form */}
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <BookItemForm
                        id={id}
                        option={option as "add" | "update" | "view"}
                        setKeyCountReload={setKeyCountReload}
                        handleCloseModal={handleClose}
                    />
                </Box>
            </Modal>
        </Box>
    );
};

export default BookItemManagementPage;