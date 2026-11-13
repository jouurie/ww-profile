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
    name.classList.toggle('is-english',/^[\x00-\x7F]+$/.test(name.textContent));
    description.textContent = button.dataset.placeDescription;
    description.classList.toggle('needs-shadow',/^(임시 오두막|도시|트럭스톱)$/.test(name.textContent));
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const rail=button.parentElement;
    if(button.offsetTop<rail.scrollTop)rail.scrollTop=button.offsetTop;
    else if(button.offsetTop+button.offsetHeight>rail.scrollTop+rail.clientHeight)rail.scrollTop=button.offsetTop+button.offsetHeight-rail.clientHeight;
  }
  buttons.forEach((button, index) => {
    const label=button.querySelector('span');
    label.classList.toggle('is-english',/^[\x00-\x7F]+$/.test(label.textContent));
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus({preventScroll:true});
      select(buttons[next]);
    });
  });
})();
