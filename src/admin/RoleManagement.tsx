import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Chip,
    Alert,
    CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SecurityIcon from "@mui/icons-material/Security";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { toast } from "react-toastify";
import RequireAdmin from "./RequireAdmin";
import { getAllUserRole } from "../api/UserApi";
import { getAllRoles } from "../api/RoleApi";
import RoleModel from "../model/RoleModel";
import UserModel from "../model/UserModel";
import { endpointBE } from "../layouts/utils/Constant";

interface UserWithRole extends Omit<UserModel, 'role'> {
    roleName: string;
    role?: string | number; // Keep original role for API operations
}

const RoleManagement = () => {
    // State variables
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [roles, setRoles] = useState<RoleModel[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
    const [newRole, setNewRole] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);

    // Filter states
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Fetch users and roles
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users with roles
            const usersData = await getAllUserRole();
            const usersWithRoles: UserWithRole[] = usersData.map(user => ({
                ...user,
                roleName: typeof user.role === 'string' ? user.role : String(user.role || "Unknown")
            }));

            // Fetch available roles
            const rolesData = await getAllRoles();

            setUsers(usersWithRoles);
            setRoles(rolesData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on role and search term
    const filteredUsers = users.filter(user => {
        const matchesRole = roleFilter === "all" || user.roleName === roleFilter;
        const matchesSearch = searchTerm === "" ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.firstName + " " + user.lastName).toLowerCase().includes(searchTerm.toLowerCase());

        return matchesRole && matchesSearch;
    });

    // Open role change dialog
    const handleOpenDialog = (user: UserWithRole) => {
        setSelectedUser(user);
        const currentRole = roles.find(role => role.nameRole === user.roleName);
        setNewRole(currentRole?.idRole || 0);
        setDialogOpen(true);
    };

    // Close dialog
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUser(null);
        setNewRole(0);
    };

    // Update user role
    const handleUpdateRole = async () => {
        if (!selectedUser || !newRole) {
            toast.error("Vui lòng chọn vai trò");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Phiên đăng nhập đã hết hạn");
                return;
            }

            // Prepare user data for update
            const userData = {
                ...selectedUser,
                role: newRole,
                dateOfBirth: selectedUser.dateOfBirth.toISOString().split('T')[0] + 'T00:00:00.000Z'
            };

            const response = await fetch(`${endpointBE}/user/update-user`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error("Failed to update user role");
            }

            toast.success("Cập nhật vai trò thành công");
            handleCloseDialog();
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error updating user role:", error);
            toast.error("Lỗi khi cập nhật vai trò");
        } finally {
            setSubmitting(false);
        }
    };

    // Get role color
    const getRoleColor = (roleName: string) => {
        switch (roleName) {
            case "ADMIN":
                return "error";
            case "CUSTOMER":
                return "success";
            default:
                return "default";
        }
    };

    // Get role icon
    const getRoleIcon = (roleName: string) => {
        switch (roleName) {
            case "ADMIN":
                return <AdminPanelSettingsIcon />;
            case "CUSTOMER":
                return <PersonIcon />;
            default:
                return <SecurityIcon />;
        }
    };

    // Calculate role statistics
    const roleStats = roles.map(role => ({
        ...role,
        count: users.filter(user => user.roleName === role.nameRole).length
    }));

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="container p-5">
            <Paper elevation={3} className="p-4 mb-4">
                <Typography variant="h5" component="h1" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Quản lý phân quyền người dùng
                </Typography>

                {/* Role Statistics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {roleStats.map((role) => (
                        <Grid item xs={12} sm={6} md={4} key={role.idRole}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h6" component="div">
                                                {role.count}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {role.nameRole}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            icon={getRoleIcon(role.nameRole)}
                                            label={role.nameRole}
                                            color={getRoleColor(role.nameRole) as any}
                                            variant="outlined"
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <strong>Lưu ý:</strong> Việc thay đổi vai trò người dùng sẽ ảnh hưởng đến quyền truy cập của họ vào hệ thống.
                    Hãy cân nhắc kỹ trước khi thực hiện thay đổi.
                </Alert>

                {/* Filters */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        label="Tìm kiếm người dùng"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nhập tên, username hoặc email..."
                        sx={{ minWidth: 300, flexGrow: 1 }}
                        size="small"
                    />

                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>Lọc theo vai trò</InputLabel>
                        <Select
                            value={roleFilter}
                            label="Lọc theo vai trò"
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            {roles.map((role) => (
                                <MenuItem key={role.idRole} value={role.nameRole}>
                                    {role.nameRole}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Users Table */}
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Họ tên</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Vai trò hiện tại</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell align="center">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography color="text.secondary">
                                            Không tìm thấy người dùng nào
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.idUser}>
                                        <TableCell>{user.idUser}</TableCell>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>
                                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || '—'}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getRoleIcon(user.roleName)}
                                                label={user.roleName}
                                                color={getRoleColor(user.roleName) as any}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.enabled ? "Đã kích hoạt" : "Chưa kích hoạt"}
                                                color={user.enabled ? "success" : "warning"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Thay đổi vai trò">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(user)}
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Summary */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Hiển thị {filteredUsers.length} / {users.length} người dùng
                    </Typography>
                </Box>
            </Paper>

            {/* Role Change Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <SecurityIcon sx={{ mr: 1 }} />
                        Thay đổi vai trò người dùng
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Thông tin người dùng:
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Username:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedUser.username}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Email:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedUser.email}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Họ tên:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || '—'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Vai trò hiện tại:
                                    </Typography>
                                    <Chip
                                        icon={getRoleIcon(selectedUser.roleName)}
                                        label={selectedUser.roleName}
                                        color={getRoleColor(selectedUser.roleName) as any}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>

                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Vai trò mới</InputLabel>
                                <Select
                                    value={newRole}
                                    label="Vai trò mới"
                                    onChange={(e) => setNewRole(e.target.value as number)}
                                >
                                    {roles.map((role) => (
                                        <MenuItem key={role.idRole} value={role.idRole}>
                                            <Box display="flex" alignItems="center">
                                                {getRoleIcon(role.nameRole)}
                                                <Box sx={{ ml: 1 }}>
                                                    <Typography variant="body1">
                                                        {role.nameRole}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {newRole !== 0 && (
                                <Alert
                                    severity={
                                        roles.find(r => r.idRole === newRole)?.nameRole === "ADMIN"
                                            ? "warning"
                                            : "info"
                                    }
                                    sx={{ mt: 2 }}
                                >
                                    <Typography variant="body2">
                                        {roles.find(r => r.idRole === newRole)?.nameRole === "ADMIN"
                                            ? "⚠️ Bạn đang cấp quyền quản trị viên cho người dùng này. Họ sẽ có toàn quyền truy cập vào hệ thống!"
                                            : "ℹ️ Người dùng sẽ có quyền truy cập với vai trò khách hàng."
                                        }
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseDialog}
                        color="inherit"
                        disabled={submitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleUpdateRole}
                        color="primary"
                        variant="contained"
                        disabled={submitting || newRole === 0}
                        startIcon={submitting ? <CircularProgress size={20} /> : null}
                    >
                        {submitting ? "Đang cập nhật..." : "Cập nhật vai trò"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

// Wrap component with RequireAdmin HOC to ensure only admins can access
const RoleManagementPage = RequireAdmin(RoleManagement);
export default RoleManagementPage;