// Run with the shared Playwright tool. Uses the current 4601 preview if open,
// otherwise development on 4600. No browser dependency or page debug globals.
async (page) => {
  const base = page.url().includes(':4601/') ? 'http://127.0.0.1:4601' : 'http://127.0.0.1:4600';
  const checks = [];
  const errors = [];
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const errorHandler = error => errors.push(error.message);
  const consoleHandler = message => { if (message.type() === 'error') errors.push(message.text()); };
  const settled = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const data = () => page.locator('#choices-canvas').evaluate(canvas => ({ ...canvas.dataset }));
  const startIsUncovered = () => page.evaluate(async () => {
    const { generateNetwork } = await import('/src/engine/path-network.js');
    const { LAB_DEFAULTS, networkOptionsForLab } = await import('/src/engine/lab-settings.js');
    const { fitOverview } = await import('/src/engine/lab-renderer.js');
    const network = generateNetwork(networkOptionsForLab(LAB_DEFAULTS));
    const rect = document.querySelector('#choices-canvas').getBoundingClientRect();
    const start = fitOverview(network.bounds, rect, undefined, network.maxAge).world(network.nodes.find(node => node.id === network.rootId));
    return document.elementFromPoint(rect.left + start.x, rect.top + start.y)?.id === 'choices-overlay';
  });
  const storyObstructions = () => page.evaluate(() => {
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const navigation = document.querySelector('.scene-navigation').getBoundingClientRect();
    const heading = document.querySelector('#choices-scene-title').getBoundingClientRect();
    const result = overlaps(navigation, heading) ? ['scene heading'] : [];
    const blockers = [...document.querySelectorAll('.scene-copy, .scene-navigation, .story-text-toggle')]
      .map(element => element.getBoundingClientRect());
    for (const label of document.querySelectorAll('#trail-frame:not([hidden]) svg text')) {
      if (blockers.some(rect => overlaps(rect, label.getBoundingClientRect()))) result.push(label.textContent);
    }
    return result;
  });
  page.on('pageerror', errorHandler);
  page.on('console', consoleHandler);
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/prototype/choices.html`);
    await page.reload(); // Preview may otherwise retain the previous build on a fragment-only navigation.
    await page.waitForSelector('#choices-scene-title');
    await settled();
    assert((await data()).ready === 'true', 'The opening map did not render');
    const stage = await page.evaluate(() => {
      const main = document.querySelector('#choices-main').getBoundingClientRect();
      const canvas = document.querySelector('#choices-canvas').getBoundingClientRect();
      return { main: main.width, canvas: canvas.width };
    });
    assert(stage.canvas >= stage.main * 0.85, 'The life-map drawing must span the page, not share a narrow text column');
    const coreCardIsRight = await page.evaluate(() => {
      const stage = document.querySelector('#story-view').getBoundingClientRect();
      const card = document.querySelector('#choices-scene').getBoundingClientRect();
      return card.left >= stage.left + stage.width / 2;
    });
    assert(coreCardIsRight, 'The full-map story card must sit on the right');
    if (base.endsWith('4600')) {
      assert(await startIsUncovered(), 'The text overlay must not cover the map’s starting point');
    }
    await page.locator('#toggle-story-text').click();
    assert(await page.locator('.scene-copy').isHidden(), 'Hide text must reveal the drawing');
    assert(await page.locator('#lesson-next').isVisible(), 'Scene navigation must remain available with text hidden');
    await page.locator('#toggle-story-text').click();
    assert(await page.locator('.scene-copy').isVisible(), 'Show text must restore the story');
    assert(await page.locator('#choices-scene-title').innerText() === 'Your life has many possible paths.', 'The main lesson must open before the optional example');
    assert(!await page.locator('#choices-scene').innerText().then(text => text.includes('Alfredo')), 'The optional hike must not lead the main lesson');
    const overviewBitmap = await page.locator('#choices-canvas').evaluate(el => el.toDataURL());
    await page.locator('#lesson-next').click();
    assert(page.url().endsWith('#small-choices-add-up'), 'Accumulation needs a stable core fragment');
    assert(await page.locator('#choices-scene-title').innerText() === 'Small choices can change what comes next.', 'The core accumulation scene is missing');
    assert(await page.locator('#map-frame').isVisible(), 'Core accumulation must retain the overview map');
    assert(await page.locator('#choices-canvas').evaluate(el => el.toDataURL()) === overviewBitmap, 'Core progression regenerated or changed the overview map');
    await page.locator('#lesson-next').click();
    assert(page.url().endsWith('#not-everything-is-yours-to-choose'), 'Outside control needs a stable core fragment');
    assert(await page.locator('#choices-scene-title').innerText() === 'Not everything is yours to choose.', 'The core circumstances scene is missing');
    assert(await page.locator('#map-frame').isVisible(), 'Core circumstances must retain the overview map');
    await page.locator('#lesson-next').click();
    assert(page.url().endsWith('#not-everything-is-yours-to-choose'), 'Finishing the core must not enter the example');
    assert(await page.locator('#lesson-complete').isVisible(), 'Core Finish needs its own visible completion');
    assert(await page.locator('#lesson-next').isDisabled(), 'Completed core Finish must stop the main sequence');
    await page.locator('#open-hike-example').click();
    assert(page.url().endsWith('#alfredo-hikes'), 'The optional example needs its own entry fragment');
    assert(await page.locator('#story-view').getAttribute('data-track') === 'example', 'Example entry did not change tracks');
    assert(await page.locator('.scene-kicker').isVisible() && await page.locator('.scene-kicker').innerText().then(text => /example.*alfredo/i.test(text)), 'The hike must be visibly labeled as an example');
    assert(await page.locator('#return-to-core').isVisible(), 'The example needs a clear return to the main lesson');
    await page.locator('#lesson-next').click();
    assert(page.url().endsWith('#small-actions-add-up'), 'The first hike setback must keep its existing fragment');
    await page.locator('#lesson-next').click();
    const storyTitle = await page.locator('#choices-scene-title').innerText();
    assert(await page.locator('#trail-frame .trail-route-active').count() === 0, 'Preparing the retry must not depict an already completed hike');
    await page.locator('[data-deep-dive="learning"]').click();
    assert(await page.locator('#deep-dive-title').isVisible(), 'Learning deep dive missing');
    await page.locator('[data-close-deep-dive]').click();
    assert(await page.locator('[data-deep-dive="learning"]').evaluate(el => el === document.activeElement), 'Deep dive must restore focus');
    await page.locator('#explore-map').click();
    await settled();
    const initial = await data();
    const bitmap = await page.locator('#choices-canvas').evaluate(el => el.toDataURL());
    const choice = page.locator('[data-map-choice]').first();
    assert(await page.locator('#map-choice-list').getByRole('button').count() === await page.locator('[data-map-choice]').count(), 'Choice controls must retain native button semantics');
    await choice.focus();
    assert(await choice.evaluate(el => el === document.activeElement), 'Preview must retain the focused choice');
    assert(await page.locator('#choices-canvas').evaluate(el => el.toDataURL()) === bitmap, 'Preview repainted the base map');
    assert((await data()).age === initial.age, 'Preview moved Today');
    await page.keyboard.press('Escape');
    assert(await page.locator('#map-preview-panel').isHidden(), 'Escape must dismiss preview');
    await choice.click();
    await page.locator('#use-previewed-path').click();
    const committed = await data();
    assert(await page.evaluate(() => Boolean(document.activeElement?.matches('[data-map-choice], #map-next, #map-previous'))), 'Confirming a path must move focus out of the hidden preview panel');
    assert(Number(committed.age) > Number(initial.age), 'Confirmed path did not advance');
    assert(committed.geometry === initial.geometry, 'Choosing regenerated geometry');
    await page.locator('#map-previous').click();
    assert(Number((await data()).age) < Number(committed.age), 'Previous choice must revisit an earlier fork');
    await page.locator('#map-next').click();
    assert((await data()).geometry === initial.geometry, 'Forward/back navigation regenerated geometry');
    const beforeResume = await data();
    await page.locator('#resume-story').click();
    assert(await page.locator('#choices-scene-title').innerText() === storyTitle, 'Resume lost the reader’s scene');
    await page.locator('#explore-map').click();
    assert((await data()).age === beforeResume.age, 'Resuming exploration lost the cursor');
    await page.locator('#example-age').fill('40');
    assert((await data()).geometry === initial.geometry, 'Editing age regenerated the map before confirmation');
    await page.locator('#confirm-age').click();
    assert((await data()).age === '40' && (await data()).geometry !== initial.geometry, 'Confirmed age did not create a new example');
    for (const age of ['0', '70']) {
      await page.locator('#example-age').fill(age);
      await page.locator('#confirm-age').click();
      assert((await data()).age === age, `Age ${age} failed`);
    }
    assert(await page.locator('#map-next').isDisabled(), 'At age70 Next must stop');
    checks.push('Lesson navigation, deep dives, blue preview, stable geometry, commit/revisit, resume and confirmed ages');

    // Public controller on real Canvas: first taps and ambiguous clicks remain
    // previews even as the pointer leaves to reach the confirmation controls.
    if (base.endsWith('4600')) {
      const controllerChecks = await page.evaluate(async () => {
        const { createChoicesMap, hitTestPaths } = await import('/prototype/choices-map.js');
        const { fitOverview } = await import('/src/engine/lab-renderer.js');
        const holder = document.createElement('div');
        holder.style.cssText = 'position:absolute;top:0;left:0;width:1000px;height:600px';
        const canvas = document.createElement('canvas');
        const overlay = document.createElement('canvas');
        for (const element of [canvas, overlay]) { element.style.cssText = 'width:1000px;height:600px;position:absolute;inset:0'; holder.append(element); }
        document.body.append(holder);
        const map = createChoicesMap({ canvas, overlay });
        const require = (value, message) => { if (!value) throw new Error(message); };
        try {
          map.explore(25);
          const initial = map.getState();
          const edge = initial.network.edges.find(edge => edge.id === initial.choices[0].id);
          const rect = overlay.getBoundingClientRect();
          const view = fitOverview(initial.network.bounds, rect, undefined, initial.network.maxAge);
          const p = view.world(edge.points[Math.floor(edge.points.length / 2)]);
          const event = (type, pointerType = 'touch', point = p) => overlay.dispatchEvent(new PointerEvent(type, { pointerType, clientX: rect.left + point.x, clientY: rect.top + point.y, bubbles: true }));
          event('pointerdown'); event('pointerup'); event('pointerleave');
          require(map.getState().preview && map.getState().age === initial.age, 'First touch must retain an uncommitted preview after pointerleave');
          map.preview(null);
          const fork = initial.network.nodes.find(node => node.id === initial.activeChoiceId);
          const crossing = view.world(fork);
          event('pointerdown', 'mouse', crossing); event('pointerup', 'mouse', crossing); event('pointerleave', 'mouse', crossing);
          require(map.getState().preview && map.getState().age === initial.age, 'An ambiguous click must keep its preview while moving to confirmation');
          require(map.getState().choices.length >= 2, 'Crossings must expose nearby choices');
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          require(map.getState().preview === null, 'Escape must clear the pinned preview');
          event('pointerup', 'mouse');
          require(map.getState().age === initial.age && !map.getState().preview, 'A release without a press on the map must not commit or preview');
          const unique = initial.projection.segments.filter(segment => segment.state === 'possible')
            .flatMap(segment => segment.points.map(point => ({ point: view.world(point), edgeId: segment.edgeId })))
            .reverse().find(candidate => { const hit = hitTestPaths(initial.projection, view, candidate.point); return hit && !hit.ambiguous; });
          require(unique, 'Fixture needs a uniquely clickable future path');
          event('pointerdown', 'mouse', unique.point); event('pointerup', 'mouse', unique.point);
          require(map.getState().age > initial.age, 'A real mouse click must commit a connected future path');
          const previousFork = map.getState().network.nodes.find(node => node.id === initial.activeChoiceId);
          const previousPoint = view.world(previousFork);
          event('pointerdown', 'touch', { x: previousPoint.x, y: previousPoint.y + 18 });
          event('pointerup', 'touch', { x: previousPoint.x, y: previousPoint.y + 18 });
          require(map.getState().age < initial.network.nodes.find(node => node.id === initial.network.edges.find(edge => edge.id === unique.edgeId).to).age,
            'Touch must reach an earlier fork within a generous target');
          const gray = initial.projection.segments.find(segment => segment.state === 'untaken');
          map.preview(gray.edgeId);
          require(map.getState().preview.available === false && map.getState().preview.revisitPointId, 'Gray preview needs an earlier divergence');
          require(map.choose(gray.edgeId) === false, 'Gray path must not commit directly');
          require(map.revisit(map.getState().preview.revisitPointId), 'Gray preview must support revisiting its earlier fork');
          return 'Real Canvas touch preview, crossing disambiguation, Escape and gray-path revisit';
        } finally { map.destroy(); holder.remove(); }
      });
      checks.push(controllerChecks);
    }

    if (await page.locator('#site-index').isHidden()) await page.locator('#open-index').click();
    if (!await page.locator('[data-topic-scene="world"]').isVisible()) await page.locator('.example-index > summary').click();
    await page.locator('[data-topic-scene="world"]').click();
    assert(await page.locator('#site-index').isHidden(), 'Selecting a topic must close the index so it cannot cover the story controls');
    assert(await page.locator('#story-view').isVisible() && await page.locator('#exploration-view').isHidden(), 'Topic navigation from exploration must return to the story');
    assert(await page.locator('#trail-frame .trail-close').isVisible(), 'The second setback must retain the closed-trail diagram');
    await page.locator('#toggle-story-text').click();
    await page.locator('#lesson-next').click();
    assert(await page.locator('.scene-copy').isHidden(), 'Finishing must preserve hidden text');
    assert(await page.locator('#toggle-story-text').evaluate(el => el === document.activeElement), 'Finishing with text hidden must restore focus to a visible control');
    await page.locator('#toggle-story-text').click();
    assert(await page.locator('#lesson-complete').isVisible(), 'The optional example needs a visible completion state');
    await page.locator('#read-whole-lesson').click();
    const readingText = await page.locator('#reading-dialog').innerText();
    assert(/Your life has many possible paths/.test(readingText) && /Not everything is yours to choose/.test(readingText), 'Full reading must lead with the complete core lesson');
    assert(await page.locator('#reading-dialog .reading-example-content').isHidden(), 'The hike must begin as a closed optional disclosure');
    await page.locator('#reading-dialog .reading-example > summary').click();
    assert(await page.locator('#reading-dialog').innerText().then(text => /Alfredo/.test(text) && /ranger/.test(text) && /bridge/i.test(text)), 'Opened example is missing hike parity');
    await page.keyboard.press('Escape');
    await page.locator('#return-to-core').click();
    assert(await page.locator('#choices-scene-title').innerText() === 'Not everything is yours to choose.', 'Returning from the example lost the core scene');
    assert(await page.locator('#lesson-complete').isVisible(), 'Returning from the example lost core completion');
    await page.goBack();
    assert(await page.locator('#choices-scene-title').innerText().then(text => /respond/i.test(text)), 'Browser Back must restore the example scene');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#lesson-back').click();
    assert(await page.locator('.scene-enter').evaluate(el => Number.parseFloat(getComputedStyle(el).animationDuration) < 0.01), 'Reduced motion must be effectively immediate');
    checks.push('Topic navigation, weather/help context, complete reading, browser history and reduced motion');
    await page.locator('#explore-map').click();
    await page.evaluate(() => { location.hash = '#small-actions-add-up'; });
    await page.waitForFunction(() => document.querySelector('#story-view').hidden === false);
    assert(await page.locator('#choices-scene-title').innerText().then(text => /turning back/i.test(text)), 'Direct fragment must leave exploration and select its scene');

    for (const viewport of [{ width: 1133, height: 744 }, { width: 744, height: 1133 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/prototype/choices.html`);
      await page.waitForSelector('#choices-scene-title');
      await settled();
      if (base.endsWith('4600')) assert(await startIsUncovered(), `Story overlay covers the starting point at ${viewport.width}`);
      assert((await storyObstructions()).length === 0, `Opening controls overlap the heading at ${viewport.width}`);
      if (viewport.width > 900) {
        assert(await page.evaluate(() => {
          const stage = document.querySelector('#story-view').getBoundingClientRect();
          const card = document.querySelector('#choices-scene').getBoundingClientRect();
          return card.left >= stage.left + stage.width / 2;
        }), 'Landscape full-map card must stay on the right');
      } else {
        assert(await page.evaluate(() => document.querySelector('.visual-column').getBoundingClientRect().top < document.querySelector('#choices-scene').getBoundingClientRect().top), 'Portrait must show the map before the story text');
      }
      await page.locator('#lesson-next').click();
      assert((await storyObstructions()).length === 0, `Core accumulation content is obscured at ${viewport.width}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${viewport.width}`);
      if (viewport.width === 744) assert(await page.locator('#site-index').isHidden(), 'Portrait index must start collapsed, not cover content');
      await page.locator('#explore-map').click();
      await settled();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Exploration overflow at ${viewport.width}`);
      await page.locator('#resume-story').click();
      await page.locator('#lesson-next').click();
      assert((await storyObstructions()).length === 0, `Core circumstances content is obscured at ${viewport.width}`);
      await page.locator('#lesson-next').click();
      assert(await page.locator('#lesson-complete').isVisible(), `Core Finish failed at ${viewport.width}`);
      await page.locator('#open-hike-example').click();
      assert(await page.locator('#return-to-core').isVisible(), `Example return is missing at ${viewport.width}`);
      await page.locator('#lesson-next').click();
      assert((await storyObstructions()).length === 0, `First-hike content is obscured at ${viewport.width}`);
      await page.locator('#lesson-next').click();
      assert((await storyObstructions()).length === 0, `Retry content is obscured at ${viewport.width}`);
      await page.locator('#lesson-next').click();
      assert((await storyObstructions()).length === 0, `Resilience content is obscured at ${viewport.width}`);
    }
    checks.push('iPad mini portrait and landscape layout');

    for (const fallback of ['no-js', 'no-canvas']) {
      const context = await page.context().browser().newContext({ javaScriptEnabled: fallback !== 'no-js', viewport: { width: 744, height: 1133 } });
      try {
        if (fallback === 'no-canvas') await context.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
        const reading = await context.newPage();
        await reading.goto(`${base}/prototype/choices.html`);
        const content = reading.locator(`${fallback === 'no-js' ? '#reading-dialog' : '#canvas-fallback'} .choices-reading`);
        await content.waitFor();
        assert(await content.isVisible(), `${fallback}: complete lesson not visible`);
        assert(await content.innerText().then(text => /Your life has many possible paths/.test(text) && /Not everything is yours to choose/.test(text)), `${fallback}: missing core lesson`);
        const example = content.locator('.reading-example');
        assert(await example.isVisible() && await example.locator('.reading-example-content').isHidden(), `${fallback}: optional example disclosure is not closed`);
        await example.locator('summary').click();
        assert(await content.innerText().then(text => /Alfredo/.test(text) && /ranger/.test(text)), `${fallback}: opened example is missing essential hike text`);
        assert(await content.innerText().then(text => /water/i.test(text) && /father/i.test(text) && /resilience/i.test(text)), `${fallback}: opened setback and recovery story missing`);
        assert(await reading.locator('.reading-life-map svg').count() > 0, `${fallback}: actual life-map diagram missing`);
        assert(await content.innerText().then(text => /preview/i.test(text) && /revisit/i.test(text) && /resume story/i.test(text)), `${fallback}: map interaction explanations missing`);
        assert(await reading.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${fallback}: horizontal overflow`);
      } finally { await context.close(); }
    }
    checks.push('No-JavaScript and Canvas-failure reading parity');
    assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
    return { base, checks, errors };
  } finally {
    page.off('pageerror', errorHandler);
    page.off('console', consoleHandler);
  }
}
