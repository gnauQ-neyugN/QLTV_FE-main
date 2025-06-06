import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookById } from "../../api/BookApi";
import BookModel from "../../model/BookModel";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import SelectQuantity from "./components/select-quantity/SelectQuantity";
import Button from "@mui/material/Button";
import { ShoppingCartOutlined } from "@mui/icons-material";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import Comment from "./components/comment/Comment";
import TextEllipsis from "./components/text-ellipsis/TextEllipsis";
import { getGenreByIdBook } from "../../api/GenreApi";
import GenreModel from "../../model/GenreModel";
import { getAllImageByBook } from "../../api/ImageApi";
import ImageModel from "../../model/ImageModel";
import RatingStar from "./components/rating/Rating";
import React from "react";
import ReactSimpleImageViewer from "react-simple-image-viewer";
import { toast } from "react-toastify";
import { endpointBE } from "../utils/Constant";
import { getIdUserByToken, isToken } from "../utils/JwtService";
import { useCartItem } from "../utils/CartItemContext";
import { useBorrowCart } from "../utils/BorrowCartContext";
import { Skeleton } from "@mui/material";
import CartItemModel from "../../model/CartItemModel";
import { CheckoutPage } from "../pages/CheckoutPage";
import useScrollToTop from "../../hooks/ScrollToTop";
import { useNavigate } from "react-router-dom";

interface BookDetailProps {}

const BookDetail: React.FC<BookDetailProps> = (props) => {
	useScrollToTop(); // Mỗi lần vào component này thì sẽ ở trên cùng
	const { setTotalCart, cartList } = useCartItem();
	const { borrowCartList, setBorrowCartList, setTotalBorrowItems } = useBorrowCart();
	const navigate = useNavigate();

	// Lấy mã sách từ url
	const { idBook } = useParams();
	let idBookNumber: number = 0;

	// Ép kiểu về number
	try {
		idBookNumber = parseInt(idBook + "");
		if (Number.isNaN(idBookNumber)) {
			idBookNumber = 0;
		}
	} catch (error) {
		console.error("Error: " + error);
	}

	// Khai báo biến
	const [book, setBook] = useState<BookModel | null>(null);
	const [loading, setLoading] = useState(true);
	const [erroring, setErroring] = useState(null);
	// Lấy sách ra
	useEffect(() => {
		getBookById(idBookNumber)
			.then((response) => {
				setBook(response);
				setLoading(false);
			})
			.catch((error) => {
				setLoading(false);
				setErroring(error.message);
			});
	}, []);

	// Lấy ra thể loại của sách
	const [genres, setGenres] = useState<GenreModel[] | null>(null);
	useEffect(() => {
		getGenreByIdBook(idBookNumber).then((response) => {
			setGenres(response.genreList);
		});
	}, []);

	// Lấy ra hình ảnh của sách
	const [images, setImages] = useState<ImageModel[] | null>(null);
	useEffect(() => {
		getAllImageByBook(idBookNumber)
			.then((response) => {
				setImages(response);
			})
			.catch((error) => {
				console.error(error);
			});
	}, []);

	const [quantity, setQuantity] = useState(1);

	// Xử lý tăng số lượng (mua)
	const add = () => {
		if (quantity < (book?.quantityForSold ? book?.quantityForSold : 1)) {
			setQuantity(quantity + 1);
		}
	};

	// Xử lý giảm số lượng (mua)
	const reduce = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1);
		}
	};

	// Xử lý thêm sản phẩm vào giỏ hàng
	const handleAddProduct = async (newBook: BookModel) => {
		// cái isExistBook này sẽ tham chiếu đến cái cart ở trên, nên khi update thì cart nó cũng update theo
		let isExistBook = cartList.find(
			(cartItem) => cartItem.book.idBook === newBook.idBook
		);
		// Thêm 1 sản phẩm vào giỏ hàng
		if (isExistBook) {
			// nếu có rồi thì sẽ tăng số lượng
			isExistBook.quantity += quantity;

			// Lưu vào db
			if (isToken()) {
				const request = {
					idCart: isExistBook.idCart,
					quantity: isExistBook.quantity,
				};
				const token = localStorage.getItem("token");
				fetch(endpointBE + `/cart-item/update-item`, {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"content-type": "application/json",
					},
					body: JSON.stringify(request),
				}).catch((err) => console.log(err));
			}
		} else {
			// Lưu vào db
			if (isToken()) {
				try {
					const request = [
						{
							quantity: quantity,
							book: newBook,
							idUser: getIdUserByToken(),
						},
					];
					const token = localStorage.getItem("token");
					const response = await fetch(
						endpointBE + "/cart-item/add-item",
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${token}`,
								"content-type": "application/json",
							},
							body: JSON.stringify(request),
						}
					);

					if (response.ok) {
						const idCart = await response.json();
						cartList.push({
							idCart: idCart,
							quantity: quantity,
							book: newBook,
						});
					}
				} catch (error) {
					console.log(error);
				}
			} else {
				cartList.push({
					quantity: quantity,
					book: newBook,
				});
			}
		}
		// Lưu vào localStorage
		localStorage.setItem("cart", JSON.stringify(cartList));
		// Thông báo toast
		toast.success("Thêm vào giỏ hàng thành công");
		setTotalCart(cartList.length);
	};

	// Xử lý thêm sách vào phiếu mượn
	const handleAddToBorrowCart = (newBook: BookModel) => {
		if (!isToken()) {
			toast.info("Bạn phải đăng nhập để sử dụng chức năng này");
			navigate("/login");
			return;
		}

		try {
			// Check if book is already in borrow cart
			let isExistBook = borrowCartList.find(
				(cartItem) => cartItem.book.idBook === newBook.idBook
			);

			// If book already exists in borrow cart, increase quantity
			if (isExistBook) {
				isExistBook.quantity += 1;
			} else {
				// Add new book to borrow cart
				borrowCartList.push({
					quantity: 1,
					book: newBook
				});
			}

			// Update local storage
			localStorage.setItem("borrowCart", JSON.stringify(borrowCartList));
			setTotalBorrowItems(borrowCartList.length);
			setBorrowCartList([...borrowCartList]);

			toast.success(`Đã thêm "${newBook.nameBook}" vào phiếu mượn`);

		} catch (error) {
			console.error("Lỗi khi thêm vào phiếu mượn:", error);
			toast.error(`Lỗi khi thêm "${newBook.nameBook}" vào phiếu mượn`);
		}
	};

	// Viewer hình ảnh
	const [currentImage, setCurrentImage] = useState(0);
	const [isViewerOpen, setIsViewerOpen] = useState(false);

	let imageList: string[] = [];
	if (images !== undefined && images !== null) {
		imageList = images.map((image) => {
			return image.urlImage || image.dataImage;
		}) as string[];
	}

	const openImageViewer = useCallback((index: number) => {
		setCurrentImage(index);
		setIsViewerOpen(true);
	}, []);

	const closeImageViewer = () => {
		setCurrentImage(0);
		setIsViewerOpen(false);
	};

	const [isCheckout, setIsCheckout] = useState(false);
	const [cartItem, setCartItem] = useState<CartItemModel[]>([]);
	const [totalPriceProduct, setTotalPriceProduct] = useState(0);
	function handleBuyNow(newBook: BookModel) {
		setCartItem([{ quantity, book: newBook }]);
		setIsCheckout(!isCheckout);
		setTotalPriceProduct(newBook.sellPrice * quantity);
	}

	if (loading) {
		return (
			<div className='container-book container mb-5 py-5 px-5 bg-light'>
				<div className='row'>
					<div className='col-4'>
						<Skeleton
							className='my-3'
							variant='rectangular'
							height={400}
						/>
					</div>
					<div className='col-8 px-5'>
						<Skeleton
							className='my-3'
							variant='rectangular'
							height={100}
						/>
						<Skeleton className='my-3' variant='rectangular' />
						<Skeleton className='my-3' variant='rectangular' />
						<Skeleton className='my-3' variant='rectangular' />
					</div>
				</div>
			</div>
		);
	}

	if (erroring) {
		return (
			<div>
				<h1>Gặp lỗi: {erroring}</h1>
			</div>
		);
	}

	if (book === null) {
		return (
			<div>
				<h1>Sách không tồn tại </h1>
			</div>
		);
	}

	return (
		<>
			{!isCheckout ? (
				<>
					<div className='container p-2 bg-white my-3 rounded'>
						<div className='row mt-4 mb-4'>
							<div className='col-lg-4 col-md-4 col-sm-12'>
								<Carousel
									emulateTouch={true}
									swipeable={true}
									showIndicators={false}
								>
									{images?.map((image, index) => (
										<div
											key={index}
											onClick={() => openImageViewer(index)}
											style={{
												width: "100%",
												height: "400px",
												objectFit: "cover",
											}}
										>
											<img
												alt=''
												src={
													image.dataImage
														? image.dataImage
														: image.urlImage
												}
											/>
										</div>
									))}
								</Carousel>
								{isViewerOpen && (
									<ReactSimpleImageViewer
										src={imageList}
										currentIndex={currentImage}
										disableScroll={true}
										closeOnClickOutside={true}
										onClose={closeImageViewer}
										backgroundStyle={{
											backgroundColor: "rgba(0,0,0,0.7)",
										}}
									/>
								)}
							</div>
							<div className='col-lg-8 col-md-8 col-sm-12 px-5'>
								<h2>{book.nameBook}</h2>
								<div className='d-flex align-items-center'>
									<p className='me-5'>
										Thể loại:{" "}
										<strong>
											{genres?.map((genre) => genre.nameGenre + " ")}
										</strong>
									</p>
									<p className='ms-5'>
										Tác giả: <strong>{book.author}</strong>
									</p>
								</div>
								<div className='d-flex align-items-center'>
									<div className='d-flex align-items-center'>
										<RatingStar
											readonly={true}
											ratingPoint={book.avgRating}
										/>

										<p className='text-danger ms-2 mb-0'>
											({book.avgRating})
										</p>
									</div>
									<div className='d-flex align-items-center'>
										<span className='mx-3 mb-1 text-secondary'>
											|
										</span>
									</div>
									<div className='d-flex align-items-end justify-content-center '>
										<span
											style={{
												color: "rgb(135,135,135)",
												fontSize: "16px",
											}}
										>
											Đã bán
										</span>
										<span className='fw-bold ms-2'>
											{book.soldQuantity}
										</span>
									</div>
								</div>

								{/* Thông tin giá và số lượng bán */}
								<div className='price'>
									<span className='discounted-price text-danger me-3'>
										<strong style={{ fontSize: "32px" }}>
											{book.sellPrice?.toLocaleString()}đ
										</strong>
									</span>
									<span className='original-price small me-3'>
										<strong>
											<del>{book.listPrice?.toLocaleString()}đ</del>
										</strong>
									</span>
									<h4 className='my-0 d-inline-block'>
										<span className='badge bg-danger'>
											{book.discountPercent}%
										</span>
									</h4>
								</div>

								<div className='mt-3'>
									<div className='d-flex align-items-center mt-3'>
										<img
											src='https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/d9e992985b18d96aab90969636ebfd0e.png'
											height='20'
											alt='free ship'
										/>
										<span className='ms-3'>Miễn phí vận chuyển</span>
									</div>
								</div>

								{/* Section cho mua sách */}
								{book.quantityForSold && book.quantityForSold > 0 && (
									<div className='border p-3 my-3 rounded'>
										<h5 className='text-primary mb-3'>📦 Mua sách</h5>
										<div className='d-flex align-items-center mt-3'>
											<strong className='me-5'>Số lượng: </strong>
											<SelectQuantity
												max={book.quantityForSold}
												quantity={quantity}
												setQuantity={setQuantity}
												add={add}
												reduce={reduce}
											/>
											<span className='ms-4'>
												{book.quantityForSold} sản phẩm có sẵn
											</span>
										</div>
										<div className='mt-3 d-flex align-items-center'>
											<Button
												variant='outlined'
												size='large'
												startIcon={<ShoppingCartOutlined />}
												className='me-3'
												onClick={() => handleAddProduct(book)}
											>
												Thêm vào giỏ hàng
											</Button>
											<Button
												variant='contained'
												size='large'
												className='ms-3'
												onClick={() => handleBuyNow(book)}
											>
												Mua ngay
											</Button>
										</div>
									</div>
								)}

								{/* Section cho mượn sách */}
								{book.quantityForBorrow && book.quantityForBorrow > 0 && (
									<div className='border p-3 my-3 rounded' style={{borderColor: '#1976d2'}}>
										<h5 className='text-info mb-3'>📚 Mượn sách</h5>
										<p className='mb-3'>
											<span className='badge bg-info'>
												{book.quantityForBorrow} quyển có thể mượn
											</span>
										</p>
										<div>
											<Button
												variant='contained'
												size='large'
												startIcon={<LibraryAddIcon />}
												color='info'
												onClick={() => handleAddToBorrowCart(book)}
											>
												Thêm vào phiếu mượn (1 quyển)
											</Button>
										</div>
									</div>
								)}

								{/* Hiển thị khi hết hàng */}
								{(!book.quantityForSold || book.quantityForSold === 0) && (!book.quantityForBorrow || book.quantityForBorrow === 0) && (
									<div className='mt-4'>
										<Button
											variant='outlined'
											size='large'
											className='me-3'
											color='error'
											disabled
										>
											Hết hàng và không có sách để mượn
										</Button>
									</div>
								)}

								{/* Hiển thị khi chỉ hết hàng bán */}
								{(!book.quantityForSold || book.quantityForSold === 0) && book.quantityForBorrow && book.quantityForBorrow > 0 && (
									<div className='alert alert-warning mt-3'>
										<strong>Thông báo:</strong> Sách đã hết hàng để bán, nhưng bạn vẫn có thể mượn sách.
									</div>
								)}

								{/* Hiển thị khi chỉ hết sách mượn */}
								{book.quantityForSold && book.quantityForSold > 0 && (!book.quantityForBorrow || book.quantityForBorrow === 0) && (
									<div className='alert alert-info mt-3'>
										<strong>Thông báo:</strong> Hiện tại không có sách để mượn, nhưng bạn vẫn có thể mua sách.
									</div>
								)}
							</div>
						</div>
					</div>
					<div className='container p-4 bg-white my-3 rounded'>
						<h5 className='my-3'>Mô tả sản phẩm</h5>
						<hr />
						<TextEllipsis
							isShow={true}
							text={book.description + ""}
							limit={1000}
						/>
					</div>
					<div className='container p-4 bg-white my-3 rounded'>
						<h5 className='my-3'>Khách hàng đánh giá</h5>
						<hr />
						<Comment idBook={idBookNumber} />
					</div>
				</>
			) : (
				<CheckoutPage
					setIsCheckout={setIsCheckout}
					cartList={cartItem}
					totalPriceProduct={totalPriceProduct}
					isBuyNow={true}
				/>
			)}
		</>
	);
};

export default BookDetail;