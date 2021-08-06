const Moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const MySQL = require('../Util/MySQL.js');

class UserModifyLogRepository {
  constructor() {
  }

  static async getLogsBySQL(sql, sqlData) {
    try {
      let result = await MySQL.query(sql, sqlData, {selectQuery: true});
      return {success: true, logs:result};
    }catch(err) {
      return {success:false, err:err.message};
    }
  }


  static async insertUserModifyLog(userId, action, actionDetail, connection = null) {
    try {
      //insert user modify log table;
      let logId = uuidv4();
      let logSql = 'INSERT INTO user_modify_log (id, user_id, action, action_detail, date) VALUES(?,?,?,?,?)';
      let logSqlData = [logId, userId, action, actionDetail, Moment().format('YYYY-MM-DD HH:mm:ss')];

      let insLogResult;
      if(connection !== null)
        insLogResult = await MySQL.query(logSql, logSqlData, {}, connection, false);
      else
        insLogResult = await MySQL.query(logSql, logSqlData);

      //insert failed, rollback;
      if(insLogResult.affectedRows + '' !== '1')
        return {success:false, err: 'Insert log failed'};

      return {success:true, logId: logId};
    }catch(err) {
      return {success:false, err:err.message};
    }
  }
}
module.exports = UserModifyLogRepository;
