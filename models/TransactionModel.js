import { Sequelize, Op } from "sequelize";
import db from "../config/db.js";
import Employee from "./EmployeeModel.js";
import Container from "./ContainerModel.js";
import Weste from "./WesteModel.js";
import bin from "./BinModel.js";

const { DataTypes } = Sequelize;

const transaction = db.define('transaction', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement: true,
        allowNull: false
    },
    badgeId : {
        type: DataTypes.INTEGER,
    },
    idContainer  : {
        type: DataTypes.INTEGER,
    },
    idWaste   : {
        type: DataTypes.INTEGER,
    },
    neto   : {
        type: DataTypes.INTEGER,
        allowNull: true  
    },
   recordDate: {
	type: DataTypes.STRING
   },
   containerName:{
    type: DataTypes.STRING
   },
   binName:{
    type: DataTypes.STRING
   },
   binId: {
    type: DataTypes.INTEGER
   },
   status:{
    type:DataTypes.STRING,
   },
   isSuccess: {
    type: DataTypes.BOOLEAN
   }
}, {
    freezeTableName: true,
    timestamps:false,
    updatedAt:false,
   createdAt:false,
silent:true,
raw:true
});

Employee.hasMany(transaction, { foreignKey: 'badgeId', as: 'employee' });
transaction.belongsTo(Employee, { foreignKey: 'badgeId', as: 'employee' });

Container.hasMany(transaction, { foreignKey: 'idContainer', as: 'container' });
transaction.belongsTo(Container, { foreignKey: 'idContainer', as: 'container' });

bin.hasMany(transaction,{foreignKey:'binId',as:'bin'});
transaction.belongsTo(bin,{foreignKey:'binId',as:'bin'});

Weste.hasMany(transaction, { foreignKey: 'idWaste', as: 'weste' });
transaction.belongsTo(Weste, { foreignKey: 'idWaste', as: 'weste' });

export default transaction;
