import { Sequelize } from "sequelize";

const db = new Sequelize(process.env.DATABASE,'pcs','123456',{
    host: "localhost",
    dialect: "mysql"
});

export default db;
