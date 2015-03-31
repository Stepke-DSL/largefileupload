/**********************************************************************
 *                                                                    *
 *        © Copyright by Stephan Neblung, http://www.neblung.info     *
 *                                                                    *
 *                                                                    *
 *        Bei Verwendung von HTML5FileUpload bitte einen Link         *
 *        zu meiner Homepage auf der Seite, auf der HTML5FileUpload   *
 *        verwendet wird, einfuegen.                                  *
 *                                                                    *
 **********************************************************************/   

var HTML5FileUpload = 
     {
     
     http                                         :    null,                                        // HTTP-Request-Objekt
     Counter                                      :    0,                                           // Zaehler fuer die Datei, die aktuell hochgeladen wird.
     Files                                        :    new Array(),                                 // Liste der zu uebertragenden Dateien.
     phpFile                                      :    'php/html5fileupload.php',                   // PHP-Datei, welche die Arbeiten auf dem Server erledigt.
     maxSize                                      :    2048,                                        // Maximale Dateigroesse in Bytes.
     allowedFileTypes                             :    new Array(),        					// Zugelassene MIME-Types.
     Container                                    :    document.getElementsByTagName('body')[0],    // Das Element in dem die Darstellungen angezeigt werden sollen.
     UploadPossible                               :    true,                                        // Speichert, ob der HTML5-Fileupload mit dem Browser moeglich ist.
     UploadInProgress                             :    false,                                       // Speichert, ob gerade Datein hochgeladen werden.
     tmpUebertragen                               :    0,                                           // Speichert die bisher von einer Datei übertragenen Bytes
     Index                                        :    0,                                           // Speichert den Index des aktuell übertragenen Teilstücks
     maxPicSizeForPrev                            :    0,                                     		// Maximale Dateigröße des Bildes für eine Vorschau. Ist das Bild größer, wird keine Vorschau erstellt. 0 = keine Vorschau (Bei zu großen Bildern kann es dazu kommen, dass der Browser abstürzt.)
	lang                                         :    new Array(),                                 // Speichert die Übersetzungen.
     
     
     // Initialisieren des Uploads. (pruefen, ob der HTML5-Upload moeglich ist; abrufen der Serverkonfiguration; erstellen der benoetigten Elemente im HTML-Dokument)
     
     init                                         :    function()
          {

          if (window.XMLHttpRequest)
               {

               this.http                          =    new XMLHttpRequest();

               }
          else if (window.ActiveXObject)
               {

               this.http                          =    new ActiveXObject('Microsoft.XMLHTTP');

               }

		var loc                                 =    document.location.href.replace('/index.php', '');
		var language                            =    (navigator.language ? navigator.language : navigator.browserLanguage);

		if (language.length < 5) {
			language                           +=   '-' + language.toUpperCase();
			}

          this.http.open('post', loc + 'lang/' + language + '.xml', false);
          this.http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
          this.http.send('');

		if (this.http.status == 404) {
			this.http.open('post', loc + 'lang/en-EN.xml', false);
	          this.http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
	          this.http.send('');
			}
			
          var xml                                 =    this.http.responseXML.getElementsByTagName('Translation')[0];

		for (i = 0; i < xml.childNodes.length; i++) {
			if (xml.childNodes[i].nodeName != '#text') {
				this.lang[xml.childNodes[i].nodeName]	=    xml.childNodes[i].firstChild.nodeValue;
				}
			}
          
          if (!this.checkUploadPossible())
               {
               
               // Der HTML5-Dateiupload ist mit dem Browser nicht moeglich.
               
               this.Container.appendChild(document.createTextNode(this.lang['error_no_html5']));
               this.Container.appendChild(document.createElement('br'));
               var link                           =    document.createElement('a');
               link.href                          =    'http://www.getfirefox.com';
               link.target                        =    '_blank';
               link.title                         =    'Firefox';
               link.appendChild(document.createTextNode('>>> Firefox <<<'));
               this.Container.appendChild(link);
               link                               =    null;
               
               }
          else
               {
               
               // HTML5-Dateiupload ist mit dem Browser moeglich.

               // Abrufen der Serverkonfiguration.
               
               this.getServerConfig();
               
               // Erstellen der benoetigten Elemente im HTML-Dokument.
               
               // 'Dropbox' anzeigen.
               
               var div                            =    document.createElement('div');
               div.className                      =    'HTML5FileUpload_DropBox';
               div.appendChild(document.createTextNode(this.lang['drag_drop']));
               var p                              =    document.createElement('p');
               p.className                        =    'HTML5FileUpload_Link';
               var link                           =    document.createElement('a');
               link.href                          =    'http://www.neblung.info';
               link.target                        =    '_blank';
               link.title                         =    '© Copyright by Stephan Neblung, http://www.neblung.info';
               link.appendChild(document.createTextNode('http://www.neblung.info'));
               link.style.size                    =    '8px';
               p.appendChild(link);
               link                               =    null;
               div.appendChild(p);
               p                                  =    null;
               this.Container.appendChild(div);
               div.addEventListener('dragover', this.handleDragOver, false);
               div.addEventListener('drop', this.handleDrop, false);
               div                                =    null;
               
               // Maximale Dateigroesze anzeigen.
               
               var span                           =    document.createElement('span');
               span.className                     =    'HTML5FileUpload_MaxFileSize';
               span.appendChild(document.createTextNode(this.lang['max_part_size'] + ': ' + this.fileSize(this.maxSize)));
               this.Container.appendChild(span);
               span                               =    null;
               
               this.Container.appendChild(document.createElement('br'));
               
               // Uploadbutton
               
               var btn                            =    document.createElement('input');
               btn.type                           =    'button';
               btn.name                           =    'HTML5FileUpload_Upload';
               btn.id                             =    btn.name;
               btn.className                      =    'HTML5FileUpload_Button';
               btn.value                          =    this.lang['btn_upload'];
               btn.onclick                        =    this.uploadStart;
               this.Container.appendChild(btn);
               btn                                =    null;
               
               // alle Uploads abbrechen
               
               btn                                =    document.createElement('input');
               btn.type                           =    'button';
               btn.name                           =    'HTML5FileUpload_Abort_All';
               btn.id                             =    btn.name;
               btn.className                      =    'HTML5FileUpload_Button';
               btn.value                          =    this.lang['btn_abort_all'];
               btn.onclick                        =    this.abortAll;
               btn.style.display                  =    'none';
               this.Container.appendChild(btn);
               btn                                =    null;
               
               this.Container.appendChild(document.createElement('br'));
               
               // Liste leeren und alle Variablen zuruecksetzen.
               
               btn                                =    document.createElement('input');
               btn.type                           =    'button';
               btn.name                           =    'HTML5FileUpload_Reset';
               btn.id                             =    btn.name;
               btn.className                      =    'HTML5FileUpload_Button';
               btn.value                          =    this.lang['btn_reset'];
               btn.onclick                        =    this.clearList;
               btn.style.display                  =    'none';
               this.Container.appendChild(btn);
               btn                                =    null;
               
               }
          
          },
     
     // Pruefen, ob der HTML5-Fileupload mit dem Browser moeglich ist.
     
     checkUploadPossible                          : function()
          {
          
          if (!window.File || !window.FileReader || !window.FileList)
               {
               
               // HTML5-Fileupload ist mit dem Browser nicht moeglich.
               
               this.UploadPossible                =    false;
               return false;
               
               }
          else
               {
               
               // HTML5-Fileupload ist moeglich.
               
               return true;
               
               }
          
          },
          
     // Abrufen der Servereinstellungen zum Fileupload.
     
     getServerConfig                              :    function()
          {
          
          if (window.XMLHttpRequest)
               {
               
               this.http                          =    new XMLHttpRequest();
               
               }
          else if (window.ActiveXObject)
               {
               
               this.http                          =    new ActiveXObject('Microsoft.XMLHTTP');
               
               }
               
          this.http.open('post', this.phpFile, false);
          this.http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
          this.http.send('Action=getServerConfig');
          
          var xml                                 =    this.http.responseXML;
          this.maxSize                            =    xml.getElementsByTagName('MaxFileSize')[0].firstChild.nodeValue;
          var mime                                =    xml.getElementsByTagName('MIME-Type');

          for(i = 0; i < mime.length; i++)
                {

                this.allowedFileTypes[this.allowedFileTypes.length]  	=    mime[i].firstChild.nodeValue;

                }
          
          if (this.http.getResponseHeader('Content-Type').indexOf('text/xml') < 0)
               {
               
               alert('Response ist nicht in XML!\r\n\r\n' + this.http.responseText);
               return false;
               
               }
          
          },
     
     // Dateigroesze 'humanreadable'.
          
     fileSize                                     :    function(s)
          {
          
          var i                                   =    0;
          var type                                =    new Array('Byte', 'KB', 'MB', 'GB');
          
          while (s > 1024)
               {
               
               s                                  =    s / 1024;
               i++;
               
               }
               
          s                                       =    Math.round(s * 100) / 100;
               
          return s + ' ' + type[i];
          
          },
          
     // Dateien werden ueber die 'Dropbox' gezogen.
          
     handleDragOver                               :    function(evt) 
          {
    
          evt.stopPropagation();
          evt.preventDefault();
          evt.dataTransfer.dropEffect             =    'copy';
  
          },
          
     // Datein werden ueber der 'Dropbox' gehen gelassen.
          
     handleDrop                                   :    function(evt)
          {
          
          evt.stopPropagation();
          evt.preventDefault();
          
          // Wenn ein Upload aktiv ist, werden keine neuen Dateien angenommen.
          
          if (this.UploadInProgress)
               {
               
               return false;
               
               }
          
          // Dateien in eine Filelist laden.
          
          var fl                                  =    evt.dataTransfer.files;
          
          // Tabelle mit den Dateinamen, Dategroesze und Fortschrittsbalken anzeigen.
          
          var tbl                                 =    null;
          
          if (document.getElementById('HTML5FileUpload_Tbl'))
               {
               
               tbl                                =    document.getElementById('HTML5FileUpload_Tbl');
               
               }
          else
               {
               
               tbl                                =    document.createElement('table');
               tbl.id                             =    'HTML5FileUpload_Tbl';
               tbl.className                      =    tbl.id;
               HTML5FileUpload.Container.appendChild(tbl);
               
               }
               
          var tr                                  =    null;
          var td                                  =    null;
          var span                                =    null;
          
          // Dateiinformationen in der Tabelle darstellen.
               
          for (i = 0; i < fl.length; i++)
               {
               
               // Pruefen, ob die Dateitypen erlaubt sind, und ob die Dateien nicht zu grosz sind.
               
               if ((HTML5FileUpload.allowedFileTypes.indexOf(fl[i].type) == -1 && HTML5FileUpload.allowedFileTypes.length != 0))
                    {
                    
                    // Dateityp ist nicht erlaubt.
                    
                    continue;
                    
                    }
               
               tr                                 =    document.createElement('tr');
               tr.id                              =    'HTML5FileUpload_tr_' + fl[i].name;
               td                                 =    document.createElement('td');
               
               td.appendChild(document.createTextNode(fl[i].name));
               td.appendChild(document.createElement('br'));
               span                               =    document.createElement('span');
               span.className                     =    'FileSize';
               span.appendChild(document.createTextNode(HTML5FileUpload.fileSize(fl[i].size).replace('.', ',')));
               td.appendChild(span);
               span                               =    null;
               tr.appendChild(td);
               td                                 =    null;
               
               td                                 =    document.createElement('td');
               
               // Progressbar
               
               pb                                 =    document.createElement('div');
               pb.className                       =    'HTML5FileUpload_ProgressContainer';
               var pgb                            =    document.createElement('div');
               pgb.className                      =    'HTML5FileUpload_Progress';
               pgb.id                             =    'HTML5FileUpload_Progress' + fl[i].name;
               pb.appendChild(pgb);
               var pgn                            =    document.createElement('div');
               pgn.className                      =    'HTML5FileUpload_Percent';
               pgn.id                             =    'HTML5FileUpload_Percent' + fl[i].name;
               pgn.appendChild(document.createTextNode('0 %'));
               pb.appendChild(pgn);
               td.appendChild(pb);
               
               // Entfernen-Button
     
               var div_cancel                     =    document.createElement('div');
               div_cancel.className               =    'HTML5FileUpload_Cancel';
               div_cancel.id                      =    'HTML5FileUpload_Close_' + fl[i].name;
               div_cancel.onclick                 =    new Function('HTML5FileUpload.delItem(this.parentNode.parentNode)');
               div_cancel.title                   =    HTML5FileUpload.lang['btn_remove'];

			var img                            =    document.createElement('img');
               img.src                            =    'img/cancel.png';
               img.alt                            =    HTML5FileUpload.lang['btn_remove'];
               img.title                          =    img.alt;
               img.onclick                        =    new Function('HTML5FileUpload.delItem(this.parentNode.parentNode.parentNode)');
               //div_cancel.appendChild(img);
               td.appendChild(div_cancel);
               
               // Abbrechen des Dateiuploads.
               
               var ab                             =    document.createElement('button');
               ab.value                           =    HTML5FileUpload.lang['btn_abort'];
               ab.appendChild(document.createTextNode(ab.value));
               ab.onclick                         =    HTML5FileUpload.abortOne;
               ab.id                              =    'HTML5FileUpload_Abort_' + fl[i].name;
               ab.style.display                   =    'none';
               ab.className                       =    'HTML5FileUpload_Button';
               td.appendChild(ab);
               ab                                 =    null;
               
               tr.appendChild(td);
               td                                 =    null;
               
               // Vorschaubild, falls möglich
               
               td                                 =    document.createElement('td');
               td.className                       =    'HTML5FileUpload_PicPreview_td';
               td.id                              =    'HTML5FileUpload_PicPreview_td_' + fl[i].name;
               
               if (fl[i].type.match('image.*') && fl[i].size < HTML5FileUpload.maxPicSizeForPrev) {
                    
                    var reader                    =    new FileReader();
                    reader.onload                 =    (function(file) {
                         return function(e) {
                              
                              var span            =    document.createElement('span');
                              span.innerHTML      =    ['<img class="HTML5FileUpload_PicPreview" src="', e.target.result,
                                                       '" title="', file.name, '" />'].join('');
                              document.getElementById('HTML5FileUpload_PicPreview_td_' + file.name).insertBefore(span, null);
                              
                              };
                         })(fl[i]);
                         
                    reader.readAsDataURL(fl[i]);
                    
                    }
                    
               tr.appendChild(td);
               td                                 =    null;
               
               tbl.appendChild(tr);
               tr                                 =    null;
               
               HTML5FileUpload.Files[HTML5FileUpload.Files.length]    =    fl[i];
               
               }
               
               var tr                             =    tbl.getElementsByTagName('tr');
               var td                             =    tr[tr.length-1].firstChild;
               
               while (td != null) {
                    
                    td.className                  +=   ' HTML5FileUpload_last_td';
                    td                            =    td.nextSibling;
                    
                    }
               
          },
          
     // Datei von der Liste entfernen
     
     delItem                                      :    function(el)
          {
          
          if (this.Files.length > 0)
               {
          
               var tmp                            =    new Array();
                    
               for (i = 0; i < this.Files.length; i++)
                    {
                         
                    if (this.Files[i].name != el.childNodes[0].firstChild.nodeValue)
                         {
                         
                         tmp[tmp.length]          =    this.Files[i];
                         
                         }
                    
                    }
                    
               this.Files                         =    null;
               this.Files                         =    tmp;
                    
               }
               
          el.parentNode.removeChild(el);
          
          },
          
     // Upload
     
     uploadStart                                  :    function()
          {
         
          if (HTML5FileUpload.UploadInProgress || HTML5FileUpload.Files.length < 1)
               {
               
               return false;
               
               }

          if (window.Notification) {
               Notification.requestPermission();
               }
               
          HTML5FileUpload.UploadInProgress        =    true;
          document.getElementById('HTML5FileUpload_Upload').className           =    'HTML5FileUpload_Button_inactive';
          document.getElementById('HTML5FileUpload_Abort_All').style.display    =    'inline';
          
          HTML5FileUpload.uploadFiles();
          
          },
          
     // Leitet den Upload einer Datei ein.
          
     uploadFiles                                  :    function()
          {
          
          HTML5FileUpload.tmpUebertragen          =    0;
          HTML5FileUpload.Index                   =    0;
          
          // prüfen, ob eine weitere Datei hochgeladen werden muss
          
          if (HTML5FileUpload.Counter == HTML5FileUpload.Files.length) {
            
               return false;
               
               }
          
          HTML5FileUpload.uploadBlob(HTML5FileUpload.Files[HTML5FileUpload.Counter]);
          
          },
          
     uploadBlob                                   :    function(Blob, Index, Start)
          {
          
          if (!Index) {
               
               Index                              =    0;
               
               }
               
          if (!Start) {
               
               Start                              =    0;
               
               }
          
          document.getElementById('HTML5FileUpload_Abort_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display   =    'inline';
          document.getElementById('HTML5FileUpload_Close_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display   =    'none';
                    
          var xhr = new XMLHttpRequest();
          var fd = new FormData();
          var chunk;
          
          // Datei zerstückeln
    
          if (Blob.slice) {
               
               chunk = Blob.slice(Start, (parseInt(Start) + parseInt(HTML5FileUpload.maxSize)));
               
               }
          else if (Blob.webkitSlice) {
               
               chunk = Blob.webkitSlice(Start, (parseInt(Start) + parseInt(HTML5FileUpload.maxSize)));
               
               }
          else if (Blob.mozSlice) {
               
               chunk = Blob.mozSlice(Start, (parseInt(Start) + parseInt(HTML5FileUpload.maxSize)));
               
               }               
          
          // prüfen, ob das letzte Teil hochgeladen wird
          
          if ((parseInt(Start) + parseInt(HTML5FileUpload.maxSize)) > Blob.size) {
               
               fd.append('fileDone', '1');
               
               }
               
          //prüfen, ob die Datei zerteilt werden muss
          
          if (HTML5FileUpload.maxSize > HTML5FileUpload.Files[HTML5FileUpload.Counter].size) {
               
               chunk                              =    Blob;
               
               }
               
          fd.append('fileToUpload', chunk);
          fd.append('fileName', Blob.name);
          fd.append('fileIndex', Index);
          fd.append('Action', 'upload');
          
          xhr.open('POST', HTML5FileUpload.phpFile);
          xhr.upload.addEventListener('progress', HTML5FileUpload.uploadProgress, false);
          xhr.addEventListener('load', HTML5FileUpload.uploadComplete, false);
          xhr.addEventListener('error', HTML5FileUpload.uploadFailed, false);
          xhr.addEventListener('abort', HTML5FileUpload.uploadCanceled, false);
          HTML5FileUpload.http                    =    xhr;
          xhr.send(fd);
          
          
          },
          
     // Es wird gerade eine Datei uebertragen.
          
     uploadProgress                               :    function(evt)
          {
          
          if (evt.lengthComputable) 
               {
    
               var percentComplete                =    Math.round((parseInt(HTML5FileUpload.tmpUebertragen) + parseInt(evt.loaded)) * 100 / parseInt(HTML5FileUpload.Files[HTML5FileUpload.Counter].size));//Math.round(evt.loaded * 100 / evt.total);
               
               if (percentComplete > 100) {
                    
                    percentComplete               =    100;
                    
                    }
               
               document.getElementById('HTML5FileUpload_Percent' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).innerHTML           =    percentComplete.toString() + '%';
               document.getElementById('HTML5FileUpload_Progress' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.width        =    percentComplete * 2 + 'px';
               document.getElementById('HTML5FileUpload_Progress' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.borderRight  =    '1px solid #555555';
  
               }
  
          else 
               {
    
               document.getElementById('HTML5FileUpload_Percent' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).innerHTML           =    'nicht kalkulierbar';
  
               }
          
          },
          
     // Die Datei wurde erfolgreich uebertragen.
          
     uploadComplete                               :    function(evt)
          {

		HTML5FileUpload.tmpUebertragen          =    HTML5FileUpload.maxSize * (parseInt(HTML5FileUpload.Index) + 1);

	     // prüfen, ob noch weitere Teile übertragen werden müssen

	     if (HTML5FileUpload.tmpUebertragen < HTML5FileUpload.Files[HTML5FileUpload.Counter].size) {

	          HTML5FileUpload.Index++;
	          HTML5FileUpload.uploadBlob(HTML5FileUpload.Files[HTML5FileUpload.Counter], HTML5FileUpload.Index, HTML5FileUpload.tmpUebertragen);
	          return false;

	          }

	     HTML5FileUpload.Index                   =    0;
	     HTML5FileUpload.tmpUebertragen          =    0;
	     document.getElementById('HTML5FileUpload_Percent' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).innerHTML                =    '100%';
	     document.getElementById('HTML5FileUpload_Progress' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.width             =    '200px';
	     document.getElementById('HTML5FileUpload_Progress' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.borderRight       =    '';
	     console.log('Datei "' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name + '" hochgeladen.');
	     document.getElementById('HTML5FileUpload_Abort_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display             =    'none';

	     document.getElementById('HTML5FileUpload_tr_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).className                    =    'HTML5FileUpload_Complete';
  
          HTML5FileUpload.Counter++;
          
          // Pruefen, ob weitere Dateien zum Upload in der Liste sind.
  
          if (HTML5FileUpload.Counter < HTML5FileUpload.Files.length)
               {
     
               HTML5FileUpload.uploadFiles();
          
               }
          else
               {
     
               HTML5FileUpload.Counter            =    0;
               HTML5FileUpload.Files              =    new Array();
               document.getElementById('HTML5FileUpload_Abort_All').style.display                                                           =    'none';
               document.getElementById('HTML5FileUpload_Reset').style.display                                                               =    'inline';

               if (window.Notification) {
                    var notification         = new Notification(HTML5FileUpload.lang['notification_title'], {dir:"auto",lang:"",body:HTML5FileUpload.lang['notification_body_done']});
                    }

               alert(HTML5FileUpload.lang['done']);
     
               }
          
          },
          
     // Fehler beim Upload der Datei.
          
     uploadFailed                                 :    function(evt)
          {
          
          document.getElementById('HTML5FileUpload_Abort_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display             =    'none';
          document.getElementById('HTML5FileUpload_tr_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).className                    =    'HTML5FileUpload_Progress_Aborted';
          document.getElementById('HTML5FileUpload_Close_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display             =    'none';
          
          },
          
     // Der Upload wurde vom User, oder vom Browser abgebrochen. (Verbindung abgebrochen)
          
     uploadCanceled                               :    function(evt)
          {
          
          document.getElementById('HTML5FileUpload_Abort_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display             =    'none';
          document.getElementById('HTML5FileUpload_tr_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).className                    =    'HTML5FileUpload_Progress_Aborted';
          document.getElementById('HTML5FileUpload_Close_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display             =    'none';
     
          // bisher hochgeladene Teile löschen
          
          var xhr                                 =    new XMLHttpRequest();
          var fd                                  =    new FormData();
          
          xhr.open('POST', HTML5FileUpload.phpFile);
          fd.append('fileName', HTML5FileUpload.Files[HTML5FileUpload.Counter].name);
          fd.append('Action', 'delParts');
          xhr.send(fd);
          
          },
          
     // Den aktuellen Upload abbrechen.
          
     abortOne                                     :    function()
          {
          
          if (HTML5FileUpload.http == null)
               {
          
               return false;
          
               }
     
          HTML5FileUpload.http.abort();
          HTML5FileUpload.Index                   =    0;
          HTML5FileUpload.tmpUpload               =    0;
          document.getElementById('HTML5FileUpload_Percent' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).innerHTML                +=   ' abgebrochen';
          document.getElementById('HTML5FileUpload_tr_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).className                    =    'HTML5FileUpload_Progress_Aborted';
          document.getElementById('HTML5FileUpload_Close_' + HTML5FileUpload.Files[HTML5FileUpload.Counter].name).style.display             =    'none';
     
          HTML5FileUpload.Counter++;
          HTML5FileUpload.uploadFiles();
          
          },
          
     // Alle noch anstehenden, und den aktuellen Upload abbrechen.
          
     abortAll                                     :    function()
          {
          
          if (HTML5FileUpload.http == null)
               {
          
               return false;
          
               }
     
          HTML5FileUpload.http.abort();
     
          for (i = HTML5FileUpload.Counter; i < HTML5FileUpload.Files.length; i++)
               {
          
               document.getElementById('HTML5FileUpload_Percent' + HTML5FileUpload.Files[i].name).innerHTML                                 +=   'abgebrochen';
               document.getElementById('HTML5FileUpload_tr_' + HTML5FileUpload.Files[i].name).className                                     =    'HTML5FileUpload_Progress_Aborted';
          
               document.getElementById('HTML5FileUpload_Abort_' + HTML5FileUpload.Files[i].name).style.display                              =    'none';
               document.getElementById('HTML5FileUpload_Close_' + HTML5FileUpload.Files[i].name).style.display                              =    'none';
          
               }
          
          HTML5FileUpload.Files                   =    null;
          HTML5FileUpload.Files                   =    new Array();
          document.getElementById('HTML5FileUpload_Abort_All').style.display                                                                =    'none';
          document.getElementById('HTML5FileUpload_Reset').style.display                                                                    =    'inline';
          
          },
          
     // Alle Daten zuruecksetzen.
          
     clearList                                    :    function()
          {
          
          HTML5FileUpload.Container.removeChild(document.getElementById('HTML5FileUpload_Tbl'));
          HTML5FileUpload.Files                   =    null;
          HTML5FileUpload.Files                   =    new Array();
          HTML5FileUpload.UploadInProgress        =    false;
          HTML5FileUpload.Counter                 =    0;
          document.getElementById('HTML5FileUpload_Upload').className                                                                       =    'HTML5FileUpload_Button';
          document.getElementById('HTML5FileUpload_Reset').style.display                                                                    =    'none';    
          
          }
     
     }