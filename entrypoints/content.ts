import { mount, unmount } from 'svelte';
import { adapters, getAdapterForHostname, type SiteAdapter } from '@/lib/content/adapters';
import Widget from '@/components/Widget.svelte';

export default defineContentScript({
  matches: adapters.flatMap((a) => a.matches),
  cssInjectionMode: 'ui',
  async main(ctx) {
    const adapter = getAdapterForHostname(location.hostname);
    if (!adapter) return;

    let mounted = false;

    async function mountWidget(adapter: SiteAdapter, input: HTMLElement) {
      if (mounted) return;
      mounted = true;

      const ui = await createShadowRootUi(ctx, {
        name: 'iuvo-widget',
        position: 'inline',
        anchor: 'body',
        append: 'last',
        onMount(container) {
          return mount(Widget, { target: container, props: { adapter, input } });
        },
        onRemove(app) {
          if (app) unmount(app);
        },
      });

      ui.mount();
    }

    function waitForInput(adapter: SiteAdapter) {
      const existing = adapter.findInput();
      if (existing) {
        mountWidget(adapter, existing);
        return;
      }

      const observer = new MutationObserver(() => {
        const input = adapter.findInput();
        if (!input) return;

        observer.disconnect();
        mountWidget(adapter, input);
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForInput(adapter);
  },
});
