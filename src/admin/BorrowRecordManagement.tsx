import React, { useState } from "react";
import { BorrowRecordTable } from "./components/borrowRecord/BorrowRecordTable";
import { FadeModal } from "../layouts/utils/FadeModal";
import { BorrowRecordForm } from "./components/borrowRecord/BorrowRecordForm";
import BorrowRecordCreate from "./components/borrowRecord/BorrowRecordCreate";
import RequireAdminOrStaff from "./RequireAdminOrStaff";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const BorrowRecordManagement = () => {
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

    return (
        <div className="container p-5">
            <div className="shadow-4-strong rounded p-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Quản lý phiếu mượn</h2>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateModal}
                    >
                        Tạo phiếu mượn
                    </Button>
                </div>
                <div>
                    <BorrowRecordTable
                        keyCountReload={keyCountReload}
                        setOption={setOption}
                        handleOpenModal={handleOpenModal}
                        setKeyCountReload={setKeyCountReload}
                        setId={setId}
                    />
                </div>
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