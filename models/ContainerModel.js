import { Sequelize, Op } from "sequelize";
import db from "../config/db.js";
import Waste from "./WesteModel.js";

const { DataTypes } = Sequelize;

const container = db.define('container', {
    containerid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey:true
    },
    name: {
        type: DataTypes.STRING,
    }
}, {
    freezeTableName: true,
    timestamps:false
});


Waste.hasMany(container, { foreignKey: 'idWaste', as: 'container' });
container.belongsTo(Waste, { foreignKey: 'idWaste', as: 'waste' });

export default container;