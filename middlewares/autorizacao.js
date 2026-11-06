// Middlewares de autenticação (quem é você?) e autorização (o que você pode fazer?).

function compartilharUsuario(req, res, next) {
  const usuarioSessao = req.session && req.session.usuario;
  // Disponibiliza para todas as views somente dados seguros e um indicador
  // derivado do perfil guardado na sessão.
  res.locals.usuario = usuarioSessao
    ? { ...usuarioSessao, ehAdministrador: usuarioSessao.perfil === "administrador" }
    : null;
  next();
}

function exigirAutenticacao(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect("/login");
  }
  // Evita que o botão "Voltar" exiba páginas protegidas após o logout.
  res.set("Cache-Control", "no-store");
  return next();
}

function exigirPerfil(perfilPermitido) {
  return (req, res, next) => {
    const usuario = req.session && req.session.usuario;
    if (!usuario) return res.redirect("/login");
    if (usuario.perfil !== perfilPermitido) {
      return res.status(403).send("Acesso negado: seu perfil não tem permissão para abrir esta página.");
    }
    return next();
  };
}

module.exports = { compartilharUsuario, exigirAutenticacao, exigirPerfil };
