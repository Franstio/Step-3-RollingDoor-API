import { Sequelize } from "sequelize";

const db = new Sequelize('rolling-door','root','',{
    host: "localhost",
    dialect: "mysql"
});

export default db;
