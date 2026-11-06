const path = require("node:path");
const { Sequelize, DataTypes } = require("sequelize");

const storage = process.env.DATABASE_STORAGE ||
  path.join(__dirname, "..", "database", "portal.sqlite");

const sequelize = new Sequelize({ dialect: "sqlite", storage, logging: false });
const Usuario = require("./usuario")(sequelize, DataTypes);

module.exports = { sequelize, Usuario };
