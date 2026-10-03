const GROUP_INTRODUCTIONS = {
  'Color & Composition': 'Create with gradients, color, shapes, stripes, and geometric layouts.',
  'Patterns & Effects': 'Generate repeating patterns, grids, tiles, textures, and digital effects.',
  'Geometry & Symmetry': 'Explore circles, polygons, curves, symmetry, and mathematical shapes.',
  'Organic & Flow': 'Create flowing lines, natural forms, contours, waves, and organic patterns.',
  'Fields & Systems': 'Experiment with waves, particles, optical effects, and mathematical patterns.',
  '3D & Architecture': 'Build 3D forms, landscapes, towers, cities, and architectural scenes.',
};

const gallery = document.getElementById('engineGallery');
const allEngines = [];
let cardIndex = 0;

ENGINE_CATALOG.forEach(([group, engines], groupIndex) => {
  const section = document.createElement('section');
  section.className = 'engine-group';
  section.setAttribute('aria-labelledby', `group-${groupIndex}`);

  const heading = document.createElement('div');
  heading.className = 'group-heading';
  heading.innerHTML = `
    <div>
      <span class="group-number">${String(groupIndex + 1).padStart(2, '0')} —</span>
      <h2 id="group-${groupIndex}">${group}</h2>
    </div>
    <p>${GROUP_INTRODUCTIONS[group]}</p>
  `;

  const grid = document.createElement('div');
  grid.className = 'engine-grid';

  engines.forEach(([id, name]) => {
    allEngines.push(id);
    const card = document.createElement('a');
    card.className = 'engine-card';
    card.href = `studio.html?engine=${encodeURIComponent(id)}`;
    card.style.setProperty('--card-order', cardIndex % 8);

    const imageFrame = document.createElement('div');
    imageFrame.className = 'card-image';
    const image = document.createElement('img');
    image.src = `assets/thumbnails/${id}.webp`;
    image.alt = `${name} generated artwork example`;
    image.width = 480;
    image.height = 320;
    image.loading = cardIndex < 8 ? 'eager' : 'lazy';
    image.decoding = 'async';
    if (cardIndex < 4) image.fetchPriority = 'high';
    imageFrame.appendChild(image);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.innerHTML = `
      <div class="card-title"><h3>${name}</h3><span aria-hidden="true">↗</span></div>
      <p>${ENGINE_DESCRIPTIONS[id]}</p>
    `;

    card.append(imageFrame, content);
    grid.appendChild(card);
    cardIndex++;
  });

  section.append(heading, grid);
  gallery.appendChild(section);
});

document.getElementById('surpriseEngine').addEventListener('click', event => {
  event.preventDefault();
  const id = allEngines[Math.floor(Math.random() * allEngines.length)];
  window.location.href = `studio.html?engine=${encodeURIComponent(id)}`;
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '80px 0px', threshold: 0.08 });
  document.querySelectorAll('.engine-card').forEach(card => observer.observe(card));
} else {
  document.querySelectorAll('.engine-card').forEach(card => card.classList.add('is-visible'));
}
