import { Sequelize, Op } from "sequelize";
import db from "../config/db.js";
//import Container from "./ContainerModel.js";
//import bin from "./BinModel.js";

const { DataTypes } = Sequelize;

const waste = db.define('waste', {
    Id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
    }
}, {
    freezeTableName: true,
    timestamps:false
});

//waste.belongsTo(Container, { foreignKey: 'container', as: 'datacontainer' });
//Container.hasMany(waste, { foreignKey: 'container', as: 'datacontainer' });
//waste.hasMany(bin, {foreignKey:"type_waste",as:'bin'});
//bin.belongsTo(waste,{foreignKey:'type_waste',as:'waste'});
export default waste;
