import React from "react";
import useScrollToTop from "../../hooks/ScrollToTop";

const PolicyPage: React.FC = () => {
	useScrollToTop(); // Mỗi lần vào component này thì sẽ ở trên cùng

	return (
		<div className='container my-5 bg-super-light p-4 rounded'>
			<h1>CHÍNH SÁCH ĐỔI / TRẢ / HOÀN TIỀN / MƯỢN SÁCH</h1>
		</div>
	);
};
export default PolicyPage;
