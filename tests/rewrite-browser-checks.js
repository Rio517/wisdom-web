// Run this function through a Playwright page connected to the local Vite preview.
// The browser tool accepts this file directly; no production test hooks are used.
async (page) => {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const settled = () => page.waitForFunction(() => document.querySelector('#life-map').dataset.motion === 'settled');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4600/prototype/');
  await page.getByLabel('Example age', { exact: true }).selectOption('40');
  await page.getByRole('button', { name: 'Explore this moment', exact: true }).click();
  await settled();
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
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${viewport.width}`);
    const controls = await page.locator('button:visible').evaluateAll(nodes => nodes.every(node => {
      const rect = node.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    }));
    assert(controls, `Control below 44px at ${viewport.width}`);
  }
  results.push('Desktop and tablet layout');

  await page.getByLabel('Less motion').check();
  await page.getByRole('button', { name: 'Return to today', exact: true }).click();
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'Reduced motion did not settle immediately');
  results.push('Reduced motion');
  return { passed: results };
}
