var pool = require('./pool');
var StringBuffer = function() {
    this.buffer = new Array();
}

StringBuffer.prototype.append = function(obj) {
     this.buffer.push(obj);
}

StringBuffer.prototype.toString = function(){
     return this.buffer.join("");
}


exports.getPrice = function(currency, cb)
{
	// 커넥션을 빌린다
	pool.acquire(function(err,conn){
		if(err){
			cb( err, []);
		}else{
			var sql = "select * from prices where currency = ? order by date desc limit 1;";
			conn.query(sql, currency, function(error, results, fields){
				// 커넥션 반납
				pool.release(conn);
				// 쿼리 결과 반납
				cb (error, results);
			});
		}
	});
};

exports.getAllPrices = function(cb)
{
	// 커넥션을 빌린다
	pool.acquire(function(err,conn){
		if(err){
			cb( err, []);
		}else{
			var sql = "select * from prices a, (select max(date) date, a.currency from prices a group by a.currency) b where a.date = b.date and a.currency = b.currency;";
			conn.query(sql, [], function(error, results, fields){
				// 커넥션 반납
				pool.release(conn);
				// 쿼리 결과 반납
				cb (error, results);
			});
		}
	});
};

exports.insertAndDeletePrice = function(param, cb)
{
	// 커넥션을 빌린다
	pool.acquire(function(err,conn){
		if(err){
			cb( err, []);
		}else{
			var date = param['timestamp'];
			Object.keys(param).forEach(function(key) {
				if( key != 'result' && key != 'errorCode' && key != 'timestamp'){
					var sql = "insert into prices (currency, buy, sell, date) VALUES(?,?,?,?);";
					conn.query(sql, [key, param[key].last, param[key].last, date], function(error, results, fields){
						if (error) {
							console.log('Insert 중 오류 발생');
						}
					});
				}
			});

			// 커넥션 반납
			pool.release(conn);
			cb(err, []);
		}
	});

};

exports.DeletePrice = function(cb)
{
	// 커넥션을 빌린다
	pool.acquire(function(err,conn){
		if(err){
			cb( err, []);
		}else{			
			//24시간 이전 데이터는 삭제함
			var date = Math.floor(Date.now()/1000);
			console.log(date);
			console.log('deletePrice');
			 var sql_delete = "delete from prices where date < ?;";
			 conn.query(sql_delete, (date-86400), function(error, results, fields){
				if (error) {
					console.log('Delete 중 오류 발생');
				}
			});
			// 커넥션 반납
			pool.release(conn);
			cb(err);
		}
	});

};


exports.getMarketFlow = function(cb)
{
	// 커넥션을 빌린다
	pool.acquire(function(err,conn){
		if(err){
			cb( err, []);
		}else{
			var timeStamp = Math.floor(Date.now()/1000);
			var sql = 
`
select a.macd30, b.macd5, a.currency, (b.macd5 - a.macd30) as value, (b.macd5/a.macd30)-1 as percentage, macd30count, macd5count
from (select avg(a.buy) as macd30 , a.currency , count(a.buy) as macd30count
 from prices a
 where a.date <= ? and a.date > ?-1800
 group by a.currency) a, 
(select avg(a.buy) as macd5, a.currency, count(*) as macd5count
 from prices a
 where a.date <= ? and a.date > ?-300
 group by a.currency) b
where a.currency = b.currency`
			conn.query(sql, [timeStamp,timeStamp,timeStamp,timeStamp], function(error, results, fields){
				// 커넥션 반납
				pool.release(conn);
				// 쿼리 결과 반납
				cb (error, results);
			});
		}
	});
};





exports.insertOrder = function(currency, price, qty, type, cb)
{
	// 커넥션을 빌린다
	pool.acquire(function(err,conn){
		if(err){
			cb( err, []);
		}else{
			var date = Math.floor(Date.now()/1000);
			var sql = "insert into orders (currency, price, volume, type, date) VALUES(?,?,?,?,?);";
			conn.query(sql, [currency, Number(price), qty, type, date], function(error, results, fields){
				if (error) {
					pool.release(conn);
					cb(error, []);
				}else{
					pool.release(conn);
					cb(error, results);
				}
			});
		}
	});
};

exports.getLastOrder = function(cb){
	// 커넥션을 빌린다
	pool.acquire(function(err,conn){
		if(err){
			cb( err, []);
		}else{
			var sql = "select * from orders a where a.date = (select max(date) from orders) limit 1;";
			conn.query(sql, [], function(error, results, fields){
				// 커넥션 반납
				pool.release(conn);
				// 쿼리 결과 반납
				cb (error, results);
			});
		}
	});
}