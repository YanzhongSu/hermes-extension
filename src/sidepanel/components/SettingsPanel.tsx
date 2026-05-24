import { type FormEvent, useState } from 'react';
import type { HermesSettings } from '../types';

interface SettingsPanelProps {
  settings: HermesSettings;
  onSave: (settings: HermesSettings) => Promise<void> | void;
  onBack: () => void;
}

export function SettingsPanel({ settings, onSave, onBack }: SettingsPanelProps) {
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [domainBlocklist, setDomainBlocklist] = useState(settings.domainBlocklist.join('\n'));
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      apiUrl: apiUrl.trim(),
      apiKey: apiKey.trim(),
      domainBlocklist: domainBlocklist
        .split('\n')
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <main className="settings-view">
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to chat">
          Back
        </button>
        <h1>Settings</h1>
      </header>

      {(!apiUrl || !apiKey) && (
        <div className="warning-banner">
          Hermes is not configured. Add your API URL and key to get started.
        </div>
      )}

      <form className="settings-form" onSubmit={submit}>
        <label>
          <span>API URL</span>
          <input
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="http://your-server:8642"
            type="url"
          />
        </label>

        <label>
          <span>API Key</span>
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="API_SERVER_KEY"
            type="password"
          />
        </label>

        <label>
          <span>Domain Blocklist</span>
          <textarea
            value={domainBlocklist}
            onChange={(event) => setDomainBlocklist(event.target.value)}
            rows={8}
            spellCheck={false}
          />
        </label>

        <a
          className="setup-link"
          href="https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/messaging/chrome-extension.md"
          target="_blank"
          rel="noreferrer"
        >
          Chrome extension setup guide
        </a>

        <button className="primary-button" type="submit">
          Save Settings
        </button>
        {saved && <div className="save-confirmation">Settings saved</div>}
      </form>
    </main>
  );
}
