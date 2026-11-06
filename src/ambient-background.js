const COUNT = 24;
const COLORS = ['#e85d5d', '#e0b84f', '#5e91e8', '#58c987', '#b879d8', '#51c5c9'];
const canvas = document.querySelector('#ambient-pokeballs');

if (canvas) {
  const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const particles = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let lastTime = 0;
  let frame = 0;
  let running = !document.hidden;

  const random = (min, max) => min + Math.random() * (max - min);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function createParticle() {
    const size = random(22, 76);
    return {
      x: random(0, width),
      y: random(0, height),
      size,
      speed: random(7, 29),
      direction: random(0, Math.PI * 2),
      rotation: random(0, Math.PI * 2),
      spin: random(-.45, .45),
      alpha: random(.08, .26),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function drawParticle(particle) {
    const radius = particle.size / 2;
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.globalAlpha = particle.alpha;
    context.strokeStyle = '#000';
    context.fillStyle = particle.color;
    context.lineWidth = Math.max(1, particle.size * .055);
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.lineWidth = Math.max(1, particle.size * .08);
    context.beginPath();
    context.moveTo(-radius, 0);
    context.lineTo(radius, 0);
    context.stroke();
    context.beginPath();
    context.arc(0, 0, Math.max(1.5, radius * .18), 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = particle.alpha * .55;
    context.beginPath();
    context.arc(0, 0, Math.max(2.5, radius * .29), 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function render(time = 0) {
    if (!running) return;
    if (lastTime && time - lastTime < 33) {
      frame = requestAnimationFrame(render);
      return;
    }
    const elapsed = Math.min((time - lastTime) / 1000 || 0, .05);
    lastTime = time;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      if (!reducedMotion.matches) {
        particle.x += Math.cos(particle.direction) * particle.speed * elapsed;
        particle.y += Math.sin(particle.direction) * particle.speed * elapsed;
        particle.rotation += particle.spin * elapsed;
        if (particle.x < -particle.size) particle.x = width + particle.size;
        if (particle.x > width + particle.size) particle.x = -particle.size;
        if (particle.y < -particle.size) particle.y = height + particle.size;
        if (particle.y > height + particle.size) particle.y = -particle.size;
      }
      drawParticle(particle);
    }
    frame = requestAnimationFrame(render);
  }

  resize();
  for (let index = 0; index < COUNT; index += 1) particles.push(createParticle());
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) {
      lastTime = performance.now();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(frame);
    }
  });
  frame = requestAnimationFrame(render);
}
