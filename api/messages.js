export default function handler(req,res){
  const room=req.query.room||"general";
  res.json({messages:[]}); // real-time now uses WebSocket
}
