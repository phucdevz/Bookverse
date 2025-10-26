<?php /* Orders Page */ ?>
<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Đơn hàng - Bookverse</title>
	<link rel="stylesheet" href="assets/css/main.css">
	<link rel="stylesheet" href="assets/css/responsive.css">
	<link rel="stylesheet" href="assets/css/account.css">
</head>
<body>
	<header class="header"><div class="container"><a href="index.php" class="logo-text">Bookverse</a></div></header>
	<main class="container" style="padding:24px 0;">
		<h1 class="section-title" style="margin-bottom:16px;">Đơn hàng của tôi</h1>
		<form id="ordersFilter" class="filters-form" style="grid-template-columns: 200px 200px auto;">
			<select name="status">
				<option value="">Tất cả trạng thái</option>
				<option value="pending">Chờ xác nhận</option>
				<option value="confirmed">Đã xác nhận</option>
				<option value="processing">Đang xử lý</option>
				<option value="shipped">Đã gửi</option>
				<option value="delivered">Đã giao</option>
				<option value="cancelled">Đã hủy</option>
			</select>
			<select name="paymentStatus">
				<option value="">Thanh toán</option>
				<option value="pending">Chưa thanh toán</option>
				<option value="paid">Đã thanh toán</option>
				<option value="failed">Thất bại</option>
			</select>
			<button class="btn btn-outline">Lọc</button>
		</form>
		<div id="ordersList"></div>
	</main>

	<script src="assets/js/api.js"></script>
	<script>
		let page = 1; const limit = 10; let params = {};
		async function loadOrders() {
			const res = await api.getOrders({ ...params, page, limit });
			const orders = res.data.orders || [];
			const list = document.getElementById('ordersList');
			list.innerHTML = orders.map(o => `
				<div class="order-card">
					<div><strong>${o.orderNumber}</strong> — ${o.status} — ${api.formatPrice(o.total)}</div>
					<div>${new Date(o.createdAt).toLocaleString('vi-VN')}</div>
					<div>${(o.items||[]).map(i => i.product?.title).join(', ')}</div>
				</div>
			`).join('') || '<p>Chưa có đơn hàng.</p>';
		}
		document.addEventListener('DOMContentLoaded', () => {
			const form = document.getElementById('ordersFilter');
			form.addEventListener('submit', (e) => { e.preventDefault(); params = Object.fromEntries(new FormData(form).entries()); loadOrders(); });
			loadOrders();
		});
	</script>
</body>
</html>




