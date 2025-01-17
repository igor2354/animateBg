
// оригинл скрипта https://codepen.io/alexzaworski/pen/mEkvAG

let collectionItemAnimate = Array.prototype.slice.call(document.querySelectorAll('.animate-canvas'));

collectionItemAnimate.forEach(function (item, i) {
    let canvasElement = collectionItemAnimate[i];

    let ctx = canvasElement.getContext("2d");
    let parentCanvas = canvasElement.parentNode;
    let cH;
    let cW;
    let bgColor = "#23252A";
    let animations = [];
    let circles = [];

    let colorPicker = (function () {
        let colors = ["#FF6138", "#FFBE53", "#2980B9", "#282741"];
        let index = 0;
        function next() {
            index = index++ < colors.length - 1 ? index : 0;
            return colors[index];
        }
        function current() {
            return colors[index]
        }
        return {
            next: next,
            current: current
        }
    })();

    function removeAnimation(animation) {
        let index = animations.indexOf(animation);
        if (index > -1) animations.splice(index, 1);
    }

    function calcPageFillRadius(x, y) {
        let l = Math.max(x - 0, cW - x);
        let h = Math.max(y - 0, cH - y);
        return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
    }

    function addClickListeners() {
        parentCanvas.addEventListener("touchstart", handleEvent);
        parentCanvas.addEventListener("mousedown", handleEvent);
    };

    function handleEvent(e) {
        // отключение клика на мобилках
        // if (e.touches) {
        //     e.preventDefault();
        //     e = e.touches[0];
        // }
        let currentColor = colorPicker.current();
        let nextColor = colorPicker.next();
        let targetR = calcPageFillRadius(e.pageX, e.pageY);
        let rippleSize = Math.min(200, (cW));
        let minCoverDuration = 750;

        let pageFill = new Circle({
            x: e.pageX - parentCanvas.offsetLeft,
            y: e.pageY - parentCanvas.offsetTop,
            r: 0,
            fill: nextColor
        });
        let fillAnimation = anime({
            targets: pageFill,
            r: targetR,
            duration: Math.max(targetR / 2, minCoverDuration),
            easing: "easeOutQuart",
            complete: function () {
                bgColor = pageFill.fill;
                removeAnimation(fillAnimation);
            }
        });

        let ripple = new Circle({
            x: e.pageX - parentCanvas.offsetLeft,
            y: e.pageY - parentCanvas.offsetTop,
            r: 0,
            fill: currentColor,
            stroke: {
                width: 3,
                color: currentColor
            },
            opacity: 1
        });
        let rippleAnimation = anime({
            targets: ripple,
            r: rippleSize,
            opacity: 0,
            easing: "easeOutExpo",
            duration: 900,
            complete: removeAnimation
        });

        let particles = [];
        for (let i = 0; i < 32; i++) {
            let particle = new Circle({
                x: e.pageX - parentCanvas.offsetLeft,
                y: e.pageY - parentCanvas.offsetTop,
                fill: currentColor,
                r: anime.random(24, 48)
            })
            particles.push(particle);
        }
        let particlesAnimation = anime({
            targets: particles,
            x: function (particle) {
                return particle.x + anime.random(rippleSize, -rippleSize);
            },
            y: function (particle) {
                return particle.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15);
            },
            r: 0,
            easing: "easeOutExpo",
            duration: anime.random(1000, 1300),
            complete: removeAnimation
        });
        animations.push(fillAnimation, rippleAnimation, particlesAnimation);
    }

    function extend(a, b) {
        for (let key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }

    let Circle = function (opts) {
        extend(this, opts);
    }

    Circle.prototype.draw = function () {
        ctx.globalAlpha = this.opacity || 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
        if (this.stroke) {
            ctx.strokeStyle = this.stroke.color;
            ctx.lineWidth = this.stroke.width;
            ctx.stroke();
        }
        if (this.fill) {
            ctx.fillStyle = this.fill;
            ctx.fill();
        }
        ctx.closePath();
        ctx.globalAlpha = 1;
    }

    let animate = anime({
        duration: Infinity,
        update: function () {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, cW, cH);
            animations.forEach(function (anim) {
                anim.animatables.forEach(function (animatable) {
                    animatable.target.draw();
                });
            });
        }
    });

    let resizeCanvas = function () {
        cW = parentCanvas.clientWidth;
        cH = parentCanvas.clientHeight;
        canvasElement.width = cW;
        canvasElement.height = cH;
        // ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    (function init() {
        resizeCanvas();
        if (window.CP) {
            // CodePen's loop detection was causin' problems
            // and I have no idea why, so...
            window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 6000;
        }
        window.addEventListener("resize", resizeCanvas);
        addClickListeners();
        if (!!window.location.pathname.match(/fullcpgrid/)) {
            startFauxClicking();
        }
        handleInactiveUser();
    })();

    function handleInactiveUser() {
        let inactive = setTimeout(function () {
            fauxClick(cW, cH);
        }, 2000);

        function clearInactiveTimeout() {
            clearTimeout(inactive);
            parentCanvas.removeEventListener("mousedown", clearInactiveTimeout);
            parentCanvas.removeEventListener("touchstart", clearInactiveTimeout);
        }

        parentCanvas.addEventListener("mousedown", clearInactiveTimeout);
        parentCanvas.addEventListener("touchstart", clearInactiveTimeout);
    }

    function startFauxClicking() {
        setTimeout(function () {
            fauxClick(anime.random(cW, cW), anime.random(cH, cH));
            startFauxClicking();
        }, anime.random(200, 900));
    }

    function fauxClick(x, y) {
        let fauxClick = new Event("mousedown");
        fauxClick.pageX = x;
        fauxClick.pageY = y;
    }
})


