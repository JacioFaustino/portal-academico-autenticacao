const express = require("express");
const { Usuario } = require("../models");
const { exigirAutenticacao, exigirPerfil } = require("../middlewares/autorizacao");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

router.get("/painel", exigirAutenticacao, (req, res) => {
  // res.locals.usuario já foi preenchido por compartilharUsuario.
  res.render("painel", { titulo: "Painel" });
});

router.get(
  "/administracao",
  exigirAutenticacao,
  exigirPerfil("Administrador"),
  async (req, res, next) => {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ["id", "nome", "email", "perfil", "ativo"],
        order: [["nome", "ASC"]],
        raw: true
      });
      res.render("administracao", { titulo: "Administração", usuarios });
    } catch (erro) {
      next(erro);
    }
  }
);

router.get("/saude", (req, res) => res.json({ status: "ok" }));

module.exports = router;
