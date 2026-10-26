/* Start the local site and run its browser checks in the same process environment. */
const {spawn} = require('node:child_process');
const {resolve} = require('node:path');
const root = resolve(__dirname, '..');
const port = process.env.LAB_TEST_PORT || '8795';
const server = spawn(process.execPath, ['tools/serve.mjs', port], {cwd:root, stdio:['ignore','pipe','pipe']});
let launched = false;
const timer = setTimeout(() => {console.error('Local server did not become ready.'); server.kill(); process.exitCode=1;}, 30000);
server.stderr.on('data', data => process.stderr.write(data));
server.stdout.on('data', data => {
  if (launched || !data.toString().includes('http://localhost:')) return;
  launched=true; clearTimeout(timer);
  const check=spawn(process.execPath, ['tools/browser-check.cjs'], {
    cwd:root, stdio:'inherit', env:{...process.env, LAB_URL:`http://127.0.0.1:${port}`}
  });
  const timeout=setTimeout(()=>{console.error('Browser checks timed out.');check.kill();server.kill();process.exitCode=1;},180000);
  check.on('exit', code=>{clearTimeout(timeout);server.kill();process.exitCode=code===0?0:1;});
  check.on('error', error=>{clearTimeout(timeout);console.error(error.message);server.kill();process.exitCode=1;});
});
server.on('exit', code=>{if(!launched){clearTimeout(timer);console.error(`Server exited before checks: ${code}`);process.exitCode=1;}});
server.on('error', error=>{clearTimeout(timer);console.error(error.message);process.exitCode=1;});
