<?php

\OCP\User::checkLoggedIn();
\OCP\App::checkAppEnabled('largefileupload');

\OCP\Util::addScript('largefileupload', 'html5fileupload');
\OCP\Util::addScript('largefileupload', 'html5fileupload_create');
\OCP\Util::addStyle('largefileupload', 'html5fileupload');

$tpl = new OCP\Template("largefileupload", "main", "user");
$tpl->printPage();
