const request = require('request');
const mail = require('../utils/ivwebMail_for_single.js');
const pings = global.pjconfig.ping;
const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${global.pjConfig.wechat_ping}`;
const INTERVAL = 2;
let mailed = false;

module.exports = function () {
    setTimeout(function () {
        setInterval(() => {
            const LogService = require("../service/LogService");
            const UserService = require('../service/UserService');
            const logService = new LogService();
            const userService = new UserService();
            pings.forEach((id) => {
                const endDate = +new Date() - INTERVAL * 60 * 1000;
                const startDate = endDate - INTERVAL * 60 * 1000;

                logService.query({ id, startDate, endDate, 'level[]': 2, _t: +new Date() }, function (err, items) {
                    if (!items.length) {
                        userService.queryMailByApplyId(id, function (err, data) {
                            const email = data[0].email;
                            const loginName = data[0].loginName;
                            const msg = `Aegis数据上报异常 - 检测到 aegis id: ${id} owner: ${loginName} 最近${INTERVAL}分钟没有数据上报，服务或者项目可能存在异常，请及时检查`;
                            if (!mailed) {
                                mailed = true;
                                let { ownerMailTo } = global.pjconfig;
                                mail('', `${ownerMailTo},${email}`, '', 'Aegis数据上报异常', msg, '', true);
                            }
                            request({
                                url,
                                method: 'POST',
                                json: {
                                    'msgtype': 'text',
                                    'text': {
                                        content: msg,
                                        mentioned_list: [loginName]
                                    }
                                }
                            }, () => {});
                        });
                    }
                });
            });
        }, INTERVAL * 60 * 1000);
        // 限制邮件频率为10分钟一次
        setInterval(() => {
            mailed = false;
        }, 10 * 1000);
    }, 3000);
};
