import http from 'node:http';
http.createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;
 if(req.url==='/survey'){res.end('<h1>Local test survey</h1><p>測試問卷</p>');return;}
 const body=JSON.parse(raw||'{}');
 if(body.stream){res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{delta:{content:'我只看到當時的紀錄，其他細節不清楚。'}}]})+'\n\ndata: [DONE]\n\n');}
 else {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'你引用了觀察紀錄，但仍需要說明觀察如何支持結論，以及紀錄無法證明的部分。'}}]}));}
}).listen(18080,'127.0.0.1');
