(function() {
    var scripts = document.getElementsByTagName('script');
    var script = scripts[scripts.length - 1];
    console.log(document.currentScript);
    console.log("currentScript: " + document.currentScript.src + " last scripttag: " + script.src)
})()

