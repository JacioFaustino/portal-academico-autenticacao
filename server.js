require("dotenv").config();
const bcrypt = require("bcryptjs");
const { createApp } = require("./app");
const { sequelize, Usuario } = require("./models");

async function prepararBanco() {
  await sequelize.authenticate();
  await sequelize.sync();
  if (await Usuario.count() === 0) {
    await Usuario.bulkCreate([
      {
        nome: "Estudante Demo",
        email: "estudante@escola.test",
        senhaHash: await bcrypt.hash("aluno123", 10),
        perfil: "estudante",
        ativo: true
      },
      {
        nome: "Administrador Demo",
        email: "admin@escola.test",
        senhaHash: await bcrypt.hash("admin123", 10),
        perfil: "administrador",
        ativo: true
      }
    ]);
  }
}

async function iniciar() {
  await prepararBanco();
  const port = Number(process.env.PORT) || 3000;
  return createApp().listen(port, () =>
    console.log(`Portal disponível em http://localhost:${port}`));
}

if (require.main === module) iniciar().catch((erro) => {
  console.error("Não foi possível iniciar o projeto.", erro);
  process.exitCode = 1;
});

module.exports = { iniciar, prepararBanco };
