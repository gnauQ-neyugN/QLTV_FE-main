import React, { useState } from "react";
import BookModel from "../../../model/BookModel";
import { Link, useNavigate } from "react-router-dom";
import Tooltip from "@mui/material/Tooltip";
import TextEllipsis from "./text-ellipsis/TextEllipsis";
import { toast } from "react-toastify";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { IconButton } from "@mui/material";
import { endpointBE } from "../../utils/Constant";
import { getIdUserByToken, isToken } from "../../utils/JwtService";
import { useCartItem } from "../../utils/CartItemContext";
import { useBorrowCart } from "../../utils/BorrowCartContext";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface BookProps {
	book: BookModel;
}

const BookProps: React.FC<BookProps> = ({ book }) => {
	const { setTotalCart, cartList } = useCartItem();
	const { borrowCartList, setBorrowCartList, setTotalBorrowItems } = useBorrowCart();
	const [isFavoriteBook, setIsFavoriteBook] = useState(false);
	const navigation = useNavigate();
	const [isAddingToLoan, setIsAddingToLoan] = useState(false);

	// Handle adding book to borrow cart
	const handleAddToBorrowCart = (newBook: BookModel) => {
		if (!isToken()) {
			toast.info("Bạn phải đăng nhập để sử dụng chức năng này");
			navigation("/login");
			return;
		}

		setIsAddingToLoan(true);

		// Check if book is already in borrow cart
		let isExistBook = borrowCartList.find(
			(cartItem) => cartItem.book.idBook === newBook.idBook
		);

		try {
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
		} finally {
			setIsAddingToLoan(false);
		}
	};

	// Handle adding product to shopping cart
	const handleAddProduct = async (newBook: BookModel) => {
		// cái isExistBook này sẽ tham chiếu đến cái cart ở trên, nên khi update thì cart nó cũng update theo
		let isExistBook = cartList.find(
			(cartItem) => cartItem.book.idBook === newBook.idBook
		);
		// Thêm 1 sản phẩm vào giỏ hàng
		if (isExistBook) {
			// nếu có rồi thì sẽ tăng số lượng
			isExistBook.quantity += 1;

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
							quantity: 1,
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
							quantity: 1,
							book: newBook,
						});
					}
				} catch (error) {
					console.log(error);
				}
			} else {
				cartList.push({
					quantity: 1,
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

	// Xử lý chức năng yêu sách
	const handleFavoriteBook = async (newBook: BookModel) => {
		if (!isToken()) {
			toast.info("Bạn phải đăng nhập để sử dụng chức năng này");
			navigation("/login");
			return;
		}
		if (!isFavoriteBook) {
			const token = localStorage.getItem("token");
			fetch(endpointBE + `/favorite-book/add-book`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					idBook: book.idBook,
					idUser: getIdUserByToken(),
				}),
			}).catch((err) => console.log(err));
		} else {
			const token = localStorage.getItem("token");
			fetch(endpointBE + `/favorite-book/delete-book`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					idBook: book.idBook,
					idUser: getIdUserByToken(),
				}),
			}).catch((err) => console.log(err));
		}
		setIsFavoriteBook(!isFavoriteBook);
	};

	return (
		<div className='col-md-6 col-lg-3 mt-3'>
			<div className='card position-relative'>
				{book.discountPercent !== 0 && (
					<h4
						className='my-0 d-inline-block position-absolute end-0'
						style={{ top: "15px" }}
					>
						{book.quantityForSold === 0 ? (
							<span className='badge bg-danger'>Hết hàng</span>
						) : (
							<span className='badge bg-primary'>
                                {book.discountPercent}%
                            </span>
						)}
					</h4>
				)}
				<Link to={`/book/${book.idBook}`}>
					<img
						src={book.thumbnail}
						className='card-img-top mt-3'
						alt={book.nameBook}
						style={{ height: "300px" }}
					/>
				</Link>
				<div className='card-body'>
					<Link
						to={`/book/${book.idBook}`}
						style={{ textDecoration: "none" }}
					>
						<h5 className='card-title'>
							<Tooltip title={book.nameBook} arrow>
                                <span>
                                    <TextEllipsis text={book.nameBook + ""} limit={20} />
                                </span>
							</Tooltip>
						</h5>
					</Link>
					<div className='price mb-3 d-flex align-items-center justify-content-between'>
						<div className='d-flex align-items-center'>
                            <span className='discounted-price text-danger'>
                                <strong style={{ fontSize: "22px" }}>
                                    {book.sellPrice?.toLocaleString()}đ
                                </strong>
                            </span>
							{book.discountPercent !== 0 && (
								<span className='original-price ms-3 small fw-bolder'>
                                    <del>{book.listPrice?.toLocaleString()}đ</del>
                                </span>
							)}
						</div>
						<span
							className='ms-2'
							style={{ fontSize: "12px", color: "#aaa" }}
						>
                            Đã bán {book.soldQuantity}
                        </span>
					</div>
					<div className='d-flex justify-content-between mt-2' role='group'>
						<Tooltip title='Yêu thích'>
							<IconButton
								size='small'
								color={isFavoriteBook ? "error" : "default"}
								onClick={() => {
									handleFavoriteBook(book);
								}}
							>
								<FavoriteIcon />
							</IconButton>
						</Tooltip>
						{book.quantityForSold !== 0 && (
							<Tooltip title='Thêm vào giỏ hàng'>
								<IconButton
									size='small'
									color='primary'
									onClick={() => handleAddProduct(book)}
								>
									<ShoppingCartIcon />
								</IconButton>
							</Tooltip>
						)}
						{book.quantityForBorrow !== 0 && (
							<Tooltip title='Thêm vào phiếu mượn'>
								<IconButton
									size='small'
									color='info'
									onClick={() => handleAddToBorrowCart(book)}
									disabled={isAddingToLoan}
								>
									<LibraryAddIcon />
								</IconButton>
							</Tooltip>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default BookProps;