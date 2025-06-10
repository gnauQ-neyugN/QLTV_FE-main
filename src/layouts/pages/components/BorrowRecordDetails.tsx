import React, { useEffect, useState } from "react";
import { Button, Chip, CircularProgress, Typography } from "@mui/material";
import { format } from "date-fns";
import BorrowRecordModel from "../../../model/BorrowRecordModel";
import BorrowRecordDetailModel from "../../../model/BorrowRecordDetailModel";
import { getBorrowRecordDetails } from "../../../api/BorrowRecordApi";
import { StepperComponent } from "../../utils/StepperComponent";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

interface BorrowRecordDetailsProps {
    borrowRecord: BorrowRecordModel;
    handleCloseModal: () => void;
}

const BorrowRecordDetailsComponent: React.FC<BorrowRecordDetailsProps> = ({ borrowRecord, handleCloseModal }) => {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<BorrowRecordDetailModel[]>([]);
    const [steps, setSteps] = useState<String[]>([]);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        // Set steps based on status
        if (borrowRecord.status === "Hủy") {
            setSteps(["Đang xử lý", "Hủy"]);
            setActiveStep(["Đang xử lý", "Hủy"].indexOf(borrowRecord.status));
        } else {
            setSteps(["Đang xử lý", "Đã duyệt", "Đang mượn", "Đã trả"]);
            setActiveStep(["Đang xử lý", "Đã duyệt", "Đang mượn", "Đã trả"].indexOf(borrowRecord.status));
        }

        // Load details
        setLoading(true);
        getBorrowRecordDetails(borrowRecord.id)
            .then((response) => {
                setDetails(response);
            })
            .catch((error) => {
                console.error("Error fetching borrow record details:", error);
                toast.error("Không thể lấy chi tiết phiếu mượn");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [borrowRecord]);

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

    const getTotalBooks = () => {
        return details.reduce((total, detail) => total + detail.quantity, 0);
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="container p-4">
            <Typography variant="h5" component="h2" className="text-center mb-4">
                CHI TIẾT PHIẾU MƯỢN #{borrowRecord.id}
            </Typography>

            {/* Status and stepper */}
            <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                    <Typography variant="subtitle1" className="me-2">
                        Trạng thái:
                    </Typography>
                    <Chip
                        label={borrowRecord.status}
                        color={getStatusColor(borrowRecord.status) as any}
                        variant="outlined"
                    />
                </div>
            </div>

            {/* Borrow information */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header bg-light">
                            <Typography variant="h6">Thông tin phiếu mượn</Typography>
                        </div>
                        <div className="card-body">
                            <table className="table table-borderless">
                                <tbody>
                                <tr>
                                    <td className="fw-bold">Mã phiếu:</td>
                                    <td>{borrowRecord.id}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Ngày mượn:</td>
                                    <td>{format(new Date(borrowRecord.borrowDate), 'dd/MM/yyyy')}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Ngày hẹn trả:</td>
                                    <td>{format(new Date(borrowRecord.dueDate), 'dd/MM/yyyy')}</td>
                                </tr>
                                {borrowRecord.returnDate && (
                                    <tr>
                                        <td className="fw-bold">Ngày trả:</td>
                                        <td>{format(new Date(borrowRecord.returnDate), 'dd/MM/yyyy')}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="fw-bold">Ghi chú:</td>
                                    <td>{borrowRecord.notes || "—"}</td>
                                </tr>
                                {borrowRecord.libraryCard && (
                                    <tr>
                                        <td className="fw-bold">Mã thẻ thư viện:</td>
                                        <td>{borrowRecord.libraryCard.cardNumber || "—"}</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header bg-light">
                            <Typography variant="h6">Thống kê</Typography>
                        </div>
                        <div className="card-body">
                            <table className="table table-borderless">
                                <tbody>
                                <tr>
                                    <td className="fw-bold">Tổng số đầu sách:</td>
                                    <td>{details.length}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Tổng số sách:</td>
                                    <td>{getTotalBooks()}</td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Số sách đã trả:</td>
                                    <td>
                                        {details.filter(d => d.isReturned).reduce((sum, d) => sum + d.quantity, 0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="fw-bold">Số sách chưa trả:</td>
                                    <td>
                                        {details.filter(d => !d.isReturned).reduce((sum, d) => sum + d.quantity, 0)}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Book details */}
            <div className="mb-4">
                <Typography variant="h6" className="mb-3">
                    Danh sách sách mượn
                </Typography>
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead className="table-light">
                        <tr>
                            <th>Mã sách</th>
                            <th>Tên sách</th>
                            <th>Số lượng</th>
                            <th>Trạng thái</th>
                            <th>Ngày trả</th>
                            <th>Ghi chú</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {details.map(detail => (
                            <tr key={detail.id}>
                                <td>{detail.book.idBook}</td>
                                <td>{detail.book.nameBook}</td>
                                <td>{detail.quantity}</td>
                                <td>
                                    <Chip
                                        label={detail.isReturned ? "Đã trả" : "Chưa trả"}
                                        color={detail.isReturned ? "success" : "warning"}
                                        variant="outlined"
                                        size="small"
                                    />
                                </td>
                                <td>
                                    {detail.returnDate
                                        ? format(new Date(detail.returnDate), 'dd/MM/yyyy')
                                        : "—"
                                    }
                                </td>
                                <td>{detail.notes || "—"}</td>
                                <td>
                                    <Link to={`/book/${detail.book.idBook}`} target="_blank">
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                        >
                                            Xem sách
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fine information (if applicable) */}
            {borrowRecord.status === "Đã trả" && (
                <div className="mb-4">
                    <div className="card">
                        <div className="card-header bg-light">
                            <Typography variant="h6">Thông tin phạt (nếu có)</Typography>
                        </div>
                        <div className="card-body">
                            {/* We could add fine information here if available */}
                            <p className="card-text">Không có thông tin phạt cho phiếu mượn này.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="d-flex justify-content-end">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCloseModal}
                >
                    Đóng
                </Button>
            </div>
        </div>
    );
};

export default BorrowRecordDetailsComponent;