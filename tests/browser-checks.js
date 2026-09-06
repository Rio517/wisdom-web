// Run this function through a Playwright page connected to the local preview.
// The browser tool accepts this file directly; no production test hooks are used.
async (page) => {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const settled = () => page.waitForFunction(() => document.querySelector('#life-map').dataset.motion === 'settled');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4173/prototype/');
  assert(await page.locator('#example-age').inputValue() === '8', 'Default age');
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'ready', 'No unsolicited entrance');
  await page.locator('#explore').click();
  await settled();
  assert(await page.evaluate(() => new URL(location.href).searchParams.get('selected') === '1'), 'Selection is shareable');
  assert(await page.locator('[data-traveler]').getAttribute('cx') === '250', 'Traveler reaches the authored age-8 point');
  results.push('Default, selection and final point');

  await page.evaluate(() => {
    const select = document.querySelector('#example-age');
    for (const age of ['16', '25', '60', '40']) {
      select.value = age; select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await settled();
  assert(await page.locator('#life-map').getAttribute('data-age') === '40', 'Latest rapid input wins');
  assert(await page.locator('[data-traveler]').getAttribute('cx') === '700', 'No stale traveler after interruption');
  const visibleAnchors = await page.locator('.map-anchor:visible').count();
  assert(visibleAnchors === 1, 'Zoomed-out-of-view anchors are not keyboard targets');
  assert(await page.locator('[data-traveler]').getAttribute('cy') === '220', 'Final y is correct');
  results.push('Rapid retargeting and focused map');

  await page.locator('#overview').click();
  assert(await page.locator('.map-anchor:visible').count() === 6, 'Overview restores all authored anchors');
  await page.getByRole('button', { name: 'Explore age 16', exact: true }).focus();
  await page.keyboard.press('Enter');
  await settled();
  assert(await page.locator('#example-age').inputValue() === '16', 'Map keyboard action selects the same state');
  assert(await page.evaluate(() => document.activeElement.getAttribute('aria-label')) === 'Explore age 16', 'Map focus survives redraw');
  results.push('Overview and keyboard selection');

  await page.getByRole('button', { name: 'Next: learning opens paths' }).click();
  assert(await page.locator('#learning-scene').isVisible(), 'Learning scene opens');
  await page.getByRole('button', { name: 'Does learning carry into other activities?' }).click();
  assert(await page.locator('#tennis-dialog').isVisible(), 'Deep example opens');
  await page.getByRole('button', { name: 'Return to the explanation', exact: true }).click();
  assert(!await page.locator('#tennis-dialog').isVisible(), 'Deep example closes');
  assert(await page.evaluate(() => document.activeElement.textContent) === 'Does learning carry into other activities?', 'Dialog restores focus');
  await page.getByRole('button', { name: 'Back to your moment' }).click();
  assert(await page.locator('#example-age').inputValue() === '16', 'Return keeps age');
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'Return does not replay');
  await page.goBack();
  assert(await page.locator('#learning-scene').isVisible(), 'Browser Back restores scene');
  await page.reload();
  assert(await page.locator('#learning-scene').isVisible(), 'Reload restores scene');
  results.push('Scene, deep example, focus, history and reload');

  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  assert(page.url().endsWith('#learning'), 'Skip link must preserve the current scene');
  assert(await page.evaluate(() => document.activeElement.id) === 'main', 'Skip link focuses content');
  results.push('Skip navigation');

  await page.setViewportSize({ width: 744, height: 1133 });
  await page.goto('http://127.0.0.1:4173/prototype/?age=40&selected=1');
  await page.getByRole('button', { name: 'Open index', exact: true }).click();
  assert(await page.locator('#main').evaluate(node => node.inert), 'Tablet index makes underlying content inert');
  await page.getByRole('link', { name: 'Source code', exact: true }).focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.activeElement.className) === 'brand', 'Tablet index wraps keyboard focus');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => document.activeElement.id) === 'open-index', 'Index close restores focus');
  assert(!await page.locator('#main').evaluate(node => node.inert), 'Closing index restores content');
  results.push('Tablet index focus and dismissal');

  await page.locator('#reduce-motion').check();
  await page.locator('#example-age').selectOption('60');
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'Manual reduced motion immediately settles');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('#reduce-motion').disabled);
  await page.locator('#example-age').selectOption('8');
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'System reduced motion immediately settles');
  assert(await page.locator('#reduce-motion').isChecked(), 'System preference is reflected in the control');
  assert(await page.locator('#reduce-motion').isDisabled(), 'UI cannot falsely claim system motion is enabled');
  results.push('Manual and system reduced motion');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4173/prototype/?age=40&selected=1');
  await page.setViewportSize({ width: 744, height: 1133 });
  await page.waitForFunction(() => {
    const svg = document.querySelector('#life-map');
    return parseFloat(getComputedStyle(svg.querySelector('[data-age="40"] text')).fontSize) * svg.clientWidth / svg.viewBox.baseVal.width >= 15.8;
  });
  const resizedLabel = await page.evaluate(() => {
    const svg = document.querySelector('#life-map');
    return parseFloat(getComputedStyle(svg.querySelector('[data-age="40"] text')).fontSize) * svg.clientWidth / svg.viewBox.baseVal.width;
  });
  assert(resizedLabel >= 15.8, 'Changing orientation keeps labels readable without reloading');
  results.push('Live viewport resize');

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1133, height: 744 }, { width: 744, height: 1133 }]) {
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4173/prototype/?age=40&selected=1');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${viewport.width}`);
    const labelSize = await page.evaluate(() => {
      const svg = document.querySelector('#life-map');
      return parseFloat(getComputedStyle(svg.querySelector('[data-age="40"] text')).fontSize) * svg.clientWidth / svg.viewBox.baseVal.width;
    });
    assert(labelSize >= 15.8, `Readable map label at ${viewport.width}, received ${labelSize}`);
    await page.getByRole('button', { name: 'Next: learning opens paths' }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Learning does not overflow at ${viewport.width}`);
  }
  results.push('Both scenes at desktop, tablet landscape and tablet portrait');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { passed: results };
}
