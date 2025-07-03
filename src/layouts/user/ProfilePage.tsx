import { CloudUpload, EditOutlined } from "@mui/icons-material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import React, { FormEvent, useEffect, useLayoutEffect, useState } from "react";
import HiddenInputUpload from "../utils/HiddenInputUpload";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import {
	checkPassword,
	checkPhoneNumber,
	checkRepeatPassword,
} from "../utils/Validation";
import Tooltip from "@mui/material/Tooltip";
import OrderTable from "./components/OrderTable";
import { FadeModal } from "../utils/FadeModal";
import { OrderForm } from "../../admin/components/order/OrderForm";
import { get1User } from "../../api/UserApi";
import { getIdUserByToken } from "../utils/JwtService";
import UserModel from "../../model/UserModel";
import { endpointBE } from "../utils/Constant";
import { toast } from "react-toastify";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";
import useScrollToTop from "../../hooks/ScrollToTop";
import { Alert, Card, CardContent, Typography } from "@mui/material";
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

interface ProfilePageProps {
	setReloadAvatar: any;
}

// Interface cho thông tin thẻ thư viện
interface LibraryCardInfo {
	idLibraryCard: number;
	cardNumber: string;
	issuedDate: string;
	expiryDate: string;
	activated: boolean;
	status: string;
	// Các thông tin khác nếu cần
}

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
	useScrollToTop(); // Mỗi lần vào component này thì sẽ ở trên cùng

	const {isLoggedIn} = useAuth();
	const navigation = useNavigate();

	useLayoutEffect(() => {
		if (!isLoggedIn) {
			navigation("/login");
		}
	});

	// Các biến thông tin cá nhân
	const [user, setUser] = useState<UserModel>({
		idUser: 0,
		dateOfBirth: new Date(),
		deliveryAddress: "",
		purchaseAddress: "",
		email: "",
		firstName: "",
		lastName: "",
		gender: "",
		password: "",
		phoneNumber: "",
		username: "",
		identifierCode:"",
		avatar: "",
	});
	const [newPassword, setNewPassword] = useState("");
	const [repeatPassword, setRepeatPassword] = useState("");
	const [dataAvatar, setDataAvatar] = useState("");
	const [previewAvatar, setPreviewAvatar] = useState("");

	// Thông tin thẻ thư viện
	const [libraryCard, setLibraryCard] = useState<LibraryCardInfo | null>(null);
	const [loadingLibraryCard, setLoadingLibraryCard] = useState(true);

	// reload lại component order table
	const [keyCountReload, setKeyCountReload] = useState(0);

	// Xử lý order table
	const [id, setId] = useState(0);
	const [openModal, setOpenModal] = React.useState(false);
	const handleOpenModal = () => setOpenModal(true);
	const handleCloseModal = () => setOpenModal(false);

	// Xử lý modal tạo thẻ thư viện
	const [openCreateCardModal, setOpenCreateCardModal] = React.useState(false);
	const [newCardNumber, setNewCardNumber] = useState("");
	const [cardNumberError, setCardNumberError] = useState("");
	const handleOpenCreateCardModal = () => setOpenCreateCardModal(true);
	const handleCloseCreateCardModal = () => setOpenCreateCardModal(false);

	// Xử lý modal gia hạn thẻ thư viện
	const [openRenewCardModal, setOpenRenewCardModal] = React.useState(false);
	const handleOpenRenewCardModal = () => setOpenRenewCardModal(true);
	const handleCloseRenewCardModal = () => setOpenRenewCardModal(false);

	// Các biến trạng thái
	const [modifiedStatus, setModifiedStatus] = useState(false);
	const [isUploadAvatar, setIsUploadAvatar] = useState(false);

	// Các biến thông báo lỗi
	const [errorPhoneNumber, setErrorPhoneNumber] = useState("");
	const [errorNewPassword, setErrorNewPassword] = useState("");
	const [errorRepeatPassword, setErrorRepeatPassword] = useState("");

	// Lấy data user lên
	useEffect(() => {
		const idUser = getIdUserByToken();
		get1User(idUser)
			.then((response) => {
				setUser({
					...response,
					dateOfBirth: new Date(response.dateOfBirth),
				});
				setPreviewAvatar(response.avatar);
			})
			.catch((error) => console.log(error));

		// Lấy thông tin thẻ thư viện
		fetchLibraryCard(idUser);
	}, []);

	// Hàm lấy thông tin thẻ thư viện
	const fetchLibraryCard = (userId: number) => {
		setLoadingLibraryCard(true);
		const token = localStorage.getItem("token");

		fetch(`${endpointBE}/users/${userId}/libraryCard`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then(response => {
				if (response.ok) {
					return response.json();
				}
				return null;
			})
			.then(data => {
				if (data && data.cardNumber) {
					setLibraryCard(data);
				} else {
					setLibraryCard(null);
				}
				setLoadingLibraryCard(false);
			})
			.catch(error => {
				console.error("Error fetching library card:", error);
				setLibraryCard(null);
				setLoadingLibraryCard(false);
			});
	};

	const handleCreateLibraryCard = () => {
		const token = localStorage.getItem("token");
		console.log("Current token:", token ? "Token exists" : "No token");

		// Validate card number
		if (!newCardNumber) {
			setCardNumberError("Vui lòng nhập mã thẻ thư viện");
			return;
		}

		// Get user ID
		const userId = user.idUser;
		console.log("User ID for library card:", userId);

		if (!userId) {
			toast.error("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
			return;
		}

		const requestData = {
			idUser: userId,
			cardNumber: newCardNumber
		};
		console.log("Request data:", requestData);

		// Thử cả POST và PUT
		const method = "PUT"; // Thử POST trước (như trong backend code bạn chia sẻ)

		console.log(`Calling API with ${method} method to ${endpointBE}/library-card/create`);

		fetch(`${endpointBE}/library-card/create`, {
			method: method,
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		})
			.then(response => {
				console.log("Response status:", response.status);
				console.log("Response ok:", response.ok);

				// Đọc response body dù có lỗi hay không
				return response.text().then(text => {
					if (!response.ok) {
						console.error("Error response:", text);
						throw new Error(`Lỗi API: ${response.status} - ${text}`);
					}

					// Thử parse JSON nếu có thể
					try {
						return text ? JSON.parse(text) : {};
					} catch (e) {
						console.log("Raw response (not JSON):", text);
						return {};
					}
				});
			})
			.then(data => {
				console.log("Success response data:", data);
				setLibraryCard(data);
				setNewCardNumber("");
				handleCloseCreateCardModal();
				toast.success("Tạo thẻ thư viện thành công!");
			})
			.catch(error => {
				console.error("Complete error details:", error);
				toast.error(`Không thể tạo thẻ thư viện: ${error.message}`);
			});
	};

	// Hàm gia hạn thẻ thư viện
	const handleRenewLibraryCard = () => {
		const token = localStorage.getItem("token");
		console.log("Sending renewal request for card ID:", libraryCard?.idLibraryCard);

		toast.promise(
			fetch(`${endpointBE}/library-card/sendRequestRenewCard`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					idLibraryCard: libraryCard?.idLibraryCard
				}),
			})
				.then(response => {
					console.log("Response status:", response.status);
					if (response.ok) {
						return response.text().then(text => {
							try {
								// Try to parse as JSON if possible
								return text ? JSON.parse(text) : {};
							} catch (e) {
								// If not JSON, create a simple object with status property
								console.log("Response not JSON, using default");
								return { status: "Yêu cầu gia hạn thẻ thư viện" };
							}
						});
					}
					throw new Error("Không thể gửi yêu cầu gia hạn thẻ thư viện");
				})
				.then(data => {
					console.log("Processed data:", data);

					// Make sure we're not setting null values
					if (libraryCard) {
						// Create a new object with all existing properties plus updated status
						const updatedCard = {
							...libraryCard,
							status: data.status || "Yêu cầu gia hạn thẻ thư viện"
						};
						setLibraryCard(updatedCard);
					}

					return "Gửi yêu cầu gia hạn thẻ thư viện thành công";
				})
				.catch(error => {
					console.error("Error details:", error);
					throw error;
				}),
			{
				pending: "Đang gửi yêu cầu gia hạn thẻ thư viện...",
				success: "Gửi yêu cầu gia hạn thẻ thư viện thành công!",
				error: "Không thể gửi yêu cầu gia hạn thẻ thư viện. Vui lòng thử lại."
			}
		);
	};

	// Xử lý change só điện thoại
	const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUser({...user, phoneNumber: e.target.value});
		setErrorPhoneNumber("");
	};

	// Xử lý upload hình ảnh (preview)
	function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const inputElement = event.target as HTMLInputElement;

		if (inputElement.files && inputElement.files.length > 0) {
			const selectedFile = inputElement.files[0];

			const reader = new FileReader();

			// Xử lý sự kiện khi tệp đã được đọc thành công
			reader.onload = (e: any) => {
				// e.target.result chính là chuỗi base64
				const avatarBase64 = e.target?.result as string;

				setDataAvatar(avatarBase64);
				setPreviewAvatar(URL.createObjectURL(selectedFile));
				setIsUploadAvatar(true);
				props.setReloadAvatar(Math.random());
			};

			// Đọc tệp dưới dạng chuỗi base64
			reader.readAsDataURL(selectedFile);
		}
	}

	// Xử lý ngày sinh
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

	// Xử lý change password
	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewPassword(e.target.value);
		setErrorNewPassword("");
	};

	const handleRepeatPasswordChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setRepeatPassword(e.target.value);
		setErrorRepeatPassword("");
	};

	// Xử lý TABS
	const [value, setValue] = React.useState("1");
	const handleChange = (event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	// Xử lý khi form submit (thay đổi thông tin)
	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		const token = localStorage.getItem("token");
		toast.promise(
			fetch(endpointBE + `/user/update-profile`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					idUser: getIdUserByToken(),
					firstName: user.firstName,
					lastName: user.lastName,
					dateOfBirth: user.dateOfBirth,
					phoneNumber: user.phoneNumber,
					deliveryAddress: user.deliveryAddress,
					gender: user.gender,
				}),
			})
				.then((response) => {
					toast.success("Cập nhật thông tin thành công");
					setModifiedStatus(!modifiedStatus);
				})
				.catch((error) => {
					toast.error("Cập nhật thông tin thất bại");
					setModifiedStatus(!modifiedStatus);
					console.log(error);
				}),
			{pending: "Đang trong quá trình xử lý ..."}
		);
	}

	// Xử lý khi thay đổi avatar (thay đổi avatar)
	function handleSubmitAvatar() {
		const token = localStorage.getItem("token");
		toast.promise(
			fetch(endpointBE + "/user/change-avatar", {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					idUser: getIdUserByToken(),
					avatar: dataAvatar,
				}),
			})
				.then((response) => {
					if (response.ok) {
						return response.json();
					}
				})
				.then((data) => {
					const {jwtToken} = data;
					localStorage.setItem("token", jwtToken);

					toast.success("Cập nhật ảnh đại diện thành công");
					setPreviewAvatar(previewAvatar);
					setIsUploadAvatar(false);
					props.setReloadAvatar(Math.random());
				})
				.catch((error) => {
					toast.error("Cập nhật ảnh đại diện thất bại");
					setPreviewAvatar(user.avatar);
					setIsUploadAvatar(false);
					console.log(error);
				}),
			{pending: "Đang trong quá trình xử lý ..."}
		);
	}

	// Xử lý khi form sumbit (thay đổi mật khẩu)
	function handleSubmitChangePassword(
		event: FormEvent<HTMLFormElement>
	): void {
		event.preventDefault();

		if (errorNewPassword.length > 0 || errorRepeatPassword.length > 0) {
			toast.warning("Xem lại mật khẩu vừa nhập");
			return;
		}

		const token = localStorage.getItem("token");
		fetch(endpointBE + "/user/change-password", {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
				"content-type": "application/json",
			},
			body: JSON.stringify({
				idUser: getIdUserByToken(),
				newPassword: newPassword,
			}),
		})
			.then((response) => {
				setNewPassword("");
				setRepeatPassword("");
				toast.success("Đổi mật khẩu thành công");
			})
			.catch((error) => {
				console.log(error);
				toast.error("Thay đổi mật khẩu không thành công");
			});
	}

	// Format date string
	const formatDate = (dateString: string) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('vi-VN');
	};

	// Khúc này chủ yếu nếu mà không đăng nhập mà cố tình vào thì sẽ không render component ra
	if (!isLoggedIn) {
		return null;
	}

	return (
		<div className='container my-5'>
			<Grid container>
				{/* Phần sidebar trái - avatar và email */}
				<Grid item sm={12} md={12} lg={3}>
					<div className='bg-light rounded py-3 me-lg-2 me-md-0 me-sm-0'>
						<div className='d-flex align-items-center justify-content-center flex-column'>
							<Avatar
								style={{fontSize: "50px"}}
								alt={user.lastName.toUpperCase()}
								src={previewAvatar}
								sx={{width: 100, height: 100}}
							/>
							{!isUploadAvatar ? (
								<Button
									className='mt-3'
									size='small'
									component='label'
									variant='outlined'
									startIcon={<CloudUpload/>}
								>
									Upload avatar
									<HiddenInputUpload
										handleImageUpload={handleImageUpload}
									/>
								</Button>
							) : (
								<div>
									<Button
										className='mt-4 me-2'
										size='small'
										variant='outlined'
										startIcon={<CloseIcon/>}
										onClick={() => {
											setPreviewAvatar(user.avatar);
											setIsUploadAvatar(false);
										}}
										color='error'
									>
										Huỷ
									</Button>
									<Button
										className='mt-4 ms-2'
										size='small'
										variant='outlined'
										startIcon={<CheckIcon/>}
										color='success'
										onClick={handleSubmitAvatar}
									>
										Thay đổi
									</Button>
								</div>
							)}
						</div>
						<div className='text-center mt-3'>
							<p>Email: {user.email}</p>
						</div>
					</div>
				</Grid>

				{/* Phần nội dung chính - tabs */}
				<Grid item sm={12} md={12} lg={9}>
					<div
						className='bg-light rounded px-2 ms-lg-2 ms-md-0 ms-sm-0 mt-lg-0 mt-md-3 mt-sm-3'
						style={{minHeight: "300px"}}
					>
						<Box sx={{width: "100%", typography: "body1"}}>
							<TabContext value={value}>
								<Box sx={{borderBottom: 1, borderColor: "divider"}}>
									<TabList
										onChange={handleChange}
										aria-label='lab API tabs example'
									>
										<Tab label='Thông tin cá nhân' value='1'/>
										<Tab label='Đơn hàng' value='2'/>
										<Tab label='Thẻ thư viện' value='4'/>
										<Tab label='Đổi mật khẩu' value='3'/>
									</TabList>
								</Box>

								{/* Tab Thông tin cá nhân */}
								<TabPanel value='1'>
									<form
										onSubmit={handleSubmit}
										className='form position-relative'
										style={{padding: "0 20px"}}
									>
										{!modifiedStatus && (
											<div
												className='text-end my-3 position-absolute'
												style={{
													bottom: "0",
													right: "0",
												}}
											>
												<Tooltip
													title='Chỉnh sửa thông tin'
													placement='bottom-end'
												>
													<Button
														variant='contained'
														type='button'
														className='rounded-pill'
														onClick={() =>
															setModifiedStatus(!modifiedStatus)
														}
													>
														<EditOutlined
															sx={{width: "24px"}}
														/>
													</Button>
												</Tooltip>
											</div>
										)}
										<div className='row'>
											<div className='col-sm-12 col-md-6 col-lg-4'>
												<TextField
													required
													fullWidth
													label='ID'
													value={user.idUser}
													disabled={true}
													className='input-field'
													InputProps={{
														readOnly: true,
													}}
												/>
												<TextField
													required
													fullWidth
													label='Họ đệm'
													value={user.firstName}
													onChange={(e) =>
														setUser({
															...user,
															firstName: e.target.value,
														})
													}
													disabled={modifiedStatus ? false : true}
													className='input-field'
												/>
												<TextField
													fullWidth
													error={
														errorPhoneNumber.length > 0
															? true
															: false
													}
													helperText={errorPhoneNumber}
													required={true}
													label='Số điện thoại'
													placeholder='Nhập số điện thoại'
													value={user.phoneNumber}
													onChange={handlePhoneNumberChange}
													onBlur={(e) => {
														checkPhoneNumber(
															setErrorPhoneNumber,
															e.target.value
														);
													}}
													disabled={modifiedStatus ? false : true}
													className='input-field'
												/>
											</div>
											<div className='col-sm-12 col-md-6 col-lg-4'>
												<TextField
													required
													fullWidth
													label='Tên tài khoản'
													value={user.username}
													disabled={true}
													className='input-field'
												/>
												<TextField
													required
													fullWidth
													label='Tên'
													value={user.lastName}
													onChange={(e) =>
														setUser({
															...user,
															lastName: e.target.value,
														})
													}
													disabled={modifiedStatus ? false : true}
													className='input-field'
												/>
												<TextField
													required
													fullWidth
													label='Địa chỉ giao hàng'
													value={user.deliveryAddress}
													onChange={(e) =>
														setUser({
															...user,
															deliveryAddress: e.target.value,
														})
													}
													disabled={modifiedStatus ? false : true}
													className='input-field'
												/>
											</div>
											<div className='col-sm-12 col-md-6 col-lg-4'>
												<TextField
													required
													fullWidth
													label='Email'
													value={user.email}
													className='input-field'
													disabled={true}
													InputProps={{
														readOnly: true,
													}}
												/>
												<TextField
													required
													fullWidth
													className='input-field'
													label='Ngày sinh'
													style={{width: "100%"}}
													type='date'
													value={
														user.dateOfBirth
															.toISOString()
															.split("T")[0]
													}
													onChange={handleDateChange}
													disabled={modifiedStatus ? false : true}
												/>
												<FormControl>
													<FormLabel id='demo-row-radio-buttons-group-label'>
														Giới tính
													</FormLabel>
													<RadioGroup
														row
														aria-labelledby='demo-row-radio-buttons-group-label'
														name='row-radio-buttons-group'
														value={user.gender}
														onChange={(e) =>
															setUser({
																...user,
																gender: e.target.value,
															})
														}
													>
														<FormControlLabel
															disabled={
																modifiedStatus ? false : true
															}
															value='M'
															control={<Radio/>}
															label='Nam'
														/>
														<FormControlLabel
															disabled={
																modifiedStatus ? false : true
															}
															value='F'
															control={<Radio/>}
															label='Nữ'
														/>
													</RadioGroup>
												</FormControl>
											</div>
										</div>
										{modifiedStatus && (
											<div className='text-center my-3'>
												<Button
													fullWidth
													variant='outlined'
													type='submit'
													sx={{width: "50%", padding: "10px"}}
												>
													Lưu và thay đổi
												</Button>
											</div>
										)}
									</form>
								</TabPanel>

								{/* Tab Đơn hàng */}
								<TabPanel value='2'>
									<div>
										<OrderTable
											handleOpenModal={handleOpenModal}
											keyCountReload={keyCountReload}
											setKeyCountReload={setKeyCountReload}
											setId={setId}
										/>
									</div>
									<FadeModal
										open={openModal}
										handleOpen={handleOpenModal}
										handleClose={handleCloseModal}
									>
										<OrderForm
											id={id}
											setKeyCountReload={setKeyCountReload}
											handleCloseModal={handleCloseModal}
											option='view-customer'
										/>
									</FadeModal>
								</TabPanel>

								{/* Tab Thẻ thư viện */}
								<TabPanel value='4'>
									{loadingLibraryCard ? (
										<div className="text-center p-5">
											<div className="spinner-border text-primary" role="status">
												<span className="visually-hidden">Đang tải...</span>
											</div>
											<p className="mt-2">Đang tải thông tin thẻ thư viện...</p>
										</div>
									) : (
										<>
											{!libraryCard ? (
												<div className="text-center p-5">
													<Card className="mb-4">
														<CardContent>
															<div className="d-flex flex-column align-items-center">
																<CreditCardIcon style={{
																	fontSize: 60,
																	color: '#1976d2',
																	marginBottom: '1rem'
																}}/>
																<Typography variant="h5" component="div" gutterBottom>
																	Bạn chưa có thẻ thư viện
																</Typography>
																<Typography variant="body1" color="text.secondary"
																			paragraph>
																	Bạn cần có thẻ thư viện để có thể mượn sách. Nhấn
																	nút bên dưới để tạo thẻ thư viện mới.
																</Typography>
																<Button
																	variant="contained"
																	color="primary"
																	startIcon={<LibraryAddIcon/>}
																	onClick={handleOpenCreateCardModal}
																>
																	Tạo thẻ thư viện
																</Button>
															</div>
														</CardContent>
													</Card>
												</div>
											) : (
												<div>
													<Card className="mb-4">
														<CardContent>
															<Typography variant="h5" component="div"
																		className="mb-3 d-flex align-items-center">
																<CreditCardIcon
																	style={{marginRight: '10px', color: '#1976d2'}}/>
																Thông tin thẻ thư viện
															</Typography>
															<Grid container spacing={2}>
																<Grid item xs={12} md={6}>
																	<Typography variant="body1" className="mb-2">
																		<strong>Mã
																			thẻ:</strong> {libraryCard.cardNumber}
																	</Typography>
																	<Typography variant="body1" className="mb-2">
																		<strong>Ngày
																			cấp:</strong> {formatDate(libraryCard.issuedDate)}
																	</Typography>
																	<Typography variant="body1" className="mb-2">
																		<strong>Yêu cầu gia hạn thẻ:</strong> {" "}
																		<span>
																		{libraryCard.status==="Yêu cầu gia hạn thẻ thư viện"?"Thành công":"Không có"}
																	</span>
																	</Typography>
																</Grid>
																<Grid item xs={12} md={6}>
																	<Typography variant="body1" className="mb-2">
																		<strong>Ngày hết
																			hạn:</strong> {formatDate(libraryCard.expiryDate)}
																	</Typography>
																	<Typography variant="body1" className="mb-2">
																		<strong>Trạng thái:</strong> {" "}
																		<span
																			className={`badge ${libraryCard.activated === true ? 'bg-success' : 'bg-danger'}`}>
																		{libraryCard.activated === true ? 'Hoạt động' : 'Không hoạt động'}
																	</span>
																	</Typography>
																</Grid>
															</Grid>
															{libraryCard.activated !== true && (
																<Alert severity="warning" className="mt-3">
																	Thẻ của bạn hiện đang không hoạt động. Vui lòng liên
																	hệ thủ thư để được hỗ trợ.
																</Alert>
															)}

															{/* Nút gia hạn thẻ */}
															<div className="mt-3 d-flex justify-content-end">
																<Button
																	variant="contained"
																	color="primary"
																	startIcon={<HourglassEmptyIcon/>}
																	onClick={handleOpenRenewCardModal}
																	disabled={libraryCard.activated !== true}
																>
																	Gửi yêu cầu gia hạn thẻ
																</Button>
															</div>
														</CardContent>
													</Card>
												</div>
											)}
										</>
									)}

									{/* Modal xác nhận tạo thẻ thư viện */}
									<FadeModal
										open={openCreateCardModal}
										handleOpen={handleOpenCreateCardModal}
										handleClose={handleCloseCreateCardModal}
									>
										<div className="p-4">
											<Typography variant="h5" component="div" className="text-center mb-4">
												<LibraryAddIcon style={{fontSize: 40, color: '#1976d2', marginRight: '10px'}}/>
												Tạo thẻ thư viện
											</Typography>

											<TextField
												fullWidth
												label="Mã căn cước công dân"
												variant="outlined"
												value={newCardNumber}
												onChange={(e) => {
													const value = e.target.value;
													// Only allow numbers
													if (/^\d*$/.test(value)) {
														setNewCardNumber(value);
														setCardNumberError("");
													}
												}}
												onBlur={() => {
													// Validate card number on blur
													if (!newCardNumber) {
														setCardNumberError("Vui lòng nhập mã căn cước công dân");
													} else if (newCardNumber.length < 10) {
														setCardNumberError("Vui lòng nhập mã căn cước công dân hợp lệ");
													} else {
														setCardNumberError("");
													}
												}}
												error={!!cardNumberError}
												helperText={cardNumberError || "Nhập mã căn cước công dân"}
												className="mb-4"
											/>

											<Typography variant="body2" color="text.secondary" paragraph>
												Thẻ thư viện sẽ có hiệu lực trong 1 năm kể từ ngày tạo.
											</Typography>

											<div className="d-flex justify-content-center mt-4">
												<Button
													variant="outlined"
													color="error"
													onClick={() => {
														setNewCardNumber("");
														setCardNumberError("");
														handleCloseCreateCardModal();
													}}
													className="me-3"
												>
													Hủy
												</Button>
												<Button
													variant="contained"
													color="primary"
													onClick={handleCreateLibraryCard}
													disabled={!newCardNumber || !!cardNumberError}
												>
													Xác nhận
												</Button>
											</div>
										</div>
									</FadeModal>

									{/* Modal xác nhận gia hạn thẻ thư viện */}
									<FadeModal
										open={openRenewCardModal}
										handleOpen={handleOpenRenewCardModal}
										handleClose={handleCloseRenewCardModal}
									>
										<div className="p-4 text-center">
											<HourglassEmptyIcon
												style={{fontSize: 60, color: '#1976d2', marginBottom: '1rem'}}/>
											<Typography variant="h5" component="div" gutterBottom>
												Xác nhận gửi yêu cầu gia hạn thẻ thư viện
											</Typography>
											<Typography variant="body1" paragraph>
												Bạn có chắc chắn muốn gửi yêu cầu gia hạn thẻ thư viện không?
											</Typography>
											<div className="d-flex justify-content-center mt-4">
												<Button
													variant="outlined"
													color="error"
													onClick={handleCloseRenewCardModal}
													className="me-3"
												>
													Hủy
												</Button>
												<Button
													variant="contained"
													color="primary"
													onClick={() => {
														handleRenewLibraryCard();
														handleCloseRenewCardModal();
													}}
												>
													Xác nhận
												</Button>
											</div>
										</div>
									</FadeModal>
								</TabPanel>

								{/* Tab Đổi mật khẩu */}
								<TabPanel value='3'>
									<form
										onSubmit={handleSubmitChangePassword}
										className='form position-relative'
										style={{padding: "0 120px"}}
									>
										<TextField
											error={
												errorNewPassword.length > 0 ? true : false
											}
											helperText={errorNewPassword}
											required={true}
											fullWidth
											type='password'
											label='Mật khẩu mới'
											placeholder='Nhập mật khẩu mới'
											value={newPassword}
											onChange={handlePasswordChange}
											onBlur={(e) => {
												checkPassword(
													setErrorNewPassword,
													e.target.value
												);
											}}
											className='input-field'
										/>

										<TextField
											error={
												errorRepeatPassword.length > 0
													? true
													: false
											}
											helperText={errorRepeatPassword}
											required={true}
											fullWidth
											type='password'
											label='Xác nhận mật khẩu mới'
											placeholder='Nhập lại mật khẩu mới'
											value={repeatPassword}
											onChange={handleRepeatPasswordChange}
											onBlur={(e) => {
												checkRepeatPassword(
													setErrorRepeatPassword,
													e.target.value,
													newPassword
												);
											}}
											className='input-field'
										/>
										<div className='text-center my-3'>
											<Button
												fullWidth
												variant='outlined'
												type='submit'
												sx={{width: "50%", padding: "10px"}}
											>
												Lưu và thay đổi
											</Button>
										</div>
									</form>
								</TabPanel>
							</TabContext>
						</Box>
					</div>
				</Grid>
			</Grid>
		</div>
	)
}

export default ProfilePage;