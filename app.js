const path = require("node:path");
const express = require("express");
const { engine } = require("express-handlebars");
const session = require("express-session");

const autenticacaoRouter = require("./routes/autenticacao");
const paginasRouter = require("./routes/paginas");
const { compartilharUsuario } = require("./middlewares/autorizacao");

function obterSegredoDaSessao() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Defina SESSION_SECRET no ambiente de produção.");
  }
  // Valor apenas para desenvolvimento e testes. Em uso real, configure o .env.
  return "segredo-didatico-somente-desenvolvimento";
}

function createApp() {
  const app = express();

  app.engine("hbs", engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials")
  }));
  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  // A sessão precisa ser registrada antes de qualquer middleware ou rota
  // que leia req.session. O armazenamento padrão (MemoryStore) guarda as
  // sessões na memória do processo: serve para a aula, não para produção.
  app.use(session({
    name: "connect.sid",
    secret: obterSegredoDaSessao(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 2
    }
  }));

  app.use(compartilharUsuario);
  app.use(autenticacaoRouter);
  app.use(paginasRouter);

  app.use((req, res) => res.status(404).send("Página não encontrada."));
  app.use((erro, req, res, next) => {
    console.error(erro);
    if (res.headersSent) return next(erro);
    return res.status(500).send("Falha inesperada.");
  });

  return app;
}

module.exports = { createApp };
