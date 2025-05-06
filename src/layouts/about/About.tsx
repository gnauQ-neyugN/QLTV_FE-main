import React from "react";
import useScrollToTop from "../../hooks/ScrollToTop";

function About() {
	useScrollToTop(); // Mỗi lần vào component này thì sẽ ở trên cùng
	return (
		<div className='w-100 h-100 d-flex align-items-center justify-content-center flex-column m-5'>
			<div className='w-50 h-50 p-3 rounded-5 shadow-4-strong bg-light'>
				<h3 className='text-center text-black'>Giới thiệu về Qlibary</h3>
				<hr />
				<div className='row'>
					<div className='col-lg-8'>
						<p>
							<strong>Tên website: </strong>QLibrary
						</p>
						<p>
							<strong>Địa chỉ: </strong>Cầu Giấy, Hà Nội
						</p>
						<p>
							<strong>Số điện thoại: </strong>0967532026
						</p>
						<p>
							<strong>Email: </strong>qn02062003@gmail.com
						</p>
					</div>
				</div>
			</div>
			<div className='w-50 h-50 p-3 rounded-5 shadow-4-strong bg-light mt-3'>
				<h3 className='text-center text-black'>Google maps</h3>
				<hr />
				<div className='d-flex align-items-center justify-content-center'>
					<iframe
						title='Map'
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5266.6486095509035!2d105.80151842294612!3d21.029366879420927!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab424a50fff9%3A0xbe3a7f3670c0a45f!2zVHLGsOG7nW5nIMSQ4bqhaSBI4buNYyBHaWFvIFRow7RuZyBW4bqtbiBU4bqjaQ!5e0!3m2!1svi!2s!4v1746408900096!5m2!1svi!2s"
						width='600'
						height='450'
						style={{ border: 0 }}
						allowFullScreen={true}
						loading='lazy'
						referrerPolicy='no-referrer-when-downgrade'
					></iframe>
				</div>
			</div>
		</div>
	);
}

export default About;
