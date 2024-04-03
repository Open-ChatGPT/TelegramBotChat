const express = require('express');
const fs = require('fs').promises;
const { performAction } = require('./mysql');
const logger = require('./logger');
const cors = require('cors'); 

const app = express();
const PORT = process.env.PORT || 3302;

app.use(express.json());
app.use(cors());

app.get('/webapp', async (req, res, next) => {
  try {
    const data = await fs.readFile('./http/index.html');
    res.type('html').send(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/xm/2024', async (req, res, next) => {
  const { group } = req.query;
  if (!group) {
    return res.status(400).json({ error: '必须提供group参数' });
  }

  try {
    const results = await performAction({ vlan: 3, params: { group } });
    res.status(200).json(results.length === 0 ? { message: '没有找到数据' } : { group_data: results });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: '未找到' });
});

app.use((error, req, res, next) => {
  logger.error(`服务器错误: ${error.message}`);
  res.status(500).json({ error: '内部服务器错误' });
});

app.listen(PORT, () => {
  console.log(`服务器正在监听端口: ${PORT}`);
});
