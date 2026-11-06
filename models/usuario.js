module.exports = (sequelize, DataTypes) => sequelize.define("Usuario", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  senhaHash: { type: DataTypes.STRING, allowNull: false },
  perfil: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: { isIn: [["estudante", "administrador"]] }
  },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: "usuarios",
  timestamps: true
});
