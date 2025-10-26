<?php /* User Profile */ ?>
<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Hồ sơ - Bookverse</title>
	<link rel="stylesheet" href="assets/css/main.css">
	<link rel="stylesheet" href="assets/css/responsive.css">
	<link rel="stylesheet" href="assets/css/account.css">
</head>
<body>
	<header class="header"><div class="container"><a href="index.php" class="logo-text">Bookverse</a></div></header>
	<main class="container" style="padding:24px 0;">
		<h1 class="section-title" style="margin-bottom:16px;">Hồ sơ cá nhân</h1>
		<form id="profileForm" class="account-form">
			<div class="grid-2">
				<label>Họ
					<input name="firstName" />
				</label>
				<label>Tên
					<input name="lastName" />
				</label>
				<label>Điện thoại
					<input name="phone" />
				</label>
				<label>Địa chỉ
					<input name="street" placeholder="Số nhà, đường" />
				</label>
				<label>Thành phố
					<input name="city" />
				</label>
				<label>Tỉnh/TP
					<input name="state" />
				</label>
				<label>Mã bưu chính
					<input name="zipCode" />
				</label>
				<label>Quốc gia
					<input name="country" value="Vietnam" />
				</label>
			</div>
			<button class="btn btn-primary" type="submit">Lưu thay đổi</button>
		</form>
	</main>

	<script src="assets/js/api.js"></script>
	<script>
		document.addEventListener('DOMContentLoaded', async () => {
			try {
				const res = await api.getUserProfile();
				const u = res.data.user || {};
				const f = document.getElementById('profileForm');
				f.firstName.value = u.profile?.firstName || '';
				f.lastName.value = u.profile?.lastName || '';
				f.phone.value = u.profile?.phone || '';
				f.street.value = u.profile?.address?.street || '';
				f.city.value = u.profile?.address?.city || '';
				f.state.value = u.profile?.address?.state || '';
				f.zipCode.value = u.profile?.address?.zipCode || '';
				f.country.value = u.profile?.address?.country || 'Vietnam';
				f.addEventListener('submit', async (e) => {
					e.preventDefault();
					const profile = {
						firstName: f.firstName.value,
						lastName: f.lastName.value,
						phone: f.phone.value,
						address: {
							street: f.street.value,
							city: f.city.value,
							state: f.state.value,
							zipCode: f.zipCode.value,
							country: f.country.value
						}
					};
					await api.updateUserProfile(profile);
					alert('Cập nhật thành công');
				});
			} catch (err) { api.handleError(err); }
		});
	</script>
</body>
</html>




