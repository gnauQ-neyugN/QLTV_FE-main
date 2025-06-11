import { DeleteOutlineOutlined } from "@mui/icons-material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import {
	Box,
	Chip,
	CircularProgress,
	IconButton,
	Tooltip,
	TextField,
	InputAdornment,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { GridColDef } from "@mui/x-data-grid";
import React, { useEffect, useState, useMemo } from "react";
import { DataTable } from "../../../layouts/utils/DataTable";
import UserModel from "../../../model/UserModel";
import { getAllUserRole } from "../../../api/UserApi";
import { useConfirm } from "material-ui-confirm";
import { toast } from "react-toastify";
import { endpointBE } from "../../../layouts/utils/Constant";

interface UserTableProps {
	setOption: any;
	handleOpenModal: any;
	setKeyCountReload?: any;
	keyCountReload?: any;
	setId: any;
}

export const UserTable: React.FC<UserTableProps> = (props) => {
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	// Tạo biến để lấy tất cả data
	const [data, setData] = useState<UserModel[]>([]);

	const confirm = useConfirm();

	// Xử lý xoá user
	function handleDeleteUser(idUser: any) {
		const token = localStorage.getItem("token");
		confirm({
			title: "Xoá người dùng",
			description: `Bạn chắc chắn xoá người dùng này chứ?`,
			confirmationText: ["Xoá"],
			cancellationText: ["Huỷ"],
		})
			.then(() => {
				toast.promise(
					fetch(endpointBE + `/user/delete-user/${idUser}`, {
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					})
						.then((response) => {
							if (response.ok) {
								toast.success("Xoá người dùng thành công");
								props.setKeyCountReload(Math.random());
							} else {
								toast.error("Lỗi khi xoá người dùng");
							}
						})
						.catch((error) => {
							toast.error("Lỗi khi xoá người dùng");
							console.log(error);
						}),
					{ pending: "Đang trong quá trình xử lý ..." }
				);
			})
			.catch(() => {});
	}

	useEffect(() => {
		getAllUserRole()
			.then((response) => {
				let users = response
					.flat()
					.map((user) => ({ ...user, id: user.idUser }));
				users = users.sort((u1, u2) => u1.idUser - u2.idUser);
				setData(users);
				setLoading(false);
			})
			.catch((error) => {
				console.log(error);
				setLoading(false);
			});
	}, [props.keyCountReload]);

	// Lọc dữ liệu dựa trên search term và filters
	const filteredData = useMemo(() => {
		return data.filter((user) => {
			const matchesSearch = searchTerm === "" ||
				user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(user.firstName + " " + user.lastName).toLowerCase().includes(searchTerm.toLowerCase());

			const userRoleString = typeof user.role === 'string' ? user.role : String(user.role || '');
			const matchesRole = roleFilter === "all" || userRoleString === roleFilter;
			const matchesStatus = statusFilter === "all" ||
				(statusFilter === "active" && user.enabled) ||
				(statusFilter === "inactive" && !user.enabled);

			return matchesSearch && matchesRole && matchesStatus;
		});
	}, [data, searchTerm, roleFilter, statusFilter]);

	// Lấy danh sách role duy nhất
	const uniqueRoles = useMemo(() => {
		const roleSet = new Set(data.map(user => typeof user.role === 'string' ? user.role : String(user.role || '')));
		const roles = Array.from(roleSet);
		return roles.filter(role => role); // Loại bỏ undefined/null/empty string
	}, [data]);

	// Thống kê người dùng
	const userStats = useMemo(() => {
		const total = data.length;
		const active = data.filter(user => user.enabled).length;
		const getRoleString = (role: string | number | undefined) => typeof role === 'string' ? role : String(role || '');
		const admins = data.filter(user => getRoleString(user.role) === "ADMIN").length;
		const customers = data.filter(user => getRoleString(user.role) === "CUSTOMER").length;

		return { total, active, inactive: total - active, admins, customers };
	}, [data]);

	const columns: GridColDef[] = [
		{ field: "id", headerName: "ID", width: 50 },
		{ field: "username", headerName: "TÊN TÀI KHOẢN", width: 120 },
		{
			field: "role",
			headerName: "VAI TRÒ",
			width: 150,
			renderCell: (params) => {
				const getRoleColor = (role: string | number | undefined) => {
					const roleString = typeof role === 'string' ? role : String(role || '');
					switch (roleString) {
						case "ADMIN":
							return "error";
						case "CUSTOMER":
							return "success";
						default:
							return "default";
					}
				};

				const roleValue = typeof params.value === 'string' ? params.value : String(params.value || '');

				return (
					<Chip
						label={roleValue}
						color={getRoleColor(params.value) as any}
						variant="outlined"
						size="small"
					/>
				);
			},
		},
		{ field: "lastName", headerName: "TÊN", width: 100 },
		{
			field: "dateOfBirth",
			headerName: "NGÀY SINH",
			width: 100,
		},
		{ field: "email", headerName: "EMAIL", width: 200 },
		{ field: "phoneNumber", headerName: "SỐ ĐIỆN THOẠI", width: 120 },
		{
			field: "enabled",
			headerName: "TRẠNG THÁI",
			width: 120,
			renderCell: (params) => {
				return (
					<Chip
						label={params.value ? "Đã kích hoạt" : "Chưa kích hoạt"}
						color={params.value ? "success" : "warning"}
						variant="outlined"
						size="small"
					/>
				);
			},
		},
		{
			field: "action",
			headerName: "HÀNH ĐỘNG",
			width: 200,
			type: "actions",
			renderCell: (item) => {
				return (
					<div>
						<Tooltip title={"Chỉnh sửa"}>
							<IconButton
								color='primary'
								onClick={() => {
									props.setOption("update");
									props.setId(item.id);
									props.handleOpenModal();
								}}
							>
								<EditOutlinedIcon />
							</IconButton>
						</Tooltip>
						<Tooltip title={"Xoá"}>
							<IconButton
								color='error'
								onClick={() => handleDeleteUser(item.id)}
							>
								<DeleteOutlineOutlined />
							</IconButton>
						</Tooltip>
					</div>
				);
			},
		},
	];

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			{/* Thống kê tổng quan */}
			<Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
				<Alert severity="info" sx={{ flexGrow: 1 }}>
					<strong>Thống kê:</strong> Tổng {userStats.total} người dùng |
					Đã kích hoạt: {userStats.active} |
					Chưa kích hoạt: {userStats.inactive} |
					Admin: {userStats.admins} |
					Khách hàng: {userStats.customers}
				</Alert>
			</Box>

			{/* Thanh tìm kiếm và bộ lọc */}
			<Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
				<TextField
					placeholder="Tìm kiếm theo tên, username hoặc email..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
					sx={{ minWidth: 300, flexGrow: 1 }}
					size="small"
				/>

				<FormControl sx={{ minWidth: 150 }} size="small">
					<InputLabel>Vai trò</InputLabel>
					<Select
						value={roleFilter}
						label="Vai trò"
						onChange={(e) => setRoleFilter(e.target.value)}
					>
						<MenuItem value="all">Tất cả</MenuItem>
						{uniqueRoles.map((role) => (
							<MenuItem key={role} value={role}>
								{role}
							</MenuItem>
						))}
					</Select>
				</FormControl>

				<FormControl sx={{ minWidth: 150 }} size="small">
					<InputLabel>Trạng thái</InputLabel>
					<Select
						value={statusFilter}
						label="Trạng thái"
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<MenuItem value="all">Tất cả</MenuItem>
						<MenuItem value="active">Đã kích hoạt</MenuItem>
						<MenuItem value="inactive">Chưa kích hoạt</MenuItem>
					</Select>
				</FormControl>
			</Box>

			{/* Bảng dữ liệu */}
			<DataTable columns={columns} rows={filteredData} />

			{/* Thông tin kết quả tìm kiếm */}
			<Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span>
						Hiển thị {filteredData.length} / {data.length} người dùng
					</span>
					{(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
							<span style={{ fontSize: '0.875rem', color: '#666' }}>Bộ lọc đang áp dụng:</span>
							{searchTerm && (
								<Chip
									label={`Tìm kiếm: "${searchTerm}"`}
									size="small"
									onDelete={() => setSearchTerm("")}
								/>
							)}
							{roleFilter !== "all" && (
								<Chip
									label={`Vai trò: ${roleFilter}`}
									size="small"
									onDelete={() => setRoleFilter("all")}
								/>
							)}
							{statusFilter !== "all" && (
								<Chip
									label={`Trạng thái: ${statusFilter === "active" ? "Đã kích hoạt" : "Chưa kích hoạt"}`}
									size="small"
									onDelete={() => setStatusFilter("all")}
								/>
							)}
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};