const canvas = document.getElementById("main");
const W = canvas.width;
const H = canvas.height;
const ctx = canvas.getContext('2d');

function randint (l, r) {
    return Math.floor(l + (r - l + 1) * Math.random());
}

function randPick (arr) {
    const index = randint(0, arr.length - 1);
    return [arr[index], index];
}

function randPickN (arr, n) {
    const copy = [...arr];
    if (n > arr.length) return copy;

    const ans = [];
    for (let i=0; i<n; i++) {
        const [val, ind] = randPick(copy);
        ans.push(val);
        copy.splice(ind, 1);
    }

    return ans;
}

function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clear () {
    ctx.clearRect(0, 0, W, H);
}

function valueAtFraction (start, end, frac) {
    return start + (end - start) * frac;
}

async function animateLinear (action, duration) {
    let started = false;

    function step (ts) {
        if (!started) {
            started = ts;
        }

        if (ts >= started + duration) {
            return;
        }

        const ellapsed = ts - started;
        const frac = ellapsed / duration;

        action(frac);
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
    if (duration !== Infinity) await sleep(duration);
}

function binarySearch (left, right, valueFn, targetValue, resolution = 0.1) {
    const MAX_ITERATIONS = 32;
    let iteration = 0;

    let mid = left;
    let diff = Infinity;
    do {
        if (diff > 0) {
            left = mid;
        } else {
            right = mid
        }
        mid = (left + right) / 2;
        diff = targetValue - valueFn(mid);

        iteration += 1;
    } while (Math.abs(diff) > resolution && iteration < MAX_ITERATIONS);

    return mid;
}

function arcIntegral (r, x) {
    return (x / 2) * Math.sqrt(r*r - x*x) + (r*r / 2) * Math.asin(x / r);
}

function arcArea (r, x1, x2) {
    return Math.abs(arcIntegral(r, x2) - arcIntegral(r, x1));
}

function solveIntersection (r, m, c) {
    const b = m * c;
    const a = (1 + m * m);
    const p = Math.sqrt(r * r * a - c * c);

    const x1 = (-b + p) / a;
    const x2 = (-b - p) / a;

    const y1 = m * x1 + c;
    if (y1 >= 0) return [x1, y1];

    const y2 = m * x2 + c;
    return [x2, y2];
}

function findLine (theta, r, h, vol) {
    const m = Math.tan(theta);

    function calcVol (x) {
        const p = x / m;
        const areaOfTriangle = 0.5 * p * x;

        const x2 = p - r;
        const c =  -x2 * m;

        let [x1, y1] = solveIntersection(r, m, c);
        if (x1 > 0) x1 = Math.min(x1, r);
        else x1 = Math.max(x1, -r);

        const areaUnderArc = arcArea(r, -r, x1);
        const areaInArcTriangle = 0.5 * (x1 - x2) * y1;

        return areaOfTriangle + areaUnderArc - areaInArcTriangle;
    }

    return binarySearch(0, 2 * r * m, calcVol, vol);
}

class Vector {
    constructor(a, b, isPolar = false) {
        if (!isPolar) {
            this.x = a;
            this.y = b;
            return this;
        }
        this.x = a * Math.cos(b);
        this.y = a * Math.sin(b);
    }

    move (a, b = 0, isPolar = false) {
        if (!isPolar)
            return new Vector(this.x + a, this.y + b);
        return new Vector(
            this.x + a * Math.cos(b),
            this.y - a * Math.sin(b)
        )
    }
}

class Testtube {
    static borderColor = "white";

    constructor (
        height = 90,
        radius = 8,
        position = new Vector(0, 0),
        angle = 0,
        pivot = "center",
    ) {
        this.height = height;
        this.radius = radius;
        this.position = position;
        this.angle = angle;
        this.contents = [];
        this.pivot = pivot;
        this.filling = null;
        this.zindex = 0;
    }

    getTopLeft () {
        let topLeft = this.position;
        if (this.pivot === "center") {
            topLeft = this.position.move(-this.radius, this.angle, true);
        } else if (this.pivot === "right") {
            topLeft = this.position.move(-2 * this.radius, this.angle, true);
        }

        return topLeft;
    }

    isInside (v) {
        const topLeft = this.getTopLeft();
        return (v.x >= topLeft.x)
            && (v.x <= topLeft.x + (this.radius * 2))
            && (v.y >= topLeft.y)
            && (v.y <= topLeft.y + this.height);
    }

    maxVol (angle = this.angle) {
        const l = this.height - this.radius;
        const r = this.radius;
        const d = 2 * r;
        const m = Math.tan(Math.abs(angle));
        const withRect = Math.atan(l / d);

        if (Math.abs(angle) <= withRect) {
            const b =  d * m;
            const areaOfTriangle = 0.5 * d * b;

            const h = l - b;
            const areaOfRect = h * d;
            const areaOfSemiCircle = Math.PI * r * r / 2;

            return areaOfTriangle + areaOfRect + areaOfSemiCircle;
        }

        const pp = l / m;
        const areaOfTriangle = 0.5 * pp * l;
        const x2 = pp - r;
        const c = - x2 * m;

        const [x1, y1] = solveIntersection(r, m, c);
        const areaUnderArc = arcArea(r, -r, x1);
        const areaInArcTriangle = 0.5 * (x1 - x2) * y1;

        return areaOfTriangle + areaUnderArc - areaInArcTriangle;
    }

    getAngleForVol (vol) {
        return binarySearch(Math.PI / 2, 0, this.maxVol.bind(this), vol);
    }

    minVolWithRect () {
        const l = this.height - this.radius;
        const r = this.radius;
        const d = 2 * r;
        const m = Math.tan(Math.abs(this.angle));

        const withRect = Math.atan(l / d);
        if (Math.abs(this.angle) > withRect) {
            return Infinity;
        }

        const areaOfSemiCircle = Math.PI * r * r / 2;
        const areaOfTriangle = 0.5 * d * d * m;

        return areaOfSemiCircle + areaOfTriangle;
    }

    drawContent (vol, color) {
        const theta = this.angle;
        const r = this.radius;
        const l = this.height - r;
        const d = 2 * r;

        const actualVol = Math.min(vol, this.maxVol());
        const withRect = Math.atan(l / d);

        let topLeft = this.getTopLeft();
        const topRight = topLeft.move(d, theta, true);

        const minVolWithRect = this.minVolWithRect();
        if (actualVol > minVolWithRect && Math.abs(this.angle) <= withRect) {
            const rectVol = actualVol - minVolWithRect;
            const shortSide = rectVol / d;
            const longSide = shortSide + d * Math.tan(Math.abs(this.angle));

            const l1 = this.angle < 0 ? shortSide : longSide;
            const l2 = this.angle < 0 ? longSide : shortSide;

            const p1 = topLeft.move(l - l1, theta - Math.PI / 2,  true);
            const p2 = p1.move(d / Math.cos(theta), 0, true)
            const p3 = p2.move(l2, theta - Math.PI / 2, true);
            const circleCenter = p3.move(r, Math.PI + theta, true);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y)
            ctx.arc(
                circleCenter.x, circleCenter.y,
                r,
                2 * Math.PI - theta,
                Math.PI - theta
            );
            ctx.lineTo(p1.x, p1.y);
            const oldCol = ctx.fillStyle;
            ctx.fillStyle = color;
            ctx.fill();
            ctx.fillStyle = oldCol;

            return;
        } else {
            const l1 = findLine(Math.abs(this.angle), r, this.height, actualVol);
            if (this.angle < 0) {
                const p1 = topRight.move(l - l1, theta - Math.PI / 2, true);
                const p2 = topRight.move(l, theta - Math.PI / 2, true);
                const circleCenter = p2.move(r, Math.PI + theta, true);


                const pp = l1 / Math.tan(Math.abs(theta));
                const x2 = pp - r;
                const m = Math.tan(Math.abs(theta));
                const c = - x2 * m;

                const [xx, yy] = solveIntersection(r, m, c);
                let phi = Math.atan(yy / xx);
                if (phi < 0) phi = Math.PI + phi;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.arc(
                    circleCenter.x, circleCenter.y,
                    r,
                    Math.abs(theta),
                    Math.PI + Math.abs(theta) - phi,
                );
                ctx.lineTo(p1.x, p1.y);
                const oldCol = ctx.fillStyle;
                ctx.fillStyle = color;
                ctx.fill();
                ctx.fillStyle = oldCol;

                return;
            }

            const p1 = topLeft.move(l - l1, theta - Math.PI / 2, true);
            const p2 = topLeft.move(l, theta - Math.PI / 2, true);
            const circleCenter = p2.move(r, theta, true);

            const pp = l1 / Math.tan(theta);
            const x2 = pp - r;
            const m = Math.tan(theta);
            const c = - x2 * m;

            const [xx, yy] = solveIntersection(r, m, c);
            let phi = Math.atan(yy / xx);
            if (phi < 0) phi = Math.PI + phi;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.arc(
                circleCenter.x, circleCenter.y,
                r,
                Math.PI - theta,
                2 * Math.PI - theta + phi,
                true
            );
            ctx.lineTo(p1.x, p1.y);
            const oldCol = ctx.fillStyle;
            ctx.fillStyle = color;
            ctx.fill();
            ctx.fillStyle = oldCol;

            return;
        }
    }

    drawOutline () {
        const theta = this.angle;
        const h = this.height;
        const r = this.radius;
        const d = r * 2;

        let topLeft = this.getTopLeft();
        const topRight = topLeft.move(d, theta, true);
        const bottomRight = topRight.move(h - r, theta - Math.PI / 2,  true);
        const circleCenter = bottomRight.move(r, Math.PI + theta, true);

        ctx.beginPath();
        ctx.moveTo(topLeft.x, topLeft.y);
        ctx.lineTo(topRight.x, topRight.y);
        ctx.lineTo(bottomRight.x, bottomRight.y);
        ctx.arc(
            circleCenter.x, circleCenter.y,
            r,
            2 * Math.PI - theta,
            Math.PI - theta
        );
        ctx.lineTo(topLeft.x, topLeft.y);
        ctx.lineWidth = 2;
        const oldCol = ctx.strokeStyle;
        ctx.strokeStyle = Testtube.borderColor;
        ctx.stroke();
        ctx.strokeStyle = oldCol;
    }

    drawContents () {
        const drawSequence = [];
        let alreadyFilled = 0;

        for (const content of this.contents) {
            alreadyFilled += content.volume;
            drawSequence.unshift([ alreadyFilled, content.color ]);
        }

        drawSequence.forEach(args => this.drawContent.apply(this, args));
    }

    drawFilling () {
        if (!this.filling) return;

        let topLeft = this.getTopLeft();
        const p1 = topLeft.move(this.radius, -2 * this.radius);

        const oldCol = ctx.fillStyle;
        ctx.fillStyle = this.filling;
        ctx.fillRect(p1.x - 1, p1.y, 2, 2 * this.radius + this.height);
        ctx.fillStyle = oldCol;
    }

    draw () {
        if (this.filling) {
            this.drawFilling();
        }
        this.drawContents();
        this.drawOutline();
    }

    setAngle (theta) {
        this.angle = theta;
    }

    setPosition (pos) {
        this.position = pos;
    }

    setPivot (pivot) {
        this.pivot = pivot;
    }

    setZindex (value) {
        this.zindex = value;
    }

    canGive () {
        if (this.contents.length === 0) return {};
        const top = this.contents[this.contents.length - 1];
        return { ...top };
    }

    canTake (limit) {
        if (this.contents.length === 0) return { volume: limit };
        const filled = this.getFilledVol();

        if (filled === limit) return {};

        const top = this.contents[this.contents.length - 1];
        const free = Math.floor(limit - filled);
        return { ...top, volume: free };
    }

    getFilledVol () {
        return this.contents.map(x => x.volume).reduce((a, b) => a + b, 0);
    }

    async addContent (volume, color, duration, pouring) {
        if (pouring) this.filling = color;
        const n = this.contents.length;
        if (n === 0 || this.contents[n - 1].color !== color) {
            this.contents.push({ volume: 0, color });
            await animateLinear((frac) => {
                this.contents[n].volume = valueAtFraction(0, volume, frac);
            }, duration);
            this.contents[n].volume = volume;
        } else {
            const startVol = this.contents[n-1].volume;
            await animateLinear((frac) => {
                this.contents[n-1].volume = valueAtFraction(
                    startVol, startVol + volume, frac
                );
            }, duration);
            this.contents[n-1].volume = startVol + volume;
        }
        this.filling = null;
    }

    removeTopContent (volumeToRemove) {
        if (this.contents.length === 0) return;

        const top = this.contents[this.contents.length - 1];
        if (top.volume > volumeToRemove) {
            top.volume = top.volume - volumeToRemove;
        } else {
            this.contents.pop();
        }
    }

    async animateTo (targetPosition, targetAngle, duration) {
        const startAngle = this.angle;
        const startPosition = this.position;

        await animateLinear((frac) => {
            const curAngle = valueAtFraction(startAngle, targetAngle, frac);
            const curPosition = new Vector(
                valueAtFraction(startPosition.x, targetPosition.x, frac),
                valueAtFraction(startPosition.y, targetPosition.y, frac),
            );

            this.setAngle(curAngle);
            this.setPosition(curPosition);
        }, duration);

        this.setPosition(targetPosition);
        this.setAngle(targetAngle);
    }
}

class GameScreen {
    static instance = null;
    constructor () {
        if (GameScreen.instance) return GameScreen.instance;

        this.objects = []; // objects must expose a draw method, and a zindex
        GameScreen.instance = this;
        this.init();
        return this;
    }

    init() {
        clear();
        animateLinear(() => {
            clear();
            this.objects.sort((a, b) => a.zindex - b.zindex);
            this.objects.forEach(obj => obj.draw());
        }, Infinity);
    }
}

const COLORS = [
    "#9400FF",
    "#FFA1F5",
    "#97FFF3",
    "#0000FF",
    "#FF00FF",
    "#16FF00",
    "#379237",
    "#FCE700",
    "#FF9551",
    "#FF1E1E",
    "#F8F8F8",
    "#7E8A97",
    "#AC4B1C",
    "#843B62"
];

class Game {
    static TTW = 32;
    static TTH = 152;
    static UNIT = 32 * 32;
    static LINE_HEIGHT = 240;
    static TOP_PAD = 64;

    constructor(n) {
        this.screen = new GameScreen();
        this.n = n + 2;
        this.tubes = Array.from(
            Array(this.n).fill(0), () => new Testtube(Game.TTH, Game.TTW / 2)
        );
        this.colors = randPickN(COLORS, n);
        this.placeTesttubes();
        this.initContent();

        this.selected = null;
        this.animating = false;
    }

    runAnimation = async (fn) => {
        this.animating = true;
        await fn();
        this.animating = false;
    }

    placeTesttubes () {
        const a = Math.ceil(this.n / 2);
        const w = W / a;
        const pad = Math.ceil((w - Game.TTW) / 2);

        const line1Y = Game.TOP_PAD;
        const line2Y = Game.LINE_HEIGHT + Game.TOP_PAD;

        for (let i=0; i<this.n; i++) {
            let y = line1Y;
            if (i >= a) y = line2Y;

            const x = (i % a) * w + pad + Game.TTW / 2;
            this.tubes[i].setPosition(new Vector(x, y));
        }

        this.screen.objects = this.tubes;
    }

    async initContent () {
        const colUnits = this.colors.map((x) => [x, 4]);
        const N = this.colors.length;
        for (let i=0; i<N*4; i++) {
            const [col, ind] = randPick(colUnits);
            const ttInd = Math.floor(i / 4);

            const color = col[0];
            const units = col[1];
            if (units === 1) {
                colUnits.splice(ind, 1);
            } else {
                colUnits[ind][1] -= 1;
            }

            await this.runAnimation(async () => {
                await this.tubes[ttInd].addContent(Game.UNIT, color, 50);
            });
        }
    }

    handleClick = async (event) => {
        if (this.animating) return;

        const x = event.offsetX;
        const y = event.offsetY;
        const pointer = new Vector(x, y);

        for (const tube of this.tubes) {
            if (tube.isInside(pointer)) {
                const old = this.selected;
                let poured = false;

                if (old) {
                    if (old !== tube) poured = await this.pour(old, tube);
                    await this.runAnimation(async () => {
                        await old.animateTo(old.position.move(0, Game.TTW), 0, 100);
                    });
										if (poured) this.selected = null;
										else this.selected = (old === tube) ? null : tube;
                } else {
                    this.selected = tube;
                }

								if (this.selected) {
                    await this.runAnimation(async () => {
                        await this.selected.animateTo(
														this.selected.position.move(0, -Game.TTW), 0, 100
												);
                    });
								}
								return;
            }
        }

        if (this.selected) {
            await this.runAnimation(async () => {
                await this.selected.animateTo(this.selected.position.move(0, Game.TTW), 0, 100);
            });
            this.selected = null;
        }
    }

    async pour (source, target) {
        const liq = source.canGive();
        if (!liq.color) return false;

        const taker = target.canTake(4*Game.UNIT);
        if (!taker.volume) return false;

        if (taker.color && taker.color !== liq.color) return false;

        const volToPour = Math.min(liq.volume, taker.volume);
        const startVol = source.getFilledVol();
        const oldPosition = source.position;
				const pourDuration = Math.ceil(volToPour / Game.UNIT) * 400;

        let orientation = "right";
        if (target.position.x > Game.TTH) orientation = "left";
				const directionFactor = orientation === "left" ? -1 : 1;

        await this.runAnimation(async () => {
            source.setPivot(orientation === "left" ? "right" : "left");
            source.setZindex(1);
            await source.animateTo(
                new Vector(target.position.x, target.position.y - Game.TTW),
                source.getAngleForVol(startVol) * directionFactor,
                500
            );

            source.animateTo(
                source.position,
                source.getAngleForVol(startVol - volToPour) * directionFactor,
								pourDuration
            );
            target.addContent(volToPour, liq.color, pourDuration, true);
            await sleep(pourDuration);

            source.removeTopContent(volToPour);
            source.setPivot("center");
            await source.animateTo(oldPosition, 0, 500);
						source.setZindex(0);
        });

        return true;
    }

}

const g = new Game(10);
document.getElementById("main").addEventListener('click', g.handleClick);