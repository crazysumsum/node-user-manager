const Moment = require('moment');

class User {
  constructor(dataObj) {
    let timezone = new Date().getTimezoneOffset();
    this.id = (dataObj.id) ? dataObj.id : '';
    this.name = (dataObj.name) ? dataObj.name : '';
    this.email = (dataObj.email) ? dataObj.email : '';
    this.password = (dataObj.password) ? dataObj.password : '';
    this.phone = (dataObj.phone) ? dataObj.phone : '';
    this.phoneAreaCode = (dataObj.phone_area_code) ? dataObj.phone_area_code : '';
    this.status = (dataObj.status) ? dataObj.status : '';
    this.loginFailCount = (dataObj.login_fail_count) ? dataObj.login_fail_count : 0;
    this.createDate = (dataObj.create_date) ? Moment(dataObj.create_date).utc(timezone).format('YYYY-MM-DD HH:mm:ss') : null;
    this.lastLoginDate = (dataObj.last_login_date) ? Moment(dataObj.last_login_date).utc(timezone).format('YYYY-MM-DD HH:mm:ss') : null;
  }

  getJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone,
      phoneAreaCode: this.phoneAreaCode,
      status: this.status,
      loginFailCount: this.loginFailCount,
      createDate: this.createDate,
      lastLoginDate: this.lastLoginDate
    };
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getEmail() {
    return this.email;
  }

  getPhone() {
    return this.phone;
  }

  getPhoneAreaCode() {
    return this.phoneAreaCode;
  }

  getPassword() {
    return this.password;
  }

  getStatus() {
    return this.status + '';
  }

  getLoginFailCount() {
    return parseInt(this.loginFailCount);
  }

  getCreateDate() {
    return this.createDate;
  }

  getLastLoginDate() {
    return this.lastLoginDate;
  }

  setLoginFailCount(loginFailCount) {
    this.loginFailCount = loginFailCount;
  }

  setStatus(status) {
    this.status = status;
  }

  setLastLoginDate(lastLoginDate) {
    this.lastLoginDate = lastLoginDate;
  }

  setPassword(password) {
    this.password = password;
  }

  setEmail(email) {
    this.email = email;
  }

  setName(name) {
    this.name = name;
  }

  setPhone(phone) {
    this.phone = phone;
  }

  setPhoneAreaCode(phoneAreaCode) {
    this.phoneAreaCode = phoneAreaCode;
  }

}

module.exports = User;
