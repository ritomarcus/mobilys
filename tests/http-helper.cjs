const fs = require('node:fs');
const path = require('node:path');
const base = process.env.MOBILYS_TEST_API || 'http://127.0.0.1:8080/api';
function credenciais() {
  const arquivo = path.join(__dirname, '../backend/.env');
  const dados = fs.existsSync(arquivo) ? Object.fromEntries(fs.readFileSync(arquivo, 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0,l.indexOf('=')), l.slice(l.indexOf('=')+1)])) : {};
  const email = process.env.MOBILYS_TEST_EMAIL || dados.BOOTSTRAP_ADMIN_EMAIL;
  const senha = process.env.MOBILYS_TEST_PASSWORD || dados.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !senha) throw new Error('Configure MOBILYS_TEST_EMAIL e MOBILYS_TEST_PASSWORD ou as credenciais iniciais no .env local.');
  return { email, senha };
}
function sessao() {
  let cookie = '';
  async function raw(caminho, options = {}) {
    const res = await fetch(base + caminho, { ...options, redirect: 'manual', headers: { Cookie: cookie, ...options.headers } });
    const set = res.headers.getSetCookie().find(v => v.startsWith('JSESSIONID='));
    if (set) cookie = set.split(';')[0];
    return res;
  }
  async function request(caminho, method = 'GET', dados) {
    const headers = {};
    if (method !== 'GET') {
      const token = await (await raw('/auth/csrf')).json();
      headers[token.headerName] = token.token;
    }
    if (dados) headers['Content-Type'] = caminho === '/auth/login' ? 'application/x-www-form-urlencoded' : 'application/json';
    return raw(caminho, { method, headers, body: dados ? (caminho === '/auth/login' ? new URLSearchParams(dados).toString() : JSON.stringify(dados)) : undefined });
  }
  async function login(email, password) { return request('/auth/login', 'POST', { email, password }); }
  return { raw, request, login };
}
module.exports = { base, credenciais, sessao };
