// Run this async page function through the session's Playwright browser tooling.
// It targets the strict development server at 127.0.0.1:4600.
async (page) => {
  const base = 'http://127.0.0.1:4600/prototype/';
  const results = [];
  const consoleErrors = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const settled = () => page.waitForFunction(() => document.querySelector('#life-map')?.dataset.motion === 'settled');
  const afterResize = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const onConsole = message => { if (message.type() === 'error') consoleErrors.push(message.text()); };
  page.on('console', onConsole);

  try {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // 1. Current entry, direct state restoration and map-adjacent comparison semantics.
  await page.goto(`${base}?age=40&selected=1&inspect=12&choice=repair`);
  assert(await page.locator('#example-age').inputValue() === '40', 'Direct navigation loses today');
  assert(await page.locator('#moment-copy').isHidden(), 'Reference gap reflection contradicts comparison view');
  assert(await page.locator('#map-preview').isVisible(), 'Comparison hides pointer/focus preview feedback');
  assert(await page.locator('#decision-panel').evaluate(node => node.compareDocumentPosition(document.querySelector('#life-map')) & Node.DOCUMENT_POSITION_FOLLOWING), 'Comparison controls are not before the map');
  assert(await page.locator('#decision-results').evaluate(node => document.querySelector('#life-map').compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING), 'Named outcomes are not after the map');
  assert(await page.getByRole('heading', { name: 'What becomes possible?', exact: true }).isVisible(), 'Outcome explanation is missing');
  assert(await page.locator('#decision-results').getByText('Later course intake available', { exact: true }).isVisible(), 'Repair outcome is missing');
  assert(await page.locator('#decision-steps li').count() === 4, 'Repair work is incomplete');
  assert(await page.locator('#compounding-copy').getByText(/earlier learning.*later learning/i).isVisible(), 'Guided view omits the cautious compounding explanation');
  const earlierAtForty = await page.locator('[data-review-age]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.reviewAge)));
  assert(JSON.stringify(earlierAtForty) === JSON.stringify([8, 12, 16, 25, 40]), 'Earlier decisions do not match today');
  for (const [choice, expected] of [
    ['gap', /avoids|puts off|skips/i],
    ['build', /asks.*practices.*checks/is],
    ['repair', /first intake.*missed/is]
  ]) {
    await page.getByRole('button', { name: choice === 'gap' ? 'Leave the gap' : choice === 'build' ? 'Build the foundation' : 'What could help next?', exact: true }).click();
    const pattern = page.locator('#pattern-layer');
    if (await pattern.isHidden()) await page.locator('[data-layer="pattern"]').click();
    assert(await pattern.locator('.practice-sequence > li').count() === 3, `${choice} omits its three practice occasions`);
    assert(JSON.stringify(await pattern.locator('.occasion-label').allTextContents()) === JSON.stringify(['First try', 'Another occasion', 'Later check']), `${choice} practice labels are wrong`);
    assert(await pattern.textContent().then(text => expected.test(text)), `${choice} practice occasions are not mode-specific`);
  }
  results.push('Direct state, comparison adjacency and named recovery');

  // 2. Rapid retargeting, interruption and focus after animation.
  await page.goto(base);
  await page.getByLabel('Example age', { exact: true }).selectOption('40');
  await page.getByRole('button', { name: 'Explore this moment', exact: true }).focus();
  await page.keyboard.press('Enter');
  await settled();
  assert(await page.evaluate(() => document.activeElement?.id === 'explore'), 'Explore focus is lost after full animation');
  await page.evaluate(() => {
    const select = document.querySelector('#example-age');
    for (const age of ['16', '25', '60', '40']) {
      select.value = age;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await settled();
  assert(await page.locator('#example-age').inputValue() === '40', 'Latest rapid age input does not win');
  assert(await page.locator('.today-marker').textContent() === 'Today · 40', 'A stale age remains after interruption');
  await page.setViewportSize({ width: 1133, height: 744 });
  await afterResize();
  await page.getByRole('button', { name: 'Compare a choice at age 12', exact: true }).click();
  assert(await page.evaluate(() => document.activeElement?.id === 'decision-heading'), 'Comparison entry leaves focus on its hidden trigger');
  assert(await page.locator('#life-map').evaluate(node => {
    const rect = node.getBoundingClientRect();
    return rect.top < innerHeight && rect.bottom > 0;
  }), 'Comparison entry does not bring the changed routes into view');
  for (const name of ['Leave the gap', 'Build the foundation', 'What could help next?']) {
    await page.getByRole('button', { name, exact: true }).click();
  }
  await settled();
  assert(await page.getByRole('button', { name: 'What could help next?', exact: true }).getAttribute('aria-pressed') === 'true', 'Latest rapid comparison does not win');
  assert(await page.evaluate(() => document.activeElement?.textContent === 'What could help next?'), 'Comparison focus is lost after animation');
  results.push('Rapid age/comparison retargeting and focus');

  // 3. Focus and pointer previews do not commit state, including after page scroll.
  await page.locator('#return-today').click();
  await page.getByRole('button', { name: 'See the whole map', exact: true }).click();
  const previewURL = page.url();
  await page.locator('.map-target[data-age="12"]').focus();
  assert(await page.locator('#map-preview').textContent().then(text => /Age 12:/.test(text)), 'Keyboard focus does not preview an earlier moment');
  assert(await page.locator('#map-preview').textContent().then(text => /responds to a fractions gap/i.test(text)), 'Keyboard preview omits the authored explanatory sentence');
  assert(page.url() === previewURL, 'Focus preview mutates the URL');
  await page.locator('.map-target[data-age="25"]').hover();
  assert(await page.locator('#map-preview').textContent().then(text => /Age 25:/.test(text)), 'Pointer hover on an age target does not preview its moment');
  assert(await page.locator('#map-preview').textContent().then(text => /new training easier to begin/i.test(text)), 'Pointer preview omits the authored explanatory sentence');
  assert(page.url() === previewURL, 'Age-target hover preview mutates the URL');
  await page.evaluate(() => document.querySelector('#life-map').scrollIntoView({ block: 'center' }));
  const canvasPoint = await page.evaluate(async () => {
    const { makeMap, OVERVIEW } = await import('/prototype/model.js');
    const canvas = document.querySelector('#life-map');
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / OVERVIEW.width, rect.height / OVERVIEW.height);
    const offsetX = (rect.width - OVERVIEW.width * scale) / 2;
    const offsetY = (rect.height - OVERVIEW.height * scale) / 2;
    const point = makeMap(40).past.reduce((nearest, item) => (
      Math.abs(item.x - 610) < Math.abs(nearest.x - 610) ? item : nearest
    ));
    const clientX = rect.left + offsetX + point.x * scale;
    const clientY = rect.top + offsetY + point.y * scale;
    if (document.elementFromPoint(clientX, clientY) !== canvas) throw new Error('Past-route test point is obstructed');
    return { x: clientX, y: clientY };
  });
  await page.mouse.move(canvasPoint.x, canvasPoint.y);
  assert(await page.locator('#map-preview').textContent().then(text => /Age 25:/.test(text)), 'Pointer preview is misaligned after scrolling');
  assert(page.url() === previewURL, 'Pointer preview mutates the URL');
  results.push('Keyboard and scrolled pointer previews');

  // 4. Non-comparison inspection survives reload and browser history.
  await page.goto(`${base}?age=40&selected=1&inspect=25`);
  assert(await page.locator('#moment-copy').textContent().then(text => /^Age 25:/.test(text)), 'Direct non-12 inspection is missing');
  await page.reload();
  assert(await page.locator('#moment-copy').textContent().then(text => /^Age 25:/.test(text)), 'Reload loses non-12 inspection');
  await page.locator('[data-review-age="16"]').click();
  assert(await page.locator('#moment-copy').textContent().then(text => /^Age 16:/.test(text)), 'Earlier inspection does not change');
  await page.goBack();
  assert(await page.locator('#moment-copy').textContent().then(text => /^Age 25:/.test(text)), 'Back does not restore non-12 inspection');
  await page.locator('[data-review-age="25"]').focus();
  await page.keyboard.press('Enter');
  assert(await page.evaluate(() => document.activeElement?.dataset.reviewAge === '25'), 'Keyboard review loses focus when the moment list rerenders');
  for (const age of ['40', '12']) {
    await page.goto(`${base}?age=${age}&selected=1&inspect=12&choice=build`);
    await page.locator('#return-today').focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('#example-age').inputValue() === age, `Return to today changes selected age ${age}`);
    assert(await page.evaluate(() => document.activeElement?.id === 'example-age'), `Return to today loses keyboard focus at age ${age}`);
    assert(await page.evaluate(() => new URL(location.href).searchParams.get('inspect') === null), `Return to today leaves inspection open at age ${age}`);
  }
  await page.goto(`${base}?age=12&selected=1&inspect=12`);
  await page.locator('.map-target[data-age="12"]').click();
  assert(await page.evaluate(() => new URL(location.href).searchParams.get('inspect') === null), 'The age-12 today target reopens comparison instead of returning to today');
  results.push('Non-12 reload and history restoration');

  // 5. Comparison and layers survive scene/deep-example/history/reload.
  await page.goto(`${base}?age=40&selected=1&inspect=12&choice=build&layers=pattern,starting`);
  await page.getByRole('button', { name: 'Next: learning opens paths' }).click();
  await page.getByRole('button', { name: 'Does learning carry into other activities?' }).click();
  assert(await page.locator('#tennis-dialog').isVisible(), 'Deep example does not open');
  await page.getByRole('button', { name: 'Return to the explanation', exact: true }).click();
  assert(await page.evaluate(() => document.activeElement?.textContent === 'Does learning carry into other activities?'), 'Dialog close does not restore visible trigger focus');
  await page.getByRole('button', { name: 'Back to your moment' }).click();
  assert(await page.getByRole('button', { name: 'Build the foundation', exact: true }).getAttribute('aria-pressed') === 'true', 'Scene return loses comparison');
  assert(await page.locator('#pattern-layer').getByText(/One missed night does not erase/i).isVisible(), 'Scene return loses pattern layer');
  assert(await page.locator('#starting-layer').getByText(/not the same as understanding/i).isVisible(), 'Scene return loses starting layer');
  await page.goBack();
  assert(await page.locator('#learning-scene').isVisible(), 'Back does not restore learning scene');
  await page.goForward();
  assert(await page.locator('#possibilities-scene').isVisible(), 'Forward does not restore comparison scene');
  await page.reload();
  assert(await page.locator('#pattern-layer').getByText(/One missed night does not erase/i).isVisible(), 'Reload loses comparison layers');
  results.push('Layered state across scenes, deep example, history and reload');

  // 6. Browser Back closes a visible-scene dialog; skip navigation preserves scene.
  await page.getByRole('button', { name: 'Next: learning opens paths' }).click();
  await page.getByRole('button', { name: 'Does learning carry into other activities?' }).click();
  await page.goBack();
  await page.locator('#possibilities-scene').waitFor({ state: 'visible' });
  assert(!await page.locator('#tennis-dialog').isVisible(), 'Browser Back leaves contextual dialog open');
  assert(await page.evaluate(() => document.activeElement?.id === 'opening-title'), 'Browser Back restores focus to a hidden scene trigger');
  await page.goForward();
  await page.locator('#learning-scene').waitFor({ state: 'visible' });
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  assert(page.url().endsWith('#learning'), 'Skip link changes the current scene');
  assert(await page.evaluate(() => document.activeElement?.id === 'main'), 'Skip link does not focus content');
  results.push('Dialog Back behavior and scene-preserving skip link');

  // 7. Tablet index traps focus and dismisses with Escape.
  await page.setViewportSize({ width: 744, height: 1133 });
  await page.goto(`${base}?age=40&selected=1`);
  await page.getByRole('button', { name: 'Open index', exact: true }).click();
  assert(await page.locator('#main').evaluate(node => node.inert), 'Tablet index does not make content inert');
  await page.getByRole('link', { name: 'Source code', exact: true }).focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.activeElement?.className === 'brand'), 'Tablet index does not wrap focus');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => document.activeElement?.id === 'open-index'), 'Escape does not restore index-opener focus');
  assert(!await page.locator('#main').evaluate(node => node.inert), 'Escape leaves content inert');
  results.push('Tablet index focus trap and Escape');

  // 8. Manual reduced motion survives an OS preference cycle.
  await page.getByLabel('Less motion').check();
  await page.getByLabel('Example age', { exact: true }).selectOption('60');
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'Manual reduced motion does not settle immediately');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('#reduce-motion').disabled);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !document.querySelector('#reduce-motion').disabled);
  assert(await page.getByLabel('Less motion').isChecked(), 'Manual reduced-motion choice is lost after OS cycle');
  await page.getByLabel('Example age', { exact: true }).selectOption('12');
  assert(await page.locator('#life-map').getAttribute('data-motion') === 'settled', 'Restored manual choice allows animation');
  results.push('Manual and system reduced motion');

  // 9. Live resize retains alignment/readability for every comparison and both scenes.
  for (const choice of ['gap', 'build', 'repair']) {
    await page.goto(`${base}?age=40&selected=1&inspect=12&choice=${choice}`);
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 1133, height: 744 }, { width: 744, height: 1133 }]) {
      await page.setViewportSize(viewport);
      await afterResize();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${choice} possibilities overflow at ${viewport.width}`);
      const controls = await page.locator('button:visible').evaluateAll(nodes => nodes.every(node => {
        const rect = node.getBoundingClientRect();
        return rect.width >= 43.9 && rect.height >= 43.9;
      }));
      assert(controls, `Control below 44px in ${choice} at ${viewport.width}`);
      const annotationSize = await page.locator('.route-marker').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
      assert(annotationSize >= 16, `${choice} outcome annotation below 16px at ${viewport.width}`);
      const geometry = await page.evaluate(() => {
        const intersects = (a, b) => !(a.right <= b.left + 0.1 || a.left >= b.right - 0.1 || a.bottom <= b.top + 0.1 || a.top >= b.bottom - 0.1);
        const map = document.querySelector('.map-canvas-wrap').getBoundingClientRect();
        const markers = [...document.querySelectorAll('.route-marker')].map(node => node.getBoundingClientRect());
        const obstacles = [...document.querySelectorAll('.map-target:not([hidden]), .today-marker')].map(node => node.getBoundingClientRect());
        return {
          markerCount: markers.length,
          allInsideMap: markers.every(marker => marker.left >= map.left - 0.1 && marker.right <= map.right + 0.1 && marker.top >= map.top - 0.1 && marker.bottom <= map.bottom + 0.1),
          markerOverlap: markers.some((marker, index) => markers.slice(index + 1).some(other => intersects(marker, other))),
          obstacleOverlap: markers.some(marker => obstacles.some(obstacle => intersects(marker, obstacle)))
        };
      });
      assert(geometry.markerCount === (choice === 'repair' ? 5 : 3), `${choice} has the wrong annotation count at ${viewport.width}`);
      assert(geometry.allInsideMap, `${choice} annotations leave the map at ${viewport.width}`);
      assert(!geometry.markerOverlap, `${choice} annotations overlap each other at ${viewport.width}`);
      assert(!geometry.obstacleOverlap, `${choice} annotations overlap age controls at ${viewport.width}`);
      await page.getByRole('button', { name: 'Next: learning opens paths' }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Learning scene overflows at ${viewport.width}`);
      await page.getByRole('button', { name: 'Back to your moment' }).click();
    }
  }
  results.push('Resize alignment, target sizes and both-scene overflow');

  // 10. Shared reading remains available when Canvas or JavaScript is unavailable.
  for (const mode of ['null', 'throw']) {
    const fallback = await page.context().newPage();
    await fallback.addInitScript(value => {
      HTMLCanvasElement.prototype.getContext = () => {
        if (value === 'throw') throw new Error('Canvas unavailable');
        return null;
      };
    }, mode);
    await fallback.goto(base);
    assert(await fallback.locator('#canvas-fallback').isVisible(), `Canvas ${mode} does not reveal reading alternative`);
    assert(await fallback.getByRole('heading', { name: 'Three views of the age 12 choice' }).isVisible(), `Canvas ${mode} fallback is incomplete`);
    await fallback.close();
  }
  const browser = page.context().browser();
  const noJSContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 744, height: 1133 } });
  const noJS = await noJSContext.newPage();
  await noJS.goto(base);
  const noJSReading = noJS.locator('.nojs-reading');
  const noJSHeading = noJSReading.getByRole('heading', { name: 'Three views of the age 12 choice' });
  assert(await noJSHeading.isVisible(), 'No-JavaScript reading omits comparison');
  assert(await noJSReading.getByText(/Not all of this is Mika's choice/i).isVisible(), 'No-JavaScript reading omits circumstances');
  assert(await noJSReading.locator('p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 20), 'No-JavaScript reading falls below 20px narrative type');
  assert(await noJS.locator('#site-index, #open-index, main button, main select').evaluateAll(nodes => nodes.every(node => {
    return node.getClientRects().length === 0;
  })), 'No-JavaScript shell presents dead interaction controls');
  await noJSHeading.scrollIntoViewIfNeeded();
  const headingIsUnobscured = await noJSHeading.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 20));
    return hit === node || node.contains(hit);
  });
  assert(headingIsUnobscured, 'No-JavaScript comparison heading is covered by fixed UI');
  await noJSContext.close();
  results.push('Canvas failure and JavaScript-disabled shared reading');

  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { passed: results };
  } finally {
    page.off('console', onConsole);
  }
}
