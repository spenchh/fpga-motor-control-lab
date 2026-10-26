const {createRequire}=require('node:module');
const {mkdirSync,writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
const load=process.env.LAB_NODE_MODULES?createRequire(resolve(process.env.LAB_NODE_MODULES,'_lab.cjs')):require;
const {chromium}=load('playwright');
const base=process.env.LAB_URL||'http://127.0.0.1:8795';
const output=resolve(__dirname,'../tmp/browser');mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.LAB_BROWSER_PATH?{executablePath:process.env.LAB_BROWSER_PATH}:{channel:'chrome'}),args:['--no-sandbox','--disable-dev-shm-usage']});
  const errors=[];
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('#page h1');
  assert.ok(await page.locator('body').evaluate(body=>body.classList.contains('is-home')));
  const chapters=await page.evaluate(()=>LabDocs.pages.map(p=>({id:p.id,title:p.title})));
  for(const size of [{width:1440,height:1000},{width:390,height:844},{width:320,height:667}]){
    await page.setViewportSize(size);
    for(const chapter of chapters){
      await page.goto(`${base}/#/${chapter.id}`);await page.waitForSelector('#page h1');
      assert.equal(await page.locator('#page h1').textContent(),chapter.title);
      assert.ok(!/short version for a meeting|professor update|what you should say/i.test(await page.locator('#page').innerText()));
      const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(dimensions.scroll<=dimensions.width+1,`${chapter.id} overflow ${size.width}: ${JSON.stringify(dimensions)}`);
      assert.deepEqual(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);}),[],`${chapter.id}: duplicate IDs`);
      for(const canvas of await page.locator('#page canvas').all()){
        const colors=await canvas.evaluate(cv=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,s=new Set();for(let i=0;i<d.length;i+=64)s.add(`${d[i]},${d[i+1]},${d[i+2]}`);return s.size;});
        assert.ok(colors>4,`${chapter.id}: nonblank canvas`);
      }
    }
    await page.goto(`${base}/#/home`);await page.screenshot({path:resolve(output,`home-${size.width}.png`),fullPage:true});
    assert.ok(await page.locator('.research-mark').evaluate(img=>img.complete&&img.naturalWidth>0));
    const hero=await page.locator('.research-hero').boundingBox();
    const actions=await page.locator('.research-actions').boundingBox();
    assert.ok(actions.y+actions.height<hero.y+hero.height-30,`Home actions clipped at ${size.width}`);
    await page.getByRole('link',{name:'Explore the project',exact:false}).click();
    await page.waitForFunction(title=>document.querySelector('#page h1')?.textContent===title,chapters.find(c=>c.id==='overview').title);
    assert.equal(await page.locator('#page h1').textContent(),chapters.find(c=>c.id==='overview').title);
    await page.screenshot({path:resolve(output,`overview-${size.width}.png`),fullPage:true});
    await page.goto(`${base}/#/transforms`);await page.screenshot({path:resolve(output,`transforms-${size.width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${base}/#/study`);
  const progress=page.locator('[data-study-key="physical"]');await progress.check();
  await page.reload();assert.ok(await progress.isChecked());await progress.uncheck();
  const explanation=page.locator('.study-check').first();await explanation.locator('summary').click();
  assert.ok(await explanation.evaluate(el=>el.open));
  await page.screenshot({path:resolve(output,'study-desktop.png'),fullPage:true});
  await page.goto(`${base}/#/walkthrough`);assert.match(await page.locator('#page').innerText(),/527/);
  await page.screenshot({path:resolve(output,'walkthrough-desktop.png'),fullPage:true});
  await page.goto(`${base}/#/reproduce`);assert.match(await page.locator('#page').innerText(),/trace_test.py/);
  await page.screenshot({path:resolve(output,'reproduce-desktop.png'),fullPage:true});
  await page.goto(`${base}/#/transforms`);assert.equal(await page.getByRole('slider',{name:'Vector magnitude (per unit)',exact:true}).inputValue(),'0.75');
  await page.goto(`${base}/#/pi`);assert.equal(await page.getByRole('slider',{name:'Constant error',exact:true}).inputValue(),'0.125');
  await page.goto(`${base}/#/rtl`);
  for(const module of await page.locator('#module-select option').evaluateAll(nodes=>nodes.map(n=>n.value))){
    await page.selectOption('#module-select',module);
    assert.ok(await page.locator('#source-blocks .code-row').count()>15);
    await page.click('#test-source');assert.ok((await page.locator('.source-meta').textContent()).includes(`tb_${module}.sv`));
    await page.click('#design-source');
  }
  await page.click('#notes-source');assert.ok(await page.locator('.line-notes li').count()>10);
  await page.selectOption('#module-select','pi_controller_q15');await page.screenshot({path:resolve(output,'source-desktop.png'),fullPage:true});
  await page.goto(`${base}/#/pwm`);const before=await page.locator('.readout').innerText();await page.getByRole('button',{name:'Inhibit outputs',exact:true}).click();assert.notEqual(await page.locator('.readout').innerText(),before);
  await page.goto(`${base}/#/protection`);await page.getByRole('button',{name:'Sensors ready',exact:true}).click();assert.match(await page.locator('.readout').innerText(),/run/);await page.getByRole('button',{name:'Inject overcurrent',exact:true}).click();assert.match(await page.locator('.readout').innerText(),/inhibit/);await page.getByRole('button',{name:'Remove overcurrent',exact:true}).click();await page.getByRole('button',{name:'Clear latch',exact:true}).click();assert.match(await page.locator('.readout').innerText(),/run/);
  await page.goto(`${base}/#/pipeline`);await page.getByRole('button',{name:'Next clock',exact:true}).click();assert.match(await page.locator('.readout').innerText(),/E1/);
  await page.fill('#search','Clarke');assert.ok(await page.locator('#search-results a').count()>0);await page.locator('#search-results a').first().click();
  await page.click('#ask-toggle');await page.fill('#question','What changed to close timing?');await page.click('#chat-form button');await page.waitForFunction(()=>document.querySelector('#chat-form button').disabled===false);assert.match(await page.locator('.chat-answer').innerText(),/0\.557/);
  const answers=await page.evaluate(()=>['What motor is modeled?','What PWM frequency are we using?','Have any simulations passed?','Is Hall decoding integrated into the angle?','What are the inputs of adc_current_scaler_q15?'].map(q=>({q,...LabDocs.localAnswer(q)})));
  assert.match(answers[0].answer,/simulation parameters|simulation inputs/i);assert.match(answers[1].answer,/50 kHz/);assert.match(answers[2].answer,/13/);assert.match(answers[3].answer,/not connected/);assert.match(answers[4].answer,/adc_a/);
  const learningAnswers=await page.evaluate(()=>['Where do I start with no prior knowledge?','How do I save a waveform?','Does a higher PWM frequency improve efficiency?'].map(q=>LabDocs.localAnswer(q)));
  assert.equal(learningAnswers[0].page,'start');assert.equal(learningAnswers[1].page,'reproduce');assert.equal(learningAnswers[2].page,'decisions');
  await page.click('#ask-close');assert.ok(await page.locator('#assistant').isHidden());
  await page.click('#theme-toggle');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.screenshot({path:resolve(output,'dark-desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.click('#menu-toggle');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('#navigation a[href="#/motor"]').click();await page.waitForFunction(()=>document.querySelector('#menu-toggle').getAttribute('aria-expanded')==='false');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');
  assert.deepEqual(errors,[]);
  writeFileSync(resolve(output,'results.json'),JSON.stringify({chapters:chapters.length,viewports:[1440,390,320],sourceFiles:27,browserErrors:errors,answers,status:'PASS'},null,2));
  await browser.close();console.log(`PASS: ${chapters.length} chapters at desktop/mobile, canvas pixels, 13 source/test pairs, controls, search, answers, theme, and navigation.`);
})().catch(e=>{console.error(e);process.exit(1);});
