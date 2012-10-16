
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

	var Editor = function(){
		var self = this;
		
		var editorDiv = document.getElementById('code');

		//Set up our CodeMirror editor
		var foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
		var editor = CodeMirror(editorDiv, {
			mode: "markdown",
			lineNumbers: true,
			value: "##New Markdown Document",
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
			// callback for code highlighter
			/*highlight: function(code, lang) {
				if (lang === 'js') {
					return javascriptHighlighter(code);
				}
				return code;
			}*/
		});

	    //make key work with textareas
	    key.filter = function(event){
	        var tagName = (event.target || event.srcElement).tagName;
	        // ignore keypressed in any elements that support keyboard data input
	        return true;//!(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
	    }
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
	    
	    var self = this;
	    key('command+p', function(event){
	        event.preventDefault();
	        self.print();
	    });

		

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
	        if(!$('#code').hasClass("closed"))
	            $('#code').addClass("closed");
	        if(!$('#preview').hasClass("full_screen"))
	            $('#preview').addClass("full_screen");

	        window.print();
	    }
		
		this.getScrollerElement = function(){
			return editor.getScrollerElement();
		}

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
	}

	var editor = new Editor();

	onresize = editor.onResize;

    

});
