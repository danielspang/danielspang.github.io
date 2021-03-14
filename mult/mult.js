function update(res) {
    if (!res) {
        var a = Math.ceil(10 * Math.random());
        var b = Math.ceil(10 * Math.random());
        var c = a * b;
        res = "" + a + " ⋅ " + b + " = ";
        var next = res + c;
    }
    document.getElementsByTagName("div")[0].textContent = res;
    window.setTimeout(update, 3000, next)
}

update();
