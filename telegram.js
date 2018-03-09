
//Telegram Token
const telegramToken = '539311926:AAEz8vS2HbNbSX5Ram0QvjOZ_5MGARmETso';
const telegramChatid = '558982347';

var telegramBot = require('node-telegram-bot-api');
var coinSQLManager = require('./routes/db/coinSQLManager.js');

var bot = new telegramBot(telegramToken, {polling: false});


// 1: 서버시작
// 2: 매수 메세지
// 3: 매도 메세지
// 4: 현재 시가출력
exports.sendMessage = function(form, price, currency, macd5){
    if (form == 1){
        var dt = new Date();
        bot.sendMessage(telegramChatid, '서버시작\n' + dt);
    }
    if (form == 2){
        var msg = '매수신호 발생 (marketFlow = 1)\n';
        msg = msg + 'currency : ' + currency + '\n';
        msg = msg + '5분간 평균가격 : ' + macd5 + '\n';
        msg = msg + '매수가격 : ' + price[currency].last;
        bot.sendMessage(telegramChatid, msg);
    }
    if (form == 3){
        var msg = '매도신호 발생 (marketFlow = 2)\n';
        msg = msg + 'currency : ' + currency + '\n';
        msg = msg + '매도가격 : ' + price[currency].last;
        bot.sendMessage(telegramChatid, msg);
    }
    if (form == 4){
        if(price){
            var msg = ' --- marketFlow 0 -> 1 --- \n';
            Object.keys(price).forEach(function(key){
                console.log(price[key]);
                if( key != 'result' && key != 'errorCode' && key != 'timestamp'){
                    msg = msg + price[key].currency + ':' + price[key].last + '\n';
                }
            });
            bot.sendMessage(telegramChatid, msg);
        }
    }
};