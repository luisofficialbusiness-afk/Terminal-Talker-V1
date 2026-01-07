import { wss, rooms } from "./rooms";

export default function handler(req, res){
  if(req.method==="POST"){
    const { room, user, message } = req.body;
    if(!rooms[room]) rooms[room]=[];
    rooms[room].push({user,message,time:Date.now()});

    // Broadcast to all connected sockets
    wss.clients.forEach(client=>{
      if(client.readyState===1) client.send(JSON.stringify({room, content:`[${user}] > ${message}`}));
    });

    res.status(200).json({ok:true});
  } else res.status(405).json({error:"Method not allowed"});
}
