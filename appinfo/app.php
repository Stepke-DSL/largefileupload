<?php

namespace OCA\LargeFileUpload;


//\OCP\App::registerAdmin('largefileupload', 'admin/settings');

\OCP\App::addNavigationEntry( array(
	
	// the string under which your app will be referenced
	// in owncloud, for instance: \OC_App::getAppPath('APP_ID')
	'id' => 'largefileupload',

	// sorting weight for the navigation. The higher the number, the higher
	// will it be listed in the navigation
	'order' => 74,
	
	// the route that will be shown on startup
	'href' => \OCP\Util::linkToRoute('largefileupload_index'),
	
	// the icon that will be shown in the navigation
	'icon' => \OCP\Util::imagePath('largefileupload', 'largefile.png' ),
	
	// the title of your application. This will be used in the
	// navigation or on the settings page of your app
	'name' => \OC_L10N::get('largefileupload')->t('Large File Upload')
	
));
