import { html, render } from '/components.js';

export const $ = document.querySelector.bind(document);

export const toast = (text) => {
  $('#snackbar').labelText = text;
  $('#snackbar').show();
}

export const displayProfile = (profile) => {
  render(html`<div>
  </div>`, $('#profile'));
}

export { html, render }
