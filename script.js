const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

let points = [];
const numPoints = 350; 
const baseRadius = 210; 

let mouseX = 0, mouseY = 0;
let rotX = 0, rotY = 0;
let time = 0;

// Цвета без лишних запятых для корректной склейки
const colors = ['rgba(0, 230, 255', 'rgba(255, 0, 85', 'rgba(0, 255, 150', 'rgba(255, 200, 0'];
let currentColorIndex = 0;

// Управление для мышки и тачскрина
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - canvas.width / 2) * 0.00005;
    mouseY = (e.clientY - canvas.height / 2) * 0.00005;
});

const changeColor = () => {
    currentColorIndex = (currentColorIndex + 1) % colors.length;
};

window.addEventListener('mousedown', changeColor);
window.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Чтобы экран не дергался на POCO
    changeColor();
}, {passive: false});

class Point {
    constructor() {
        this.theta = Math.random() * Math.PI * 2;
        this.phi = Math.acos((Math.random() * 2) - 1);
        
        this.dirX = Math.sin(this.phi) * Math.cos(this.theta);
        this.dirY = Math.sin(this.phi) * Math.sin(this.theta);
        this.dirZ = Math.cos(this.phi);
    }

    project(rx, ry, pulseFactor) {
        let r = baseRadius * pulseFactor;
        
        let x = this.dirX * r;
        let y = this.dirY * r;
        let z = this.dirZ * r;

        // Вращение
        let y1 = y * Math.cos(rx) - z * Math.sin(rx);
        let z1 = z * Math.cos(rx) + y * Math.sin(rx);
        let x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
        let z2 = z1 * Math.cos(ry) - x * Math.sin(ry);

        let perspective = 500 / (500 - z2);
        
        return {
            x: x2 * perspective + canvas.width / 2,
            y: y1 * perspective + canvas.height / 2,
            z: z2,
            opacity: (z2 + baseRadius) / (2 * baseRadius)
        };
    }
}

for (let i = 0; i < numPoints; i++) points.push(new Point());

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    time += 0.02; // Скорость пульсации
    let pulseFactor = 1 + Math.sin(time) * 0.12; // Сама пульсация (мягкое дыхание)

    rotX += 0.002 + mouseY; 
    rotY += 0.002 + mouseX;

    const projected = points.map(p => p.project(rotX, rotY, pulseFactor));
    const colorBase = colors[currentColorIndex];

    // 1. Рисуем нейронные связи (линии)
    for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j += 15) { 
            let p1 = projected[i];
            let p2 = projected[j];
            
            if (p1.z > -100 && p2.z > -100) {
                let dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = colorBase + ',' + (p1.opacity * 0.15) + ')';
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }

    // 2. Рисуем энергетические узлы (точки)
    projected.forEach(p => {
        const size = (p.z > 0 ? 2.5 : 1.2) * pulseFactor;
        ctx.fillStyle = colorBase + ',' + (p.opacity + 0.2) + ')';
        ctx.fillRect(p.x, p.y, size, size);
    });

    requestAnimationFrame(animate);
}

animate();