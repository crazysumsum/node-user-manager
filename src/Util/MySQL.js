const mysql = require('mysql');

class MySQLConnector {
	constructor() {
		this.pool = null;
	}

	setPool(pool) {
		this.pool = pool;
	}

	createPool(config) {
		var self = this;
		try {
			this.pool = mysql.createPool(config);
			return {success:true};
		}catch(err) {
			return {success:false, err: err.toString()};
		}
	}

	closePool() {
		var self = this;
		return new Promise((resolve, reject) => {
			self.pool.end(err => {
				if(err) {
					reject(err);
				}else {
					resolve();
				}
			});
		});
	}

	async testConnection() {
		var self = this;
		try {
			var result = await this.execAsync(null, true, async connection => {
				var rows = await new Promise((resolve, reject) => {
					connection.query('SELECT 1 "value"', (err, rows) => {
						if(err) {
							reject(err);
						}else {
							resolve(rows);
						}
					});
				});
				return rows[0].value;
			});
			return {success: true};
		}catch(err) {
			return {success: true, err: err.message};
		}
	}

	async query(sql, data, opts = {}, conn = null, release = true) {
		var self = this;
		try {
			var result = await this.execAsync(conn, release, async connection => {
				var rows = await new Promise((resolve, reject) => {
					connection.query(sql, data, (err, rows) => {
						if(err) {
							reject(err);
						}else {
							resolve(rows);
						}
					});
				});
				return rows;
			});
			if(opts && opts.selectQuery) {
				return JSON.parse(JSON.stringify(result));
			}else {
				return result;
			}
		}catch(err) {
			let errString = err.message;

			if(err.sql) {
				errString = errString + '\nSQL: ' + err.sql;
			}

			throw new Error(errString);
		}
	}

	async execAsync(conn, release, actionAsync) {
		var self = this;

		let connection;
		if(conn === null) {
			connection = await self.getConnection();
		}else {
			connection = conn;
		}

		try {
			return await actionAsync(connection);
		}finally {
			if(release)
				connection.release();
		}
	}

	getConnection() {
		let self = this;
		return new Promise((resolve, reject) => {
			self.pool.getConnection((err, connection) => {
				if(err) {
					reject(err);
				}else {
					resolve(connection);
				}
			});
		});
	}

	async beginTransaction() {
		let connection;
		try {
			connection = await this.getConnection();
			await new Promise((resolve, reject) => {
				connection.beginTransaction((err) => {
					if(err) {
						reject(err);
					}else {
						resolve();
					}
				});
			});
		}catch(err) {
			return {success:false, err:err.message};
		}

		return {success:true, connection:connection};
	}

	async rollback(connection) {
		try {
			await new Promise((resolve, reject) => {
				connection.rollback(() => {
					resolve();
				});
			});
			return {success:true};
		}catch(err) {
			return {success:false, err:err.message};
		}finally {
			connection.release();
		}
	}

	async commit(connection) {
		let self = this;
		try {
			await new Promise((resolve, reject) => {
				connection.commit((err) => {
					if(err) {
						reject(err);
					}else {
						resolve();
					}
				});
			});
			connection.release();
			return {success:true};
		}catch(err) {
			let rollbackResult = await self.rollback(connection);
			if(rollbackResult.success)
				return {success:false, err:err.message};
			else {
				return {success:false, rollback:false, commitErr: err.message, rollbackErr: rollbackResult.err};
			}
		}
	}
}

module.exports = new MySQLConnector();
