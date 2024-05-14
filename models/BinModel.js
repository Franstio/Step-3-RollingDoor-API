import { Sequelize, Op } from "sequelize";
import db from "../config/db.js";
import waste from "./WesteModel.js";

const { DataTypes } = Sequelize;

const bin = db.define('bin', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
    },
    weight: {
        type: DataTypes.INTEGER,
    },
    type_waste: {
        type: DataTypes.INTEGER
    }
}, {
    freezeTableName: true,
    timestamps:false
});

waste.hasMany(bin, { foreignKey: 'type_waste', as: 'bin' });
bin.belongsTo(waste, { foreignKey: 'type_waste', as: 'waste' });
//waste.belongsTo(Container, { foreignKey: 'container', as: 'datacontainer' });
//Container.hasMany(waste, { foreignKey: 'container', as: 'datacontainer' });

export default bin;