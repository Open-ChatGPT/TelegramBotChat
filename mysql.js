const mysql = require('mysql');
const util = require('util');
const logger = require('./logger'); 
// 引入日志模块
require('dotenv').config();
const Host = process.env.MYSQL_HOME;
const User = process.env.MYSQL_USER;
const Pass = process.env.MYSQL_PASS;
const Data = process.env.MYSQL_DATA;


const pool = mysql.createPool({
  connectionLimit: 10,
  host: Host,
  user: User,
  password: Pass,
  database: Data
});

pool.query = util.promisify(pool.query); // Promise化pool.query

/**
 * 动态执行数据库操作并记录关键日志
 * @param {Object} options 包含vlan和params的对象
 * @returns {Promise<Object>} 执行结果
 */
async function performAction(options) {
  const sqlCommands = {
    1: {
    	text:'1):根据群ID查询数据',
      sql: 'SELECT id, url, type, datetime FROM db_chat WHERE `groupid` = ?',
      params: [options.params.chatId]
    },
    2: {
    	text:'2):添加新的客服数据',
      sql: 'INSERT INTO db_chat (groupid, url, type) VALUES (?, ?, ?)',
      params: [options.params.chatId, options.params.url, options.params.type]
    },
    3: {
    	text:'3):根据群组ID查询数据:API',
      sql: 'SELECT * FROM db_chat WHERE `groupid` = ?',
      params: [options.params.group]
    },
    4: {
    	text:'4):检查客服数据:查重',
      sql: 'SELECT * FROM db_chat WHERE `url` = ?',
      params: [options.params.url]
    },
    5: { //客服详情 客服数据 ID
    	text:'5):查询客服详情:',
      sql: 'SELECT * FROM db_chat WHERE `id` = ?',
      params: [options.params.serviceId]
    },
    6: {//删除客服
    	text:'6):删除客服',
      sql: 'DELETE FROM db_chat WHERE `id` = ?',
      params: [options.params.serviceId]
		},
		7: {
    	text:'7):编辑客服，更新客服',
  		sql: 'UPDATE db_chat SET url = ?, type = ? WHERE `id` = ?',
  		params: [options.params.url, options.params.type, options.params.serviceId]
		},
  };
// 通过vlan选择要执行的SQL命令
  const command = sqlCommands[options.vlan];
  if (!command) {
    const errMsg = '未知的VLAN编号';
    logger.error(errMsg);
    throw new Error(errMsg);
  }

  try {
    // 在执行数据库操作前，记录SQL命令和参数，便于调试和监控
    logger.info(`${command.text}\n执行SQL: ${command.sql}，参数：${JSON.stringify(command.params)}`);
    // 执行数据库操作
    const results = await pool.query(command.sql, command.params);
    // 操作成功后，记录操作结果
		logger.info(`${command.text}\nSQL执行成功，结果：${JSON.stringify(results)}`);    

    return results;
  } catch (error) {
    logger.error(`数据库操作失败: SQL: ${command.sql}, 错误: ${error.message}`);
    throw error;
  }
}
module.exports = { performAction };
