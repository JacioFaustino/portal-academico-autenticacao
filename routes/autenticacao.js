const express = require("express");
const bcrypt = require("bcryptjs");
const { Usuario } = require("../models");

const router = express.Router();

const MENSAGEM_INVALIDA = "E-mail ou senha inválidos.";
// Hash fictício usado quando o e-mail não existe, para que o tempo de resposta
// não revele se a conta existe.
const HASH_FICTICIO = bcrypt.hashSync("senha-ficticia-sem-uso", 10);

function rejeitarLogin(res, email) {
  return res.status(401).render("login", {
    titulo: "Entrar",
    erro: MENSAGEM_INVALIDA,
    email
  });
}

router.get("/login", (req, res) => {
  res.render("login", { titulo: "Entrar", mensagem: req.query.mensagem });
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const senha = String(req.body.senha || "");

    if (!email || !senha) return rejeitarLogin(res, email);

    const usuario = await Usuario.findOne({ where: { email } });
    const hash = usuario ? usuario.senhaHash : HASH_FICTICIO;
    const senhaConfere = await bcrypt.compare(senha, hash);

    // Mesma resposta para e-mail inexistente, senha errada ou conta inativa.
    if (!usuario || !senhaConfere || !usuario.ativo) {
      return rejeitarLogin(res, email);
    }

    // Regenera o identificador da sessão para evitar fixação de sessão.
    req.session.regenerate((erroRegenerar) => {
      if (erroRegenerar) return next(erroRegenerar);

      // Somente dados seguros: nunca a senha nem o hash.
      req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      };

      req.session.save((erroSalvar) => {
        if (erroSalvar) return next(erroSalvar);
        return res.redirect("/painel");
      });
    });
  } catch (erro) {
    return next(erro);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((erro) => {
    if (erro) return next(erro);
    res.clearCookie("connect.sid", { path: "/", httpOnly: true, sameSite: "lax" });
    return res.redirect("/login?mensagem=Sessão+encerrada+com+sucesso");
  });
});

module.exports = router;
