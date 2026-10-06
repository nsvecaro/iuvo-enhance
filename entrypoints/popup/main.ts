import './style.css';
import { anthropicApiKey } from '@/lib/storage';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="settings">
    <h1>Iuvo</h1>
    <p class="hint">
      BYOK: paste your own Anthropic API key. It is stored only in this
      browser's local extension storage, never synced, and sent only to
      Anthropic's API.
    </p>
    <label class="field">
      <span>Anthropic API key</span>
      <input id="api-key" type="password" placeholder="sk-ant-..." autocomplete="off" />
    </label>
    <button id="save" type="button">Save</button>
    <p id="status" class="status"></p>
  </div>
`;

const input = document.querySelector<HTMLInputElement>('#api-key')!;
const saveButton = document.querySelector<HTMLButtonElement>('#save')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

anthropicApiKey.getValue().then((value) => {
  input.value = value;
});

saveButton.addEventListener('click', async () => {
  await anthropicApiKey.setValue(input.value.trim());
  status.textContent = 'Saved.';
  setTimeout(() => {
    status.textContent = '';
  }, 1500);
});
