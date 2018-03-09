//디비 풀링
var Pool = require('generic-pool').Pool;
var mysql = require('mysql');

// 풀링 생성
var pool = new Pool({
	name:"mysql conn pool",
	create:function(cb){
		var config = {
				host     : 'localhost',
				user     : 'root',
				password : '1234',
				database : 'nodedb'
		};
		var connection = mysql.createConnection(config);
		connection.connect(function(err){
			cb(err, connection);
		});
	},
	destroy:function(conn){
		conn.end((err)=>{
			console.log('dbPool - destory 오류');
			console.log(err);
		});
	},
	max:20,
	min:3,
	log:false,
	idleTimeoutMillis:1000*600
});

// 종료시 연결 해제 처리 (이벤트 등록)
process.on('exit', (code) => {
	//db 연결을 모두 끊어라
	pool.drain(()=>{
		pool.destroyAllNow();
	});
});

// 예외시 처리 (app.js 가 좀더 맞음)
process.on('uncaughtException', (err) => {
	console.log("오류 ",err);  
});

// 객체모듈화
module.exports = pool;
