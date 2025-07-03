import React from 'react';
import { Container, Typography, Box, Paper, Divider, List, ListItem, ListItemText, Alert } from '@mui/material';
import { LibraryBooks, Security, Payment, LocalShipping, Assignment, PersonAdd, VerifiedUser } from '@mui/icons-material';

const PolicyPage: React.FC = () => {
	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box textAlign="center" mb={4}>
				<Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
					Chính Sách Thư Viện QLibrary
				</Typography>
				<Typography variant="h6" color="text.secondary">
					Quy định và điều khoản sử dụng dịch vụ thư viện
				</Typography>
			</Box>

			{/* Điều khoản sử dụng */}
			<Paper elevation={2} sx={{ p: 4, mb: 4 }}>
				<Box display="flex" alignItems="center" mb={3}>
					<Assignment sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
					<Typography variant="h4" component="h2" fontWeight="bold">
						1. Điều Khoản Sử Dụng
					</Typography>
				</Box>

				<Typography variant="h6" gutterBottom color="primary">
					1.1 Đăng ký tài khoản
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Người dùng phải cung cấp thông tin chính xác khi đăng ký tài khoản" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Mỗi người chỉ được tạo một tài khoản duy nhất" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Tài khoản phải được xác thực bằng email và số điện thoại" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập" />
					</ListItem>
				</List>

				<Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
					1.2 Sử dụng dịch vụ
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Người dùng cam kết sử dụng dịch vụ đúng mục đích" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Không được chia sẻ tài khoản cho người khác" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Tuân thủ quy định về bản quyền và sở hữu trí tuệ" />
					</ListItem>
				</List>
			</Paper>

			{/* Chính sách thẻ thư viện */}
			<Paper elevation={2} sx={{ p: 4, mb: 4 }}>
				<Box display="flex" alignItems="center" mb={3}>
					<VerifiedUser sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
					<Typography variant="h4" component="h2" fontWeight="bold">
						2. Chính Sách Thẻ Thư Viện
					</Typography>
				</Box>

				<Typography variant="h6" gutterBottom color="primary">
					2.1 Đăng ký thẻ thư viện
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Người dùng phải có tài khoản đã được xác thực để đăng ký thẻ thư viện" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Cung cấp đầy đủ thông tin cá nhân và mã căn cước công dân" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Thẻ thư viện cần được kích hoạt bởi thủ thư trước khi sử dụng" />
					</ListItem>
				</List>

				<Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
					2.2 Gia hạn thẻ thư viện
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Thẻ thư viện có thể được gia hạn thông qua hệ thống" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Yêu cầu gia hạn sẽ được xem xét bởi thủ thư" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Thẻ hết hạn sẽ không thể thực hiện giao dịch mượn sách" />
					</ListItem>
				</List>
			</Paper>

			{/* Chính sách mượn trả sách */}
			<Paper elevation={2} sx={{ p: 4, mb: 4 }}>
				<Box display="flex" alignItems="center" mb={3}>
					<LibraryBooks sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
					<Typography variant="h4" component="h2" fontWeight="bold">
						3. Chính Sách Mượn Trả Sách
					</Typography>
				</Box>

				<Alert severity="info" sx={{ mb: 3 }}>
					<Typography variant="body2">
						<strong>Thời hạn mượn sách: 60 ngày</strong> từ ngày được phê duyệt
					</Typography>
				</Alert>

				<Typography variant="h6" gutterBottom color="primary">
					3.1 Quy định mượn sách
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Phải có thẻ thư viện đã được kích hoạt" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Yêu cầu mượn sách cần được thủ thư phê duyệt" />
					</ListItem>
				</List>

				<Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
					3.2 Quy định trả sách
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Sách phải được trả đúng hạn (60 ngày từ ngày mượn)" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Trả sách muộn sẽ bị tính phí phạt theo quy định" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Sách bị mất phải bồi thường theo giá trị thực tế" />
					</ListItem>
				</List>

				<Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
					3.3 Phí phạt và vi phạm
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Trả sách muộn: 10,000 VNĐ/ngày/cuốn" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Mất sách: Bồi thường giá trị sách tùy theo mức độ" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Vi phạm nghiêm trọng có thể bị khóa tài khoản" />
					</ListItem>
				</List>
			</Paper>

			{/* Chính sách mua sách */}
			<Paper elevation={2} sx={{ p: 4, mb: 4 }}>
				<Box display="flex" alignItems="center" mb={3}>
					<Payment sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
					<Typography variant="h4" component="h2" fontWeight="bold">
						4. Chính Sách Mua Sách
					</Typography>
				</Box>

				<Typography variant="h6" gutterBottom color="primary">
					4.1 Đặt hàng và thanh toán
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Hỗ trợ thanh toán online qua các cổng thanh toán uy tín" />
					</ListItem>
				</List>

				<Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
					4.2 Chính sách đổi trả
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Đổi trả trong vòng 7 ngày nếu sách bị lỗi kỹ thuật" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Hoàn tiền 100% nếu sách không đúng mô tả" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Sách đổi trả phải còn nguyên tem, nhãn và chưa sử dụng" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Phí vận chuyển đổi trả do khách hàng chịu (trừ lỗi từ nhà cung cấp)" />
					</ListItem>
				</List>
			</Paper>

			{/* Chính sách vận chuyển */}
			<Paper elevation={2} sx={{ p: 4, mb: 4 }}>
				<Box display="flex" alignItems="center" mb={3}>
					<LocalShipping sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
					<Typography variant="h4" component="h2" fontWeight="bold">
						5. Chính Sách Vận Chuyển
					</Typography>
				</Box>

				<Typography variant="h6" gutterBottom color="primary">
					5.1 Phạm vi giao hàng
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Giao hàng toàn quốc thông qua đối tác vận chuyển" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Hỗ trợ giao hàng tận nơi và nhận tại cửa hàng" />
					</ListItem>
				</List>
			</Paper>

			{/* Chính sách bảo mật */}
			<Paper elevation={2} sx={{ p: 4, mb: 4 }}>
				<Box display="flex" alignItems="center" mb={3}>
					<Security sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
					<Typography variant="h4" component="h2" fontWeight="bold">
						6. Chính Sách Bảo Mật Thông Tin
					</Typography>
				</Box>

				<Typography variant="h6" gutterBottom color="primary">
					6.1 Thu thập thông tin
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Chỉ thu thập thông tin cần thiết cho việc cung cấp dịch vụ" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Thông tin cá nhân được mã hóa và bảo mật tuyệt đối" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Không chia sẻ thông tin khách hàng cho bên thứ ba" />
					</ListItem>
				</List>

				<Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
					6.2 Bảo mật thanh toán
				</Typography>
				<List>
					<ListItem>
						<ListItemText primary="• Sử dụng công nghệ mã hóa SSL 256-bit" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Không lưu trữ thông tin thẻ tín dụng trên hệ thống" />
					</ListItem>
					<ListItem>
						<ListItemText primary="• Tuân thủ tiêu chuẩn bảo mật quốc tế PCI DSS" />
					</ListItem>
				</List>
			</Paper>

			{/* Liên hệ và hỗ trợ */}
			<Paper elevation={2} sx={{ p: 4, mb: 4 }}>
				<Box display="flex" alignItems="center" mb={3}>
					<PersonAdd sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
					<Typography variant="h4" component="h2" fontWeight="bold">
						7. Liên Hệ và Hỗ Trợ
					</Typography>
				</Box>

				<Typography variant="body1" paragraph>
					Nếu có bất kỳ thắc mắc nào về chính sách này, vui lòng liên hệ với chúng tôi:
				</Typography>

				<List>
					<ListItem>
						<ListItemText primary="📞 Hotline: 1900-1234" />
					</ListItem>
					<ListItem>
						<ListItemText primary="📧 Email: support@qlibrary.com" />
					</ListItem>
					<ListItem>
						<ListItemText primary="🕒 Giờ làm việc: Thứ 2 - Thứ 6 (8:00 - 17:00)" />
					</ListItem>
				</List>
			</Paper>

			<Divider sx={{ my: 4 }} />

			<Box textAlign="center">
				<Typography variant="body2" color="text.secondary">
					Chính sách có hiệu lực từ ngày 01/01/2024 và có thể được cập nhật theo thời gian.
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
					© 2024 QLibrary - Hệ thống thư viện số hiện đại
				</Typography>
			</Box>
		</Container>
	);
};

export default PolicyPage;