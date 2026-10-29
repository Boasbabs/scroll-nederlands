import { fakeBrowser } from 'wxt/testing/fake-browser';
import { ContentScriptContext } from 'wxt/utils/content-script-context';
import contentScript from '../../entrypoints/content/index';

describe('the in-page script', () => {
  it('stops without an error when an update has taken its browser.storage', async () => {
    vi.stubGlobal('location', new URL('https://www.youtube.com/watch?v=HKNpCwG3nlc'));
    const ctx = new ContentScriptContext('content');
    await contentScript.main(ctx);
    expect(fakeBrowser.storage.onChanged.hasListeners()).toBe(true);

    // An error thrown while the script stops is uncaught, in Chrome as here.
    const errors: Array<unknown> = [];
    const report = (error: unknown) => errors.push(error);
    process.on('uncaughtException', report);
    const storage = fakeBrowser.storage;
    // When the extension updates, Chrome leaves the old script in an open tab without browser.storage.
    Reflect.set(fakeBrowser, 'storage', undefined);
    try {
      ctx.notifyInvalidated();
      await new Promise((resolve) => setTimeout(resolve, 0));
    } finally {
      Reflect.set(fakeBrowser, 'storage', storage);
      process.off('uncaughtException', report);
      vi.unstubAllGlobals();
    }
    expect(errors).toEqual([]);
  });
});
