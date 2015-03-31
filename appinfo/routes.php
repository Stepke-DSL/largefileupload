<?php

$this->create('largefileupload_index', '/')->action(
	function($params){
		require __DIR__.'/../index.php';
	}
);
