import React, { FormEvent, useEffect, useState } from "react";
import BookModel from "../../../model/BookModel";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { Box, Button, Card, CardMedia, Grid, Chip, Divider } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { toast } from "react-toastify";
import GenreModel from "../../../model/GenreModel";
import DdcCategoryModel from "../../../model/DdcCategoryModel";
import { getAllGenres } from "../../../api/GenreApi";
import { getAllDdcCategories } from "../../../api/DdcCategoryApi";
import { SelectMultiple } from "../../../layouts/utils/SelectMultiple";
import { LoadingButton } from "@mui/lab";
import { getBookByIdAllInformation } from "../../../api/BookApi";
import { endpointBE } from "../../../layouts/utils/Constant";

interface BookFormProps {
	id: number;
	option: string;
	setKeyCountReload?: any;
	handleCloseModal: any;
}

export const BookForm: React.FC<BookFormProps> = (props) => {
	const [book, setBook] = useState<BookModel>({
		idBook: 0,
		nameBook: "",
		author: "",
		isbn: "",
		description: "",
		listPrice: NaN,
		sellPrice: NaN,
		quantityForSold: NaN,
		quantityForBorrow: NaN,
		borrowQuantity: NaN,
		avgRating: NaN,
		soldQuantity: NaN,
		discountPercent: 0,
		thumbnail: "",
		relatedImg: [],
		idGenres: [],
		idDdcCategory: [],
	});
	const [genresList, setGenresList] = useState<GenreModel[]>([]);
	const [ddcCategoriesList, setDdcCategoriesList] = useState<DdcCategoryModel[]>([]);
	const [genresListSelected, setGenresListSelected] = useState<number[]>([]);
	const [ddcCategoriesSelected, setDdcCategoriesSelected] = useState<number[]>([]);
	const [previewThumbnail, setPreviewThumbnail] = useState("");
	const [previewRelatedImages, setPreviewRelatedImages] = useState<string[]>([]);

	// Giá trị khi đã chọn ở trong select multiple
	const [selectedGenresName, setSelectedGenresName] = useState<any[]>([]);
	const [selectedDdcCategoriesName, setSelectedDdcCategoriesName] = useState<any[]>([]);

	// Khi submit thì btn loading ...
	const [statusBtn, setStatusBtn] = useState(false);
	// Biến reload (cho selectMultiple)
	const [reloadCount, setReloadCount] = useState(0);

	// Lấy dữ liệu khi update hoặc view
	useEffect(() => {
		if (props.option === "update" || props.option === "view") {
			getBookByIdAllInformation(props.id).then((response) => {
				setBook(response as BookModel);
				setPreviewThumbnail(response?.thumbnail as string);
				setPreviewRelatedImages(response?.relatedImg as string[]);

				// Reset arrays trước khi set
				setSelectedGenresName([]);
				setSelectedDdcCategoriesName([]);

				// Set genres
				const genreNames: any[] = [];
				const genreIds: number[] = [];
				response?.genresList?.forEach((data) => {
					genreNames.push(data.nameGenre);
					genreIds.push(data.idGenre);
				});
				setSelectedGenresName(genreNames);
				setBook((prevBook) => ({
					...prevBook,
					idGenres: genreIds,
				}));

				// Set DDC categories
				const ddcNames: any[] = [];
				const ddcIds: number[] = [];
				response?.ddcCategoryList?.forEach((data) => {
					ddcNames.push(data.nameCategory);
					ddcIds.push(data.idDdcCategory);
				});
				setSelectedDdcCategoriesName(ddcNames);
				setBook((prevBook) => ({
					...prevBook,
					idDdcCategory: ddcIds,
				}));
			});
		}
	}, [props.option, props.id]);

	// Lấy ra tất cả thể loại và DDC categories
	useEffect(() => {
		getAllGenres().then((response) => {
			setGenresList(response.genreList);
		});

		getAllDdcCategories().then((response) => {
			// Format DDC categories với mã - tên
			const formattedDdcCategories = response.ddcCategoryList.map(category => ({
				...category,
				nameCategory: `${category.idDdcCategory.toString().padStart(3, '0')} - ${category.nameCategory}`
			}));
			setDdcCategoriesList(formattedDdcCategories);
		});
	}, [props.option]);

	// Lưu danh sách thể loại và DDC categories của sách
	useEffect(() => {
		if (props.option !== "view") {
			setBook({ ...book, idGenres: genresListSelected });
		}
	}, [genresListSelected]);

	useEffect(() => {
		if (props.option !== "view") {
			setBook({ ...book, idDdcCategory: ddcCategoriesSelected });
		}
	}, [ddcCategoriesSelected]);

	async function hanleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const token = localStorage.getItem("token");

		let bookRequest: BookModel = book;
		if (bookRequest.discountPercent === 0) {
			bookRequest = { ...book, sellPrice: book.listPrice };
		}

		setStatusBtn(true);

		const endpoint =
			props.option === "add"
				? endpointBE + "/book/add-book"
				: endpointBE + "/book/update-book";
		const method = props.option === "add" ? "POST" : "PUT";

		toast.promise(
			fetch(endpoint, {
				method: method,
				headers: {
					Authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify(bookRequest),
			})
				.then((response) => {
					if (response.ok) {
						setBook({
							idBook: 0,
							nameBook: "",
							author: "",
							isbn: "",
							description: "",
							listPrice: NaN,
							sellPrice: NaN,
							quantityForBorrow: NaN,
							quantityForSold: NaN,
							avgRating: NaN,
							soldQuantity: NaN,
							discountPercent: 0,
							thumbnail: "",
							relatedImg: [],
							idGenres: [],
							idDdcCategory: [],
						});
						setPreviewThumbnail("");
						setPreviewRelatedImages([]);
						setReloadCount(Math.random());
						setStatusBtn(false);
						props.setKeyCountReload(Math.random());
						props.handleCloseModal();
						props.option === "add"
							? toast.success("Thêm sách thành công")
							: toast.success("Cập nhật sách thành công");
					} else {
						toast.error("Gặp lỗi trong quá trình xử lý sách");
						setStatusBtn(false);
					}
				})
				.catch((error) => {
					console.log(error);
					setStatusBtn(false);
					toast.error("Gặp lỗi trong quá trình xử lý sách");
				}),
			{
				pending: "Đang trong quá trình xử lý ...",
			}
		);
	}

	function handleThumnailImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const inputElement = event.target as HTMLInputElement;

		if (inputElement.files && inputElement.files.length > 0) {
			const selectedFile = inputElement.files[0];
			const reader = new FileReader();

			reader.onload = (e: any) => {
				const thumnailBase64 = e.target?.result as string;
				setBook({ ...book, thumbnail: thumnailBase64 });
				setPreviewThumbnail(URL.createObjectURL(selectedFile));
			};

			reader.readAsDataURL(selectedFile);
		}
	}

	function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const inputElement = event.target as HTMLInputElement;

		if (inputElement.files && inputElement.files.length > 0) {
			const newPreviewImages = [...previewRelatedImages];

			if (newPreviewImages.length + inputElement.files.length > 5) {
				toast.warning("Chỉ được tải lên tối đa 5 ảnh");
				return;
			}

			for (let i = 0; i < inputElement.files.length; i++) {
				const selectedFile = inputElement.files[i];
				const reader = new FileReader();

				reader.onload = (e: any) => {
					const thumbnailBase64 = e.target?.result as string;

					setBook((prevBook) => ({
						...prevBook,
						relatedImg: [...(prevBook.relatedImg || []), thumbnailBase64],
					}));

					newPreviewImages.push(URL.createObjectURL(selectedFile));
					setPreviewRelatedImages(newPreviewImages);
				};

				reader.readAsDataURL(selectedFile);
			}
		}
	}

	// Render chi tiết sách khi option = "view"
	if (props.option === "view") {
		return (
			<div>
				<Typography className='text-center' variant='h4' component='h2'>
					CHI TIẾT SÁCH
				</Typography>
				<hr />
				<div className='container px-5'>
					<Grid container spacing={3}>
						{/* Phần ảnh thumbnail */}
						<Grid item xs={12} md={4}>
							<Card>
								<CardMedia
									component="img"
									height="400"
									image={previewThumbnail || "/placeholder-book.jpg"}
									alt={book.nameBook}
									sx={{ objectFit: "contain" }}
								/>
							</Card>
						</Grid>

						{/* Phần thông tin chính */}
						<Grid item xs={12} md={8}>
							<Box sx={{ p: 2 }}>
								<Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
									{book.nameBook}
								</Typography>

								<Typography variant="h6" color="text.secondary" gutterBottom>
									Tác giả: {book.author}
								</Typography>

								<Divider sx={{ my: 2 }} />

								<Grid container spacing={2}>
									<Grid item xs={6}>
										<Typography variant="body1"><strong>ISBN:</strong> {book.isbn}</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1"><strong>ID Sách:</strong> {book.idBook}</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1">
											<strong>Giá niêm yết:</strong> {book.listPrice?.toLocaleString("vi-VN")}₫
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1">
											<strong>Giá bán:</strong> {book.sellPrice?.toLocaleString("vi-VN")}₫
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1">
											<strong>Giảm giá:</strong> {book.discountPercent}%
										</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1">
											<strong>Điểm đánh giá:</strong> {book.avgRating ? `${book.avgRating}/5` : "Chưa có đánh giá"}
										</Typography>
									</Grid>
								</Grid>

								<Divider sx={{ my: 2 }} />

								{/* Số lượng */}
								<Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
									Thông tin số lượng
								</Typography>
								<Grid container spacing={2}>
									<Grid item xs={6}>
										<Typography variant="body1"><strong>Số lượng để bán:</strong> {book.quantityForSold}</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1"><strong>Đã bán:</strong> {book.soldQuantity}</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1"><strong>Số lượng để mượn:</strong> {book.quantityForBorrow}</Typography>
									</Grid>
									<Grid item xs={6}>
										<Typography variant="body1"><strong>Đã mượn:</strong> {book.borrowQuantity}</Typography>
									</Grid>
								</Grid>

								<Divider sx={{ my: 2 }} />

								{/* Thể loại */}
								<Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
									Thể loại
								</Typography>
								<Box sx={{ mb: 2 }}>
									{selectedGenresName.map((genre, index) => (
										<Chip
											key={index}
											label={genre}
											variant="outlined"
											color="primary"
											sx={{ mr: 1, mb: 1 }}
										/>
									))}
								</Box>
								{/* DDC Categories */}
								<Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
									Mã DDC
								</Typography>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body1" sx={{
										backgroundColor: '#f5f5f5',
										padding: '8px 12px',
										borderRadius: '4px',
										fontFamily: 'monospace',
										fontSize: '14px'
									}}>
										{book.ddcCategoryList?.map(category => {
											const code = category.idDdcCategory.toString();
											return code.padStart(3, '0');
										}).join(' - ') || 'Chưa phân loại'}
									</Typography>
								</Box>
							</Box>
						</Grid>

						{/* Mô tả sách */}
						<Grid item xs={12}>
							<Divider sx={{ my: 2 }} />
							<Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
								Mô tả sách
							</Typography>
							<Typography variant="body1" sx={{ textAlign: 'justify', lineHeight: 1.6 }}>
								{book.description || "Chưa có mô tả"}
							</Typography>
						</Grid>

						{/* Ảnh liên quan */}
						{previewRelatedImages.length > 0 && (
							<Grid item xs={12}>
								<Divider sx={{ my: 2 }} />
								<Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
									Ảnh liên quan
								</Typography>
								<Grid container spacing={2}>
									{previewRelatedImages.map((imgURL, index) => (
										<Grid item xs={6} sm={4} md={3} key={index}>
											<Card>
												<CardMedia
													component="img"
													height="200"
													image={imgURL}
													alt={`Related image ${index + 1}`}
													sx={{ objectFit: "cover" }}
												/>
											</Card>
										</Grid>
									))}
								</Grid>
							</Grid>
						)}
					</Grid>

					{/* Nút đóng */}
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
						<Button
							variant="contained"
							onClick={props.handleCloseModal}
							sx={{ minWidth: 120 }}
						>
							Đóng
						</Button>
					</Box>
				</div>
			</div>
		);
	}

	// Render form thêm/sửa khi option = "add" hoặc "update"
	return (
		<div>
			<Typography className='text-center' variant='h4' component='h2'>
				{props.option === "add" ? "TẠO SÁCH" : "SỬA SÁCH"}
			</Typography>
			<hr />
			<div className='container px-5'>
				<form onSubmit={hanleSubmit} className='form'>
					<input type='hidden' id='idBook' value={book?.idBook} hidden />
					<div className='row'>
						<div className={props.option === "update" ? "col-4" : "col-6"}>
							<Box sx={{ "& .MuiTextField-root": { mb: 3 } }}>
								<TextField
									required
									id='filled-required'
									label='Tên sách'
									style={{ width: "100%" }}
									value={book.nameBook}
									onChange={(e: any) =>
										setBook({ ...book, nameBook: e.target.value })
									}
									size='small'
								/>

								<TextField
									required
									id='filled-required'
									label='Tên tác giả'
									style={{ width: "100%" }}
									value={book.author}
									onChange={(e: any) =>
										setBook({ ...book, author: e.target.value })
									}
									size='small'
								/>

								<TextField
									required
									id='filled-required'
									label='ISBN'
									style={{ width: "100%" }}
									value={book.isbn}
									onChange={(e: any) =>
										setBook({ ...book, isbn: e.target.value })
									}
									size='small'
									disabled={props.option === "update"}
								/>

								<TextField
									required
									id='filled-required'
									label='Giá niêm yết'
									style={{ width: "100%" }}
									type='number'
									value={Number.isNaN(book.listPrice) ? "" : book.listPrice}
									onChange={(e: any) =>
										setBook({
											...book,
											listPrice: parseInt(e.target.value),
										})
									}
									size='small'
								/>
							</Box>
						</div>

						<div className={props.option === "update" ? "col-4" : "col-6"}>
							<Box sx={{ "& .MuiTextField-root": { mb: 3 } }}>
								<TextField
									required
									id='filled-required'
									label='Số lượng để bán'
									style={{ width: "100%" }}
									type='number'
									value={Number.isNaN(book.quantityForSold) ? "" : book.quantityForSold}
									onChange={(e: any) =>
										setBook({
											...book,
											quantityForSold: parseInt(e.target.value),
										})
									}
									size='small'
								/>

								<TextField
									required
									id='filled-required'
									label='Số lượng để mượn'
									style={{ width: "100%" }}
									type='number'
									value={Number.isNaN(book.quantityForBorrow) ? "" : book.quantityForBorrow}
									onChange={(e: any) =>
										setBook({
											...book,
											quantityForBorrow: parseInt(e.target.value),
										})
									}
									size='small'
								/>

								<SelectMultiple
									selectedList={genresListSelected}
									setSelectedList={setGenresListSelected}
									selectedListName={selectedGenresName}
									setSelectedListName={setSelectedGenresName}
									values={genresList}
									setValue={setBook}
									key={`genres-${reloadCount}`}
									required={true}
									label="Thể loại"
								/>

								<TextField
									id='filled-required'
									label='Giảm giá (%)'
									style={{ width: "100%" }}
									type='number'
									value={Number.isNaN(book.discountPercent) ? "" : book.discountPercent}
									onChange={(e: any) => {
										setBook({
											...book,
											discountPercent: parseInt(e.target.value),
											sellPrice:
												book.listPrice -
												Math.round(
													(book.listPrice * Number.parseInt(e.target.value)) / 100
												),
										});
									}}
									size='small'
								/>
							</Box>
						</div>

						{props.option === "update" && (
							<div className='col-4'>
								<Box sx={{ "& .MuiTextField-root": { mb: 3 } }}>
									<TextField
										id='filled-required'
										label='Giá bán'
										style={{ width: "100%" }}
										value={book.sellPrice.toLocaleString("vi-vn")}
										type='number'
										InputProps={{ disabled: true }}
										size='small'
									/>

									<TextField
										id='filled-required'
										label='Đã bán'
										style={{ width: "100%" }}
										value={book.soldQuantity}
										InputProps={{ disabled: true }}
										size='small'
									/>

									<TextField
										id='filled-required'
										label='Điểm đánh giá'
										style={{ width: "100%" }}
										value={book.avgRating}
										InputProps={{ disabled: true }}
										size='small'
									/>

									<TextField
										id='filled-required'
										label='Số lượng đã mượn'
										style={{ width: "100%" }}
										value={book.borrowQuantity}
										InputProps={{ disabled: true }}
										size='small'
									/>
								</Box>
							</div>
						)}

						<div className='col-12'>
							<SelectMultiple
								selectedList={ddcCategoriesSelected}
								setSelectedList={setDdcCategoriesSelected}
								selectedListName={selectedDdcCategoriesName}
								setSelectedListName={setSelectedDdcCategoriesName}
								values={ddcCategoriesList}
								setValue={setBook}
								key={`ddc-${reloadCount}`}
								required={true}
								label="Mã phân loại DDC"
							/>
						</div>

						<div className='col-12'>
							<Box>
								<TextField
									id='outlined-multiline-flexible'
									label='Mô tả sách'
									style={{ width: "100%" }}
									multiline
									maxRows={5}
									value={book.description}
									onChange={(e: any) =>
										setBook({ ...book, description: e.target.value })
									}
									required
								/>
							</Box>
						</div>

						<div className='d-flex align-items-center mt-3'>
							<Button
								size='small'
								component='label'
								variant='outlined'
								startIcon={<CloudUpload />}
							>
								Tải ảnh thumbnail
								<input
									style={{ opacity: "0", width: "10px" }}
									required={props.option === "update" ? false : true}
									type='file'
									accept='image/*'
									onChange={handleThumnailImageUpload}
									alt=''
								/>
							</Button>
							<img src={previewThumbnail} alt='' width={100} />
						</div>

						<div className='d-flex align-items-center mt-3'>
							<Button
								size='small'
								component='label'
								variant='outlined'
								startIcon={<CloudUpload />}
							>
								Tải ảnh liên quan
								<input
									style={{ opacity: "0", width: "10px" }}
									type='file'
									accept='image/*'
									onChange={handleImageUpload}
									multiple
									alt=''
								/>
							</Button>
							{previewRelatedImages.map((imgURL, index) => (
								<img key={index} src={imgURL} alt='' width={100} />
							))}
							{previewRelatedImages.length > 0 && (
								<Button
									onClick={() => {
										setPreviewRelatedImages([]);
										setBook({ ...book, relatedImg: [] });
									}}
								>
									Xoá tất cả
								</Button>
							)}
						</div>
					</div>

					<LoadingButton
						className='w-100 my-3'
						type='submit'
						loading={statusBtn}
						variant='outlined'
						sx={{ width: "25%", padding: "10px" }}
					>
						{props.option === "add" ? "Tạo sách" : "Lưu sách"}
					</LoadingButton>
				</form>
			</div>
		</div>
	);
};