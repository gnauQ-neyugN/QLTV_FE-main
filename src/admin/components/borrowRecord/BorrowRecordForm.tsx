import React, { FormEvent, useEffect, useState } from "react";
import {
    SelectChangeEvent,

} from '@mui/material';
import { toast } from 'react-toastify';
import BorrowRecordApi, {
    BorrowRecord,
    BorrowRecordDetail,
    BORROW_RECORD_STATUS,
    UpdateBorrowRecordParams,
    UpdateBookReturnParams
} from '../../../api/BorrowRecordApi';

// Define a new interface for violation types
interface ViolationType {
    id: number;
    code: string;
    fine: number;
    description: string;
}

interface BorrowRecordFormProps {
    id: number;
    option: string;
    setKeyCountReload?: any;
    handleCloseModal: any;
}

export const BorrowRecordForm: React.FC<BorrowRecordFormProps> = (props) => {
    const [loading, setLoading] = useState(true);
    const [record, setRecord] = useState<BorrowRecord | null>(null);
    const [details, setDetails] = useState<BorrowRecordDetail[]>([]);
    const [newStatus, setNewStatus] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [steps, setSteps] = useState<String[]>([]);
    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // State for violation types
    const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
    const [selectedViolationType, setSelectedViolationType] = useState<string>("");
    const [showViolationSelect, setShowViolationSelect] = useState(false);

    // State for dialog to update borrowDetail
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<BorrowRecordDetail | null>(null);
    const [updatedIsReturned, setUpdatedIsReturned] = useState(false);
    const [updatedReturnDate, setUpdatedReturnDate] = useState<string>("");
    const [updatedNotes, setUpdatedNotes] = useState("");
    const [updatedViolationCode, setUpdatedViolationCode] = useState<string>("");
    const [updatingDetail, setUpdatingDetail] = useState(false);

    useEffect(() => {
        const fetchBorrowRecord = async () => {
            try {
                setLoading(true);

                // Fetch the borrow record
                const recordData = await BorrowRecordApi.fetchBorrowRecordById(props.id);
                setRecord(recordData);
                setNewStatus(recordData.status);
                setNewNotes(recordData.notes || "");

                // Set steps based on status
                if (recordData.status === BORROW_RECORD_STATUS.CANCELLED) {
                    setSteps([BORROW_RECORD_STATUS.PROCESSING, BORROW_RECORD_STATUS.CANCELLED]);
                    setActiveStep([BORROW_RECORD_STATUS.PROCESSING, BORROW_RECORD_STATUS.CANCELLED].indexOf(recordData.status));
                } else {
                    setSteps([
                        BORROW_RECORD_STATUS.PROCESSING,
                        BORROW_RECORD_STATUS.APPROVED,
                        BORROW_RECORD_STATUS.BORROWING,
                        BORROW_RECORD_STATUS.RETURNED
                    ]);
                    setActiveStep([
                        BORROW_RECORD_STATUS.PROCESSING,
                        BORROW_RECORD_STATUS.APPROVED,
                        BORROW_RECORD_STATUS.BORROWING,
                        BORROW_RECORD_STATUS.RETURNED
                    ].indexOf(recordData.status));
                }

                // Fetch borrow record details
                const detailsData = await BorrowRecordApi.fetchBorrowRecordDetails(props.id);
                setDetails(detailsData);

                // Fetch violation types
                const violationTypesData = await BorrowRecordApi.fetchViolationTypes();
                setViolationTypes(violationTypesData);

            } catch (error) {
                console.error("Error:", error);
                toast.error("Failed to load borrow record");
            } finally {
                setLoading(false);
            }
        };

        fetchBorrowRecord();
    }, [props.id]);

    const handleStatusChange = (event: SelectChangeEvent) => {
        const newValue = event.target.value;

        // Check if user wants to update to "Returned" status
        if (newValue === BORROW_RECORD_STATUS.RETURNED) {
            // Check if all books have been returned
            const allBooksReturned = details.every(detail => detail.isReturned);

            if (!allBooksReturned) {
                toast.warning("Không thể cập nhật trạng thái phiếu mượn thành 'Đã trả' vì còn sách chưa được trả!");
                return;
            }

            // Show violation type selector when marking as returned
            setShowViolationSelect(true);
        } else {
            // Hide violation type selector for other statuses
            setShowViolationSelect(false);
            setSelectedViolationType("");
        }

        setNewStatus(newValue);
    };

    // Handle violation type change
    const handleViolationTypeChange = (event: SelectChangeEvent) => {
        setSelectedViolationType(event.target.value);
    };

    // Open dialog to update borrow record detail
    const handleOpenDetailDialog = (detail: BorrowRecordDetail) => {
        setSelectedDetail(detail);
        setUpdatedIsReturned(detail.isReturned);
        setUpdatedReturnDate(BorrowRecordApi.formatDateForInput(detail.returnDate));
        setUpdatedNotes(detail.notes || "");
        setUpdatedViolationCode("");
        setDetailDialogOpen(true);
    };

    // Close dialog to update borrow record detail
    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedDetail(null);
    };

    // Handle updating borrow record detail
    const handleUpdateDetail = async () => {
        if (!selectedDetail) return;

        setUpdatingDetail(true);

        try {
            const effectiveReturnDate = updatedIsReturned
                ? (updatedReturnDate || new Date().toISOString().split('T')[0])
                : null;

            const updateParams: UpdateBookReturnParams = {
                id: selectedDetail.id,
                isReturned: updatedIsReturned,
                returnDate: effectiveReturnDate,
                notes: updatedNotes,
                code: updatedViolationCode || "Không vi phạm", // Default to no violation
            };

            await BorrowRecordApi.updateBookReturnStatus(updateParams);

            toast.success("Cập nhật chi tiết phiếu mượn thành công");

            // Update local state
            const updatedDetails = details.map(detail =>
                detail.id === selectedDetail.id
                    ? {
                        ...detail,
                        isReturned: updatedIsReturned,
                        returnDate: updatedIsReturned ? (effectiveReturnDate || undefined) : undefined,
                        notes: updatedNotes
                    }
                    : detail
            );

            // Update state
            setDetails(updatedDetails);


            handleCloseDetailDialog();
        } catch (error) {
            console.error("Error updating borrow record detail:", error);
            toast.error((error as Error).message || "Failed to update borrow record detail");
        } finally {
            setUpdatingDetail(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (props.option !== "update") {
            props.handleCloseModal();
            return;
        }

        if (!record) {
            toast.error("No record data available");
            return;
        }

        // Check if status is "Returned" but not all books have been returned
        if (newStatus === BORROW_RECORD_STATUS.RETURNED && !details.every(detail => detail.isReturned)) {
            toast.error("Không thể cập nhật trạng thái phiếu mượn thành 'Đã trả' vì còn sách chưa được trả!");
            return;
        }

        setSubmitting(true);

        try {
            const updateParams: UpdateBorrowRecordParams = {
                idBorrowRecord: record.id,
                status: newStatus,
                notes: newNotes,
                code: newStatus === BORROW_RECORD_STATUS.RETURNED ? selectedViolationType : undefined,
            };

            await BorrowRecordApi.updateBorrowRecord(updateParams);

            toast.success("Cập nhật phiếu mượn thành công");

            if (props.setKeyCountReload) {
                props.setKeyCountReload(Math.random());
            }

            props.handleCloseModal();
        } catch (error) {
            console.error("Error updating borrow record:", error);
            toast.error((error as Error).message || "Failed to update borrow record");
        } finally {
            setSubmitting(false);
        }
    };

    // Dialog to update borrow record detail
    const renderDetailDialog = () => {
        if (!selectedDetail) return null;

        return (
            <div className={`modal fade ${detailDialogOpen ? 'show' : ''}`}
                 style={{ display: detailDialogOpen ? 'block' : 'none' }}
                 tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Cập nhật trạng thái sách</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleCloseDetailDialog}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <h6>{selectedDetail.bookItem.book.nameBook}</h6>
                                <div className="text-muted">Tác giả: {selectedDetail.bookItem.book.author}</div>
                                <div className="text-muted">Mã vạch: {selectedDetail.bookItem.barcode}</div>
                                <div className="text-muted">Vị trí: {selectedDetail.bookItem.location}</div>
                            </div>

                            <div className="form-check form-switch mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={updatedIsReturned}
                                    onChange={(e) => setUpdatedIsReturned(e.target.checked)}
                                />
                                <label className="form-check-label">
                                    Đã trả sách
                                </label>
                            </div>

                            {updatedIsReturned && (
                                <div className="mb-3">
                                    <label className="form-label">Ngày trả</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={updatedReturnDate}
                                        onChange={(e) => setUpdatedReturnDate(e.target.value)}
                                    />
                                </div>
                            )}

                            {updatedIsReturned && (
                                <div className="mb-3">
                                    <label className="form-label">Loại vi phạm</label>
                                    <select
                                        className="form-control"
                                        value={updatedViolationCode}
                                        onChange={(e) => setUpdatedViolationCode(e.target.value)}
                                    >
                                        <option value="">Chọn loại vi phạm</option>
                                        <option value="Không vi phạm">Không vi phạm</option>
                                        {violationTypes.map((type) => (
                                            <option key={type.code} value={type.code}>
                                                {type.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label">Ghi chú</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={updatedNotes}
                                    onChange={(e) => setUpdatedNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCloseDetailDialog}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleUpdateDetail}
                                disabled={updatingDetail}
                            >
                                {updatingDetail ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    "Cập nhật"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center p-4">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="p-4">
                <h6 className="text-danger">Failed to load borrow record</h6>
            </div>
        );
    }

    // Calculate statistics
    const stats = BorrowRecordApi.calculateBorrowRecordStats(details);

    // Helper function to get status color for chips
    const getStatusColorClass = (status: string) => {
        const colorMap = BorrowRecordApi.getStatusColor(status);
        switch (colorMap) {
            case 'success': return 'bg-success';
            case 'info': return 'bg-info';
            case 'primary': return 'bg-primary';
            case 'secondary': return 'bg-secondary';
            case 'error': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    return (
        <div className="container bg-white p-4 rounded">
            <h2 className="text-center mb-4">
                {props.option === "update" ? "CẬP NHẬT PHIẾU MƯỢN" : "CHI TIẾT PHIẾU MƯỢN"}
            </h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <div className="d-flex align-items-center mb-2">
                        <span className="me-2">Trạng thái hiện tại:</span>
                        <span className={`badge ${getStatusColorClass(record.status)}`}>
                            {record.status}
                        </span>
                    </div>
                </div>

                <div className="mb-4">
                    <h5 className="mb-2">Thông tin phiếu mượn</h5>
                    <div className="card p-3">
                        <div className="row">
                            <div className="col-md-4 mb-2">
                                <small className="text-muted">Mã phiếu</small>
                                <div className="fw-bold">{record.id}</div>
                            </div>
                            <div className="col-md-4 mb-2">
                                <small className="text-muted">Tên độc giả</small>
                                <div className="fw-bold">{record.userName}</div>
                            </div>
                            <div className="col-md-4 mb-2">
                                <small className="text-muted">Mã thẻ thư viện</small>
                                <div className="fw-bold">{record.cardNumber}</div>
                            </div>
                            <div className="col-md-4 mb-2">
                                <small className="text-muted">Ngày mượn</small>
                                <div className="fw-bold">{BorrowRecordApi.formatDate(record.borrowDate)}</div>
                            </div>
                            <div className="col-md-4 mb-2">
                                <small className="text-muted">Ngày hẹn trả</small>
                                <div className="fw-bold">{BorrowRecordApi.formatDate(record.dueDate)}</div>
                            </div>
                            <div className="col-md-4 mb-2">
                                <small className="text-muted">Ngày trả</small>
                                <div className="fw-bold">{BorrowRecordApi.formatDate(record.returnDate)}</div>
                            </div>
                        </div>
                        <div className="mt-3">
                            <small className="text-muted">Ghi chú</small>
                            <div>{record.notes || "—"}</div>
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <h5 className="mb-2">Danh sách sách mượn</h5>
                    <div className="card">
                        <div className="table-responsive">
                            <table className="table table-striped mb-0">
                                <thead style={{ backgroundColor: "#f5f5f5" }}>
                                <tr>
                                    <th>STT</th>
                                    <th>Tên sách</th>
                                    <th>Bản sao</th>
                                    <th>Tình trạng</th>
                                    <th>Đã trả</th>
                                    <th>Ngày trả</th>
                                    <th>Ghi chú</th>
                                    <th className="text-center">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {details.map((detail, index) => (
                                    <tr key={detail.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div>
                                                <div className="fw-bold">{detail.bookItem.book.nameBook}</div>
                                                <small className="text-muted">{detail.bookItem.book.author}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="fw-bold">{detail.bookItem.barcode}</span>
                                        </td>
                                        <td>
                                                <span className={`badge ${
                                                    detail.bookItem.condition >= 80 ? "bg-success" :
                                                        detail.bookItem.condition >= 60 ? "bg-warning text-dark" : "bg-danger"
                                                }`}>
                                                    {detail.bookItem.condition}%
                                                </span>
                                        </td>
                                        <td>
                                                <span className={`badge ${detail.isReturned ? 'bg-success' : 'bg-warning'}`}>
                                                    {detail.isReturned ? 'Đã trả' : 'Chưa trả'}
                                                </span>
                                        </td>
                                        <td>{BorrowRecordApi.formatDate(detail.returnDate)}</td>
                                        <td>{detail.notes || "—"}</td>
                                        <td className="text-center">
                                            {props.option === "update" && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => handleOpenDetailDialog(detail)}
                                                    title="Cập nhật trạng thái"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {props.option === "update" && (
                    <div className="mb-4">
                        <h5 className="mb-2">Cập nhật phiếu mượn</h5>
                        <div className="card p-3">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Trạng thái phiếu mượn</label>
                                    <select
                                        className="form-control"
                                        value={newStatus}
                                        onChange={(e) => handleStatusChange(e as any)}
                                    >
                                        <option value={BORROW_RECORD_STATUS.PROCESSING}>Đang xử lý</option>
                                        <option value={BORROW_RECORD_STATUS.APPROVED}>Đã duyệt</option>
                                        <option value={BORROW_RECORD_STATUS.BORROWING}>Đang mượn</option>
                                        <option value={BORROW_RECORD_STATUS.RETURNED}>Đã trả</option>
                                        <option value={BORROW_RECORD_STATUS.CANCELLED}>Hủy</option>
                                    </select>
                                </div>

                                <div className="col-12">
                                    <label className="form-label">Ghi chú</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={newNotes}
                                        onChange={(e) => setNewNotes(e.target.value)}
                                        placeholder="Nhập ghi chú cho phiếu mượn..."
                                    />
                                </div>
                            </div>

                            {newStatus === BORROW_RECORD_STATUS.RETURNED && !stats.allReturned && (
                                <div className="alert alert-warning mt-3">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Chưa thể cập nhật trạng thái thành "Đã trả" vì còn {stats.remainingBooks} sách chưa được trả.
                                    Vui lòng cập nhật trạng thái từng sách trước.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <hr className="my-4" />

                <div className="d-flex justify-content-center gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={props.handleCloseModal}
                    >
                        {props.option === "update" ? "Hủy" : "Đóng"}
                    </button>

                    {props.option === "update" && (
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Đang cập nhật...
                                </>
                            ) : (
                                "Cập nhật phiếu mượn"
                            )}
                        </button>
                    )}
                </div>
            </form>

            {/* Dialog to update borrow record detail */}
            {renderDetailDialog()}

            {/* Add backdrop for modal */}
            {detailDialogOpen && (
                <div
                    className="modal-backdrop fade show"
                    onClick={handleCloseDetailDialog}
                    style={{ zIndex: 1040 }}
                ></div>
            )}
        </div>
    );
};