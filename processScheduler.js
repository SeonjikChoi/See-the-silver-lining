var pool = require('./routes/db/Pool.js');
var coinSQLManager = require('./routes/db/coinSQLManager.js');
var request = require('request');
var crypto = require('crypto');

exports.ticker = function(cb){
    request('https://api.coinone.co.kr/ticker?currency=all', function (error, response, body) {
        var jbody = JSON.parse(response.body);
        if(error){
            console.log('request 오류');
            return;
        }else if (jbody.result != "success"){

        }
        else{
            coinSQLManager.insertAndDeletePrice(jbody, function (err, rows){
                cb(err, jbody);
            });

        }
    });
}

exports.getAccountInfo = function(cb){

    var ACCESS_TOKEN = '3408dfa5-910f-43f7-8477-fcdd9b7391ec';
    var SECRET_KEY = '6645a3ef-c017-40e1-a7ca-1d246f17fc96';
    var url = 'https://api.coinone.co.kr/v2/account/balance/';
    var payload = {
      "access_token": ACCESS_TOKEN,
      "nonce": Date.now()
    };
    payload = new Buffer(JSON.stringify(payload)).toString('base64');
    var signature = crypto.createHmac("sha512", SECRET_KEY.toUpperCase()).update(payload).digest('hex');
    var headers = {
        'content-type':'application/json',
        'X-COINONE-PAYLOAD': payload,
        'X-COINONE-SIGNATURE': signature
    };
    var options = {
        url: url,
        headers: headers,
        body: payload
    };

    request.post(options, function(error, response, body) {
        var jbody = JSON.parse(body);
        if (error){
            cb(error, []);
        }else if(jbody.result != "success"){
           
        }else{
            //console.log(jbody);
            cb(error, jbody);
        }
    });
}

exports.marketFlow = function(cb){
    coinSQLManager.getMarketFlow(function(err, results){
        if (err){
            console.log(err);
            cb(err, 2, null, null);
        }else{
            //console.log(results);
            var currency_max = null;
            var percentage_max = null;
            var macd5_max = null;
            var count_positive = 0;
            var marketFlow = 2;
            for(x in results){
                var data = results[x];

                //과거데이터가 충분하지 않으면 거래하지않음.
                //테스트를 위해 주석처리
                 if (data.macd30count < 1800*0.95 || data.macd5count < 300*0.95){
                    cb(err, 2, null, null);
                    return;
                 }

                if(currency_max == null){
                    currency_max = data.currency;
                    percentage_max = data.percentage;
                    macd5_max = data.macd5;
                }else{
                    if(percentage_max < data.percentage){
                        currency_max = data.currency;
                        percentage_max = data.percentage;
                        macd5_max = data.macd5;
                    }
                }

                if( data.percentage > 0){
                    count_positive++;
                }
                //console.log(data.currency + ' : ' + data.percentage + '%');

            }
            //console.log(count_positive);
            if(count_positive < Math.ceil(results.length*0.7)){
                marketFlow = 2;
            }else if(count_positive >= Math.ceil(results.length*0.7) && count_positive < results.length){
                marketFlow = 1;
            }else{
                marketFlow = 0;
            }

            cb(err, marketFlow, currency_max, percentage_max, macd5_max);
        }
    });
}

exports.insertOrder = function(currency, price, qty, type, cb){
    coinSQLManager.insertOrder(currency, price, qty, type, function(err, result){
        if(err){
            console.log('insertOder 중 오류 발생');
            console.log(err);
            cb(err, []);
        }else{
            cb(err, result);
        }
    });
}
