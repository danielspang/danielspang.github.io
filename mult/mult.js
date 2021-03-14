function update(res) {
    if (!res) {
        var a = Math.ceil(10 * Math.random());
        var b = Math.ceil(10 * Math.random());
        var c = a * b;
        res = "" + a + " ⋅ " + b + " = ";
        var next = res + c;
    }
    document.getElementsByTagName("div")[0].textContent = res;
    window.setTimeout(update, 1000 * time(a,b), next)
}

function time(a, b) {
    if (!a) {
        return 4;
    }
    var easy = [1,2,10];
    var medium = [3,4,5];
    var hard = [6,7,8,9];
    if (easy.includes(a) || easy.includes(b)) {
        return 3;
    } else if (medium.includes(a) && medium.includes(b)) {
        return 4;
    } else {
        return 6;
    }
}

update();