process.env.DATABASE_STORAGE = ":memory:";
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const { createApp } = require("../app");
const { sequelize, Usuario } = require("../models");

test.before(async () => {
  await sequelize.sync({ force: true });
  await Usuario.bulkCreate([
    { nome: "Estudante Demo", email: "estudante@escola.test", senhaHash: await bcrypt.hash("aluno123", 4), perfil: "estudante", ativo: true },
    { nome: "Administrador Demo", email: "admin@escola.test", senhaHash: await bcrypt.hash("admin123", 4), perfil: "administrador", ativo: true }
  ]);
});
test.after(() => sequelize.close());

test("GET /login apresenta o formulário", async () => {
  const resposta = await request(createApp()).get("/login");
  assert.equal(resposta.status, 200);
  assert.match(resposta.text, /Entrar no Portal Acadêmico/);
});
test("GET /saude responde em JSON", async () => {
  const resposta = await request(createApp()).get("/saude");
  assert.equal(resposta.status, 200);
  assert.deepEqual(resposta.body, { status: "ok" });
});
async function entrar(app, email, senha) {
  const agente = request.agent(app);
  const resposta = await agente.post("/login").type("form").send({ email, senha });
  return { agente, resposta };
}

test("estudante autenticado abre o painel com o cabeçalho adequado", async () => {
  const app = createApp();
  const { agente, resposta: login } = await entrar(app, "estudante@escola.test", "aluno123");
  assert.equal(login.status, 302);
  assert.equal(login.headers.location, "/painel");

  const painel = await agente.get("/painel");
  assert.equal(painel.status, 200);
  assert.match(painel.text, /Área autenticada/i);
  assert.match(painel.text, /Olá, Estudante Demo!/);
  // Cabeçalho: estudante vê Painel e Sair, mas não Administração nem Login.
  assert.doesNotMatch(painel.text, /href="\/administracao"/);
  assert.doesNotMatch(painel.text, /href="\/login"/);
  assert.match(painel.text, /action="\/logout" method="post"/);
  // Nenhum hash de senha deve vazar para a página.
  assert.doesNotMatch(painel.text, /\$2[aby]\$/);
});

test("visitante é redirecionado ao tentar abrir o painel", async () => {
  const app = createApp();
  const semLogin = await request(app).get("/painel");
  assert.equal(semLogin.status, 302);
  assert.equal(semLogin.headers.location, "/login");

  // Credenciais inválidas: 401, mensagem genérica e nenhuma sessão criada.
  const agente = request.agent(app);
  for (const tentativa of [
    { email: "estudante@escola.test", senha: "senha-errada" },
    { email: "inexistente@escola.test", senha: "aluno123" }
  ]) {
    const resposta = await agente.post("/login").type("form").send(tentativa);
    assert.equal(resposta.status, 401);
    assert.match(resposta.text, /E-mail ou senha inválidos\./);
    assert.equal(resposta.headers["set-cookie"], undefined);
  }
  const aposFalha = await agente.get("/painel");
  assert.equal(aposFalha.status, 302);
  assert.equal(aposFalha.headers.location, "/login");

  // O visitante também não alcança a administração.
  const admin = await request(app).get("/administracao");
  assert.equal(admin.status, 302);
  assert.equal(admin.headers.location, "/login");
});

test("estudante recebe 403 ao tentar abrir a administração", async () => {
  const { agente } = await entrar(createApp(), "estudante@escola.test", "aluno123");
  const resposta = await agente.get("/administracao");
  assert.equal(resposta.status, 403);
  assert.doesNotMatch(resposta.text, /Usuários cadastrados/);
});

test("administrador pode abrir a administração", async () => {
  const { agente } = await entrar(createApp(), "admin@escola.test", "admin123");
  const painel = await agente.get("/painel");
  assert.match(painel.text, /href="\/administracao"/);

  const resposta = await agente.get("/administracao");
  assert.equal(resposta.status, 200);
  assert.match(resposta.text, /Usuários cadastrados/);
  assert.match(resposta.text, /estudante@escola\.test/);
  assert.doesNotMatch(resposta.text, /\$2[aby]\$/);
});

test("logout encerra a sessão", async () => {
  const app = createApp();
  const { agente } = await entrar(app, "estudante@escola.test", "aluno123");
  assert.equal((await agente.get("/painel")).status, 200);

  // GET não encerra a sessão: o logout só existe por POST.
  assert.equal((await agente.get("/logout")).status, 404);

  const logout = await agente.post("/logout");
  assert.equal(logout.status, 302);
  assert.match(logout.headers.location, /^\/login/);
  const cookies = (logout.headers["set-cookie"] || []).join(";");
  assert.match(cookies, /connect\.sid=;/);
  assert.match(cookies, /Expires=Thu, 01 Jan 1970/);

  const depois = await agente.get("/painel");
  assert.equal(depois.status, 302);
  assert.equal(depois.headers.location, "/login");
});
