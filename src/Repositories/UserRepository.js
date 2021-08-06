const Moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const MySQL = require('../Util/MySQL.js');
const User = require('../Entities/User.js');
const UserModifyLogRepository = require('./UserModifyLogRepository.js');

class UserRepository {
  constructor() {
  }

  static async getUsersBySQL(sql, sqlData) {
    try {
      let result = await MySQL.query(sql, sqlData, {selectQuery: true});

      let users = [];
      for(let i = 0 ; i < result.length ; i++) {
        let user = new User(result[i]);
        users.push(user);
      }

      return {success: true, users: users};

    }catch(err) {
      return {success:false, err:err.message};
    }
  }

  static async getUserById(userId) {
    let sql = 'SELECT * FROM user WHERE id = ? limit 1';
    let sqlData = [userId];
    let result = await UserRepository.getUsersBySQL(sql, sqlData);
    if(!result.success)
      return result;

    if(result.users.length === 0)
      return {success:false, err:'user not found'};

    return {success:true, user:result.users[0]};
  }

  static async getUserByEmail(email) {
    let sql = 'SELECT * FROM user WHERE email = ? limit 1';
    let sqlData = [email];
    let result = await UserRepository.getUsersBySQL(sql, sqlData);
    if(!result.success)
      return result;

    if(result.users.length === 0)
      return {success:false, err:'user not found'};

    return {success:true, user:result.users[0]};
  }

  static async newUser(dataObj) {

    let trxResult = await MySQL.beginTransaction();

    if(!trxResult.success) {
      return trxResult;
    }

    let connection = trxResult.connection;

    try {
      //insert user table;
      let sql = 'INSERT INTO user (id, email, password, name, phone, phone_area_code, create_date, status) VALUES (?,?,?,?,?,?,?,?)';
      let sqlData = [dataObj.uid, dataObj.email, dataObj.password, dataObj.name, dataObj.phoneNumber, dataObj.phoneAreaCode, Moment().format('YYYY-MM-DD HH:mm:ss'), dataObj.status];
      let result = await MySQL.query(sql, sqlData, {}, connection, false);

      //insert user failed, rollback;
      if(result.affectedRows + '' !== '1')
        throw new Error('Insert user failed');

      //insert user modify log;
      let insertLogResult = await UserModifyLogRepository.insertUserModifyLog(dataObj.uid, 'NEW_USER', JSON.stringify(dataObj), connection);
      //insert log failed rollback;
      if(!insertLogResult.success)
        throw new Error(rollbackResult.err);

      //commit change;
      let commitResult = await MySQL.commit(connection);
      if(!commitResult.success)
        throw new Error(commitResult.err);

      return {success: true, userId: dataObj.uid, logId: insertLogResult.logId};

    }catch(err) {
      //rollback;
      let rollbackResult = await MySQL.rollback(connection);
      let ret = {
        success:false,
        err: err.message,
        rollback: rollbackResult.success
      };
      if(!rollbackResult.success)
        ret.rollbackErr = rollbackResult.err;

      return ret;
    }
  }

  static async updateUser(user, insertLog) {

    let trxResult = await MySQL.beginTransaction();

    if(!trxResult.success) {
      return trxResult;
    }

    let connection = trxResult.connection;

    try {
      let sql = 'UPDATE user SET name = ?, email = ?, phone = ?, phone_area_code = ?, status = ?, login_fail_count = ?, last_login_date = ? WHERE id = ?';
      let sqlData = [user.getName(), user.getEmail(), user.getPhone(), user.getPhoneAreaCode(), user.getStatus(), user.getLoginFailCount(), user.getLastLoginDate(), user.getId()];
      let result = await MySQL.query(sql, sqlData, {}, connection, false);

      //update user failed, rollback;
      if(result.affectedRows + '' !== '1')
        throw new Error('Update user failed');

      let insertLogResult;
      if(insertLog) {
        //insert user modify log;
        insertLogResult = await UserModifyLogRepository.insertUserModifyLog(user.getId(), 'UPDATE_USER', JSON.stringify(user.getJSON()), connection);
        //insert log failed rollback;
        if(!insertLogResult.success)
          throw new Error(insertLogResult.err);
      }

      //commit change;
      let commitResult = await MySQL.commit(connection);
      if(!commitResult.success)
        throw new Error(commitResult.err);

      let ret = {success:true};

      if(insertLog)
        ret.logId = insertLogResult.logId;

      return ret;

    }catch(err) {
      //rollback;
      let rollbackResult = await MySQL.rollback(connection);
      let ret = {
        success:false,
        err: err.message,
        rollback: rollbackResult.success
      };
      if(!rollbackResult.success)
        ret.rollbackErr = rollbackResult.err;

      return ret;
    }
  }

  static async updatePassword(userId, password) {

    let trxResult = await MySQL.beginTransaction();

    if(!trxResult.success) {
      return trxResult;
    }

    let connection = trxResult.connection;

    try {
      let sql = 'UPDATE user SET password = ? WHERE id = ?';
      let sqlData = [password, userId];
      let result = await MySQL.query(sql, sqlData, {}, connection, false);

      //update password failed, rollback;
      if(result.affectedRows + '' !== '1')
        throw new Error('Update password failed');

      //insert user modify log;
      let insertLogResult = await UserModifyLogRepository.insertUserModifyLog(userId, 'UPDATE_PASSWORD', JSON.stringify({'new_password': password}), connection);
      //insert log failed rollback;
      if(!insertLogResult.success)
        throw new Error(insertLogResult.err);

      //commit change;
      let commitResult = await MySQL.commit(connection);
      if(!commitResult.success)
        throw new Error(commitResult.err);

      return {success:true, logId: insertLogResult.logId};

    }catch(err) {
      //rollback;
      let rollbackResult = await MySQL.rollback(connection);
      let ret = {
        success:false,
        err: err.message,
        rollback: rollbackResult.success
      };
      if(!rollbackResult.success)
        ret.rollbackErr = rollbackResult.err;

      return ret;
    }
  }

  static async deleteUser(userId) {
    try {
      let sql = 'DELETE FROM user WHERE id = ?';
      let sqlData = [userId];
      let result = await MySQL.query(sql, sqlData);

      if(result.affectedRows + '' !== '1')
        return {success:false, err: 'Delete user failed'};

      return {success:true}
    }catch(err) {
      return {success:false, err:err.message};
    }
  }
}
module.exports = UserRepository;
