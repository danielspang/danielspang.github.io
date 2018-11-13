(function() {
    var scripts = document.getElementsByTagName('script');
    var script = scripts[scripts.length - 1];
    console.log(document.currrentScript);
    console.log("currentScript: " + document.currrentScript.src + " last scripttag: " + script.src)
})()

