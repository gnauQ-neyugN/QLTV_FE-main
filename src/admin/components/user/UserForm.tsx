import React, { FormEvent, useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import {
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Switch,
	FormControlLabel,
	Chip,
	Alert,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import UserModel from "../../../model/UserModel";
import {
	checkExistEmail,
	checkExistUsername,
	checkPassword,
	checkPhoneNumber,
} from "../../../layouts/utils/Validation";
import { getAllRoles } from "../../../api/RoleApi";
import RoleModel from "../../../model/RoleModel";
import { toast } from "react-toastify";
import { LoadingButton } from "@mui/lab";
import { get1User } from "../../../api/UserApi";
import { getUsernameByToken } from "../../../layouts/utils/JwtService";
import { endpointBE } from "../../../layouts/utils/Constant";

interface UserFormProps {
	option: string;
	setKeyCountReload?: any;
	id: number | undefined; // Explicitly allow number or undefined
	handleCloseModal: any;
}

export const UserForm: React.FC<UserFormProps> = (props) => {
	// Các biến cần thiết
	const [user, setUser] = useState<UserModel>({
		idUser: 0,
		dateOfBirth: new Date("2000-01-01"),
		deliveryAddress: "",
		purchaseAddress: "",
		email: "",
		firstName: "",
		lastName: "",
		gender: "M",
		phoneNumber: "",
		username: "",
		password: "",
		avatar: "",
		role: 3, // Mặc định role Customer (ID = 3)
		enabled: false, // Mặc định chưa kích hoạt
	});
	const [avatar, setAvatar] = useState<File | null>(null);
	const [previewAvatar, setPreviewAvatar] = useState("");
	const [roles, setRoles] = useState<RoleModel[]>([]);
	// Khi submit thì btn loading ...
	const [statusBtn, setStatusBtn] = useState(false);

	// Khai báo các biến lỗi
	const [errorUsername, setErrorUsername] = useState("");
	const [errorEmail, setErrorEmail] = useState("");
	const [errorPassword, setErrorPassword] = useState("");
	const [errorPhoneNumber, setErrorPhoneNumber] = useState("");

	// Lấy ra role
	useEffect(() => {
		getAllRoles().then((response) => {
			setRoles(response);
			// Nếu là thêm mới, tự động chọn role Customer
			if (props.option === "add") {
				const customerRole = response.find(role => role.nameRole === "CUSTOMER");
				if (customerRole) {
					setUser(prev => ({ ...prev, role: customerRole.idRole }));
				}
			}
		});
	}, [props.option]);

	// Load user lên khi update - Added proper type checking
	useEffect(() => {
		if (props.option === "update" && typeof props.id === 'number' && props.id > 0) {
			get1User(props.id).then((response) => {
				setUser({
					...response,
					dateOfBirth: new Date(response.dateOfBirth),
					enabled: response.enabled || false, // Thêm trạng thái kích hoạt
					role: response.role || 3, // Đảm bảo role luôn có giá trị, mặc định Customer
				});
				setPreviewAvatar(response.avatar);
			}).catch((error) => {
				console.error("Error loading user:", error);
				toast.error("Không thể tải thông tin người dùng");
			});
		}
	}, [props.id, props.option]);

	function hanleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const token = localStorage.getItem("token");

		if (getUsernameByToken() === user.username) {
			toast.warning("Bạn không thể cập nhật tài khoản bạn đang sử dụng");
			return;
		}

		// Additional validation for update mode
		if (props.option === "update" && (typeof props.id !== 'number' || props.id <= 0)) {
			toast.error("ID người dùng không hợp lệ");
			return;
		}

		setStatusBtn(true);

		// Chuẩn bị dữ liệu gửi lên server
		const userData = {
			...user,
			// Nếu là thêm mới, mặc định enabled = false, admin sẽ kích hoạt sau
			enabled: props.option === "add" ? false : user.enabled,
		};

		const endpoint =
			props.option === "add"
				? endpointBE + "/user/add-user"
				: endpointBE + "/user/update-user";
		const method = props.option === "add" ? "POST" : "PUT";

		toast.promise(
			fetch(endpoint, {
				method: method,
				headers: {
					Authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify(userData),
			})
				.then((response) => {
					if (response.ok) {
						setUser({
							idUser: 0,
							dateOfBirth: new Date("2000-01-01"),
							deliveryAddress: "",
							purchaseAddress: "",
							email: "",
							firstName: "",
							lastName: "",
							gender: "M",
							phoneNumber: "",
							username: "",
							password: "",
							avatar: "",
							role: 3, // Reset về Customer
							enabled: false,
						});
						setAvatar(null);
						setPreviewAvatar("");
						setStatusBtn(false);
						if (props.setKeyCountReload) {
							props.setKeyCountReload(Math.random());
						}
						props.handleCloseModal();
						toast.success(
							props.option === "add"
								? "Thêm người dùng thành công"
								: "Cập nhật người dùng thành công"
						);
					} else {
						setStatusBtn(false);
						toast.error("Gặp lỗi trong quá trình xử lý người dùng");
					}
				})
				.catch((error) => {
					console.log(error);
					setStatusBtn(false);
					toast.error("Gặp lỗi trong quá trình xử lý người dùng");
				}),
			{ pending: "Đang trong quá trình xử lý ..." }
		);
	}

	function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const inputElement = event.target as HTMLInputElement;

		if (inputElement.files && inputElement.files.length > 0) {
			const selectedFile = inputElement.files[0];

			const reader = new FileReader();

			reader.onload = (e: any) => {
				// e.target.result chính là chuỗi base64
				const thumnailBase64 = e.target?.result as string;
				// Tiếp tục xử lý tệp đã chọn
				setAvatar(selectedFile);
				setPreviewAvatar(URL.createObjectURL(selectedFile));
				setUser({ ...user, avatar: thumnailBase64 });
			};
			// Đọc tệp dưới dạng chuỗi base64
			reader.readAsDataURL(selectedFile);
		}
	}

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const dateString = e.target.value;
		// Chuyển đổi chuỗi thành đối tượng Date
		const dateObject = new Date(dateString);
		if (!isNaN(dateObject.getTime())) {
			// Nếu là một ngày hợp lệ, cập nhật state
			setUser({
				...user,
				dateOfBirth: dateObject,
			});
		}
	};

	// Hàm xử lý thay đổi trạng thái kích hoạt
	const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setUser({
			...user,
			enabled: event.target.checked,
		});
	};

	// Helper function để đảm bảo role luôn có giá trị
	const getSafeRole = (roleId: number | undefined): number => {
		return typeof roleId === 'number' ? roleId : 3; // Default to Customer role
	};

	// Lấy tên role dựa trên ID
	const getRoleName = (roleId: number | undefined) => {
		if (typeof roleId !== 'number') {
			return "Unknown";
		}
		const role = roles.find(r => r.idRole === roleId);
		return role ? role.nameRole : "Unknown";
	};

	// Lấy màu cho role chip
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

	// Early return if update mode but no valid ID
	if (props.option === "update" && (typeof props.id !== 'number' || props.id <= 0)) {
		return (
			<div>
				<Typography className='text-center' variant='h4' component='h2' color="error">
					LỖI: ID NGƯỜI DÙNG KHÔNG HỢP LỆ
				</Typography>
				<Alert severity="error" sx={{ mt: 2 }}>
					Không thể cập nhật người dùng vì ID không hợp lệ. Vui lòng thử lại.
				</Alert>
			</div>
		);
	}

	return (
		<div>
			<Typography className='text-center' variant='h4' component='h2'>
				{props.option === "add"
					? "TẠO NGƯỜI DÙNG"
					: props.option === "update"
						? "SỬA NGƯỜI DÙNG"
						: "XEM CHI TIẾT"}
			</Typography>
			<hr />
			<div className='container px-5'>
				{props.option === "add" && (
					<Alert severity="info" sx={{ mb: 3 }}>
						<strong>Lưu ý:</strong> Tài khoản mới sẽ được tạo với vai trò Customer và cần được kích hoạt bởi admin.
					</Alert>
				)}

				<form onSubmit={hanleSubmit} className='form'>
					<input type='hidden' value={user.idUser} hidden />
					<div className='row'>
						<div className='col-6'>
							<Box
								sx={{
									"& .MuiTextField-root": { mb: 3 },
								}}
							>
								<TextField
									required
									id='filled-required'
									label='Tên tài khoản'
									style={{ width: "100%" }}
									error={errorUsername.length > 0 ? true : false}
									helperText={errorUsername}
									value={user.username}
									InputProps={{
										disabled:
											props.option === "update" ? true : false,
									}}
									onChange={(e: any) => {
										setUser({ ...user, username: e.target.value });
										setErrorUsername("");
									}}
									onBlur={(e: any) => {
										if (props.option === "add") {
											checkExistUsername(
												setErrorUsername,
												e.target.value
											);
										}
									}}
									size='small'
								/>

								<TextField
									required={props.option === "update" ? false : true}
									id='filled-required'
									type='password'
									label='Mật khẩu'
									style={{ width: "100%" }}
									error={errorPassword.length > 0 ? true : false}
									helperText={errorPassword}
									value={user.password}
									onChange={(e: any) => {
										setUser({ ...user, password: e.target.value });
										setErrorPassword("");
									}}
									onBlur={(e: any) => {
										if (e.target.value) {
											checkPassword(setErrorPassword, e.target.value);
										}
									}}
									size='small'
								/>

								<TextField
									required
									id='filled-required'
									label='Email'
									type='email'
									style={{ width: "100%" }}
									error={errorEmail.length > 0 ? true : false}
									helperText={errorEmail}
									value={user.email}
									InputProps={{
										disabled:
											props.option === "update" ? true : false,
									}}
									onChange={(e: any) => {
										setUser({ ...user, email: e.target.value });
										setErrorEmail("");
									}}
									onBlur={(e: any) => {
										if (props.option === "add") {
											checkExistEmail(setErrorEmail, e.target.value);
										}
									}}
									size='small'
								/>

								<TextField
									required
									id='filled-required'
									label='Số điện thoại'
									style={{ width: "100%" }}
									error={errorPhoneNumber.length > 0 ? true : false}
									helperText={errorPhoneNumber}
									value={user.phoneNumber}
									onChange={(e: any) => {
										setUser({
											...user,
											phoneNumber: e.target.value,
										});
										setErrorPhoneNumber("");
									}}
									onBlur={(e: any) => {
										checkPhoneNumber(
											setErrorPhoneNumber,
											e.target.value
										);
									}}
									size='small'
								/>

								<TextField
									required
									id='filled-required'
									label='Ngày sinh'
									style={{ width: "100%" }}
									type='date'
									value={user.dateOfBirth.toISOString().split("T")[0]}
									onChange={handleDateChange}
									size='small'
								/>
							</Box>
						</div>
						<div className='col-6'>
							<Box
								sx={{
									"& .MuiTextField-root": { mb: 3 },
								}}
							>
								<TextField
									id='filled-required'
									label='Họ đệm'
									style={{ width: "100%" }}
									value={user.firstName}
									onChange={(e: any) =>
										setUser({ ...user, firstName: e.target.value })
									}
									size='small'
								/>

								<TextField
									required
									id='filled-required'
									label='Tên'
									style={{ width: "100%" }}
									value={user.lastName}
									onChange={(e: any) =>
										setUser({ ...user, lastName: e.target.value })
									}
									size='small'
								/>

								<TextField
									id='filled-required'
									label='Địa chỉ'
									style={{ width: "100%" }}
									value={user.deliveryAddress}
									onChange={(e: any) =>
										setUser({
											...user,
											deliveryAddress: e.target.value,
										})
									}
									size='small'
								/>

								<FormControl fullWidth size='small' sx={{ mb: 3 }}>
									<InputLabel id='demo-simple-select-label'>
										Giới tính
									</InputLabel>
									<Select
										labelId='demo-simple-select-label'
										id='demo-simple-select'
										value={user.gender}
										label='Giới tính'
										onChange={(e: any) =>
											setUser({ ...user, gender: e.target.value })
										}
									>
										<MenuItem value={"M"}>Nam</MenuItem>
										<MenuItem value={"F"}>Nữ</MenuItem>
									</Select>
								</FormControl>

								<FormControl fullWidth size='small' sx={{ mb: 3 }}>
									<InputLabel id='role-select-label'>
										Vai trò
									</InputLabel>
									<Select
										labelId='role-select-label'
										id='role-select'
										value={getSafeRole(user.role)}
										label='Vai trò'
										onChange={(e: any) =>
											setUser({
												...user,
												role: e.target.value as number,
											})
										}
										disabled={props.option === "add"} // Không cho sửa role khi thêm mới
									>
										{roles.map((role) => (
											<MenuItem
												value={role.idRole}
												key={role.idRole}
											>
												<Chip
													label={role.nameRole}
													color={getRoleColor(role.nameRole) as any}
													size="small"
													variant="outlined"
													sx={{ mr: 1 }}
												/>
												{role.nameRole}
											</MenuItem>
										))}
									</Select>
									{props.option === "add" && (
										<Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
											Vai trò mặc định là Customer và có thể thay đổi sau khi tạo tài khoản
										</Typography>
									)}
								</FormControl>

								{/* Phần quản lý kích hoạt tài khoản - chỉ hiển thị khi update */}
								{props.option === "update" && (
									<Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
										<Typography variant="subtitle2" gutterBottom>
											Quản lý tài khoản
										</Typography>
										<FormControlLabel
											control={
												<Switch
													checked={user.enabled}
													onChange={handleEnabledChange}
													color="primary"
												/>
											}
											label={
												<Box display="flex" alignItems="center">
													<span>Kích hoạt tài khoản</span>
													<Chip
														label={user.enabled ? "Đã kích hoạt" : "Chưa kích hoạt"}
														color={user.enabled ? "success" : "warning"}
														size="small"
														sx={{ ml: 1 }}
													/>
												</Box>
											}
										/>
										<Typography variant="caption" color="text.secondary" display="block">
											{user.enabled
												? "Tài khoản đã được kích hoạt và có thể đăng nhập"
												: "Tài khoản chưa được kích hoạt, người dùng không thể đăng nhập"
											}
										</Typography>
									</Box>
								)}
							</Box>
						</div>

						<div className='d-flex align-items-center mt-3'>
							<Button
								size='small'
								component='label'
								variant='outlined'
								startIcon={<CloudUpload />}
							>
								Tải ảnh avatar
								<input
									style={{ opacity: "0", width: "10px" }}
									type='file'
									accept='image/*'
									onChange={handleImageUpload}
									alt=''
								/>
							</Button>
							<span className='ms-3'>{avatar?.name}</span>
							<img src={previewAvatar} alt='' width={100} />
						</div>
					</div>
					<LoadingButton
						className='w-100 my-3'
						type='submit'
						loading={statusBtn}
						variant='outlined'
						sx={{ width: "25%", padding: "10px" }}
					>
						{props.option === "add" ? "Tạo người dùng" : "Lưu người dùng"}
					</LoadingButton>
				</form>
			</div>
		</div>
	);
};