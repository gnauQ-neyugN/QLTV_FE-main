import React from "react";
// import "./Banner.css";
import { Link } from "react-router-dom";

function Banner() {
	return (
		<div className='container-fluid pt-5 pb-4 text-dark d-flex justify-content-center align-items-center'>
			<div className='banner-box p-5 rounded shadow bg-light text-center'>
				<h3
					data-text='A room without books is like a body without a soul.'
					className='banner-text display-5 fw-bold mb-3'
				>
					A room without books is like a body without a soul.
				</h3>
				<p className='mb-4'>-- Marcus Tullius Cicero --</p>
				<Link to={"/search"}>
					<button className='btn btn-primary btn-lg text-white'>
						Khám phá ngay
					</button>
				</Link>
			</div>
		</div>

	);
}

export default Banner;
