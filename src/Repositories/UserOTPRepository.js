const Moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const MySQL = require('../Util/MySQL.js');

class UserOTPRepository {
  constructor() {
  }

  static async getUserOTP(userId) {
    try {
      let sql = 'SELECT * FROM user_otp WHERE user_id = ? AND used = 1 limit 1';
      let sqlData = [userId];
      let result = await MySQL.query(sql, sqlData, [userId]);
      let otp = '';
      let otpId = '';
      let retryCount = '';

      if(result.length > 0) {
        otp = result[0].otp;
        otpId = result[0].id;
        retryCount = result[0].retry_count;
      }

      return {success:true, otp: otp, otpId:otpId, retryCount:retryCount};
    }catch(err) {
      return {success:false, err:err.message};
    }
  }

  static async createOTP(userId, otp, expTimeValue, expTimeUnit) {

    try {
      //check any exists unused OTP;
      let getOTPResult = await UserOTPRepository.getUserOTP(userId);
      if(!getOTPResult.success)
        throw new Error(getOTPResult.err);

      //delete exists OTP;
      if(getOTPResult.otpId !== '') {
        let deleteOTPResult = await UserOTPRepository.deleteOTP(getOTPResult.otpId);
        if(!deleteOTPResult.success)
          throw new Error(deleteOTPResult.err);
      }

      //init OTP data;
      let otpId = uuidv4();
      let createDate = Moment().format('YYYY-MM-DD HH:mm:ss');
      let expDate = Moment().add(expTimeValue, expTimeUnit).format('YYYY-MM-DD HH:mm:ss');
      let verifyDate = null;
      let used = 1;

      let sql = 'INSERT INTO user_otp (id, user_id, otp, create_date, exp_date, verify_date, used) VALUES (?,?,?,?,?,?,?)';
      let sqlData = [otpId, userId, otp, createDate, expDate, verifyDate, used];
      let result = await MySQL.query(sql, sqlData);

      if(result.affectedRows + '' !== '1')
        return {success:false, err: 'Insert OTP failed'};

      return {success: true, otp: otp};

    }catch(err) {
      return {success:false, err:err.message};
    }
  }

  static async updateOTP(otpId, used, verifyDate, retryCount) {
    try {
      let sql = 'UPDATE user_otp SET used = ?, verify_date = ?, retry_count = ? WHERE id = ?';
      let sqlData = [used, verifyDate, retryCount, otpId];
      let result = await MySQL.query(sql, sqlData);
      if(result.affectedRows + '' !== '1')
        return {success:false, err: 'Update OTP failed'};

      return {success:true};
    }catch(err) {
      return {success:false, err:err.message};
    }
  }

  static async deleteOTP(otpId) {
    try {
      let sql = 'DELETE FROM user_otp WHERE id = ?';
      let sqlData = [otpId];
      let result = await MySQL.query(sql, sqlData);
      if(result.affectedRows + '' !== '1')
        return {success:false, err: 'Delete OTP failed'};

      return {success:true};
    }catch(err) {
      return {success:false, err:err.message};
    }
  }

}
module.exports = UserOTPRepository;
