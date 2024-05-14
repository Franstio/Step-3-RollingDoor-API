import { Sequelize, Op } from "sequelize";
import db from "../config/db.js";

const { DataTypes } = Sequelize;

const employee = db.define('employee', {
    badgeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
    }
}, {
    freezeTableName: true
});

export default employee;