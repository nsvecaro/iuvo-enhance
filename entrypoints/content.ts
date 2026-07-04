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

    function waitForInput(adapter: SiteAdapter) {
      const interval = setInterval(async () => {
        const input = adapter.findInput();
        if (!input) return;

        clearInterval(interval);
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
      }, 500);
    }

    waitForInput(adapter);
  },
});
