<?php 
/* Shared header with smart navigation system */
?>
<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title><?php echo isset($pageTitle) ? $pageTitle.' - ' : '';?>Bookverse</title>
	<link rel="stylesheet" href="<?php 
		$path = '';
		if (strpos($_SERVER['REQUEST_URI'], '/pages/seller/') !== false || strpos($_SERVER['REQUEST_URI'], '/pages/admin/') !== false || strpos($_SERVER['REQUEST_URI'], '/pages/account/') !== false) {
			$path = '../../';
		} elseif (strpos($_SERVER['REQUEST_URI'], '/pages/') !== false) {
			$path = '../';
		}
		echo $path;
	?>assets/css/main.css">
	<link rel="stylesheet" href="<?php echo $path; ?>assets/css/responsive.css">
	<link rel="stylesheet" href="<?php echo $path; ?>assets/css/logo.css">
<?php if (!empty($extraCss)) { foreach ($extraCss as $css) { ?>
	<link rel="stylesheet" href="<?php echo $css; ?>">
<?php }} ?>
<?php if (!empty($extraJs)) { foreach ($extraJs as $js) { ?>
	<script src="<?php echo $js; ?>"></script>
<?php }} ?>
</head>
<body>
	<?php include 'navigation-simple.php'; ?>


