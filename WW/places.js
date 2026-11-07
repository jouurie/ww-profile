(() => {
  'use strict';
  const gallery = document.querySelector('#world .ww-places');
  if (!gallery) return;
  const buttons = [...gallery.querySelectorAll('.ww-place-selector')];
  const image = gallery.querySelector('#place-image');
  const name = gallery.querySelector('#place-name');
  const description = gallery.querySelector('#place-description');
  function select(button) {
    const thumbnail = button.querySelector('img');
    image.src = thumbnail.src;
    image.alt = thumbnail.alt;
    name.textContent = button.querySelector('span').textContent;
    description.textContent = button.dataset.placeDescription;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus({preventScroll:true});
      select(buttons[next]);
    });
  });
})();
