<!DOCTYPE html>
<html>
<head>
<?php
	function startsWith($haystack, $needle)
	{
	    return !strncmp($haystack, $needle, strlen($needle));
	}

	function addCss($dir){
		$filenames = scandir($dir);

		foreach ($filenames as $key => $filename) {
			if ($filename != '.' && $filename != '..' && !startsWith($filename, '.')){
				echo '<link rel="stylesheet" type="text/css" href="'.$dir.'/'.$filename.'">';
			}
		}
	}

	function addScript($dir){
		$filenames = scandir($dir);

		foreach ($filenames as $key => $filename) {
			if ($filename != '.' && $filename != '..' && !startsWith($filename, '.')){
				echo '<script type="text/javascript" src="'.$dir.'/'.$filename.'"></script>';
			}
		}
	}

	addCss('css');
	addScript('lib');
	addScript('js');

?>
<meta charset="utf-8">
	<title>Slider test</title>
</head>
<body>

	<div id="wrapper">
	
	<?php
		include 'main.html';
	?>	
	
	</div>

</body>
</html>

