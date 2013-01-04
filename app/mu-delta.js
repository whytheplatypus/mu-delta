
require.config({
    baseUrl: window.location.protocol + "//" + window.location.host + window.location.pathname.split("/").slice(0, -1).join("/"),
	paths: {
		"CodeMirror": "lib/CodeMirror/lib/codemirror",
		"keymaster": "lib/keymaster",
        //"MathJax": "MathJax/MathJax.js?config=TeX-AMS-MML_HTMLorMML",
        //"Rainbow":"rainbow/js/rainbow",
        "CodeMirror-xml":"lib/CodeMirror/mode/xml/xml",
        "CodeMirror-markdown":"lib/CodeMirror/mode/markdown/markdown",
        "CodeMirror-matchhighlighter":"lib/CodeMirror/lib/util/match-highlighter",
        "CodeMirror-formatting":"lib/CodeMirror/lib/util/formatting",
        "CodeMirror-foldcode":"lib/CodeMirror/lib/util/foldcode",
        "marked":"lib/marked"
    },
    waitSeconds: 15,
    shim: {
    	"CodeMirror":{
    		exports:"CodeMirror"
    	},
    	"keymaster":{
    		exports:"key"
    	},
    	/*"MathJax":{
    		exports:"MathJax"
    	},
    	"Rainbow":{
    		exports:"Rainbow"
    	},*/

    	"marked":{
    		exports:"marked"
    	},

    	"CodeMirror-xml":["CodeMirror"],
    	"CodeMirror-markdown":["CodeMirror", "CodeMirror-xml"],
    	"CodeMirror-matchhighlighter":["CodeMirror"],
    	"CodeMirror-formatting":["CodeMirror"],
    	"CodeMirror-foldcode":["CodeMirror"]
    },

});
  


require(['CodeMirror', 'keymaster', 'marked', 'CodeMirror-markdown', 'CodeMirror-matchhighlighter', 'CodeMirror-formatting', 'CodeMirror-foldcode'], function(CodeMirror, key, marked){

	var Editor = function(data){
		var self = this;
		
		self.file = false;

		function errorHandler(e) {
		  var msg = "";

		  switch (e.code) {
		    case FileError.QUOTA_EXCEEDED_ERR:
		    msg = "QUOTA_EXCEEDED_ERR";
		    break;
		    case FileError.NOT_FOUND_ERR:
		    msg = "NOT_FOUND_ERR";
		    break;
		    case FileError.SECURITY_ERR:
		    msg = "SECURITY_ERR";
		    break;
		    case FileError.INVALID_MODIFICATION_ERR:
		    msg = "INVALID_MODIFICATION_ERR";
		    break;
		    case FileError.INVALID_STATE_ERR:
		    msg = "INVALID_STATE_ERR";
		    break;
		    default:
		    msg = "Unknown Error";
		    break;
		  };

		  console.log("Error: " + msg);
		}

		//if I end up adding jQuery I'll just use toggleClass
		/*Element.prototype.toggleClass = function(className){
			if(this.className.match( /(?:^|\s)className(?!\S)/g)){
				this.className = this.className.replace( /(?:^|\s)className(?!\S)/g , '' );
			} else {
				this.className += " "+className;
			}
		}*/

		var editorDiv = document.getElementById('code');

		//Set up our CodeMirror editor
		var foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
		var editor = CodeMirror(editorDiv, {
			mode: "markdown",
			lineNumbers: true,
			value: data || "#New Markdown Document",
			onCursorActivity: function() {
				editor.matchHighlight("CodeMirror-matchhighlight");
				editor.setLineClass(hlLine, null, null);
				hlLine = editor.setLineClass(editor.getCursor().line, null, "activeline");
			},
			
			onChange:	function(){
				if(self.md){
					self.md.set("content", editor.getValue()); 
				}
				updatePreview();
				//clearTimeout(delay);
				//delay = setTimeout(updatePreview, 30);
			},
			
			lineWrapping: true,
			onGutterClick: foldFunc,
			smartIndent: false
		});
		var hlLine = editor.setLineClass(0, "activeline");

		//Set up our **marked** compiler
		marked.setOptions({
			gfm: true,
			pedantic: false,
			sanitize: true,
		});

		var openFile = function(){
			chrome.fileSystem.chooseEntry({ type: 'openWritableFile' }, fileChosen);
		};

		var fileChosen = function(path){
			console.log(path);
			loadFile(path);
			self.file = path;
			updatePath();
		}

		var updatePath = function(){
			chrome.fileSystem.getDisplayPath(self.file, function(displayPath){
				document.getElementById('path').innerHTML = displayPath;
			});
		}


		var writeToFile = function(path){
			path.createWriter(function(fileWriter) {
    			fileWriter.onerror = function(e) {
      				console.log("Write failed: " + e.toString());
    			};

    			var blob = new Blob([editor.getValue()]);
    			fileWriter.truncate(blob.size);
    			fileWriter.onwriteend = function() {
      				fileWriter.onwriteend = function(e) {
        				//handleDocumentChange(path.fullPath);
        				console.log("Write to "+path.fullPath+" completed");
      				};

      			fileWriter.write(blob);
    		}
  		}, errorHandler);

		};
		var saveFile = function(){
			if(self.file){
				writeToFile(self.file);
			} else {
				chrome.fileSystem.chooseEntry({ type: 'saveFile' }, function(path){
					writeToFile(path);
					self.file = path;
					updatePath();
				});
			}
		}

		var loadFile = function(path){
			if (path) {
				path.file(function(file) {
		      	var fileReader = new FileReader();

		      	fileReader.onload = function(e) {
		      	  	editor.setValue(e.target.result);
		      	};

		      	fileReader.onerror = function(e) {
		      	  	console.log("Read failed: " + e.toString());
		      	};

		      	fileReader.readAsText(file);
		    }, errorHandler);
		  }
		};

	    //make key work with textareas
	    key.filter = function(event){
	        var tagName = (event.target || event.srcElement).tagName;
	        // ignore keypressed in any elements that support keyboard data input
	        return true;//!(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
	    }
	    key('command+o', function(){openFile();});
	    key('command+s', function(){saveFile();});
	    key('command+n', function(){
	    	event.preventDefault();
	    	chrome.app.window.create('index.html', {
				frame: 'chrome', width: 720, height: 400
			});
		});
	    //add key commands
	    key('command+b', function(){
	        //var cursor_temp = self.input.getCursor();
	        var cursor_temp = editor.getCursor();
	        if(editor.getSelection()){
	            console.log('bold');
	            editor.replaceSelection('__' + editor.getSelection() + '__');
	        } else {

	            editor.replaceRange('____', cursor_temp);

	        }
	        cursor_temp.ch += 2;
	        editor.setCursor(cursor_temp);
	    });

	    key('command+i', function(){
	        var cursor_temp = editor.getCursor();
	        console.log('italic');
	        if(editor.getSelection()){
	            editor.replaceSelection('*' + editor.getSelection() + '*');
	        } else {

	            editor.replaceRange('**', cursor_temp);


	        }
	        cursor_temp.ch += 1;
	        editor.setCursor(cursor_temp);
	    });

	    key('command+k', function(){
	        console.log('code');
	        var cursor_temp = editor.getCursor();
	        if(editor.getSelection()){
	            editor.replaceSelection('`' + editor.getSelection() + '`');
	        } else {

	            editor.replaceRange('``', cursor_temp);


	        }
	        cursor_temp.ch += 1;
	        editor.setCursor(cursor_temp);
	    });

	    key('command+u', function(){
	        console.log('strikethrough');
	        var cursor_temp = editor.getCursor();
	        if(editor.getSelection()){
	            editor.replaceSelection('~' + editor.getSelection() + '~');
	        } else {

	            editor.replaceRange('~~', cursor_temp);


	        }
	        cursor_temp.ch += 1;
	        editor.setCursor(cursor_temp);
	    });

	    key('command+/', function(){
	        console.log('comment');
	        var cursor_temp = editor.getCursor();
	        if(editor.getSelection()){
	            editor.replaceSelection('<!--' + editor.getSelection() + '-->');
	        } else {

	            editor.replaceRange('<!---->', cursor_temp);


	        }
	        cursor_temp.ch += 4;
	        editor.setCursor(cursor_temp);
	    });
	    
	    key('command+p', function(event){
	        event.preventDefault();
	        self.print();
	    });

	    document.getElementById("save").addEventListener('click', function(){
	    	saveFile();
	    }, false);
	    document.getElementById("open").addEventListener('click', function(){
	    	openFile();
	    }, false);
	    document.getElementById("new").addEventListener('click', function(){
	    	chrome.app.window.create('index.html', {
				frame: 'chrome', width: 720, height: 400
			});
	    }, false);

		

		this.refresh = function(){
			var cursorPos = editor.getCursor();
			editor.setValue(self.md.get("content"));
			editor.refresh();
			editor.setCursor(cursorPos);
			
			//documentListScroll.refresh();
			//editorScroll.refresh();
			//previewScroll.refresh();
		}
		
		this.getValue = function(){
			return editor.getValue();
		}
		
		this.setValue = function(string){
			editor.setValue(string);
		}
		
		var updatePreview = function(){
	        var iframe = document.getElementById('preview');
			var message = {
				command: 'render',
			    context: marked(editor.getValue())
			};
			iframe.contentWindow.postMessage(message, '*');

		}
		
		var getSelectedRange = function() {
			return { from: editor.getCursor(true), to: editor.getCursor(false) };
		}
		
		var autoFormatSelection = function() {
			var range = getSelectedRange();
			editor.autoFormatRange(range.from, range.to);
		}
		
		var commentSelection = function(isComment) {
			var range = getSelectedRange();
			editor.commentRange(isComment, range.from, range.to);
		}

	    this.print = function(){
	    	console.log('printing...');
	    	var iframe = document.getElementById('preview');
			var message = {
				command: 'print',
			};
			document.getElementById('code').style.display='none';
			iframe.contentWindow.postMessage(message, '*');
	    	
	    };

	    this.toHTML = function(){
	    	var html = '<div id='+uid+'>'
	    		+ marked(editor.getValue())
	    		+ '<script type="text/x-mathjax-config">'
     				+"MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}});"
    			+'</script>'+
    			+'<script src=mathjax from cdn></script>'
    			+'<script>'
    				+'MathJax.Hub.Queue(["Typeset",MathJax.Hub]);//can i just typeset a div?'
            		+'Rainbow.color();'
    			+'</script>'
    			+'</div>'
    		return html;//then put this on the clipboard
	    };
		
		this.getScrollerElement = function(){
			return editor.getScrollerElement();
		};

		this.onResize = function(){

			var browserHeight = document.documentElement.clientHeight; 
			var browserWidth = document.documentElement.clientWidth; 
			editor.getScrollerElement().style.minHeight = (1 * browserHeight) + 'px' ;
			document.getElementById("code").style.width = (1/2 * browserWidth)+'px';
			document.getElementById("preview").style.width = (1/2 * browserWidth)+'px';
			document.getElementById("preview").style.height = browserHeight + 'px';


			editor.refresh();

		}

		this.onResize();
		updatePreview();
	}

	
	var editor = new Editor(false);

	//onresize = editor.onResize;

	window.addEventListener('message', function(event) {
	    var command = event.data.command;
	    var name = event.data.name || 'hello';
	   
	    switch(command) {
	      case 'print':
	        document.getElementById('preview').style.height = event.data.context +"px";
	       	document.getElementById('preview').style.width = "720px";
	        window.print();
	        editor.onResize();
	        document.getElementById('code').style.display='block';
	        break;
	    }
	});


    

});
