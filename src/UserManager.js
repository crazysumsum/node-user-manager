'use strict'

const { v4: uuidv4 } = require('uuid');
const CryptoJS = require("crypto-js");
const Moment = require('moment');
const MySQL = require('./Util/MySQL.js');
const UserRepository = require('./Repositories/UserRepository.js');
const UserOTPRepository = require('./Repositories/UserOTPRepository.js');
const UserModifyLogRepository = require('./Repositories/UserModifyLogRepository.js');

const InitSQL = require('../init_sql.js');

class UserManager {
  constructor() {
    this.config = {
      userActiveStatus: 1,
      checkPasswordRetryLimit: 5,
      UIDGenerator: this.defaultUIDGenerator,
      PasswordHashing: this.defaultPasswordHashing,
      FreezeUserHandler: this.defaultFreezeUserHandler,
      otp: {
        retryLimit: 5,
        expTimeValue: 1,
        expTimeUnit: 'hours'
      }
    };
  }

  setOtpRetryLimit(limit) {
    this.config.otp.retryLimit = limit;
  }

  setOtpExpTimeValue(value) {
    this.config.otp.expTimeValue = Number(value);
  }

  setOtpExpTimeUnit(unit) {
    this.config.otp.expTimeUnit = unit;
  }

  setUserActiveStatus(status) {
    this.config.defaultUserActiveStatus = status;
  }

  setCheckPasswordRetryLimit(limit) {
    this.config.checkPasswordRetryLimit = parseInt(limit);
  }

  setUIDGenerator(generator) {
    this.config.UIDGenerator = generator;
  }

  setPasswordHashing(hashFunc) {
    this.config.PasswordHashing = hashFunc;
  }

  setFreezeUserHandler(freezeUserHandler) {
    this.config.FreezeUserHandler = freezeUserHandler;
  }

  defaultOTPGenerator() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  async defaultUIDGenerator() {
    return uuidv4();
  }

  async defaultPasswordHashing(password) {
    return CryptoJS.SHA3(password, {outputLength: 256}).toString(CryptoJS.enc.Hex);
  }

  async defaultFreezeUserHandler(user) {
    user.setStatus('2');
    let updateUserResult = await UserRepository.updateUser(user, false);

    if(!updateUserResult.success)
      throw new Error(updateUserResult.err);

    return true;
  }

  async initWithConnPool(pool) {
    MySQL.setPool(pool);
    let result = await this.init();
    return result;
  }

  async initWithMySQLConfig(config) {
    MySQL.createPool(config);
    let result = await this.init();
    return result;
  }

  async init() {
    let result = await MySQL.testConnection();
    if(!result.success) {
      throw new Error(result.err);
    }
    try {
      let createUserTableSql = InitSQL.createUserTable;
      let createUserModifyLogTableSql = InitSQL.createUserModifyLogTable;
      let createUserOTPTable = InitSQL.createUserOTPTable;

      await MySQL.query(createUserTableSql, []);
      await MySQL.query(createUserModifyLogTableSql, []);
      await MySQL.query(createUserOTPTable, []);
      return true;
    }catch(err) {
      throw new Error(err.message);
    }
  }

  async getUserModifyLogsBySQL(sql, data) {
    let result = await UserModifyLogRepository.getLogsBySQL(sql, data);
    if(!result.success)
      throw new Error(result.err);

    return result.logs;
  }

  async getUsersBySQL(sql, data) {
    let result = await UserRepository.getUsersBySQL(sql, data);
    if(!result.success)
      throw new Error(result.err);

    return result.users;
  }

  async getUserById(userId) {
    let result = await UserRepository.getUserById(userId);
    if(!result.success)
      throw new Error(result.err);

    return result.user;
  }

  async getUserByEmail(email) {
    let result = await UserRepository.getUserByEmail(email);
    if(!result.success)
      throw new Error(result.err);

    return result.user;
  }

  async newUser(name, password, email, phoneAreaCode = '', phoneNumber = '', status = this.config.userActiveStatus) {
    let uid = await this.config.UIDGenerator();
    let passwordHash = await this.config.PasswordHashing(password);

    let dataObj = {
      uid: uid,
      name: name,
      password: passwordHash,
      email: email,
      phoneNumber: phoneNumber,
      phoneAreaCode: phoneAreaCode,
      status: status
    };

    let result = await UserRepository.newUser(dataObj);

    if(!result.success)
      throw new Error(result.err);

    return result.userId;
  }

  async updateUser(user, insertLog = true) {
    let result = await UserRepository.updateUser(user, insertLog);
    if(!result.success)
      throw new Error(result.err);

    return true;
  }

  async deleteUser(userId) {
    let result = await UserRepository.deleteUser(userId);
    if(!result.success)
      throw new Error(result.err);

    return true;
  }

  async checkPassword(user, password) {

    //init user data;
    let freshUser = await this.getUserById(user.getId());
    user.setPassword(freshUser.getPassword());
    user.setLoginFailCount(freshUser.getLoginFailCount());
    user.setStatus(freshUser.getStatus());


    if(user.getStatus() + '' !== this.config.userActiveStatus + '')
      return false;

    let passwordHash = await this.config.PasswordHashing(password);
    let count = user.getLoginFailCount();

    if(user.getPassword() !== passwordHash) {
      //update login fail count;
      count++;
      user.setLoginFailCount(count);

      //retry count > retry limit, set user status to frozen;
      if(count >= parseInt(this.config.checkPasswordRetryLimit)) {
        await this.config.FreezeUserHandler(user);
      }

      let updateUserResult = await UserRepository.updateUser(user, false);

      if(!updateUserResult.success)
        throw new Error(updateUserResult.err);

      return false;
    }

    user.setLoginFailCount(0);
    user.setLastLoginDate(Moment().format('YYYY-MM-DD HH:mm:ss'));
    let updateUserResult = await UserRepository.updateUser(user, false);

    if(!updateUserResult.success)
      throw new Error(updateUserResult.err);

    return true;
  }

  async updatePassword(user, password) {
    let passwordHash = await this.config.PasswordHashing(password);
    let result = await UserRepository.updatePassword(user.getId(), passwordHash);
    if(!result.success)
      throw new Error(result.err);

    user.setPassword(passwordHash);
    return true;
  }

  async createOTP(user, otp = '', expTimeValue = this.config.otp.expTimeValue, expTimeUnit = this.config.otp.expTimeUnit) {
    if(otp === '')
      otp = this.defaultOTPGenerator();

    let userId = user.getId();
    let result = await UserOTPRepository.createOTP(userId, otp, expTimeValue, expTimeUnit);

    if(!result.success)
      throw new Error(result.err);

    return result.otp;
  }

  async verifyOTP(user, otp) {
    let getUserOtpResult = await UserOTPRepository.getUserOTP(user.getId());
    if(!getUserOtpResult.success)
      throw new Error(getUserOtpResult.err);

    let retryCount = 0;
    let userOtp = getUserOtpResult.otp;

    if(userOtp === '' || userOtp + '' !== otp + '') {
      //verify failed;
      if(getUserOtpResult.retryCount !== '') {
        retryCount = Number(getUserOtpResult.retryCount) + 1;
        let used = 1;
        if(retryCount >= this.config.otp.retryLimit) {
          //retry exceed, disable OTP;
          used = 0;
        }
        let setOTPUsedResult = await UserOTPRepository.updateOTP(getUserOtpResult.otpId, used, null, retryCount);
        if(!setOTPUsedResult.success)
          throw new Error(setOTPUsedResult.err);
      }

      return false;
    }

    let setOTPUsedResult = await UserOTPRepository.updateOTP(getUserOtpResult.otpId, 0, Moment().format('YYYY-MM-DD HH:mm:ss'), 0);
    if(!setOTPUsedResult.success)
      throw new Error(setOTPUsedResult.err);

    return true;
  }

}
module.exports = new UserManager();
