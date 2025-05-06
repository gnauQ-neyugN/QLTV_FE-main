/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
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
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface BookProps {
	book: BookModel;
}

const BookProps: React.FC<BookProps> = ({ book }) => {
	const { setTotalCart, cartList } = useCartItem();
	const [isFavoriteBook, setIsFavoriteBook] = useState(false);
	const navigation = useNavigate();
	const [isAddingToLoan, setIsAddingToLoan] = useState(false);

	// Lấy tất cả sách yêu thích của người dùng đã đăng nhập ra
	useEffect(() => {
		if (isToken()) {
			fetch(
				endpointBE +
					`/favorite-book/get-favorite-book/${getIdUserByToken()}`
			)
				.then((response) => response.json())
				.then((data) => {
					if (data.includes(book.idBook)) {
						setIsFavoriteBook(true);
					}
				})
				.catch((error) => {
					console.log(error);
				});
		}
	}, []);

	const handleAddToLoan = async (newBook: BookModel) => {
		// if (!isToken()) {
		// 	toast.info("Bạn phải đăng nhập để sử dụng chức năng này");
		// 	navigation("/login");
		// 	return;
		// }
		// setIsAddingToLoan(true);
		// // Gọi API backend để thêm sách vào phiếu mượn (chưa có API endpoint)
		// try {
		// 	const token = localStorage.getItem("token");
		// 	const response = await fetch(endpointBE + `/loan-slip/add-book`, { // Thay đổi endpoint này
		// 		method: "POST",
		// 		headers: {
		// 			Authorization: `Bearer ${token}`,
		// 			"content-type": "application/json",
		// 		},
		// 		body: JSON.stringify({
		// 			idBook: newBook.idBook,
		// 			idUser: getIdUserByToken(),
		// 			quantity: 1, // Hoặc số lượng bạn muốn mượn
		// 		}),
		// 	});
		//
		// 	if (response.ok) {
		// 		toast.success(`Đã thêm "${newBook.nameBook}" vào phiếu mượn`);
		// 		// Có thể thêm logic để cập nhật giao diện người dùng (ví dụ: disable nút này)
		// 	} else {
		// 		toast.error(`Không thể thêm "${newBook.nameBook}" vào phiếu mượn`);
		// 	}
		// } catch (error) {
		// 	console.error("Lỗi khi thêm vào phiếu mượn:", error);
		// 	toast.error(`Lỗi khi thêm "${newBook.nameBook}" vào phiếu mượn`);
		// } finally {
		// 	setIsAddingToLoan(false);
		// }
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
						{book.quantity === 0 ? (
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
						{book.quantity !== 0 && (
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
						{book.quantity !== 0 && (
							<Tooltip title='Thêm vào phiếu mượn'>
								<IconButton
									size='small'
									color='info'
									onClick={() => handleAddToLoan(book)}
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
