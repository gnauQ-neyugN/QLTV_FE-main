import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import RequireAdmin from "./RequireAdmin";
import { endpointBE } from "../layouts/utils/Constant";

// Define interfaces
interface ViolationType {
    id: number;
    code: string;
    description: string;
    fine: number;
}

const LibraryViolationTypeManagement = () => {
    // State variables
    const [loading, setLoading] = useState(true);
    const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [currentViolation, setCurrentViolation] = useState<ViolationType>({
        id: 0,
        code: "",
        description: "",
        fine: 0
    });

    // Form validation
    const [errors, setErrors] = useState({
        code: "",
        description: "",
        fine: ""
    });

    // Fetch violation types from API
    const fetchViolationTypes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Phiên đăng nhập đã hết hạn");
                return;
            }

            const response = await fetch(`${endpointBE}/library-violation-types`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch violation types");
            }

            const data = await response.json();
            if (data._embedded && data._embedded.libraryViolationTypes) {
                const types = data._embedded.libraryViolationTypes.map((type: any) => ({
                    id: type.idLibraryViolationType,
                    code: type.code,
                    description: type.description,
                    fine: type.fine
                }));
                setViolationTypes(types);
            }
        } catch (error) {
            console.error("Error fetching violation types:", error);
            toast.error("Lỗi khi tải dữ liệu loại vi phạm");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchViolationTypes();
    }, []);

    // Handle form input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Validate input
        let errorMessage = "";
        if (name === "code") {
            if (!value) {
                errorMessage = "Mã vi phạm không được để trống";
            } else if (dialogMode === 'add' && violationTypes.some(type => type.code === value)) {
                errorMessage = "Mã vi phạm đã tồn tại";
            }
        } else if (name === "description") {
            if (!value) {
                errorMessage = "Mô tả không được để trống";
            }
        } else if (name === "fine") {
            if (isNaN(Number(value)) || Number(value) < 0) {
                errorMessage = "Tiền phạt phải là số dương";
            }
        }

        // Update errors
        setErrors({
            ...errors,
            [name]: errorMessage
        });

        // Update current violation
        if (name === "fine") {
            setCurrentViolation({
                ...currentViolation,
                [name]: Number(value)
            });
        } else {
            setCurrentViolation({
                ...currentViolation,
                [name]: value
            });
        }
    };

    // Handle dialog open for add
    const handleAddDialogOpen = () => {
        setDialogMode('add');
        setCurrentViolation({
            id: 0,
            code: "",
            description: "",
            fine: 0
        });
        setErrors({
            code: "",
            description: "",
            fine: ""
        });
        setDialogOpen(true);
    };

    // Handle dialog open for edit
    const handleEditDialogOpen = (violationType: ViolationType) => {
        setDialogMode('edit');
        setCurrentViolation({
            id: violationType.id,
            code: violationType.code,
            description: violationType.description,
            fine: violationType.fine
        });
        setErrors({
            code: "",
            description: "",
            fine: ""
        });
        setDialogOpen(true);
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {
            code: !currentViolation.code ? "Mã vi phạm không được để trống" : "",
            description: !currentViolation.description ? "Mô tả không được để trống" : "",
            fine: isNaN(currentViolation.fine) || currentViolation.fine < 0 ? "Tiền phạt phải là số dương" : ""
        };

        setErrors(newErrors);

        // Check if any error exists
        return !Object.values(newErrors).some(error => error !== "");
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Phiên đăng nhập đã hết hạn");
                return;
            }

            const endpoint = dialogMode === 'add'
                ? `${endpointBE}/library-card-violation/create`
                : `${endpointBE}/library-card-violation/update`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: currentViolation.id,
                    code: currentViolation.code,
                    description: currentViolation.description,
                    fine: currentViolation.fine
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to ${dialogMode} violation type`);
            }

            toast.success(dialogMode === 'add'
                ? "Thêm loại vi phạm thành công"
                : "Cập nhật loại vi phạm thành công");

            setDialogOpen(false);
            fetchViolationTypes(); // Refresh data
        } catch (error) {
            console.error(`Error ${dialogMode === 'add' ? 'adding' : 'updating'} violation type:`, error);
            toast.error(`Lỗi khi ${dialogMode === 'add' ? 'thêm' : 'cập nhật'} loại vi phạm`);
        }
    };

    // Handle delete violation type
    const handleDeleteViolationType = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa loại vi phạm này không?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Phiên đăng nhập đã hết hạn");
                return;
            }

            const response = await fetch(`${endpointBE}/library-violation-types/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to delete violation type");
            }

            toast.success("Xóa loại vi phạm thành công");
            fetchViolationTypes(); // Refresh data
        } catch (error) {
            console.error("Error deleting violation type:", error);
            toast.error("Lỗi khi xóa loại vi phạm");
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <div className="container p-5">
            <Paper elevation={3} className="p-4 mb-4">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h1" gutterBottom>
                        Quản lý loại vi phạm thư viện
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddDialogOpen}
                    >
                        Thêm loại vi phạm
                    </Button>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : violationTypes.length === 0 ? (
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="body1" color="textSecondary" align="center">
                                Chưa có loại vi phạm nào được tạo
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={50}>ID</TableCell>
                                    <TableCell>Mã vi phạm</TableCell>
                                    <TableCell>Mô tả</TableCell>
                                    <TableCell>Tiền phạt</TableCell>
                                    <TableCell width={120} align="center">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {violationTypes.map((violationType) => (
                                    <TableRow key={violationType.id}>
                                        <TableCell>{violationType.id}</TableCell>
                                        <TableCell>{violationType.code}</TableCell>
                                        <TableCell>{violationType.description}</TableCell>
                                        <TableCell>{formatCurrency(violationType.fine)}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Sửa">
                                                <IconButton
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => handleEditDialogOpen(violationType)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa">
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleDeleteViolationType(violationType.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {dialogMode === 'add' ? 'Thêm loại vi phạm mới' : 'Chỉnh sửa loại vi phạm'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="code"
                                label="Mã vi phạm"
                                value={currentViolation.code}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                error={!!errors.code}
                                helperText={errors.code}
                                disabled={dialogMode === 'edit'} // Cannot edit code in edit mode
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Mô tả"
                                value={currentViolation.description}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                multiline
                                rows={3}
                                error={!!errors.description}
                                helperText={errors.description}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="fine"
                                label="Tiền phạt (VNĐ)"
                                value={currentViolation.fine}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                type="number"
                                inputProps={{ min: 0 }}
                                error={!!errors.fine}
                                helperText={errors.fine}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        color="primary"
                        variant="contained"
                    >
                        {dialogMode === 'add' ? 'Thêm' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

// Wrap component with RequireAdmin HOC to ensure only admins can access
const LibraryViolationTypeManagementPage = RequireAdmin(LibraryViolationTypeManagement);
export default LibraryViolationTypeManagementPage;