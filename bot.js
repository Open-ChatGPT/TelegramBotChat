const TelegramBot = require('node-telegram-bot-api');
const { performAction } = require('./mysql');
const logger = require('./logger');
const api = require('./api');
const { timeSince, getServiceTypeFromUrl } = require('./utils');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});
const request = require('request');
bot.on('polling_error', (error) => {
  console.log(error.code);  // => 'EFATAL'
});
const commands = [
    { command: 'chat', description: '客服列表' },
];

// 设置机器人的命令
bot.setMyCommands(commands)
    .then(() => {
        console.log('命令设置成功！');
    })
    .catch(err => {
        console.error('设置命令时发生错误：', err);
    });
// 检查用户是否为群管理员
const isAdminUser = async (chatId, userId) => {
    try {
        const admins = await bot.getChatAdministrators(chatId);
        return admins.some(admin => admin.user.id === userId);
    } catch (error) {
        logger.error('获取管理员列表时发生错误:', error);
        return false;
    }
};
// 处理 /chat 命令
bot.onText(/\/chat/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (msg.chat.type === 'private') {
        bot.sendMessage(chatId, "此命令只能在群聊中使用。");
        return;
    }
    if (!(await isAdminUser(chatId, userId))) {
        bot.sendMessage(chatId, "对不起，只有群管理员可以使用这个命令。");
        return;
    }
    try {
        const results = await performAction({ vlan: 1, params: { chatId } });
        let messageText = results.length > 0 ? `共找到 ${results.length} 项客服信息：` : "没有找到群客服信息。";
        const serviceButtons = results.map((item, index) => ({
            text: `客服 ${index + 1}: ${item.type} - ${timeSince(item.datetime)}`,
            callback_data: `view_service_${item.id}`
        }));
        const inlineKeyboard = [...serviceButtons.map(button => [button]), [{ text: '添加客服', callback_data: 'add_service' }, { text: '关闭', callback_data: 'close' }]];
        
        bot.sendMessage(chatId, messageText, {
            reply_markup: {
                inline_keyboard: inlineKeyboard }
                 }
            );
    } catch (error) {
        logger.error('处理命令时发生错误:', error);
        bot.sendMessage(chatId, "处理您的请求时遇到了问题。");
    }
});
// 处理回调查询
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const action = callbackQuery.data.split('_')[0];
    const serviceId = callbackQuery.data.split('_')[1];
    switch(action) {
        case 'view': //客服详情
            await handleViewService(callbackQuery);
            break;
        case 'add': //添加客服
            await handleServiceOperation(chatId, callbackQuery);
            break;
        case 'edit': //编辑客服
           	await handleServiceOperation(chatId, callbackQuery, serviceId);
            break;
        case 'delete': //删除客服
            await handleDeleteService(callbackQuery, serviceId);
            break;
        case 'close': //删除消息
            await bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
            break;
    }
});
// 查看客服详情
async function handleViewService(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const serviceId = callbackQuery.data.split('_')[2];
    // 假设 performAction 函数能够根据 serviceId 获取客服详情
    const serviceDetails = await performAction({ vlan: 5, params: { serviceId } });
    const data = serviceDetails[0];
    const tabs = '+---------+------------------------+';
    const messageText = `
		<b>✦━━━━━💠<a href="${data.url}">客服详情</a>💠━━━━━✦</b>
		<pre><code class="language-json">${tabs}
		| 客服编号 	:	${data.id}
		${tabs}
    	| 客服类型 	: 	${data.type}
		${tabs}
    	| 操作人员 	: 	${data.name}
		${tabs}
		| 操作时间 	: 	${timeSince(data.datetime)}
		${tabs}
		</code></pre>
		<pre><code class="language-客服链接">
		${tabs}
		${data.url}
		</code></pre>
    `;

    logger.info(`客服详情输出ID:${data.id}`)
    const inlineKeyboardMarkup = {
        inline_keyboard: [[
            { text: '删除', callback_data: `delete_${data.id}` },
            { text: '编辑', callback_data: `edit_${data.id}` }
        ], [
            { text: '结束', callback_data: 'close' }
        ]]
    };

    bot.editMessageText(messageText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: inlineKeyboardMarkup
    });
}
// 处理客服信息：添加或编辑
async function handleServiceOperation(chatId, callbackQuery, serviceId = null) {
    bot.sendMessage(chatId, "请输入客服URL:", { reply_markup: { force_reply: true } })
    .then(sentMessage => {
        bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
        bot.onReplyToMessage(chatId, sentMessage.message_id, async (message) => {
            const serviceType = getServiceTypeFromUrl(message.text);
            
            // 服务类型未知
            if (serviceType === "未知") {
                bot.answerCallbackQuery(callbackQuery.id, { text: `识别失败！\n\n客服类型未识别。`, show_alert: true});
                //bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
                return;
            }
            // 检查URL是否已存在
            const existingResults = await performAction({ vlan: 4, params: { url: message.text } });
            if (existingResults && existingResults.length > 0) {
            	// URL已 存在
            	bot.answerCallbackQuery(callbackQuery.id, { text: `添加错误！\n\n客服信息 添加重复。`, show_alert: true});
                return;
            }
            // 添加或编辑逻辑
            if (!serviceId) {
                // 添加逻辑
                await performAction({ vlan: 2, params: { chatId, url: message.text, type: serviceType } });
                await bot.answerCallbackQuery(callbackQuery.id, { text: `添加成功！\n\n客服类型:${serviceType}`, show_alert: true});
                //bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
            } else {
                // 编辑逻辑
                await performAction({ vlan: 7, params: { serviceId, url: message.text, type: serviceType } });
                await bot.answerCallbackQuery(callbackQuery.id, { text: `编辑成功！\n\n客服类型:${serviceType}`, show_alert: true});
                //bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
            }
        });
    });
}
// 删除客服信息
async function handleDeleteService(callbackQuery) {
    const serviceId = callbackQuery.data.split('_')[1];
    // 假设 performAction 函数能够处理删除客服信息的请求
    await performAction({ vlan: 6, params: { serviceId } });
    bot.answerCallbackQuery(callbackQuery.id, { text: `客服信息已删除`, show_alert: true});
    bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
}
