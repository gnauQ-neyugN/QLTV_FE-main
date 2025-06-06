import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Tooltip, IconButton } from "@mui/material";
import {
	Favorite as FavoriteIcon,
	LibraryAdd as LibraryAddIcon,
	ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";

import BookModel from "../../../model/BookModel";
import TextEllipsis from "./text-ellipsis/TextEllipsis";
import { endpointBE } from "../../utils/Constant";
import { getIdUserByToken, isToken } from "../../utils/JwtService";
import { useCartItem } from "../../utils/CartItemContext";
import { useBorrowCart } from "../../utils/BorrowCartContext";

interface BookCardProps {
	book: BookModel;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
	// Hooks
	const navigate = useNavigate();
	const { setTotalCart, cartList } = useCartItem();
	const { borrowCartList, setBorrowCartList, setTotalBorrowItems } = useBorrowCart();

	// Local state
	const [isFavoriteBook, setIsFavoriteBook] = useState(false);
	const [isAddingToCart, setIsAddingToCart] = useState(false);
	const [isAddingToLoan, setIsAddingToLoan] = useState(false);
	const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

	// Handle favorite book toggle
	const handleFavoriteBook = useCallback(async (targetBook: BookModel) => {
		if (!isToken()) {
			toast.info("Bạn phải đăng nhập để sử dụng chức năng này");
			navigate("/login");
			return;
		}

		setIsTogglingFavorite(true);

		try {
			const endpoint = isFavoriteBook
				? "/favorite-book/delete-book"
				: "/favorite-book/add-book";

			const method = isFavoriteBook ? "DELETE" : "POST";
			const token = localStorage.getItem("token");

			await fetch(endpointBE + endpoint, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					idBook: targetBook.idBook,
					idUser: getIdUserByToken(),
				}),
			});

			setIsFavoriteBook(!isFavoriteBook);
			toast.success(
				isFavoriteBook
					? "Đã xóa khỏi danh sách yêu thích"
					: "Đã thêm vào danh sách yêu thích"
			);
		} catch (error) {
			console.error("Lỗi khi cập nhật yêu thích:", error);
			toast.error("Có lỗi xảy ra khi cập nhật danh sách yêu thích");
		} finally {
			setIsTogglingFavorite(false);
		}
	}, [isFavoriteBook, navigate]);

	// Handle adding product to shopping cart
	const handleAddProduct = useCallback(async (newBook: BookModel) => {
		setIsAddingToCart(true);

		try {
			const existingItem = cartList.find(
				(cartItem) => cartItem.book.idBook === newBook.idBook
			);

			if (existingItem) {
				existingItem.quantity += 1;

				if (isToken()) {
					const token = localStorage.getItem("token");
					await fetch(endpointBE + "/cart-item/update-item", {
						method: "PUT",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							idCart: existingItem.idCart,
							quantity: existingItem.quantity,
						}),
					});
				}
			} else {
				if (isToken()) {
					const response = await fetch(endpointBE + "/cart-item/add-item", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify([{
							quantity: 1,
							book: newBook,
							idUser: getIdUserByToken(),
						}]),
					});

					if (response.ok) {
						const idCart = await response.json();
						cartList.push({
							idCart: idCart,
							quantity: 1,
							book: newBook,
						});
					}
				} else {
					cartList.push({
						quantity: 1,
						book: newBook,
					});
				}
			}

			localStorage.setItem("cart", JSON.stringify(cartList));
			setTotalCart(cartList.length);
			toast.success(`Đã thêm "${newBook.nameBook}" vào giỏ hàng`);
		} catch (error) {
			console.error("Lỗi khi thêm vào giỏ hàng:", error);
			toast.error(`Lỗi khi thêm "${newBook.nameBook}" vào giỏ hàng`);
		} finally {
			setIsAddingToCart(false);
		}
	}, [cartList, setTotalCart]);

	// Handle adding book to borrow cart
	const handleAddToBorrowCart = useCallback(async (newBook: BookModel) => {
		if (!isToken()) {
			toast.info("Bạn phải đăng nhập để sử dụng chức năng này");
			navigate("/login");
			return;
		}

		setIsAddingToLoan(true);

		try {
			const existingItem = borrowCartList.find(
				(cartItem) => cartItem.book.idBook === newBook.idBook
			);

			if (existingItem) {
				existingItem.quantity += 1;
			} else {
				borrowCartList.push({
					quantity: 1,
					book: newBook
				});
			}

			localStorage.setItem("borrowCart", JSON.stringify(borrowCartList));
			setTotalBorrowItems(borrowCartList.length);
			setBorrowCartList([...borrowCartList]);

			toast.success(`Đã thêm "${newBook.nameBook}" vào phiếu mượn`);
		} catch (error) {
			console.error("Lỗi khi thêm vào phiếu mượn:", error);
			toast.error(`Lỗi khi thêm "${newBook.nameBook}" vào phiếu mượn`);
		} finally {
			setIsAddingToLoan(false);
		}
	}, [borrowCartList, setBorrowCartList, setTotalBorrowItems, navigate]);

	return (
		<div className='col-md-6 col-lg-3 mt-3'>
			<div className='card h-100 border-0 position-relative'
				 style={{
					 borderRadius: '12px',
					 overflow: 'hidden',
					 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					 transition: 'all 0.3s ease'
				 }}
				 onMouseEnter={(e) => {
					 e.currentTarget.style.transform = 'translateY(-2px)';
					 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
				 }}
				 onMouseLeave={(e) => {
					 e.currentTarget.style.transform = 'translateY(0)';
					 e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
				 }}>

				{/* Elegant Badge */}
				{(book.discountPercent !== 0 || book.quantityForSold === 0) && (
					<div className='position-absolute top-0 end-0 m-2' style={{ zIndex: 2 }}>
						{book.quantityForSold === 0 ? (
							<span className='badge text-white fw-semibold px-2 py-1'
								  style={{
									  backgroundColor: '#dc3545',
									  borderRadius: '8px',
									  fontSize: '0.7rem',
									  boxShadow: '0 2px 4px rgba(220,53,69,0.3)'
								  }}>
                Hết hàng
              </span>
						) : (
							<span className='badge text-white fw-semibold px-2 py-1'
								  style={{
									  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									  borderRadius: '8px',
									  fontSize: '0.7rem',
									  boxShadow: '0 2px 4px rgba(102,126,234,0.3)'
								  }}>
                -{book.discountPercent}%
              </span>
						)}
					</div>
				)}

				{/* Book Image with Overlay */}
				<Link to={`/book/${book.idBook}`} className='text-decoration-none position-relative d-block'>
					<img
						src={book.thumbnail}
						className='card-img-top'
						alt={book.nameBook || ''}
						style={{
							height: "200px",
							objectFit: "cover",
							transition: 'transform 0.3s ease'
						}}
						onMouseOver={(e) => {
							const target = e.target as HTMLImageElement;
							target.style.transform = "scale(1.03)";
						}}
						onMouseOut={(e) => {
							const target = e.target as HTMLImageElement;
							target.style.transform = "scale(1)";
						}}
					/>
					{/* Subtle overlay */}
					<div className='position-absolute bottom-0 start-0 w-100'
						 style={{
							 height: '40px',
							 background: 'linear-gradient(transparent, rgba(0,0,0,0.1))'
						 }}>
					</div>
				</Link>

				{/* Refined Card Body */}
				<div className='card-body p-3' style={{ backgroundColor: '#fafafa' }}>
					{/* Book Title */}
					<Link to={`/book/${book.idBook}`} className='text-decoration-none'>
						<Tooltip title={book.nameBook} arrow placement="top">
							<h6 className='card-title mb-2 fw-semibold text-dark'
								style={{
									fontSize: "0.9rem",
									height: "2.2em",
									overflow: "hidden",
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
									lineHeight: "1.1",
									transition: 'color 0.2s ease'
								}}
								onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
								onMouseLeave={(e) => e.currentTarget.style.color = '#212529'}>
								<TextEllipsis text={book.nameBook || ''} limit={35} />
							</h6>
						</Tooltip>
					</Link>

					{/* Elegant Price Section */}
					<div className='mb-2'>
						<div className='d-flex align-items-center gap-2 mb-1'>
              <span className='fw-bold'
					style={{
						fontSize: "1.1rem",
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text'
					}}>
                {book.sellPrice?.toLocaleString()}₫
              </span>
							{book.discountPercent !== 0 && (
								<span className='text-muted text-decoration-line-through'
									  style={{ fontSize: "0.75rem" }}>
                  {book.listPrice?.toLocaleString()}₫
                </span>
							)}
						</div>

						{/* All Stats in compact grid */}
						<div className='row g-1 text-center'>
							<div className='col-6'>
								<div className='d-flex align-items-center justify-content-center gap-1'>
									<div className='rounded-circle bg-success'
										 style={{ width: '4px', height: '4px' }}></div>
									<small className='text-muted fw-medium' style={{ fontSize: "0.65rem" }}>
										Còn {book.quantityForSold || 0}
									</small>
								</div>
							</div>
							<div className='col-6'>
								<div className='d-flex align-items-center justify-content-center gap-1'>
									<div className='rounded-circle bg-primary'
										 style={{ width: '4px', height: '4px' }}></div>
									<small className='text-muted fw-medium' style={{ fontSize: "0.65rem" }}>
										Bán {book.soldQuantity || 0}
									</small>
								</div>
							</div>
							{((book.quantityForBorrow || 0) > 0 || (book.borrowQuantity || 0) > 0) && (
								<>
									<div className='col-6'>
										<div className='d-flex align-items-center justify-content-center gap-1'>
											<div className='rounded-circle bg-info'
												 style={{ width: '4px', height: '4px' }}></div>
											<small className='text-muted fw-medium' style={{ fontSize: "0.65rem" }}>
												Có thể cho mượn {book.quantityForBorrow || 0}
											</small>
										</div>
									</div>
									<div className='col-6'>
										<div className='d-flex align-items-center justify-content-center gap-1'>
											<div className='rounded-circle bg-warning'
												 style={{ width: '4px', height: '4px' }}></div>
											<small className='text-muted fw-medium' style={{ fontSize: "0.65rem" }}>
												Đang mượn {book.borrowQuantity || 0}
											</small>
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Stylish Action Buttons */}
					<div className='d-flex justify-content-center gap-1 mt-2'>
						{/* Favorite Button */}
						<Tooltip title='Yêu thích' arrow>
							<IconButton
								size='small'
								onClick={() => handleFavoriteBook(book)}
								disabled={isTogglingFavorite}
								style={{
									width: '32px',
									height: '32px',
									borderRadius: '8px',
									backgroundColor: isFavoriteBook ? 'rgba(244, 67, 54, 0.1)' : 'rgba(0,0,0,0.05)',
									border: `1px solid ${isFavoriteBook ? 'rgba(244, 67, 54, 0.2)' : 'rgba(0,0,0,0.1)'}`,
									transition: 'all 0.2s ease'
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = isFavoriteBook ? 'rgba(244, 67, 54, 0.15)' : 'rgba(0,0,0,0.08)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = isFavoriteBook ? 'rgba(244, 67, 54, 0.1)' : 'rgba(0,0,0,0.05)';
								}}
							>
								<FavoriteIcon
									fontSize="small"
									style={{ color: isFavoriteBook ? '#f44336' : '#666' }}
								/>
							</IconButton>
						</Tooltip>

						{/* Add to Cart Button */}
						{(book.quantityForSold || 0) > 0 && (
							<Tooltip title='Giỏ hàng' arrow>
								<IconButton
									size='small'
									onClick={() => handleAddProduct(book)}
									disabled={isAddingToCart}
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '8px',
										backgroundColor: 'rgba(25, 118, 210, 0.1)',
										border: '1px solid rgba(25, 118, 210, 0.2)',
										transition: 'all 0.2s ease'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = 'rgba(25, 118, 210, 0.15)';
										e.currentTarget.style.transform = 'scale(1.05)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
										e.currentTarget.style.transform = 'scale(1)';
									}}
								>
									<ShoppingCartIcon fontSize="small" style={{ color: '#1976d2' }} />
								</IconButton>
							</Tooltip>
						)}

						{/* Add to Borrow Button */}
						{(book.quantityForBorrow || 0) > 0 && (
							<Tooltip title='Mượn sách' arrow>
								<IconButton
									size='small'
									onClick={() => handleAddToBorrowCart(book)}
									disabled={isAddingToLoan}
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '8px',
										backgroundColor: 'rgba(2, 136, 209, 0.1)',
										border: '1px solid rgba(2, 136, 209, 0.2)',
										transition: 'all 0.2s ease'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = 'rgba(2, 136, 209, 0.15)';
										e.currentTarget.style.transform = 'scale(1.05)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = 'rgba(2, 136, 209, 0.1)';
										e.currentTarget.style.transform = 'scale(1)';
									}}
								>
									<LibraryAddIcon fontSize="small" style={{ color: '#0288d1' }} />
								</IconButton>
							</Tooltip>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default BookCard;