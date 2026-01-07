export default function handler(req,res){
  const room=req.query.room||"general";
  res.json({messages:[]}); // WebSocket now handles real-time
}
