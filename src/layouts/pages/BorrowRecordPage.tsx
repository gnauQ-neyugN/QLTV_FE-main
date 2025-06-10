import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, CircularProgress, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { isToken } from "../utils/JwtService";
import BorrowRecordModel from "../../model/BorrowRecordModel";
import { cancelBorrowRecord, getUserBorrowRecords } from "../../api/BorrowRecordApi";
import { format } from "date-fns";
import { FadeModal } from "../utils/FadeModal";
import BorrowRecordDetailsComponent from "./components/BorrowRecordDetails";
import useScrollToTop from "../../hooks/ScrollToTop";

const BorrowRecordPage: React.FC = () => {
    useScrollToTop();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [borrowRecords, setBorrowRecords] = useState<BorrowRecordModel[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<BorrowRecordModel | null>(null);
    const [openDetailsModal, setOpenDetailsModal] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);

    useEffect(() => {
        if (!isToken()) {
            toast.warning("Bạn cần đăng nhập để xem phiếu mượn");
            navigate("/login");
            return;
        }

        setLoading(true);
        getUserBorrowRecords()
            .then(records => {
                setBorrowRecords(records);
            })
            .catch(error => {
                console.error("Error fetching borrow records:", error);
                toast.error("Không thể lấy danh sách phiếu mượn");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [navigate, refreshCounter]);

    const handleViewDetails = (record: BorrowRecordModel) => {
        setSelectedRecord(record);
        setOpenDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setOpenDetailsModal(false);
        setSelectedRecord(null);
    };

    const handleCancelBorrowRecord = async (recordId: number) => {
        try {
            if (window.confirm("Bạn có chắc chắn muốn hủy phiếu mượn này không?")) {
                await cancelBorrowRecord(recordId);
                toast.success("Đã hủy phiếu mượn thành công");
                setRefreshCounter(prev => prev + 1);
            }
        } catch (error) {
            console.error("Error cancelling borrow record:", error);
            toast.error("Không thể hủy phiếu mượn");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Đang xử lý":
                return "info";
            case "Đã duyệt":
                return "success";
            case "Đang mượn":
                return "primary";
            case "Đã trả":
                return "secondary";
            case "Hủy":
                return "error";
            default:
                return "default";
        }
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center my-5">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="container my-4 bg-light p-4 rounded">
            <Typography variant="h4" component="h1" className="mb-4">
                Phiếu mượn của tôi
            </Typography>

            {borrowRecords.length === 0 ? (
                <div className="text-center my-5">
                    <Typography variant="h6" className="mb-3">
                        Bạn chưa có phiếu mượn nào
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/search")}
                    >
                        Tìm sách để mượn
                    </Button>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead className="table-light">
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày mượn</th>
                            <th>Ngày hẹn trả</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {borrowRecords.map(record => (
                            <tr key={record.id}>
                                <td>{record.id}</td>
                                <td>{format(new Date(record.borrowDate), 'dd/MM/yyyy')}</td>
                                <td>{format(new Date(record.dueDate), 'dd/MM/yyyy')}</td>
                                <td>
                                    <Chip
                                        label={record.status}
                                        color={getStatusColor(record.status) as any}
                                        variant="outlined"
                                        size="small"
                                    />
                                </td>
                                <td>{record.notes || "—"}</td>
                                <td>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={() => handleViewDetails(record)}
                                        className="me-2"
                                    >
                                        Chi tiết
                                    </Button>

                                    {record.status === "Đang xử lý" && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() => handleCancelBorrowRecord(record.id)}
                                        >
                                            Hủy
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <FadeModal
                open={openDetailsModal}
                handleOpen={() => setOpenDetailsModal(true)}
                handleClose={handleCloseDetailsModal}
            >
                {selectedRecord && (
                    <BorrowRecordDetailsComponent
                        borrowRecord={selectedRecord}
                        handleCloseModal={handleCloseDetailsModal}
                    />
                )}
            </FadeModal>
        </div>
    );
};

export default BorrowRecordPage;