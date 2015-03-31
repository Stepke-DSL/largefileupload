<?php

     $pathToFiles                                 =    'data/'.OCP\User::getUser().'/files/largefileupload/';      // Den Slash am Ende nicht vergessen!
	$pathToFilesTmp                              =    'data/'.OCP\User::getUser().'/largefileupload_tmp/';      	// Den Slash am Ende nicht vergessen!
     $maxSize                                     =    4194304;            // 4 MB Maximum, sonst kann es zum Browser-crash führen
     $allowedFileTypes                            =    array();    	// Erlaubte MIME-Types.

     switch ($_POST['Action'])
          {
          
          case 'getServerConfig':
               {
               
               $iniSize                           =    ini_get('upload_max_filesize');
               $entitys                           =    array(0 => 'B', 1 => 'K', 2 => 'M', 3 => 'G');
               $entity                            =    substr($iniSize, count($iniSize) - 2, 1);
               
               $size                              =    substr($iniSize, 0, count($iniSize) - 2);
               $i                                 =    0;
               
               while($entitys[$i] != $entity)
                    {
                    
                    $size                         *=   1024;
                    $i++;
                    
                    }
               
               $size                              =    (($size > $maxSize)?$maxSize:$size);
                    
               $ServerConfig                      =    new SimpleXMLElement('<ServerConfig/>');
               $ServerConfig -> addChild('MaxFileSize', $size);
               $el                                =    $ServerConfig -> addChild('MIME');

               foreach ($allowedFileTypes as $key => $val)
                       {

                       $el -> addChild('MIME-Type', $val);

                       }

               header('Content-Type: text/xml; charset=UTF-8');
                    
               echo $ServerConfig -> asXML();
               
               break;
               
               }
          case 'upload':
               {

			if (!file_exists($pathToFilesTmp))
				{

				mkdir($pathToFilesTmp);

				}

			if (!file_exists($pathToFiles))
				{

				mkdir($pathToFiles);

				}

               move_uploaded_file($_FILES['fileToUpload']['tmp_name'], $pathToFilesTmp.$_POST['fileName'].'_'.$_POST['fileIndex']);
               
               if (isset($_POST['fileDone'])) {
               
                    $target                       =    $pathToFiles.$_POST['fileName'];
                    $dst                          =    fopen($target, 'wb');                    
                    $i                            =    0;
                    
                    while (file_exists($pathToFilesTmp.$_POST['fileName'].'_'.$i)) {
                    
                         $src                     =    fopen($pathToFilesTmp.$_POST['fileName'].'_'.$i, 'rb');
                         stream_copy_to_stream($src, $dst);
                         fclose($src);
                         unlink($pathToFilesTmp.$_POST['fileName'].'_'.$i);
                         $i++;
                    
                         }
                    
                    }
               
               echo 'Upload abgeschlossen.';
               
               break;
               
               }
          case 'delParts':
               {
               
               $i                                 =    0;
               
               while (file_exists($pathToFiles.$_POST['fileName'].'_'.$i)) {
                    
                    unlink($pathToFiles.$_POST['fileName'].'_'.$i);
                    $i++;
                    
                    }
                    
               echo $i.' Teil-Datei(en) gelöscht!';
               
               break;
               
               }
          default:
               {
               
               echo '0';
               
               }
          
          }

?>