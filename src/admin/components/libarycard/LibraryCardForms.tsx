import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Divider,
    CircularProgress
} from "@mui/material";
import { format, addDays } from "date-fns";
import { LibraryCard } from "../../../api/LibraryCardApi";

interface RenewFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (renewalDate: string) => void;
    card: LibraryCard | null;
    loading: boolean;
}

export const RenewForm: React.FC<RenewFormProps> = ({ open, onClose, onSubmit, card, loading }) => {
    const [renewalDate, setRenewalDate] = useState<string>(format(addDays(new Date(), 365), "yyyy-MM-dd"));

    const handleRenewalDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRenewalDate(event.target.value);
    };

    const handleSubmit = () => {
        onSubmit(renewalDate);
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return format(date, 'dd/MM/yyyy');
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                        <strong>Mã thẻ:</strong> {card?.cardNumber}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Độc giả:</strong> {card?.userName}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Ngày hết hạn hiện tại:</strong> {card ? formatDate(card.expiryDate) : ""}
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
                <Button onClick={onClose} color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    color="primary"
                    variant="contained"
                    disabled={loading || !renewalDate || new Date(renewalDate) <= new Date()}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Đang xử lý..." : "Gia hạn"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface DeactivateFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    card: LibraryCard | null;
    loading: boolean;
}

export const DeactivateForm: React.FC<DeactivateFormProps> = ({ open, onClose, onSubmit, card, loading }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                        <strong>Mã thẻ:</strong> {card?.cardNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Độc giả:</strong> {card?.userName}
                    </Typography>

                    <Box sx={{ mt: 2, p: 2, bgcolor: "#fff3e0", borderRadius: 1 }}>
                        <Typography variant="body2" color="warning.dark">
                            <b>Lưu ý:</b> Khi vô hiệu hóa, độc giả sẽ không thể sử dụng thẻ này để mượn sách.
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={onSubmit}
                    color="error"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Đang xử lý..." : "Vô hiệu hóa"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface ActivateFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    card: LibraryCard | null;
    loading: boolean;
}

export const ActivateForm: React.FC<ActivateFormProps> = ({ open, onClose, onSubmit, card, loading }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                        <strong>Mã thẻ:</strong> {card?.cardNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Độc giả:</strong> {card?.userName}
                    </Typography>

                    <Box sx={{ mt: 2, p: 2, bgcolor: "#e8f5e9", borderRadius: 1 }}>
                        <Typography variant="body2" color="success.dark">
                            <b>Lưu ý:</b> Khi kích hoạt, thẻ sẽ có thời hạn 1 năm kể từ ngày hiện tại.
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Hủy
                </Button>
                <Button
                    onClick={onSubmit}
                    color="success"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Đang xử lý..." : "Kích hoạt"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Export a combined object with all forms
const LibraryCardForms = {
    RenewForm,
    DeactivateForm,
    ActivateForm
};

export default LibraryCardForms;