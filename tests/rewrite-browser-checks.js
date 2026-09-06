// Run this function through a Playwright page connected to the local Vite preview.
// The browser tool accepts this file directly; no production test hooks are used.
async (page) => {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const settled = () => page.waitForFunction(() => document.querySelector('#life-map').dataset.motion === 'settled');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4600/prototype/?age=40&selected=1&inspect=12&choice=repair');
  assert(await page.locator('#moment-copy').textContent().then(text => /^Age 12:/.test(text)), 'Inspected moment context is stale');
  const earlierAtForty = await page.locator('[data-review-age]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.reviewAge)));
  assert(JSON.stringify(earlierAtForty) === JSON.stringify([8, 12, 16, 25, 40]), 'Earlier decisions do not match today');
  assert(await page.locator('#map-overlay .route-marker').count() === 5, 'Repair routes lack endpoint markers');
  results.push('Derived moment context, earlier decisions and route markers');

  await page.goto('http://127.0.0.1:4600/prototype/');
  const earlierAtEight = await page.locator('[data-review-age]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.reviewAge)));
  assert(JSON.stringify(earlierAtEight) === JSON.stringify([8]), 'Starting age lists future decisions as earlier');
  await page.getByLabel('Example age', { exact: true }).selectOption('40');
  await page.getByRole('button', { name: 'Explore this moment', exact: true }).click();
  await settled();
  await page.getByRole('button', { name: 'Replay arrival', exact: true }).click();
  await settled();
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'Replay arrival does not settle');
  results.push('Replay arrival');
  await page.getByRole('button', { name: 'Compare a choice at age 12', exact: true }).click();
  await page.getByRole('button', { name: 'Build the foundation', exact: true }).click();
  const decision = page.locator('#decision-panel');
  assert(await decision.getByText('Another possible choice', { exact: true }).isVisible(), 'Missing comparison explanation');
  assert(await decision.getByText('Course prerequisite within reach', { exact: true }).isVisible(), 'Build route outcomes are missing');
  results.push('Comparison and named outcomes');

  await page.getByRole('button', { name: 'See how it adds up', exact: true }).click();
  assert(await decision.getByText(/One missed night does not erase/i).isVisible(), 'Pattern layer is missing');
  await page.getByRole('button', { name: 'What makes the next start easier?', exact: true }).click();
  assert(await decision.getByText(/not the same as understanding/i).isVisible(), 'Starting layer is missing');
  assert(await decision.getByText(/Not all of this is Mika's choice/i).isVisible(), 'Circumstances are not visible');
  results.push('Layers and circumstances');

  await page.getByRole('button', { name: 'Return to today', exact: true }).click();
  assert(await page.getByText('Looking ahead: age 12', { exact: true }).count() === 0, 'Return to today retains comparison');
  assert(await page.evaluate(() => new URL(location.href).searchParams.get('inspect') === null), 'Return to today does not restore URL state');
  assert(await page.locator('#moment-copy').textContent().then(text => /^Age 40:/.test(text)), 'Today context is not restored');
  results.push('Return to today');

  await page.getByRole('button', { name: 'Compare a choice at age 12', exact: true }).click();
  await page.getByRole('button', { name: 'What could help next?', exact: true }).click();
  await page.reload();
  assert(await decision.getByText('Later course intake available', { exact: true }).isVisible(), 'Reload loses repair comparison');
  results.push('Comparison reload');

  await page.getByRole('button', { name: 'Read without stepping', exact: true }).click();
  assert(await page.getByRole('heading', { name: 'Three views of the age 12 choice' }).isVisible(), 'Reading dialog does not use authored static content');
  await page.getByRole('button', { name: 'Return to the guided view', exact: true }).click();
  results.push('Shared reading output');

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1133, height: 744 }, { width: 744, height: 1133 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${viewport.width}`);
    const controls = await page.locator('button:visible').evaluateAll(nodes => nodes.every(node => {
      const rect = node.getBoundingClientRect();
      return rect.width >= 43.9 && rect.height >= 43.9;
    }));
    assert(controls, `Control below 44px at ${viewport.width}`);
  }
  results.push('Desktop and tablet layout');

  await page.getByLabel('Less motion').check();
  await page.getByRole('button', { name: 'Return to today', exact: true }).click();
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'Reduced motion did not settle immediately');
  results.push('Reduced motion');

  for (const mode of ['null', 'throw']) {
    const fallback = await page.context().newPage();
    await fallback.addInitScript(value => {
      HTMLCanvasElement.prototype.getContext = () => {
        if (value === 'throw') throw new Error('Canvas unavailable');
        return null;
      };
    }, mode);
    await fallback.goto('http://127.0.0.1:4600/prototype/');
    assert(await fallback.locator('#canvas-fallback').isVisible(), `Canvas ${mode} does not reveal the reading alternative`);
    assert(await fallback.locator('#canvas-fallback').getByRole('heading', { name: 'Three views of the age 12 choice' }).isVisible(), `Canvas ${mode} fallback lacks comparison reading`);
    await fallback.close();
  }
  results.push('Canvas failure reading fallback');
  return { passed: results };
}
