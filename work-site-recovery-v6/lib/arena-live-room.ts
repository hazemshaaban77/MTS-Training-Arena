// Lightweight hibernating WebSocket fanout for the existing V6 authoritative D1 engine.
// Sockets receive invalidation events only, never participant identities or answers.
// No persistence: a missed event is recovered by client foreground/poll fallback.
export class ArenaLiveRoom {
 private state: DurableObjectState;
 constructor(state:DurableObjectState){this.state=state;}
 async fetch(request:Request):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname==='/ws'){
   if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('Upgrade required',{status:426});
   if(this.state.getWebSockets().length>=120)return new Response('Room capacity reached',{status:429});
   const pair=new WebSocketPair();
   const client=pair[0],server=pair[1];
   this.state.acceptWebSocket(server);
   return new Response(null,{status:101,webSocket:client});
  }
  if(url.pathname==='/health'&&request.method==='GET'){
   return Response.json({ready:true,transport:'websocket'});
  }
  if(url.pathname==='/notify'&&request.method==='POST'){
   let payload:{kind?:string}={};
   try{payload=await request.json();}catch{return new Response('Bad request',{status:400});}
   if(!['answer','joined','control','interaction','survey'].includes(payload.kind||''))return new Response('Bad event',{status:400});
   const message=JSON.stringify({type:'changed',kind:payload.kind});
   let recipients=0;
   for(const ws of this.state.getWebSockets()){
    try{ws.send(message);recipients++;}catch{try{ws.close(1011,'Reconnecting');}catch{}}
   }
   return Response.json({ok:true,recipients});
  }
  return new Response('Not found',{status:404});
 }
 webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){
  // Incoming messages are never used to update scores or the room.
  // State changes only come from authenticated D1 API requests.
  if(typeof message==='string'&&message==='ping')try{ws.send('pong');}catch{}
 }
 webSocketClose(ws:WebSocket,code:number,reason:string,wasClean:boolean){
  try{ws.close(code||1000,reason||'Goodbye');}catch{}
 }
 webSocketError(ws:WebSocket){try{ws.close(1011,'Reconnect');}catch{}}
}
