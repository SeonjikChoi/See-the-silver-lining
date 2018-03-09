
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var schedule = require('node-schedule');
var request = require('request');

// public module
var processScheduler = require('./processScheduler');
var telegram = require('./telegram');
var coinSQLManager = require('./routes/db/coinSQLManager.js');

// route module
var main = require('./routes/main');
var common = require('./routes/common');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// 아래에서 ticker 불러온 Data 카피
var price = {};

//테스트용
var account = {
ltc: { avail: '0.00000000', balance: '0.00000000' },
bch: { avail: '0.00000000', balance: '0.00000000' },
qtum: { avail: '0.00000000', balance: '0.00000000' },
krw: { avail: '1000000', balance: '0' },
iota: { avail: '0.00000000', balance: '0.00000000' },
errorCode: '0',
etc: { avail: '0.00000000', balance: '0.00000000' },
btg: { avail: '0.00000000', balance: '0.00000000' },
result: 'success',
btc: { avail: '0.00000000', balance: '0.00000000' },
normalWallets: [],
eth: { avail: '0.00000000', balance: '0.00000000' },
xrp: { avail: '0.00000000', balance: '0.00000000' }
};

// 0 = 모두 상향
// 1 = 7개 이상
// 2 = 6개 이하
var marketFlowValue = 2;

telegram.sendMessage(1);
telegram.sendMessage(4);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 세션 처리
app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: 'somevalueforusingsession',
  resave: false,
  saveUninitialized: true
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// 거래소 ticker 매초마다 호출
var j = schedule.scheduleJob('* * * * * *', function(processDate){
  processScheduler.ticker(function(err, result){
    if(err){

    }else{
      price = result;
      console.log(price);
      telegram.sendMessage(4, price);
    }
  });
  // 테스트용으로 임시 주석
  /*processScheduler.getAccountInfo(function(err, result){
    if(!err)
    {
      account = result;
    }
  });*/
});


// 24시간 이전 가격정보 삭제
var l = schedule.scheduleJob('0 * * * *', function(processDate){
  coinSQLManager.DeletePrice(function(err){
    if(err){
      console.log(err);
    }
  });
});



// MarketFlow
var k = schedule.scheduleJob('*/10 * * * * *', function(processDate){
  processScheduler.marketFlow(function(err, marketflow, currency, percentage, macd5){
    if (currency == null) return;
    if(marketFlowValue != 0 && marketflow == 0)
    {
      if(account.krw.avail != '0'){
        telegram.sendMessage(2, price, currency, macd5);
        processScheduler.insertOrder(currency, price[currency].last, 100.5, 'bid', function(err, results){
          account.krw.avail = '0';
          account[currency].avail = '1';
        });
      }
    }
    if(marketFlowValue != 2 && marketflow == 2)
    {
      if(account.krw.avail == '0'){
        Object.keys(account).forEach(function(key){
          if (account[key].avail == '1'){
            telegram.sendMessage(3 , price, key, macd5);
            processScheduler.insertOrder(key, price[key].last, 100.5, 'ask', function(err, results){
              account[key].avail = '0';
              account.krw.avail = '1000000';
            });
          }
        });
      }
    }
    if(marketFlowValue == 0 && marketflow == 1){
      telegram.sendMessage(4, price);
    }
    marketFlowValue = marketflow;
  });
});

app.use('/users', users);
// 요청 필터 등록하여 세션 처리, 세션이 존재할때만 하위 URL 통과
app.use(function(req, res, next) {
  console.log(req.method, req.url, req.ip);
  if(common.isEmpty(req.session.uid)){
    console.log('세션없음. 로그인화면으로');
    res.redirect('./users/login');
  }else{
    next();
  }
});

app.use('/', index);
app.use('/main', main);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
